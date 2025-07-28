// 🎮 SUPER TETRIS ULTIMATE - 完璧なゲーム性と操作性 + エフェクト全振り 🎮

class SuperTetris {
    constructor() {
        // ゲーム状態
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.board = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.dropTime = 0;
        this.dropCounter = 0;
        this.lastUpdate = 0;
        
        // エフェクト設定
        this.effects = {
            particles: true,
            sound: true,
            shake: true,
            glow: true
        };
        
        // ハイスコア
        this.highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [999999, 888888, 777777, 666666, 555555];
        
        // Canvas要素
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPieceCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdPieceCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // 音響要素
        this.audio = {
            bgMusic: document.getElementById('bgMusic'),
            dropSound: document.getElementById('dropSound'),
            clearSound: document.getElementById('clearSound'),
            gameOverSound: document.getElementById('gameOverSound')
        };
        
        // テトリスピース定義
        this.pieces = {
            I: {
                shape: [
                    [0, 0, 0, 0],
                    [1, 1, 1, 1],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
                ],
                color: '#00ffff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#8000ff'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                    [0, 0, 0]
                ],
                color: '#00ff00'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ff0080'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#0080ff'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                    [0, 0, 0]
                ],
                color: '#ff8000'
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createNewPiece();
        this.showMessage('🚀 SUPER TETRIS ULTIMATE 🚀');
        this.updateDisplay();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // キーボード操作
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // ゲームボタン
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        // エフェクト切り替え
        document.getElementById('particlesToggle').addEventListener('change', (e) => {
            this.effects.particles = e.target.checked;
        });
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.effects.sound = e.target.checked;
            if (this.effects.sound && this.gameState === 'playing') {
                this.playBGMusic();
            } else {
                this.stopBGMusic();
            }
        });
        document.getElementById('shakeToggle').addEventListener('change', (e) => {
            this.effects.shake = e.target.checked;
        });
        document.getElementById('glowToggle').addEventListener('change', (e) => {
            this.effects.glow = e.target.checked;
            document.body.classList.toggle('super-glow', e.target.checked);
        });
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case 'Space':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'KeyC':
                e.preventDefault();
                this.holdCurrentPiece();
                break;
        }
    }
    
    createNewPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        
        if (!this.nextPiece) {
            const nextType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
            this.nextPiece = {
                type: nextType,
                shape: this.pieces[nextType].shape,
                color: this.pieces[nextType].color,
                x: 3,
                y: 0
            };
        }
        
        this.currentPiece = {
            ...this.nextPiece,
            x: 3,
            y: 0
        };
        
        const nextType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        this.nextPiece = {
            type: nextType,
            shape: this.pieces[nextType].shape,
            color: this.pieces[nextType].color,
            x: 3,
            y: 0
        };
        
        this.canHold = true;
        this.drawNextPiece();
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            this.createParticles(newX * 40 + 200, newY * 40 + 50, this.currentPiece.color);
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        if (this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
            this.playSound('dropSound');
            this.createParticles(this.currentPiece.x * 40 + 200, this.currentPiece.y * 40 + 50, this.currentPiece.color);
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        return rotated;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropped = 0;
        while (this.movePiece(0, 1)) {
            dropped++;
        }
        
        this.score += dropped * 2;
        this.placePiece();
        this.playSound('dropSound');
        this.shakeScreen();
        this.createExplosion(this.currentPiece.x * 40 + 200, this.currentPiece.y * 40 + 50);
    }
    
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        if (!this.holdPiece) {
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.pieces[this.currentPiece.type].shape,
                color: this.currentPiece.color
            };
            this.createNewPiece();
        } else {
            const temp = { ...this.holdPiece };
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.pieces[this.currentPiece.type].shape,
                color: this.currentPiece.color
            };
            this.currentPiece = {
                ...temp,
                x: 3,
                y: 0
            };
        }
        
        this.canHold = false;
        this.drawHoldPiece();
        this.createParticles(60, 300, this.holdPiece.color);
    }
    
    isValidPosition(shape, x, y) {
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const nx = x + px;
                    const ny = y + py;
                    
                    if (nx < 0 || nx >= 10 || ny >= 20) return false;
                    if (ny >= 0 && this.board[ny][nx]) return false;
                }
            }
        }
        return true;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    const nx = this.currentPiece.x + px;
                    const ny = this.currentPiece.y + py;
                    
                    if (ny >= 0) {
                        this.board[ny][nx] = {
                            color: this.currentPiece.color,
                            type: this.currentPiece.type
                        };
                    }
                }
            }
        }
        
        const linesCleared = this.clearLines();
        if (linesCleared > 0) {
            this.processLineClear(linesCleared);
        }
        
        // ゲームオーバーチェック
        if (!this.isValidPosition(this.nextPiece.shape, this.nextPiece.x, this.nextPiece.y)) {
            this.gameOver();
            return;
        }
        
        this.createNewPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        const clearedRows = [];
        
        for (let y = this.board.length - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                clearedRows.push(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(10).fill(0));
                linesCleared++;
                y++; // 行を削除したので調整
            }
        }
        
        // ライン消去エフェクト
        if (clearedRows.length > 0) {
            this.createLineClearEffect(clearedRows);
        }
        
        return linesCleared;
    }
    
    processLineClear(linesCleared) {
        this.lines += linesCleared;
        this.combo += linesCleared;
        
        // スコア計算（コンボボーナス付き）
        const basePoints = [0, 100, 300, 500, 800];
        const points = basePoints[linesCleared] * this.level * Math.max(1, this.combo / 4);
        this.score += Math.floor(points);
        
        // レベルアップ
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropTime = Math.max(50, 1000 - (this.level - 1) * 50);
        
        // エフェクト
        this.playSound('clearSound');
        this.shakeScreen();
        this.createExplosion(200, 400);
        
        // メッセージ表示
        const messages = ['', 'SINGLE!', 'DOUBLE!!', 'TRIPLE!!!', 'TETRIS!!!!'];
        if (linesCleared > 0) {
            this.showMessage(messages[linesCleared] + ` +${Math.floor(points)}`);
        }
        
        this.updateDisplay();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.dropTime = 1000;
        this.dropCounter = 0;
        this.combo = 0;
        
        this.showMessage('🎮 GAME START! 🎮');
        
        if (this.effects.sound) {
            this.playBGMusic();
        }
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'block';
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showMessage('⏸️ PAUSED ⏸️');
            this.stopBGMusic();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showMessage('▶️ RESUMED ▶️');
            if (this.effects.sound) {
                this.playBGMusic();
            }
        }
    }
    
    resetGame() {
        this.gameState = 'menu';
        this.board = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.dropTime = 1000;
        this.dropCounter = 0;
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        
        this.createNewPiece();
        this.updateDisplay();
        this.showMessage('🔄 GAME RESET 🔄');
        this.stopBGMusic();
        
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('pauseBtn').style.display = 'none';
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showMessage('💀 GAME OVER 💀');
        this.playSound('gameOverSound');
        this.stopBGMusic();
        this.shakeScreen();
        
        // ハイスコア更新
        if (this.score > this.highScores[4]) {
            this.highScores.push(this.score);
            this.highScores.sort((a, b) => b - a);
            this.highScores = this.highScores.slice(0, 5);
            localStorage.setItem('tetrisHighScores', JSON.stringify(this.highScores));
            this.updateHighScores();
            this.showMessage('🏆 NEW HIGH SCORE! 🏆');
        }
        
        setTimeout(() => {
            this.resetGame();
        }, 3000);
    }
    
    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastUpdate;
        this.lastUpdate = timestamp;
        
        if (this.gameState === 'playing') {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropTime) {
                if (!this.movePiece(0, 1)) {
                    this.placePiece();
                }
                this.dropCounter = 0;
            }
        }
        
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    draw() {
        // メインキャンバスクリア
        this.ctx.fillStyle = 'rgba(0, 10, 30, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ゲームボード描画
        this.drawBoard();
        
        // 現在のピース描画
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
            this.drawGhost();
        }
        
        // グリッドライン
        this.drawGrid();
    }
    
    drawBoard() {
        for (let y = 0; y < this.board.length; y++) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x].color, this.ctx);
                }
            }
        }
    }
    
    drawPiece(piece, context = this.ctx, offsetX = 0, offsetY = 0) {
        for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
                if (piece.shape[py][px]) {
                    const x = piece.x + px + offsetX;
                    const y = piece.y + py + offsetY;
                    this.drawBlock(x, y, piece.color, context);
                }
            }
        }
    }
    
    drawBlock(x, y, color, context = this.ctx) {
        const blockSize = 40;
        const px = x * blockSize;
        const py = y * blockSize;
        
        // メインブロック
        context.fillStyle = color;
        context.fillRect(px, py, blockSize - 2, blockSize - 2);
        
        // グロー効果
        if (this.effects.glow) {
            context.shadowColor = color;
            context.shadowBlur = 20;
            context.fillRect(px, py, blockSize - 2, blockSize - 2);
            context.shadowBlur = 0;
        }
        
        // ハイライト
        const gradient = context.createLinearGradient(px, py, px + blockSize, py + blockSize);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        context.fillStyle = gradient;
        context.fillRect(px, py, blockSize - 2, blockSize - 2);
        
        // ボーダー
        context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        context.lineWidth = 1;
        context.strokeRect(px, py, blockSize - 2, blockSize - 2);
    }
    
    drawGhost() {
        if (!this.currentPiece) return;
        
        let ghostY = this.currentPiece.y;
        while (this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, ghostY + 1)) {
            ghostY++;
        }
        
        // ゴーストピース描画
        this.ctx.globalAlpha = 0.3;
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    const x = this.currentPiece.x + px;
                    const y = ghostY + py;
                    this.drawBlock(x, y, this.currentPiece.color);
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 縦線
        for (let x = 0; x <= 10; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * 40, 0);
            this.ctx.lineTo(x * 40, 800);
            this.ctx.stroke();
        }
        
        // 横線
        for (let y = 0; y <= 20; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * 40);
            this.ctx.lineTo(400, y * 40);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, 120, 120);
        if (this.nextPiece) {
            const centerX = Math.floor((120 - this.nextPiece.shape[0].length * 20) / 2);
            const centerY = Math.floor((120 - this.nextPiece.shape.length * 20) / 2);
            
            for (let py = 0; py < this.nextPiece.shape.length; py++) {
                for (let px = 0; px < this.nextPiece.shape[py].length; px++) {
                    if (this.nextPiece.shape[py][px]) {
                        const x = centerX + px * 20;
                        const y = centerY + py * 20;
                        
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(x, y, 18, 18);
                        
                        if (this.effects.glow) {
                            this.nextCtx.shadowColor = this.nextPiece.color;
                            this.nextCtx.shadowBlur = 10;
                            this.nextCtx.fillRect(x, y, 18, 18);
                            this.nextCtx.shadowBlur = 0;
                        }
                    }
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, 120, 120);
        if (this.holdPiece) {
            const shape = this.pieces[this.holdPiece.type].shape;
            const centerX = Math.floor((120 - shape[0].length * 20) / 2);
            const centerY = Math.floor((120 - shape.length * 20) / 2);
            
            for (let py = 0; py < shape.length; py++) {
                for (let px = 0; px < shape[py].length; px++) {
                    if (shape[py][px]) {
                        const x = centerX + px * 20;
                        const y = centerY + py * 20;
                        
                        this.holdCtx.fillStyle = this.holdPiece.color;
                        this.holdCtx.fillRect(x, y, 18, 18);
                        
                        if (this.effects.glow) {
                            this.holdCtx.shadowColor = this.holdPiece.color;
                            this.holdCtx.shadowBlur = 10;
                            this.holdCtx.fillRect(x, y, 18, 18);
                            this.holdCtx.shadowBlur = 0;
                        }
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('lines').textContent = this.lines.toString().padStart(3, '0');
        document.getElementById('level').textContent = this.level.toString().padStart(3, '0');
        document.getElementById('combo').textContent = `x${this.combo.toString().padStart(2, '0')}`;
    }
    
    updateHighScores() {
        const scoreList = document.getElementById('highScoreList');
        scoreList.innerHTML = '';
        
        this.highScores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.className = 'score-entry';
            entry.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="score">${score}</span>
            `;
            scoreList.appendChild(entry);
        });
    }
    
    showMessage(text) {
        const messageDisplay = document.getElementById('messageDisplay');
        messageDisplay.textContent = text;
        messageDisplay.classList.add('show');
        
        setTimeout(() => {
            messageDisplay.classList.remove('show');
        }, 2000);
    }
    
    // エフェクト関数
    createParticles(x, y, color) {
        if (!this.effects.particles) return;
        
        const particleSystem = document.getElementById('particleSystem');
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${x + Math.random() * 40}px`;
            particle.style.top = `${y + Math.random() * 40}px`;
            particle.style.backgroundColor = color;
            particleSystem.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }
    
    createExplosion(x, y) {
        if (!this.effects.particles) return;
        
        const particleSystem = document.getElementById('particleSystem');
        const colors = ['#00ffff', '#ff0080', '#ffff00', '#00ff00', '#8000ff'];
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${x + (Math.random() - 0.5) * 100}px`;
            particle.style.top = `${y + (Math.random() - 0.5) * 100}px`;
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = `${Math.random() * 8 + 4}px`;
            particle.style.height = particle.style.width;
            particleSystem.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }
    }
    
    createLineClearEffect(rows) {
        if (!this.effects.particles) return;
        
        const particleSystem = document.getElementById('particleSystem');
        rows.forEach(row => {
            const effect = document.createElement('div');
            effect.className = 'line-clear-effect';
            effect.style.top = `${row * 40}px`;
            effect.style.left = '0px';
            particleSystem.appendChild(effect);
            
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 500);
        });
    }
    
    shakeScreen() {
        if (!this.effects.shake) return;
        
        document.querySelector('.game-board-container').classList.add('shake');
        setTimeout(() => {
            document.querySelector('.game-board-container').classList.remove('shake');
        }, 500);
    }
    
    // 音響効果
    playSound(soundId) {
        if (!this.effects.sound) return;
        
        const sound = this.audio[soundId];
        if (sound) {
            sound.currentTime = 0;
            sound.volume = 0.3;
            sound.play().catch(() => {}); // エラー無視
        }
    }
    
    playBGMusic() {
        if (!this.effects.sound) return;
        
        this.audio.bgMusic.volume = 0.1;
        this.audio.bgMusic.play().catch(() => {}); // エラー無視
    }
    
    stopBGMusic() {
        this.audio.bgMusic.pause();
        this.audio.bgMusic.currentTime = 0;
    }
}

// ゲーム初期化
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SuperTetris();
    
    // 初期エフェクト設定
    if (document.getElementById('glowToggle').checked) {
        document.body.classList.add('super-glow');
    }
    
    // タイトルアニメーション
    const letters = document.querySelectorAll('.game-title .letter');
    letters.forEach((letter, index) => {
        letter.style.animationDelay = `${index * 0.1}s`;
    });
    
    // 初期ハイスコア表示
    game.updateHighScores();
    
    console.log('🎮 SUPER TETRIS ULTIMATE - ゲーム初期化完了！');
});

// Web Audio API を使った効果音生成（オプション）
class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    generateTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playDropSound() {
        this.generateTone(440, 0.1, 'square');
    }
    
    playClearSound() {
        this.generateTone(880, 0.3, 'sawtooth');
        setTimeout(() => this.generateTone(1320, 0.3, 'sawtooth'), 100);
    }
    
    playGameOverSound() {
        this.generateTone(220, 0.5, 'triangle');
        setTimeout(() => this.generateTone(110, 0.5, 'triangle'), 200);
    }
}

const soundGenerator = new SoundGenerator();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SuperTetris, SoundGenerator };
}