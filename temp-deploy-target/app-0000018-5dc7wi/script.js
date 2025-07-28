// タイマー状態
let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;
let isPaused = false;

// DOM要素
const timeDisplay = document.getElementById('timeDisplay');
const statusText = document.getElementById('statusText');
const minuteInput = document.getElementById('minuteInput');
const secondInput = document.getElementById('secondInput');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const soundEnabled = document.getElementById('soundEnabled');
const vibrationEnabled = document.getElementById('vibrationEnabled');
const testSoundBtn = document.getElementById('testSoundBtn');
const notificationModal = document.getElementById('notificationModal');
const closeModal = document.getElementById('closeModal');
const container = document.querySelector('.container');

// 音声コンテキスト（Web Audio API）
let audioContext = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    loadSettings();
});

// 音声コンテキスト初期化
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// ビープ音生成
function playBeep(frequency = 800, duration = 500) {
    if (!soundEnabled.checked) return;
    
    try {
        const ctx = initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
        console.log('Audio not supported');
    }
}

// バイブレーション
function vibrate(pattern = [200, 100, 200]) {
    if (!vibrationEnabled.checked) return;
    
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 時間フォーマット
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 表示更新
function updateDisplay() {
    timeDisplay.textContent = formatTime(remainingSeconds);
    updateProgress();
    updateButtonStates();
}

// プログレス更新
function updateProgress() {
    if (totalSeconds === 0) {
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
        return;
    }
    
    const percentage = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    progressFill.style.width = percentage + '%';
    progressText.textContent = Math.round(percentage) + '%';
}

// ボタン状態更新
function updateButtonStates() {
    startBtn.disabled = isRunning && !isPaused;
    pauseBtn.disabled = !isRunning;
    
    if (isRunning && !isPaused) {
        startBtn.textContent = '実行中';
        statusText.textContent = 'タイマー実行中...';
        container.className = 'container timer-running';
    } else if (isPaused) {
        startBtn.textContent = '再開';
        statusText.textContent = 'タイマー一時停止中';
        container.className = 'container timer-paused';
    } else {
        startBtn.textContent = 'スタート';
        statusText.textContent = remainingSeconds > 0 ? 'タイマー準備完了' : 'タイマーを設定してください';
        container.className = 'container';
    }
}

// タイマー開始
function startTimer() {
    if (!isRunning) {
        // 新規開始
        const minutes = parseInt(minuteInput.value) || 0;
        const seconds = parseInt(secondInput.value) || 0;
        
        if (minutes === 0 && seconds === 0) {
            showNotification('時間を設定してください', 'warning');
            return;
        }
        
        totalSeconds = minutes * 60 + seconds;
        remainingSeconds = totalSeconds;
    }
    
    isRunning = true;
    isPaused = false;
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        
        // 1秒精度の保証
        if (remainingSeconds <= 0) {
            finishTimer();
        }
        
        // 最後の10秒でビープ音
        if (remainingSeconds <= 10 && remainingSeconds > 0) {
            playBeep(600, 100);
        }
        
    }, 1000);
    
    updateDisplay();
    saveSettings();
}

// タイマー一時停止
function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    isPaused = true;
    updateDisplay();
    saveSettings();
}

// タイマーリセット
function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    isRunning = false;
    isPaused = false;
    remainingSeconds = 0;
    totalSeconds = 0;
    
    updateDisplay();
    closeNotificationModal();
    saveSettings();
}

// タイマー終了
function finishTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    isRunning = false;
    isPaused = false;
    remainingSeconds = 0;
    
    // 終了通知
    playBeep(1000, 1000);
    vibrate([500, 200, 500, 200, 500]);
    showNotificationModal();
    
    container.className = 'container timer-finished';
    statusText.textContent = 'タイマー終了！';
    
    updateDisplay();
    saveSettings();
}

// 通知モーダル表示
function showNotificationModal() {
    notificationModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 自動閉鎖（10秒後）
    setTimeout(() => {
        closeNotificationModal();
    }, 10000);
}

// 通知モーダル閉鎖
function closeNotificationModal() {
    notificationModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    container.className = 'container';
}

// 設定保存
function saveSettings() {
    const settings = {
        soundEnabled: soundEnabled.checked,
        vibrationEnabled: vibrationEnabled.checked,
        lastMinutes: minuteInput.value,
        lastSeconds: secondInput.value,
        timerState: {
            isRunning,
            isPaused,
            remainingSeconds,
            totalSeconds
        }
    };
    
    localStorage.setItem('timerSettings', JSON.stringify(settings));
}

// 設定読み込み
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('timerSettings'));
    
    if (settings) {
        soundEnabled.checked = settings.soundEnabled !== false;
        vibrationEnabled.checked = settings.vibrationEnabled !== false;
        
        if (settings.lastMinutes) minuteInput.value = settings.lastMinutes;
        if (settings.lastSeconds) secondInput.value = settings.lastSeconds;
        
        // タイマー状態復元は行わない（セキュリティ上の理由）
    }
}

// 通知表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    switch (type) {
        case 'success':
            notification.style.background = '#4ecdc4';
            break;
        case 'warning':
            notification.style.background = '#f39c12';
            break;
        case 'error':
            notification.style.background = '#ff6b6b';
            break;
        default:
            notification.style.background = '#667eea';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// イベントリスナー
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
closeModal.addEventListener('click', closeNotificationModal);

// プリセットボタン
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isRunning) {
            minuteInput.value = btn.dataset.minutes;
            secondInput.value = btn.dataset.seconds;
            
            // プリセット選択時の視覚効果
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
            
            showNotification(`${btn.textContent}に設定しました`, 'success');
        }
    });
});

// 入力値検証
minuteInput.addEventListener('input', () => {
    const value = parseInt(minuteInput.value);
    if (value < 0) minuteInput.value = 0;
    if (value > 59) minuteInput.value = 59;
    saveSettings();
});

secondInput.addEventListener('input', () => {
    const value = parseInt(secondInput.value);
    if (value < 0) secondInput.value = 0;
    if (value > 59) secondInput.value = 59;
    saveSettings();
});

// 設定変更時の保存
soundEnabled.addEventListener('change', saveSettings);
vibrationEnabled.addEventListener('change', saveSettings);

// テスト音
testSoundBtn.addEventListener('click', () => {
    playBeep(800, 500);
    vibrate([200, 100, 200]);
    showNotification('通知テスト完了', 'success');
});

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key) {
        case ' ':
        case 'Enter':
            e.preventDefault();
            if (!isRunning || isPaused) {
                startTimer();
            } else {
                pauseTimer();
            }
            break;
        case 'Escape':
        case 'r':
            e.preventDefault();
            resetTimer();
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
            e.preventDefault();
            const presetBtns = document.querySelectorAll('.preset-btn');
            const index = parseInt(e.key) - 1;
            if (presetBtns[index] && !isRunning) {
                presetBtns[index].click();
            }
            break;
    }
});

// モーダル外クリックで閉鎖
notificationModal.addEventListener('click', (e) => {
    if (e.target === notificationModal) {
        closeNotificationModal();
    }
});

// ページ離脱時の警告
window.addEventListener('beforeunload', (e) => {
    if (isRunning && !isPaused) {
        e.preventDefault();
        e.returnValue = 'タイマーが実行中です。ページを離れますか？';
        return e.returnValue;
    }
});

// ページ可視性変更時の処理
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning && !isPaused) {
        // バックグラウンドでの精度を保つためにタイムスタンプを記録
        localStorage.setItem('timerBackgroundStart', Date.now().toString());
        localStorage.setItem('timerBackgroundRemaining', remainingSeconds.toString());
    } else if (!document.hidden && isRunning && !isPaused) {
        // フォアグラウンド復帰時の時間調整
        const backgroundStart = localStorage.getItem('timerBackgroundStart');
        const backgroundRemaining = localStorage.getItem('timerBackgroundRemaining');
        
        if (backgroundStart && backgroundRemaining) {
            const elapsed = Math.floor((Date.now() - parseInt(backgroundStart)) / 1000);
            const newRemaining = parseInt(backgroundRemaining) - elapsed;
            
            if (newRemaining <= 0) {
                finishTimer();
            } else {
                remainingSeconds = newRemaining;
                updateDisplay();
            }
            
            localStorage.removeItem('timerBackgroundStart');
            localStorage.removeItem('timerBackgroundRemaining');
        }
    }
});

// Web Notifications API（ブラウザ通知）
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showBrowserNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('タイマー終了', {
            body: '設定した時間が経過しました',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>',
            tag: 'timer-finished'
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

// 初期化時に通知許可を要求
requestNotificationPermission();

// タイマー終了時にブラウザ通知も表示
const originalFinishTimer = finishTimer;
finishTimer = function() {
    originalFinishTimer();
    showBrowserNotification();
};