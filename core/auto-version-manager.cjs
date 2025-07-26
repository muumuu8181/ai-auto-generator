#!/usr/bin/env node

/**
 * 自動バージョン管理システム v1.0
 * フィードバックループ成功時の自動バージョンアップ・Git管理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoVersionManager {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.versionFile = path.join(__dirname, '../VERSION.md');
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger(sessionId);
            } catch (error) {
                console.warn('⚠️ Unified logging not available, falling back to standalone mode');
                this.useUnifiedLogging = false;
            }
        }
        
        this.log('version_manager_start', 'Auto version manager initialized', { sessionId });
    }
    
    /**
     * 現在のバージョン取得
     */
    getCurrentVersion() {
        try {
            if (!fs.existsSync(this.versionFile)) {
                throw new Error('VERSION.md not found');
            }
            
            const content = fs.readFileSync(this.versionFile, 'utf8');
            const versionMatch = content.match(/## 現在のバージョン: (v[\d.]+)/);
            
            if (!versionMatch) {
                throw new Error('Version pattern not found in VERSION.md');
            }
            
            return versionMatch[1];
            
        } catch (error) {
            this.log('version_read_error', 'Failed to read current version', { error: error.message });
            throw error;
        }
    }
    
    /**
     * 次のバージョン計算
     */
    calculateNextVersion(currentVersion, incrementType = 'minor') {
        try {
            // v0.10 -> 0.10
            const versionNumber = currentVersion.replace('v', '');
            const parts = versionNumber.split('.');
            
            if (parts.length !== 2) {
                throw new Error(`Invalid version format: ${currentVersion}`);
            }
            
            let major = parseInt(parts[0]);
            let minor = parseInt(parts[1]);
            
            switch (incrementType) {
                case 'major':
                    major++;
                    minor = 0;
                    break;
                case 'minor':
                default:
                    minor++;
                    break;
            }
            
            return `v${major}.${minor}`;
            
        } catch (error) {
            this.log('version_calculation_error', 'Failed to calculate next version', { 
                currentVersion, 
                incrementType, 
                error: error.message 
            });
            throw error;
        }
    }
    
    /**
     * バージョンアップ実行判定
     */
    shouldUpgradeVersion(evaluationResults, feedbackLoopResults) {
        try {
            const criteria = {
                minSuccessRate: 0.7, // 70%以上の成功率
                minGoodGrade: 0.5,   // 50%以上がGood以上
                noRecentFailures: true, // 最近の重大な失敗なし
                feedbackLoopSuccess: true // フィードバックループ自体の成功
            };
            
            // フィードバックループ自体の成功チェック
            if (!feedbackLoopResults.success) {
                this.log('upgrade_rejected', 'Feedback loop failed', {
                    reason: 'feedback_loop_failure'
                });
                return { shouldUpgrade: false, reason: 'Feedback loop execution failed' };
            }
            
            // 評価結果の分析
            if (!evaluationResults || evaluationResults.length === 0) {
                this.log('upgrade_rejected', 'No evaluation data', {
                    reason: 'no_evaluation_data'
                });
                return { shouldUpgrade: false, reason: 'No evaluation data available' };
            }
            
            // 成功率計算
            const successfulEvaluations = evaluationResults.filter(e => 
                e.overall?.grade === 'complete' || e.overall?.grade === 'good'
            );
            const successRate = successfulEvaluations.length / evaluationResults.length;
            
            // Good以上の割合
            const goodGradeRate = evaluationResults.filter(e => 
                e.overall?.grade === 'complete' || e.overall?.grade === 'good'
            ).length / evaluationResults.length;
            
            // 最近の重大失敗チェック
            const recentFailures = evaluationResults
                .slice(-5) // 最新5件
                .filter(e => e.overall?.grade === 'failure');
            
            // 判定結果
            const decision = {
                successRate,
                goodGradeRate,
                recentFailures: recentFailures.length,
                criteria: {
                    successRatePass: successRate >= criteria.minSuccessRate,
                    goodGradePass: goodGradeRate >= criteria.minGoodGrade,
                    noRecentFailuresPass: recentFailures.length === 0,
                    feedbackLoopPass: feedbackLoopResults.success
                }
            };
            
            const shouldUpgrade = Object.values(decision.criteria).every(pass => pass);
            
            if (shouldUpgrade) {
                this.log('upgrade_approved', 'Version upgrade approved', decision);
                return { shouldUpgrade: true, decision };
            } else {
                this.log('upgrade_rejected', 'Version upgrade rejected', decision);
                
                const reasons = [];
                if (!decision.criteria.successRatePass) reasons.push(`Success rate too low: ${(successRate * 100).toFixed(1)}%`);
                if (!decision.criteria.goodGradePass) reasons.push(`Good grade rate too low: ${(goodGradeRate * 100).toFixed(1)}%`);
                if (!decision.criteria.noRecentFailuresPass) reasons.push(`Recent failures detected: ${recentFailures.length}`);
                if (!decision.criteria.feedbackLoopPass) reasons.push('Feedback loop failed');
                
                return { shouldUpgrade: false, reason: reasons.join(', '), decision };
            }
            
        } catch (error) {
            this.log('upgrade_decision_error', 'Failed to determine upgrade decision', { error: error.message });
            return { shouldUpgrade: false, reason: `Decision error: ${error.message}` };
        }
    }
    
    /**
     * VERSION.md更新
     */
    updateVersionFile(currentVersion, newVersion, feedbackLoopResults, evaluationSummary) {
        try {
            const content = fs.readFileSync(this.versionFile, 'utf8');
            
            // 現在のバージョン行を更新
            let updatedContent = content.replace(
                /## 現在のバージョン: v[\d.]+/,
                `## 現在のバージョン: ${newVersion}`
            );
            
            // 新しいバージョンエントリを追加
            const newVersionEntry = this.generateVersionEntry(newVersion, feedbackLoopResults, evaluationSummary);
            
            // 最初のバージョンエントリの前に挿入
            const firstVersionMatch = updatedContent.match(/(### v[\d.]+)/);
            if (firstVersionMatch) {
                const insertIndex = updatedContent.indexOf(firstVersionMatch[1]);
                const beforeInsert = updatedContent.substring(0, insertIndex);
                const afterInsert = updatedContent.substring(insertIndex);
                
                updatedContent = beforeInsert + newVersionEntry + '\n' + afterInsert;
            } else {
                // バージョンエントリがない場合は末尾に追加
                updatedContent += '\n' + newVersionEntry;
            }
            
            // ファイル更新
            fs.writeFileSync(this.versionFile, updatedContent, 'utf8');
            
            this.log('version_file_updated', 'VERSION.md updated successfully', {
                currentVersion,
                newVersion,
                filePath: this.versionFile
            });
            
            return { success: true, newContent: updatedContent };
            
        } catch (error) {
            this.log('version_file_error', 'Failed to update VERSION.md', { error: error.message });
            throw error;
        }
    }
    
    /**
     * バージョンエントリ生成
     */
    generateVersionEntry(version, feedbackLoopResults, evaluationSummary) {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        const entry = `### ${version} (${date})
- **🔄 自動アップグレード**: フィードバックループ成功による自動更新
- **📊 品質評価**: ${evaluationSummary.totalProjects}プロジェクト分析済み
- **✅ 成功率**: ${(evaluationSummary.successRate * 100).toFixed(1)}% (${evaluationSummary.successfulProjects}/${evaluationSummary.totalProjects})
- **🎯 改善ルール**: ${feedbackLoopResults.phases?.analysis?.rulesCount || 0}個の新ルール生成
- **🤖 Worker AI**: 自動学習による品質向上
- **⚡ 効果**: 過去の失敗パターン回避、ベストプラクティス自動適用`;
        
        return entry;
    }
    
    /**
     * Git操作実行
     */
    executeGitOperations(newVersion, commitMessage) {
        try {
            // Git状態確認
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            
            // VERSION.mdの変更をステージング
            execSync('git add VERSION.md', { encoding: 'utf8' });
            
            // コミット作成
            const fullCommitMessage = `${commitMessage}\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
            
            execSync(`git commit -m "${fullCommitMessage}"`, { encoding: 'utf8' });
            
            // タグ作成
            execSync(`git tag ${newVersion}`, { encoding: 'utf8' });
            
            this.log('git_operations_complete', 'Git operations completed', {
                newVersion,
                commitMessage,
                tagged: true
            });
            
            return {
                success: true,
                operations: ['add', 'commit', 'tag'],
                newVersion,
                commitHash: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
            };
            
        } catch (error) {
            this.log('git_operations_error', 'Git operations failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * 完全バージョンアップ実行
     */
    async executeVersionUpgrade(evaluationResults, feedbackLoopResults, options = {}) {
        const {
            incrementType = 'minor',
            pushToRemote = false,
            dryRun = false
        } = options;
        
        try {
            this.log('version_upgrade_start', 'Starting version upgrade process', {
                incrementType,
                pushToRemote,
                dryRun
            });
            
            const upgradeResult = {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                success: false,
                steps: {},
                currentVersion: null,
                newVersion: null,
                reason: null
            };
            
            // Step 1: 現在のバージョン取得
            upgradeResult.currentVersion = this.getCurrentVersion();
            upgradeResult.steps.getCurrentVersion = { success: true };
            
            // Step 2: アップグレード判定
            const shouldUpgrade = this.shouldUpgradeVersion(evaluationResults, feedbackLoopResults);
            upgradeResult.steps.shouldUpgrade = shouldUpgrade;
            
            if (!shouldUpgrade.shouldUpgrade) {
                upgradeResult.reason = shouldUpgrade.reason;
                upgradeResult.success = false;
                
                this.log('version_upgrade_skipped', 'Version upgrade skipped', {
                    reason: shouldUpgrade.reason
                });
                
                return upgradeResult;
            }
            
            // Step 3: 次のバージョン計算
            upgradeResult.newVersion = this.calculateNextVersion(upgradeResult.currentVersion, incrementType);
            upgradeResult.steps.calculateNextVersion = { success: true, newVersion: upgradeResult.newVersion };
            
            if (dryRun) {
                this.log('version_upgrade_dry_run', 'Dry run completed', upgradeResult);
                upgradeResult.success = true;
                upgradeResult.dryRun = true;
                return upgradeResult;
            }
            
            // Step 4: 評価サマリー生成
            const evaluationSummary = this.generateEvaluationSummary(evaluationResults);
            upgradeResult.steps.generateSummary = { success: true, summary: evaluationSummary };
            
            // Step 5: VERSION.md更新
            const versionFileResult = this.updateVersionFile(
                upgradeResult.currentVersion,
                upgradeResult.newVersion,
                feedbackLoopResults,
                evaluationSummary
            );
            upgradeResult.steps.updateVersionFile = versionFileResult;
            
            // Step 6: Git操作
            const commitMessage = `🚀 ${upgradeResult.newVersion}: 自動品質向上アップグレード\n\n- フィードバックループ分析: ${evaluationSummary.totalProjects}プロジェクト\n- 成功率: ${(evaluationSummary.successRate * 100).toFixed(1)}%\n- 新改善ルール: ${feedbackLoopResults.phases?.analysis?.rulesCount || 0}個`;
            
            const gitResult = this.executeGitOperations(upgradeResult.newVersion, commitMessage);
            upgradeResult.steps.gitOperations = gitResult;
            
            // Step 7: リモートプッシュ（オプション）
            if (pushToRemote) {
                try {
                    execSync('git push origin main', { encoding: 'utf8' });
                    execSync(`git push origin ${upgradeResult.newVersion}`, { encoding: 'utf8' });
                    upgradeResult.steps.pushToRemote = { success: true };
                    
                    this.log('remote_push_complete', 'Pushed to remote repository', {
                        newVersion: upgradeResult.newVersion
                    });
                } catch (pushError) {
                    upgradeResult.steps.pushToRemote = { success: false, error: pushError.message };
                    // プッシュ失敗は致命的ではない
                }
            }
            
            upgradeResult.success = true;
            
            this.log('version_upgrade_complete', 'Version upgrade completed successfully', {
                oldVersion: upgradeResult.currentVersion,
                newVersion: upgradeResult.newVersion,
                commitHash: gitResult.commitHash
            });
            
            return upgradeResult;
            
        } catch (error) {
            this.log('version_upgrade_error', 'Version upgrade failed', { error: error.message });
            
            // エラー時のロールバック処理
            await this.handleUpgradeError(error, upgradeResult);
            
            throw error;
        }
    }
    
    /**
     * 評価サマリー生成
     */
    generateEvaluationSummary(evaluationResults) {
        const summary = {
            totalProjects: evaluationResults.length,
            successfulProjects: 0,
            gradeDistribution: { complete: 0, good: 0, insufficient: 0, failure: 0 },
            averageScores: { completeness: 0, quality: 0, overall: 0 },
            successRate: 0
        };
        
        evaluationResults.forEach(evaluation => {
            const grade = evaluation.overall?.grade || 'failure';
            summary.gradeDistribution[grade]++;
            
            if (grade === 'complete' || grade === 'good') {
                summary.successfulProjects++;
            }
            
            summary.averageScores.completeness += evaluation.completeness?.score || 0;
            summary.averageScores.quality += evaluation.quality?.score || 0;
            summary.averageScores.overall += evaluation.overall?.score || 0;
        });
        
        // 平均値計算
        if (summary.totalProjects > 0) {
            summary.averageScores.completeness /= summary.totalProjects;
            summary.averageScores.quality /= summary.totalProjects;
            summary.averageScores.overall /= summary.totalProjects;
            summary.successRate = summary.successfulProjects / summary.totalProjects;
        }
        
        return summary;
    }
    
    /**
     * アップグレードエラー処理
     */
    async handleUpgradeError(error, upgradeResult) {
        try {
            this.log('upgrade_error_handling', 'Handling upgrade error', {
                error: error.message,
                steps: Object.keys(upgradeResult.steps)
            });
            
            // Git操作のロールバック
            if (upgradeResult.steps.gitOperations?.success) {
                try {
                    // 最新コミットをリセット
                    execSync('git reset HEAD~1', { encoding: 'utf8' });
                    
                    // タグ削除
                    if (upgradeResult.newVersion) {
                        execSync(`git tag -d ${upgradeResult.newVersion}`, { encoding: 'utf8' });
                    }
                    
                    this.log('git_rollback_complete', 'Git operations rolled back');
                } catch (rollbackError) {
                    this.log('git_rollback_error', 'Git rollback failed', { error: rollbackError.message });
                }
            }
            
            // VERSION.mdの復元
            if (upgradeResult.steps.updateVersionFile?.success) {
                try {
                    execSync('git checkout HEAD -- VERSION.md', { encoding: 'utf8' });
                    this.log('version_file_restored', 'VERSION.md restored');
                } catch (restoreError) {
                    this.log('version_file_restore_error', 'VERSION.md restore failed', { error: restoreError.message });
                }
            }
            
        } catch (handlingError) {
            this.log('error_handling_failed', 'Error handling itself failed', { error: handlingError.message });
        }
    }
    
    /**
     * バージョン履歴取得
     */
    getVersionHistory(limit = 10) {
        try {
            const content = fs.readFileSync(this.versionFile, 'utf8');
            const versionMatches = content.match(/### (v[\d.]+) \(([^)]+)\)/g);
            
            if (!versionMatches) {
                return [];
            }
            
            return versionMatches.slice(0, limit).map(match => {
                const parts = match.match(/### (v[\d.]+) \(([^)]+)\)/);
                return {
                    version: parts[1],
                    date: parts[2],
                    line: match
                };
            });
            
        } catch (error) {
            this.log('version_history_error', 'Failed to get version history', { error: error.message });
            return [];
        }
    }
    
    /**
     * ログ記録
     */
    log(action, description, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            description,
            data
        };
        
        // 統合ログに記録
        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('auto-version', action, description, data);
        }
        
        console.log(`🔄 [VERSION] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const versionManager = new AutoVersionManager('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'current':
            try {
                const currentVersion = versionManager.getCurrentVersion();
                console.log(currentVersion);
            } catch (error) {
                console.error('❌ Failed to get current version:', error.message);
                process.exit(1);
            }
            break;
            
        case 'next':
            const incrementType = process.argv[3] || 'minor';
            try {
                const currentVersion = versionManager.getCurrentVersion();
                const nextVersion = versionManager.calculateNextVersion(currentVersion, incrementType);
                console.log(`${currentVersion} -> ${nextVersion}`);
            } catch (error) {
                console.error('❌ Failed to calculate next version:', error.message);
                process.exit(1);
            }
            break;
            
        case 'history':
            const limit = parseInt(process.argv[3]) || 10;
            const history = versionManager.getVersionHistory(limit);
            
            console.log(`📜 Version History (last ${limit}):`);
            history.forEach((entry, index) => {
                console.log(`${index + 1}. ${entry.version} (${entry.date})`);
            });
            break;
            
        case 'upgrade':
            // 実際のアップグレードはfeedback-loop-managerから呼び出される
            console.log('🚧 Direct upgrade not implemented. Use via feedback-loop-manager.');
            break;
            
        default:
            console.log('Auto Version Manager Commands:');
            console.log('  current                    - Show current version');
            console.log('  next [increment-type]      - Calculate next version (minor/major)');
            console.log('  history [limit]            - Show version history');
            console.log('  upgrade                    - Execute version upgrade (via feedback-loop-manager)');
            console.log('\nExample:');
            console.log('  node auto-version-manager.cjs current');
            console.log('  node auto-version-manager.cjs next minor');
            console.log('  node auto-version-manager.cjs history 5');
    }
}

module.exports = AutoVersionManager;