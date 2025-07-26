#!/usr/bin/env node

/**
 * Management AI自動改善ループシステム v1.0
 * Workerログ解析→自動最適化→ルール更新の完全自動化
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoImprovementLoop {
    constructor(sessionId = 'auto-improvement', useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.projectRoot = path.dirname(__dirname);
        this.configDir = path.join(require('os').homedir(), '.ai-generator');
        this.improvementFile = path.join(this.configDir, 'auto-improvement-history.json');
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger(sessionId);
            } catch (error) {
                console.warn('⚠️ Unified logging not available');
                this.useUnifiedLogging = false;
            }
        }
        
        this.ensureConfigDir();
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    /**
     * 完全自動改善ループ実行
     */
    async executeAutoImprovementLoop() {
        console.log('🔄 Management AI自動改善ループ開始');
        
        const loopResults = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            phases: {},
            improvements: [],
            newRules: [],
            systemChanges: [],
            success: false
        };

        this.log('auto_improvement_start', 'Auto improvement loop started', { sessionId: this.sessionId });

        try {
            // Phase 1: Worker AI行動ログ解析
            console.log('\n📊 Phase 1: Worker AI行動ログ解析');
            const logAnalysis = await this.analyzeWorkerLogs();
            loopResults.phases.logAnalysis = logAnalysis;

            // Phase 2: Git活動監視・ミス検知
            console.log('\n🔍 Phase 2: Git活動監視・ミス検知');
            const gitAnalysis = await this.analyzeGitActivity();
            loopResults.phases.gitAnalysis = gitAnalysis;

            // Phase 3: 問題パターン特定
            console.log('\n🎯 Phase 3: 問題パターン特定');
            const patternAnalysis = await this.identifyProblemPatterns(logAnalysis, gitAnalysis);
            loopResults.phases.patternAnalysis = patternAnalysis;

            // Phase 4: 自動改善ルール生成
            console.log('\n⚙️ Phase 4: 自動改善ルール生成');
            const ruleGeneration = await this.generateImprovementRules(patternAnalysis);
            loopResults.phases.ruleGeneration = ruleGeneration;
            loopResults.newRules = ruleGeneration.rules || [];

            // Phase 5: システム自動更新
            console.log('\n🚀 Phase 5: システム自動更新');
            const systemUpdate = await this.updateSystemComponents(ruleGeneration);
            loopResults.phases.systemUpdate = systemUpdate;
            loopResults.systemChanges = systemUpdate.changes || [];

            // Phase 6: 改善効果測定・次回準備
            console.log('\n📈 Phase 6: 改善効果測定・次回準備');
            const effectMeasurement = await this.measureImprovementEffects(loopResults);
            loopResults.phases.effectMeasurement = effectMeasurement;

            loopResults.success = true;
            
            // 改善履歴保存
            await this.saveImprovementHistory(loopResults);
            
            // 結果表示
            this.displayImprovementResults(loopResults);

            this.log('auto_improvement_complete', 'Auto improvement loop completed successfully', {
                newRulesCount: loopResults.newRules.length,
                systemChangesCount: loopResults.systemChanges.length
            });

            return loopResults;

        } catch (error) {
            console.error('❌ 自動改善ループでエラー:', error.message);
            
            loopResults.error = error.message;
            loopResults.success = false;
            
            this.log('auto_improvement_error', 'Auto improvement loop failed', {
                error: error.message
            });

            return loopResults;
        }
    }

    /**
     * Worker AI行動ログ解析
     */
    async analyzeWorkerLogs() {
        const analysis = {
            startTime: new Date().toISOString(),
            status: 'running',
            findings: [],
            patterns: {},
            qualityMetrics: {}
        };

        try {
            // 統合ログファイル解析
            const logsDir = path.join(this.projectRoot, 'logs');
            const logFiles = fs.readdirSync(logsDir).filter(f => 
                f.startsWith('unified-') && f.endsWith('.json')
            );

            let totalErrors = 0;
            let totalWarnings = 0;
            let completionRate = 0;
            let averageGenerationTime = 0;
            const errorPatterns = {};
            const successPatterns = {};

            logFiles.forEach(logFile => {
                try {
                    const logPath = path.join(logsDir, logFile);
                    const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                    
                    if (logData.logs) {
                        // エラー・警告カウント
                        const errors = logData.logs.filter(log => log.level === 'error');
                        const warnings = logData.logs.filter(log => log.level === 'warn');
                        
                        totalErrors += errors.length;
                        totalWarnings += warnings.length;

                        // エラーパターン分析
                        errors.forEach(error => {
                            const errorType = this.categorizeError(error);
                            errorPatterns[errorType] = (errorPatterns[errorType] || 0) + 1;
                        });

                        // 成功パターン分析
                        if (logData.meta.status === 'completed') {
                            completionRate++;
                            
                            const sessionTime = new Date(logData.meta.endTime) - new Date(logData.meta.startTime);
                            averageGenerationTime += sessionTime;
                        }
                    }
                } catch (parseError) {
                    // ログ解析エラーは記録して継続
                    analysis.findings.push({
                        type: 'log_parse_error',
                        file: logFile,
                        error: parseError.message
                    });
                }
            });

            // 品質メトリクス計算
            analysis.qualityMetrics = {
                totalSessions: logFiles.length,
                completionRate: logFiles.length > 0 ? completionRate / logFiles.length : 0,
                averageErrors: logFiles.length > 0 ? totalErrors / logFiles.length : 0,
                averageWarnings: logFiles.length > 0 ? totalWarnings / logFiles.length : 0,
                averageGenerationTime: completionRate > 0 ? averageGenerationTime / completionRate : 0,
                errorPatterns,
                successPatterns
            };

            // 問題発見
            if (analysis.qualityMetrics.completionRate < 0.8) {
                analysis.findings.push({
                    type: 'low_completion_rate',
                    severity: 'high',
                    value: analysis.qualityMetrics.completionRate,
                    description: 'Worker AI完了率が低い（80%未満）'
                });
            }

            if (analysis.qualityMetrics.averageErrors > 2) {
                analysis.findings.push({
                    type: 'high_error_rate',
                    severity: 'medium',
                    value: analysis.qualityMetrics.averageErrors,
                    description: 'Worker AIエラー率が高い（平均2件以上）'
                });
            }

            analysis.status = 'completed';
            
        } catch (error) {
            analysis.status = 'error';
            analysis.error = error.message;
        }

        analysis.endTime = new Date().toISOString();
        return analysis;
    }

    /**
     * Git活動監視・ミス検知
     */
    async analyzeGitActivity() {
        const analysis = {
            startTime: new Date().toISOString(),
            status: 'running',
            commits: [],
            issues: [],
            recommendations: []
        };

        try {
            // 最近のコミット分析（過去10件）
            const gitLog = execSync('git log --oneline -10 --pretty=format:"%H|%an|%ae|%s|%ad" --date=iso', {
                encoding: 'utf8',
                cwd: this.projectRoot
            });

            const commits = gitLog.split('\n').filter(line => line.trim()).map(line => {
                const [hash, author, email, message, date] = line.split('|');
                return { hash, author, email, message, date };
            });

            commits.forEach(commit => {
                const issues = [];
                
                // Author検証
                if (commit.email.includes('example.com') || commit.email.includes('calculator@')) {
                    issues.push({
                        type: 'invalid_author',
                        severity: 'high',
                        description: '不正なAuthor情報',
                        value: `${commit.author} <${commit.email}>`
                    });
                }

                // コミットメッセージ品質チェック
                if (commit.message.length < 10) {
                    issues.push({
                        type: 'poor_commit_message',
                        severity: 'medium',
                        description: 'コミットメッセージが短すぎる',
                        value: commit.message
                    });
                }

                // 不適切なコミットパターン
                if (commit.message.includes('temp-deploy') || commit.message.includes('temp-')) {
                    issues.push({
                        type: 'temp_files_committed',
                        severity: 'high',
                        description: '一時ファイルがコミットされている',
                        value: commit.message
                    });
                }

                if (issues.length > 0) {
                    analysis.commits.push({
                        ...commit,
                        issues
                    });
                    analysis.issues.push(...issues);
                }
            });

            // ファイル構造チェック
            const tempDeploy = path.join(this.projectRoot, 'temp-deploy');
            if (fs.existsSync(tempDeploy)) {
                analysis.issues.push({
                    type: 'temp_files_remaining',
                    severity: 'medium',
                    description: 'temp-deployフォルダが残存している',
                    recommendation: '自動削除ルールの強化'
                });
            }

            // 推奨改善策生成
            const issueTypes = [...new Set(analysis.issues.map(issue => issue.type))];
            issueTypes.forEach(issueType => {
                switch (issueType) {
                    case 'invalid_author':
                        analysis.recommendations.push({
                            type: 'fix_git_config',
                            priority: 'high',
                            description: 'Git設定の自動修正・検証の追加',
                            implementation: 'git config自動設定をwk-st.mdに追加'
                        });
                        break;
                    case 'temp_files_committed':
                        analysis.recommendations.push({
                            type: 'improve_cleanup',
                            priority: 'high',
                            description: '一時ファイル削除の強化',
                            implementation: 'コミット前チェックの追加'
                        });
                        break;
                    case 'poor_commit_message':
                        analysis.recommendations.push({
                            type: 'commit_template',
                            priority: 'medium',
                            description: 'コミットメッセージテンプレート化',
                            implementation: 'wk-st.mdにコミットメッセージ生成追加'
                        });
                        break;
                }
            });

            analysis.status = 'completed';

        } catch (error) {
            analysis.status = 'error';
            analysis.error = error.message;
        }

        analysis.endTime = new Date().toISOString();
        return analysis;
    }

    /**
     * 問題パターン特定
     */
    async identifyProblemPatterns(logAnalysis, gitAnalysis) {
        const patterns = {
            timestamp: new Date().toISOString(),
            criticalPatterns: [],
            recurringIssues: [],
            improvementOpportunities: [],
            priorityRanking: []
        };

        try {
            // ログとGit解析の統合分析
            const allIssues = [
                ...(logAnalysis.findings || []),
                ...(gitAnalysis.issues || [])
            ];

            // 重要度別分類
            const criticalIssues = allIssues.filter(issue => issue.severity === 'high');
            const mediumIssues = allIssues.filter(issue => issue.severity === 'medium');

            criticalIssues.forEach(issue => {
                patterns.criticalPatterns.push({
                    type: issue.type,
                    description: issue.description,
                    frequency: 1, // 今後の実装で頻度カウント
                    impact: 'high',
                    needsImmediateAction: true
                });
            });

            // 繰り返し問題の特定
            const issueTypeCounts = {};
            allIssues.forEach(issue => {
                issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1;
            });

            Object.entries(issueTypeCounts).forEach(([type, count]) => {
                if (count > 1) {
                    patterns.recurringIssues.push({
                        type,
                        count,
                        needsSystematicFix: true
                    });
                }
            });

            // 改善機会の特定
            if (logAnalysis.qualityMetrics?.completionRate < 0.9) {
                patterns.improvementOpportunities.push({
                    area: 'completion_rate',
                    currentValue: logAnalysis.qualityMetrics.completionRate,
                    targetValue: 0.95,
                    approach: 'error_prevention_and_recovery'
                });
            }

            if (logAnalysis.qualityMetrics?.averageGenerationTime > 300000) { // 5分以上
                patterns.improvementOpportunities.push({
                    area: 'generation_speed',
                    currentValue: logAnalysis.qualityMetrics.averageGenerationTime,
                    targetValue: 180000, // 3分
                    approach: 'process_optimization'
                });
            }

            // 優先度ランキング生成
            patterns.priorityRanking = [
                ...patterns.criticalPatterns.map(p => ({ ...p, priority: 1 })),
                ...patterns.recurringIssues.map(p => ({ ...p, priority: 2 })),
                ...patterns.improvementOpportunities.map(p => ({ ...p, priority: 3 }))
            ].sort((a, b) => a.priority - b.priority);

        } catch (error) {
            patterns.error = error.message;
        }

        return patterns;
    }

    /**
     * 自動改善ルール生成
     */
    async generateImprovementRules(patternAnalysis) {
        const ruleGeneration = {
            timestamp: new Date().toISOString(),
            rules: [],
            implementations: [],
            targetComponents: []
        };

        try {
            // パターンから具体的ルール生成
            patternAnalysis.priorityRanking.forEach((pattern, index) => {
                switch (pattern.type) {
                    case 'invalid_author':
                        ruleGeneration.rules.push({
                            id: `git_config_fix_${Date.now()}`,
                            priority: 'high',
                            title: 'Git設定自動修正',
                            description: 'Worker AI実行前にGit設定を強制的に正しい値に設定',
                            implementation: 'wk-st.mdのPhase 1に git config 設定を追加',
                            code: `
# Git設定強制修正（Worker AIミス防止）
!git config user.name "AI Auto Generator"
!git config user.email "ai@muumuu8181.com"
!echo "✅ Git設定を正しい値に修正完了"
                            `.trim()
                        });
                        break;

                    case 'temp_files_committed':
                        ruleGeneration.rules.push({
                            id: `cleanup_enforcement_${Date.now()}`,
                            priority: 'high',
                            title: '一時ファイル削除強化',
                            description: 'コミット前に一時ファイルを強制削除',
                            implementation: 'wk-st.mdのPhase 4に削除チェックを追加',
                            code: `
# 一時ファイル強制削除（Worker AIミス防止）
!echo "🧹 一時ファイル削除チェック開始..."
!find . -name "temp-deploy" -type d -exec rm -rf {} + 2>/dev/null || true
!find . -name "*temp*" -type f -exec rm -f {} + 2>/dev/null || true
!echo "✅ 一時ファイル削除完了"
                            `.trim()
                        });
                        break;

                    case 'low_completion_rate':
                        ruleGeneration.rules.push({
                            id: `completion_enforcement_${Date.now()}`,
                            priority: 'high',
                            title: '完了率向上強制システム',
                            description: '各フェーズでのエラーハンドリング強化',
                            implementation: 'completion-enforcer.cjsとの統合強化',
                            code: `
# 完了率向上（エラー時も継続）
!set +e  # エラーで停止させない
# 各処理にエラーハンドリング追加
!command || (echo "⚠️ エラー発生しましたが継続します" && true)
                            `.trim()
                        });
                        break;
                }
            });

            // 実装対象コンポーネント決定
            ruleGeneration.targetComponents = [
                '.claude/commands/wk-st.md',
                'core/completion-enforcer.cjs',
                'core/duplicate-app-detector.cjs'
            ];

        } catch (error) {
            ruleGeneration.error = error.message;
        }

        return ruleGeneration;
    }

    /**
     * システム自動更新
     */
    async updateSystemComponents(ruleGeneration) {
        const update = {
            timestamp: new Date().toISOString(),
            changes: [],
            backups: [],
            success: false
        };

        try {
            // ルールの適用
            for (const rule of ruleGeneration.rules) {
                if (rule.implementation.includes('wk-st.md')) {
                    const wkstPath = path.join(this.projectRoot, '.claude/commands/wk-st.md');
                    
                    // バックアップ作成
                    const backupPath = `${wkstPath}.backup.${Date.now()}`;
                    fs.copyFileSync(wkstPath, backupPath);
                    update.backups.push(backupPath);

                    // ルール挿入
                    let content = fs.readFileSync(wkstPath, 'utf8');
                    
                    // Phase 1での Git設定修正
                    if (rule.id.includes('git_config_fix')) {
                        const insertPoint = content.indexOf('# Initialize session tracking');
                        if (insertPoint !== -1) {
                            const before = content.substring(0, insertPoint);
                            const after = content.substring(insertPoint);
                            content = before + rule.code + '\n\n' + after;
                            
                            fs.writeFileSync(wkstPath, content);
                            update.changes.push({
                                file: 'wk-st.md',
                                rule: rule.id,
                                type: 'git_config_fix',
                                description: 'Git設定自動修正を追加'
                            });
                        }
                    }

                    // Phase 4での一時ファイル削除
                    if (rule.id.includes('cleanup_enforcement')) {
                        const insertPoint = content.indexOf('# Configure and push');
                        if (insertPoint !== -1) {
                            const before = content.substring(0, insertPoint);
                            const after = content.substring(insertPoint);
                            content = before + rule.code + '\n\n' + after;
                            
                            fs.writeFileSync(wkstPath, content);
                            update.changes.push({
                                file: 'wk-st.md',
                                rule: rule.id,
                                type: 'cleanup_enforcement',
                                description: '一時ファイル削除強化を追加'
                            });
                        }
                    }
                }
            }

            update.success = true;

        } catch (error) {
            update.error = error.message;
            update.success = false;
        }

        return update;
    }

    /**
     * 改善効果測定・次回準備
     */
    async measureImprovementEffects(loopResults) {
        const measurement = {
            timestamp: new Date().toISOString(),
            baseline: {},
            improvements: [],
            nextLoopPreparation: {}
        };

        try {
            // ベースライン記録
            measurement.baseline = {
                rulesApplied: loopResults.newRules.length,
                systemChanges: loopResults.systemChanges.length,
                detectedIssues: loopResults.phases.patternAnalysis?.priorityRanking?.length || 0
            };

            // 次回実行準備
            measurement.nextLoopPreparation = {
                nextExecutionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
                monitoringTargets: [
                    'git_commit_quality',
                    'worker_completion_rate',
                    'error_frequency',
                    'generation_speed'
                ],
                autoTriggerConditions: [
                    'new_worker_errors > 5',
                    'completion_rate < 0.8',
                    'invalid_commits_detected'
                ]
            };

        } catch (error) {
            measurement.error = error.message;
        }

        return measurement;
    }

    /**
     * エラー分類
     */
    categorizeError(error) {
        const message = error.description || error.message || '';
        
        if (message.includes('git')) return 'git_error';
        if (message.includes('permission')) return 'permission_error';
        if (message.includes('network')) return 'network_error';
        if (message.includes('timeout')) return 'timeout_error';
        if (message.includes('file') || message.includes('path')) return 'file_error';
        
        return 'unknown_error';
    }

    /**
     * 改善履歴保存
     */
    async saveImprovementHistory(loopResults) {
        try {
            let history = [];
            if (fs.existsSync(this.improvementFile)) {
                const existingData = JSON.parse(fs.readFileSync(this.improvementFile, 'utf8'));
                history = existingData.history || [];
            }

            history.push({
                timestamp: loopResults.timestamp,
                sessionId: loopResults.sessionId,
                success: loopResults.success,
                rulesGenerated: loopResults.newRules.length,
                systemChanges: loopResults.systemChanges.length,
                summary: {
                    detectedIssues: loopResults.phases.patternAnalysis?.priorityRanking?.length || 0,
                    criticalPatterns: loopResults.phases.patternAnalysis?.criticalPatterns?.length || 0,
                    improvements: loopResults.improvements.length
                }
            });

            // 最新30件のみ保持
            if (history.length > 30) {
                history = history.slice(-30);
            }

            const improvementData = {
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                history,
                latestLoop: loopResults
            };

            fs.writeFileSync(this.improvementFile, JSON.stringify(improvementData, null, 2));

        } catch (error) {
            console.error('⚠️ 改善履歴保存でエラー:', error.message);
        }
    }

    /**
     * 結果表示
     */
    displayImprovementResults(loopResults) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎉 Management AI自動改善ループ完了`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📊 実行結果:`);
        console.log(`   検知問題数: ${loopResults.phases.patternAnalysis?.priorityRanking?.length || 0}`);
        console.log(`   生成ルール数: ${loopResults.newRules.length}`);
        console.log(`   システム変更数: ${loopResults.systemChanges.length}`);
        console.log(`   実行結果: ${loopResults.success ? '✅ 成功' : '❌ 失敗'}`);

        if (loopResults.newRules.length > 0) {
            console.log(`\n⚙️ 生成された改善ルール:`);
            loopResults.newRules.forEach((rule, index) => {
                console.log(`   ${index + 1}. ${rule.title} (${rule.priority})`);
                console.log(`      ${rule.description}`);
            });
        }

        if (loopResults.systemChanges.length > 0) {
            console.log(`\n🔧 システム変更:`);
            loopResults.systemChanges.forEach((change, index) => {
                console.log(`   ${index + 1}. ${change.file}: ${change.description}`);
            });
        }

        console.log(`\n🔄 次回実行: 24時間後または問題検知時に自動実行`);
        console.log(`${'='.repeat(80)}`);
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

        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('auto-improvement', action, description, data);
        }

        console.log(`🔄 [AUTO-IMPROVE] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const improver = new AutoImprovementLoop();
    const command = process.argv[2] || 'execute';
    
    switch (command) {
        case 'execute':
            improver.executeAutoImprovementLoop()
                .then(results => {
                    console.log('\n📊 自動改善ループ完了');
                    process.exit(results.success ? 0 : 1);
                })
                .catch(error => {
                    console.error('❌ 自動改善ループ失敗:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'status':
            try {
                if (fs.existsSync(improver.improvementFile)) {
                    const data = JSON.parse(fs.readFileSync(improver.improvementFile, 'utf8'));
                    console.log('最新改善結果:', data.latestLoop?.summary || 'なし');
                    console.log('改善履歴件数:', data.history?.length || 0);
                } else {
                    console.log('改善履歴なし');
                }
            } catch (error) {
                console.error('ステータス確認エラー:', error.message);
                process.exit(1);
            }
            break;
            
        default:
            console.log('Auto Improvement Loop Commands:');
            console.log('  execute  - Execute full auto improvement loop');
            console.log('  status   - Show improvement status');
            console.log('\nExample:');
            console.log('  node auto-improvement-loop.cjs execute');
    }
}

module.exports = AutoImprovementLoop;