class EpicTetris {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.ctx = this.gameBoard.getContext('2d');
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextPieceCanvas.getContext('2d');
        this.holdPieceCanvas = document.getElementById('holdPieceCanvas');
        this.holdCtx = this.holdPieceCanvas.getContext('2d');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 40;
        
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gameTime = 0;
        this.pps = 0;
        this.apm = 0;
        this.actionCount = 0;
        
        this.particles = [];
        this.theme = 'neon';
        
        this.pieces = {
            I: { shape: [[1,1,1,1]], color: '#00ffff' },
            O: { shape: [[1,1],[1,1]], color: '#ffff00' },
            T: { shape: [[0,1,0],[1,1,1]], color: '#aa00ff' },
            S: { shape: [[0,1,1],[1,1,0]], color: '#00ff00' },
            Z: { shape: [[1,1,0],[0,1,1]], color: '#ff0000' },
            J: { shape: [[1,0,0],[1,1,1]], color: '#0000ff' },
            L: { shape: [[0,0,1],[1,1,1]], color: '#ff8800' }
        };
        
        this.initializeElements();
        this.initializeEventListeners();
        this.startGameLoop();
        
        console.log('🎮 Epic Tetris initialized');
    }
    
    initializeElements() {
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.linesDisplay = document.getElementById('linesDisplay');
        this.gameTime = document.getElementById('gameTime');
        this.ppsDisplay = document.getElementById('ppsDisplay');
        this.apmDisplay = document.getElementById('apmDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.themeSelect = document.getElementById('themeSelect');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.gameMessage = document.getElementById('gameMessage');
    }
    
    initializeEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        this.themeSelect.addEventListener('change', () => {
            this.theme = this.themeSelect.value;
            this.applyTheme();
        });
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || !this.currentPiece) return;
        
        switch (e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                this.movePiece(-1, 0);
                this.actionCount++;
                break;
            case 'd':
            case 'arrowright':
                this.movePiece(1, 0);
                this.actionCount++;
                break;
            case 's':
            case 'arrowdown':
                this.movePiece(0, 1);
                this.actionCount++;
                break;
            case 'w':
            case 'arrowup':
                this.hardDrop();
                this.actionCount++;
                break;
            case 'j':
                this.rotatePiece(-1);
                this.actionCount++;
                break;
            case 'k':
                this.rotatePiece(1);
                this.actionCount++;
                break;
            case 'l':
                this.holdCurrentPiece();
                this.actionCount++;
                break;
            case ' ':
                if (!this.gameRunning) this.startGame();
                break;
        }
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.hideOverlay();
        this.nextPiece = this.generateRandomPiece();
        this.spawnNewPiece();
        this.updateDisplay();
    }
    
    pauseGame() {
        this.gameRunning = !this.gameRunning;
        if (this.gameRunning) {
            this.hideOverlay();
        } else {
            this.showOverlay('⏸️ PAUSED', 'スペースキーで再開');
        }
    }
    
    restartGame() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.actionCount = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.particles = [];
        this.gameRunning = false;
        this.showOverlay('🎮 TETRIS READY', 'スペースキーでゲーム開始');
        this.updateDisplay();
        this.clearCanvases();
    }
    
    generateRandomPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        return {
            type: type,
            shape: this.pieces[type].shape,
            color: this.pieces[type].color,
            x: Math.floor(this.BOARD_WIDTH / 2) - 1,
            y: 0,
            rotation: 0
        };
    }
    
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generateRandomPiece();
        this.canHold = true;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
            return;
        }
        
        this.drawNextPiece();
        this.incrementPieceCount(this.currentPiece.type);
    }
    
    movePiece(dx, dy) {
        if (this.checkCollision(this.currentPiece, dx, dy)) {
            if (dy > 0) {
                this.placePiece();
            }
            return;
        }
        
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
    }
    
    rotatePiece(direction) {
        const rotated = this.getRotatedPiece(this.currentPiece, direction);
        if (!this.checkCollision(rotated, 0, 0)) {
            this.currentPiece = rotated;
        }
    }
    
    getRotatedPiece(piece, direction) {
        const rotated = { ...piece };
        const shape = piece.shape;
        const size = shape.length;
        const newShape = Array(size).fill().map(() => Array(size).fill(0));
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (direction === 1) {
                    newShape[x][size - 1 - y] = shape[y][x];
                } else {
                    newShape[size - 1 - x][y] = shape[y][x];
                }
            }
        }
        
        rotated.shape = newShape;
        return rotated;
    }
    
    hardDrop() {
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }
    
    holdCurrentPiece() {
        if (!this.canHold) return;
        
        if (this.holdPiece) {
            const temp = this.holdPiece;
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.pieces[this.currentPiece.type].shape,
                color: this.pieces[this.currentPiece.type].color,
                x: Math.floor(this.BOARD_WIDTH / 2) - 1,
                y: 0,
                rotation: 0
            };
            this.currentPiece = temp;
            this.currentPiece.x = Math.floor(this.BOARD_WIDTH / 2) - 1;
            this.currentPiece.y = 0;
        } else {
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.pieces[this.currentPiece.type].shape,
                color: this.pieces[this.currentPiece.type].color,
                x: Math.floor(this.BOARD_WIDTH / 2) - 1,
                y: 0,
                rotation: 0
            };
            this.spawnNewPiece();
        }
        
        this.canHold = false;
        this.drawHoldPiece();
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnNewPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.createLineParticles(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateDisplay();
        }
    }
    
    calculateScore(lines) {
        const baseScores = [0, 100, 300, 500, 800];
        return baseScores[lines] * this.level;
    }
    
    createLineParticles(line) {
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                    y: line * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1.0,
                    decay: 0.02,
                    color: this.board[line][x] || '#ffffff',
                    size: Math.random() * 4 + 2
                });
            }
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life -= particle.decay;
            return particle.life > 0;
        });
    }
    
    startGameLoop() {
        let lastTime = 0;
        let dropTime = 0;
        
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            if (this.gameRunning) {
                dropTime += deltaTime;
                const dropInterval = 1000 - (this.level - 1) * 50;
                
                if (dropTime > dropInterval) {
                    this.movePiece(0, 1);
                    dropTime = 0;
                }
                
                this.updateGameTime();
                this.updateStats();
            }
            
            this.updateParticles();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    updateGameTime() {
        if (this.gameStartTime) {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.gameTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateStats() {
        if (this.gameStartTime) {
            const elapsed = (Date.now() - this.gameStartTime) / 1000;
            this.pps = (this.lines / elapsed).toFixed(1);
            this.apm = Math.floor((this.actionCount * 60) / elapsed);
            
            this.ppsDisplay.textContent = this.pps;
            this.apmDisplay.textContent = this.apm;
        }
    }
    
    render() {
        this.clearCanvases();
        this.drawBoard();
        if (this.currentPiece) {
            this.drawGhostPiece();
            this.drawPiece(this.currentPiece);
        }
        this.drawParticles();
    }
    
    clearCanvases() {
        this.ctx.fillStyle = '#000022';
        this.ctx.fillRect(0, 0, this.gameBoard.width, this.gameBoard.height);
        
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw grid
        this.ctx.strokeStyle = '#333366';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.gameBoard.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.gameBoard.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }
    
    drawGhostPiece() {
        if (!this.currentPiece || !document.getElementById('ghostPiece').checked) return;
        
        const ghost = { ...this.currentPiece };
        while (!this.checkCollision(ghost, 0, 1)) {
            ghost.y++;
        }
        
        this.ctx.strokeStyle = this.currentPiece.color;
        this.ctx.lineWidth = 2;
        
        for (let y = 0; y < ghost.shape.length; y++) {
            for (let x = 0; x < ghost.shape[y].length; x++) {
                if (ghost.shape[y][x]) {
                    const blockX = (ghost.x + x) * this.BLOCK_SIZE;
                    const blockY = (ghost.y + y) * this.BLOCK_SIZE;
                    this.ctx.strokeRect(blockX, blockY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        const blockX = x * this.BLOCK_SIZE;
        const blockY = y * this.BLOCK_SIZE;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(blockX, blockY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // Add glow effect for neon theme
        if (this.theme === 'neon') {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(blockX, blockY, this.BLOCK_SIZE, this.BLOCK_SIZE);
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(blockX, blockY, this.BLOCK_SIZE, this.BLOCK_SIZE);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.particleCtx.fillStyle = particle.color;
            this.particleCtx.globalAlpha = particle.life;
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.particleCtx.fill();
        });
        this.particleCtx.globalAlpha = 1;
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        if (this.nextPiece) {
            this.drawPieceOnCanvas(this.nextCtx, this.nextPiece, 20, 20);
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdPieceCanvas.width, this.holdPieceCanvas.height);
        if (this.holdPiece) {
            this.drawPieceOnCanvas(this.holdCtx, this.holdPiece, 20, 20);
        }
    }
    
    drawPieceOnCanvas(ctx, piece, blockSize, offsetX = 0, offsetY = 0) {
        ctx.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    ctx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                    ctx.strokeStyle = '#ffffff';
                    ctx.strokeRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            }
        }
    }
    
    incrementPieceCount(type) {
        const countElement = document.getElementById(`count${type}`);
        if (countElement) {
            countElement.textContent = parseInt(countElement.textContent) + 1;
        }
    }
    
    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.levelDisplay.textContent = this.level;
        this.linesDisplay.textContent = this.lines;
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showOverlay('💀 GAME OVER', `スコア: ${this.score}`);
    }
    
    showOverlay(title, subtitle) {
        this.gameMessage.innerHTML = `<h2>${title}</h2><p>${subtitle}</p>`;
        this.gameOverlay.style.display = 'flex';
    }
    
    hideOverlay() {
        this.gameOverlay.style.display = 'none';
    }
    
    applyTheme() {
        // Theme switching logic would go here
        console.log(`Theme changed to: ${this.theme}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.epicTetris = new EpicTetris();
});