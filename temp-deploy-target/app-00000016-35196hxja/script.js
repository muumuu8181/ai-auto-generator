/**
 * Cosmic Hourglass - めちゃくちゃ格好良い砂時計 v1.0
 * Revolutionary space-themed timer application
 */

class CosmicHourglass {
    constructor() {
        this.totalTime = 3 * 60; // Default 3 minutes in seconds
        this.remainingTime = this.totalTime;
        this.isRunning = false;
        this.isPaused = false;
        this.timerInterval = null;
        this.startTime = null;
        this.pausedTime = 0;
        
        // Sound settings
        this.soundEnabled = true;
        this.volume = 0.5;
        
        // Animation settings
        this.particleCount = 0;
        this.sandStream = null;
        
        this.init();
    }

    init() {
        console.log('🌌 Cosmic Hourglass v1.0 初期化開始');
        
        // DOM elements
        this.elements = {
            // Time controls
            presetBtns: document.querySelectorAll('.preset-btn'),
            customMinutes: document.getElementById('custom-minutes'),
            setCustomBtn: document.querySelector('.set-custom-btn'),
            
            // Timer display
            timeRemaining: document.getElementById('timeRemaining'),
            totalTimeDisplay: document.getElementById('totalTime'),
            elapsedTimeDisplay: document.getElementById('elapsedTime'),
            timerStatusDisplay: document.getElementById('timerStatus'),
            
            // Control buttons
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            
            // Progress
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            // Hourglass elements
            hourglass: document.getElementById('hourglass'),
            topSand: document.getElementById('topSand'),
            bottomSand: document.getElementById('bottomSand'),
            sandStream: document.getElementById('sandStream'),
            topSandCanvas: document.getElementById('topSandCanvas'),
            bottomSandCanvas: document.getElementById('bottomSandCanvas'),
            
            // Sound controls
            soundEnabled: document.getElementById('soundEnabled'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            
            // Notification
            completionNotification: document.getElementById('completionNotification'),
            notificationClose: document.getElementById('notificationClose'),
            
            // Particle background
            particles: document.getElementById('particles')
        };

        this.setupEventListeners();
        this.setupCanvases();
        this.updateDisplay();
        this.createParticles();
        this.loadSettings();
        
        console.log('✅ Cosmic Hourglass v1.0 初期化完了');
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // Preset buttons
        this.elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setTime(minutes);
                this.updatePresetButtons(e.target);
            });
        });

        // Custom time setting
        this.elements.setCustomBtn.addEventListener('click', () => {
            const minutes = parseInt(this.elements.customMinutes.value);
            if (minutes && minutes > 0 && minutes <= 60) {
                this.setTime(minutes);
                this.updatePresetButtons(null);
                this.elements.customMinutes.value = '';
            } else {
                this.showNotification('1-60分の範囲で入力してください', 'warning');
            }
        });

        this.elements.customMinutes.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.setCustomBtn.click();
            }
        });

        // Control buttons
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        // Sound controls
        this.elements.soundEnabled.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.saveSettings();
        });

        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.elements.volumeValue.textContent = e.target.value + '%';
            this.saveSettings();
        });

        // Notification close
        this.elements.notificationClose.addEventListener('click', () => {
            this.hideCompletionNotification();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused) {
                this.handlePageHidden();
            } else if (!document.hidden && this.isRunning) {
                this.handlePageVisible();
            }
        });
    }

    setupCanvases() {
        // Setup canvas contexts
        if (this.elements.topSandCanvas && this.elements.bottomSandCanvas) {
            this.topCtx = this.elements.topSandCanvas.getContext('2d');
            this.bottomCtx = this.elements.bottomSandCanvas.getContext('2d');
            
            // Set canvas sizes
            const resizeCanvases = () => {
                const rect = this.elements.topSand.getBoundingClientRect();
                
                this.elements.topSandCanvas.width = rect.width;
                this.elements.topSandCanvas.height = rect.height;
                this.elements.bottomSandCanvas.width = rect.width;
                this.elements.bottomSandCanvas.height = rect.height;
                
                this.drawSand();
            };
            
            resizeCanvases();
            window.addEventListener('resize', resizeCanvases);
        }
    }

    createParticles() {
        const particleContainer = this.elements.particles;
        if (!particleContainer) return;

        // Create floating cosmic particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: ${Math.random() > 0.5 ? '#ffd700' : '#ffffff'};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.7 + 0.3};
                animation: float ${Math.random() * 10 + 10}s linear infinite;
            `;
            particleContainer.appendChild(particle);
        }
    }

    setTime(minutes) {
        if (this.isRunning) {
            this.showNotification('タイマー実行中は時間を変更できません', 'warning');
            return;
        }
        
        this.totalTime = minutes * 60;
        this.remainingTime = this.totalTime;
        this.updateDisplay();
        this.drawSand();
        
        this.showNotification(`時間を${minutes}分に設定しました`, 'success');
    }

    updatePresetButtons(activeBtn) {
        this.elements.presetBtns.forEach(btn => btn.classList.remove('active'));
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    start() {
        if (this.remainingTime <= 0) {
            this.showNotification('時間を設定してください', 'warning');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - this.pausedTime;
        
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        
        this.timerInterval = setInterval(() => {
            this.tick();
        }, 100); // Update every 100ms for smooth animation
        
        this.startSandAnimation();
        this.playSound('start');
        this.showNotification('タイマーを開始しました', 'success');
        
        console.log('⏳ タイマー開始:', this.formatTime(this.remainingTime));
    }

    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = true;
        this.isRunning = false;
        this.pausedTime = Date.now() - this.startTime;
        
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        this.stopSandAnimation();
        this.playSound('pause');
        this.showNotification('タイマーを一時停止しました', 'info');
        
        console.log('⏸️ タイマー一時停止');
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.pausedTime = 0;
        this.remainingTime = this.totalTime;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        this.stopSandAnimation();
        this.updateDisplay();
        this.drawSand();
        this.hideCompletionNotification();
        
        this.playSound('reset');
        this.showNotification('タイマーをリセットしました', 'info');
        
        console.log('🔄 タイマーリセット');
    }

    tick() {
        if (!this.isRunning) return;
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.remainingTime = Math.max(0, this.totalTime - elapsed);
        
        this.updateDisplay();
        this.drawSand();
        
        if (this.remainingTime <= 0) {
            this.complete();
        }
    }

    complete() {
        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = 0;
        
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        this.stopSandAnimation();
        this.updateDisplay();
        this.drawSand();
        
        this.showCompletionNotification();
        this.playSound('complete');
        this.triggerCompletionEffects();
        
        console.log('🎉 タイマー完了!');
    }

    updateDisplay() {
        // Time remaining
        if (this.elements.timeRemaining) {
            this.elements.timeRemaining.textContent = this.formatTime(this.remainingTime);
        }
        
        // Total time
        if (this.elements.totalTimeDisplay) {
            this.elements.totalTimeDisplay.textContent = `${Math.floor(this.totalTime / 60)}分`;
        }
        
        // Elapsed time
        if (this.elements.elapsedTimeDisplay) {
            const elapsed = this.totalTime - this.remainingTime;
            this.elements.elapsedTimeDisplay.textContent = this.formatTime(elapsed);
        }
        
        // Status
        if (this.elements.timerStatusDisplay) {
            let status = '待機中';
            if (this.isRunning) status = '実行中';
            else if (this.isPaused) status = '一時停止中';
            else if (this.remainingTime === 0 && this.totalTime > 0) status = '完了';
            
            this.elements.timerStatusDisplay.textContent = status;
        }
        
        // Progress
        const progress = this.totalTime > 0 ? ((this.totalTime - this.remainingTime) / this.totalTime) * 100 : 0;
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress}%`;
        }
        
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    drawSand() {
        if (!this.topCtx || !this.bottomCtx) return;
        
        const topCanvas = this.elements.topSandCanvas;
        const bottomCanvas = this.elements.bottomSandCanvas;
        
        // Calculate sand levels
        const progress = this.totalTime > 0 ? (this.totalTime - this.remainingTime) / this.totalTime : 0;
        const topSandHeight = topCanvas.height * (1 - progress);
        const bottomSandHeight = bottomCanvas.height * progress;
        
        // Clear canvases
        this.topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height);
        this.bottomCtx.clearRect(0, 0, bottomCanvas.width, bottomCanvas.height);
        
        // Draw top sand
        if (topSandHeight > 0) {
            const gradient = this.topCtx.createLinearGradient(0, 0, 0, topSandHeight);
            gradient.addColorStop(0, '#f4d03f');
            gradient.addColorStop(0.5, '#f7dc6f');
            gradient.addColorStop(1, '#f39c12');
            
            this.topCtx.fillStyle = gradient;
            this.topCtx.fillRect(0, topCanvas.height - topSandHeight, topCanvas.width, topSandHeight);
            
            // Add sand texture
            this.addSandTexture(this.topCtx, 0, topCanvas.height - topSandHeight, topCanvas.width, topSandHeight);
        }
        
        // Draw bottom sand
        if (bottomSandHeight > 0) {
            const gradient = this.bottomCtx.createLinearGradient(0, 0, 0, bottomSandHeight);
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(0.5, '#f7dc6f');
            gradient.addColorStop(1, '#f4d03f');
            
            this.bottomCtx.fillStyle = gradient;
            this.bottomCtx.fillRect(0, 0, bottomCanvas.width, bottomSandHeight);
            
            // Add sand texture
            this.addSandTexture(this.bottomCtx, 0, 0, bottomCanvas.width, bottomSandHeight);
        }
    }

    addSandTexture(ctx, x, y, width, height) {
        // Add small sand particles for realistic texture
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < width * height / 1000; i++) {
            const px = x + Math.random() * width;
            const py = y + Math.random() * height;
            const size = Math.random() * 2 + 1;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#e67e22' : '#d35400';
            ctx.fillRect(px, py, size, size);
        }
        
        ctx.restore();
    }

    startSandAnimation() {
        if (this.elements.sandStream && this.isRunning) {
            this.elements.sandStream.style.height = '100%';
            this.elements.sandStream.style.opacity = '1';
        }
    }

    stopSandAnimation() {
        if (this.elements.sandStream) {
            this.elements.sandStream.style.height = '0%';
            this.elements.sandStream.style.opacity = '0';
        }
    }

    showCompletionNotification() {
        if (this.elements.completionNotification) {
            this.elements.completionNotification.classList.add('show');
        }
    }

    hideCompletionNotification() {
        if (this.elements.completionNotification) {
            this.elements.completionNotification.classList.remove('show');
        }
    }

    triggerCompletionEffects() {
        // Trigger visual effects when timer completes
        const hourglass = this.elements.hourglass;
        if (hourglass) {
            hourglass.style.animation = 'none';
            setTimeout(() => {
                hourglass.style.animation = 'rotate 2s ease-in-out';
                setTimeout(() => {
                    hourglass.style.animation = '';
                }, 2000);
            }, 100);
        }
        
        // Flash the page title
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Cosmic Hourglass', {
                body: '設定した時間が経過しました！',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50">⧗</text></svg>'
            });
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Create audio context and play sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(this.volume * 0.1, audioContext.currentTime);
            
            let frequency;
            let duration;
            
            switch (type) {
                case 'start':
                    frequency = 440; // A4
                    duration = 0.2;
                    break;
                case 'pause':
                    frequency = 330; // E4
                    duration = 0.2;
                    break;
                case 'reset':
                    frequency = 220; // A3
                    duration = 0.2;
                    break;
                case 'complete':
                    // Play a sequence of notes
                    this.playCompletionMelody(audioContext);
                    return;
                default:
                    return;
            }
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
        } catch (error) {
            console.log('Sound not available:', error);
        }
    }

    playCompletionMelody(audioContext) {
        const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
        const duration = 0.3;
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                gainNode.gain.setValueAtTime(this.volume * 0.1, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            }, index * 200);
        });
    }

    handleKeyboardShortcuts(e) {
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                this.reset();
                break;
            case '1':
                e.preventDefault();
                this.setTime(1);
                break;
            case '3':
                e.preventDefault();
                this.setTime(3);
                break;
            case '5':
                e.preventDefault();
                this.setTime(5);
                break;
            case 'Escape':
                e.preventDefault();
                this.hideCompletionNotification();
                break;
        }
    }

    handlePageHidden() {
        // Store current state when page becomes hidden
        this.hiddenStartTime = Date.now();
    }

    handlePageVisible() {
        // Adjust timer when page becomes visible again
        if (this.hiddenStartTime && this.isRunning) {
            const hiddenDuration = Date.now() - this.hiddenStartTime;
            this.startTime -= hiddenDuration;
            this.hiddenStartTime = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = `cosmic-notification cosmic-notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.3);
        `;
        
        const colors = {
            success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            info: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    showWelcomeMessage() {
        setTimeout(() => {
            this.showNotification('Cosmic Hourglass v1.0へようこそ！', 'success');
            setTimeout(() => {
                this.showNotification('スペースキーでタイマーの開始/停止ができます', 'info');
            }, 2000);
        }, 1000);
    }

    saveSettings() {
        const settings = {
            soundEnabled: this.soundEnabled,
            volume: this.volume
        };
        localStorage.setItem('cosmicHourglassSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('cosmicHourglassSettings'));
            if (settings) {
                this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
                this.volume = settings.volume !== undefined ? settings.volume : 0.5;
                
                if (this.elements.soundEnabled) {
                    this.elements.soundEnabled.checked = this.soundEnabled;
                }
                if (this.elements.volumeSlider) {
                    this.elements.volumeSlider.value = this.volume * 100;
                    this.elements.volumeValue.textContent = Math.round(this.volume * 100) + '%';
                }
            }
        } catch (error) {
            console.log('Settings could not be loaded:', error);
        }
    }
}

// Initialize application
let cosmicHourglass;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌌 Cosmic Hourglass v1.0 起動開始');
    cosmicHourglass = new CosmicHourglass();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Error handling
    window.addEventListener('error', (e) => {
        console.error('アプリケーションエラー:', e.error);
        if (cosmicHourglass) {
            cosmicHourglass.showNotification('アプリケーションエラーが発生しました', 'error');
        }
    });
    
    console.log('✅ Cosmic Hourglass v1.0 起動完了');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes float {
        0%, 100% {
            transform: translateY(0px) rotate(0deg);
        }
        50% {
            transform: translateY(-20px) rotate(180deg);
        }
    }
`;
document.head.appendChild(style);

// Export for global access
window.CosmicHourglass = CosmicHourglass;