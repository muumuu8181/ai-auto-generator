// 💾 バックアップシステム検証アプリ - JavaScript機能実装

class BackupSystemVerifier {
    constructor() {
        this.isRunning = false;
        this.testResults = [];
        this.backupItems = [];
        this.fileList = [];
        this.stats = {
            successCount: 0,
            failureCount: 0,
            totalTests: 0,
            avgTime: 0
        };
        this.intervalId = null;
        this.monitoringInterval = 5000; // 5秒
        this.chart = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupChart();
        this.updateUI();
        this.addLog('システム初期化完了', 'success');
        
        // 監視間隔の初期化
        document.getElementById('intervalValue').textContent = 
            document.getElementById('intervalSlider').value;
    }
    
    setupEventListeners() {
        // テスト実行ボタン
        document.getElementById('quickTestBtn').addEventListener('click', () => {
            this.runQuickTest();
        });
        
        document.getElementById('fullTestBtn').addEventListener('click', () => {
            this.runFullTest();
        });
        
        document.getElementById('stressTestBtn').addEventListener('click', () => {
            this.runStressTest();
        });
        
        document.getElementById('stopTestBtn').addEventListener('click', () => {
            this.stopTest();
        });
        
        // バックアップ管理ボタン
        document.getElementById('createBackupBtn').addEventListener('click', () => {
            this.createBackup();
        });
        
        document.getElementById('restoreBtn').addEventListener('click', () => {
            this.testRestore();
        });
        
        document.getElementById('verifyBtn').addEventListener('click', () => {
            this.verifyIntegrity();
        });
        
        document.getElementById('cleanupBtn').addEventListener('click', () => {
            this.cleanup();
        });
        
        // 監視設定
        document.getElementById('realtimeToggle').addEventListener('change', (e) => {
            this.toggleRealtimeMonitoring(e.target.checked);
        });
        
        document.getElementById('autoBackupToggle').addEventListener('change', (e) => {
            this.toggleAutoBackup(e.target.checked);
        });
        
        document.getElementById('alertsToggle').addEventListener('change', (e) => {
            this.toggleAlerts(e.target.checked);
        });
        
        document.getElementById('intervalSlider').addEventListener('input', (e) => {
            this.updateInterval(e.target.value);
        });
        
        // ログ管理
        document.getElementById('clearLogBtn').addEventListener('click', () => {
            this.clearLog();
        });
        
        document.getElementById('exportLogBtn').addEventListener('click', () => {
            this.exportLog();
        });
    }
    
    setupChart() {
        const canvas = document.getElementById('statsChart');
        const ctx = canvas.getContext('2d');
        this.chartCtx = ctx;
        
        // 初期チャートの描画
        this.drawChart();
    }
    
    drawChart() {
        const ctx = this.chartCtx;
        const canvas = ctx.canvas;
        
        // キャンバスクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 背景
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // グリッド線
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        
        // 縦線
        for (let i = 0; i <= 10; i++) {
            const x = (canvas.width / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // 横線
        for (let i = 0; i <= 5; i++) {
            const y = (canvas.height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // データがある場合のグラフ描画
        if (this.testResults.length > 0) {
            this.drawTestResultsGraph(ctx, canvas);
        } else {
            // プレースホルダーテキスト
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('テスト実行後にグラフが表示されます', canvas.width / 2, canvas.height / 2);
        }
    }
    
    drawTestResultsGraph(ctx, canvas) {
        const maxResults = 20;
        const recentResults = this.testResults.slice(-maxResults);
        
        if (recentResults.length < 2) return;
        
        const stepX = canvas.width / (maxResults - 1);
        const maxTime = Math.max(...recentResults.map(r => r.time));
        
        // 成功ライン（緑）
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        recentResults.forEach((result, index) => {
            const x = index * stepX;
            const y = canvas.height - (result.success ? canvas.height * 0.8 : canvas.height * 0.2);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 応答時間ライン（青）
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        recentResults.forEach((result, index) => {
            const x = index * stepX;
            const y = canvas.height - (result.time / maxTime) * canvas.height * 0.6;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 凡例
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#10b981';
        ctx.fillText('● 成功率', 10, 20);
        
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('● 応答時間', 10, 40);
    }
    
    async runQuickTest() {
        this.setSystemStatus('running');
        this.addLog('クイックテスト開始', 'info');
        
        const startTime = Date.now();
        
        try {
            // ファイルシステムテスト
            await this.testFileSystem();
            
            // バックアップ作成テスト
            await this.testBackupCreation();
            
            // 整合性確認テスト
            await this.testIntegrityCheck();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.recordTestResult(true, duration);
            this.addLog(`クイックテスト完了 (${duration}ms)`, 'success');
            this.setSystemStatus('ready');
            
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.recordTestResult(false, duration);
            this.addLog(`クイックテスト失敗: ${error.message}`, 'error');
            this.setSystemStatus('error');
        }
    }
    
    async runFullTest() {
        this.setSystemStatus('running');
        this.addLog('完全テスト開始', 'info');
        
        const startTime = Date.now();
        
        try {
            // 全機能のテスト
            await this.testFileSystem();
            await this.testBackupCreation();
            await this.testRestore();
            await this.testIntegrityCheck();
            await this.testMD5Verification();
            await this.testAutoRecovery();
            await this.testFormatParsing();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.recordTestResult(true, duration);
            this.addLog(`完全テスト完了 (${duration}ms)`, 'success');
            this.setSystemStatus('ready');
            
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.recordTestResult(false, duration);
            this.addLog(`完全テスト失敗: ${error.message}`, 'error');
            this.setSystemStatus('error');
        }
    }
    
    async runStressTest() {
        this.setSystemStatus('running');
        this.addLog('ストレステスト開始', 'warning');
        this.isRunning = true;
        
        let testCount = 0;
        const maxTests = 50;
        
        while (this.isRunning && testCount < maxTests) {
            const startTime = Date.now();
            
            try {
                await this.simulateHighLoad();
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                this.recordTestResult(true, duration);
                this.addLog(`ストレステスト #${testCount + 1} 完了`, 'info');
                
            } catch (error) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                this.recordTestResult(false, duration);
                this.addLog(`ストレステスト #${testCount + 1} 失敗: ${error.message}`, 'error');
            }
            
            testCount++;
            await this.sleep(100); // 100ms待機
        }
        
        this.isRunning = false;
        this.setSystemStatus('ready');
        this.addLog(`ストレステスト完了 (${testCount}回実行)`, 'success');
    }
    
    stopTest() {
        this.isRunning = false;
        this.setSystemStatus('ready');
        this.addLog('テスト停止', 'warning');
    }
    
    async createBackup() {
        this.addLog('バックアップ作成開始', 'info');
        
        try {
            const backupId = this.generateBackupId();
            const timestamp = new Date().toISOString();
            
            // 模擬バックアップデータ
            const backupData = {
                id: backupId,
                timestamp: timestamp,
                files: this.generateMockFiles(),
                size: Math.random() * 1000 + 100, // MB
                md5: this.generateMD5Hash(),
                status: 'completed'
            };
            
            this.backupItems.unshift(backupData);
            this.updateBackupList();
            
            await this.sleep(2000); // 2秒の模擬処理時間
            
            this.addLog(`バックアップ作成完了: ${backupId}`, 'success');
            
        } catch (error) {
            this.addLog(`バックアップ作成失敗: ${error.message}`, 'error');
        }
    }
    
    async testRestore() {
        this.addLog('復元テスト開始', 'info');
        
        try {
            await this.sleep(1500);
            
            if (this.backupItems.length === 0) {
                throw new Error('復元可能なバックアップがありません');
            }
            
            const latestBackup = this.backupItems[0];
            this.addLog(`復元テスト完了: ${latestBackup.id}`, 'success');
            
        } catch (error) {
            this.addLog(`復元テスト失敗: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async verifyIntegrity() {
        this.addLog('整合性確認開始', 'info');
        
        try {
            for (const backup of this.backupItems) {
                const verified = await this.verifyBackupIntegrity(backup);
                
                if (verified) {
                    this.addLog(`整合性確認成功: ${backup.id}`, 'success');
                } else {
                    this.addLog(`整合性確認失敗: ${backup.id}`, 'error');
                }
                
                await this.sleep(500);
            }
            
        } catch (error) {
            this.addLog(`整合性確認エラー: ${error.message}`, 'error');
        }
    }
    
    cleanup() {
        this.backupItems = [];
        this.updateBackupList();
        this.addLog('クリーンアップ完了', 'success');
    }
    
    toggleRealtimeMonitoring(enabled) {
        if (enabled) {
            this.startRealtimeMonitoring();
            this.addLog('リアルタイム監視開始', 'info');
        } else {
            this.stopRealtimeMonitoring();
            this.addLog('リアルタイム監視停止', 'info');
        }
    }
    
    startRealtimeMonitoring() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(() => {
            this.performMonitoringCheck();
        }, this.monitoringInterval);
    }
    
    stopRealtimeMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    toggleAutoBackup(enabled) {
        this.addLog(`自動バックアップ: ${enabled ? '有効' : '無効'}`, 'info');
        
        if (enabled) {
            // 自動バックアップの開始（デモ用）
            setTimeout(() => {
                this.createBackup();
            }, 10000); // 10秒後に実行
        }
    }
    
    toggleAlerts(enabled) {
        this.addLog(`アラート通知: ${enabled ? '有効' : '無効'}`, 'info');
    }
    
    updateInterval(value) {
        this.monitoringInterval = value * 1000;
        document.getElementById('intervalValue').textContent = value;
        
        // リアルタイム監視が有効な場合は再開
        if (this.intervalId) {
            this.stopRealtimeMonitoring();
            this.startRealtimeMonitoring();
        }
        
        this.addLog(`監視間隔を${value}秒に変更`, 'info');
    }
    
    performMonitoringCheck() {
        // 模擬ファイル変更検出
        const changeDetected = Math.random() > 0.7;
        
        if (changeDetected) {
            this.fileList.push({
                name: `file_${Date.now()}.txt`,
                status: Math.random() > 0.5 ? 'modified' : 'created',
                timestamp: new Date().toLocaleTimeString()
            });
            
            this.updateFileList();
            this.addLog('ファイル変更を検出', 'warning');
        }
    }
    
    clearLog() {
        document.getElementById('systemLog').innerHTML = '';
        this.addLog('ログをクリアしました', 'info');
    }
    
    exportLog() {
        const logContainer = document.getElementById('systemLog');
        const logText = logContainer.innerText;
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_system_log_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.addLog('ログをエクスポートしました', 'success');
    }
    
    // ヘルパー関数
    async testFileSystem() {
        await this.sleep(500);
        if (Math.random() > 0.1) { // 90%成功率
            return true;
        }
        throw new Error('ファイルシステムアクセスエラー');
    }
    
    async testBackupCreation() {
        await this.sleep(800);
        if (Math.random() > 0.05) { // 95%成功率
            return true;
        }
        throw new Error('バックアップ作成エラー');
    }
    
    async testIntegrityCheck() {
        await this.sleep(600);
        if (Math.random() > 0.08) { // 92%成功率
            return true;
        }
        throw new Error('整合性チェックエラー');
    }
    
    async testMD5Verification() {
        await this.sleep(700);
        if (Math.random() > 0.03) { // 97%成功率
            return true;
        }
        throw new Error('MD5検証エラー');
    }
    
    async testAutoRecovery() {
        await this.sleep(900);
        if (Math.random() > 0.15) { // 85%成功率
            return true;
        }
        throw new Error('自動復旧エラー');
    }
    
    async testFormatParsing() {
        await this.sleep(400);
        if (Math.random() > 0.02) { // 98%成功率
            return true;
        }
        throw new Error('フォーマット解析エラー');
    }
    
    async simulateHighLoad() {
        await this.sleep(Math.random() * 500 + 200);
        if (Math.random() > 0.2) { // 80%成功率（ストレス環境）
            return true;
        }
        throw new Error('高負荷テストエラー');
    }
    
    async verifyBackupIntegrity(backup) {
        await this.sleep(300);
        return Math.random() > 0.1; // 90%成功率
    }
    
    recordTestResult(success, time) {
        this.testResults.push({
            success,
            time,
            timestamp: Date.now()
        });
        
        // 統計更新
        if (success) {
            this.stats.successCount++;
        } else {
            this.stats.failureCount++;
        }
        this.stats.totalTests++;
        
        // 平均時間計算
        const totalTime = this.testResults.reduce((sum, result) => sum + result.time, 0);
        this.stats.avgTime = Math.round(totalTime / this.testResults.length);
        
        this.updateStats();
        this.updateTestResults();
        this.drawChart();
    }
    
    setSystemStatus(status) {
        const statusElement = document.getElementById('systemStatus');
        statusElement.className = `status ${status}`;
        
        const statusText = {
            ready: '準備完了',
            running: '実行中',
            error: 'エラー'
        };
        
        statusElement.textContent = statusText[status] || status;
        
        // 最終テスト時刻更新
        if (status === 'ready') {
            document.getElementById('lastTest').textContent = new Date().toLocaleTimeString();
        }
    }
    
    updateStats() {
        document.getElementById('successCount').textContent = this.stats.successCount;
        document.getElementById('failureCount').textContent = this.stats.failureCount;
        document.getElementById('totalTests').textContent = this.stats.totalTests;
        document.getElementById('avgTime').textContent = `${this.stats.avgTime}ms`;
        
        // 成功率計算
        const successRate = this.stats.totalTests > 0 
            ? Math.round((this.stats.successCount / this.stats.totalTests) * 100)
            : 0;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }
    
    updateTestResults() {
        const resultsContainer = document.getElementById('testResults');
        resultsContainer.innerHTML = '';
        
        const recentResults = this.testResults.slice(-10).reverse();
        
        recentResults.forEach((result, index) => {
            const resultElement = document.createElement('div');
            resultElement.className = `log-entry ${result.success ? 'success' : 'error'}`;
            resultElement.innerHTML = `
                <div>テスト #${this.testResults.length - index}</div>
                <div>${result.success ? '成功' : '失敗'} (${result.time}ms)</div>
                <div>${new Date(result.timestamp).toLocaleTimeString()}</div>
            `;
            resultsContainer.appendChild(resultElement);
        });
    }
    
    updateBackupList() {
        const backupContainer = document.getElementById('backupList');
        backupContainer.innerHTML = '';
        
        this.backupItems.forEach(backup => {
            const backupElement = document.createElement('div');
            backupElement.className = 'log-entry success';
            backupElement.innerHTML = `
                <div><strong>${backup.id}</strong></div>
                <div>${backup.size.toFixed(1)} MB</div>
                <div>${new Date(backup.timestamp).toLocaleString()}</div>
                <div>MD5: ${backup.md5.substring(0, 8)}...</div>
            `;
            backupContainer.appendChild(backupElement);
        });
    }
    
    updateFileList() {
        const fileContainer = document.getElementById('fileList');
        fileContainer.innerHTML = '';
        
        const recentFiles = this.fileList.slice(-15).reverse();
        
        recentFiles.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = `log-entry ${file.status === 'created' ? 'success' : 'warning'}`;
            fileElement.innerHTML = `
                <div><strong>${file.name}</strong></div>
                <div>${file.status === 'created' ? '作成' : '変更'}</div>
                <div>${file.timestamp}</div>
            `;
            fileContainer.appendChild(fileElement);
        });
    }
    
    updateUI() {
        this.updateStats();
        this.updateTestResults();
        this.updateBackupList();
        this.updateFileList();
    }
    
    addLog(message, type = 'info') {
        const logContainer = document.getElementById('systemLog');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span>[${new Date().toLocaleTimeString()}]</span>
            <span>${message}</span>
        `;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // 最大ログ数制限
        const maxLogs = 100;
        while (logContainer.children.length > maxLogs) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
    
    generateBackupId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BKP-';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    generateMD5Hash() {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    generateMockFiles() {
        const fileTypes = ['.txt', '.json', '.md', '.js', '.css', '.html'];
        const files = [];
        const count = Math.floor(Math.random() * 20) + 5;
        
        for (let i = 0; i < count; i++) {
            files.push({
                name: `file_${i}${fileTypes[Math.floor(Math.random() * fileTypes.length)]}`,
                size: Math.floor(Math.random() * 1000) + 1
            });
        }
        
        return files;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// アプリケーション初期化
let backupVerifier;

document.addEventListener('DOMContentLoaded', () => {
    backupVerifier = new BackupSystemVerifier();
    
    // 初期設定
    document.getElementById('realtimeToggle').checked = true;
    document.getElementById('autoBackupToggle').checked = true;
    document.getElementById('alertsToggle').checked = true;
    
    // リアルタイム監視の自動開始
    backupVerifier.toggleRealtimeMonitoring(true);
    
    console.log('💾 バックアップシステム検証アプリ - 初期化完了！');
});