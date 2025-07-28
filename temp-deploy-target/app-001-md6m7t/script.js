// Clock functionality
let clockInterval;
let timerInterval;
let stopwatchInterval;
let timerTime = 0;
let stopwatchTime = 0;
let isTimerRunning = false;
let isStopwatchRunning = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    initializeThemeSelector();
    initializeClockSelector();
    initializeTools();
    setInterval(updateClock, 1000);
});

// Clock Functions
function initializeClock() {
    updateClock();
    document.querySelector('.analog-wrapper').classList.add('active');
}

function updateClock() {
    const now = new Date();
    
    // Update Digital Clock
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.querySelector('.hours').textContent = hours;
    document.querySelector('.minutes').textContent = minutes;
    document.querySelector('.seconds').textContent = seconds;
    
    // Update Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('ja-JP', options);
    document.querySelector('.date').textContent = dateString;
    
    // Update Analog Clock
    const hourDeg = (now.getHours() % 12) * 30 + (now.getMinutes() * 0.5);
    const minuteDeg = now.getMinutes() * 6;
    const secondDeg = now.getSeconds() * 6;
    
    document.querySelector('.hour-hand').style.transform = `rotate(${hourDeg}deg)`;
    document.querySelector('.minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
    document.querySelector('.second-hand').style.transform = `rotate(${secondDeg}deg)`;
}

// Theme Selector
function initializeThemeSelector() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
        });
    });
}

// Clock Type Selector
function initializeClockSelector() {
    const clockButtons = document.querySelectorAll('.clock-btn');
    const analogWrapper = document.querySelector('.analog-wrapper');
    const digitalWrapper = document.querySelector('.digital-wrapper');
    
    clockButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            clockButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const type = btn.getAttribute('data-type');
            
            analogWrapper.classList.remove('active');
            digitalWrapper.classList.remove('active');
            
            switch(type) {
                case 'analog':
                    analogWrapper.classList.add('active');
                    break;
                case 'digital':
                    digitalWrapper.classList.add('active');
                    break;
                case 'both':
                    analogWrapper.classList.add('active');
                    digitalWrapper.classList.add('active');
                    break;
            }
        });
    });
}

// Tools Functions
function initializeTools() {
    // Tool Tabs
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolContents = document.querySelectorAll('.tool-content');
    
    toolTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tool = tab.getAttribute('data-tool');
            
            toolTabs.forEach(t => t.classList.remove('active'));
            toolContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.querySelector(`.${tool}-content`).classList.add('active');
        });
    });
    
    // Timer
    document.getElementById('timer-start').addEventListener('click', startTimer);
    document.getElementById('timer-pause').addEventListener('click', pauseTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    
    // Stopwatch
    document.getElementById('stopwatch-start').addEventListener('click', startStopwatch);
    document.getElementById('stopwatch-pause').addEventListener('click', pauseStopwatch);
    document.getElementById('stopwatch-reset').addEventListener('click', resetStopwatch);
    document.getElementById('stopwatch-lap').addEventListener('click', addLap);
}

// Timer Functions
function startTimer() {
    if (!isTimerRunning) {
        if (timerTime === 0) {
            const hours = parseInt(document.getElementById('timer-hours').value) || 0;
            const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
            const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
            timerTime = hours * 3600 + minutes * 60 + seconds;
        }
        
        if (timerTime > 0) {
            isTimerRunning = true;
            timerInterval = setInterval(updateTimer, 1000);
        }
    }
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerTime = 0;
    updateTimerDisplay();
    document.getElementById('timer-hours').value = 0;
    document.getElementById('timer-minutes').value = 0;
    document.getElementById('timer-seconds').value = 0;
}

function updateTimer() {
    if (timerTime > 0) {
        timerTime--;
        updateTimerDisplay();
    } else {
        pauseTimer();
        // Timer finished - could add sound or notification here
        alert('タイマー終了！');
    }
}

function updateTimerDisplay() {
    const hours = Math.floor(timerTime / 3600);
    const minutes = Math.floor((timerTime % 3600) / 60);
    const seconds = timerTime % 60;
    
    const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.querySelector('.timer-display').textContent = display;
}

// Stopwatch Functions
function startStopwatch() {
    if (!isStopwatchRunning) {
        isStopwatchRunning = true;
        stopwatchInterval = setInterval(updateStopwatch, 10);
    }
}

function pauseStopwatch() {
    isStopwatchRunning = false;
    clearInterval(stopwatchInterval);
}

function resetStopwatch() {
    isStopwatchRunning = false;
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    updateStopwatchDisplay();
    document.querySelector('.lap-times').innerHTML = '';
}

function updateStopwatch() {
    stopwatchTime++;
    updateStopwatchDisplay();
}

function updateStopwatchDisplay() {
    const totalSeconds = Math.floor(stopwatchTime / 100);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = stopwatchTime % 100;
    
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(centiseconds).padStart(2, '0')}`;
    document.querySelector('.stopwatch-display').textContent = display;
}

function addLap() {
    if (isStopwatchRunning && stopwatchTime > 0) {
        const lapList = document.querySelector('.lap-times');
        const lapNumber = lapList.children.length + 1;
        const lapTime = document.querySelector('.stopwatch-display').textContent;
        
        const lapItem = document.createElement('li');
        lapItem.innerHTML = `<span>ラップ ${lapNumber}</span><span>${lapTime}</span>`;
        lapList.insertBefore(lapItem, lapList.firstChild);
    }
}