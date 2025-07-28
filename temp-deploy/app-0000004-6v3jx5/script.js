// 時計システムクラス
class ClockSystem {
    constructor() {
        this.currentClock = 'analog';
        this.currentTheme = 'dark';
        this.timerInterval = null;
        this.timerTime = 0;
        this.stopwatchInterval = null;
        this.stopwatchTime = 0;
        this.lapTimes = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClock();
        this.loadTheme();
    }

    setupEventListeners() {
        // 時計切替
        document.querySelectorAll('.clock-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.clock-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchClock(btn.dataset.clock);
            });
        });

        // テーマ切替
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeTheme(btn.dataset.theme);
            });
        });

        // タイマー
        document.getElementById('timer-btn').addEventListener('click', () => {
            document.getElementById('timer-modal').style.display = 'block';
        });

        document.getElementById('timer-close').addEventListener('click', () => {
            document.getElementById('timer-modal').style.display = 'none';
        });

        document.getElementById('timer-start').addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('timer-pause').addEventListener('click', () => {
            this.pauseTimer();
        });

        document.getElementById('timer-reset').addEventListener('click', () => {
            this.resetTimer();
        });

        // ストップウォッチ
        document.getElementById('stopwatch-btn').addEventListener('click', () => {
            document.getElementById('stopwatch-modal').style.display = 'block';
        });

        document.getElementById('stopwatch-close').addEventListener('click', () => {
            document.getElementById('stopwatch-modal').style.display = 'none';
        });

        document.getElementById('stopwatch-start').addEventListener('click', () => {
            this.startStopwatch();
        });

        document.getElementById('stopwatch-pause').addEventListener('click', () => {
            this.pauseStopwatch();
        });

        document.getElementById('stopwatch-lap').addEventListener('click', () => {
            this.addLap();
        });

        document.getElementById('stopwatch-reset').addEventListener('click', () => {
            this.resetStopwatch();
        });

        // モーダル外クリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchClock(type) {
        document.querySelectorAll('.clock').forEach(clock => {
            clock.classList.remove('active');
        });
        document.getElementById(`${type}-clock`).classList.add('active');
        this.currentClock = type;
    }

    changeTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('clockTheme', theme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('clockTheme');
        if (savedTheme) {
            this.changeTheme(savedTheme);
        }
    }

    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // アナログ時計
        this.updateAnalogClock(hours, minutes, seconds);

        // デジタル時計
        this.updateDigitalClock(hours, minutes, seconds);

        // フリップ時計
        this.updateFlipClock(hours, minutes, seconds);

        // ネオン時計
        this.updateNeonClock(hours, minutes, seconds);

        // 日付更新
        this.updateDate(now);
    }

    updateAnalogClock(hours, minutes, seconds) {
        const hourDeg = (hours % 12) * 30 + minutes * 0.5;
        const minuteDeg = minutes * 6 + seconds * 0.1;
        const secondDeg = seconds * 6;

        document.getElementById('hour-hand').style.transform = `rotate(${hourDeg}deg)`;
        document.getElementById('minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
        document.getElementById('second-hand').style.transform = `rotate(${secondDeg}deg)`;
    }

    updateDigitalClock(hours, minutes, seconds) {
        document.getElementById('digital-hours').textContent = this.pad(hours);
        document.getElementById('digital-minutes').textContent = this.pad(minutes);
        document.getElementById('digital-seconds').textContent = this.pad(seconds);
    }

    updateFlipClock(hours, minutes, seconds) {
        this.flipCard('flip-hours', this.pad(hours));
        this.flipCard('flip-minutes', this.pad(minutes));
        this.flipCard('flip-seconds', this.pad(seconds));
    }

    flipCard(id, value) {
        const card = document.getElementById(id);
        const front = card.querySelector('.flip-card-front');
        const back = card.querySelector('.flip-card-back');
        
        if (front.textContent !== value) {
            back.textContent = value;
            card.style.transform = 'rotateX(180deg)';
            
            setTimeout(() => {
                front.textContent = value;
                card.style.transform = 'rotateX(0deg)';
            }, 300);
        }
    }

    updateNeonClock(hours, minutes, seconds) {
        const h = this.pad(hours);
        const m = this.pad(minutes);
        const s = this.pad(seconds);

        document.getElementById('neon-h1').textContent = h[0];
        document.getElementById('neon-h2').textContent = h[1];
        document.getElementById('neon-m1').textContent = m[0];
        document.getElementById('neon-m2').textContent = m[1];
        document.getElementById('neon-s1').textContent = s[0];
        document.getElementById('neon-s2').textContent = s[1];
    }

    updateDate(date) {
        const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = days[date.getDay()];

        document.getElementById('date-display').textContent = 
            `${year}年${month}月${day}日 ${dayOfWeek}`;
    }

    pad(num) {
        return num.toString().padStart(2, '0');
    }

    // タイマー機能
    startTimer() {
        if (this.timerInterval) return;

        const hours = parseInt(document.getElementById('timer-hours').value) || 0;
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;

        if (this.timerTime === 0) {
            this.timerTime = hours * 3600 + minutes * 60 + seconds;
        }

        if (this.timerTime === 0) return;

        this.timerInterval = setInterval(() => {
            this.timerTime--;
            this.updateTimerDisplay();

            if (this.timerTime <= 0) {
                this.pauseTimer();
                this.playAlarm();
                alert('タイマーが終了しました！');
            }
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    resetTimer() {
        this.pauseTimer();
        this.timerTime = 0;
        this.updateTimerDisplay();
        document.getElementById('timer-hours').value = 0;
        document.getElementById('timer-minutes').value = 0;
        document.getElementById('timer-seconds').value = 0;
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.timerTime / 3600);
        const minutes = Math.floor((this.timerTime % 3600) / 60);
        const seconds = this.timerTime % 60;

        document.getElementById('timer-display').textContent = 
            `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    // ストップウォッチ機能
    startStopwatch() {
        if (this.stopwatchInterval) return;

        const startTime = Date.now() - this.stopwatchTime;

        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime = Date.now() - startTime;
            this.updateStopwatchDisplay();
        }, 10);
    }

    pauseStopwatch() {
        clearInterval(this.stopwatchInterval);
        this.stopwatchInterval = null;
    }

    resetStopwatch() {
        this.pauseStopwatch();
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateStopwatchDisplay();
        document.getElementById('lap-times').innerHTML = '';
    }

    addLap() {
        if (this.stopwatchTime > 0) {
            this.lapTimes.push(this.stopwatchTime);
            const lapNumber = this.lapTimes.length;
            const lapTime = this.formatStopwatchTime(this.stopwatchTime);
            
            const lapDiv = document.createElement('div');
            lapDiv.className = 'lap-time';
            lapDiv.textContent = `Lap ${lapNumber}: ${lapTime}`;
            
            document.getElementById('lap-times').insertBefore(
                lapDiv, 
                document.getElementById('lap-times').firstChild
            );
        }
    }

    updateStopwatchDisplay() {
        document.getElementById('stopwatch-display').textContent = 
            this.formatStopwatchTime(this.stopwatchTime);
    }

    formatStopwatchTime(time) {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const milliseconds = Math.floor((time % 1000) / 10);

        return `${this.pad(minutes)}:${this.pad(seconds)}.${this.pad(milliseconds)}`;
    }

    playAlarm() {
        // オーディオコンテキストを使用して音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    }
}

// アプリケーション初期化
const clockSystem = new ClockSystem();