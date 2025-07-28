class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = 30;
        
        this.grid = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.dropInterval = 1000;
        this.lastDrop = 0;
        
        this.effects = {
            particles: true,
            matrix: true,
            shake: true,
            sound: true
        };
        
        this.combo = 0;
        
        this.tetrominoes = {
            I: {
                shape: [[1,1,1,1]],
                color: '#00ffff'
            },
            O: {
                shape: [[1,1],[1,1]],
                color: '#ffff00'
            },
            T: {
                shape: [[0,1,0],[1,1,1]],
                color: '#ff0080'
            },
            S: {
                shape: [[0,1,1],[1,1,0]],
                color: '#00ff40'
            },
            Z: {
                shape: [[1,1,0],[0,1,1]],
                color: '#ff4000'
            },
            J: {
                shape: [[1,0,0],[1,1,1]],
                color: '#0080ff'
            },
            L: {
                shape: [[0,0,1],[1,1,1]],
                color: '#8000ff'
            }
        };
        
        this.init();
    }
    
    init() {
        this.initGrid();
        this.initControls();
        this.initEffects();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.render();
    }
    
    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 0;
            }
        }
    }
    
    initControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.isPaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.softDrop();
                    break;
                case 'ArrowUp':
                case ' ':
                    this.rotatePiece();
                    break;
                case 'Shift':
                    this.hardDrop();
                    break;
            }
            e.preventDefault();
        });
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Effect toggles
        document.getElementById('particle-toggle').addEventListener('click', (e) => {
            this.effects.particles = !this.effects.particles;
            e.target.classList.toggle('active');
            if (!this.effects.particles) {
                document.getElementById('particles').innerHTML = '';
            }
        });
        
        document.getElementById('matrix-toggle').addEventListener('click', (e) => {
            this.effects.matrix = !this.effects.matrix;
            e.target.classList.toggle('active');
            if (!this.effects.matrix) {
                document.getElementById('matrix').innerHTML = '';
            }
        });
        
        document.getElementById('shake-toggle').addEventListener('click', (e) => {
            this.effects.shake = !this.effects.shake;
            e.target.classList.toggle('active');
        });
        
        document.getElementById('sound-toggle').addEventListener('click', (e) => {
            this.effects.sound = !this.effects.sound;
            e.target.classList.toggle('active');
        });
        
        // Initialize effect buttons as active
        document.querySelectorAll('.effect-btn').forEach(btn => btn.classList.add('active'));
    }
    
    initEffects() {
        this.createParticleSystem();
        this.createMatrixRain();
        this.animateVisualizer();
    }
    
    createParticleSystem() {
        setInterval(() => {
            if (!this.effects.particles) return;
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            particle.style.background = this.getRandomNeonColor();
            
            document.getElementById('particles').appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 5000);
        }, 200);
    }
    
    createMatrixRain() {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        
        setInterval(() => {
            if (!this.effects.matrix) return;
            
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = Math.random() * 100 + '%';
            column.style.animationDuration = (Math.random() * 2 + 3) + 's';
            
            let text = '';
            for (let i = 0; i < 20; i++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
            }
            column.innerHTML = text;
            
            document.getElementById('matrix').appendChild(column);
            
            setTimeout(() => {
                if (column.parentNode) {
                    column.parentNode.removeChild(column);
                }
            }, 5000);
        }, 300);
    }
    
    animateVisualizer() {
        const bars = document.querySelectorAll('.bar');
        setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 80 + 10;
                bar.style.height = height + '%';
            });
        }, 100);
    }
    
    getRandomNeonColor() {
        const colors = ['#00ffff', '#ff0080', '#00ff40', '#ffff00', '#8000ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateNextPiece() {
        const pieces = Object.keys(this.tetrominoes);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomPiece,
            shape: this.tetrominoes[randomPiece].shape,
            color: this.tetrominoes[randomPiece].color,
            x: 0,
            y: 0
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = Math.floor(this.gridWidth / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        
        this.generateNextPiece();
        this.drawNextPiece();
        
        if (this.collision()) {
            this.gameOver();
        }
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.collision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
        return true;
    }
    
    rotatePiece() {
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.collision()) {
            this.currentPiece.shape = originalShape;
        } else {
            this.playSound('rotate');
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let col = 0; col < cols; col++) {
            rotated[col] = [];
            for (let row = rows - 1; row >= 0; row--) {
                rotated[col][rows - 1 - row] = matrix[row][col];
            }
        }
        return rotated;
    }
    
    softDrop() {
        if (this.movePiece(0, 1)) {
            this.score += 1;
            this.updateDisplay();
        }
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.lockPiece();
        this.playSound('drop');
        this.updateDisplay();
    }
    
    collision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] !== 0) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.gridWidth || 
                        newY >= this.gridHeight ||
                        (newY >= 0 && this.grid[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x] !== 0) {
                    const gridX = this.currentPiece.x + x;
                    const gridY = this.currentPiece.y + y;
                    
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        const clearedRows = [];
        
        for (let y = this.gridHeight - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                clearedRows.push(y);
                this.grid.splice(y, 1);
                this.grid.unshift(new Array(this.gridWidth).fill(0));
                linesCleared++;
                y++; // Check the same row again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.combo++;
            
            // Scoring system
            const basePoints = [0, 100, 300, 500, 800];
            this.score += basePoints[linesCleared] * this.level * this.combo;
            
            // Level progression
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            this.showLineEffect(clearedRows);
            this.showComboEffect(linesCleared);
            this.playSound('line');
            
            if (this.effects.shake) {
                this.screenShake();
            }
            
            this.updateDisplay();
        } else {
            this.combo = 0;
        }
    }
    
    showLineEffect(rows) {
        const effect = document.getElementById('lineEffect');
        effect.innerHTML = '';
        
        rows.forEach(row => {
            const flash = document.createElement('div');
            flash.className = 'line-flash';
            flash.style.top = (row * this.cellSize) + 'px';
            effect.appendChild(flash);
            
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 500);
        });
    }
    
    showComboEffect(lines) {
        const combo = document.getElementById('combo');
        if (this.combo > 1) {
            combo.textContent = `${lines} LINE${lines > 1 ? 'S' : ''} × ${this.combo}`;
            combo.classList.add('show');
            
            setTimeout(() => {
                combo.classList.remove('show');
            }, 1000);
        }
    }
    
    screenShake() {
        document.body.classList.add('shake');
        setTimeout(() => {
            document.body.classList.remove('shake');
        }, 500);
    }
    
    playSound(type) {
        if (!this.effects.sound) return;
        
        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            let frequency, duration;
            
            switch(type) {
                case 'rotate':
                    frequency = 800;
                    duration = 0.1;
                    break;
                case 'drop':
                    frequency = 400;
                    duration = 0.2;
                    break;
                case 'line':
                    frequency = 1200;
                    duration = 0.3;
                    break;
                case 'gameOver':
                    frequency = 200;
                    duration = 1;
                    break;
                default:
                    frequency = 600;
                    duration = 0.1;
            }
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.lastDrop = performance.now();
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
            document.getElementById('start-btn').textContent = 'RUNNING';
        }
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? 'RESUME' : 'PAUSE';
        
        if (!this.isPaused) {
            this.lastDrop = performance.now();
            this.gameLoop = requestAnimationFrame((time) => this.update(time));
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.dropInterval = 1000;
        
        this.initGrid();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        
        document.getElementById('start-btn').textContent = 'START';
        document.getElementById('pause-btn').textContent = 'PAUSE';
        document.getElementById('gameOver').classList.remove('show');
    }
    
    restartGame() {
        this.resetGame();
        this.startGame();
    }
    
    gameOver() {
        this.gameRunning = false;
        this.playSound('gameOver');
        
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('gameOver').classList.add('show');
        document.getElementById('start-btn').textContent = 'START';
    }
    
    update(currentTime) {
        if (!this.gameRunning || this.isPaused) return;
        
        if (currentTime - this.lastDrop >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.lastDrop = currentTime;
        }
        
        this.render();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid background
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
        
        // Draw locked pieces
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] !== 0) {
                    this.drawCell(x, y, this.grid[y][x], true);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x] !== 0) {
                        this.drawCell(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color,
                            false
                        );
                    }
                }
            }
        }
        
        // Draw ghost piece
        this.drawGhostPiece();
    }
    
    drawCell(x, y, color, isLocked) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
        
        // Add glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = isLocked ? 10 : 20;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
        this.ctx.shadowBlur = 0;
        
        // Add border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
    }
    
    drawGhostPiece() {
        if (!this.currentPiece) return;
        
        const ghost = {
            ...this.currentPiece,
            y: this.currentPiece.y
        };
        
        // Find the lowest possible position
        while (!this.collisionForPiece(ghost)) {
            ghost.y++;
        }
        ghost.y--;
        
        // Draw ghost piece
        this.ctx.globalAlpha = 0.3;
        for (let y = 0; y < ghost.shape.length; y++) {
            for (let x = 0; x < ghost.shape[y].length; x++) {
                if (ghost.shape[y][x] !== 0) {
                    const pixelX = (ghost.x + x) * this.cellSize;
                    const pixelY = (ghost.y + y) * this.cellSize;
                    
                    this.ctx.strokeStyle = ghost.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    collisionForPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x] !== 0) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;
                    
                    if (newX < 0 || newX >= this.gridWidth || 
                        newY >= this.gridHeight ||
                        (newY >= 0 && this.grid[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const cellSize = 20;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * cellSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * cellSize) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x] !== 0) {
                    const pixelX = offsetX + x * cellSize;
                    const pixelY = offsetY + y * cellSize;
                    
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
                    
                    this.nextCtx.shadowColor = this.nextPiece.color;
                    this.nextCtx.shadowBlur = 10;
                    this.nextCtx.fillRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
                    this.nextCtx.shadowBlur = 0;
                    
                    this.nextCtx.strokeStyle = this.nextPiece.color;
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
});