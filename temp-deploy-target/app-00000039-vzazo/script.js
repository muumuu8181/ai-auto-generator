// ルービックキューブソルバー実装
class RubiksCube {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 3;
        this.cubeSize = 150;
        this.rotationX = -30;
        this.rotationY = 45;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.moveCount = 0;
        this.currentStage = 1;
        this.animationSpeed = 400;
        this.isAnimating = false;
        this.isSolving = false;
        
        // キューブの状態を初期化（各面の色）
        this.faces = {
            U: Array(9).fill('white'),    // 上面
            D: Array(9).fill('yellow'),   // 下面
            F: Array(9).fill('green'),    // 前面
            B: Array(9).fill('blue'),     // 後面
            R: Array(9).fill('red'),      // 右面
            L: Array(9).fill('orange')    // 左面
        };
        
        this.colors = {
            white: '#FFFFFF',
            yellow: '#FFD700',
            green: '#00FF00',
            blue: '#0080FF',
            red: '#FF0000',
            orange: '#FFA500'
        };
        
        this.stageInfo = [
            { name: "シンプルなパズル", shuffleMoves: 3 },
            { name: "初級レベル", shuffleMoves: 5 },
            { name: "簡単", shuffleMoves: 8 },
            { name: "中級レベル", shuffleMoves: 12 },
            { name: "やや難しい", shuffleMoves: 15 },
            { name: "難しい", shuffleMoves: 18 },
            { name: "上級レベル", shuffleMoves: 22 },
            { name: "エキスパート", shuffleMoves: 25 },
            { name: "マスター", shuffleMoves: 30 },
            { name: "グランドマスター", shuffleMoves: 35 }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.render();
        this.createBackgroundAnimation();
    }
    
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        
        // タッチイベント
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onMouseUp());
        
        // ボタンイベント
        document.getElementById('shuffleBtn').addEventListener('click', () => this.shuffle());
        document.getElementById('solveBtn').addEventListener('click', () => this.solve());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('prevStage').addEventListener('click', () => this.changeStage(-1));
        document.getElementById('nextStage').addEventListener('click', () => this.changeStage(1));
        
        // スライダーイベント
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speedDisplay').textContent = `${this.animationSpeed}ms`;
        });
    }
    
    onMouseDown(e) {
        if (this.isAnimating) return;
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    onMouseMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        
        this.rotationY += deltaX * 0.5;
        this.rotationX -= deltaY * 0.5;
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        
        this.render();
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onTouchStart(e) {
        if (this.isAnimating) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.isDragging = true;
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
    }
    
    onTouchMove(e) {
        if (!this.isDragging || this.isAnimating) return;
        e.preventDefault();
        const touch = e.touches[0];
        
        const deltaX = touch.clientX - this.lastX;
        const deltaY = touch.clientY - this.lastY;
        
        this.rotationY += deltaX * 0.5;
        this.rotationX -= deltaY * 0.5;
        
        this.lastX = touch.clientX;
        this.lastY = touch.clientY;
        
        this.render();
    }
    
    // 3D座標を2D座標に変換
    project3D(x, y, z) {
        const radX = this.rotationX * Math.PI / 180;
        const radY = this.rotationY * Math.PI / 180;
        
        // Y軸回転
        const x1 = x * Math.cos(radY) - z * Math.sin(radY);
        const z1 = x * Math.sin(radY) + z * Math.cos(radY);
        
        // X軸回転
        const y1 = y * Math.cos(radX) - z1 * Math.sin(radX);
        const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
        
        // 透視投影
        const scale = 600 / (600 + z2);
        const x2 = x1 * scale + this.canvas.width / 2;
        const y2 = y1 * scale + this.canvas.height / 2;
        
        return { x: x2, y: y2, z: z2 };
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // キューブの各面を描画
        const faces = [
            { face: 'B', normal: { x: 0, y: 0, z: -1 } },
            { face: 'L', normal: { x: -1, y: 0, z: 0 } },
            { face: 'D', normal: { x: 0, y: 1, z: 0 } },
            { face: 'R', normal: { x: 1, y: 0, z: 0 } },
            { face: 'U', normal: { x: 0, y: -1, z: 0 } },
            { face: 'F', normal: { x: 0, y: 0, z: 1 } }
        ];
        
        // 面を奥から手前に向かってソート
        faces.sort((a, b) => {
            const aNormal = this.rotateVector(a.normal);
            const bNormal = this.rotateVector(b.normal);
            return aNormal.z - bNormal.z;
        });
        
        // 各面を描画
        faces.forEach(({ face }) => {
            this.drawFace(face);
        });
    }
    
    rotateVector(v) {
        const radX = this.rotationX * Math.PI / 180;
        const radY = this.rotationY * Math.PI / 180;
        
        // Y軸回転
        const x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
        const z1 = v.x * Math.sin(radY) + v.z * Math.cos(radY);
        
        // X軸回転
        const y1 = v.y * Math.cos(radX) - z1 * Math.sin(radX);
        const z2 = v.y * Math.sin(radX) + z1 * Math.cos(radX);
        
        return { x: x1, y: y1, z: z2 };
    }
    
    drawFace(face) {
        const positions = this.getFacePositions(face);
        const size = this.cubeSize / 3;
        
        for (let i = 0; i < 9; i++) {
            const pos = positions[i];
            const p1 = this.project3D(pos.x - size/2, pos.y - size/2, pos.z);
            const p2 = this.project3D(pos.x + size/2, pos.y - size/2, pos.z);
            const p3 = this.project3D(pos.x + size/2, pos.y + size/2, pos.z);
            const p4 = this.project3D(pos.x - size/2, pos.y + size/2, pos.z);
            
            // 面が前を向いているかチェック
            const normal = (p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y);
            if (normal > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.lineTo(p3.x, p3.y);
                this.ctx.lineTo(p4.x, p4.y);
                this.ctx.closePath();
                
                // 色を塗る
                this.ctx.fillStyle = this.colors[this.faces[face][i]];
                this.ctx.fill();
                
                // 境界線を描く
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }
    
    getFacePositions(face) {
        const positions = [];
        const halfSize = this.cubeSize / 2;
        const third = this.cubeSize / 3;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = (col - 1) * third;
                const y = (row - 1) * third;
                
                let pos;
                switch (face) {
                    case 'F':
                        pos = { x, y, z: halfSize };
                        break;
                    case 'B':
                        pos = { x: -x, y, z: -halfSize };
                        break;
                    case 'U':
                        pos = { x, y: -halfSize, z: -y };
                        break;
                    case 'D':
                        pos = { x, y: halfSize, z: y };
                        break;
                    case 'R':
                        pos = { x: halfSize, y, z: -x };
                        break;
                    case 'L':
                        pos = { x: -halfSize, y, z: x };
                        break;
                }
                positions.push(pos);
            }
        }
        return positions;
    }
    
    // 面を回転
    async rotateFace(face, isPrime = false) {
        if (this.isAnimating || this.isSolving) return;
        
        this.isAnimating = true;
        
        // アニメーション
        await this.animateRotation(face, isPrime);
        
        // 実際の回転を実行
        this.performRotation(face, isPrime);
        
        this.moveCount++;
        this.updateStats();
        
        this.isAnimating = false;
        this.render();
        
        // 完成チェック
        if (this.isSolved()) {
            this.onSolved();
        }
    }
    
    async animateRotation(face, isPrime) {
        const steps = 10;
        const anglePerStep = (isPrime ? -90 : 90) / steps;
        
        for (let i = 0; i < steps; i++) {
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed / steps));
            // ここで実際のアニメーションを描画（簡略化）
            this.render();
        }
    }
    
    performRotation(face, isPrime = false) {
        const temp = [...this.faces[face]];
        
        if (isPrime) {
            // 反時計回り
            this.faces[face] = [
                temp[2], temp[5], temp[8],
                temp[1], temp[4], temp[7],
                temp[0], temp[3], temp[6]
            ];
        } else {
            // 時計回り
            this.faces[face] = [
                temp[6], temp[3], temp[0],
                temp[7], temp[4], temp[1],
                temp[8], temp[5], temp[2]
            ];
        }
        
        // 隣接する面の更新
        this.updateAdjacentFaces(face, isPrime);
    }
    
    updateAdjacentFaces(face, isPrime) {
        // 各面の回転に伴う隣接面の更新ロジック
        const moves = {
            'U': () => {
                const temp = [this.faces.F[0], this.faces.F[1], this.faces.F[2]];
                if (!isPrime) {
                    this.faces.F[0] = this.faces.R[0];
                    this.faces.F[1] = this.faces.R[1];
                    this.faces.F[2] = this.faces.R[2];
                    this.faces.R[0] = this.faces.B[8];
                    this.faces.R[1] = this.faces.B[7];
                    this.faces.R[2] = this.faces.B[6];
                    this.faces.B[8] = this.faces.L[0];
                    this.faces.B[7] = this.faces.L[1];
                    this.faces.B[6] = this.faces.L[2];
                    this.faces.L[0] = temp[0];
                    this.faces.L[1] = temp[1];
                    this.faces.L[2] = temp[2];
                } else {
                    this.faces.F[0] = this.faces.L[0];
                    this.faces.F[1] = this.faces.L[1];
                    this.faces.F[2] = this.faces.L[2];
                    this.faces.L[0] = this.faces.B[8];
                    this.faces.L[1] = this.faces.B[7];
                    this.faces.L[2] = this.faces.B[6];
                    this.faces.B[8] = this.faces.R[0];
                    this.faces.B[7] = this.faces.R[1];
                    this.faces.B[6] = this.faces.R[2];
                    this.faces.R[0] = temp[0];
                    this.faces.R[1] = temp[1];
                    this.faces.R[2] = temp[2];
                }
            },
            'F': () => {
                const temp = [this.faces.U[6], this.faces.U[7], this.faces.U[8]];
                if (!isPrime) {
                    this.faces.U[6] = this.faces.L[8];
                    this.faces.U[7] = this.faces.L[5];
                    this.faces.U[8] = this.faces.L[2];
                    this.faces.L[2] = this.faces.D[0];
                    this.faces.L[5] = this.faces.D[1];
                    this.faces.L[8] = this.faces.D[2];
                    this.faces.D[0] = this.faces.R[6];
                    this.faces.D[1] = this.faces.R[3];
                    this.faces.D[2] = this.faces.R[0];
                    this.faces.R[0] = temp[0];
                    this.faces.R[3] = temp[1];
                    this.faces.R[6] = temp[2];
                } else {
                    this.faces.U[6] = this.faces.R[0];
                    this.faces.U[7] = this.faces.R[3];
                    this.faces.U[8] = this.faces.R[6];
                    this.faces.R[0] = this.faces.D[2];
                    this.faces.R[3] = this.faces.D[1];
                    this.faces.R[6] = this.faces.D[0];
                    this.faces.D[0] = this.faces.L[2];
                    this.faces.D[1] = this.faces.L[5];
                    this.faces.D[2] = this.faces.L[8];
                    this.faces.L[2] = temp[2];
                    this.faces.L[5] = temp[1];
                    this.faces.L[8] = temp[0];
                }
            },
            'R': () => {
                const temp = [this.faces.F[2], this.faces.F[5], this.faces.F[8]];
                if (!isPrime) {
                    this.faces.F[2] = this.faces.D[2];
                    this.faces.F[5] = this.faces.D[5];
                    this.faces.F[8] = this.faces.D[8];
                    this.faces.D[2] = this.faces.B[6];
                    this.faces.D[5] = this.faces.B[3];
                    this.faces.D[8] = this.faces.B[0];
                    this.faces.B[0] = this.faces.U[8];
                    this.faces.B[3] = this.faces.U[5];
                    this.faces.B[6] = this.faces.U[2];
                    this.faces.U[2] = temp[0];
                    this.faces.U[5] = temp[1];
                    this.faces.U[8] = temp[2];
                } else {
                    this.faces.F[2] = this.faces.U[2];
                    this.faces.F[5] = this.faces.U[5];
                    this.faces.F[8] = this.faces.U[8];
                    this.faces.U[2] = this.faces.B[6];
                    this.faces.U[5] = this.faces.B[3];
                    this.faces.U[8] = this.faces.B[0];
                    this.faces.B[0] = this.faces.D[8];
                    this.faces.B[3] = this.faces.D[5];
                    this.faces.B[6] = this.faces.D[2];
                    this.faces.D[2] = temp[0];
                    this.faces.D[5] = temp[1];
                    this.faces.D[8] = temp[2];
                }
            }
        };
        
        if (moves[face]) {
            moves[face]();
        }
    }
    
    shuffle() {
        if (this.isAnimating || this.isSolving) return;
        
        const moves = ['U', 'D', 'F', 'B', 'R', 'L'];
        const shuffleMoves = this.stageInfo[this.currentStage - 1].shuffleMoves;
        
        this.reset();
        
        // ランダムな動きを生成
        const sequence = [];
        for (let i = 0; i < shuffleMoves; i++) {
            const move = moves[Math.floor(Math.random() * moves.length)];
            const isPrime = Math.random() < 0.5;
            sequence.push({ face: move, isPrime });
        }
        
        // シャッフル実行
        sequence.forEach(({ face, isPrime }) => {
            this.performRotation(face, isPrime);
        });
        
        this.moveCount = 0;
        this.updateStats();
        this.render();
    }
    
    async solve() {
        if (this.isAnimating || this.isSolving || this.isSolved()) return;
        
        this.isSolving = true;
        document.getElementById('solvingIndicator').style.display = 'block';
        
        // 簡易的な解法アルゴリズム（実際のキューブ解法は複雑なので簡略化）
        const solution = this.findSolution();
        
        // 解法を実行
        for (const move of solution) {
            await this.rotateFace(move.face, move.isPrime);
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }
        
        document.getElementById('solvingIndicator').style.display = 'none';
        this.isSolving = false;
    }
    
    findSolution() {
        // 簡易的な解法生成（ランダムな動きで探索）
        const moves = ['U', 'F', 'R', 'D', 'B', 'L'];
        const solution = [];
        const maxMoves = 20;
        
        // ここでは簡略化のため、ランダムな動きを返す
        for (let i = 0; i < maxMoves; i++) {
            if (Math.random() < 0.3) {
                solution.push({
                    face: moves[Math.floor(Math.random() * moves.length)],
                    isPrime: Math.random() < 0.5
                });
            }
        }
        
        return solution;
    }
    
    reset() {
        if (this.isAnimating || this.isSolving) return;
        
        this.faces = {
            U: Array(9).fill('white'),
            D: Array(9).fill('yellow'),
            F: Array(9).fill('green'),
            B: Array(9).fill('blue'),
            R: Array(9).fill('red'),
            L: Array(9).fill('orange')
        };
        
        this.moveCount = 0;
        this.updateStats();
        this.render();
    }
    
    isSolved() {
        return Object.values(this.faces).every(face => 
            face.every(color => color === face[0])
        );
    }
    
    onSolved() {
        document.getElementById('cubeStatus').textContent = '完成！';
        document.getElementById('cubeStatus').style.color = '#00FF00';
        
        // 最小手数の更新
        const bestMoves = localStorage.getItem(`rubiks_stage_${this.currentStage}_best`);
        if (!bestMoves || this.moveCount < parseInt(bestMoves)) {
            localStorage.setItem(`rubiks_stage_${this.currentStage}_best`, this.moveCount);
            document.getElementById('bestMoves').textContent = this.moveCount;
        }
        
        // 祝福アニメーション
        this.celebrateCompletion();
    }
    
    celebrateCompletion() {
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: Object.values(this.colors)[Math.floor(Math.random() * 6)],
                life: 100
            });
        }
        
        const animate = () => {
            this.render();
            
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.life--;
                
                if (p.life > 0) {
                    this.ctx.fillStyle = p.color;
                    this.ctx.globalAlpha = p.life / 100;
                    this.ctx.fillRect(p.x, p.y, 5, 5);
                }
            });
            
            this.ctx.globalAlpha = 1;
            
            if (particles.some(p => p.life > 0)) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    changeStage(direction) {
        this.currentStage = Math.max(1, Math.min(10, this.currentStage + direction));
        document.getElementById('stageDisplay').textContent = `ステージ ${this.currentStage}`;
        document.getElementById('stageInfo').textContent = this.stageInfo[this.currentStage - 1].name;
        
        // 最高記録を表示
        const bestMoves = localStorage.getItem(`rubiks_stage_${this.currentStage}_best`);
        document.getElementById('bestMoves').textContent = bestMoves || '-';
        
        this.reset();
    }
    
    updateStats() {
        document.getElementById('moveCount').textContent = this.moveCount;
        document.getElementById('cubeStatus').textContent = this.isSolved() ? '完成！' : '未完成';
        document.getElementById('cubeStatus').style.color = this.isSolved() ? '#00FF00' : '#FFF';
    }
    
    createBackgroundAnimation() {
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
        const bgCtx = bgCanvas.getContext('2d');
        
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * bgCanvas.width,
                y: Math.random() * bgCanvas.height,
                size: Math.random() * 3,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5
            });
        }
        
        const animateBg = () => {
            bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                
                if (p.x < 0) p.x = bgCanvas.width;
                if (p.x > bgCanvas.width) p.x = 0;
                if (p.y < 0) p.y = bgCanvas.height;
                if (p.y > bgCanvas.height) p.y = 0;
                
                bgCtx.fillStyle = 'rgba(255,255,255,0.5)';
                bgCtx.beginPath();
                bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                bgCtx.fill();
            });
            
            document.getElementById('bgAnimation').style.backgroundImage = `url(${bgCanvas.toDataURL()})`;
            requestAnimationFrame(animateBg);
        };
        
        animateBg();
    }
}

// グローバル関数
let cube;

function rotateFace(face, isPrime = false) {
    cube.rotateFace(face, isPrime);
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cubeCanvas');
    cube = new RubiksCube(canvas);
    
    // レスポンシブ対応
    function resizeCanvas() {
        const container = document.querySelector('.cube-container');
        const size = Math.min(container.offsetWidth - 40, 500);
        canvas.width = size;
        canvas.height = size;
        cube.render();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
});