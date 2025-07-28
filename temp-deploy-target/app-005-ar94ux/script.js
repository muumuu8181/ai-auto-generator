// めちゃくちゃ格好良いテトリス - app-005-ar94ux

class CyberTetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // ゲーム設定
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 40;
        this.colors = [
            '#000000', // 空
            '#ff0080', // I
            '#8000ff', // O
            '#00ff80', // T
            '#ffb700', // S
            '#00ffff', // Z
            '#ff4500', // J
            '#ff0000'  // L
        ];
        
        // ゲーム状態
        this.board = this.createEmptyBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.startTime = null;
        this.animationId = null;
        this.lastTime = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // エフェクト設定
        this.particles = [];
        this.effects = {
            particles: true,
            screenShake: true,
            lineEffects: true,
            glowEffects: true
        };
        
        // オーディオ
        this.sounds = {
            move: this.createSound(200, 0.1),
            rotate: this.createSound(300, 0.1),
            drop: this.createSound(150, 0.2),
            line: this.createSound(800, 0.3),
            tetris: this.createSound(1000, 0.5),
            gameOver: this.createSound(100, 1.0)
        };
        
        this.currentTheme = 'cyber';
        this.init();
    }
    
    // 初期化
    init() {
        this.setupEventListeners();
        this.setupParticleSystem();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.animate();
    }
    
    // 空のボードを作成
    createEmptyBoard() {
        return Array.from({ length: this.BOARD_HEIGHT }, () => 
            Array.from({ length: this.BOARD_WIDTH }, () => 0)
        );
    }
    
    // テトリスピース定義
    getPieces() {
        return [
            { // I
                shape: [
                    [0,0,0,0],
                    [1,1,1,1],
                    [0,0,0,0],
                    [0,0,0,0]
                ],
                color: 1
            },
            { // O
                shape: [
                    [2,2],
                    [2,2]
                ],
                color: 2
            },
            { // T
                shape: [
                    [0,3,0],
                    [3,3,3],
                    [0,0,0]
                ],
                color: 3
            },
            { // S
                shape: [
                    [0,4,4],
                    [4,4,0],
                    [0,0,0]
                ],
                color: 4
            },
            { // Z
                shape: [
                    [5,5,0],
                    [0,5,5],
                    [0,0,0]
                ],
                color: 5
            },
            { // J
                shape: [
                    [6,0,0],
                    [6,6,6],
                    [0,0,0]
                ],
                color: 6
            },
            { // L
                shape: [
                    [0,0,7],
                    [7,7,7],
                    [0,0,0]
                ],
                color: 7
            }
        ];
    }
    
    // 次のピースを生成
    generateNextPiece() {
        const pieces = this.getPieces();
        this.nextPiece = {
            ...pieces[Math.floor(Math.random() * pieces.length)],
            x: 0,
            y: 0
        };
    }
    
    // ピースをスポーン
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
            this.generateNextPiece();
            this.canHold = true;
            
            // ゲームオーバーチェック
            if (this.isCollision(this.currentPiece, 0, 0)) {
                this.gameOver();
                return;
            }
        }
    }
    
    // 衝突判定
    isCollision(piece, dx, dy) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // ピースを移動
    movePiece(dx, dy) {
        if (!this.currentPiece || this.gamePaused) return false;
        
        if (!this.isCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.playSound('move');
            return true;
        }
        return false;
    }
    
    // ピースを回転
    rotatePiece() {
        if (!this.currentPiece || this.gamePaused) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        // 壁蹴り処理
        const kicks = [
            [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]
        ];
        
        for (let [dx, dy] of kicks) {
            if (!this.isCollision(this.currentPiece, dx, dy)) {
                this.currentPiece.x += dx;
                this.currentPiece.y += dy;
                this.playSound('rotate');
                this.createRotateEffect();
                return;
            }
        }
        
        // 回転できない場合は元に戻す
        this.currentPiece.shape = originalShape;
    }
    
    // マトリックス回転
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                rotated[c][rows - 1 - r] = matrix[r][c];
            }
        }
        return rotated;
    }
    
    // ハードドロップ
    hardDrop() {
        if (!this.currentPiece || this.gamePaused) return;
        
        let dropDistance = 0;
        while (!this.isCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        this.score += dropDistance * 2;
        this.placePiece();
        this.playSound('drop');
        this.createDropEffect();
    }
    
    // ホールド機能
    holdPiece() {
        if (!this.canHold || !this.currentPiece || this.gamePaused) return;
        
        if (this.holdPiece) {
            // 既にホールドピースがある場合は交換
            const temp = { ...this.holdPiece };
            this.holdPiece = {
                shape: this.currentPiece.shape,
                color: this.currentPiece.color
            };
            this.currentPiece = {
                ...temp,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(temp.shape[0].length / 2),
                y: 0
            };
        } else {
            // 初回ホールド
            this.holdPiece = {
                shape: this.currentPiece.shape,
                color: this.currentPiece.color
            };
            this.spawnPiece();
        }
        
        this.canHold = false;
    }
    
    // ピースを配置
    placePiece() {
        if (!this.currentPiece) return;
        
        // ボードにピースを配置
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // ライン消去チェック
        this.clearLines();
        this.spawnPiece();
    }
    
    // ライン消去
    clearLines() {
        const clearedLines = [];
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                clearedLines.push(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                y++; // 同じ行を再チェック
            }
        }
        
        if (clearedLines.length > 0) {
            this.processLineClears(clearedLines);
        } else {
            this.combo = 0;
        }
    }
    
    // ライン消去処理
    processLineClears(clearedLines) {
        const lineCount = clearedLines.length;
        this.lines += lineCount;
        this.combo++;
        
        // スコア計算
        const baseScore = [0, 100, 300, 500, 800][lineCount] || 800;
        const comboBonus = this.combo > 1 ? (this.combo - 1) * 50 : 0;
        const levelBonus = baseScore * this.level;
        
        this.score += levelBonus + comboBonus;
        
        // レベルアップ
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        
        // エフェクト
        this.createLineEffect(clearedLines);
        
        if (lineCount === 4) {
            this.playSound('tetris');
            this.createTetrisEffect();
        } else {
            this.playSound('line');
        }
        
        if (this.effects.screenShake) {
            this.screenShake();
        }
    }
    
    // 描画メイン
    draw() {
        this.clearCanvas();
        this.drawBoard();
        this.drawCurrentPiece();
        this.drawGhost();
        this.drawNext();
        this.drawHold();
        this.drawParticles();
    }
    
    // キャンバスクリア
    clearCanvas() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // ボード描画
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x], 1.0);
                }
            }
        }
        
        // グリッド描画
        this.drawGrid();
    }
    
    // 現在のピース描画
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawBlock(
                        this.currentPiece.x + x,
                        this.currentPiece.y + y,
                        this.currentPiece.color,
                        1.0
                    );
                }
            }
        }
    }
    
    // ゴーストピース描画
    drawGhost() {
        if (!this.currentPiece) return;
        
        const ghost = { ...this.currentPiece };
        while (!this.isCollision(ghost, 0, 1)) {
            ghost.y++;
        }
        
        for (let y = 0; y < ghost.shape.length; y++) {
            for (let x = 0; x < ghost.shape[y].length; x++) {
                if (ghost.shape[y][x]) {
                    this.drawBlock(ghost.x + x, ghost.y + y, ghost.color, 0.3);
                }
            }
        }
    }
    
    // ブロック描画
    drawBlock(x, y, colorIndex, alpha = 1.0) {
        const blockX = x * this.BLOCK_SIZE;
        const blockY = y * this.BLOCK_SIZE;
        const color = this.colors[colorIndex];
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // メインブロック
        this.ctx.fillStyle = color;
        this.ctx.fillRect(blockX, blockY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        // グロウエフェクト
        if (this.effects.glowEffects && alpha > 0.5) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 20;
            this.ctx.fillRect(blockX + 2, blockY + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
        }
        
        // ボーダー
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(blockX, blockY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        this.ctx.restore();
    }
    
    // グリッド描画
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    // Next描画
    drawNext() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * 25) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * 25) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    this.nextCtx.fillStyle = this.colors[this.nextPiece.color];
                    this.nextCtx.fillRect(
                        offsetX + x * 25,
                        offsetY + y * 25,
                        25, 25
                    );
                }
            }
        }
    }
    
    // Hold描画
    drawHold() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const offsetX = (this.holdCanvas.width - this.holdPiece.shape[0].length * 25) / 2;
        const offsetY = (this.holdCanvas.height - this.holdPiece.shape.length * 25) / 2;
        
        for (let y = 0; y < this.holdPiece.shape.length; y++) {
            for (let x = 0; x < this.holdPiece.shape[y].length; x++) {
                if (this.holdPiece.shape[y][x]) {
                    this.holdCtx.fillStyle = this.colors[this.holdPiece.color];
                    this.holdCtx.fillRect(
                        offsetX + x * 25,
                        offsetY + y * 25,
                        25, 25
                    );
                }
            }
        }
    }
    
    // パーティクルシステム
    setupParticleSystem() {
        this.particleCanvas = document.getElementById('particles-canvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = window.innerHeight;
    }
    
    // パーティクル作成
    createParticle(x, y, color, velocity = {}) {
        if (!this.effects.particles) return;
        
        this.particles.push({
            x: x,
            y: y,
            vx: (velocity.x || 0) + (Math.random() - 0.5) * 4,
            vy: (velocity.y || 0) + (Math.random() - 0.5) * 4,
            color: color,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            size: 2 + Math.random() * 3
        });
    }
    
    // パーティクル描画
    drawParticles() {
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.vy += 0.1; // 重力
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.particleCtx.save();
            this.particleCtx.globalAlpha = p.life;
            this.particleCtx.fillStyle = p.color;
            this.particleCtx.beginPath();
            this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.particleCtx.fill();
            this.particleCtx.restore();
        }
    }
    
    // エフェクト作成
    createLineEffect(lines) {
        if (!this.effects.lineEffects) return;
        
        const canvas = this.canvas.getBoundingClientRect();
        for (let line of lines) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.createParticle(
                    canvas.left + x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                    canvas.top + line * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                    this.colors[Math.floor(Math.random() * this.colors.length)],
                    { x: (Math.random() - 0.5) * 10, y: -Math.random() * 5 }
                );
            }
        }
    }
    
    createTetrisEffect() {
        const canvas = this.canvas.getBoundingClientRect();
        for (let i = 0; i < 50; i++) {
            this.createParticle(
                canvas.left + canvas.width / 2,
                canvas.top + canvas.height / 2,
                '#ffff00',
                { 
                    x: (Math.random() - 0.5) * 20, 
                    y: (Math.random() - 0.5) * 20 
                }
            );
        }
    }
    
    createRotateEffect() {
        if (!this.currentPiece) return;
        
        const canvas = this.canvas.getBoundingClientRect();
        const centerX = canvas.left + (this.currentPiece.x + 1.5) * this.BLOCK_SIZE;
        const centerY = canvas.top + (this.currentPiece.y + 1.5) * this.BLOCK_SIZE;
        
        for (let i = 0; i < 10; i++) {
            this.createParticle(
                centerX,
                centerY,
                this.colors[this.currentPiece.color]
            );
        }
    }
    
    createDropEffect() {
        if (!this.currentPiece) return;
        
        const canvas = this.canvas.getBoundingClientRect();
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.createParticle(
                        canvas.left + (this.currentPiece.x + x + 0.5) * this.BLOCK_SIZE,
                        canvas.top + (this.currentPiece.y + y + 0.5) * this.BLOCK_SIZE,
                        this.colors[this.currentPiece.color],
                        { x: 0, y: 5 }
                    );
                }
            }
        }
    }
    
    // 画面揺れ
    screenShake() {
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 500);
    }
    
    // 音声生成
    createSound(frequency, duration) {
        return () => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };
    }
    
    // 音声再生
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    // 表示更新
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('combo-display').textContent = this.combo;
        document.getElementById('combo-multiplier').textContent = `×${Math.max(1, this.combo)}`;
        
        if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('time').textContent = `${minutes}:${seconds}`;
        }
    }
    
    // ゲーム開始
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.startTime = Date.now();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.board = this.createEmptyBoard();
        this.holdPiece = null;
        this.canHold = true;
        
        document.getElementById('game-overlay').style.display = 'none';
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
    }
    
    // ゲーム一時停止
    pauseGame() {
        this.gamePaused = !this.gamePaused;
        document.getElementById('pause-btn').innerHTML = 
            this.gamePaused ? '<i class="fas fa-play"></i> RESUME' : '<i class="fas fa-pause"></i> PAUSE';
    }
    
    // ゲーム再開
    restartGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('game-over-modal').style.display = 'none';
        this.particles = [];
    }
    
    // ゲームオーバー
    gameOver() {
        this.gameRunning = false;
        this.playSound('gameOver');
        
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-lines').textContent = this.lines;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('final-time').textContent = document.getElementById('time').textContent;
        
        setTimeout(() => {
            document.getElementById('game-over-modal').style.display = 'block';
        }, 1000);
    }
    
    // テーマ変更
    changeTheme(theme) {
        this.currentTheme = theme;
        document.body.classList.remove('theme-cyber', 'theme-neon', 'theme-matrix', 'theme-synthwave', 'theme-fire');
        if (theme !== 'cyber') {
            document.body.classList.add(`theme-${theme}`);
        }
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) return;
            
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
                    if (this.movePiece(0, 1)) {
                        this.score += 1;
                    }
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
                    this.holdPiece();
                    break;
                case 'KeyP':
                    e.preventDefault();
                    this.pauseGame();
                    break;
            }
        });
        
        // ボタンイベント
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('game-over-modal').style.display = 'none';
            this.startGame();
        });
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.getElementById('game-over-modal').style.display = 'none';
            this.restartGame();
        });
        
        // エフェクト設定
        document.getElementById('particles-toggle').addEventListener('change', (e) => {
            this.effects.particles = e.target.checked;
        });
        document.getElementById('screen-shake').addEventListener('change', (e) => {
            this.effects.screenShake = e.target.checked;
        });
        document.getElementById('line-effects').addEventListener('change', (e) => {
            this.effects.lineEffects = e.target.checked;
        });
        document.getElementById('glow-effects').addEventListener('change', (e) => {
            this.effects.glowEffects = e.target.checked;
        });
        
        // テーマ選択
        document.getElementById('theme-selector').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
        
        // リサイズ処理
        window.addEventListener('resize', () => {
            this.particleCanvas.width = window.innerWidth;
            this.particleCanvas.height = window.innerHeight;
        });
    }
    
    // メインループ
    animate(currentTime = 0) {
        if (!this.gameRunning || this.gamePaused) {
            this.animationId = requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 落下処理
        this.dropTime += deltaTime;
        if (this.dropTime >= this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.placePiece();
            }
            this.dropTime = 0;
        }
        
        this.draw();
        this.updateDisplay();
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    const game = new CyberTetris();
    
    // 音楽コントロール
    const bgm = document.getElementById('bgm');
    const musicToggle = document.getElementById('music-toggle');
    let musicPlaying = false;
    
    musicToggle.addEventListener('click', () => {
        if (musicPlaying) {
            bgm.pause();
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            bgm.play().catch(() => {}); // Auto-play制限対策
            musicToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
        musicPlaying = !musicPlaying;
    });
    
    // サウンドコントロール
    document.getElementById('mute-btn').addEventListener('click', function() {
        // サウンドのミュート切り替え処理
        this.innerHTML = this.innerHTML.includes('volume-up') ? 
            '<i class="fas fa-volume-mute"></i> SOUND' : 
            '<i class="fas fa-volume-up"></i> SOUND';
    });
});