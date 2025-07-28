class MegaUltraTetris3D {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.gridWidth = 10;
        this.gridHeight = 20;
        this.cellSize = 30;
        
        this.grid = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.power = 0;
        this.maxPower = 100;
        
        this.gameRunning = false;
        this.isPaused = false;
        this.turboMode = false;
        this.mode3D = true;
        
        this.gameLoop = null;
        this.dropInterval = 1000;
        this.lastDrop = 0;
        
        this.effects = {
            particles: true,
            matrix: true,
            hologram: true,
            energy: true,
            sound: true,
            '3d': true
        };
        
        this.achievements = [];
        this.particleCount = 0;
        this.maxParticles = 50;
        
        this.tetrominoes = {
            I: {
                shape: [[1,1,1,1]],
                color: '#00ffff',
                glow: '#80ffff'
            },
            O: {
                shape: [[1,1],[1,1]],
                color: '#ffff00',
                glow: '#ffff80'
            },
            T: {
                shape: [[0,1,0],[1,1,1]],
                color: '#ff00ff',
                glow: '#ff80ff'
            },
            S: {
                shape: [[0,1,1],[1,1,0]],
                color: '#00ff80',
                glow: '#80ffbf'
            },
            Z: {
                shape: [[1,1,0],[0,1,1]],
                color: '#ff8000',
                glow: '#ffbf80'
            },
            J: {
                shape: [[1,0,0],[1,1,1]],
                color: '#0080ff',
                glow: '#80bfff'
            },
            L: {
                shape: [[0,0,1],[1,1,1]],
                color: '#8000ff',
                glow: '#bf80ff'
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
            
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                    this.movePiece(-1, 0);
                    break;
                case 'arrowright':
                    this.movePiece(1, 0);
                    break;
                case 'arrowdown':
                    this.softDrop();
                    break;
                case 'arrowup':
                case 'z':
                    this.rotatePiece(1);
                    break;
                case 'x':
                    this.rotatePiece(-1);
                    break;
                case ' ':
                    this.hardDrop();
                    break;
                case 'c':
                    this.holdCurrentPiece();
                    break;
            }
            e.preventDefault();
        });
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('turbo-btn').addEventListener('click', () => this.toggleTurbo());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Enhanced effect toggles
        this.setupEffectToggle('particle-toggle', 'particles');
        this.setupEffectToggle('matrix-toggle', 'matrix');
        this.setupEffectToggle('hologram-toggle', 'hologram');
        this.setupEffectToggle('energy-toggle', 'energy');
        this.setupEffectToggle('sound-toggle', 'sound');
        this.setupEffectToggle('3d-toggle', '3d');
    }
    
    setupEffectToggle(buttonId, effectName) {
        document.getElementById(buttonId).addEventListener('click', (e) => {
            this.effects[effectName] = !this.effects[effectName];
            e.target.classList.toggle('active');
            this.handleEffectToggle(effectName);
        });
    }
    
    handleEffectToggle(effectName) {
        switch(effectName) {
            case 'particles':
                if (!this.effects.particles) {
                    document.getElementById('particles').innerHTML = '';
                }
                break;
            case 'matrix':
                if (!this.effects.matrix) {
                    document.getElementById('matrix').innerHTML = '';
                }
                break;
            case 'hologram':
                document.getElementById('hologram').style.display = 
                    this.effects.hologram ? 'block' : 'none';
                break;
            case 'energy':
                document.getElementById('energyWaves').style.display = 
                    this.effects.energy ? 'block' : 'none';
                break;
            case '3d':
                this.mode3D = this.effects['3d'];
                this.update3DMode();
                break;
        }
    }
    
    update3DMode() {
        const gameBoard = document.getElementById('gameBoard3D');
        if (this.mode3D) {
            gameBoard.style.transform = 'rotateX(5deg) rotateY(-5deg)';
        } else {
            gameBoard.style.transform = 'none';
        }
    }
    
    initEffects() {
        this.createParticleSystem();
        this.createMatrixRain();
        this.animateVisualizer();
        this.animatePowerMeter();
    }
    
    createParticleSystem() {
        setInterval(() => {
            if (!this.effects.particles || this.particleCount >= this.maxParticles) return;
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 4 + 3) + 's';
            particle.style.background = this.getRandomNeonColor();
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            
            document.getElementById('particles').appendChild(particle);
            this.particleCount++;
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                    this.particleCount--;
                }
            }, 7000);
        }, 150);
    }
    
    createMatrixRain() {
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンテトリス3D';
        
        setInterval(() => {
            if (!this.effects.matrix) return;
            
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = Math.random() * 100 + '%';
            column.style.animationDuration = (Math.random() * 3 + 4) + 's';
            column.style.color = this.getRandomNeonColor();
            
            let text = '';
            for (let i = 0; i < 25; i++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
            }
            column.innerHTML = text;
            
            document.getElementById('matrix').appendChild(column);
            
            setTimeout(() => {
                if (column.parentNode) {
                    column.parentNode.removeChild(column);
                }
            }, 7000);
        }, 200);
    }
    
    animateVisualizer() {
        const bars = document.querySelectorAll('.freq-bar');
        setInterval(() => {
            bars.forEach((bar, index) => {
                const intensity = this.gameRunning ? Math.random() * 100 + 20 : 10;
                const height = intensity + '%';
                bar.style.height = height;
                bar.style.background = `linear-gradient(to top, ${this.getRandomNeonColor()}, ${this.getRandomNeonColor()})`;
            });
        }, 80);
    }
    
    animatePowerMeter() {
        setInterval(() => {
            const powerFill = document.getElementById('powerFill');
            const powerLevel = document.getElementById('powerLevel');
            const powerPercentage = (this.power / this.maxPower) * 100;
            
            powerFill.style.width = powerPercentage + '%';
            
            if (this.power >= 80) {
                powerLevel.textContent = 'MAXIMUM POWER';
                powerLevel.style.color = '#ff0040';
            } else if (this.power >= 50) {
                powerLevel.textContent = 'HIGH POWER';
                powerLevel.style.color = '#ff8000';
            } else {
                powerLevel.textContent = `POWER LEVEL ${Math.floor(this.power / 10) + 1}`;
                powerLevel.style.color = '#00ff80';
            }
        }, 100);
    }
    
    getRandomNeonColor() {
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff80', '#ff8000', '#0080ff', '#8000ff', '#ff0040'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateNextPiece() {
        const pieces = Object.keys(this.tetrominoes);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomPiece,
            shape: JSON.parse(JSON.stringify(this.tetrominoes[randomPiece].shape)),
            color: this.tetrominoes[randomPiece].color,
            glow: this.tetrominoes[randomPiece].glow,
            x: 0,
            y: 0
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = Math.floor(this.gridWidth / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        this.canHold = true;
        
        this.generateNextPiece();
        this.drawNextPiece();
        
        if (this.collision()) {
            this.gameOver();
        }
    }
    
    holdCurrentPiece() {
        if (!this.canHold) return;
        
        if (this.holdPiece === null) {
            this.holdPiece = this.currentPiece;
            this.spawnPiece();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = this.currentPiece;
            this.currentPiece = temp;
            this.currentPiece.x = Math.floor(this.gridWidth / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
            this.currentPiece.y = 0;
        }
        
        this.canHold = false;
        this.drawHoldPiece();
        this.playSound('hold');
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.collision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
        
        if (dx !== 0) {
            this.playSound('move');
        }
        return true;
    }
    
    rotatePiece(direction = 1) {
        const originalShape = this.currentPiece.shape;
        
        if (direction === 1) {
            this.currentPiece.shape = this.rotateMatrix(this.currentPiece.shape);
        } else {
            // Rotate counter-clockwise (3 times clockwise)
            for (let i = 0; i < 3; i++) {
                this.currentPiece.shape = this.rotateMatrix(this.currentPiece.shape);
            }
        }
        
        // Wall kick attempts
        const kicks = [0, -1, 1, -2, 2];
        let successful = false;
        
        for (let kick of kicks) {
            this.currentPiece.x += kick;
            if (!this.collision()) {
                successful = true;
                break;
            }
            this.currentPiece.x -= kick;
        }
        
        if (!successful) {
            this.currentPiece.shape = originalShape;
        } else {
            this.playSound('rotate');
            this.addPower(2);
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
        this.addPower(dropDistance);
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
                        this.grid[gridY][gridX] = {
                            color: this.currentPiece.color,
                            glow: this.currentPiece.glow
                        };
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
            
            // Enhanced scoring system
            const basePoints = [0, 100, 300, 500, 800];
            let scoreMultiplier = this.level * this.combo;
            
            if (this.power >= 80) scoreMultiplier *= 2;
            if (this.turboMode) scoreMultiplier *= 1.5;
            
            this.score += Math.floor(basePoints[linesCleared] * scoreMultiplier);
            
            // Level progression
            const oldLevel = this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            if (this.level > oldLevel) {
                this.showLevelUpEffect();
                this.checkAchievements();
            }
            
            this.addPower(linesCleared * 10);
            this.showLineEffect(clearedRows);
            this.showComboEffect(linesCleared);
            this.playSound('line');
            
            if (this.effects['3d']) {
                this.screenShake();
            }
            
            this.updateDisplay();
        } else {
            this.combo = 0;
        }
    }
    
    addPower(amount) {
        this.power = Math.min(this.maxPower, this.power + amount);
        
        if (this.power >= this.maxPower) {
            this.activateMaxPower();
        }
    }
    
    activateMaxPower() {
        // Clear bottom 2 rows when max power is reached
        this.grid[this.gridHeight - 1] = new Array(this.gridWidth).fill(0);
        this.grid[this.gridHeight - 2] = new Array(this.gridWidth).fill(0);
        this.power = 0;
        this.score += 1000;
        this.playSound('power');
        
        // Power effect
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
            document.body.style.filter = 'none';
        }, 500);
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
            }, 800);
        });
    }
    
    showComboEffect(lines) {
        const combo = document.getElementById('comboDisplay');
        if (this.combo > 1) {
            let comboText = `${lines} LINE${lines > 1 ? 'S' : ''}`;
            if (this.combo > 5) comboText += ' MEGA COMBO!';
            else if (this.combo > 3) comboText += ' SUPER COMBO!';
            else comboText += ` × ${this.combo}`;
            
            combo.textContent = comboText;
            combo.classList.add('show');
            
            setTimeout(() => {
                combo.classList.remove('show');
            }, 1500);
        }
    }
    
    showLevelUpEffect() {
        const effect = document.getElementById('levelUpEffect');
        const levelText = document.createElement('div');
        levelText.textContent = `LEVEL ${this.level}`;
        levelText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: 900;
            color: #ff00ff;
            text-shadow: 0 0 30px #ff00ff;
            opacity: 0;
            animation: levelUpAnim 2s ease-in-out;
            z-index: 25;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes levelUpAnim {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        effect.appendChild(levelText);
        
        setTimeout(() => {
            if (levelText.parentNode) {
                levelText.parentNode.removeChild(levelText);
            }
        }, 2000);
    }
    
    checkAchievements() {
        if (this.level === 10 && !this.achievements.includes('Level 10')) {
            this.achievements.push('Level 10');
            this.showAchievement('SPEED DEMON');
        }
        
        if (this.combo >= 10 && !this.achievements.includes('10 Combo')) {
            this.achievements.push('10 Combo');
            this.showAchievement('COMBO MASTER');
        }
        
        if (this.score >= 100000 && !this.achievements.includes('100K Score')) {
            this.achievements.push('100K Score');
            this.showAchievement('HIGH ROLLER');
        }
    }
    
    showAchievement(title) {
        console.log(`Achievement Unlocked: ${title}`);
        // Could add visual achievement display here
    }
    
    screenShake() {
        document.body.classList.add('shake');
        setTimeout(() => {
            document.body.classList.remove('shake');
        }, 800);
    }
    
    playSound(type) {
        if (!this.effects.sound) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            let frequency, duration, waveform = 'sine';
            
            switch(type) {
                case 'move':
                    frequency = 400;
                    duration = 0.05;
                    waveform = 'square';
                    break;
                case 'rotate':
                    frequency = 800;
                    duration = 0.1;
                    waveform = 'triangle';
                    break;
                case 'drop':
                    frequency = 200;
                    duration = 0.3;
                    waveform = 'sawtooth';
                    break;
                case 'line':
                    frequency = 1200;
                    duration = 0.4;
                    waveform = 'sine';
                    break;
                case 'hold':
                    frequency = 600;
                    duration = 0.2;
                    waveform = 'triangle';
                    break;
                case 'power':
                    frequency = 1500;
                    duration = 0.5;
                    waveform = 'sine';
                    break;
                case 'gameOver':
                    frequency = 100;
                    duration = 1.5;
                    waveform = 'sawtooth';
                    break;
                default:
                    frequency = 600;
                    duration = 0.1;
            }
            
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    toggleTurbo() {
        this.turboMode = !this.turboMode;
        const btn = document.getElementById('turbo-btn');
        
        if (this.turboMode) {
            btn.textContent = 'TURBO: ON';
            btn.style.animation = 'turboGlow 0.5s ease-in-out infinite alternate';
            this.dropInterval = Math.max(25, this.dropInterval * 0.3);
        } else {
            btn.textContent = 'TURBO MODE';
            btn.style.animation = 'turboGlow 2s ease-in-out infinite alternate';
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
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
        this.turboMode = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.power = 0;
        this.dropInterval = 1000;
        this.achievements = [];
        
        this.initGrid();
        this.holdPiece = null;
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        
        document.getElementById('start-btn').textContent = 'START';
        document.getElementById('pause-btn').textContent = 'PAUSE';
        document.getElementById('turbo-btn').textContent = 'TURBO MODE';
        document.getElementById('gameOver').classList.remove('show');
        
        this.drawHoldPiece();
    }
    
    restartGame() {
        this.resetGame();
        this.startGame();
    }
    
    gameOver() {
        this.gameRunning = false;
        this.playSound('gameOver');
        
        // Display achievements
        const achievementsEl = document.getElementById('achievements');
        if (this.achievements.length > 0) {
            achievementsEl.innerHTML = '<h4>ACHIEVEMENTS:</h4>' + 
                this.achievements.map(a => `<div class="achievement">${a}</div>`).join('');
        }
        
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
        
        // Enhanced grid with 3D effect
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
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
        
        // Draw locked pieces with enhanced 3D effects
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x] !== 0) {
                    this.drawCell3D(x, y, this.grid[y][x].color, this.grid[y][x].glow, true);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x] !== 0) {
                        this.drawCell3D(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color,
                            this.currentPiece.glow,
                            false
                        );
                    }
                }
            }
        }
        
        // Draw enhanced ghost piece
        this.drawGhostPiece();
    }
    
    drawCell3D(x, y, color, glow, isLocked) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        // Main cell
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
        
        // Enhanced glow effect
        if (this.mode3D) {
            this.ctx.shadowColor = glow || color;
            this.ctx.shadowBlur = isLocked ? 15 : 25;
            this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
            this.ctx.shadowBlur = 0;
            
            // 3D highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(pixelX + 2, pixelY + 2, this.cellSize - 4, 4);
            this.ctx.fillRect(pixelX + 2, pixelY + 2, 4, this.cellSize - 4);
            
            // 3D shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(pixelX + this.cellSize - 6, pixelY + 6, 4, this.cellSize - 6);
            this.ctx.fillRect(pixelX + 6, pixelY + this.cellSize - 6, this.cellSize - 6, 4);
        }
        
        // Border
        this.ctx.strokeStyle = glow || color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
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
        
        // Draw enhanced ghost piece
        this.ctx.globalAlpha = 0.4;
        for (let y = 0; y < ghost.shape.length; y++) {
            for (let x = 0; x < ghost.shape[y].length; x++) {
                if (ghost.shape[y][x] !== 0) {
                    const pixelX = (ghost.x + x) * this.cellSize;
                    const pixelY = (ghost.y + y) * this.cellSize;
                    
                    this.ctx.strokeStyle = ghost.glow;
                    this.ctx.lineWidth = 3;
                    this.ctx.setLineDash([5, 3]);
                    this.ctx.strokeRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
                    this.ctx.setLineDash([]);
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
                    
                    this.nextCtx.shadowColor = this.nextPiece.glow;
                    this.nextCtx.shadowBlur = 15;
                    this.nextCtx.fillRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
                    this.nextCtx.shadowBlur = 0;
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const cellSize = 20;
        const offsetX = (this.holdCanvas.width - this.holdPiece.shape[0].length * cellSize) / 2;
        const offsetY = (this.holdCanvas.height - this.holdPiece.shape.length * cellSize) / 2;
        
        for (let y = 0; y < this.holdPiece.shape.length; y++) {
            for (let x = 0; x < this.holdPiece.shape[y].length; x++) {
                if (this.holdPiece.shape[y][x] !== 0) {
                    const pixelX = offsetX + x * cellSize;
                    const pixelY = offsetY + y * cellSize;
                    
                    this.holdCtx.fillStyle = this.holdPiece.color;
                    this.holdCtx.fillRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
                    
                    this.holdCtx.shadowColor = this.holdPiece.glow;
                    this.holdCtx.shadowBlur = 15;
                    this.holdCtx.fillRect(pixelX, pixelY, cellSize - 1, cellSize - 1);
                    this.holdCtx.shadowBlur = 0;
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('combo').textContent = this.combo;
    }
}

// Initialize enhanced game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new MegaUltraTetris3D();
    
    // Add some startup flavor text
    console.log('🎮 MEGA ULTRA TETRIS 3D v2.0 INITIALIZED');
    console.log('🚀 Features: 3D Effects, Hold Function, Turbo Mode, Power System');
    console.log('🎯 Achievement System Active');
    console.log('🔊 Enhanced Audio System Online');
});