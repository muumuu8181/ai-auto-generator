#!/usr/bin/env node

/**
 * Inspector AI Rule Synchronization System
 * 最新ルール自動読み込み・差分検出・適用確認
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class InspectorRuleSync {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.rulesDir = this.baseDir;
        this.syncDataFile = path.join(this.baseDir, 'logs', 'inspector-rule-sync.json');
        
        // 監視対象ルールファイル
        this.ruleFiles = [
            'MANAGEMENT_AI_RULES[超重要L10].md',
            'AI_MUTUAL_MONITORING_SYSTEM[超重要L10].md',
            'INSPECTOR_AI_MANUAL[超重要L10].md',
            'MANAGEMENT_AI_TEAM_STRUCTURE[超重要L10].md',
            'REFLECTION_MISTAKE_SAMPLES[超重要L10].md'
        ];
        
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.syncDataFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * ファイルハッシュ計算
     */
    calculateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            console.error(`❌ ハッシュ計算エラー: ${filePath}`, error.message);
            return null;
        }
    }

    /**
     * 前回の同期データ読み込み
     */
    loadPreviousSyncData() {
        try {
            if (fs.existsSync(this.syncDataFile)) {
                return JSON.parse(fs.readFileSync(this.syncDataFile, 'utf8'));
            }
        } catch (error) {
            console.error('❌ 同期データ読み込みエラー:', error.message);
        }
        return { files: {}, lastSync: null };
    }

    /**
     * 現在の同期データ保存
     */
    saveSyncData(syncData) {
        try {
            fs.writeFileSync(this.syncDataFile, JSON.stringify(syncData, null, 2));
        } catch (error) {
            console.error('❌ 同期データ保存エラー:', error.message);
        }
    }

    /**
     * 全ルールファイルの現在状態スキャン
     */
    scanCurrentRuleState() {
        const currentState = {
            files: {},
            scanTime: new Date().toISOString(),
            foundFiles: [],
            missingFiles: []
        };

        this.ruleFiles.forEach(fileName => {
            const filePath = path.join(this.rulesDir, fileName);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const hash = this.calculateFileHash(filePath);
                
                currentState.files[fileName] = {
                    path: filePath,
                    hash,
                    size: stats.size,
                    lastModified: stats.mtime.toISOString(),
                    status: 'found'
                };
                currentState.foundFiles.push(fileName);
            } else {
                currentState.files[fileName] = {
                    path: filePath,
                    status: 'missing'
                };
                currentState.missingFiles.push(fileName);
            }
        });

        return currentState;
    }

    /**
     * 変更検出・差分分析
     */
    detectChanges(previousData, currentState) {
        const changes = {
            new: [],
            modified: [],
            deleted: [],
            unchanged: [],
            summary: {
                totalChanges: 0,
                criticalChanges: 0,
                hasNewRules: false
            }
        };

        Object.keys(currentState.files).forEach(fileName => {
            const current = currentState.files[fileName];
            const previous = previousData.files[fileName];

            if (!previous) {
                // 新規ファイル
                changes.new.push({
                    file: fileName,
                    type: 'new',
                    details: 'New rule file detected'
                });
                changes.summary.hasNewRules = true;
            } else if (current.status === 'missing' && previous.status === 'found') {
                // 削除されたファイル
                changes.deleted.push({
                    file: fileName,
                    type: 'deleted',
                    details: 'Rule file was deleted'
                });
                changes.summary.criticalChanges++;
            } else if (current.status === 'found' && previous.status === 'found') {
                if (current.hash !== previous.hash) {
                    // 変更されたファイル
                    changes.modified.push({
                        file: fileName,
                        type: 'modified',
                        details: 'Rule file content changed',
                        previousHash: previous.hash,
                        currentHash: current.hash,
                        sizeChange: current.size - previous.size
                    });
                    
                    // 重要度L10ファイルの変更は重要
                    if (fileName.includes('[超重要L10]')) {
                        changes.summary.criticalChanges++;
                    }
                } else {
                    changes.unchanged.push(fileName);
                }
            }
        });

        changes.summary.totalChanges = changes.new.length + changes.modified.length + changes.deleted.length;
        
        return changes;
    }

    /**
     * メインの同期実行
     */
    async performRuleSync() {
        console.log('🔄 Inspector Rule Sync: 開始');
        
        const startTime = Date.now();
        const previousData = this.loadPreviousSyncData();
        const currentState = this.scanCurrentRuleState();
        const changes = this.detectChanges(previousData, currentState);
        
        // Inspector Evidence Trackerに記録
        const InspectorEvidenceTracker = require('./inspector-evidence-tracker.cjs');
        const evidenceTracker = new InspectorEvidenceTracker();
        
        // 読み込みエビデンス記録
        currentState.foundFiles.forEach(fileName => {
            const fileData = currentState.files[fileName];
            evidenceTracker.recordRuleRead(fileData.path, fileData.hash);
        });

        // 変更検出エビデンス記録
        if (changes.summary.totalChanges > 0) {
            changes.new.forEach(change => {
                evidenceTracker.recordChangeDetection(`New rule: ${change.file}`, 'high');
            });
            
            changes.modified.forEach(change => {
                const impact = change.file.includes('[超重要L10]') ? 'critical' : 'medium';
                evidenceTracker.recordChangeDetection(
                    `Modified rule: ${change.file} (${change.sizeChange > 0 ? '+' : ''}${change.sizeChange} bytes)`, 
                    impact
                );
            });
            
            changes.deleted.forEach(change => {
                evidenceTracker.recordChangeDetection(`Deleted rule: ${change.file}`, 'critical');
            });
        }

        // Mermaid視覚化付きレポート生成
        const report = this.generateSyncReport(currentState, changes, startTime);
        const mermaidReport = this.generateMermaidSyncReport(currentState, changes);
        
        // 同期データ更新
        const syncData = {
            files: currentState.files,
            lastSync: currentState.scanTime,
            lastChanges: changes,
            syncHistory: previousData.syncHistory || []
        };
        
        // 履歴に追加（最新10件まで保持）
        syncData.syncHistory.unshift({
            timestamp: currentState.scanTime,
            changesCount: changes.summary.totalChanges,
            criticalChanges: changes.summary.criticalChanges
        });
        syncData.syncHistory = syncData.syncHistory.slice(0, 10);
        
        this.saveSyncData(syncData);
        
        // レポート保存
        const reportFile = path.join(this.baseDir, 'logs', `inspector-rule-sync-${Date.now()}.md`);
        fs.writeFileSync(reportFile, report);
        
        const mermaidFile = path.join(this.baseDir, 'logs', `inspector-rule-sync-mermaid-${Date.now()}.md`);
        fs.writeFileSync(mermaidFile, mermaidReport);
        
        console.log(`✅ Inspector Rule Sync: 完了 (${Date.now() - startTime}ms)`);
        console.log(`📊 変更検出: ${changes.summary.totalChanges}件 (重要: ${changes.summary.criticalChanges}件)`);
        console.log(`📄 レポート: ${path.basename(reportFile)}`);
        console.log(`📊 Mermaid: ${path.basename(mermaidFile)}`);
        
        return {
            success: true,
            changes,
            currentState,
            reportFile,
            mermaidFile,
            duration: Date.now() - startTime
        };
    }

    /**
     * テキストレポート生成
     */
    generateSyncReport(currentState, changes, startTime) {
        const timestamp = new Date().toLocaleString('ja-JP');
        const duration = Date.now() - startTime;
        
        let report = `# 🔄 Inspector AI Rule Sync Report

**実行時刻**: ${timestamp}
**処理時間**: ${duration}ms
**スキャン対象**: ${this.ruleFiles.length}ファイル

## 📊 同期結果サマリー

| 項目 | 件数 | ステータス |
|------|------|------------|
| 発見ファイル | ${currentState.foundFiles.length} | ✅ |
| 欠損ファイル | ${currentState.missingFiles.length} | ${currentState.missingFiles.length > 0 ? '⚠️' : '✅'} |
| 総変更 | ${changes.summary.totalChanges} | ${changes.summary.totalChanges > 0 ? '📝' : '✅'} |
| 重要変更 | ${changes.summary.criticalChanges} | ${changes.summary.criticalChanges > 0 ? '🚨' : '✅'} |

`;

        if (changes.summary.totalChanges > 0) {
            report += `## 🔍 変更詳細

`;
            if (changes.new.length > 0) {
                report += `### ➕ 新規ファイル (${changes.new.length}件)\n`;
                changes.new.forEach(change => {
                    report += `- **${change.file}**: ${change.details}\n`;
                });
                report += '\n';
            }

            if (changes.modified.length > 0) {
                report += `### 📝 変更ファイル (${changes.modified.length}件)\n`;
                changes.modified.forEach(change => {
                    const sizeChange = change.sizeChange > 0 ? `+${change.sizeChange}` : change.sizeChange;
                    report += `- **${change.file}**: ${change.details} (${sizeChange} bytes)\n`;
                });
                report += '\n';
            }

            if (changes.deleted.length > 0) {
                report += `### ❌ 削除ファイル (${changes.deleted.length}件)\n`;
                changes.deleted.forEach(change => {
                    report += `- **${change.file}**: ${change.details}\n`;
                });
                report += '\n';
            }
        } else {
            report += `## ✅ 変更なし

全てのルールファイルに変更はありませんでした。

`;
        }

        if (currentState.missingFiles.length > 0) {
            report += `## ⚠️ 欠損ファイル

以下のルールファイルが見つかりませんでした：

`;
            currentState.missingFiles.forEach(file => {
                report += `- ${file}\n`;
            });
            report += '\n';
        }

        report += `## 📋 全ファイル状態

`;
        Object.keys(currentState.files).forEach(fileName => {
            const file = currentState.files[fileName];
            if (file.status === 'found') {
                report += `- ✅ **${fileName}** (${file.size} bytes, ${file.hash.substring(0, 8)}...)\n`;
            } else {
                report += `- ❌ **${fileName}** (missing)\n`;
            }
        });

        return report;
    }

    /**
     * Mermaid視覚化レポート生成
     */
    generateMermaidSyncReport(currentState, changes) {
        const timestamp = new Date().toLocaleString('ja-JP');
        
        return `# 🔄 Inspector AI Rule Sync Visualization

**実行時刻**: ${timestamp}

## 📊 Sync Process Flow

\`\`\`mermaid
graph TD
    A[🚀 Rule Sync Start] --> B[📁 Scan ${this.ruleFiles.length} Rule Files]
    B --> C{📋 Files Found?}
    C -->|${currentState.foundFiles.length} Found| D[✅ Files Located]
    C -->|${currentState.missingFiles.length} Missing| E[⚠️ Missing Files]
    
    D --> F{🔍 Change Detection}
    E --> F
    
    F -->|${changes.summary.totalChanges} Changes| G[📝 Changes Detected]
    F -->|No Changes| H[✅ No Changes]
    
    G --> I{🚨 Critical Changes?}
    I -->|${changes.summary.criticalChanges} Critical| J[🚨 Critical Update]
    I -->|Regular Changes| K[📝 Regular Update]
    
    H --> L[📊 Sync Complete]
    J --> L
    K --> L
    
    style A fill:#e3f2fd
    style L fill:#e8f5e8
    ${changes.summary.criticalChanges > 0 ? 'style J fill:#ffcdd2' : ''}
    ${currentState.missingFiles.length > 0 ? 'style E fill:#fff3e0' : ''}
\`\`\`

## 📈 File Status Overview

\`\`\`mermaid
pie title Rule Files Status
    "Found (${currentState.foundFiles.length})" : ${currentState.foundFiles.length}
    ${currentState.missingFiles.length > 0 ? `"Missing (${currentState.missingFiles.length})" : ${currentState.missingFiles.length}` : ''}
\`\`\`

${changes.summary.totalChanges > 0 ? this.generateChangesMermaid(changes) : ''}

## 📋 Detailed File Status

| File | Status | Size | Hash | Last Modified |
|------|--------|------|------|---------------|
${Object.keys(currentState.files).map(fileName => {
    const file = currentState.files[fileName];
    if (file.status === 'found') {
        return `| ${fileName} | ✅ Found | ${file.size}B | \`${file.hash.substring(0, 8)}...\` | ${new Date(file.lastModified).toLocaleString('ja-JP')} |`;
    } else {
        return `| ${fileName} | ❌ Missing | - | - | - |`;
    }
}).join('\n')}
`;
    }

    /**
     * 変更詳細Mermaid生成
     */
    generateChangesMermaid(changes) {
        if (changes.summary.totalChanges === 0) return '';

        return `
## 🔄 Changes Detail

\`\`\`mermaid
graph LR
    subgraph "Change Types"
        A[📝 Modified: ${changes.modified.length}]
        B[➕ New: ${changes.new.length}]
        C[❌ Deleted: ${changes.deleted.length}]
    end
    
    subgraph "Impact Level"
        D[🚨 Critical: ${changes.summary.criticalChanges}]
        E[📝 Regular: ${changes.summary.totalChanges - changes.summary.criticalChanges}]
    end
    
    A --> D
    A --> E
    B --> D
    C --> D
    
    style D fill:#ffcdd2
    style E fill:#fff3e0
\`\`\`
`;
    }
}

// CLI実行部分
if (require.main === module) {
    const ruleSync = new InspectorRuleSync();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'sync':
            ruleSync.performRuleSync().then(result => {
                if (result.success) {
                    process.exit(0);
                } else {
                    process.exit(1);
                }
            });
            break;
        case 'status':
            const currentState = ruleSync.scanCurrentRuleState();
            console.log(`📊 Rule Files Status:`);
            console.log(`  Found: ${currentState.foundFiles.length}`);
            console.log(`  Missing: ${currentState.missingFiles.length}`);
            break;
        default:
            console.log(`
🔄 Inspector Rule Sync

使用方法:
  node inspector-rule-sync.cjs sync      # 完全同期実行
  node inspector-rule-sync.cjs status    # 現在状態確認
            `);
    }
}

module.exports = InspectorRuleSync;