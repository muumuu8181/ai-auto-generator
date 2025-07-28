// グローバル変数
let timerInterval = null;
let stopwatchInterval = null;
let timerTime = 0;
let stopwatchTime = 0;
let lapCount = 0;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initThemes();
    initTabs();
    initClock();
    initTimer();
    initStopwatch();
});

// テーマ切り替え
function initThemes() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
        });
    });
}

// タブ切り替え
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.clock-panel');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 時計機能
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    
    // アナログ時計
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const hourDeg = (hours * 30) + (minutes * 0.5);
    const minuteDeg = minutes * 6;
    const secondDeg = seconds * 6;
    
    document.querySelector('.hour-hand').style.transform = `rotate(${hourDeg}deg)`;
    document.querySelector('.minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
    document.querySelector('.second-hand').style.transform = `rotate(${secondDeg}deg)`;
    
    // デジタル時計
    const formatTime = (num) => num.toString().padStart(2, '0');
    document.querySelector('.hours').textContent = formatTime(now.getHours());
    document.querySelector('.minutes').textContent = formatTime(now.getMinutes());
    document.querySelector('.seconds').textContent = formatTime(now.getSeconds());
    
    // 日付
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    };
    document.querySelector('.digital-date').textContent = 
        now.toLocaleDateString('ja-JP', options);
}

// タイマー機能
function initTimer() {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
}

function startTimer() {
    if (timerInterval) return;
    
    const hours = parseInt(document.getElementById('timer-hours').value) || 0;
    const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
    const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
    
    if (timerTime === 0) {
        timerTime = (hours * 3600) + (minutes * 60) + seconds;
    }
    
    if (timerTime > 0) {
        timerInterval = setInterval(() => {
            timerTime--;
            updateTimerDisplay();
            
            if (timerTime <= 0) {
                pauseTimer();
                alert('タイマー終了！');
            }
        }, 1000);
    }
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    pauseTimer();
    timerTime = 0;
    updateTimerDisplay();
    document.getElementById('timer-hours').value = '';
    document.getElementById('timer-minutes').value = '';
    document.getElementById('timer-seconds').value = '';
}

function updateTimerDisplay() {
    const hours = Math.floor(timerTime / 3600);
    const minutes = Math.floor((timerTime % 3600) / 60);
    const seconds = timerTime % 60;
    
    const display = document.querySelector('.timer-display');
    display.textContent = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
}

// ストップウォッチ機能
function initStopwatch() {
    const startBtn = document.getElementById('stopwatch-start');
    const pauseBtn = document.getElementById('stopwatch-pause');
    const resetBtn = document.getElementById('stopwatch-reset');
    const lapBtn = document.getElementById('stopwatch-lap');
    
    startBtn.addEventListener('click', startStopwatch);
    pauseBtn.addEventListener('click', pauseStopwatch);
    resetBtn.addEventListener('click', resetStopwatch);
    lapBtn.addEventListener('click', recordLap);
}

function startStopwatch() {
    if (stopwatchInterval) return;
    
    const startTime = Date.now() - stopwatchTime;
    
    stopwatchInterval = setInterval(() => {
        stopwatchTime = Date.now() - startTime;
        updateStopwatchDisplay();
    }, 10);
}

function pauseStopwatch() {
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
}

function resetStopwatch() {
    pauseStopwatch();
    stopwatchTime = 0;
    lapCount = 0;
    updateStopwatchDisplay();
    document.querySelector('.lap-times').innerHTML = '';
}

function updateStopwatchDisplay() {
    const totalSeconds = Math.floor(stopwatchTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((stopwatchTime % 1000) / 10);
    
    const display = document.querySelector('.stopwatch-display');
    display.textContent = `${formatTime(minutes)}:${formatTime(seconds)}:${formatTime(milliseconds)}`;
}

function recordLap() {
    if (stopwatchTime === 0) return;
    
    lapCount++;
    const lapTime = document.querySelector('.stopwatch-display').textContent;
    const lapDiv = document.createElement('div');
    lapDiv.className = 'lap-time';
    lapDiv.innerHTML = `<span>ラップ ${lapCount}</span><span>${lapTime}</span>`;
    
    const lapTimes = document.querySelector('.lap-times');
    lapTimes.insertBefore(lapDiv, lapTimes.firstChild);
}

// ユーティリティ関数
function formatTime(num) {
    return num.toString().padStart(2, '0');
}