/**
 * NEON TETRIS - めちゃくちゃ格好良いテトリス v1.0
 * Cyberpunk-themed Tetris with incredible effects
 */

class NeonTetris {
    constructor() {
        // Game settings
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        this.DROP_SPEED = 1000; // Initial drop speed in ms
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.isStarted = false;
        
        // Timing
        this.lastDropTime = 0;
        this.animationId = null;
        
        // Audio
        this.soundEnabled = true;
        this.volume = 0.5;
        this.audioContext = null;
        
        // Canvas contexts
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.effectCanvas = document.getElementById('effectCanvas');
        this.effectCtx = this.effectCanvas.getContext('2d');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Particles and effects
        this.particles = [];
        this.lineEffects = [];
        
        // Tetromino definitions
        this.TETROMINOES = {
            I: {
                shape: [[1,1,1,1]],
                color: '#00ffff',
                glow: 'rgba(0, 255, 255, 0.5)'
            },
            O: {
                shape: [[1,1],[1,1]],
                color: '#ffff00',
                glow: 'rgba(255, 255, 0, 0.5)'
            },
            T: {
                shape: [[0,1,0],[1,1,1]],
                color: '#ff00ff',
                glow: 'rgba(255, 0, 255, 0.5)'
            },
            S: {
                shape: [[0,1,1],[1,1,0]],
                color: '#00ff00',
                glow: 'rgba(0, 255, 0, 0.5)'
            },
            Z: {
                shape: [[1,1,0],[0,1,1]],
                color: '#ff0000',
                glow: 'rgba(255, 0, 0, 0.5)'
            },
            J: {
                shape: [[1,0,0],[1,1,1]],
                color: '#0095ff',
                glow: 'rgba(0, 149, 255, 0.5)'
            },
            L: {
                shape: [[0,0,1],[1,1,1]],
                color: '#ff9500',
                glow: 'rgba(255, 149, 0, 0.5)'
            }
        };
        
        this.init();
    }

    init() {
        console.log('🎮 NEON TETRIS v1.0 Initializing...');
        
        this.initBoard();
        this.setupEventListeners();
        this.initAudio();
        this.showStartScreen();
        
        // Generate initial next pieces
        this.generateNextPieces();
        
        console.log('✅ NEON TETRIS Ready!');
    }

    initBoard() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Start button
        const startBtn = document.getElementById('startBtn');
        startBtn.addEventListener('click', () => this.startGame());
        
        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        restartBtn.addEventListener('click', () => this.restartGame());
        
        // Sound controls
        const soundToggle = document.getElementById('soundToggle');
        soundToggle.addEventListener('click', () => this.toggleSound());
        
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
        });
        
        // Start on any key
        document.addEventListener('keydown', (e) => {
            if (!this.isStarted && document.getElementById('startScreen').classList.contains('active')) {
                this.startGame();
            }
        }, { once: true });
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
        this.isStarted = true;
        this.spawnPiece();
        this.gameLoop();
        this.playSound('start');
        
        // Add start particles
        this.createBurstParticles(150, 300, 20);
    }

    gameLoop(currentTime = 0) {
        if (this.isGameOver || this.isPaused) return;
        
        // Drop piece
        if (currentTime - this.lastDropTime > this.getDropSpeed()) {
            this.moveDown();
            this.lastDropTime = currentTime;
        }
        
        // Update and render
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    getDropSpeed() {
        return Math.max(100, this.DROP_SPEED - (this.level - 1) * 100);
    }

    update() {
        // Update particles
        this.updateParticles();
        
        // Update line effects
        this.updateLineEffects();
    }

    render() {
        // Clear canvases
        this.clearCanvases();
        
        // Draw game board
        this.drawBoard();
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.gameCtx);
            this.drawGhostPiece();
        }
        
        // Draw effects
        this.drawParticles();
        this.drawLineEffects();
        
        // Update UI
        this.updateUI();
        
        // Draw side panels
        this.drawHoldPiece();
        this.drawNextPieces();
    }

    clearCanvases() {
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.effectCtx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
    }

    drawBoard() {
        // Draw grid
        this.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.gameCtx.lineWidth = 0.5;
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const x = col * this.BLOCK_SIZE;
                const y = row * this.BLOCK_SIZE;
                
                // Draw grid lines
                this.gameCtx.strokeRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
                
                // Draw placed blocks
                if (this.board[row][col]) {
                    this.drawBlock(x, y, this.board[row][col], this.gameCtx);
                }
            }
        }
    }

    drawBlock(x, y, color, ctx, size = this.BLOCK_SIZE) {
        // Main block
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // Inner gradient
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        ctx.shadowBlur = 0;
    }

    drawPiece(piece, ctx, offsetX = 0, offsetY = 0, blockSize = this.BLOCK_SIZE) {
        const type = this.TETROMINOES[piece.type];
        
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const drawX = (piece.x + x) * blockSize + offsetX;
                    const drawY = (piece.y + y) * blockSize + offsetY;
                    this.drawBlock(drawX, drawY, type.color, ctx, blockSize);
                }
            });
        });
    }

    drawGhostPiece() {
        const ghost = this.getGhostPiece();
        const type = this.TETROMINOES[ghost.type];
        
        this.gameCtx.globalAlpha = 0.3;
        ghost.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const drawX = (ghost.x + x) * this.BLOCK_SIZE;
                    const drawY = (ghost.y + y) * this.BLOCK_SIZE;
                    
                    this.gameCtx.strokeStyle = type.color;
                    this.gameCtx.lineWidth = 2;
                    this.gameCtx.strokeRect(drawX + 2, drawY + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
                }
            });
        });
        this.gameCtx.globalAlpha = 1;
    }

    getGhostPiece() {
        const ghost = {
            ...this.currentPiece,
            y: this.currentPiece.y
        };
        
        while (this.isValidMove(ghost, ghost.x, ghost.y + 1)) {
            ghost.y++;
        }
        
        return ghost;
    }

    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdPiece) {
            const piece = {
                ...this.holdPiece,
                x: 1,
                y: 1
            };
            
            this.holdCtx.globalAlpha = this.canHold ? 1 : 0.3;
            this.drawPiece(piece, this.holdCtx, 10, 10, 25);
            this.holdCtx.globalAlpha = 1;
        }
    }

    drawNextPieces() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        this.nextPieces.slice(0, 3).forEach((type, index) => {
            const piece = {
                type: type,
                shape: this.TETROMINOES[type].shape,
                x: 1,
                y: 1
            };
            
            const yOffset = index * 120 + 20;
            this.drawPiece(piece, this.nextCtx, 10, yOffset, 25);
        });
    }

    generateNextPieces() {
        const types = Object.keys(this.TETROMINOES);
        
        while (this.nextPieces.length < 5) {
            const randomType = types[Math.floor(Math.random() * types.length)];
            this.nextPieces.push(randomType);
        }
    }

    spawnPiece() {
        const type = this.nextPieces.shift();
        this.generateNextPieces();
        
        const shape = this.TETROMINOES[type].shape;
        this.currentPiece = {
            type: type,
            shape: shape,
            x: Math.floor((this.COLS - shape[0].length) / 2),
            y: 0
        };
        
        if (!this.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
        
        this.canHold = true;
    }

    handleKeyPress(e) {
        if (!this.isStarted || this.isGameOver) return;
        
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        
        if (this.isPaused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                this.moveLeft();
                break;
            case 'ArrowRight':
                this.moveRight();
                break;
            case 'ArrowDown':
                this.moveDown();
                this.score += 1;
                break;
            case ' ':
                this.hardDrop();
                break;
            case 'z':
            case 'Z':
                this.rotate(-1);
                break;
            case 'x':
            case 'X':
            case 'ArrowUp':
                this.rotate(1);
                break;
            case 'c':
            case 'C':
                this.hold();
                break;
        }
    }

    moveLeft() {
        if (this.isValidMove(this.currentPiece, this.currentPiece.x - 1, this.currentPiece.y)) {
            this.currentPiece.x--;
            this.playSound('move');
        }
    }

    moveRight() {
        if (this.isValidMove(this.currentPiece, this.currentPiece.x + 1, this.currentPiece.y)) {
            this.currentPiece.x++;
            this.playSound('move');
        }
    }

    moveDown() {
        if (this.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            return true;
        } else {
            this.placePiece();
            return false;
        }
    }

    hardDrop() {
        let dropDistance = 0;
        while (this.isValidMove(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        this.score += dropDistance * 2;
        this.placePiece();
        this.playSound('hardDrop');
        
        // Create impact particles
        const pieceBottom = (this.currentPiece.y + this.currentPiece.shape.length) * this.BLOCK_SIZE;
        this.createImpactParticles(this.currentPiece.x * this.BLOCK_SIZE + 50, pieceBottom);
    }

    rotate(direction) {
        const rotated = this.getRotatedPiece(this.currentPiece, direction);
        
        if (this.isValidMove(rotated, rotated.x, rotated.y)) {
            this.currentPiece = rotated;
            this.playSound('rotate');
            this.createRotateParticles();
        } else {
            // Try wall kicks
            const kicks = this.getWallKicks(this.currentPiece, direction);
            for (let kick of kicks) {
                if (this.isValidMove(rotated, rotated.x + kick.x, rotated.y + kick.y)) {
                    this.currentPiece = rotated;
                    this.currentPiece.x += kick.x;
                    this.currentPiece.y += kick.y;
                    this.playSound('rotate');
                    this.createRotateParticles();
                    break;
                }
            }
        }
    }

    getRotatedPiece(piece, direction) {
        const shape = piece.shape;
        const n = shape.length;
        const m = shape[0].length;
        const rotated = Array(m).fill(null).map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                if (direction === 1) {
                    rotated[j][n - 1 - i] = shape[i][j];
                } else {
                    rotated[m - 1 - j][i] = shape[i][j];
                }
            }
        }
        
        return {
            ...piece,
            shape: rotated
        };
    }

    getWallKicks(piece, direction) {
        // Basic wall kick offsets
        return [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: -1 },
            { x: 1, y: -1 }
        ];
    }

    hold() {
        if (!this.canHold) return;
        
        const temp = this.holdPiece;
        this.holdPiece = {
            type: this.currentPiece.type,
            shape: this.TETROMINOES[this.currentPiece.type].shape
        };
        
        if (temp) {
            this.currentPiece = {
                type: temp.type,
                shape: temp.shape,
                x: Math.floor((this.COLS - temp.shape[0].length) / 2),
                y: 0
            };
        } else {
            this.spawnPiece();
        }
        
        this.canHold = false;
        this.playSound('hold');
    }

    isValidMove(piece, x, y) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece() {
        const type = this.TETROMINOES[this.currentPiece.type];
        
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = type.color;
                    }
                }
            });
        });
        
        this.playSound('place');
        this.checkLines();
        this.spawnPiece();
    }

    checkLines() {
        const linesToClear = [];
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                linesToClear.push(row);
            }
        }
        
        if (linesToClear.length > 0) {
            this.clearLines(linesToClear);
            this.updateScore(linesToClear.length);
            this.combo++;
            this.updateCombo();
        } else {
            this.combo = 0;
        }
    }

    clearLines(lines) {
        // Create line clear effects
        lines.forEach(row => {
            this.createLineClearEffect(row);
            this.createLineClearParticles(row);
        });
        
        // Clear the lines
        lines.forEach(row => {
            this.board.splice(row, 1);
            this.board.unshift(Array(this.COLS).fill(0));
        });
        
        this.playSound('lineClear', lines.length);
    }

    updateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        const score = baseScore[linesCleared] * this.level;
        this.score += score + (this.combo * 50);
        this.lines += linesCleared;
        
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.playSound('levelUp');
            this.createLevelUpEffect();
        }
    }

    updateCombo() {
        const comboDisplay = document.getElementById('comboDisplay');
        const comboValue = document.getElementById('comboValue');
        
        if (this.combo > 0) {
            comboDisplay.classList.add('active');
            comboValue.textContent = this.combo;
        } else {
            comboDisplay.classList.remove('active');
        }
    }

    createLineClearEffect(row) {
        this.lineEffects.push({
            row: row,
            opacity: 1,
            scale: 1,
            time: 0
        });
    }

    createLineClearParticles(row) {
        const y = row * this.BLOCK_SIZE + this.BLOCK_SIZE / 2;
        
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.gameCanvas.width,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                color: this.getRandomNeonColor(),
                life: 1,
                decay: 0.02
            });
        }
    }

    createRotateParticles() {
        const centerX = (this.currentPiece.x + this.currentPiece.shape[0].length / 2) * this.BLOCK_SIZE;
        const centerY = (this.currentPiece.y + this.currentPiece.shape.length / 2) * this.BLOCK_SIZE;
        
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: 3,
                color: this.TETROMINOES[this.currentPiece.type].color,
                life: 1,
                decay: 0.03
            });
        }
    }

    createImpactParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + Math.random() * this.BLOCK_SIZE * 2,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 5,
                size: Math.random() * 4 + 1,
                color: this.getRandomNeonColor(),
                life: 1,
                decay: 0.02
            });
        }
    }

    createBurstParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 10 + 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 2,
                color: this.getRandomNeonColor(),
                life: 1,
                decay: 0.01
            });
        }
    }

    createLevelUpEffect() {
        const text = `LEVEL ${this.level}`;
        const ctx = this.effectCtx;
        
        ctx.save();
        ctx.font = 'bold 48px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const gradient = ctx.createLinearGradient(0, 0, this.effectCanvas.width, 0);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ffff00');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        
        let alpha = 1;
        let scale = 0.5;
        
        const animate = () => {
            ctx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
            
            ctx.globalAlpha = alpha;
            ctx.save();
            ctx.translate(this.effectCanvas.width / 2, this.effectCanvas.height / 2);
            ctx.scale(scale, scale);
            ctx.fillText(text, 0, 0);
            ctx.restore();
            
            alpha -= 0.02;
            scale += 0.05;
            
            if (alpha > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        ctx.restore();
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravity
            particle.life -= particle.decay;
            
            return particle.life > 0;
        });
    }

    updateLineEffects() {
        this.lineEffects = this.lineEffects.filter(effect => {
            effect.time += 0.05;
            effect.opacity -= 0.05;
            effect.scale += 0.1;
            
            return effect.opacity > 0;
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.particleCtx.save();
            this.particleCtx.globalAlpha = particle.life;
            this.particleCtx.fillStyle = particle.color;
            this.particleCtx.shadowColor = particle.color;
            this.particleCtx.shadowBlur = 10;
            
            this.particleCtx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
            
            this.particleCtx.restore();
        });
    }

    drawLineEffects() {
        this.lineEffects.forEach(effect => {
            const y = effect.row * this.BLOCK_SIZE;
            
            this.effectCtx.save();
            this.effectCtx.globalAlpha = effect.opacity;
            
            const gradient = this.effectCtx.createLinearGradient(0, y, this.effectCanvas.width, y);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.2, '#00ffff');
            gradient.addColorStop(0.5, '#ff00ff');
            gradient.addColorStop(0.8, '#ffff00');
            gradient.addColorStop(1, 'transparent');
            
            this.effectCtx.fillStyle = gradient;
            this.effectCtx.fillRect(
                -effect.scale * 10,
                y - effect.scale * 5,
                this.effectCanvas.width + effect.scale * 20,
                this.BLOCK_SIZE + effect.scale * 10
            );
            
            this.effectCtx.restore();
        });
    }

    getRandomNeonColor() {
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff9500', '#0095ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateUI() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        
        if (this.isPaused) {
            pauseOverlay.classList.add('active');
            cancelAnimationFrame(this.animationId);
        } else {
            pauseOverlay.classList.remove('active');
            this.gameLoop();
        }
        
        this.playSound('pause');
    }

    gameOver() {
        this.isGameOver = true;
        cancelAnimationFrame(this.animationId);
        
        document.getElementById('gameOverOverlay').classList.add('active');
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        
        this.playSound('gameOver');
        this.createBurstParticles(150, 300, 50);
    }

    restartGame() {
        // Reset game state
        this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.holdPiece = null;
        this.canHold = true;
        this.particles = [];
        this.lineEffects = [];
        
        // Reset UI
        document.getElementById('gameOverOverlay').classList.remove('active');
        document.getElementById('pauseOverlay').classList.remove('active');
        
        // Start new game
        this.spawnPiece();
        this.gameLoop();
        this.playSound('start');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundToggle = document.getElementById('soundToggle');
        const soundIcon = soundToggle.querySelector('.sound-icon');
        const soundStatus = soundToggle.querySelector('.sound-status');
        
        if (this.soundEnabled) {
            soundIcon.textContent = '🔊';
            soundStatus.textContent = 'ON';
        } else {
            soundIcon.textContent = '🔇';
            soundStatus.textContent = 'OFF';
        }
    }

    playSound(type, param = null) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        switch(type) {
            case 'move':
                this.playTone(200, 0.05, 'sine');
                break;
                
            case 'rotate':
                this.playTone(300, 0.05, 'square');
                this.playTone(400, 0.05, 'square', 0.025);
                break;
                
            case 'place':
                this.playTone(150, 0.1, 'triangle');
                break;
                
            case 'hold':
                this.playTone(250, 0.1, 'sine');
                this.playTone(350, 0.1, 'sine', 0.05);
                break;
                
            case 'hardDrop':
                this.playTone(100, 0.2, 'sawtooth');
                this.playTone(50, 0.2, 'sawtooth', 0.1);
                break;
                
            case 'lineClear':
                const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
                notes.forEach((freq, i) => {
                    this.playTone(freq, 0.15, 'square', i * 0.05);
                });
                if (param === 4) { // Tetris
                    setTimeout(() => {
                        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                            this.playTone(freq, 0.2, 'square', i * 0.05);
                        });
                    }, 200);
                }
                break;
                
            case 'levelUp':
                [440, 554, 659, 880].forEach((freq, i) => {
                    this.playTone(freq, 0.2, 'sine', i * 0.1);
                });
                break;
                
            case 'gameOver':
                [440, 415, 392, 370, 349, 330, 311, 294, 277, 261].forEach((freq, i) => {
                    this.playTone(freq, 0.1, 'square', i * 0.05);
                });
                break;
                
            case 'start':
                [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25].forEach((freq, i) => {
                    this.playTone(freq, 0.1, 'sine', i * 0.05);
                });
                break;
                
            case 'pause':
                this.playTone(440, 0.1, 'sine');
                this.playTone(220, 0.1, 'sine', 0.1);
                break;
        }
    }

    playTone(frequency, duration, type = 'sine', delay = 0) {
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, ctx.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        
        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + duration);
    }
}

// Initialize game
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 NEON TETRIS - めちゃくちゃ格好良いテトリス v1.0');
    game = new NeonTetris();
    
    // Add CSS for particle effects
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            from { opacity: 1; }
            to { opacity: 0; transform: translateY(-50px); }
        }
        
        .particle-effect {
            position: absolute;
            pointer-events: none;
            animation: particleFloat 1s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
});

// Export for debugging
window.NeonTetris = NeonTetris;