// ペイントシステムのメインクラス
class PaintSystem {
    constructor() {
        this.canvas = document.getElementById('paint-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.brushSize = 10;
        this.opacity = 100;
        this.drawingMode = 'pen';
        this.brushType = 'round';
        this.history = [];
        this.historyStep = -1;
        this.recentColors = [];
        this.layers = [{ id: 0, visible: true, opacity: 100, data: null }];
        this.currentLayer = 0;
        this.customBrushPattern = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.updateColorDisplay();
        this.saveState();
    }

    setupCanvas() {
        // キャンバスサイズ設定
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 背景を白に
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // アンチエイリアス設定
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        document.getElementById('canvas-size').textContent = `${this.canvas.width} x ${this.canvas.height}`;
    }

    setupEventListeners() {
        // キャンバスイベント
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // タッチイベント
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // ツールイベント
        document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = e.target.value;
            document.getElementById('size-value').textContent = e.target.value;
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            this.opacity = e.target.value;
            document.getElementById('opacity-value').textContent = e.target.value;
        });

        document.getElementById('color-picker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.updateColorDisplay();
            this.addRecentColor(this.currentColor);
        });

        // ブラシタイプ
        document.querySelectorAll('.brush-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.brush-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushType = btn.dataset.brush;
                
                if (this.brushType === 'custom') {
                    this.showCustomBrushModal();
                }
            });
        });

        // カラーパレット
        document.querySelectorAll('.palette-color').forEach(color => {
            color.addEventListener('click', () => {
                this.currentColor = color.dataset.color;
                document.getElementById('color-picker').value = this.currentColor;
                this.updateColorDisplay();
                this.addRecentColor(this.currentColor);
            });
        });

        // 描画モード
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.drawingMode = btn.dataset.mode;
                this.updateCursor();
            });
        });

        // アクションボタン
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('redo').addEventListener('click', () => this.redo());
        document.getElementById('clear').addEventListener('click', () => this.clearCanvas());
        document.getElementById('new-canvas').addEventListener('click', () => this.newCanvas());
        document.getElementById('save-image').addEventListener('click', () => this.saveImage());
        document.getElementById('download-image').addEventListener('click', () => this.downloadImage());
        document.getElementById('upload-image').addEventListener('change', (e) => this.uploadImage(e));

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveImage();
                        break;
                }
            }
        });

        // カスタムブラシモーダル
        this.setupCustomBrushModal();
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;

        if (this.drawingMode === 'fill') {
            this.fillArea(this.lastX, this.lastY);
            this.saveState();
        }
    }

    draw(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // マウス位置更新
        document.getElementById('mouse-position').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;

        if (!this.isDrawing) return;

        this.ctx.globalAlpha = this.opacity / 100;

        switch(this.drawingMode) {
            case 'pen':
                this.drawLine(this.lastX, this.lastY, x, y);
                break;
            case 'eraser':
                this.erase(this.lastX, this.lastY, x, y);
                break;
            case 'line':
                this.redrawCanvas();
                this.drawStraightLine(this.lastX, this.lastY, x, y);
                return;
            case 'rectangle':
                this.redrawCanvas();
                this.drawRectangle(this.lastX, this.lastY, x, y);
                return;
            case 'circle':
                this.redrawCanvas();
                this.drawCircle(this.lastX, this.lastY, x, y);
                return;
        }

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    drawLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.brushType === 'round') {
            this.ctx.stroke();
        } else if (this.brushType === 'square') {
            const size = this.brushSize;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.fillRect(x2 - size/2, y2 - size/2, size, size);
        } else if (this.brushType === 'star') {
            this.drawStar(x2, y2, this.brushSize);
        } else if (this.brushType === 'custom' && this.customBrushPattern) {
            this.drawCustomBrush(x2, y2);
        }
    }

    drawStar(cx, cy, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        this.ctx.fillStyle = this.currentColor;
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCustomBrush(x, y) {
        if (!this.customBrushPattern) return;
        
        const size = this.brushSize;
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(
            this.customBrushPattern,
            x - size/2,
            y - size/2,
            size,
            size
        );
        this.ctx.restore();
    }

    erase(x1, y1, x2, y2) {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawStraightLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    drawRectangle(x1, y1, x2, y2) {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    drawCircle(x1, y1, x2, y2) {
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.stroke();
    }

    fillArea(x, y) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const targetColor = this.getPixelColor(imageData, x, y);
        const fillColor = this.hexToRgb(this.currentColor);
        
        if (this.colorsMatch(targetColor, fillColor)) return;
        
        const pixels = imageData.data;
        const stack = [[x, y]];
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const index = (cy * this.canvas.width + cx) * 4;
            
            if (cx < 0 || cx >= this.canvas.width || cy < 0 || cy >= this.canvas.height) continue;
            
            const currentColor = {
                r: pixels[index],
                g: pixels[index + 1],
                b: pixels[index + 2],
                a: pixels[index + 3]
            };
            
            if (this.colorsMatch(currentColor, targetColor)) {
                pixels[index] = fillColor.r;
                pixels[index + 1] = fillColor.g;
                pixels[index + 2] = fillColor.b;
                pixels[index + 3] = 255 * (this.opacity / 100);
                
                stack.push([cx + 1, cy]);
                stack.push([cx - 1, cy]);
                stack.push([cx, cy + 1]);
                stack.push([cx, cy - 1]);
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    getPixelColor(imageData, x, y) {
        const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    colorsMatch(c1, c2) {
        return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
    }

    updateColorDisplay() {
        document.getElementById('color-display').style.backgroundColor = this.currentColor;
    }

    addRecentColor(color) {
        if (!this.recentColors.includes(color)) {
            this.recentColors.unshift(color);
            if (this.recentColors.length > 10) {
                this.recentColors.pop();
            }
            this.updateRecentColors();
        }
    }

    updateRecentColors() {
        const container = document.getElementById('recent-colors-list');
        container.innerHTML = '';
        
        this.recentColors.forEach(color => {
            const div = document.createElement('div');
            div.className = 'recent-color';
            div.style.backgroundColor = color;
            div.addEventListener('click', () => {
                this.currentColor = color;
                document.getElementById('color-picker').value = color;
                this.updateColorDisplay();
            });
            container.appendChild(div);
        });
    }

    updateCursor() {
        switch(this.drawingMode) {
            case 'pen':
            case 'line':
            case 'rectangle':
            case 'circle':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                this.canvas.style.cursor = 'grab';
                break;
            case 'fill':
                this.canvas.style.cursor = 'cell';
                break;
        }
    }

    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        this.history.push(this.canvas.toDataURL());
        
        if (this.history.length > 50) {
            this.history.shift();
            this.historyStep--;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
        }
    }

    restoreState() {
        const img = new Image();
        img.src = this.history[this.historyStep];
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
    }

    redrawCanvas() {
        if (this.historyStep >= 0) {
            const img = new Image();
            img.src = this.history[this.historyStep];
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
        }
    }

    clearCanvas() {
        if (confirm('キャンバスをクリアしますか？')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
        }
    }

    newCanvas() {
        if (confirm('新規キャンバスを作成しますか？現在の作業は失われます。')) {
            this.history = [];
            this.historyStep = -1;
            this.clearCanvas();
        }
    }

    saveImage() {
        const imageData = this.canvas.toDataURL('image/png');
        localStorage.setItem('paintSystemImage', imageData);
        localStorage.setItem('paintSystemDate', new Date().toISOString());
        alert('画像を保存しました');
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = `paint_${new Date().getTime()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    uploadImage(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                         e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    setupCustomBrushModal() {
        const modal = document.getElementById('custom-brush-modal');
        const canvas = document.getElementById('custom-brush-canvas');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        // 初期化
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ctx.beginPath();
            ctx.moveTo(x, y);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        document.getElementById('clear-custom-brush').addEventListener('click', () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });

        document.getElementById('apply-custom-brush').addEventListener('click', () => {
            this.customBrushPattern = canvas;
            modal.style.display = 'none';
        });

        document.getElementById('cancel-custom-brush').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    showCustomBrushModal() {
        document.getElementById('custom-brush-modal').style.display = 'block';
    }
}

// アプリケーション初期化
const paintSystem = new PaintSystem();