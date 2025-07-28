// ペイントシステム - Canvas API実装
class PaintSystem {
    constructor() {
        this.canvas = document.getElementById('paintCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'round';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.opacity = 1;
        this.lastX = 0;
        this.lastY = 0;
        this.undoStack = [];
        this.redoStack = [];
        
        // デバイス対応設定
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupUI();
        this.saveState();
        
        console.log('🎨 ペイントシステム初期化完了');
    }

    setupCanvas() {
        //高DPI対応
        const rect = this.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * ratio;
        this.canvas.height = rect.height * ratio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(ratio, ratio);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        
        // 白背景で初期化
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // タッチイベント（モバイル対応）
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // マウス位置表示
        this.canvas.addEventListener('mousemove', this.updateMousePosition.bind(this));
        
        // UI要素のイベントリスナー
        document.getElementById('brushSize').addEventListener('input', this.updateBrushSize.bind(this));
        document.getElementById('opacity').addEventListener('input', this.updateOpacity.bind(this));
        document.getElementById('colorPicker').addEventListener('change', this.updateColor.bind(this));
        document.getElementById('brushType').addEventListener('change', this.updateBrushType.bind(this));
        
        // ボタンイベント
        document.getElementById('clearCanvas').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));
        document.getElementById('redoBtn').addEventListener('click', this.redo.bind(this));
        document.getElementById('uploadBtn').addEventListener('click', this.triggerUpload.bind(this));
        document.getElementById('imageUpload').addEventListener('change', this.handleImageUpload.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveToLocalStorage.bind(this));
        document.getElementById('downloadBtn').addEventListener('click', this.downloadImage.bind(this));
        
        // プリセットカラーイベント
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', this.selectPresetColor.bind(this));
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadImage();
                        break;
                }
            }
        });
    }

    setupUI() {
        // 初期値表示
        this.updateBrushSizeDisplay();
        this.updateOpacityDisplay();
        this.updateActiveColorSwatch();
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                         e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        if (e.type === 'touchstart') {
            this.startDrawing(mouseEvent);
        } else if (e.type === 'touchmove') {
            this.draw(mouseEvent);
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        
        // 一点だけのクリックでも描画
        this.drawPoint(this.lastX, this.lastY);
        
        // アニメーション効果
        this.canvas.classList.add('brush-animation');
        setTimeout(() => this.canvas.classList.remove('brush-animation'), 300);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = this.opacity;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        
        // ブラシタイプに応じた描画
        switch(this.currentTool) {
            case 'round':
                this.drawRoundBrush(currentX, currentY);
                break;
            case 'square':
                this.drawSquareBrush(currentX, currentY);
                break;
            case 'spray':
                this.drawSprayBrush(currentX, currentY);
                break;
            case 'texture':
                this.drawTextureBrush(currentX, currentY);
                break;
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
    }

    drawPoint(x, y) {
        this.ctx.globalAlpha = this.opacity;
        this.ctx.fillStyle = this.currentColor;
        
        switch(this.currentTool) {
            case 'round':
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'square':
                this.ctx.fillRect(x - this.brushSize / 2, y - this.brushSize / 2, this.brushSize, this.brushSize);
                break;
            case 'spray':
                this.drawSprayEffect(x, y, this.brushSize);
                break;
            case 'texture':
                this.drawTextureEffect(x, y, this.brushSize);
                break;
        }
    }

    drawRoundBrush(x, y) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawSquareBrush(x, y) {
        // 四角ブラシの実装
        const distance = Math.sqrt((x - this.lastX) ** 2 + (y - this.lastY) ** 2);
        const steps = Math.ceil(distance);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const brushX = this.lastX + (x - this.lastX) * t;
            const brushY = this.lastY + (y - this.lastY) * t;
            
            this.ctx.fillRect(
                brushX - this.brushSize / 2,
                brushY - this.brushSize / 2,
                this.brushSize,
                this.brushSize
            );
        }
    }

    drawSprayBrush(x, y) {
        const sprayRadius = this.brushSize;
        const density = Math.floor(this.brushSize * 2);
        
        for (let i = 0; i < density; i++) {
            const offsetX = (Math.random() - 0.5) * sprayRadius;
            const offsetY = (Math.random() - 0.5) * sprayRadius;
            
            if (offsetX * offsetX + offsetY * offsetY <= (sprayRadius / 2) ** 2) {
                this.ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
            }
        }
    }

    drawTextureBrush(x, y) {
        // テクスチャブラシ - ノイズ効果
        const distance = Math.sqrt((x - this.lastX) ** 2 + (y - this.lastY) ** 2);
        const steps = Math.ceil(distance * 2);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const brushX = this.lastX + (x - this.lastX) * t;
            const brushY = this.lastY + (y - this.lastY) * t;
            
            // ランダムなテクスチャ効果
            for (let j = 0; j < this.brushSize; j++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.brushSize / 2;
                const textureX = brushX + Math.cos(angle) * radius;
                const textureY = brushY + Math.sin(angle) * radius;
                
                this.ctx.globalAlpha = this.opacity * Math.random();
                this.ctx.fillRect(textureX, textureY, 1, 1);
            }
        }
        this.ctx.globalAlpha = this.opacity;
    }

    drawSprayEffect(x, y, size) {
        const particles = size * 3;
        for (let i = 0; i < particles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * size;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            this.ctx.globalAlpha = this.opacity * (1 - radius / size);
            this.ctx.fillRect(px, py, 1, 1);
        }
    }

    drawTextureEffect(x, y, size) {
        const imageData = this.ctx.getImageData(x - size, y - size, size * 2, size * 2);
        const data = imageData.data;
        
        // 簡単なノイズテクスチャ
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < 0.1) {
                const noise = Math.random() * 100;
                data[i] = Math.min(255, data[i] + noise);     // Red
                data[i + 1] = Math.min(255, data[i + 1] + noise); // Green  
                data[i + 2] = Math.min(255, data[i + 2] + noise); // Blue
            }
        }
        
        this.ctx.putImageData(imageData, x - size, y - size);
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        document.getElementById('mousePosition').textContent = `X: ${x}, Y: ${y}`;
    }

    updateBrushSize(e) {
        this.brushSize = e.target.value;
        this.updateBrushSizeDisplay();
    }

    updateBrushSizeDisplay() {
        document.getElementById('brushSizeValue').textContent = this.brushSize;
    }

    updateOpacity(e) {
        this.opacity = parseFloat(e.target.value);
        this.updateOpacityDisplay();
    }

    updateOpacityDisplay() {
        document.getElementById('opacityValue').textContent = Math.round(this.opacity * 100);
    }

    updateColor(e) {
        this.currentColor = e.target.value;
        this.updateActiveColorSwatch();
    }

    updateBrushType(e) {
        this.currentTool = e.target.value;
    }

    selectPresetColor(e) {
        const color = e.target.dataset.color;
        this.currentColor = color;
        document.getElementById('colorPicker').value = color;
        this.updateActiveColorSwatch();
    }

    updateActiveColorSwatch() {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.dataset.color === this.currentColor) {
                swatch.classList.add('active');
            }
        });
    }

    clearCanvas() {
        if (confirm('キャンバスをクリアしますか？この操作は取り消せません。')) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
            this.redoStack = [];
        }
    }

    saveState() {
        if (this.undoStack.length >= 50) {
            this.undoStack.shift();
        }
        this.undoStack.push(this.canvas.toDataURL());
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.restoreState(previousState);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.restoreState(nextState);
        }
    }

    restoreState(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    }

    triggerUpload() {
        document.getElementById('imageUpload').click();
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // 画像をキャンバスに描画
                    const scale = Math.min(
                        this.canvas.width / img.width,
                        this.canvas.height / img.height
                    );
                    const x = (this.canvas.width - img.width * scale) / 2;
                    const y = (this.canvas.height - img.height * scale) / 2;
                    
                    this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    this.saveState();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    saveToLocalStorage() {
        try {
            const dataURL = this.canvas.toDataURL();
            localStorage.setItem('paintCanvas', dataURL);
            alert('キャンバスがローカルストレージに保存されました！');
        } catch (error) {
            alert('保存に失敗しました: ' + error.message);
        }
    }

    downloadImage() {
        try {
            const link = document.createElement('a');
            link.download = `paint-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
            link.href = this.canvas.toDataURL();
            link.click();
        } catch (error) {
            alert('ダウンロードに失敗しました: ' + error.message);
        }
    }

    // ローカルストレージから復元
    loadFromLocalStorage() {
        const savedCanvas = localStorage.getItem('paintCanvas');
        if (savedCanvas) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                this.saveState();
            };
            img.src = savedCanvas;
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 ペイントシステム起動中...');
    
    const paintSystem = new PaintSystem();
    
    // ローカルストレージからの復元確認
    if (localStorage.getItem('paintCanvas')) {
        const restore = confirm('前回のキャンバスを復元しますか？');
        if (restore) {
            paintSystem.loadFromLocalStorage();
        }
    }
    
    console.log('✅ ペイントシステム起動完了');
    
    // パフォーマンス監視
    if ('performance' in window) {
        console.log(`⚡ ページ読み込み時間: ${Math.round(performance.now())}ms`);
    }
});

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    // リサイズ時の処理（必要に応じて実装）
    console.log('📱 ウィンドウサイズ変更検出');
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('🚨 JavaScript Error:', e.error);
    console.error('📍 Error Location:', e.filename, 'Line:', e.lineno);
});