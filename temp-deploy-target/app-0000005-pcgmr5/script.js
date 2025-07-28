// Bubble Connect - タップパズルゲーム

class BubbleConnectGame {
    constructor() {
        this.boardSize = 8;
        this.colors = 6;
        this.board = [];
        this.score = 0;
        this.level = 1;
        this.moves = 10;
        this.selectedBubbles = [];
        this.gameRunning = true;
        this.targetScore = 1000;

        this.initializeElements();
        this.setupEventListeners();
        this.initializeGame();
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.movesElement = document.getElementById('moves');
        
        // モーダル要素
        this.gameOverModal = document.getElementById('gameOverModal');
        this.levelUpModal = document.getElementById('levelUpModal');
        this.hintModal = document.getElementById('hintModal');
        
        // ボタン要素
        this.newGameBtn = document.getElementById('newGameBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.continueLevelBtn = document.getElementById('continueLevelBtn');
        this.closeHintBtn = document.getElementById('closeHintBtn');
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => {
            this.hideModal(this.gameOverModal);
            this.startNewGame();
        });
        this.closeModalBtn.addEventListener('click', () => this.hideModal(this.gameOverModal));
        this.continueLevelBtn.addEventListener('click', () => this.hideModal(this.levelUpModal));
        this.closeHintBtn.addEventListener('click', () => this.hideModal(this.hintModal));

        // キーボードサポート
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') this.startNewGame();
            if (e.key === 'h' || e.key === 'H') this.showHint();
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        });
    }

    initializeGame() {
        this.generateBoard();
        this.renderBoard();
        this.updateUI();
    }

    generateBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col] = this.getRandomColor();
            }
        }
        
        // 初期状態で削除可能な塊がない場合は再生成
        if (!this.hasValidMoves()) {
            this.generateBoard();
        }
    }

    getRandomColor() {
        return Math.floor(Math.random() * this.colors) + 1;
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const bubble = document.createElement('button');
                bubble.className = `bubble color-${this.board[row][col]}`;
                bubble.dataset.row = row;
                bubble.dataset.col = col;
                
                bubble.addEventListener('click', (e) => {
                    if (this.gameRunning) {
                        this.handleBubbleClick(parseInt(row), parseInt(col));
                    }
                });

                this.gameBoard.appendChild(bubble);
            }
        }
    }

    handleBubbleClick(row, col) {
        if (!this.gameRunning || this.moves <= 0) return;

        const connectedBubbles = this.findConnectedBubbles(row, col);
        
        if (connectedBubbles.length >= 3) {
            this.removeBubbles(connectedBubbles);
            this.moves--;
            this.updateUI();
            
            if (this.moves <= 0) {
                this.checkGameEnd();
            }
        } else {
            // 無効なクリックの視覚的フィードバック
            this.showInvalidMove(row, col);
        }
    }

    findConnectedBubbles(startRow, startCol) {
        const color = this.board[startRow][startCol];
        const connected = [];
        const visited = new Set();
        
        const dfs = (row, col) => {
            const key = `${row}-${col}`;
            if (visited.has(key) || 
                row < 0 || row >= this.boardSize || 
                col < 0 || col >= this.boardSize ||
                this.board[row][col] !== color) {
                return;
            }
            
            visited.add(key);
            connected.push({row, col});
            
            // 4方向の隣接セルをチェック
            dfs(row - 1, col); // 上
            dfs(row + 1, col); // 下
            dfs(row, col - 1); // 左
            dfs(row, col + 1); // 右
        };
        
        dfs(startRow, startCol);
        return connected;
    }

    removeBubbles(bubbles) {
        const points = this.calculatePoints(bubbles.length);
        this.score += points;
        
        // スコアポップアップ表示
        this.showScorePopup(points, bubbles[0]);
        
        // バブル削除アニメーション
        bubbles.forEach(({row, col}) => {
            const bubbleElement = this.getBubbleElement(row, col);
            if (bubbleElement) {
                bubbleElement.classList.add('removing');
            }
        });
        
        // アニメーション完了後にバブルを削除し、重力適用
        setTimeout(() => {
            bubbles.forEach(({row, col}) => {
                this.board[row][col] = 0; // 空のセルをマーク
            });
            
            this.applyGravity();
            this.fillEmptySpaces();
            this.renderBoard();
            
            // レベルアップチェック
            if (this.score >= this.targetScore) {
                this.levelUp();
            }
        }, 600);
    }

    calculatePoints(bubbleCount) {
        // より多くのバブルを同時に消すと高得点
        let basePoints = bubbleCount * 10;
        let multiplier = 1;
        
        if (bubbleCount >= 5) multiplier = 2;
        if (bubbleCount >= 8) multiplier = 3;
        if (bubbleCount >= 12) multiplier = 4;
        
        return basePoints * multiplier * this.level;
    }

    showScorePopup(points, bubble) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        
        const bubbleElement = this.getBubbleElement(bubble.row, bubble.col);
        if (bubbleElement) {
            const rect = bubbleElement.getBoundingClientRect();
            popup.style.position = 'fixed';
            popup.style.left = rect.left + rect.width / 2 + 'px';
            popup.style.top = rect.top + 'px';
            
            document.body.appendChild(popup);
            
            setTimeout(() => {
                document.body.removeChild(popup);
            }, 1500);
        }
    }

    getBubbleElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    applyGravity() {
        for (let col = 0; col < this.boardSize; col++) {
            let writeIndex = this.boardSize - 1;
            
            // 下から上に向かって処理
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== 0) {
                    this.board[writeIndex][col] = this.board[row][col];
                    if (writeIndex !== row) {
                        this.board[row][col] = 0;
                    }
                    writeIndex--;
                }
            }
        }
    }

    fillEmptySpaces() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = this.getRandomColor();
                }
            }
        }
    }

    showInvalidMove(row, col) {
        const bubbleElement = this.getBubbleElement(row, col);
        if (bubbleElement) {
            bubbleElement.style.animation = 'none';
            bubbleElement.offsetHeight; // リフロー強制
            bubbleElement.style.animation = 'invalidMove 0.5s ease';
            
            setTimeout(() => {
                bubbleElement.style.animation = '';
            }, 500);
        }
    }

    hasValidMoves() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const connected = this.findConnectedBubbles(row, col);
                if (connected.length >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.moves += 5 + this.level; // レベルが上がるにつれて手数も増加
        this.targetScore = this.targetScore * 1.5;
        
        // レベルアップモーダル表示
        document.getElementById('newLevelDisplay').textContent = this.level;
        this.showModal(this.levelUpModal);
        
        this.updateUI();
    }

    checkGameEnd() {
        if (!this.hasValidMoves() || this.moves <= 0) {
            this.gameRunning = false;
            
            // 最終統計を表示
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('finalLevel').textContent = this.level;
            
            setTimeout(() => {
                this.showModal(this.gameOverModal);
            }, 1000);
        }
    }

    startNewGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 10;
        this.targetScore = 1000;
        this.gameRunning = true;
        this.selectedBubbles = [];
        
        this.initializeGame();
    }

    showHint() {
        this.showModal(this.hintModal);
    }

    togglePause() {
        this.gameRunning = !this.gameRunning;
        this.pauseBtn.textContent = this.gameRunning ? 'ポーズ' : '再開';
        
        // ポーズ中の視覚的表示
        this.gameBoard.style.opacity = this.gameRunning ? '1' : '0.5';
    }

    showModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.movesElement.textContent = this.moves;
        
        // 手数が少なくなったら警告色に
        if (this.moves <= 3) {
            this.movesElement.style.color = 'var(--danger-color)';
        } else {
            this.movesElement.style.color = 'var(--primary-color)';
        }
    }
}

// 無効な移動のアニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes invalidMove {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
`;
document.head.appendChild(style);

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new BubbleConnectGame();
});

// PWA サポート（基本的な機能）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}