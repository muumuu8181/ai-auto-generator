// バックアップシステム検証アプリ - JavaScript

class BackupVerificationSystem {
    constructor() {
        this.isRunning = false;
        this.testData = {
            success: 0,
            failure: 0,
            processing: 0,
            total: 0
        };
        this.logs = [];
        this.backupFiles = [];
        this.charts = {
            success: null,
            time: null
        };
        this.progressValue = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.loadSampleData();
        this.startLogSimulation();
        this.log('info', 'バックアップシステム検証アプリが初期化されました');
    }

    setupEventListeners() {
        document.getElementById('startTest').addEventListener('click', () => this.startTest());
        document.getElementById('stopTest').addEventListener('click', () => this.stopTest());
        document.getElementById('clearLogs').addEventListener('click', () => this.clearLogs());
    }

    initializeCharts() {
        // 成功率チャート
        const successCanvas = document.getElementById('successChart');
        const successCtx = successCanvas.getContext('2d');
        this.charts.success = { canvas: successCanvas, ctx: successCtx };

        // 処理時間チャート
        const timeCanvas = document.getElementById('timeChart');
        const timeCtx = timeCanvas.getContext('2d');
        this.charts.time = { canvas: timeCanvas, ctx: timeCtx };

        this.updateCharts();
    }

    loadSampleData() {
        // サンプルバックアップファイルデータ
        const sampleFiles = [
            {
                date: '2025-07-26 07:00:00',
                filename: 'backup_20250726_070000.zip',
                size: '2.4MB',
                md5: 'a1b2c3d4e5f6789012345678901234567890',
                status: 'success'
            },
            {
                date: '2025-07-26 06:00:00',
                filename: 'backup_20250726_060000.zip',
                size: '2.3MB',
                md5: 'b2c3d4e5f6789012345678901234567890a1',
                status: 'success'
            },
            {
                date: '2025-07-26 05:00:00',
                filename: 'backup_20250726_050000.zip',
                size: '2.5MB',
                md5: 'c3d4e5f6789012345678901234567890a1b2',
                status: 'failure'
            },
            {
                date: '2025-07-26 04:00:00',
                filename: 'backup_20250726_040000.zip',
                size: '2.2MB',
                md5: 'd4e5f6789012345678901234567890a1b2c3',
                status: 'success'
            }
        ];

        this.backupFiles = sampleFiles;
        this.updateBackupTable();
    }

    updateBackupTable() {
        const tbody = document.getElementById('backupTableBody');
        tbody.innerHTML = '';

        this.backupFiles.forEach((file, index) => {
            const row = document.createElement('tr');
            const statusIcon = file.status === 'success' ? '✅' : file.status === 'failure' ? '❌' : '⏳';
            const statusClass = file.status === 'success' ? 'success' : file.status === 'failure' ? 'failure' : 'processing';
            
            row.innerHTML = `
                <td>${file.date}</td>
                <td>${file.filename}</td>
                <td>${file.size}</td>
                <td><code style="font-size: 0.8rem;">${file.md5.substring(0, 16)}...</code></td>
                <td><span class="test-status ${statusClass}">${statusIcon} ${file.status}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="backupSystem.verifyFile(${index})">
                        🔍 検証
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async startTest() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.log('info', '🚀 バックアップ検証テストを開始します');
        
        document.getElementById('startTest').disabled = true;
        document.getElementById('stopTest').disabled = false;

        // プログレスリセット
        this.progressValue = 0;
        this.updateProgress();

        // 各テストセクションを順次実行
        await this.runFileMonitorTest();
        await this.runMD5CheckTest();
        await this.runFormatAnalysisTest();
        await this.runRecoveryTest();

        this.log('success', '✅ 全てのバックアップ検証テストが完了しました');
        
        document.getElementById('startTest').disabled = false;
        document.getElementById('stopTest').disabled = true;
        this.isRunning = false;
    }

    stopTest() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.log('warning', '⏹️ バックアップ検証テストが停止されました');
        
        document.getElementById('startTest').disabled = false;
        document.getElementById('stopTest').disabled = true;
    }

    async runFileMonitorTest() {
        const items = document.querySelectorAll('#fileMonitor .test-item');
        this.log('info', '🔍 ファイル監視テストを開始');

        for (let i = 0; i < items.length; i++) {
            if (!this.isRunning) break;
            
            const item = items[i];
            const statusSpan = item.querySelector('.test-status');
            
            // 処理中状態
            item.className = 'test-item processing';
            statusSpan.textContent = '監視中...';
            this.testData.processing++;
            this.updateCounters();
            
            await this.delay(1000 + Math.random() * 2000);
            
            // 結果判定（90%成功率）
            const success = Math.random() > 0.1;
            if (success) {
                item.className = 'test-item success';
                statusSpan.textContent = '✅ 正常';
                this.testData.success++;
                this.log('success', `✅ ${item.querySelector('.test-name').textContent} - 監視正常`);
            } else {
                item.className = 'test-item failure';
                statusSpan.textContent = '❌ 異常';
                this.testData.failure++;
                this.log('error', `❌ ${item.querySelector('.test-name').textContent} - 監視異常検出`);
            }
            
            this.testData.processing--;
            this.testData.total++;
            this.updateCounters();
            this.progressValue += 25 / items.length;
            this.updateProgress();
        }
    }

    async runMD5CheckTest() {
        const items = document.querySelectorAll('#md5Check .test-item');
        this.log('info', '🔐 MD5整合性確認テストを開始');

        for (let i = 0; i < items.length; i++) {
            if (!this.isRunning) break;
            
            const item = items[i];
            const statusSpan = item.querySelector('.test-status');
            const detailSpan = item.querySelector('.test-detail');
            
            // 処理中状態
            item.className = 'test-item processing';
            statusSpan.textContent = 'MD5計算中...';
            this.testData.processing++;
            this.updateCounters();
            
            await this.delay(1500 + Math.random() * 2500);
            
            // MD5ハッシュ生成（模擬）
            const mockMD5 = this.generateMockMD5();
            detailSpan.textContent = `MD5: ${mockMD5.substring(0, 8)}...`;
            
            // 結果判定（95%成功率）
            const success = Math.random() > 0.05;
            if (success) {
                item.className = 'test-item success';
                statusSpan.textContent = '✅ 一致';
                this.testData.success++;
                this.log('success', `✅ ${item.querySelector('.test-name').textContent} - MD5整合性確認完了`);
            } else {
                item.className = 'test-item failure';
                statusSpan.textContent = '❌ 不一致';
                this.testData.failure++;
                this.log('error', `❌ ${item.querySelector('.test-name').textContent} - MD5不一致エラー`);
            }
            
            this.testData.processing--;
            this.testData.total++;
            this.updateCounters();
            this.progressValue += 25 / items.length;
            this.updateProgress();
        }
    }

    async runFormatAnalysisTest() {
        const items = document.querySelectorAll('#formatAnalysis .test-item');
        this.log('info', '📝 形式解析テストを開始');

        for (let i = 0; i < items.length; i++) {
            if (!this.isRunning) break;
            
            const item = items[i];
            const statusSpan = item.querySelector('.test-status');
            const detailSpan = item.querySelector('.test-detail');
            
            // 処理中状態
            item.className = 'test-item processing';
            statusSpan.textContent = '解析中...';
            this.testData.processing++;
            this.updateCounters();
            
            await this.delay(800 + Math.random() * 1200);
            
            // 結果判定（85%成功率）
            const success = Math.random() > 0.15;
            if (success) {
                item.className = 'test-item success';
                statusSpan.textContent = '✅ 正常';
                this.testData.success++;
                const fileName = detailSpan.textContent;
                this.log('success', `✅ ${fileName} - 形式解析成功`);
            } else {
                item.className = 'test-item failure';
                statusSpan.textContent = '❌ エラー';
                this.testData.failure++;
                const fileName = detailSpan.textContent;
                this.log('error', `❌ ${fileName} - 形式解析エラー`);
            }
            
            this.testData.processing--;
            this.testData.total++;
            this.updateCounters();
            this.progressValue += 25 / items.length;
            this.updateProgress();
        }
    }

    async runRecoveryTest() {
        const items = document.querySelectorAll('#recoveryTest .test-item');
        this.log('info', '🔄 自動復旧機能テストを開始');

        for (let i = 0; i < items.length; i++) {
            if (!this.isRunning) break;
            
            const item = items[i];
            const statusSpan = item.querySelector('.test-status');
            const detailSpan = item.querySelector('.test-detail');
            
            // 処理中状態
            item.className = 'test-item processing';
            statusSpan.textContent = '復旧中...';
            this.testData.processing++;
            this.updateCounters();
            
            await this.delay(2000 + Math.random() * 3000);
            
            // 結果判定（80%成功率）
            const success = Math.random() > 0.2;
            if (success) {
                item.className = 'test-item success';
                statusSpan.textContent = '✅ 成功';
                this.testData.success++;
                
                // 詳細情報更新
                if (i === 0) detailSpan.textContent = '失われたファイル: 0個';
                else if (i === 1) detailSpan.textContent = `復旧時間: ${(Math.random() * 5 + 1).toFixed(1)}s`;
                else detailSpan.textContent = 'MD5チェック: 正常';
                
                this.log('success', `✅ ${item.querySelector('.test-name').textContent} - 復旧成功`);
            } else {
                item.className = 'test-item failure';
                statusSpan.textContent = '❌ 失敗';
                this.testData.failure++;
                
                // エラー詳細情報
                if (i === 0) detailSpan.textContent = '失われたファイル: 3個';
                else if (i === 1) detailSpan.textContent = '復旧時間: タイムアウト';
                else detailSpan.textContent = 'MD5チェック: 異常';
                
                this.log('error', `❌ ${item.querySelector('.test-name').textContent} - 復旧失敗`);
            }
            
            this.testData.processing--;
            this.testData.total++;
            this.updateCounters();
            this.progressValue += 25 / items.length;
            this.updateProgress();
        }
    }

    updateCounters() {
        document.getElementById('successCount').textContent = this.testData.success;
        document.getElementById('failureCount').textContent = this.testData.failure;
        document.getElementById('processingCount').textContent = this.testData.processing;
        document.getElementById('totalCount').textContent = this.testData.total;
        
        this.updateCharts();
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = `${this.progressValue}%`;
        progressText.textContent = `${Math.round(this.progressValue)}%`;
    }

    updateCharts() {
        this.drawSuccessChart();
        this.drawTimeChart();
    }

    drawSuccessChart() {
        const { canvas, ctx } = this.charts.success;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 背景
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
        
        const total = this.testData.success + this.testData.failure;
        if (total === 0) return;
        
        const successRate = this.testData.success / total;
        const failureRate = 1 - successRate;
        
        // 成功部分（緑）
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, height - (successRate * height), width, successRate * height);
        
        // 失敗部分（赤）
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 0, width, failureRate * height);
        
        // パーセンテージ表示
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(successRate * 100)}%`, width / 2, height / 2 + 5);
    }

    drawTimeChart() {
        const { canvas, ctx } = this.charts.time;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // 背景
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
        
        // サンプル時間データ
        const timeData = [1.2, 2.1, 0.8, 3.2, 1.5, 2.8, 1.9, 2.4];
        const maxTime = Math.max(...timeData);
        const barWidth = width / timeData.length;
        
        // バー描画
        timeData.forEach((time, index) => {
            const barHeight = (time / maxTime) * height * 0.8;
            const x = index * barWidth;
            const y = height - barHeight;
            
            // グラデーション
            const gradient = ctx.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#1e40af');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
            
            // 時間表示
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${time}s`, x + barWidth / 2, y - 5);
        });
    }

    log(level, message) {
        const timestamp = new Date().toLocaleString('ja-JP');
        const logEntry = { timestamp, level, message };
        this.logs.unshift(logEntry);
        
        // ログ数制限（最新100件）
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
        }
        
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logContainer = document.getElementById('logContainer');
        
        // 最新10件のみ表示
        const recentLogs = this.logs.slice(0, 10);
        logContainer.innerHTML = recentLogs.map(log => `
            <div class="log-entry ${log.level}">
                <span class="log-time">${log.timestamp}</span>
                <span class="log-level">${log.level.toUpperCase()}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
        
        // 自動スクロール
        logContainer.scrollTop = 0;
    }

    clearLogs() {
        this.logs = [];
        this.updateLogDisplay();
        this.log('info', 'ログがクリアされました');
    }

    generateMockMD5() {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async verifyFile(index) {
        const file = this.backupFiles[index];
        this.log('info', `🔍 ${file.filename} の検証を開始`);
        
        // 検証シミュレーション
        await this.delay(2000);
        
        const success = Math.random() > 0.1;
        if (success) {
            this.log('success', `✅ ${file.filename} - 検証成功`);
        } else {
            this.log('error', `❌ ${file.filename} - 検証失敗`);
        }
    }

    startLogSimulation() {
        // 定期的にシステムログを生成
        setInterval(() => {
            if (Math.random() > 0.7) {
                const messages = [
                    'システム状態正常',
                    'バックアップファイル作成完了',
                    'MD5チェックサム計算完了',
                    'ファイル監視継続中',
                    'データベース同期完了'
                ];
                const message = messages[Math.floor(Math.random() * messages.length)];
                this.log('info', `📊 ${message}`);
            }
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// アプリケーション初期化
let backupSystem;
document.addEventListener('DOMContentLoaded', () => {
    backupSystem = new BackupVerificationSystem();
});

// ボタンの追加監視
document.addEventListener('DOMContentLoaded', () => {
    // ワンクリックテスト実行ボタンの機能確認
    const startBtn = document.getElementById('startTest');
    if (startBtn) {
        // 動作確認用のコメント
        console.log('🚀 ワンクリックテスト実行ボタンが正常に配置されました');
    }
});

// エクスポート機能（将来の拡張用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackupVerificationSystem };
}