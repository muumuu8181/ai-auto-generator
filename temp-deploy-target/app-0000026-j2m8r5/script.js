// Focus Forest - ポモドーロタイマー
class FocusForest {
    constructor() {
        // タイマー設定
        this.settings = {
            workDuration: 25 * 60, // 25分
            shortBreak: 5 * 60,    // 5分
            longBreak: 15 * 60,    // 15分
            sessionsUntilLong: 4,
            soundEnabled: true,
            autoStart: true
        };
        
        // タイマー状態
        this.currentTime = this.settings.workDuration;
        this.isRunning = false;
        this.isBreak = false;
        this.completedSessions = 0;
        this.currentSessionInSet = 0;
        this.timer = null;
        
        // 森の統計
        this.totalTrees = 0;
        this.totalMinutes = 0;
        this.todaySessions = 0;
        
        // ローカルストレージキー
        this.STORAGE_KEY = 'focusForest';
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateStats();
        this.loadTrees();
    }
    
    setupEventListeners() {
        // タイマーコントロール
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        
        // 設定
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeModal('settings-modal'));
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
        
        // 完了モーダル
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.closeModal('completion-modal');
            if (this.settings.autoStart) {
                setTimeout(() => this.start(), 1000);
            }
        });
        
        // 統計
        document.getElementById('stats-btn').addEventListener('click', () => this.openStats());
        document.getElementById('close-stats').addEventListener('click', () => this.closeModal('stats-modal'));
        
        // その他
        document.getElementById('forest-btn').addEventListener('click', () => this.viewForest());
        document.getElementById('share-btn').addEventListener('click', () => this.shareProgress());
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            }
        });
        
        // ページ離脱時の警告
        window.addEventListener('beforeunload', (e) => {
            if (this.isRunning) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'flex';
        
        this.timer = setInterval(() => this.tick(), 1000);
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        document.getElementById('start-btn').style.display = 'flex';
        document.getElementById('pause-btn').style.display = 'none';
        
        clearInterval(this.timer);
    }
    
    reset() {
        this.pause();
        
        if (this.isBreak) {
            this.currentTime = this.getBreakDuration();
        } else {
            this.currentTime = this.settings.workDuration;
        }
        
        this.updateDisplay();
    }
    
    tick() {
        this.currentTime--;
        
        if (this.currentTime <= 0) {
            this.completeSession();
        } else {
            this.updateDisplay();
        }
    }
    
    completeSession() {
        this.pause();
        this.playSound();
        
        if (!this.isBreak) {
            // 作業セッション完了
            this.completedSessions++;
            this.currentSessionInSet++;
            this.todaySessions++;
            this.totalMinutes += this.settings.workDuration / 60;
            
            // 木を育てる
            this.growTree();
            
            // セッションドットを更新
            this.updateSessionDots();
            
            // 休憩に切り替え
            this.isBreak = true;
            this.currentTime = this.getBreakDuration();
            document.getElementById('timer-phase').textContent = 
                this.currentSessionInSet >= this.settings.sessionsUntilLong ? '長い休憩' : '短い休憩';
            
            // 完了モーダルを表示
            this.showCompletionModal();
            
        } else {
            // 休憩完了
            this.isBreak = false;
            this.currentTime = this.settings.workDuration;
            document.getElementById('timer-phase').textContent = '作業時間';
            
            // 長い休憩後はセッションをリセット
            if (this.currentSessionInSet >= this.settings.sessionsUntilLong) {
                this.currentSessionInSet = 0;
                this.updateSessionDots();
            }
            
            if (this.settings.autoStart) {
                setTimeout(() => this.start(), 1000);
            }
        }
        
        this.updateDisplay();
        this.saveData();
    }
    
    getBreakDuration() {
        if (this.currentSessionInSet >= this.settings.sessionsUntilLong) {
            return this.settings.longBreak;
        }
        return this.settings.shortBreak;
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        
        document.getElementById('timer-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // プログレスリングを更新
        const progress = document.getElementById('timer-progress');
        const totalTime = this.isBreak ? this.getBreakDuration() : this.settings.workDuration;
        const percentage = (totalTime - this.currentTime) / totalTime;
        const circumference = 2 * Math.PI * 135; // radius = 135
        const offset = circumference - (percentage * circumference);
        
        progress.style.strokeDashoffset = offset;
        
        // ブレイク時は色を変更
        if (this.isBreak) {
            progress.style.stroke = '#ff9800';
        } else {
            progress.style.stroke = '#4a7c28';
        }
    }
    
    updateSessionDots() {
        for (let i = 1; i <= 4; i++) {
            const dot = document.getElementById(`session-${i}`);
            if (i <= this.currentSessionInSet) {
                dot.classList.add('completed');
            } else {
                dot.classList.remove('completed');
            }
        }
    }
    
    growTree() {
        this.totalTrees++;
        
        const forestTrees = document.getElementById('forest-trees');
        const tree = this.createTree();
        
        // ランダムな位置に配置
        const maxTrees = Math.floor(forestTrees.offsetWidth / 80);
        if (forestTrees.children.length >= maxTrees) {
            forestTrees.removeChild(forestTrees.firstChild);
        }
        
        forestTrees.appendChild(tree);
        this.updateStats();
    }
    
    createTree() {
        const tree = document.createElement('div');
        tree.className = 'tree';
        
        // ランダムなサイズ
        const scale = 0.8 + Math.random() * 0.4;
        tree.style.transform = `scale(${scale})`;
        
        tree.innerHTML = `
            <div class="tree-trunk"></div>
            <div class="tree-leaves">
                <div class="leaf leaf-1"></div>
                <div class="leaf leaf-2"></div>
                <div class="leaf leaf-3"></div>
            </div>
        `;
        
        return tree;
    }
    
    updateStats() {
        document.getElementById('tree-count').textContent = this.totalTrees;
        document.getElementById('total-time').textContent = Math.floor(this.totalMinutes);
    }
    
    playSound() {
        if (this.settings.soundEnabled) {
            const audio = document.getElementById('notification-sound');
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    showCompletionModal() {
        const message = document.getElementById('completion-message');
        const treePreview = document.getElementById('tree-preview');
        
        // メッセージを設定
        if (this.totalTrees % 10 === 0) {
            message.textContent = `素晴らしい！${this.totalTrees}本目の木を育てました！`;
        } else if (this.currentSessionInSet >= this.settings.sessionsUntilLong) {
            message.textContent = '長い休憩の時間です。リラックスしましょう！';
        } else {
            message.textContent = '新しい木が森に植えられました！';
        }
        
        // 木のプレビューを表示
        treePreview.innerHTML = '';
        treePreview.appendChild(this.createTree());
        
        this.openModal('completion-modal');
    }
    
    openSettings() {
        // 現在の設定を表示
        document.getElementById('work-duration').value = this.settings.workDuration / 60;
        document.getElementById('short-break').value = this.settings.shortBreak / 60;
        document.getElementById('long-break').value = this.settings.longBreak / 60;
        document.getElementById('sessions-until-long').value = this.settings.sessionsUntilLong;
        document.getElementById('sound-enabled').checked = this.settings.soundEnabled;
        document.getElementById('auto-start').checked = this.settings.autoStart;
        
        this.openModal('settings-modal');
    }
    
    saveSettings() {
        this.settings.workDuration = parseInt(document.getElementById('work-duration').value) * 60;
        this.settings.shortBreak = parseInt(document.getElementById('short-break').value) * 60;
        this.settings.longBreak = parseInt(document.getElementById('long-break').value) * 60;
        this.settings.sessionsUntilLong = parseInt(document.getElementById('sessions-until-long').value);
        this.settings.soundEnabled = document.getElementById('sound-enabled').checked;
        this.settings.autoStart = document.getElementById('auto-start').checked;
        
        // 現在のタイマーをリセット
        if (!this.isRunning) {
            this.currentTime = this.isBreak ? this.getBreakDuration() : this.settings.workDuration;
            this.updateDisplay();
        }
        
        this.saveData();
        this.closeModal('settings-modal');
    }
    
    resetSettings() {
        this.settings = {
            workDuration: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60,
            sessionsUntilLong: 4,
            soundEnabled: true,
            autoStart: true
        };
        
        this.openSettings();
    }
    
    openStats() {
        // 統計を計算
        const today = new Date().toDateString();
        const data = this.loadAllData();
        
        // 今日のセッション数
        document.getElementById('today-sessions').textContent = this.todaySessions;
        
        // 今週のセッション数
        let weekSessions = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        Object.entries(data.dailyStats || {}).forEach(([date, stats]) => {
            if (new Date(date) >= oneWeekAgo) {
                weekSessions += stats.sessions || 0;
            }
        });
        document.getElementById('week-sessions').textContent = weekSessions;
        
        // 連続記録
        let streak = 0;
        const sortedDates = Object.keys(data.dailyStats || {}).sort((a, b) => new Date(b) - new Date(a));
        const currentDate = new Date();
        
        for (let i = 0; i < sortedDates.length; i++) {
            const date = new Date(sortedDates[i]);
            const expectedDate = new Date(currentDate);
            expectedDate.setDate(expectedDate.getDate() - i);
            
            if (date.toDateString() === expectedDate.toDateString() && data.dailyStats[sortedDates[i]].sessions > 0) {
                streak++;
            } else {
                break;
            }
        }
        document.getElementById('streak-days').textContent = streak;
        
        // 最高記録
        let bestDay = 0;
        Object.values(data.dailyStats || {}).forEach(stats => {
            if (stats.sessions > bestDay) {
                bestDay = stats.sessions;
            }
        });
        document.getElementById('best-day').textContent = bestDay;
        
        this.openModal('stats-modal');
    }
    
    viewForest() {
        // 森の表示エリアにスクロール
        document.querySelector('.forest-container').scrollIntoView({ behavior: 'smooth' });
    }
    
    shareProgress() {
        const text = `Focus Forestで${this.totalTrees}本の木を育てました！合計${Math.floor(this.totalMinutes)}分集中しました。🌳`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Focus Forest Progress',
                text: text
            }).catch(err => console.log('Share failed:', err));
        } else {
            // クリップボードにコピー
            navigator.clipboard.writeText(text).then(() => {
                alert('進捗をクリップボードにコピーしました！');
            });
        }
    }
    
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    saveData() {
        const today = new Date().toDateString();
        const data = this.loadAllData();
        
        // 今日の統計を更新
        if (!data.dailyStats) data.dailyStats = {};
        if (!data.dailyStats[today]) {
            data.dailyStats[today] = { sessions: 0, minutes: 0 };
        }
        
        data.dailyStats[today].sessions = this.todaySessions;
        data.dailyStats[today].minutes = Math.floor(this.totalMinutes);
        
        // 全体の統計を保存
        data.totalTrees = this.totalTrees;
        data.totalMinutes = this.totalMinutes;
        data.settings = this.settings;
        data.lastVisit = today;
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
    
    loadData() {
        const data = this.loadAllData();
        const today = new Date().toDateString();
        
        // 設定を読み込み
        if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
        }
        
        // 統計を読み込み
        this.totalTrees = data.totalTrees || 0;
        this.totalMinutes = data.totalMinutes || 0;
        
        // 今日のセッション数を読み込み
        if (data.dailyStats && data.dailyStats[today]) {
            this.todaySessions = data.dailyStats[today].sessions || 0;
        }
        
        // タイマーを初期化
        this.currentTime = this.settings.workDuration;
    }
    
    loadAllData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to load data:', e);
            return {};
        }
    }
    
    loadTrees() {
        // 既存の木を表示
        const treesToShow = Math.min(this.totalTrees, 10);
        for (let i = 0; i < treesToShow; i++) {
            setTimeout(() => {
                const tree = this.createTree();
                document.getElementById('forest-trees').appendChild(tree);
            }, i * 100);
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new FocusForest();
});