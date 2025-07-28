/**
 * 竹斬道 TAKEKIRI-DO v1.0
 * ひたすら竹を斬るゲーム
 */

class BambooSlashGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.effectCanvas = document.getElementById('effectCanvas');
        this.effectCtx = this.effectCanvas.getContext('2d');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        // Game state
        this.isStarted = false;
        this.slashCount = 0;
        this.comboCount = 0;
        this.bestScore = localStorage.getItem('bambooSlashBest') || 0;
        this.lastSlashTime = 0;
        this.comboTimeout = null;
        
        // Bamboo management
        this.bamboos = [];
        this.maxBamboos = 8;
        this.bambooSpawnTimer = 0;
        this.bambooSpawnInterval = 1500;
        
        // Slash tracking
        this.isSlashing = false;
        this.slashStart = null;
        this.slashEnd = null;
        this.slashPoints = [];
        
        // Particles
        this.particles = [];
        this.slashEffects = [];
        
        // Sound
        this.soundEnabled = true;
        this.audioContext = null;
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        this.init();
    }

    init() {
        console.log('🎋 竹斬道 v1.0 初期化中...');
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initAudio();
        this.createFallingLeaves();
        this.updateUI();
        
        // Show start screen
        document.getElementById('startScreen').classList.add('active');
        
        console.log('✅ 竹斬道 準備完了！');
    }

    setupCanvas() {
        // Set canvas size
        const resize = () => {
            const maxWidth = Math.min(800, window.innerWidth * 0.9);
            const maxHeight = Math.min(600, window.innerHeight * 0.6);
            
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
            this.effectCanvas.width = maxWidth;
            this.effectCanvas.height = maxHeight;
            this.particleCanvas.width = maxWidth;
            this.particleCanvas.height = maxHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Sound toggle
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startSlash(e));
        this.canvas.addEventListener('mousemove', (e) => this.continueSlash(e));
        this.canvas.addEventListener('mouseup', () => this.endSlash());
        this.canvas.addEventListener('mouseleave', () => this.endSlash());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.startSlash(e.touches[0]), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.continueSlash(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => this.endSlash());
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    createFallingLeaves() {
        const leavesContainer = document.getElementById('fallingLeaves');
        
        setInterval(() => {
            if (Math.random() < 0.3) {
                const leaf = document.createElement('div');
                leaf.className = 'leaf';
                leaf.style.left = Math.random() * 100 + '%';
                leaf.style.animationDuration = (Math.random() * 10 + 10) + 's';
                leaf.style.transform = `rotate(${Math.random() * 360}deg)`;
                leavesContainer.appendChild(leaf);
                
                setTimeout(() => leaf.remove(), 20000);
            }
        }, 2000);
    }

    startGame() {
        document.getElementById('startScreen').classList.remove('active');
        this.isStarted = true;
        this.slashCount = 0;
        this.comboCount = 0;
        this.bamboos = [];
        this.particles = [];
        
        this.spawnInitialBamboos();
        this.gameLoop();
        this.playSound('start');
    }

    spawnInitialBamboos() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.spawnBamboo(), i * 200);
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.isStarted) {
            this.update(deltaTime);
            this.render();
        }
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update bamboo spawn timer
        this.bambooSpawnTimer += deltaTime;
        if (this.bambooSpawnTimer > this.bambooSpawnInterval && this.bamboos.length < this.maxBamboos) {
            this.spawnBamboo();
            this.bambooSpawnTimer = 0;
        }
        
        // Update bamboos
        this.bamboos = this.bamboos.filter(bamboo => {
            bamboo.swayPhase += deltaTime * 0.001;
            bamboo.x = bamboo.baseX + Math.sin(bamboo.swayPhase) * bamboo.swayAmount;
            
            // Update cut animation
            if (bamboo.isCut) {
                bamboo.cutAnimation += deltaTime * 0.005;
                bamboo.topPart.y -= bamboo.fallSpeed * deltaTime * 0.001;
                bamboo.topPart.rotation += bamboo.rotationSpeed * deltaTime * 0.001;
                bamboo.opacity = Math.max(0, 1 - bamboo.cutAnimation);
                
                return bamboo.cutAnimation < 1;
            }
            
            return true;
        });
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update slash effects
        this.updateSlashEffects(deltaTime);
    }

    render() {
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.effectCtx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Draw bamboos
        this.bamboos.forEach(bamboo => this.drawBamboo(bamboo));
        
        // Draw particles
        this.drawParticles();
        
        // Draw slash effects
        this.drawSlashEffects();
        
        // Draw current slash
        if (this.isSlashing && this.slashPoints.length > 1) {
            this.drawSlashTrail();
        }
    }

    spawnBamboo() {
        const bamboo = {
            id: Date.now() + Math.random(),
            x: Math.random() * (this.canvas.width - 60) + 30,
            baseX: 0,
            y: this.canvas.height,
            width: 40 + Math.random() * 30,
            height: 300 + Math.random() * 200,
            segments: 4 + Math.floor(Math.random() * 3),
            color: `hsl(${100 + Math.random() * 40}, ${50 + Math.random() * 20}%, ${30 + Math.random() * 20}%)`,
            swayAmount: 5 + Math.random() * 10,
            swayPhase: Math.random() * Math.PI * 2,
            isCut: false,
            cutY: 0,
            topPart: null,
            cutAnimation: 0,
            fallSpeed: 200 + Math.random() * 100,
            rotationSpeed: 0.5 + Math.random() * 0.5,
            opacity: 1
        };
        
        bamboo.baseX = bamboo.x;
        this.bamboos.push(bamboo);
    }

    drawBamboo(bamboo) {
        this.ctx.save();
        this.ctx.globalAlpha = bamboo.opacity;
        
        if (bamboo.isCut) {
            // Draw bottom part
            this.drawBambooSegment(bamboo.x, bamboo.y, bamboo.width, bamboo.cutY - bamboo.y, bamboo.color);
            
            // Draw top part
            if (bamboo.topPart) {
                this.ctx.save();
                this.ctx.translate(bamboo.topPart.x + bamboo.width / 2, bamboo.topPart.y + bamboo.topPart.height / 2);
                this.ctx.rotate(bamboo.topPart.rotation);
                this.drawBambooSegment(-bamboo.width / 2, -bamboo.topPart.height / 2, bamboo.width, bamboo.topPart.height, bamboo.color);
                this.ctx.restore();
            }
        } else {
            // Draw full bamboo
            this.drawBambooSegment(bamboo.x, bamboo.y - bamboo.height, bamboo.width, bamboo.height, bamboo.color);
        }
        
        this.ctx.restore();
    }

    drawBambooSegment(x, y, width, height, color) {
        const segmentHeight = height / 5;
        
        for (let i = 0; i < 5; i++) {
            const segY = y + i * segmentHeight;
            
            // Main bamboo body
            const gradient = this.ctx.createLinearGradient(x, segY, x + width, segY);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, this.lightenColor(color, 20));
            gradient.addColorStop(1, color);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, segY, width, segmentHeight - 2);
            
            // Node/joint
            this.ctx.fillStyle = this.darkenColor(color, 20);
            this.ctx.fillRect(x - 2, segY + segmentHeight - 4, width + 4, 4);
        }
        
        // Bamboo top
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y - 20);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x + width, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    startSlash(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.isSlashing = true;
        this.slashStart = { x, y };
        this.slashPoints = [{ x, y }];
    }

    continueSlash(e) {
        if (!this.isSlashing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.slashEnd = { x, y };
        this.slashPoints.push({ x, y });
        
        // Check for bamboo cuts
        this.checkBambooCuts();
    }

    endSlash() {
        if (!this.isSlashing) return;
        
        this.isSlashing = false;
        
        if (this.slashPoints.length > 5) {
            this.createSlashEffect();
        }
        
        this.slashPoints = [];
    }

    checkBambooCuts() {
        if (this.slashPoints.length < 2) return;
        
        const lastPoint = this.slashPoints[this.slashPoints.length - 1];
        const prevPoint = this.slashPoints[this.slashPoints.length - 2];
        
        this.bamboos.forEach(bamboo => {
            if (!bamboo.isCut && this.checkLineIntersection(prevPoint, lastPoint, bamboo)) {
                this.cutBamboo(bamboo, lastPoint.y);
            }
        });
    }

    checkLineIntersection(p1, p2, bamboo) {
        const bambooLeft = bamboo.x;
        const bambooRight = bamboo.x + bamboo.width;
        const bambooTop = bamboo.y - bamboo.height;
        const bambooBottom = bamboo.y;
        
        // Check if line crosses bamboo horizontally
        if ((p1.x < bambooLeft && p2.x > bambooRight) || 
            (p1.x > bambooRight && p2.x < bambooLeft)) {
            
            // Calculate Y at intersection
            const t = (bambooLeft + bambooRight) / 2 - p1.x;
            const ratio = t / (p2.x - p1.x);
            const intersectY = p1.y + ratio * (p2.y - p1.y);
            
            return intersectY > bambooTop && intersectY < bambooBottom;
        }
        
        return false;
    }

    cutBamboo(bamboo, cutY) {
        bamboo.isCut = true;
        bamboo.cutY = cutY;
        
        // Create top part
        bamboo.topPart = {
            x: bamboo.x,
            y: bamboo.y - bamboo.height,
            height: cutY - (bamboo.y - bamboo.height),
            rotation: 0
        };
        
        // Update score
        this.slashCount++;
        this.comboCount++;
        
        // Reset combo timer
        clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            this.comboCount = 0;
            this.updateComboDisplay();
        }, 2000);
        
        // Create effects
        this.createCutEffects(bamboo.x + bamboo.width / 2, cutY);
        
        // Play sound
        this.playSound('cut');
        
        // Check for perfect cut
        const cutPosition = (cutY - (bamboo.y - bamboo.height)) / bamboo.height;
        if (cutPosition > 0.45 && cutPosition < 0.55) {
            this.showPerfectSlash();
            this.playSound('perfect');
        }
        
        // Update UI
        this.updateUI();
        this.updateComboDisplay();
        
        // Update best score
        if (this.slashCount > this.bestScore) {
            this.bestScore = this.slashCount;
            localStorage.setItem('bambooSlashBest', this.bestScore);
        }
    }

    createCutEffects(x, y) {
        // Create particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.2;
            const speed = 100 + Math.random() * 200;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#4a7c59' : '#8fbc8f',
                life: 1,
                decay: 0.02
            });
        }
        
        // Create slash spark
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 30,
            color: '#ffffff',
            life: 1,
            decay: 0.1,
            type: 'spark'
        });
    }

    createSlashEffect() {
        if (this.slashPoints.length < 2) return;
        
        const effect = {
            points: [...this.slashPoints],
            opacity: 1,
            width: 3,
            time: 0
        };
        
        this.slashEffects.push(effect);
        
        // Visual slash trail
        const trail = document.getElementById('slashTrail');
        const slashLine = document.createElement('div');
        slashLine.className = 'slash-line';
        
        const p1 = this.slashPoints[0];
        const p2 = this.slashPoints[this.slashPoints.length - 1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        
        const canvasRect = this.canvas.getBoundingClientRect();
        slashLine.style.left = (canvasRect.left + p1.x) + 'px';
        slashLine.style.top = (canvasRect.top + p1.y) + 'px';
        slashLine.style.width = length + 'px';
        slashLine.style.transform = `rotate(${angle}rad)`;
        
        trail.appendChild(slashLine);
        setTimeout(() => slashLine.remove(), 500);
    }

    drawSlashTrail() {
        this.effectCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.effectCtx.lineWidth = 3;
        this.effectCtx.lineCap = 'round';
        this.effectCtx.lineJoin = 'round';
        
        this.effectCtx.beginPath();
        this.slashPoints.forEach((point, index) => {
            if (index === 0) {
                this.effectCtx.moveTo(point.x, point.y);
            } else {
                this.effectCtx.lineTo(point.x, point.y);
            }
        });
        this.effectCtx.stroke();
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime * 0.001;
            particle.y += particle.vy * deltaTime * 0.001;
            particle.vy += 500 * deltaTime * 0.001; // gravity
            particle.life -= particle.decay;
            
            return particle.life > 0;
        });
    }

    updateSlashEffects(deltaTime) {
        this.slashEffects = this.slashEffects.filter(effect => {
            effect.time += deltaTime * 0.001;
            effect.opacity = Math.max(0, 1 - effect.time * 2);
            return effect.opacity > 0;
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.particleCtx.save();
            this.particleCtx.globalAlpha = particle.life;
            
            if (particle.type === 'spark') {
                // Draw spark effect
                const gradient = this.particleCtx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
                
                this.particleCtx.fillStyle = gradient;
                this.particleCtx.fillRect(
                    particle.x - particle.size,
                    particle.y - particle.size,
                    particle.size * 2,
                    particle.size * 2
                );
            } else {
                // Draw normal particle
                this.particleCtx.fillStyle = particle.color;
                this.particleCtx.fillRect(
                    particle.x - particle.size / 2,
                    particle.y - particle.size / 2,
                    particle.size,
                    particle.size
                );
            }
            
            this.particleCtx.restore();
        });
    }

    drawSlashEffects() {
        this.slashEffects.forEach(effect => {
            this.effectCtx.save();
            this.effectCtx.globalAlpha = effect.opacity;
            this.effectCtx.strokeStyle = '#ffffff';
            this.effectCtx.lineWidth = effect.width;
            this.effectCtx.lineCap = 'round';
            this.effectCtx.shadowColor = '#ffffff';
            this.effectCtx.shadowBlur = 20;
            
            this.effectCtx.beginPath();
            effect.points.forEach((point, index) => {
                if (index === 0) {
                    this.effectCtx.moveTo(point.x, point.y);
                } else {
                    this.effectCtx.lineTo(point.x, point.y);
                }
            });
            this.effectCtx.stroke();
            
            this.effectCtx.restore();
        });
    }

    showPerfectSlash() {
        const perfectElement = document.getElementById('perfectSlash');
        perfectElement.classList.add('active');
        setTimeout(() => perfectElement.classList.remove('active'), 1000);
    }

    updateUI() {
        document.getElementById('slashCount').textContent = this.slashCount;
        document.getElementById('comboCount').textContent = this.comboCount;
        document.getElementById('bestScore').textContent = this.bestScore;
    }

    updateComboDisplay() {
        const comboDisplay = document.getElementById('comboDisplay');
        const comboNumber = document.getElementById('comboNumber');
        
        if (this.comboCount > 1) {
            comboDisplay.classList.add('active');
            comboNumber.textContent = this.comboCount;
        } else {
            comboDisplay.classList.remove('active');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('.sound-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        switch(type) {
            case 'cut':
                this.playSlashSound();
                break;
            case 'perfect':
                this.playPerfectSound();
                break;
            case 'start':
                this.playStartSound();
                break;
        }
    }

    playSlashSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
        
        // Add whoosh sound
        const noise = this.createNoiseBuffer();
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noiseSource.buffer = noise;
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(5000, this.audioContext.currentTime + 0.05);
        
        noiseGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        noiseSource.start();
        noiseSource.stop(this.audioContext.currentTime + 0.05);
    }

    playPerfectSound() {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + i * 0.1 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
            
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
        });
    }

    playStartSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, this.audioContext.currentTime); // C4
        osc.frequency.exponentialRampToValueAtTime(523.25, this.audioContext.currentTime + 0.2); // C5
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }
}

// Initialize game
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎋 竹斬道 TAKEKIRI-DO v1.0');
    game = new BambooSlashGame();
});

// Export for debugging
window.BambooSlashGame = BambooSlashGame;