#!/usr/bin/env node

/**
 * フィードバックループ統合管理システム v1.0
 * Manager AI専用：フィードバックループの全プロセスを管理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FeedbackLoopManager {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        
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
        
        this.log('manager_start', 'Feedback loop manager initialized', { sessionId });
    }
    
    /**
     * 完全フィードバックループ実行
     */
    async executeFullFeedbackLoop(options = {}) {
        const {
            sourceDirectory = '../published-apps',
            outputDirectory = './feedback-analysis',
            maxProjects = 20,
            geminiModel = 'gemini-2.5-pro',
            autoApplyRules = false,
            autoVersionUpgrade = true
        } = options;
        
        try {
            this.log('full_loop_start', 'Starting complete feedback loop', {
                sourceDirectory,
                maxProjects,
                geminiModel,
                autoApplyRules
            });
            
            const results = {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                config: { sourceDirectory, outputDirectory, maxProjects, geminiModel },
                phases: {},
                success: false
            };
            
            // Phase 1: データ収集
            console.log('\n🔍 Phase 1: データ収集開始...');
            const collectionResult = await this.executeDataCollection(sourceDirectory, outputDirectory, maxProjects);
            results.phases.collection = collectionResult;
            
            if (!collectionResult.success) {
                throw new Error(`Data collection failed: ${collectionResult.error}`);
            }
            
            // Phase 2: MapReduce分析
            console.log('\n🧠 Phase 2: MapReduce分析開始...');
            const analysisResult = await this.executeAnalysis(collectionResult.jsonlFile, outputDirectory, maxProjects, geminiModel);
            results.phases.analysis = analysisResult;
            
            if (!analysisResult.success) {
                throw new Error(`Analysis failed: ${analysisResult.error}`);
            }
            
            // Phase 3: ルール適用（オプション）
            if (autoApplyRules) {
                console.log('\n⚙️ Phase 3: ルール自動適用開始...');
                const applicationResult = await this.applyRulesAutomatically(analysisResult.rulesFile);
                results.phases.application = applicationResult;
            } else {
                console.log('\n⚙️ Phase 3: ルール適用はスキップ（手動適用推奨）');
                results.phases.application = { skipped: true, reason: 'Manual application recommended' };
            }
            
            // Phase 4: Worker AI評価システム
            console.log('\n📊 Phase 4: Worker AI品質評価...');
            const evaluationResult = await this.executeWorkerEvaluation(sourceDirectory, outputDirectory);
            results.phases.evaluation = evaluationResult;
            
            // Phase 5: 自動バージョンアップ（オプション）
            if (autoVersionUpgrade && evaluationResult.success) {
                console.log('\n🚀 Phase 5: 自動バージョンアップ判定...');
                const versionResult = await this.executeVersionUpgrade(evaluationResult.evaluations, results);
                results.phases.version = versionResult;
            } else {
                console.log('\n🚀 Phase 5: バージョンアップはスキップ');
                results.phases.version = { skipped: true, reason: 'Disabled or evaluation failed' };
            }

            // Phase 6: レポート生成
            console.log('\n📊 Phase 6: 総合レポート生成...');
            const reportResult = await this.generateComprehensiveReport(results, outputDirectory);
            results.phases.report = reportResult;
            
            results.success = true;
            
            this.log('full_loop_complete', 'Complete feedback loop finished successfully', {
                projectsAnalyzed: collectionResult.projectCount,
                rulesGenerated: analysisResult.rulesCount,
                outputDirectory
            });
            
            // 結果サマリー表示
            this.displayFinalSummary(results);
            
            return results;
            
        } catch (error) {
            this.log('full_loop_error', 'Feedback loop failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Worker AI評価フェーズ
     */
    async executeWorkerEvaluation(sourceDirectory, outputDirectory) {
        try {
            const WorkerEvaluationSystem = require('./worker-evaluation-system.cjs');
            const evaluator = new WorkerEvaluationSystem(this.sessionId, this.useUnifiedLogging);
            
            // アプリフォルダ検索
            const { glob } = require('glob');
            const appFolders = await new Promise((resolve, reject) => {
                glob(path.join(sourceDirectory, 'app-*-*'), { onlyDirectories: true }, (err, matches) => {
                    if (err) reject(err);
                    else resolve(matches);
                });
            });
            
            if (appFolders.length === 0) {
                return {
                    success: false,
                    error: 'No app folders found for evaluation',
                    evaluations: []
                };
            }
            
            // 各プロジェクト評価
            const evaluations = [];
            for (const appFolder of appFolders.slice(0, 20)) { // 最大20個
                try {
                    const evaluation = await evaluator.evaluateProject(appFolder);
                    evaluations.push(evaluation);
                } catch (evalError) {
                    console.warn(`⚠️ Evaluation failed for ${appFolder}:`, evalError.message);
                    evaluations.push({
                        projectId: path.basename(appFolder),
                        projectPath: appFolder,
                        error: evalError.message,
                        overall: { grade: 'failure', score: 0 }
                    });
                }
            }
            
            // 評価結果をエクスポート
            const evaluationOutputPath = path.join(outputDirectory, 'worker-evaluations.jsonl');
            await evaluator.exportEvaluations(evaluationOutputPath, {
                format: 'jsonl',
                includeDetails: true,
                includeStatistics: true
            });
            
            // Worker統計生成
            const statistics = evaluator.generateWorkerStatistics(evaluations);
            
            return {
                success: true,
                evaluations,
                statistics,
                outputPath: evaluationOutputPath,
                summary: {
                    totalProjects: evaluations.length,
                    gradeDistribution: this.calculateGradeDistribution(evaluations),
                    averageScore: this.calculateAverageScore(evaluations),
                    successRate: this.calculateSuccessRate(evaluations)
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                evaluations: []
            };
        }
    }
    
    /**
     * 自動バージョンアップフェーズ
     */
    async executeVersionUpgrade(evaluations, feedbackLoopResults) {
        try {
            const AutoVersionManager = require('./auto-version-manager.cjs');
            const versionManager = new AutoVersionManager(this.sessionId, this.useUnifiedLogging);
            
            // バージョンアップ実行
            const upgradeResult = await versionManager.executeVersionUpgrade(
                evaluations,
                feedbackLoopResults,
                {
                    incrementType: 'minor',
                    pushToRemote: false, // 手動プッシュ推奨
                    dryRun: false
                }
            );
            
            return upgradeResult;
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                reason: 'Version upgrade execution failed'
            };
        }
    }
    
    /**
     * 評価統計計算ユーティリティ
     */
    calculateGradeDistribution(evaluations) {
        const distribution = { complete: 0, good: 0, insufficient: 0, failure: 0 };
        
        evaluations.forEach(evaluation => {
            const grade = evaluation.overall?.grade || 'failure';
            if (distribution.hasOwnProperty(grade)) {
                distribution[grade]++;
            }
        });
        
        return distribution;
    }
    
    calculateAverageScore(evaluations) {
        if (evaluations.length === 0) return 0;
        
        const totalScore = evaluations.reduce((sum, evaluation) => {
            return sum + (evaluation.overall?.score || 0);
        }, 0);
        
        return totalScore / evaluations.length;
    }
    
    calculateSuccessRate(evaluations) {
        if (evaluations.length === 0) return 0;
        
        const successfulEvaluations = evaluations.filter(evaluation => {
            const grade = evaluation.overall?.grade;
            return grade === 'complete' || grade === 'good';
        });
        
        return successfulEvaluations.length / evaluations.length;
    }
    
    /**
     * データ収集フェーズ
     */
    async executeDataCollection(sourceDirectory, outputDirectory, maxProjects) {
        try {
            const FeedbackCollector = require('./feedback-loop-collector.cjs');
            const collector = new FeedbackCollector(this.sessionId, this.useUnifiedLogging);
            
            // 出力ディレクトリ作成
            if (!fs.existsSync(outputDirectory)) {
                fs.mkdirSync(outputDirectory, { recursive: true });
            }
            
            // 収集実行
            const collectionResult = await collector.collectFromDirectory(sourceDirectory, {
                maxProjects,
                excludePatterns: ['node_modules', '.git', 'temp-*', 'logs'],
                includeFileTypes: ['reflection.md', 'requirements.md', 'work_log.md', 'session-log.json', 'gemini-feedback.txt']
            });
            
            if (!collectionResult.success) {
                return {
                    success: false,
                    error: collectionResult.reason || 'Collection failed',
                    projectCount: 0
                };
            }
            
            // JSONL出力
            const jsonlFile = path.join(outputDirectory, 'collected-feedback.jsonl');
            await collector.exportToJsonl(jsonlFile, {
                includeMetadata: true,
                compressContent: true,
                maxContentLength: 8000
            });
            
            return {
                success: true,
                projectCount: collectionResult.data.length,
                jsonlFile,
                stats: collectionResult.stats,
                failures: collectionResult.failures
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                projectCount: 0
            };
        }
    }
    
    /**
     * 分析フェーズ
     */
    async executeAnalysis(jsonlFile, outputDirectory, maxProjects, geminiModel) {
        try {
            const FeedbackAnalyzer = require('./feedback-loop-analyzer.cjs');
            const analyzer = new FeedbackAnalyzer(this.sessionId, this.useUnifiedLogging);
            
            // 分析実行
            const analysisResult = await analyzer.analyzeCollectedData(jsonlFile, {
                maxProjects,
                geminiModel,
                outputDir: outputDirectory
            });
            
            return {
                success: true,
                rulesFile: analysisResult.outputFiles.workerRules,
                rulesCount: analysisResult.workerRules.rules?.length || 0,
                mapResults: analysisResult.mapResults,
                reduceResults: analysisResult.reduceResults,
                outputFiles: analysisResult.outputFiles
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                rulesCount: 0
            };
        }
    }
    
    /**
     * ルール自動適用フェーズ
     */
    async applyRulesAutomatically(rulesFile) {
        try {
            if (!fs.existsSync(rulesFile)) {
                throw new Error(`Rules file not found: ${rulesFile}`);
            }
            
            // /wk-st コマンドにルールを統合
            const wkstPath = path.join(__dirname, '../.claude/commands/wk-st.md');
            
            if (!fs.existsSync(wkstPath)) {
                throw new Error('wk-st.md not found');
            }
            
            // バックアップ作成
            const backupPath = `${wkstPath}.backup.${Date.now()}`;
            fs.copyFileSync(wkstPath, backupPath);
            
            // ルール内容読み込み
            const rulesContent = fs.readFileSync(rulesFile, 'utf8');
            
            // wk-st.mdにルール挿入
            let wkstContent = fs.readFileSync(wkstPath, 'utf8');
            
            // 挿入ポイントを検索
            const insertMarker = '## System Overview & Your Role';
            const insertIndex = wkstContent.indexOf(insertMarker);
            
            if (insertIndex === -1) {
                throw new Error('Insert point not found in wk-st.md');
            }
            
            // ルールセクション挿入
            const rulesSection = `\n\n## 🔄 最新改善ルール（自動適用）\n\n**重要**: 以下のルールは過去のプロジェクト分析から自動生成されました。必ず確認・実行してください。\n\n${rulesContent}\n\n---\n\n`;
            
            const beforeInsert = wkstContent.substring(0, insertIndex);
            const afterInsert = wkstContent.substring(insertIndex);
            
            const updatedContent = beforeInsert + rulesSection + afterInsert;
            
            // ファイル更新
            fs.writeFileSync(wkstPath, updatedContent);
            
            this.log('rules_applied', 'Rules automatically applied to wk-st.md', {
                rulesFile,
                backupPath,
                insertedContent: rulesSection.length
            });
            
            return {
                success: true,
                backupPath,
                appliedRules: true,
                method: 'wk-st.md injection'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                appliedRules: false
            };
        }
    }
    
    /**
     * 総合レポート生成
     */
    async generateComprehensiveReport(results, outputDirectory) {
        try {
            const reportData = {
                ...results,
                summary: {
                    projectsAnalyzed: results.phases.collection?.projectCount || 0,
                    rulesGenerated: results.phases.analysis?.rulesCount || 0,
                    rulesApplied: results.phases.application?.appliedRules || false,
                    totalDuration: this.calculateTotalDuration(results.timestamp),
                    successRate: this.calculateSuccessRate(results)
                }
            };
            
            // JSON レポート
            const jsonReportPath = path.join(outputDirectory, 'feedback-loop-report.json');
            fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
            
            // Markdown レポート
            const markdownReport = this.generateMarkdownReport(reportData);
            const mdReportPath = path.join(outputDirectory, 'feedback-loop-report.md');
            fs.writeFileSync(mdReportPath, markdownReport);
            
            // 管理ダッシュボード更新
            await this.updateManagerDashboard(reportData, outputDirectory);
            
            return {
                success: true,
                jsonReport: jsonReportPath,
                markdownReport: mdReportPath,
                summary: reportData.summary
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Markdownレポート生成
     */
    generateMarkdownReport(reportData) {
        const timestamp = new Date().toLocaleString('ja-JP');
        
        return `# 🔄 フィードバックループ実行レポート

**実行日時**: ${timestamp}  
**セッションID**: ${reportData.sessionId}  
**実行結果**: ${reportData.success ? '✅ 成功' : '❌ 失敗'}

## 📊 実行サマリー

| 項目 | 結果 |
|------|------|
| 分析プロジェクト数 | ${reportData.summary.projectsAnalyzed} |
| 生成改善ルール数 | ${reportData.summary.rulesGenerated} |
| ルール自動適用 | ${reportData.summary.rulesApplied ? '✅ 適用済み' : '⚠️ 未適用'} |
| 実行時間 | ${reportData.summary.totalDuration}秒 |
| 成功率 | ${(reportData.summary.successRate * 100).toFixed(1)}% |

## 🔍 フェーズ別結果

### Phase 1: データ収集
- **状態**: ${reportData.phases.collection?.success ? '✅ 成功' : '❌ 失敗'}
- **収集プロジェクト**: ${reportData.phases.collection?.projectCount || 0}個
- **失敗プロジェクト**: ${reportData.phases.collection?.failures?.length || 0}個
- **出力ファイル**: ${reportData.phases.collection?.jsonlFile || 'N/A'}

### Phase 2: MapReduce分析
- **状態**: ${reportData.phases.analysis?.success ? '✅ 成功' : '❌ 失敗'}
- **生成ルール数**: ${reportData.phases.analysis?.rulesCount || 0}個
- **Map結果**: ${reportData.phases.analysis?.mapResults || 0}個
- **Reduce結果**: ${reportData.phases.analysis?.reduceResults ? '✅ 完了' : '❌ 失敗'}

### Phase 3: ルール適用
- **状態**: ${reportData.phases.application?.success ? '✅ 成功' : reportData.phases.application?.skipped ? '⚠️ スキップ' : '❌ 失敗'}
- **適用方法**: ${reportData.phases.application?.method || 'N/A'}
- **バックアップ**: ${reportData.phases.application?.backupPath || 'N/A'}

### Phase 4: レポート生成
- **状態**: ${reportData.phases.report?.success ? '✅ 成功' : '❌ 失敗'}
- **JSONレポート**: ${reportData.phases.report?.jsonReport || 'N/A'}
- **Markdownレポート**: ${reportData.phases.report?.markdownReport || 'N/A'}

## 🎯 改善効果予測

このフィードバックループにより、次回のWorker AI実行時に以下の改善が期待されます：

1. **品質向上**: 過去の失敗パターンを回避
2. **効率化**: 成功パターンの再利用
3. **標準化**: 技術スタック別のベストプラクティス適用
4. **自動化**: 繰り返し問題の予防

## 📋 次のアクション

### 推奨手順
1. **ルール確認**: 生成された改善ルールを確認
2. **手動適用**: 必要に応じて /wk-st にルールを手動統合
3. **テスト実行**: 新ルール適用後のアプリ生成テスト
4. **効果測定**: 次回フィードバックループで改善効果を検証

### 自動適用済みの場合
- 次回の /wk-st 実行時に新ルールが自動適用されます
- バックアップファイルから元に戻すことも可能です

## 🔗 関連ファイル

- **改善ルール**: ${reportData.phases.analysis?.rulesFile || 'N/A'}
- **分析データ**: ${reportData.phases.collection?.jsonlFile || 'N/A'}
- **詳細レポート**: ${reportData.phases.report?.jsonReport || 'N/A'}

---

*自動生成: AI Auto Generator v0.10 - Feedback Loop Manager*  
*Manager AI: Claude (Management AI)*`;
    }
    
    /**
     * 管理ダッシュボード更新
     */
    async updateManagerDashboard(reportData, outputDirectory) {
        const dashboardPath = path.join(outputDirectory, 'manager-dashboard.json');
        
        let dashboard = { history: [], stats: {} };
        
        // 既存ダッシュボード読み込み
        if (fs.existsSync(dashboardPath)) {
            try {
                dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));
            } catch (parseError) {
                console.warn('⚠️ Failed to load existing dashboard:', parseError.message);
            }
        }
        
        // 新しい実行結果を履歴に追加
        dashboard.history.push({
            timestamp: reportData.timestamp,
            sessionId: reportData.sessionId,
            success: reportData.success,
            summary: reportData.summary
        });
        
        // 統計更新
        dashboard.stats = {
            totalExecutions: dashboard.history.length,
            successfulExecutions: dashboard.history.filter(h => h.success).length,
            totalProjectsAnalyzed: dashboard.history.reduce((sum, h) => sum + (h.summary?.projectsAnalyzed || 0), 0),
            totalRulesGenerated: dashboard.history.reduce((sum, h) => sum + (h.summary?.rulesGenerated || 0), 0),
            averageSuccessRate: dashboard.history.length > 0 
                ? dashboard.history.reduce((sum, h) => sum + (h.summary?.successRate || 0), 0) / dashboard.history.length
                : 0,
            lastExecution: reportData.timestamp
        };
        
        // ダッシュボード保存
        fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
        
        this.log('dashboard_updated', 'Manager dashboard updated', {
            totalExecutions: dashboard.stats.totalExecutions,
            successRate: dashboard.stats.averageSuccessRate
        });
    }
    
    /**
     * 最終サマリー表示
     */
    displayFinalSummary(results) {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 フィードバックループ実行完了');
        console.log('='.repeat(60));
        console.log(`📊 分析プロジェクト数: ${results.phases.collection?.projectCount || 0}`);
        console.log(`📋 生成改善ルール数: ${results.phases.analysis?.rulesCount || 0}`);
        console.log(`⚙️ ルール自動適用: ${results.phases.application?.appliedRules ? '✅ 完了' : '⚠️ 未実行'}`);
        console.log(`🕒 実行時間: ${this.calculateTotalDuration(results.timestamp)}秒`);
        console.log(`✅ 成功率: ${(this.calculateSuccessRate(results) * 100).toFixed(1)}%`);
        
        if (results.phases.analysis?.rulesFile) {
            console.log(`\n📝 改善ルール: ${results.phases.analysis.rulesFile}`);
        }
        
        if (results.phases.report?.markdownReport) {
            console.log(`📊 詳細レポート: ${results.phases.report.markdownReport}`);
        }
        
        console.log('\n🔄 次のステップ:');
        console.log('1. 生成された改善ルールを確認');
        console.log('2. 必要に応じて /wk-st に手動統合');
        console.log('3. 新ルール適用後のテスト実行');
        console.log('='.repeat(60));
    }
    
    /**
     * ユーティリティ関数
     */
    calculateTotalDuration(startTimestamp) {
        return Math.round((new Date() - new Date(startTimestamp)) / 1000);
    }
    
    calculateSuccessRate(results) {
        const phases = Object.values(results.phases);
        const successfulPhases = phases.filter(phase => phase.success || phase.skipped);
        return phases.length > 0 ? successfulPhases.length / phases.length : 0;
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
            this.unifiedLogger.log('feedback-manager', action, description, data);
        }
        
        console.log(`🔄 [MANAGER] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const manager = new FeedbackLoopManager('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'execute':
            const sourceDir = process.argv[3] || '../published-apps';
            const outputDir = process.argv[4] || './feedback-analysis';
            const maxProjects = parseInt(process.argv[5]) || 20;
            const autoApply = process.argv[6] === 'true';
            
            console.log('🚀 フィードバックループ実行開始...');
            console.log(`📂 ソースディレクトリ: ${sourceDir}`);
            console.log(`📁 出力ディレクトリ: ${outputDir}`);
            console.log(`📊 最大プロジェクト数: ${maxProjects}`);
            console.log(`⚙️ ルール自動適用: ${autoApply ? '有効' : '無効'}`);
            
            manager.executeFullFeedbackLoop({
                sourceDirectory: sourceDir,
                outputDirectory: outputDir,
                maxProjects,
                autoApplyRules: autoApply
            }).then(results => {
                process.exit(results.success ? 0 : 1);
            }).catch(error => {
                console.error('❌ Feedback loop execution failed:', error.message);
                process.exit(1);
            });
            break;
            
        default:
            console.log('Feedback Loop Manager Commands:');
            console.log('  execute [source-dir] [output-dir] [max-projects] [auto-apply]');
            console.log('\nExample:');
            console.log('  node feedback-loop-manager.cjs execute ../published-apps ./analysis 15 false');
            console.log('\nParameters:');
            console.log('  source-dir    : Directory containing app folders (default: ../published-apps)');
            console.log('  output-dir    : Analysis output directory (default: ./feedback-analysis)');
            console.log('  max-projects  : Maximum projects to analyze (default: 20)');
            console.log('  auto-apply    : Auto-apply rules to wk-st.md (default: false)');
            console.log('\nOutput:');
            console.log('  - collected-feedback.jsonl          (raw project data)');
            console.log('  - worker-improvement-rules.md       (actionable improvement rules)');
            console.log('  - feedback-loop-report.md           (comprehensive analysis report)');
            console.log('  - manager-dashboard.json            (execution history and stats)');
    }
}

module.exports = FeedbackLoopManager;