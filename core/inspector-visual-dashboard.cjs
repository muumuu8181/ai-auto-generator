#!/usr/bin/env node

/**
 * Inspector AI Visual Dashboard Generator
 * 一瞬で全体把握できる視覚重視ダッシュボード
 */

const fs = require('fs');
const path = require('path');

class InspectorVisualDashboard {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.logsDir = path.join(this.baseDir, 'logs');
    }

    /**
     * ダッシュボード用データ収集
     */
    async collectDashboardData() {
        const data = {
            timestamp: new Date().toISOString(),
            apps: {
                published: 0,
                development: 0,
                total: 0,
                workingUrls: 0,
                brokenUrls: 0
            },
            rules: {
                totalFiles: 0,
                changesDetected: 0,
                lastSync: null
            },
            quality: {
                score: 100,
                trends: [],
                issues: 0
            },
            performance: {
                avgResponseTime: 0,
                uptimePercent: 100,
                errorRate: 0
            }
        };

        // アプリ数集計
        await this.collectAppData(data);
        
        // ルール状況
        await this.collectRuleData(data);
        
        // 品質データ
        await this.collectQualityData(data);
        
        // パフォーマンスデータ
        await this.collectPerformanceData(data);

        return data;
    }

    /**
     * アプリデータ収集
     */
    async collectAppData(data) {
        try {
            // published-apps確認
            const publishedDir = '/mnt/c/Users/user/published-apps';
            if (fs.existsSync(publishedDir)) {
                const publishedApps = fs.readdirSync(publishedDir)
                    .filter(item => item.startsWith('app-'));
                data.apps.published = publishedApps.length;
            }

            // temp-deploy確認
            const tempDeployDir = path.join(this.baseDir, 'temp-deploy');
            if (fs.existsSync(tempDeployDir)) {
                const devApps = fs.readdirSync(tempDeployDir)
                    .filter(item => item.startsWith('app-'));
                data.apps.development = devApps.length;
            }

            data.apps.total = data.apps.published + data.apps.development;

            // URL チェック結果
            const urlChecksFile = path.join(this.logsDir, 'inspector-url-checks.json');
            if (fs.existsSync(urlChecksFile)) {
                const urlChecks = JSON.parse(fs.readFileSync(urlChecksFile, 'utf8'));
                if (urlChecks.length > 0) {
                    const latest = urlChecks[0];
                    data.apps.workingUrls = latest.results.filter(r => r.accessible).length;
                    data.apps.brokenUrls = latest.results.filter(r => !r.accessible).length;
                }
            }
        } catch (error) {
            console.error('アプリデータ収集エラー:', error.message);
        }
    }

    /**
     * ルールデータ収集
     */
    async collectRuleData(data) {
        try {
            const ruleSyncFile = path.join(this.logsDir, 'inspector-rule-sync.json');
            if (fs.existsSync(ruleSyncFile)) {
                const ruleSync = JSON.parse(fs.readFileSync(ruleSyncFile, 'utf8'));
                if (ruleSync.syncHistory && ruleSync.syncHistory.length > 0) {
                    const latest = ruleSync.syncHistory[0];
                    data.rules.changesDetected = latest.changesCount || 0;
                    data.rules.lastSync = latest.timestamp;
                }
                data.rules.totalFiles = Object.keys(ruleSync.files || {}).length;
            }
        } catch (error) {
            console.error('ルールデータ収集エラー:', error.message);
        }
    }

    /**
     * 品質データ収集
     */
    async collectQualityData(data) {
        try {
            // Evidence Tracker履歴から品質スコア計算
            const evidenceDir = path.join(this.logsDir, 'inspector-evidence');
            if (fs.existsSync(evidenceDir)) {
                const historyFile = path.join(evidenceDir, 'inspection-history.md');
                if (fs.existsSync(historyFile)) {
                    // 過去のセッション数から品質傾向を計算
                    const sessionFiles = fs.readdirSync(evidenceDir)
                        .filter(file => file.startsWith('mermaid-inspector-session-'));
                    
                    data.quality.score = Math.max(85, 100 - (data.apps.brokenUrls * 5));
                    data.quality.issues = data.apps.brokenUrls + data.rules.changesDetected;
                }
            }
        } catch (error) {
            console.error('品質データ収集エラー:', error.message);
        }
    }

    /**
     * パフォーマンスデータ収集
     */
    async collectPerformanceData(data) {
        try {
            const urlChecksFile = path.join(this.logsDir, 'inspector-url-checks.json');
            if (fs.existsSync(urlChecksFile)) {
                const urlChecks = JSON.parse(fs.readFileSync(urlChecksFile, 'utf8'));
                if (urlChecks.length > 0) {
                    const latest = urlChecks[0];
                    const responseTimes = latest.results.map(r => r.responseTime);
                    data.performance.avgResponseTime = Math.round(
                        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                    );
                    data.performance.uptimePercent = Math.round(
                        (data.apps.workingUrls / (data.apps.workingUrls + data.apps.brokenUrls)) * 100
                    );
                    data.performance.errorRate = Math.round(
                        (data.apps.brokenUrls / (data.apps.workingUrls + data.apps.brokenUrls)) * 100
                    );
                }
            }
        } catch (error) {
            console.error('パフォーマンスデータ収集エラー:', error.message);
        }
    }

    /**
     * 視覚重視HTMLダッシュボード生成
     */
    generateVisualDashboard(data) {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 Inspector AI Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .dashboard-header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .dashboard-header h1 {
            color: white;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .dashboard-header .timestamp {
            color: rgba(255,255,255,0.8);
            font-size: 1.1em;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 30px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .metric-card {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .metric-card h3 {
            font-size: 1.2em;
            margin-bottom: 20px;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric-value {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #667eea;
        }
        
        .metric-value.success { color: #27ae60; }
        .metric-value.warning { color: #f39c12; }
        .metric-value.danger { color: #e74c3c; }
        
        .metric-label {
            font-size: 0.9em;
            color: #7f8c8d;
            margin-bottom: 15px;
        }
        
        .chart-container {
            position: relative;
            height: 200px;
            width: 100%;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .status-item {
            text-align: center;
            padding: 15px;
            border-radius: 10px;
            background: rgba(103, 126, 234, 0.1);
        }
        
        .status-item .number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .status-item .label {
            font-size: 0.8em;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: rgba(103, 126, 234, 0.2);
            border-radius: 5px;
            overflow: hidden;
            margin: 15px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 5px;
            transition: width 0.3s ease;
        }
        
        .alert-section {
            grid-column: 1 / -1;
            background: rgba(231, 76, 60, 0.1);
            border: 2px solid rgba(231, 76, 60, 0.3);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
        }
        
        .alert-section.success {
            background: rgba(39, 174, 96, 0.1);
            border-color: rgba(39, 174, 96, 0.3);
        }
        
        .alert-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            
            .metric-value {
                font-size: 2.5em;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1>🔍 Inspector AI Dashboard</h1>
        <div class="timestamp">最終更新: ${new Date(data.timestamp).toLocaleString('ja-JP')}</div>
    </div>
    
    <div class="dashboard-grid">
        <!-- アプリ統計 -->
        <div class="metric-card">
            <h3>📱 アプリ統計</h3>
            <div class="metric-value ${data.apps.total > 50 ? 'success' : 'warning'}">${data.apps.total}</div>
            <div class="metric-label">総アプリ数</div>
            <div class="status-grid">
                <div class="status-item">
                    <div class="number">${data.apps.published}</div>
                    <div class="label">本番デプロイ済み</div>
                </div>
                <div class="status-item">
                    <div class="number">${data.apps.development}</div>
                    <div class="label">開発中</div>
                </div>
            </div>
        </div>
        
        <!-- URL健全性 -->
        <div class="metric-card">
            <h3>🌐 URL健全性</h3>
            <div class="metric-value ${data.apps.brokenUrls === 0 ? 'success' : 'danger'}">${data.performance.uptimePercent}%</div>
            <div class="metric-label">稼働率</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${data.performance.uptimePercent}%"></div>
            </div>
            <div class="status-grid">
                <div class="status-item">
                    <div class="number">${data.apps.workingUrls}</div>
                    <div class="label">正常URL</div>
                </div>
                <div class="status-item">
                    <div class="number">${data.apps.brokenUrls}</div>
                    <div class="label">異常URL</div>
                </div>
            </div>
        </div>
        
        <!-- 品質スコア -->
        <div class="metric-card">
            <h3>⭐ 品質スコア</h3>
            <div class="metric-value ${data.quality.score >= 95 ? 'success' : data.quality.score >= 85 ? 'warning' : 'danger'}">${data.quality.score}</div>
            <div class="metric-label">総合品質</div>
            <div class="chart-container">
                <canvas id="qualityChart"></canvas>
            </div>
        </div>
        
        <!-- パフォーマンス -->
        <div class="metric-card">
            <h3>⚡ パフォーマンス</h3>
            <div class="metric-value ${data.performance.avgResponseTime < 300 ? 'success' : 'warning'}">${data.performance.avgResponseTime}ms</div>
            <div class="metric-label">平均レスポンス時間</div>
            <div class="status-grid">
                <div class="status-item">
                    <div class="number">${data.performance.errorRate}%</div>
                    <div class="label">エラー率</div>
                </div>
                <div class="status-item">
                    <div class="number">${data.rules.changesDetected}</div>
                    <div class="label">ルール変更</div>
                </div>
            </div>
        </div>
        
        <!-- ルール同期状況 -->
        <div class="metric-card">
            <h3>📋 ルール同期</h3>
            <div class="metric-value ${data.rules.changesDetected === 0 ? 'success' : 'warning'}">${data.rules.totalFiles}</div>
            <div class="metric-label">監視中ファイル数</div>
            <div class="chart-container">
                <canvas id="ruleChart"></canvas>
            </div>
        </div>
        
        <!-- システム状態 -->
        ${data.quality.issues === 0 && data.apps.brokenUrls === 0 ? 
            `<div class="alert-section success">
                <div class="alert-icon">🎉</div>
                <h2>システム全体: 正常稼働中</h2>
                <p>全てのアプリが正常に動作しており、品質スコアも高水準を維持しています。</p>
            </div>` :
            `<div class="alert-section">
                <div class="alert-icon">⚠️</div>
                <h2>注意が必要な問題: ${data.quality.issues}件</h2>
                <p>システムの一部に問題が検出されました。詳細な調査が必要です。</p>
            </div>`
        }
    </div>
    
    <script>
        // 品質チャート
        const qualityCtx = document.getElementById('qualityChart').getContext('2d');
        new Chart(qualityCtx, {
            type: 'doughnut',
            data: {
                labels: ['品質スコア', '改善余地'],
                datasets: [{
                    data: [${data.quality.score}, ${100 - data.quality.score}],
                    backgroundColor: ['#27ae60', '#ecf0f1'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
        
        // ルールチャート
        const ruleCtx = document.getElementById('ruleChart').getContext('2d');
        new Chart(ruleCtx, {
            type: 'bar',
            data: {
                labels: ['監視中', '変更検出'],
                datasets: [{
                    data: [${data.rules.totalFiles}, ${data.rules.changesDetected}],
                    backgroundColor: ['#3498db', '#e74c3c'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * ダッシュボード生成・保存
     */
    async generateDashboard() {
        console.log('🎨 Visual Dashboard: データ収集開始');
        
        const data = await this.collectDashboardData();
        const html = this.generateVisualDashboard(data);
        
        const dashboardFile = path.join(this.logsDir, 'inspector-visual-dashboard.html');
        fs.writeFileSync(dashboardFile, html);
        
        console.log(`📊 Visual Dashboard生成完了: ${path.basename(dashboardFile)}`);
        console.log(`📱 アプリ統計: 本番${data.apps.published}件, 開発${data.apps.development}件`);
        console.log(`🌐 URL健全性: ${data.performance.uptimePercent}% (${data.apps.workingUrls}/${data.apps.workingUrls + data.apps.brokenUrls})`);
        
        return {
            file: dashboardFile,
            data,
            url: `file://${dashboardFile}`
        };
    }
}

// CLI実行部分
if (require.main === module) {
    const dashboard = new InspectorVisualDashboard();
    
    dashboard.generateDashboard().then(result => {
        console.log(`✅ ダッシュボード準備完了`);
        console.log(`📄 ファイル: ${result.file}`);
    });
}

module.exports = InspectorVisualDashboard;