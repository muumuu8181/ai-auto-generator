class DigitalClock {
    constructor() {
        this.is24Hour = true;
        this.showSeconds = true;
        this.colorTheme = 'blue';
        this.backgroundStyle = 'gradient';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.applyTheme();
        this.startClock();
    }
    
    setupEventListeners() {
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.toggleSettings();
        });
        
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        document.getElementById('format-24h').addEventListener('change', (e) => {
            this.is24Hour = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('show-seconds').addEventListener('change', (e) => {
            this.showSeconds = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('color-theme').addEventListener('change', (e) => {
            this.colorTheme = e.target.value;
            this.applyTheme();
            this.saveSettings();
        });
        
        document.getElementById('background-style').addEventListener('change', (e) => {
            this.backgroundStyle = e.target.value;
            this.applyTheme();
            this.saveSettings();
        });
        
        // ESCキーで設定パネルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('settings-panel').classList.remove('active');
            }
        });
    }
    
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const now = new Date();
        
        // 時間
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();
        let ampm = '';
        
        if (!this.is24Hour) {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
        }
        
        const timeString = this.showSeconds 
            ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        document.getElementById('time').textContent = timeString;
        document.getElementById('ampm').textContent = ampm;
        
        // 日付
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const dateString = `${year}年${month}月${date}日`;
        document.getElementById('date').textContent = dateString;
        
        // 曜日
        const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        document.getElementById('day').textContent = days[now.getDay()];
        
        // タイムゾーン
        document.getElementById('timezone').textContent = 'JST';
    }
    
    toggleSettings() {
        const panel = document.getElementById('settings-panel');
        panel.classList.toggle('active');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('フルスクリーンモードに入れませんでした:', err);
            });
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-expand"></i>';
        }
    }
    
    applyTheme() {
        const body = document.body;
        
        // 既存のテーマクラスを削除
        body.className = '';
        
        // 新しいテーマを適用
        body.classList.add(`theme-${this.colorTheme}`);
        body.classList.add(`bg-${this.backgroundStyle}`);
    }
    
    saveSettings() {
        const settings = {
            is24Hour: this.is24Hour,
            showSeconds: this.showSeconds,
            colorTheme: this.colorTheme,
            backgroundStyle: this.backgroundStyle
        };
        localStorage.setItem('clockSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('clockSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.is24Hour = settings.is24Hour ?? true;
            this.showSeconds = settings.showSeconds ?? true;
            this.colorTheme = settings.colorTheme ?? 'blue';
            this.backgroundStyle = settings.backgroundStyle ?? 'gradient';
            
            // UI更新
            document.getElementById('format-24h').checked = this.is24Hour;
            document.getElementById('show-seconds').checked = this.showSeconds;
            document.getElementById('color-theme').value = this.colorTheme;
            document.getElementById('background-style').value = this.backgroundStyle;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DigitalClock();
});