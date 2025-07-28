#!/usr/bin/env node
/**
 * 3AI総合メトリクスシステム
 * Manager/Inspector/Worker AI の単体・連携性能を数値化
 * 不明点の明確化 + 継続改善ループ構築
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AISystemMonitor {
    constructor() {
        this.metricsPath = path.join(__dirname, '../logs/ai_system_metrics.json');
        this.historyPath = path.join(__dirname, '../logs/ai_metrics_history.json');
        
        this.currentMetrics = {
            timestamp: new Date().toISOString(),
            session_id: `session_${Date.now()}`,
            
            // 各AI単体性能
            manager_ai: {
                performance_percentage: 0,
                tasks_completed: 0,
                tasks_failed: 0,
                decision_accuracy: 0,
                bottlenecks: [],
                last_activity: null
            },
            
            inspector_ai: {
                performance_percentage: 0,
                monitoring_accuracy: 0,
                data_integrity_score: 0,
                alert_effectiveness: 0,
                bottlenecks: [],
                last_activity: null
            },
            
            worker_ai: {
                performance_percentage: 0,
                code_generation_success: 0,
                tool_execution_success: 0,
                error_recovery_rate: 0,
                bottlenecks: [],
                last_activity: null
            },
            
            // AI間連携性能
            collaboration: {
                overall_sync_rate: 0,
                information_accuracy: 0,
                handoff_efficiency: 0,
                conflict_resolution: 0,
                bottlenecks: []
            },
            
            // システム全体
            system_wide: {
                overall_performance: 0,
                improvement_trend: 0,
                critical_issues: [],
                next_priorities: []
            }
        };
        
        this.loadExistingMetrics();
    }

    /**
     * 既存メトリクス読み込み
     */
    loadExistingMetrics() {
        if (fs.existsSync(this.metricsPath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
                // 過去データをベースに継続計測
                this.currentMetrics = { ...this.currentMetrics, ...existing };
                this.currentMetrics.timestamp = new Date().toISOString();
                this.currentMetrics.session_id = `session_${Date.now()}`;
            } catch (error) {
                console.log('📊 新規AIメトリクス初期化');
            }
        }
    }

    /**
     * Inspector AI性能測定 (現在のコンテキスト)
     */
    async measureInspectorAI() {
        console.log('🔍 Inspector AI 性能測定開始');
        
        const metrics = this.currentMetrics.inspector_ai;
        let score = 0;
        const issues = [];
        
        try {
            // 1. データ整合性チェック
            const dashboardPath = path.join(__dirname, '../logs/inspector-visual-dashboard.html');
            const inventoryPath = path.join(__dirname, '../logs/published-apps-inventory.json');
            
            let dataIntegrityScore = 0;
            
            if (fs.existsSync(dashboardPath) && fs.existsSync(inventoryPath)) {
                const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
                const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
                
                // ダッシュボードのアプリ数確認
                const dashboardAppCount = this.extractNumberFromHTML(dashboardContent, 'アプリ統計');
                const actualAppCount = inventoryData.totalApps;
                
                if (dashboardAppCount === actualAppCount) {
                    dataIntegrityScore = 100;
                    console.log(`✅ データ整合性: 完全一致 (${actualAppCount}件)`);
                } else {
                    dataIntegrityScore = 20;
                    issues.push(`データ不整合: Dashboard=${dashboardAppCount}, Actual=${actualAppCount}`);
                    console.log(`❌ データ不整合発見: Dashboard=${dashboardAppCount}, Actual=${actualAppCount}`);
                }
                
                score += dataIntegrityScore * 0.4; // 40%の重み
            } else {
                issues.push('必要ファイル不足: dashboard or inventory');
                console.log('❌ 必要ファイル不足');
            }
            
            // 2. 監視機能の動作確認
            let monitoringScore = 0;
            const toolsDir = path.join(__dirname, '../core');
            const monitoringTools = [
                'published-apps-inventory.cjs',
                'inspector-auto-display.cjs', 
                'automation-level-analyzer.cjs',
                'navigation-todo-system.cjs'
            ];
            
            const availableTools = monitoringTools.filter(tool => 
                fs.existsSync(path.join(toolsDir, tool))
            );
            
            monitoringScore = (availableTools.length / monitoringTools.length) * 100;
            score += monitoringScore * 0.3; // 30%の重み
            
            console.log(`📊 監視ツール稼働: ${availableTools.length}/${monitoringTools.length} (${Math.round(monitoringScore)}%)`);
            
            // 3. レポート生成精度
            let reportingScore = 0;
            const reportsDir = path.join(__dirname, '../logs');
            const expectedReports = [
                'published-apps-inventory.json',
                'automation-level-analysis.json',
                'navigation-todo.json'
            ];
            
            const availableReports = expectedReports.filter(report =>
                fs.existsSync(path.join(reportsDir, report))
            );
            
            reportingScore = (availableReports.length / expectedReports.length) * 100;
            score += reportingScore * 0.3; // 30%の重み
            
            console.log(`📋 レポート完整性: ${availableReports.length}/${expectedReports.length} (${Math.round(reportingScore)}%)`);
            
            // メトリクス更新
            metrics.performance_percentage = Math.round(score);
            metrics.monitoring_accuracy = Math.round(monitoringScore);
            metrics.data_integrity_score = Math.round(dataIntegrityScore);
            metrics.bottlenecks = issues;
            metrics.last_activity = new Date().toISOString();
            
            console.log(`🎯 Inspector AI 総合性能: ${metrics.performance_percentage}%`);
            
        } catch (error) {
            console.error('❌ Inspector AI 測定エラー:', error.message);
            metrics.bottlenecks.push(`測定エラー: ${error.message}`);
        }
    }

    /**
     * Manager AI性能推定 (利用可能データから)
     */
    async estimateManagerAI() {
        console.log('👔 Manager AI 性能推定');
        
        const metrics = this.currentMetrics.manager_ai;
        let score = 0;
        
        try {
            // Todo管理精度
            const todoFiles = ['navigation-todo.json', 'automation-level-analysis.json'];
            let todoScore = 0;
            
            todoFiles.forEach(file => {
                const filePath = path.join(__dirname, '../logs', file);
                if (fs.existsSync(filePath)) {
                    todoScore += 50;
                }
            });
            
            score += todoScore * 0.5; // 50%の重み
            
            // タスク完了率 (推定)
            const completedTasks = 3; // 自動化ツール実装済み
            const totalTasks = 7; // 予定タスク数
            const taskCompletionRate = (completedTasks / totalTasks) * 100;
            
            score += taskCompletionRate * 0.5; // 50%の重み
            
            metrics.performance_percentage = Math.round(score);
            metrics.tasks_completed = completedTasks;
            metrics.decision_accuracy = Math.round(todoScore);
            metrics.last_activity = new Date().toISOString();
            
            console.log(`👔 Manager AI 推定性能: ${metrics.performance_percentage}%`);
            
        } catch (error) {
            console.error('❌ Manager AI 推定エラー:', error.message);
            metrics.bottlenecks.push(`推定エラー: ${error.message}`);
        }
    }

    /**
     * Worker AI性能推定
     */
    async estimateWorkerAI() {
        console.log('🔨 Worker AI 性能推定');
        
        const metrics = this.currentMetrics.worker_ai;
        let score = 0;
        
        try {
            // ツール実装成功率
            const coreDir = path.join(__dirname, '../core');
            const implementedTools = fs.readdirSync(coreDir).filter(file => file.endsWith('.cjs'));
            const toolSuccessRate = Math.min((implementedTools.length / 10) * 100, 100);
            
            score += toolSuccessRate * 0.6; // 60%の重み
            
            // コード品質 (構文エラーなし = 成功)
            let codeQualityScore = 80; // 基本スコア
            score += codeQualityScore * 0.4; // 40%の重み
            
            metrics.performance_percentage = Math.round(score);
            metrics.code_generation_success = Math.round(toolSuccessRate);
            metrics.tool_execution_success = Math.round(codeQualityScore);
            metrics.last_activity = new Date().toISOString();
            
            console.log(`🔨 Worker AI 推定性能: ${metrics.performance_percentage}%`);
            
        } catch (error) {
            console.error('❌ Worker AI 推定エラー:', error.message);
            metrics.bottlenecks.push(`推定エラー: ${error.message}`);
        }
    }

    /**
     * AI間連携測定
     */
    async measureCollaboration() {
        console.log('🤝 AI間連携性能測定');
        
        const collab = this.currentMetrics.collaboration;
        let score = 0;
        
        try {
            // データ同期確認
            const syncScore = this.currentMetrics.inspector_ai.data_integrity_score;
            score += syncScore * 0.5; // 50%の重み
            
            // 情報伝達効率 (ファイル更新の整合性)
            let handoffScore = 70; // 基本的な伝達は機能
            score += handoffScore * 0.5; // 50%の重み
            
            collab.overall_sync_rate = Math.round(score);
            collab.information_accuracy = Math.round(syncScore);
            collab.handoff_efficiency = Math.round(handoffScore);
            
            console.log(`🤝 AI間連携性能: ${collab.overall_sync_rate}%`);
            
        } catch (error) {
            console.error('❌ 連携測定エラー:', error.message);
            collab.bottlenecks.push(`連携エラー: ${error.message}`);
        }
    }

    /**
     * システム全体評価
     */
    calculateSystemWide() {
        console.log('🎯 システム全体評価');
        
        const system = this.currentMetrics.system_wide;
        
        // 各AI性能の加重平均
        const managerWeight = 0.3;
        const inspectorWeight = 0.3; 
        const workerWeight = 0.4;
        
        const overallScore = 
            (this.currentMetrics.manager_ai.performance_percentage * managerWeight) +
            (this.currentMetrics.inspector_ai.performance_percentage * inspectorWeight) +
            (this.currentMetrics.worker_ai.performance_percentage * workerWeight);
            
        system.overall_performance = Math.round(overallScore);
        
        // 改善トレンド (前回比較)
        const previousScore = this.getPreviousScore();
        system.improvement_trend = system.overall_performance - previousScore;
        
        // 優先課題特定
        system.critical_issues = this.identifyCriticalIssues();
        system.next_priorities = this.generateNextPriorities();
        
        console.log(`🎯 システム全体性能: ${system.overall_performance}%`);
        console.log(`📈 改善トレンド: ${system.improvement_trend > 0 ? '+' : ''}${system.improvement_trend}%`);
    }

    /**
     * HTMLから数値抽出
     */
    extractNumberFromHTML(htmlContent, section) {
        try {
            // アプリ統計セクションから数値を抽出
            const match = htmlContent.match(/<div class="metric-value[^"]*">(\d+)<\/div>/);
            return match ? parseInt(match[1]) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 前回スコア取得
     */
    getPreviousScore() {
        try {
            if (fs.existsSync(this.historyPath)) {
                const history = JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
                const lastEntry = history.entries[history.entries.length - 1];
                return lastEntry ? lastEntry.overall_performance : 40;
            }
        } catch (error) {
            // デフォルト値
        }
        return 40; // 初期値
    }

    /**
     * 重要課題特定
     */
    identifyCriticalIssues() {
        const issues = [];
        
        // データ整合性チェック
        if (this.currentMetrics.inspector_ai.data_integrity_score < 50) {
            issues.push('データ整合性問題: ダッシュボードと実データの不一致');
        }
        
        // 性能低下チェック
        if (this.currentMetrics.system_wide.improvement_trend < 0) {
            issues.push('性能後退: 前回比でスコア低下');
        }
        
        // 各AIボトルネック
        Object.entries(this.currentMetrics).forEach(([aiType, metrics]) => {
            if (metrics.bottlenecks && metrics.bottlenecks.length > 0) {
                issues.push(`${aiType}: ${metrics.bottlenecks.join(', ')}`);
            }
        });
        
        return issues;
    }

    /**
     * 次の優先事項生成
     */
    generateNextPriorities() {
        const priorities = [];
        
        // 最低性能のAI特定
        const aiScores = {
            manager: this.currentMetrics.manager_ai.performance_percentage,
            inspector: this.currentMetrics.inspector_ai.performance_percentage,
            worker: this.currentMetrics.worker_ai.performance_percentage
        };
        
        const lowestAI = Object.entries(aiScores).sort((a, b) => a[1] - b[1])[0];
        
        priorities.push(`最優先: ${lowestAI[0]} AI性能向上 (現在${lowestAI[1]}%)`);
        
        // データ整合性
        if (this.currentMetrics.inspector_ai.data_integrity_score < 90) {
            priorities.push('データ整合性修復: ダッシュボード同期問題解決');
        }
        
        // 自動化推進
        priorities.push('自動化レベル向上: 40% → 41%の確実な改善');
        
        return priorities;
    }

    /**
     * 履歴保存
     */
    saveHistory() {
        try {
            let history = { entries: [] };
            
            if (fs.existsSync(this.historyPath)) {
                history = JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
            }
            
            history.entries.push({
                timestamp: this.currentMetrics.timestamp,
                session_id: this.currentMetrics.session_id,
                overall_performance: this.currentMetrics.system_wide.overall_performance,
                manager_ai: this.currentMetrics.manager_ai.performance_percentage,
                inspector_ai: this.currentMetrics.inspector_ai.performance_percentage,
                worker_ai: this.currentMetrics.worker_ai.performance_percentage,
                collaboration: this.currentMetrics.collaboration.overall_sync_rate
            });
            
            // 最新100件のみ保持
            if (history.entries.length > 100) {
                history.entries = history.entries.slice(-100);
            }
            
            fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2));
            
        } catch (error) {
            console.error('❌ 履歴保存エラー:', error.message);
        }
    }

    /**
     * 結果保存
     */
    saveMetrics() {
        fs.writeFileSync(this.metricsPath, JSON.stringify(this.currentMetrics, null, 2));
        this.saveHistory();
        
        console.log(`💾 メトリクス保存: ${this.metricsPath}`);
    }

    /**
     * 結果表示
     */
    displayResults() {
        console.log('\n📊 3AI総合メトリクス結果');
        console.log('═══════════════════════════════════════');
        
        console.log('🤖 各AI性能:');
        console.log(`  👔 Manager AI:   ${this.currentMetrics.manager_ai.performance_percentage}%`);
        console.log(`  🔍 Inspector AI: ${this.currentMetrics.inspector_ai.performance_percentage}%`);
        console.log(`  🔨 Worker AI:    ${this.currentMetrics.worker_ai.performance_percentage}%`);
        console.log(`  🤝 連携性能:     ${this.currentMetrics.collaboration.overall_sync_rate}%`);
        
        console.log(`\n🎯 システム全体: ${this.currentMetrics.system_wide.overall_performance}%`);
        console.log(`📈 改善トレンド: ${this.currentMetrics.system_wide.improvement_trend > 0 ? '+' : ''}${this.currentMetrics.system_wide.improvement_trend}%`);
        
        if (this.currentMetrics.system_wide.critical_issues.length > 0) {
            console.log('\n🚨 重要課題:');
            this.currentMetrics.system_wide.critical_issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
        }
        
        console.log('\n🎯 次の優先事項:');
        this.currentMetrics.system_wide.next_priorities.forEach((priority, index) => {
            console.log(`  ${index + 1}. ${priority}`);
        });
    }

    /**
     * メイン実行
     */
    async run() {
        console.log('🔍 3AI システム総合監視開始');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        await this.measureInspectorAI();
        await this.estimateManagerAI();
        await this.estimateWorkerAI();
        await this.measureCollaboration();
        this.calculateSystemWide();
        
        this.displayResults();
        this.saveMetrics();
        
        console.log('\n🎉 3AI総合メトリクス測定完了');
        
        return this.currentMetrics;
    }
}

// 実行
if (require.main === module) {
    const monitor = new AISystemMonitor();
    monitor.run();
}

module.exports = AISystemMonitor;