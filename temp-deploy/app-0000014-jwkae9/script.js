class TapPuzzleMaster {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.tapCount = 0;
        this.currentMode = 'colors';
        this.gridSize = 4;
        this.gameBoard = [];
        this.isGameActive = false;
        this.startTime = null;
        this.particles = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupParticleCanvas();
        this.startParticleAnimation();
        
        console.log('🧩 Tap Puzzle Master initialized');
    }
    
    initializeElements() {
        this.puzzleBoard = document.getElementById('puzzleBoard');
        this.currentLevelDisplay = document.getElementById('currentLevel');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.tapCountDisplay = document.getElementById('tapCount');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.timeLimitSelect = document.getElementById('timeLimit');
        this.colorCountSlider = document.getElementById('colorCount');
        this.colorCountValue = document.getElementById('colorCountValue');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerValue = document.getElementById('timerValue');
    }
    
    initializeEventListeners() {
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectMode(btn.dataset.mode));
        });
        
        this.gridSizeSelect.addEventListener('change', () => {
            this.gridSize = parseInt(this.gridSizeSelect.value);
        });
        
        this.colorCountSlider.addEventListener('input', () => {
            this.colorCountValue.textContent = this.colorCountSlider.value + '色';
        });
        
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.shuffleBoard());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.backToMenu());
    }
    
    selectMode(mode) {
        this.currentMode = mode;
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
    
    startGame() {
        this.isGameActive = true;
        this.startTime = Date.now();
        this.tapCount = 0;
        this.generateBoard();
        this.updateDisplay();
        this.startTimer();
    }
    
    generateBoard() {
        this.gameBoard = [];
        this.puzzleBoard.innerHTML = '';
        this.puzzleBoard.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        const colorCount = parseInt(this.colorCountSlider.value);
        const colors = this.generateColors(colorCount);
        
        switch (this.currentMode) {
            case 'colors':
                this.generateColorBoard(colors);
                break;
            case 'numbers':
                this.generateNumberBoard();
                break;
            case 'patterns':
                this.generatePatternBoard();
                break;
            case 'chain':
                this.generateChainBoard(colors);
                break;
        }
    }
    
    generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (360 / count) * i;
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        return colors;
    }
    
    generateColorBoard(colors) {
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'puzzle-cell color-cell';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            cell.style.backgroundColor = color;
            cell.dataset.color = color;
            cell.dataset.index = i;
            
            cell.addEventListener('click', () => this.handleCellTap(cell, i));
            
            this.puzzleBoard.appendChild(cell);
            this.gameBoard.push({ type: 'color', value: color, solved: false });
        }
        
        this.targetPattern = this.generateTargetPattern(colors);
    }
    
    generateNumberBoard() {
        const numbers = [];
        for (let i = 1; i <= this.gridSize * this.gridSize; i++) {
            numbers.push(i);
        }
        
        // Shuffle numbers
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'puzzle-cell number-cell';
            cell.textContent = numbers[i];
            cell.dataset.number = numbers[i];
            cell.dataset.index = i;
            
            cell.addEventListener('click', () => this.handleCellTap(cell, i));
            
            this.puzzleBoard.appendChild(cell);
            this.gameBoard.push({ type: 'number', value: numbers[i], solved: false });
        }
    }
    
    generatePatternBoard() {
        const patterns = ['🔷', '🔸', '🔹', '🔺', '🔻', '⭐', '💎', '🌟'];
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'puzzle-cell pattern-cell';
            
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            cell.textContent = pattern;
            cell.dataset.pattern = pattern;
            cell.dataset.index = i;
            
            cell.addEventListener('click', () => this.handleCellTap(cell, i));
            
            this.puzzleBoard.appendChild(cell);
            this.gameBoard.push({ type: 'pattern', value: pattern, solved: false });
        }
    }
    
    generateChainBoard(colors) {
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'puzzle-cell chain-cell';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            cell.style.backgroundColor = color;
            cell.dataset.color = color;
            cell.dataset.index = i;
            cell.dataset.chained = 'false';
            
            cell.addEventListener('click', () => this.handleChainTap(cell, i));
            
            this.puzzleBoard.appendChild(cell);
            this.gameBoard.push({ type: 'chain', value: color, solved: false, chained: false });
        }
    }
    
    handleCellTap(cell, index) {
        if (!this.isGameActive) return;
        
        this.tapCount++;
        this.updateDisplay();
        this.createTapEffect(cell);
        
        switch (this.currentMode) {
            case 'colors':
                this.handleColorTap(cell, index);
                break;
            case 'numbers':
                this.handleNumberTap(cell, index);
                break;
            case 'patterns':
                this.handlePatternTap(cell, index);
                break;
        }
        
        this.checkWinCondition();
    }
    
    handleColorTap(cell, index) {
        const adjacentCells = this.getAdjacentCells(index);
        const targetColor = cell.dataset.color;
        
        adjacentCells.forEach(adjIndex => {
            const adjCell = this.puzzleBoard.children[adjIndex];
            if (adjCell.dataset.color === targetColor) {
                adjCell.classList.add('matched');
                this.gameBoard[adjIndex].solved = true;
            }
        });
        
        cell.classList.add('matched');
        this.gameBoard[index].solved = true;
    }
    
    handleNumberTap(cell, index) {
        const number = parseInt(cell.dataset.number);
        const expectedNumber = this.getExpectedNumber(index);
        
        if (number === expectedNumber) {
            cell.classList.add('correct');
            this.gameBoard[index].solved = true;
            this.score += 10;
        } else {
            cell.classList.add('wrong');
            setTimeout(() => cell.classList.remove('wrong'), 500);
        }
    }
    
    handlePatternTap(cell, index) {
        const pattern = cell.dataset.pattern;
        const matchingCells = Array.from(this.puzzleBoard.children).filter(c => 
            c.dataset.pattern === pattern
        );
        
        if (matchingCells.length >= 3) {
            matchingCells.forEach(c => {
                c.classList.add('matched');
                const cellIndex = parseInt(c.dataset.index);
                this.gameBoard[cellIndex].solved = true;
            });
        }
    }
    
    handleChainTap(cell, index) {
        if (cell.dataset.chained === 'true') return;
        
        cell.dataset.chained = 'true';
        cell.classList.add('chained');
        this.gameBoard[index].chained = true;
        
        const color = cell.dataset.color;
        const adjacentChains = this.getAdjacentChains(index, color);
        
        if (adjacentChains.length >= 2) {
            this.score += adjacentChains.length * 5;
            adjacentChains.forEach(chainIndex => {
                this.gameBoard[chainIndex].solved = true;
                this.puzzleBoard.children[chainIndex].classList.add('solved');
            });
        }
    }
    
    getAdjacentCells(index) {
        const row = Math.floor(index / this.gridSize);
        const col = index % this.gridSize;
        const adjacent = [];
        
        // Check all 4 directions
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < this.gridSize && 
                newCol >= 0 && newCol < this.gridSize) {
                adjacent.push(newRow * this.gridSize + newCol);
            }
        });
        
        return adjacent;
    }
    
    getAdjacentChains(index, color) {
        const chains = [index];
        const visited = new Set([index]);
        const queue = [index];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const adjacent = this.getAdjacentCells(current);
            
            adjacent.forEach(adjIndex => {
                if (!visited.has(adjIndex)) {
                    const adjCell = this.puzzleBoard.children[adjIndex];
                    if (adjCell.dataset.color === color && 
                        adjCell.dataset.chained === 'true') {
                        visited.add(adjIndex);
                        chains.push(adjIndex);
                        queue.push(adjIndex);
                    }
                }
            });
        }
        
        return chains;
    }
    
    getExpectedNumber(index) {
        return index + 1;
    }
    
    createTapEffect(cell) {
        const rect = cell.getBoundingClientRect();
        const canvasRect = this.particleCanvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: 0.05,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                size: Math.random() * 4 + 2
            });
        }
        
        cell.classList.add('tap-effect');
        setTimeout(() => cell.classList.remove('tap-effect'), 200);
    }
    
    checkWinCondition() {
        const solvedCells = this.gameBoard.filter(cell => cell.solved).length;
        const totalCells = this.gameBoard.length;
        const progress = (solvedCells / totalCells) * 100;
        
        this.progressFill.style.width = progress + '%';
        this.progressText.textContent = Math.floor(progress) + '% 完了';
        
        if (progress >= 100) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        this.isGameActive = false;
        const endTime = Date.now();
        const timeElapsed = Math.floor((endTime - this.startTime) / 1000);
        
        this.score += Math.max(0, 1000 - timeElapsed * 10);
        this.updateDisplay();
        this.showCompleteModal(timeElapsed);
        this.createVictoryParticles();
    }
    
    createVictoryParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.particleCanvas.width,
                y: Math.random() * this.particleCanvas.height,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 1.0,
                decay: 0.02,
                color: `hsl(${Math.random() * 360}, 80%, 70%)`,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    showCompleteModal(timeElapsed) {
        const modal = document.getElementById('completeModal');
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('resultScore').textContent = this.score;
        document.getElementById('resultTime').textContent = timeString;
        document.getElementById('resultTaps').textContent = this.tapCount;
        
        const efficiency = Math.max(0, 100 - (this.tapCount / (this.gridSize * this.gridSize)) * 10);
        document.getElementById('resultEfficiency').textContent = Math.floor(efficiency) + '%';
        
        modal.classList.add('show');
    }
    
    nextLevel() {
        this.currentLevel++;
        this.currentLevelDisplay.textContent = this.currentLevel;
        
        if (this.gridSize < 6) {
            this.gridSize++;
            this.gridSizeSelect.value = this.gridSize;
        }
        
        document.getElementById('completeModal').classList.remove('show');
        this.startGame();
    }
    
    backToMenu() {
        document.getElementById('completeModal').classList.remove('show');
        this.resetGame();
    }
    
    resetGame() {
        this.isGameActive = false;
        this.currentLevel = 1;
        this.score = 0;
        this.tapCount = 0;
        this.gameBoard = [];
        this.puzzleBoard.innerHTML = '';
        this.particles = [];
        
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0% 完了';
        
        this.updateDisplay();
    }
    
    startTimer() {
        const timeLimit = parseInt(this.timeLimitSelect.value);
        if (timeLimit === 0) {
            this.timerDisplay.style.display = 'none';
            return;
        }
        
        this.timerDisplay.style.display = 'block';
        let remaining = timeLimit;
        
        const timer = setInterval(() => {
            if (!this.isGameActive) {
                clearInterval(timer);
                return;
            }
            
            remaining--;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this.timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (remaining <= 0) {
                clearInterval(timer);
                this.gameOver();
            }
        }, 1000);
    }
    
    gameOver() {
        this.isGameActive = false;
        alert('時間切れです！');
    }
    
    showHint() {
        // Simple hint: highlight a correct move
        const unsolvedCells = Array.from(this.puzzleBoard.children).filter(cell => 
            !cell.classList.contains('matched') && !cell.classList.contains('solved')
        );
        
        if (unsolvedCells.length > 0) {
            const randomCell = unsolvedCells[Math.floor(Math.random() * unsolvedCells.length)];
            randomCell.classList.add('hint');
            setTimeout(() => randomCell.classList.remove('hint'), 2000);
        }
    }
    
    shuffleBoard() {
        if (!this.isGameActive) return;
        
        const cells = Array.from(this.puzzleBoard.children);
        const values = cells.map(cell => ({
            color: cell.dataset.color,
            number: cell.dataset.number,
            pattern: cell.dataset.pattern
        }));
        
        // Shuffle values
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }
        
        cells.forEach((cell, index) => {
            if (values[index].color) cell.dataset.color = values[index].color;
            if (values[index].number) cell.dataset.number = values[index].number;
            if (values[index].pattern) cell.dataset.pattern = values[index].pattern;
        });
    }
    
    setupParticleCanvas() {
        const container = document.querySelector('.puzzle-container');
        const rect = container.getBoundingClientRect();
        this.particleCanvas.width = rect.width;
        this.particleCanvas.height = rect.height;
    }
    
    startParticleAnimation() {
        const animate = () => {
            this.updateParticles();
            this.renderParticles();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
            particle.life -= particle.decay;
            return particle.life > 0 && particle.y < this.particleCanvas.height + 50;
        });
    }
    
    renderParticles() {
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        this.particles.forEach(particle => {
            this.particleCtx.fillStyle = particle.color;
            this.particleCtx.globalAlpha = particle.life;
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.particleCtx.fill();
        });
        
        this.particleCtx.globalAlpha = 1;
    }
    
    updateDisplay() {
        this.currentLevelDisplay.textContent = this.currentLevel;
        this.scoreDisplay.textContent = this.score;
        this.tapCountDisplay.textContent = this.tapCount;
    }
}

// Add CSS for effects
const style = document.createElement('style');
style.textContent = `
    .tap-effect {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
    
    .hint {
        animation: hintPulse 1s infinite;
    }
    
    @keyframes hintPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .matched, .solved, .correct {
        background: linear-gradient(45deg, #4ade80, #22c55e) !important;
        color: white;
    }
    
    .wrong {
        background: linear-gradient(45deg, #ef4444, #dc2626) !important;
        color: white;
    }
    
    .chained {
        border: 3px solid #fbbf24;
        box-shadow: 0 0 10px #fbbf24;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.tapPuzzle = new TapPuzzleMaster();
});