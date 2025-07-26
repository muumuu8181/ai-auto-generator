#!/usr/bin/env node

/**
 * Inspector AI Evidence Tracker with Mermaid Visualization
 * 各セッションの確認エビデンスを記録・追跡・視覚化
 */

const fs = require('fs');
const path = require('path');

class InspectorEvidenceTracker {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.evidenceDir = path.join(this.baseDir, 'logs', 'inspector-evidence');
        this.historyFile = path.join(this.evidenceDir, 'inspection-history.md');
        this.currentSessionFile = path.join(this.evidenceDir, 'current-session.json');
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.evidenceDir)) {
            fs.mkdirSync(this.evidenceDir, { recursive: true });
        }
    }

    /**
     * 新しいInspectorセッション開始
     */
    startInspectionSession() {
        const sessionId = `inspector-session-${Date.now()}`;
        const timestamp = new Date().toISOString();
        
        const session = {
            sessionId,
            timestamp,
            startTime: timestamp,
            rulesRead: [],
            filesChecked: [],
            changesDetected: [],
            validationsPerformed: 0,
            issuesFound: [],
            actionsTaken: [],
            status: 'active'
        };

        fs.writeFileSync(this.currentSessionFile, JSON.stringify(session, null, 2));
        console.log(`🔍 Inspector Evidence Tracker: セッション開始 ${sessionId}`);
        
        return session;
    }

    /**
     * ルール読み込みエビデンス記録
     */
    recordRuleRead(filePath, checksum = null) {
        const session = this.getCurrentSession();
        const timestamp = new Date().toISOString();
        
        const ruleEvidence = {
            file: filePath,
            timestamp,
            checksum,
            status: 'confirmed'
        };

        session.rulesRead.push(ruleEvidence);
        this.updateCurrentSession(session);
        
        console.log(`📚 ルール読み込み記録: ${path.basename(filePath)}`);
        return ruleEvidence;
    }

    /**
     * ファイル検査エビデンス記録
     */
    recordFileCheck(filePath, result, details = {}) {
        const session = this.getCurrentSession();
        const timestamp = new Date().toISOString();
        
        const checkEvidence = {
            file: filePath,
            result, // 'pass', 'fail', 'warning'
            timestamp,
            details
        };

        session.filesChecked.push(checkEvidence);
        session.validationsPerformed++;
        
        if (result === 'fail') {
            session.issuesFound.push({
                file: filePath,
                issue: details.issue || 'Unknown issue',
                severity: details.severity || 'medium',
                timestamp
            });
        }

        this.updateCurrentSession(session);
        console.log(`🔍 ファイル検査: ${path.basename(filePath)} - ${result}`);
        return checkEvidence;
    }

    /**
     * 変更検出エビデンス記録
     */
    recordChangeDetection(change, impact = 'medium') {
        const session = this.getCurrentSession();
        const timestamp = new Date().toISOString();
        
        const changeEvidence = {
            change,
            impact,
            timestamp,
            processed: false
        };

        session.changesDetected.push(changeEvidence);
        this.updateCurrentSession(session);
        
        console.log(`🔄 変更検出: ${change}`);
        return changeEvidence;
    }

    /**
     * アクション実行エビデンス記録
     */
    recordAction(action, result, details = {}) {
        const session = this.getCurrentSession();
        const timestamp = new Date().toISOString();
        
        const actionEvidence = {
            action,
            result,
            timestamp,
            details
        };

        session.actionsTaken.push(actionEvidence);
        this.updateCurrentSession(session);
        
        console.log(`⚡ アクション実行: ${action} - ${result}`);
        return actionEvidence;
    }

    /**
     * セッション終了・履歴保存
     */
    completeInspectionSession(summary = {}) {
        const session = this.getCurrentSession();
        session.endTime = new Date().toISOString();
        session.status = 'completed';
        session.summary = summary;
        
        // 履歴に追加
        this.appendToHistory(session);
        
        // Mermaid図表生成・保存
        this.generateMermaidVisualization(session);
        
        // 現在セッションクリア
        if (fs.existsSync(this.currentSessionFile)) {
            fs.unlinkSync(this.currentSessionFile);
        }
        
        console.log(`✅ Inspector Evidence: セッション完了 ${session.sessionId}`);
        return session;
    }

    /**
     * 現在のセッション取得
     */
    getCurrentSession() {
        if (fs.existsSync(this.currentSessionFile)) {
            return JSON.parse(fs.readFileSync(this.currentSessionFile, 'utf8'));
        } else {
            return this.startInspectionSession();
        }
    }

    /**
     * 現在のセッション更新
     */
    updateCurrentSession(session) {
        fs.writeFileSync(this.currentSessionFile, JSON.stringify(session, null, 2));
    }

    /**
     * 履歴に追加
     */
    appendToHistory(session) {
        let historyContent = '';
        
        if (fs.existsSync(this.historyFile)) {
            historyContent = fs.readFileSync(this.historyFile, 'utf8');
        } else {
            historyContent = `# Inspector AI Evidence History\n\n`;
        }

        const sessionEntry = this.generateMarkdownEntry(session);
        historyContent += sessionEntry + '\n';
        
        fs.writeFileSync(this.historyFile, historyContent);
    }

    /**
     * Markdownエントリ生成
     */
    generateMarkdownEntry(session) {
        const startTime = new Date(session.startTime).toLocaleString('ja-JP');
        const endTime = new Date(session.endTime).toLocaleString('ja-JP');
        const duration = Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000);

        return `## 📋 ${session.sessionId}

**期間**: ${startTime} ～ ${endTime} (${duration}秒)
**ステータス**: ${session.status}

### 🔍 実行サマリー
- **ルール読み込み**: ${session.rulesRead.length}件
- **ファイル検査**: ${session.filesChecked.length}件
- **検証実行**: ${session.validationsPerformed}回
- **問題発見**: ${session.issuesFound.length}件
- **変更検出**: ${session.changesDetected.length}件
- **アクション実行**: ${session.actionsTaken.length}件

### 📊 詳細結果
${this.generateDetailedResults(session)}

---`;
    }

    /**
     * 詳細結果生成
     */
    generateDetailedResults(session) {
        let results = '';
        
        if (session.rulesRead.length > 0) {
            results += `\n#### 📚 読み込みルール\n`;
            session.rulesRead.forEach(rule => {
                results += `- ${path.basename(rule.file)} (${new Date(rule.timestamp).toLocaleTimeString('ja-JP')})\n`;
            });
        }

        if (session.issuesFound.length > 0) {
            results += `\n#### ⚠️ 発見された問題\n`;
            session.issuesFound.forEach(issue => {
                results += `- **${issue.severity}**: ${issue.issue} (${path.basename(issue.file)})\n`;
            });
        }

        if (session.changesDetected.length > 0) {
            results += `\n#### 🔄 検出された変更\n`;
            session.changesDetected.forEach(change => {
                results += `- **${change.impact}**: ${change.change}\n`;
            });
        }

        return results;
    }

    /**
     * Mermaid視覚化生成
     */
    generateMermaidVisualization(session) {
        const mermaidFile = path.join(this.evidenceDir, `mermaid-${session.sessionId}.md`);
        const timestamp = new Date(session.startTime).toLocaleString('ja-JP');
        
        const mermaidContent = `# Inspector AI Session Visualization

## ${session.sessionId}
**実行時刻**: ${timestamp}

\`\`\`mermaid
graph TD
    A[🚀 Inspector Session Start] --> B{📚 Rules Reading}
    B --> C[✅ ${session.rulesRead.length} Rules Read]
    C --> D{🔍 File Inspection}
    D --> E[📋 ${session.filesChecked.length} Files Checked]
    E --> F{⚠️ Issues Detection}
    
    ${session.issuesFound.length > 0 ? `F --> G[🚨 ${session.issuesFound.length} Issues Found]` : 'F --> H[✅ No Issues]'}
    ${session.issuesFound.length > 0 ? 'G --> I{⚡ Actions}' : 'H --> I{⚡ Actions}'}
    
    I --> J[🎯 ${session.actionsTaken.length} Actions Taken]
    J --> K[📊 Session Complete]
    
    style A fill:#e1f5fe
    style K fill:#e8f5e8
    ${session.issuesFound.length > 0 ? 'style G fill:#ffebee' : 'style H fill:#e8f5e8'}
\`\`\`

## 📊 Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Rules Read | ${session.rulesRead.length} | ✅ |
| Files Checked | ${session.filesChecked.length} | ✅ |
| Validations | ${session.validationsPerformed} | ✅ |
| Issues Found | ${session.issuesFound.length} | ${session.issuesFound.length > 0 ? '⚠️' : '✅'} |
| Changes Detected | ${session.changesDetected.length} | ${session.changesDetected.length > 0 ? '📝' : '✅'} |
| Actions Taken | ${session.actionsTaken.length} | ✅ |

${session.issuesFound.length > 0 ? this.generateIssuesDiagram(session.issuesFound) : ''}
`;

        fs.writeFileSync(mermaidFile, mermaidContent);
        console.log(`📊 Mermaid視覚化生成: ${path.basename(mermaidFile)}`);
    }

    /**
     * 問題詳細Mermaid図生成
     */
    generateIssuesDiagram(issues) {
        if (issues.length === 0) return '';

        let diagram = `\n## 🚨 Issues Detail Diagram\n\n\`\`\`mermaid\ngraph LR\n`;
        
        issues.forEach((issue, index) => {
            const nodeId = `I${index + 1}`;
            const fileName = path.basename(issue.file);
            const severity = issue.severity;
            
            diagram += `    ${nodeId}[${fileName}<br/>${issue.issue}]\n`;
            
            if (severity === 'high') {
                diagram += `    style ${nodeId} fill:#ffcdd2\n`;
            } else if (severity === 'medium') {
                diagram += `    style ${nodeId} fill:#fff3e0\n`;
            } else {
                diagram += `    style ${nodeId} fill:#f3e5f5\n`;
            }
        });
        
        diagram += `\`\`\`\n`;
        return diagram;
    }

    /**
     * 最新のMermaid統合履歴生成
     */
    generateConsolidatedMermaidHistory() {
        const historyFile = path.join(this.evidenceDir, 'inspector-mermaid-history.md');
        const sessions = this.getAllSessions();
        
        let content = `# 🔍 Inspector AI Complete Visual History\n\n`;
        content += `**最終更新**: ${new Date().toLocaleString('ja-JP')}\n`;
        content += `**総セッション数**: ${sessions.length}\n\n`;

        // 全体的な傾向Mermaid
        content += this.generateTrendMermaid(sessions);
        
        // 個別セッションへのリンク
        content += `## 📋 Individual Session Reports\n\n`;
        sessions.reverse().forEach(session => {
            const sessionFile = `mermaid-${session.sessionId}.md`;
            content += `- [${session.sessionId}](${sessionFile}) - ${new Date(session.startTime).toLocaleString('ja-JP')}\n`;
        });

        fs.writeFileSync(historyFile, content);
        console.log(`📈 統合Mermaid履歴生成完了`);
        return historyFile;
    }

    /**
     * 傾向分析Mermaid生成
     */
    generateTrendMermaid(sessions) {
        const totalSessions = sessions.length;
        const totalIssues = sessions.reduce((sum, s) => sum + s.issuesFound.length, 0);
        const totalFiles = sessions.reduce((sum, s) => sum + s.filesChecked.length, 0);
        const avgIssues = totalSessions > 0 ? (totalIssues / totalSessions).toFixed(1) : 0;

        return `## 📊 Overall Trend Analysis

\`\`\`mermaid
graph TD
    A[📊 Inspector AI Analytics] --> B[📈 ${totalSessions} Total Sessions]
    B --> C[📋 ${totalFiles} Files Inspected]
    C --> D[⚠️ ${totalIssues} Issues Found]
    D --> E[📊 ${avgIssues} Avg Issues/Session]
    
    ${totalIssues > 0 ? 'E --> F[🎯 Improvement Needed]' : 'E --> G[✨ Excellent Quality]'}
    
    style A fill:#e3f2fd
    style E fill:#fff3e0
    ${totalIssues > 0 ? 'style F fill:#ffcdd2' : 'style G fill:#e8f5e8'}
\`\`\`

`;
    }

    /**
     * 全セッション履歴取得
     */
    getAllSessions() {
        const sessions = [];
        const evidenceFiles = fs.readdirSync(this.evidenceDir);
        
        evidenceFiles.forEach(file => {
            if (file.startsWith('mermaid-inspector-session-') && file.endsWith('.md')) {
                const sessionId = file.replace('mermaid-', '').replace('.md', '');
                const timestamp = sessionId.split('-').pop();
                sessions.push({
                    sessionId,
                    startTime: new Date(parseInt(timestamp)),
                    issuesFound: [], // 詳細は個別ファイルから読み込み可能
                    filesChecked: []
                });
            }
        });
        
        return sessions.sort((a, b) => a.startTime - b.startTime);
    }
}

// CLI実行部分
if (require.main === module) {
    const tracker = new InspectorEvidenceTracker();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            tracker.startInspectionSession();
            break;
        case 'rule':
            const rulePath = process.argv[3];
            if (rulePath) {
                tracker.recordRuleRead(rulePath);
            } else {
                console.error('❌ ルールファイルパスが必要です');
            }
            break;
        case 'check':
            const filePath = process.argv[3];
            const result = process.argv[4] || 'pass';
            if (filePath) {
                tracker.recordFileCheck(filePath, result);
            } else {
                console.error('❌ ファイルパスが必要です');
            }
            break;
        case 'complete':
            tracker.completeInspectionSession();
            tracker.generateConsolidatedMermaidHistory();
            break;
        case 'history':
            tracker.generateConsolidatedMermaidHistory();
            break;
        default:
            console.log(`
🔍 Inspector Evidence Tracker

使用方法:
  node inspector-evidence-tracker.cjs start              # セッション開始
  node inspector-evidence-tracker.cjs rule <file>        # ルール読み込み記録
  node inspector-evidence-tracker.cjs check <file> <result>  # ファイル検査記録
  node inspector-evidence-tracker.cjs complete           # セッション完了
  node inspector-evidence-tracker.cjs history            # 統合履歴生成
            `);
    }
}

module.exports = InspectorEvidenceTracker;