class BambooSlicingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.level = 1;
        this.totalCuts = 0;
        
        // Bamboo management
        this.bamboos = [];
        this.bambooSpeed = 2;
        this.bambooSpawnRate = 60; // frames between spawns
        this.frameCount = 0;
        
        // Cut mechanics
        this.isDrawing = false;
        this.cutPath = [];
        this.cuts = [];
        
        // Settings
        this.soundEnabled = true;
        this.volume = 0.7;
        this.difficulty = 'normal';
        
        // Physics
        this.gravity = 0.5;
        this.friction = 0.98;
        
        // Animation
        this.animationFrame = null;
        
        this.initElements();
        this.initEventListeners();
        this.initAudio();
        this.resizeCanvas();
        
        // Start render loop
        this.render();
    }
    
    initElements() {
        this.scoreEl = document.getElementById('score');
        this.comboEl = document.getElementById('combo');
        this.levelEl = document.getElementById('level');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.comboText = document.getElementById('comboText');
        
        // Settings elements
        this.soundToggle = document.getElementById('soundToggle');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.difficultySelect = document.getElementById('difficultySelect');
        
        // Modal elements
        this.finalScore = document.getElementById('finalScore');
        this.maxComboEl = document.getElementById('maxCombo');
        this.maxLevelEl = document.getElementById('maxLevel');
        this.totalCutsEl = document.getElementById('totalCuts');
        this.restartBtn = document.getElementById('restartBtn');
        this.shareBtn = document.getElementById('shareBtn');
    }
    
    initEventListeners() {
        // Game controls
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startCut(e));
        this.canvas.addEventListener('mousemove', (e) => this.continueCut(e));
        this.canvas.addEventListener('mouseup', () => this.endCut());
        this.canvas.addEventListener('mouseleave', () => this.endCut());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startCut(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.continueCut(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endCut();
        });
        
        // Settings
        this.soundToggle.addEventListener('click', () => this.toggleSound());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        this.difficultySelect.addEventListener('change', (e) => this.changeDifficulty(e.target.value));
        
        // Modal
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.shareBtn.addEventListener('click', () => this.shareScore());
        
        // Window events
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (!this.isRunning) {
                        this.startGame();
                    } else if (!this.isPaused) {
                        this.pauseGame();
                    } else {
                        this.resumeGame();
                    }
                    break;
                case 'KeyR':
                    this.resetGame();
                    break;
            }
        });
    }
    
    initAudio() {
        this.cutSounds = [
            document.getElementById('cutSound1'),
            document.getElementById('cutSound2')
        ];
        this.comboSound = document.getElementById('comboSound');
        
        // Update volume
        this.updateVolume(this.volume * 100);
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }
    
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        // Reset if needed
        if (this.bamboos.length === 0) {
            this.resetGameState();
        }
        
        this.gameLoop();
    }
    
    pauseGame() {
        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.gameLoop();
    }
    
    resetGame() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.resetGameState();
        this.updateDisplay();
        this.render();
    }
    
    resetGameState() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.level = 1;
        this.totalCuts = 0;
        this.bamboos = [];
        this.cuts = [];
        this.frameCount = 0;
        this.bambooSpeed = this.getDifficultySettings().speed;
        this.bambooSpawnRate = this.getDifficultySettings().spawnRate;
    }
    
    getDifficultySettings() {
        const settings = {
            easy: { speed: 1.5, spawnRate: 80, bambooCount: 1 },
            normal: { speed: 2, spawnRate: 60, bambooCount: 1 },
            hard: { speed: 3, spawnRate: 40, bambooCount: 2 },
            extreme: { speed: 4, spawnRate: 30, bambooCount: 3 }
        };
        return settings[this.difficulty];
    }
    
    gameLoop() {
        if (!this.isRunning || this.isPaused) return;
        
        this.update();
        this.render();
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        this.frameCount++;
        
        // Spawn bamboos
        const settings = this.getDifficultySettings();
        if (this.frameCount % this.bambooSpawnRate === 0) {
            this.spawnBamboo();
        }
        
        // Update bamboos
        for (let i = this.bamboos.length - 1; i >= 0; i--) {
            const bamboo = this.bamboos[i];
            this.updateBamboo(bamboo);
            
            // Remove bamboos that are off-screen
            if (bamboo.y > this.canvas.height + 100) {
                this.bamboos.splice(i, 1);
                // Reset combo if bamboo escapes
                if (this.combo > 0) {
                    this.combo = 0;
                    this.updateDisplay();
                }
            }
        }
        
        // Update cuts
        for (let i = this.cuts.length - 1; i >= 0; i--) {
            this.cuts[i].life--;
            if (this.cuts[i].life <= 0) {
                this.cuts.splice(i, 1);
            }
        }
        
        // Level progression
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.bambooSpeed += 0.5;
            this.bambooSpawnRate = Math.max(20, this.bambooSpawnRate - 5);
        }
        
        this.updateDisplay();
    }
    
    spawnBamboo() {
        const settings = this.getDifficultySettings();
        const bambooCount = Math.min(settings.bambooCount, this.level);
        
        for (let i = 0; i < bambooCount; i++) {
            const bamboo = {
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: -50 - (i * 100),
                width: 40,
                height: 120,
                speed: this.bambooSpeed + Math.random() * 0.5,
                rotation: 0,
                rotationSpeed: 0,
                isCut: false,
                segments: []
            };
            
            this.bamboos.push(bamboo);
        }
    }
    
    updateBamboo(bamboo) {
        if (!bamboo.isCut) {
            bamboo.y += bamboo.speed;
        } else {
            // Update cut segments
            bamboo.segments.forEach(segment => {
                segment.x += segment.vx;
                segment.y += segment.vy;
                segment.vy += this.gravity;
                segment.vx *= this.friction;
                segment.vy *= this.friction;
                segment.rotation += segment.rotationSpeed;
            });
        }
    }
    
    startCut(e) {
        if (!this.isRunning || this.isPaused) return;
        
        this.isDrawing = true;
        this.cutPath = [];
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.scaleX;
        const y = (e.clientY - rect.top) * this.scaleY;
        
        this.cutPath.push({ x, y });
    }
    
    continueCut(e) {
        if (!this.isDrawing || !this.isRunning || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * this.scaleX;
        const y = (e.clientY - rect.top) * this.scaleY;
        
        this.cutPath.push({ x, y });
        
        // Check for bamboo cuts
        this.checkBambooCuts(x, y);
    }
    
    endCut() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.cutPath.length > 1) {
            // Add cut line effect
            this.addCutEffect();
        }
        
        this.cutPath = [];
    }
    
    checkBambooCuts(x, y) {
        for (let bamboo of this.bamboos) {
            if (bamboo.isCut) continue;
            
            // Simple collision detection
            if (x >= bamboo.x && x <= bamboo.x + bamboo.width &&
                y >= bamboo.y && y <= bamboo.y + bamboo.height) {
                
                this.cutBamboo(bamboo, x, y);
            }
        }
    }
    
    cutBamboo(bamboo, cutX, cutY) {
        bamboo.isCut = true;
        
        // Create bamboo segments
        const topHeight = cutY - bamboo.y;
        const bottomHeight = bamboo.height - topHeight;
        
        bamboo.segments = [
            {
                x: bamboo.x,
                y: bamboo.y,
                width: bamboo.width,
                height: topHeight,
                vx: -2 + Math.random() * 4,
                vy: -3 - Math.random() * 3,
                rotation: 0,
                rotationSpeed: (-0.2 + Math.random() * 0.4)
            },
            {
                x: bamboo.x,
                y: cutY,
                width: bamboo.width,
                height: bottomHeight,
                vx: -2 + Math.random() * 4,
                vy: -1 - Math.random() * 2,
                rotation: 0,
                rotationSpeed: (-0.2 + Math.random() * 0.4)
            }
        ];
        
        // Update score and combo
        this.combo++;
        this.totalCuts++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        const baseScore = 100;
        const comboBonus = this.combo * 10;
        const levelBonus = this.level * 5;
        const points = baseScore + comboBonus + levelBonus;
        
        this.score += points;
        
        // Play sound
        this.playCutSound();
        
        // Create particles
        this.createCutParticles(cutX, cutY);
        
        // Show combo text
        if (this.combo > 1) {
            this.showComboText();
        }
        
        this.updateDisplay();
    }
    
    addCutEffect() {
        if (this.cutPath.length < 2) return;
        
        const start = this.cutPath[0];
        const end = this.cutPath[this.cutPath.length - 1];
        
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const cutLine = document.createElement('div');
        cutLine.className = 'cut-line';
        cutLine.style.left = start.x + 'px';
        cutLine.style.top = start.y + 'px';
        cutLine.style.height = length + 'px';
        cutLine.style.transform = `rotate(${angle + Math.PI/2}rad)`;
        cutLine.style.transformOrigin = 'top center';
        
        document.getElementById('effectsOverlay').appendChild(cutLine);
        
        // Remove after animation
        setTimeout(() => {
            if (cutLine.parentNode) {
                cutLine.parentNode.removeChild(cutLine);
            }
        }, 500);
    }
    
    createCutParticles(x, y) {
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = Math.random() < 0.7 ? 'particle' : 'bamboo-particle';
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 50 + Math.random() * 50;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.transform = `translate(${dx}px, ${dy}px)`;
            
            document.getElementById('particleContainer').appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }
    
    showComboText() {
        this.comboText.textContent = `${this.combo} COMBO!`;
        this.comboText.style.opacity = '1';
        this.comboText.style.animation = 'none';
        
        // Trigger animation
        setTimeout(() => {
            this.comboText.style.animation = 'comboPopup 1s ease-out';
        }, 10);
        
        // Play combo sound
        if (this.soundEnabled && this.combo % 5 === 0) {
            this.playComboSound();
        }
    }
    
    playCutSound() {
        if (!this.soundEnabled) return;
        
        const sound = this.cutSounds[Math.floor(Math.random() * this.cutSounds.length)];
        sound.currentTime = 0;
        sound.volume = this.volume;
        sound.play().catch(e => console.log('Cannot play cut sound:', e));
    }
    
    playComboSound() {
        if (!this.soundEnabled) return;
        
        this.comboSound.currentTime = 0;
        this.comboSound.volume = this.volume * 0.8;
        this.comboSound.play().catch(e => console.log('Cannot play combo sound:', e));
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bamboos
        this.bamboos.forEach(bamboo => this.drawBamboo(bamboo));
        
        // Draw cut path
        if (this.isDrawing && this.cutPath.length > 1) {
            this.drawCutPath();
        }
    }
    
    drawBamboo(bamboo) {
        this.ctx.save();
        
        if (!bamboo.isCut) {
            // Draw whole bamboo
            this.drawBambooSegment(bamboo.x, bamboo.y, bamboo.width, bamboo.height, 0);
        } else {
            // Draw cut segments
            bamboo.segments.forEach(segment => {
                this.ctx.save();
                this.ctx.translate(segment.x + segment.width/2, segment.y + segment.height/2);
                this.ctx.rotate(segment.rotation);
                this.drawBambooSegment(-segment.width/2, -segment.height/2, segment.width, segment.height, 0);
                this.ctx.restore();
            });
        }
        
        this.ctx.restore();
    }
    
    drawBambooSegment(x, y, width, height, rotation) {
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#228B22');
        gradient.addColorStop(0.3, '#32CD32');
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(1, '#228B22');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
        
        // Add bamboo joints
        const jointCount = Math.floor(height / 30);
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 2;
        
        for (let i = 1; i < jointCount; i++) {
            const jointY = y + (height / jointCount) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, jointY);
            this.ctx.lineTo(x + width, jointY);
            this.ctx.stroke();
        }
        
        // Add bamboo texture
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const lineX = x + (width / 4) * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, y);
            this.ctx.lineTo(lineX, y + height);
            this.ctx.stroke();
        }
    }
    
    drawCutPath() {
        if (this.cutPath.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowColor = '#FFA500';
        this.ctx.shadowBlur = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.cutPath[0].x, this.cutPath[0].y);
        
        for (let i = 1; i < this.cutPath.length; i++) {
            this.ctx.lineTo(this.cutPath[i].x, this.cutPath[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    updateDisplay() {
        this.scoreEl.textContent = this.score.toLocaleString();
        this.comboEl.textContent = this.combo;
        this.levelEl.textContent = this.level;
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.soundToggle.textContent = this.soundEnabled ? 'ON' : 'OFF';
        this.soundToggle.classList.toggle('active', this.soundEnabled);
    }
    
    updateVolume(value) {
        this.volume = value / 100;
        this.volumeValue.textContent = value + '%';
    }
    
    changeDifficulty(difficulty) {
        this.difficulty = difficulty;
        if (!this.isRunning) {
            this.resetGameState();
        }
    }
    
    gameOver() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Show game over modal
        this.finalScore.textContent = this.score.toLocaleString();
        this.maxComboEl.textContent = this.maxCombo;
        this.maxLevelEl.textContent = this.level;
        this.totalCutsEl.textContent = this.totalCuts;
        
        this.gameOverModal.classList.add('show');
    }
    
    restartGame() {
        this.gameOverModal.classList.remove('show');
        this.resetGame();
        this.startGame();
    }
    
    shareScore() {
        const text = `🎋 ひたすら竹を竹ゲーム 🎋\nスコア: ${this.score.toLocaleString()}\n最高コンボ: ${this.maxCombo}\nレベル: ${this.level}\n\n遊んでみよう！`;
        
        if (navigator.share) {
            navigator.share({
                title: 'ひたすら竹を竹ゲーム',
                text: text
            }).catch(e => console.log('Share failed:', e));
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('スコアをクリップボードにコピーしました！');
            }).catch(() => {
                // Final fallback
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('スコアをクリップボードにコピーしました！');
            });
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new BambooSlicingGame();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.isRunning && !game.isPaused) {
            game.pauseGame();
        }
    });
    
    // Prevent context menu on canvas
    game.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
});