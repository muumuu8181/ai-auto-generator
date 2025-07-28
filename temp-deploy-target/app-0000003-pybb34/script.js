class Hourglass {
    constructor() {
        this.topCanvas = document.getElementById('topCanvas');
        this.bottomCanvas = document.getElementById('bottomCanvas');
        this.topCtx = this.topCanvas.getContext('2d');
        this.bottomCtx = this.bottomCanvas.getContext('2d');
        
        this.selectedTime = 30;
        this.remainingTime = 30;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedTime = 0;
        
        this.currentTheme = 'golden';
        this.soundEnabled = true;
        this.volume = 0.5;
        
        this.sandParticles = {
            top: [],
            falling: [],
            bottom: []
        };
        
        this.animationFrame = null;
        
        this.initElements();
        this.initEventListeners();
        this.initSandParticles();
        this.updateDisplay();
        this.animate();
        
        this.createAmbientParticles();
    }
    
    initElements() {
        this.remainingTimeEl = document.getElementById('remainingTime');
        this.progressFillEl = document.getElementById('progressFill');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.soundToggle = document.getElementById('soundToggle');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.sandAudio = document.getElementById('sandAudio');
        
        this.sandAudio.volume = this.volume;
    }
    
    initEventListeners() {
        // Time selector buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isRunning) return;
                
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.selectedTime = parseInt(e.target.dataset.time);
                this.remainingTime = this.selectedTime;
                this.updateDisplay();
                this.resetSandParticles();
            });
        });
        
        // Action buttons
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Sound controls
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.sandAudio.volume = this.volume;
        });
        
        // Theme selector
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.currentTheme = e.target.dataset.theme;
                document.body.setAttribute('data-theme', this.currentTheme);
                this.updateTheme();
            });
        });
        
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    }
    
    initSandParticles() {
        const topParticleCount = Math.floor(this.selectedTime * 50);
        
        this.sandParticles.top = [];
        this.sandParticles.falling = [];
        this.sandParticles.bottom = [];
        
        // Create top particles
        for (let i = 0; i < topParticleCount; i++) {
            this.sandParticles.top.push({
                x: 50 + Math.random() * 200,
                y: 50 + Math.random() * 120,
                size: 1 + Math.random() * 2,
                opacity: 0.7 + Math.random() * 0.3,
                velX: (Math.random() - 0.5) * 0.5,
                velY: 0,
                color: this.getThemeColor()
            });
        }
    }
    
    resetSandParticles() {
        this.initSandParticles();
    }
    
    getThemeColor() {
        const colors = {
            golden: '#FFD700',
            crystal: '#E0E0E0',
            ocean: '#4FC3F7',
            fire: '#FF5722',
            space: '#9C27B0'
        };
        return colors[this.currentTheme] || colors.golden;
    }
    
    start() {
        if (this.isPaused) {
            this.startTime = Date.now() - this.pausedTime;
            this.isPaused = false;
        } else {
            this.startTime = Date.now();
            this.pausedTime = 0;
        }
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        if (this.soundEnabled) {
            this.sandAudio.play().catch(e => console.log('Cannot play audio:', e));
        }
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = true;
        this.isRunning = false;
        this.pausedTime = Date.now() - this.startTime;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        this.sandAudio.pause();
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = this.selectedTime;
        this.startTime = null;
        this.pausedTime = 0;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        this.sandAudio.pause();
        this.sandAudio.currentTime = 0;
        
        this.updateDisplay();
        this.resetSandParticles();
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        if (!this.soundEnabled) {
            this.sandAudio.pause();
        } else if (this.isRunning) {
            this.sandAudio.play().catch(e => console.log('Cannot play audio:', e));
        }
    }
    
    updateTheme() {
        // Update particle colors
        this.sandParticles.top.forEach(particle => {
            particle.color = this.getThemeColor();
        });
        this.sandParticles.falling.forEach(particle => {
            particle.color = this.getThemeColor();
        });
        this.sandParticles.bottom.forEach(particle => {
            particle.color = this.getThemeColor();
        });
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = Math.floor(this.remainingTime % 60);
        this.remainingTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = ((this.selectedTime - this.remainingTime) / this.selectedTime) * 100;
        this.progressFillEl.style.width = `${progress}%`;
    }
    
    update() {
        if (this.isRunning && !this.isPaused) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.remainingTime = Math.max(0, this.selectedTime - elapsed);
            
            if (this.remainingTime <= 0) {
                this.complete();
                return;
            }
            
            this.updateDisplay();
            this.updateSandFlow();
        }
    }
    
    updateSandFlow() {
        const progress = (this.selectedTime - this.remainingTime) / this.selectedTime;
        const particlesToMove = Math.floor(this.sandParticles.top.length * progress) - this.sandParticles.falling.length - this.sandParticles.bottom.length;
        
        // Move particles from top to falling
        for (let i = 0; i < Math.max(0, particlesToMove) && this.sandParticles.top.length > 0; i++) {
            const particle = this.sandParticles.top.pop();
            particle.x = 147 + (Math.random() - 0.5) * 6; // Center neck position
            particle.y = 180;
            particle.velY = 2 + Math.random() * 3;
            particle.velX = (Math.random() - 0.5) * 1;
            this.sandParticles.falling.push(particle);
        }
        
        // Update falling particles
        for (let i = this.sandParticles.falling.length - 1; i >= 0; i--) {
            const particle = this.sandParticles.falling[i];
            particle.y += particle.velY;
            particle.x += particle.velX;
            particle.velY += 0.1; // Gravity
            
            // Add some randomness
            particle.velX += (Math.random() - 0.5) * 0.1;
            
            // If particle reaches bottom, move to bottom collection
            if (particle.y >= 280) {
                particle.y = 280 - Math.random() * 100;
                particle.x = 50 + Math.random() * 200;
                particle.velX = 0;
                particle.velY = 0;
                this.sandParticles.bottom.push(particle);
                this.sandParticles.falling.splice(i, 1);
            }
        }
        
        // Rearrange bottom particles
        this.sandParticles.bottom.forEach(particle => {
            const centerX = 150;
            const maxDistFromCenter = 100;
            const targetY = 380 - (Math.abs(particle.x - centerX) / maxDistFromCenter) * 50;
            
            if (particle.y > targetY) {
                particle.y = Math.max(particle.y - 0.5, targetY);
            }
        });
    }
    
    complete() {
        this.isRunning = false;
        this.remainingTime = 0;
        this.updateDisplay();
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        this.sandAudio.pause();
        
        // Completion effects
        this.createCompletionEffect();
        
        // Play completion sound
        if (this.soundEnabled) {
            this.playCompletionSound();
        }
    }
    
    createCompletionEffect() {
        // Create burst of particles
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createSparkle(
                    150 + (Math.random() - 0.5) * 300,
                    225 + (Math.random() - 0.5) * 200
                );
            }, i * 20);
        }
        
        // Flash effect
        document.body.style.background = 'rgba(255, 255, 255, 0.3)';
        setTimeout(() => {
            document.body.style.background = '';
        }, 200);
    }
    
    createSparkle(x, y) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        sparkle.style.width = '6px';
        sparkle.style.height = '6px';
        sparkle.style.background = this.getThemeColor();
        sparkle.style.borderRadius = '50%';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.zIndex = '1000';
        sparkle.style.boxShadow = `0 0 20px ${this.getThemeColor()}`;
        
        document.body.appendChild(sparkle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 100;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const x2 = x + Math.cos(angle) * velocity * elapsed;
            const y2 = y + Math.sin(angle) * velocity * elapsed - 50 * elapsed * elapsed;
            
            sparkle.style.left = x2 + 'px';
            sparkle.style.top = y2 + 'px';
            sparkle.style.opacity = Math.max(0, 1 - elapsed);
            
            if (elapsed < 1) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(sparkle);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    playCompletionSound() {
        // Create a simple completion tone using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.4);
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.6);
        } catch (e) {
            console.log('Cannot play completion sound:', e);
        }
    }
    
    drawSand() {
        // Clear canvases
        this.topCtx.clearRect(0, 0, 300, 200);
        this.bottomCtx.clearRect(0, 0, 300, 200);
        
        // Draw top sand
        this.topCtx.save();
        this.sandParticles.top.forEach(particle => {
            this.topCtx.globalAlpha = particle.opacity;
            this.topCtx.fillStyle = particle.color;
            this.topCtx.shadowBlur = 3;
            this.topCtx.shadowColor = particle.color;
            this.topCtx.beginPath();
            this.topCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.topCtx.fill();
        });
        this.topCtx.restore();
        
        // Draw falling sand
        this.topCtx.save();
        this.sandParticles.falling.forEach(particle => {
            if (particle.y < 200) {
                this.topCtx.globalAlpha = particle.opacity;
                this.topCtx.fillStyle = particle.color;
                this.topCtx.shadowBlur = 3;
                this.topCtx.shadowColor = particle.color;
                this.topCtx.beginPath();
                this.topCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.topCtx.fill();
            }
        });
        this.topCtx.restore();
        
        // Draw falling sand on bottom canvas
        this.bottomCtx.save();
        this.sandParticles.falling.forEach(particle => {
            if (particle.y >= 200) {
                const y = particle.y - 250; // Adjust for bottom canvas
                this.bottomCtx.globalAlpha = particle.opacity;
                this.bottomCtx.fillStyle = particle.color;
                this.bottomCtx.shadowBlur = 3;
                this.bottomCtx.shadowColor = particle.color;
                this.bottomCtx.beginPath();
                this.bottomCtx.arc(particle.x, y, particle.size, 0, Math.PI * 2);
                this.bottomCtx.fill();
            }
        });
        this.bottomCtx.restore();
        
        // Draw bottom sand
        this.bottomCtx.save();
        this.sandParticles.bottom.forEach(particle => {
            const y = particle.y - 250; // Adjust for bottom canvas
            this.bottomCtx.globalAlpha = particle.opacity;
            this.bottomCtx.fillStyle = particle.color;
            this.bottomCtx.shadowBlur = 3;
            this.bottomCtx.shadowColor = particle.color;
            this.bottomCtx.beginPath();
            this.bottomCtx.arc(particle.x, y, particle.size, 0, Math.PI * 2);
            this.bottomCtx.fill();
        });
        this.bottomCtx.restore();
    }
    
    createAmbientParticles() {
        setInterval(() => {
            if (Math.random() < 0.7) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.animationDuration = (3 + Math.random() * 4) + 's';
                particle.style.animationDelay = Math.random() * 2 + 's';
                
                document.getElementById('particleContainer').appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 7000);
            }
        }, 500);
    }
    
    handleResize() {
        // Handle responsive canvas sizing if needed
        const rect = this.topCanvas.getBoundingClientRect();
        if (rect.width !== 300) {
            // Adjust canvas size for mobile if needed
        }
    }
    
    animate() {
        this.update();
        this.drawSand();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.sandAudio.pause();
    }
}

// Initialize the hourglass when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const hourglass = new Hourglass();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            hourglass.pause();
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        hourglass.destroy();
    });
});