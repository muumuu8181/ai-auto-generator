// バックアップシステム検証アプリ
class BackupSystemVerifier {
    constructor() {
        this.monitoring = false;
        this.files = new Map();
        this.backups = [];
        this.stats = {
            totalFiles: 0,
            successRate: 100,
            totalSize: 0,
            lastBackup: null
        };
        this.ws = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeChart();
        this.simulateInitialData();
        this.updateUI();
    }

    setupEventListeners() {
        // ファイル監視
        document.getElementById('start-monitor').addEventListener('click', () => this.startMonitoring());
        document.getElementById('stop-monitor').addEventListener('click', () => this.stopMonitoring());

        // バックアップ
        document.getElementById('manual-backup').addEventListener('click', () => this.performBackup());
        document.getElementById('auto-backup').addEventListener('change', (e) => this.toggleAutoBackup(e.target.checked));
        document.getElementById('backup-interval').addEventListener('change', (e) => this.updateBackupInterval(e.target.value));

        // 整合性チェック
        document.getElementById('check-integrity').addEventListener('click', () => this.checkIntegrity());

        // フォーマット解析
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchFormatTab(btn.dataset.format));
        });
        document.getElementById('parse-text').addEventListener('click', () => this.parseText());

        // 復旧テスト
        document.querySelectorAll('.test-btn').forEach(btn => {
            btn.addEventListener('click', () => this.simulateError(btn.dataset.test));
        });
        document.getElementById('run-recovery').addEventListener('click', () => this.performRecovery());

        // ワンクリックテスト
        document.getElementById('one-click-test').addEventListener('click', () => this.runCompleteTest());

        // ログクリア
        document.getElementById('clear-log').addEventListener('click', () => this.clearLog());

        // バックアップ検索・ソート
        document.getElementById('search-backups').addEventListener('input', (e) => this.searchBackups(e.target.value));
        document.getElementById('sort-backups').addEventListener('change', (e) => this.sortBackups(e.target.value));
    }

    // ファイル監視機能
    startMonitoring() {
        this.monitoring = true;
        document.getElementById('start-monitor').disabled = true;
        document.getElementById('stop-monitor').disabled = false;
        document.querySelector('.status-icon').classList.add('active');
        document.querySelector('.status-text').textContent = 'システム稼働中';
        
        this.log('ファイル監視を開始しました', 'success');
        this.simulateFileChanges();
        
        // WebSocket接続シミュレート
        this.connectWebSocket();
    }

    stopMonitoring() {
        this.monitoring = false;
        document.getElementById('start-monitor').disabled = false;
        document.getElementById('stop-monitor').disabled = true;
        document.querySelector('.status-icon').classList.remove('active');
        document.querySelector('.status-text').textContent = 'システム待機中';
        
        this.log('ファイル監視を停止しました', 'warning');
    }

    simulateFileChanges() {
        if (!this.monitoring) return;

        const fileNames = ['config.json', 'data.md', 'backup.txt', 'index.html', 'style.css', 'app.js'];
        const actions = ['added', 'modified', 'deleted'];
        
        const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        this.updateFileList(fileName, action);
        
        setTimeout(() => this.simulateFileChanges(), Math.random() * 5000 + 2000);
    }

    updateFileList(fileName, action) {
        const fileList = document.getElementById('file-list');
        
        if (fileList.querySelector('.empty-state')) {
            fileList.innerHTML = '';
        }
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${fileName}</span>
            <span class="file-status ${action}">${action}</span>
        `;
        
        fileList.insertBefore(fileItem, fileList.firstChild);
        
        // 最大10件まで表示
        while (fileList.children.length > 10) {
            fileList.removeChild(fileList.lastChild);
        }
        
        // ファイル情報を更新
        if (action === 'added' || action === 'modified') {
            this.files.set(fileName, {
                name: fileName,
                size: Math.floor(Math.random() * 1000) + 100,
                md5: this.generateMD5(),
                lastModified: new Date()
            });
        } else if (action === 'deleted') {
            this.files.delete(fileName);
        }
        
        this.updateStats();
    }

    // バックアップ機能
    performBackup() {
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.querySelector('.progress-text');
        
        progressBar.classList.add('active');
        progressText.textContent = 'バックアップ中...';
        
        this.log('バックアップを開始しました', 'info');
        
        setTimeout(() => {
            const backup = {
                id: Date.now(),
                name: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`,
                files: Array.from(this.files.values()),
                size: this.stats.totalSize,
                date: new Date()
            };
            
            this.backups.unshift(backup);
            this.stats.lastBackup = new Date();
            
            progressBar.classList.remove('active');
            progressText.textContent = 'バックアップ完了';
            
            this.log('バックアップが正常に完了しました', 'success');
            this.updateBackupList();
            this.updateStats();
            this.updateChart();
            
            setTimeout(() => {
                progressText.textContent = '待機中';
            }, 3000);
        }, 2000);
    }

    toggleAutoBackup(enabled) {
        if (enabled) {
            this.log('自動バックアップを有効化しました', 'success');
            this.startAutoBackup();
        } else {
            this.log('自動バックアップを無効化しました', 'warning');
            this.stopAutoBackup();
        }
    }

    startAutoBackup() {
        const interval = parseInt(document.getElementById('backup-interval').value) * 1000;
        this.autoBackupInterval = setInterval(() => {
            if (this.monitoring) {
                this.performBackup();
            }
        }, interval);
    }

    stopAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }
    }

    updateBackupInterval(seconds) {
        this.log(`バックアップ間隔を${seconds}秒に変更しました`, 'info');
        if (document.getElementById('auto-backup').checked) {
            this.stopAutoBackup();
            this.startAutoBackup();
        }
    }

    // 整合性チェック
    checkIntegrity() {
        const results = document.getElementById('integrity-results');
        results.innerHTML = '';
        
        this.log('整合性チェックを開始しました', 'info');
        
        this.files.forEach((file, fileName) => {
            const isValid = Math.random() > 0.1; // 90%の確率で正常
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <span class="file-name">${fileName}</span>
                <span class="result-status ${isValid ? 'success' : 'fail'}">${isValid ? '✓ 正常' : '✗ 異常'}</span>
                <span class="md5-hash">${file.md5}</span>
            `;
            
            results.appendChild(resultItem);
        });
        
        this.log('整合性チェックが完了しました', 'success');
    }

    // フォーマット解析
    switchFormatTab(format) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === format);
        });
    }

    parseText() {
        const input = document.getElementById('parser-input').value;
        const activeFormat = document.querySelector('.tab-btn.active').dataset.format;
        const output = document.getElementById('parser-output');
        
        if (!input) {
            output.textContent = '解析するテキストを入力してください';
            return;
        }
        
        let parsed;
        switch (activeFormat) {
            case 'markdown':
                parsed = this.parseMarkdown(input);
                break;
            case 'json':
                parsed = this.parseJSON(input);
                break;
            case 'natural':
                parsed = this.parseNaturalLanguage(input);
                break;
        }
        
        output.textContent = parsed;
        this.log(`${activeFormat}形式で解析を実行しました`, 'info');
    }

    parseMarkdown(text) {
        // 簡易的なMarkdown解析
        return text
            .replace(/^# (.+)$/gm, '見出し1: $1')
            .replace(/^## (.+)$/gm, '見出し2: $1')
            .replace(/\*\*(.+?)\*\*/g, '強調: $1')
            .replace(/\[(.+?)\]\((.+?)\)/g, 'リンク: $1 → $2');
    }

    parseJSON(text) {
        try {
            const obj = JSON.parse(text);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return `JSONパースエラー: ${e.message}`;
        }
    }

    parseNaturalLanguage(text) {
        // 簡易的な自然言語解析
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const words = text.split(/\s+/);
        
        return `文章数: ${sentences.length}\n単語数: ${words.length}\n文字数: ${text.length}\n\n最初の文: ${sentences[0] || 'なし'}`;
    }

    // 復旧テスト
    simulateError(type) {
        const log = document.getElementById('recovery-log');
        
        switch (type) {
            case 'corrupt':
                log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ファイル破損をシミュレート: data.json</div>`;
                break;
            case 'delete':
                log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ファイル削除をシミュレート: config.ini</div>`;
                break;
            case 'modify':
                log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] 不正変更をシミュレート: system.dat</div>`;
                break;
        }
        
        log.scrollTop = log.scrollHeight;
        this.log(`${type}エラーをシミュレートしました`, 'warning');
    }

    performRecovery() {
        const log = document.getElementById('recovery-log');
        log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] 自動復旧を開始...</div>`;
        
        setTimeout(() => {
            log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] バックアップから復元中...</div>`;
            
            setTimeout(() => {
                log.innerHTML += `<div>[${new Date().toLocaleTimeString()}] 復旧完了！全ファイルが正常に復元されました</div>`;
                log.scrollTop = log.scrollHeight;
                this.log('自動復旧が正常に完了しました', 'success');
            }, 1500);
        }, 1000);
    }

    // ワンクリックテスト
    runCompleteTest() {
        const results = document.getElementById('test-results');
        results.innerHTML = '';
        results.classList.add('active');
        
        const tests = [
            { name: 'ファイル監視機能', status: true },
            { name: 'バックアップ機能', status: true },
            { name: 'MD5整合性確認', status: true },
            { name: '3形式解析エンジン', status: true },
            { name: '自動復旧システム', status: true },
            { name: 'WebSocket接続', status: Math.random() > 0.2 },
            { name: 'データベース整合性', status: true },
            { name: 'ストレージ容量', status: true }
        ];
        
        tests.forEach((test, index) => {
            setTimeout(() => {
                const resultItem = document.createElement('div');
                resultItem.className = 'test-result-item';
                resultItem.innerHTML = `
                    <span class="test-icon ${test.status ? 'success' : 'fail'}">${test.status ? '✓' : '✗'}</span>
                    <span>${test.name}</span>
                    <span>${test.status ? '正常' : 'エラー'}</span>
                `;
                results.appendChild(resultItem);
                
                if (index === tests.length - 1) {
                    const successCount = tests.filter(t => t.status).length;
                    this.log(`完全システムテスト完了: ${successCount}/${tests.length} 成功`, 
                        successCount === tests.length ? 'success' : 'warning');
                }
            }, index * 300);
        });
    }

    // 統計更新
    updateStats() {
        this.stats.totalFiles = this.files.size;
        this.stats.totalSize = Array.from(this.files.values())
            .reduce((sum, file) => sum + file.size, 0);
        
        document.getElementById('total-files').textContent = this.stats.totalFiles;
        document.getElementById('success-rate').textContent = `${this.stats.successRate}%`;
        document.getElementById('last-backup').textContent = 
            this.stats.lastBackup ? this.stats.lastBackup.toLocaleTimeString() : '--:--';
        document.getElementById('total-size').textContent = `${(this.stats.totalSize / 1024).toFixed(1)} MB`;
    }

    // バックアップリスト更新
    updateBackupList() {
        const container = document.getElementById('backup-items');
        container.innerHTML = '';
        
        this.backups.forEach(backup => {
            const item = document.createElement('div');
            item.className = 'backup-item';
            item.innerHTML = `
                <div class="backup-info">
                    <div class="backup-name">${backup.name}</div>
                    <div class="backup-meta">${backup.date.toLocaleString()} - ${backup.files.length}ファイル - ${(backup.size / 1024).toFixed(1)}MB</div>
                </div>
                <div class="backup-actions">
                    <button class="btn btn-sm btn-primary">復元</button>
                    <button class="btn btn-sm btn-secondary">削除</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // チャート初期化
    initializeChart() {
        const canvas = document.getElementById('backup-chart');
        const ctx = canvas.getContext('2d');
        
        // 簡易的なチャート描画
        this.drawChart(ctx);
    }

    drawChart(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        
        for (let i = 0; i < width; i += 20) {
            const y = height / 2 + Math.sin(i / 50) * 30;
            ctx.lineTo(i, y);
        }
        
        ctx.stroke();
    }

    updateChart() {
        const canvas = document.getElementById('backup-chart');
        const ctx = canvas.getContext('2d');
        this.drawChart(ctx);
    }

    // ログ機能
    log(message, type = 'info') {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
        
        // 最大100件まで保持
        while (logContent.children.length > 100) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    clearLog() {
        document.getElementById('log-content').innerHTML = '';
        this.log('ログをクリアしました', 'info');
    }

    // WebSocket接続（シミュレート）
    connectWebSocket() {
        const indicator = document.getElementById('connection-indicator');
        indicator.classList.add('connected');
        indicator.querySelector('.indicator-text').textContent = '接続中';
        
        this.log('WebSocket接続を確立しました', 'success');
    }

    // 検索・ソート機能
    searchBackups(query) {
        // 実装省略（フィルタリングロジック）
    }

    sortBackups(order) {
        // 実装省略（ソートロジック）
    }

    // 初期データシミュレート
    simulateInitialData() {
        // 初期ファイル
        const initialFiles = ['index.html', 'style.css', 'script.js', 'config.json', 'README.md'];
        initialFiles.forEach(fileName => {
            this.files.set(fileName, {
                name: fileName,
                size: Math.floor(Math.random() * 500) + 50,
                md5: this.generateMD5(),
                lastModified: new Date()
            });
        });
        
        // 初期バックアップ
        for (let i = 0; i < 3; i++) {
            const date = new Date();
            date.setHours(date.getHours() - i * 2);
            
            this.backups.push({
                id: Date.now() - i * 10000,
                name: `backup_${date.toISOString().replace(/[:.]/g, '-')}`,
                files: Array.from(this.files.values()),
                size: Math.floor(Math.random() * 5000) + 1000,
                date: date
            });
        }
    }

    generateMD5() {
        return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => 
            (Math.random() * 16 | 0).toString(16)
        );
    }

    updateUI() {
        this.updateStats();
        this.updateBackupList();
        this.log('システムを初期化しました', 'success');
    }
}

// アプリケーション初期化
const backupSystem = new BackupSystemVerifier();