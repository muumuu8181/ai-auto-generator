/**
 * Glow Tiles - タップで光るパズル v1.0
 */

class GlowTilesGame {
    constructor() {
        // Game settings
        this.gridSize = 5;
        this.currentLevel = 1;
        this.moveCount = 0;
        this.score = 0;
        this.soundEnabled = true;
        
        // Level configurations
        this.levels = [
            { size: 3, target: 5, pattern: [[1,1], [0,1]] },
            { size: 4, target: 6, pattern: [[0,0], [1,1], [2,2]] },
            { size: 4, target: 7, pattern: [[1,0], [2,1], [1,2], [0,1]] },
            { size: 5, target: 8, pattern: [[2,2], [1,1], [3,3], [1,3], [3,1]] },
            { size: 5, target: 10, pattern: [[0,0], [4,4], [0,4], [4,0], [2,2]] },
            { size: 5, target: 9, pattern: [[1,0], [3,0], [0,2], [4,2], [2,4]] },
            { size: 6, target: 12, pattern: [[1,1], [4,1], [1,4], [4,4], [2,2], [3,3]] },
            { size: 6, target: 15, pattern: [[0,0], [5,5], [2,1], [3,4], [1,3], [4,2]] }
        ];
        
        // Board state
        this.board = [];
        this.solution = [];
        this.hintTimeout = null;
        
        // Audio context
        this.audioContext = null;
        
        // Particles
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.particles = [];
        
        this.init();
    }

    init() {
        console.log('🌟 Glow Tiles v1.0 初期化中...');
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initAudio();
        this.showStartScreen();
        
        // Start particle animation
        this.animateParticles();
        
        console.log('✅ Glow Tiles 準備完了！');
    }

    setupCanvas() {
        const resize = () => {
            this.particleCanvas.width = window.innerWidth;
            this.particleCanvas.height = window.innerHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetLevel();
        });
        
        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });
        
        document.getElementById('soundBtn').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Next level button
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    showStartScreen() {
        document.getElementById('startScreen').classList.add('active');
    }

    startGame() {
        document.getElementById('startScreen').classList.remove('active');
        this.currentLevel = 1;
        this.score = 0;
        this.loadLevel(this.currentLevel);
        this.playSound('start');
    }

    loadLevel(levelNum) {
        const levelIndex = (levelNum - 1) % this.levels.length;
        const level = this.levels[levelIndex];
        
        this.gridSize = level.size;
        this.moveCount = 0;
        
        // Initialize empty board
        this.board = Array(this.gridSize).fill(null).map(() => 
            Array(this.gridSize).fill(false)
        );
        
        // Apply pattern
        level.pattern.forEach(([row, col]) => {
            this.toggleTile(row, col, false);
        });
        
        // Store solution
        this.solution = [...level.pattern];
        
        // Update UI
        this.updateUI();
        this.renderBoard();
        
        // Update target moves
        document.getElementById('targetMoves').textContent = level.target;
    }

    renderBoard() {
        const boardEl = document.getElementById('gameBoard');
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                if (this.board[row][col]) {
                    tile.classList.add('active');
                }
                
                tile.addEventListener('click', () => {
                    this.handleTileClick(row, col);
                });
                
                boardEl.appendChild(tile);
            }
        }
    }

    handleTileClick(row, col) {
        this.moveCount++;
        this.toggleTile(row, col);
        
        // Create click effect
        this.createClickEffect(row, col);
        
        // Play sound
        this.playSound('click');
        
        // Check win condition
        if (this.checkWin()) {
            setTimeout(() => this.handleWin(), 500);
        }
        
        this.updateUI();
    }

    toggleTile(row, col, countMove = true) {
        // Toggle clicked tile
        this.board[row][col] = !this.board[row][col];
        
        // Toggle adjacent tiles
        const adjacent = [
            [row - 1, col], // top
            [row + 1, col], // bottom
            [row, col - 1], // left
            [row, col + 1]  // right
        ];
        
        adjacent.forEach(([r, c]) => {
            if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
                this.board[r][c] = !this.board[r][c];
            }
        });
        
        // Update visual board
        const tiles = document.querySelectorAll('.tile');
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const index = r * this.gridSize + c;
                if (this.board[r][c]) {
                    tiles[index].classList.add('active');
                } else {
                    tiles[index].classList.remove('active');
                }
            }
        }
    }

    checkWin() {
        return this.board.every(row => row.every(tile => tile));
    }

    handleWin() {
        const level = this.levels[(this.currentLevel - 1) % this.levels.length];
        const targetMoves = level.target;
        
        // Calculate score
        let stars = 1;
        if (this.moveCount <= targetMoves) stars = 3;
        else if (this.moveCount <= targetMoves + 2) stars = 2;
        
        const levelScore = (stars * 100) + (50 * Math.max(0, targetMoves - this.moveCount));
        this.score += levelScore;
        
        // Show victory
        this.showVictory(stars);
        this.playSound('win');
        this.createVictoryParticles();
    }

    showVictory(stars) {
        const victoryEl = document.getElementById('victoryEffect');
        victoryEl.classList.add('show');
        
        // Animate stars
        const starEls = victoryEl.querySelectorAll('.star');
        starEls.forEach((star, i) => {
            star.style.opacity = i < stars ? '1' : '0.3';
        });
    }

    nextLevel() {
        document.getElementById('victoryEffect').classList.remove('show');
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
        this.playSound('start');
    }

    resetLevel() {
        this.loadLevel(this.currentLevel);
        this.playSound('reset');
    }

    showHint() {
        if (this.solution.length > 0) {
            const tiles = document.querySelectorAll('.tile');
            
            // Remove previous hints
            tiles.forEach(tile => tile.classList.remove('hint'));
            
            // Show random solution tile
            const hint = this.solution[Math.floor(Math.random() * this.solution.length)];
            const index = hint[0] * this.gridSize + hint[1];
            tiles[index].classList.add('hint');
            
            // Remove hint after 2 seconds
            clearTimeout(this.hintTimeout);
            this.hintTimeout = setTimeout(() => {
                tiles[index].classList.remove('hint');
            }, 2000);
            
            this.playSound('hint');
        }
    }

    createClickEffect(row, col) {
        const boardRect = document.getElementById('gameBoard').getBoundingClientRect();
        const tileSize = boardRect.width / this.gridSize;
        const x = boardRect.left + (col + 0.5) * tileSize;
        const y = boardRect.top + (row + 0.5) * tileSize;
        
        // Create expanding ring
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 200 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 2,
                color: this.board[row][col] ? '#3b82f6' : '#1e293b',
                life: 1,
                decay: 0.02
            });
        }
    }

    createVictoryParticles() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 300;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                size: 2 + Math.random() * 4,
                color: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'][Math.floor(Math.random() * 4)],
                life: 1,
                decay: 0.01
            });
        }
    }

    animateParticles() {
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * 0.016;
            particle.y += particle.vy * 0.016;
            particle.vy += 200 * 0.016; // gravity
            particle.life -= particle.decay;
            
            if (particle.life > 0) {
                this.particleCtx.save();
                this.particleCtx.globalAlpha = particle.life;
                this.particleCtx.fillStyle = particle.color;
                this.particleCtx.shadowColor = particle.color;
                this.particleCtx.shadowBlur = 10;
                
                this.particleCtx.beginPath();
                this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.particleCtx.fill();
                
                this.particleCtx.restore();
                return true;
            }
            return false;
        });
        
        // Add ambient particles
        if (Math.random() < 0.02) {
            this.particles.push({
                x: Math.random() * this.particleCanvas.width,
                y: this.particleCanvas.height,
                vx: (Math.random() - 0.5) * 50,
                vy: -50 - Math.random() * 50,
                size: 1 + Math.random() * 2,
                color: '#6366f1',
                life: 1,
                decay: 0.005
            });
        }
        
        requestAnimationFrame(() => this.animateParticles());
    }

    updateUI() {
        document.getElementById('currentLevel').textContent = this.currentLevel;
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('score').textContent = this.score;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#soundBtn .btn-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        switch(type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
                
            case 'win':
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, i) => {
                    const o = this.audioContext.createOscillator();
                    const g = this.audioContext.createGain();
                    o.connect(g);
                    g.connect(this.audioContext.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + i * 0.1);
                    g.gain.setValueAtTime(0.2, now + i * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                    o.start(now + i * 0.1);
                    o.stop(now + i * 0.1 + 0.3);
                });
                break;
                
            case 'hint':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
                
            case 'reset':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
                
            case 'start':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
        }
    }
}

// Initialize game
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Glow Tiles - タップで光るパズル v1.0');
    game = new GlowTilesGame();
});

// Export for debugging
window.GlowTilesGame = GlowTilesGame;