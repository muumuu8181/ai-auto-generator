#!/usr/bin/env node
/**
 * 安定メトリクス抽出ツール
 * HTMLから正確にアプリ統計数値を抽出（推測ではなく確実な抽出）
 */

const fs = require('fs');
const path = require('path');

class StableMetricExtractor {
    constructor() {
        this.extractionLog = [];
    }

    /**
     * ダッシュボードから正確な数値抽出
     */
    extractDashboardMetrics(htmlContent) {
        console.log('🔍 ダッシュボード数値抽出開始（安定化版）');
        
        const results = {
            app_count: null,
            working_apps: null,
            error_apps: null,
            success_rate: null,
            extraction_method: 'stable_targeted',
            confidence_level: 'high'
        };

        try {
            // 1. アプリ統計セクションを特定
            const appStatsMatch = htmlContent.match(/<!-- アプリ統計 -->([\s\S]*?)<!-- URL健全性 -->/);
            
            if (!appStatsMatch) {
                console.log('❌ アプリ統計セクションが見つかりません');
                results.confidence_level = 'error';
                return results;
            }

            const appStatsSection = appStatsMatch[1];
            console.log('✅ アプリ統計セクション特定');

            // 2. 総アプリ数抽出（アプリ統計内の最初のmetric-value）
            const totalAppsMatch = appStatsSection.match(/<div class="metric-value[^"]*">(\d+)<\/div>/);
            if (totalAppsMatch) {
                results.app_count = parseInt(totalAppsMatch[1]);
                console.log(`📊 総アプリ数: ${results.app_count}件`);
            }

            // 3. 本番デプロイ済み数抽出
            const deployedMatch = appStatsSection.match(/<div class="number">(\d+)<\/div>\s*<div class="label">本番デプロイ済み<\/div>/);
            if (deployedMatch) {
                results.working_apps = parseInt(deployedMatch[1]);
                console.log(`✅ 本番デプロイ済み: ${results.working_apps}件`);
            }

            // 4. 開発中数抽出
            const developingMatch = appStatsSection.match(/<div class="number">(\d+)<\/div>\s*<div class="label">開発中<\/div>/);
            if (developingMatch) {
                results.error_apps = parseInt(developingMatch[1]);
                console.log(`🔧 開発中: ${results.error_apps}件`);
            }

            // 5. URL健全性抽出（別セクション）
            const urlHealthMatch = htmlContent.match(/<!-- URL健全性 -->([\s\S]*?)<!-- 品質スコア -->/);
            if (urlHealthMatch) {
                const healthSection = urlHealthMatch[1];
                const successRateMatch = healthSection.match(/<div class="metric-value[^"]*">(\d+)%<\/div>/);
                if (successRateMatch) {
                    results.success_rate = parseInt(successRateMatch[1]);
                    console.log(`🌐 成功率: ${results.success_rate}%`);
                }
            }

            // 抽出ログ記録
            this.extractionLog.push({
                timestamp: new Date().toISOString(),
                method: 'section_targeted_extraction',
                sections_found: {
                    app_stats: !!appStatsMatch,
                    url_health: !!urlHealthMatch
                },
                extracted_values: results
            });

        } catch (error) {
            console.error('❌ 抽出エラー:', error.message);
            results.confidence_level = 'error';
            results.error = error.message;
        }

        return results;
    }

    /**
     * 実データと比較分析
     */
    compareWithActualData() {
        console.log('\n📊 実データとの比較分析');
        
        const comparison = {
            dashboard_data: null,
            actual_data: null,
            integrity_score: 0,
            discrepancies: []
        };

        try {
            // ダッシュボードデータ抽出
            const dashboardPath = path.join(__dirname, '../logs/inspector-visual-dashboard.html');
            if (fs.existsSync(dashboardPath)) {
                const htmlContent = fs.readFileSync(dashboardPath, 'utf8');
                comparison.dashboard_data = this.extractDashboardMetrics(htmlContent);
            }

            // 実際のインベントリデータ
            const inventoryPath = path.join(__dirname, '../logs/published-apps-inventory.json');
            if (fs.existsSync(inventoryPath)) {
                const inventoryData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
                comparison.actual_data = {
                    app_count: inventoryData.totalApps,
                    working_apps: inventoryData.workingApps ? inventoryData.workingApps.length : 0,
                    error_apps: inventoryData.brokenApps ? inventoryData.brokenApps.length : 0,
                    success_rate: inventoryData.summary ? inventoryData.summary.successRate : 0
                };
                console.log('✅ 実データ読み込み完了');
            }

            // 整合性分析
            if (comparison.dashboard_data && comparison.actual_data) {
                this.analyzeIntegrity(comparison);
            }

        } catch (error) {
            console.error('❌ 比較分析エラー:', error.message);
            comparison.error = error.message;
        }

        return comparison;
    }

    /**
     * データ整合性詳細分析
     */
    analyzeIntegrity(comparison) {
        console.log('\n🔍 データ整合性詳細分析');
        
        const dashboard = comparison.dashboard_data;
        const actual = comparison.actual_data;
        const discrepancies = [];

        // アプリ数比較
        if (dashboard.app_count !== actual.app_count) {
            const diff = Math.abs(dashboard.app_count - actual.app_count);
            const errorRate = (diff / actual.app_count) * 100;
            discrepancies.push({
                field: 'app_count',
                dashboard: dashboard.app_count,
                actual: actual.app_count,
                difference: diff,
                error_rate: Math.round(errorRate)
            });
            console.log(`❌ アプリ数不一致: Dashboard=${dashboard.app_count}, Actual=${actual.app_count} (誤差${Math.round(errorRate)}%)`);
        } else {
            console.log(`✅ アプリ数一致: ${actual.app_count}件`);
        }

        // 正常アプリ数比較
        if (dashboard.working_apps !== actual.working_apps) {
            const diff = Math.abs(dashboard.working_apps - actual.working_apps);
            discrepancies.push({
                field: 'working_apps',
                dashboard: dashboard.working_apps,
                actual: actual.working_apps,
                difference: diff
            });
            console.log(`❌ 正常アプリ数不一致: Dashboard=${dashboard.working_apps}, Actual=${actual.working_apps}`);
        } else {
            console.log(`✅ 正常アプリ数一致: ${actual.working_apps}件`);
        }

        // 成功率比較
        if (dashboard.success_rate !== actual.success_rate) {
            const diff = Math.abs(dashboard.success_rate - actual.success_rate);
            discrepancies.push({
                field: 'success_rate',
                dashboard: dashboard.success_rate,
                actual: actual.success_rate,
                difference: diff
            });
            console.log(`❌ 成功率不一致: Dashboard=${dashboard.success_rate}%, Actual=${actual.success_rate}%`);
        } else {
            console.log(`✅ 成功率一致: ${actual.success_rate}%`);
        }

        // 整合性スコア計算
        const totalFields = 3;
        const matchingFields = totalFields - discrepancies.length;
        comparison.integrity_score = Math.round((matchingFields / totalFields) * 100);
        comparison.discrepancies = discrepancies;

        console.log(`\n📊 データ整合性スコア: ${comparison.integrity_score}%`);
        console.log(`✅ 一致フィールド: ${matchingFields}/${totalFields}`);
        console.log(`❌ 不一致フィールド: ${discrepancies.length}/${totalFields}`);
    }

    /**
     * 抽出安定性テスト
     */
    testExtractionStability() {
        console.log('\n🧪 抽出安定性テスト');
        
        const dashboardPath = path.join(__dirname, '../logs/inspector-visual-dashboard.html');
        if (!fs.existsSync(dashboardPath)) {
            console.log('❌ ダッシュボードファイル未発見');
            return null;
        }

        const htmlContent = fs.readFileSync(dashboardPath, 'utf8');
        
        // 5回連続で同じ結果が出るかテスト
        const results = [];
        for (let i = 0; i < 5; i++) {
            const result = this.extractDashboardMetrics(htmlContent);
            results.push(result);
            console.log(`テスト ${i + 1}: アプリ数=${result.app_count}`);
        }

        // 一貫性確認
        const firstResult = results[0];
        const isStable = results.every(result => 
            result.app_count === firstResult.app_count &&
            result.working_apps === firstResult.working_apps &&
            result.success_rate === firstResult.success_rate
        );

        console.log(`🎯 抽出安定性: ${isStable ? '✅ 安定' : '❌ 不安定'}`);
        
        return {
            is_stable: isStable,
            test_results: results,
            consistency_rate: isStable ? 100 : 0
        };
    }

    /**
     * メイン実行
     */
    run() {
        console.log('🔍 安定メトリクス抽出テスト開始');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 1. 抽出安定性テスト
        const stabilityTest = this.testExtractionStability();
        
        // 2. 実データとの比較
        const comparison = this.compareWithActualData();
        
        // 3. 結果サマリー
        console.log('\n📋 抽出テスト結果サマリー');
        console.log('═══════════════════════════════════════');
        
        if (stabilityTest) {
            console.log(`🧪 抽出安定性: ${stabilityTest.consistency_rate}%`);
        }
        
        if (comparison.dashboard_data && comparison.actual_data) {
            console.log(`📊 データ整合性: ${comparison.integrity_score}%`);
            console.log('\n詳細比較:');
            console.log(`  📱 アプリ数: Dashboard=${comparison.dashboard_data.app_count} vs Actual=${comparison.actual_data.app_count}`);
            console.log(`  ✅ 正常アプリ: Dashboard=${comparison.dashboard_data.working_apps} vs Actual=${comparison.actual_data.working_apps}`);
            console.log(`  🌐 成功率: Dashboard=${comparison.dashboard_data.success_rate}% vs Actual=${comparison.actual_data.success_rate}%`);
        }

        // 4. 改善提案
        console.log('\n💡 抽出方法改善提案:');
        if (comparison.discrepancies && comparison.discrepancies.length > 0) {
            console.log('  ❌ 現在の抽出方法に問題あり');
            console.log('  🔧 セクション特定型抽出への移行必要');
            console.log('  📊 リアルタイム整合性チェック実装必要');
        } else {
            console.log('  ✅ 抽出方法は安定している');
        }

        return {
            stability_test: stabilityTest,
            comparison: comparison,
            overall_reliability: stabilityTest && comparison.integrity_score > 80 ? 'high' : 'low'
        };
    }
}

// 実行
if (require.main === module) {
    const extractor = new StableMetricExtractor();
    extractor.run();
}

module.exports = StableMetricExtractor;