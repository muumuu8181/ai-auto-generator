class PaintSystem {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        this.setupCanvas();
        this.setupVariables();
        this.setupEventListeners();
        this.addLayer('Background');
    }

    setupCanvas() {
        const container = document.querySelector('.canvas-container');
        const rect = container.getBoundingClientRect();
        const canvasSize = Math.min(rect.width - 40, rect.height - 40, 800);
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.previewCanvas.width = canvasSize;
        this.previewCanvas.height = canvasSize;
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupVariables() {
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.currentOpacity = 1;
        this.currentShape = 'round';
        this.startX = 0;
        this.startY = 0;
        
        this.history = [];
        this.historyStep = -1;
        this.maxHistory = 50;
        
        this.layers = [];
        this.activeLayer = 0;
        
        this.saveState();
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });
        
        // Brush shapes
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentShape = btn.dataset.shape;
            });
        });
        
        // Color controls
        const colorPicker = document.getElementById('color-picker');
        colorPicker.addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });
        
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentColor = btn.style.backgroundColor;
                colorPicker.value = this.rgbToHex(this.currentColor);
            });
        });
        
        // Brush size
        const brushSize = document.getElementById('brush-size');
        const sizeDisplay = document.getElementById('size-display');
        brushSize.addEventListener('input', (e) => {
            this.currentSize = e.target.value;
            sizeDisplay.textContent = `${e.target.value}px`;
        });
        
        // Opacity
        const opacity = document.getElementById('opacity');
        const opacityDisplay = document.getElementById('opacity-display');
        opacity.addEventListener('input', (e) => {
            this.currentOpacity = e.target.value / 100;
            opacityDisplay.textContent = `${e.target.value}%`;
        });
        
        // Control buttons
        document.getElementById('clear-btn').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('undo-btn').addEventListener('click', this.undo.bind(this));
        document.getElementById('redo-btn').addEventListener('click', this.redo.bind(this));
        document.getElementById('save-btn').addEventListener('click', this.saveToLocalStorage.bind(this));
        document.getElementById('download-btn').addEventListener('click', this.download.bind(this));
        document.getElementById('upload-btn').addEventListener('change', this.upload.bind(this));
        
        // Layer controls
        document.getElementById('add-layer').addEventListener('click', () => {
            this.addLayer(`Layer ${this.layers.length + 1}`);
        });
        
        // Keyboard shortcuts
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
                        this.saveToLocalStorage();
                        break;
                }
            }
        });
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.globalAlpha = this.currentOpacity;
        
        switch(this.currentTool) {
            case 'brush':
                this.drawBrush(x, y);
                break;
            case 'eraser':
                this.erase(x, y);
                break;
            case 'line':
            case 'rectangle':
            case 'circle':
                this.drawShape(x, y);
                break;
        }
    }

    drawBrush(x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.currentShape === 'round') {
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else {
            this.drawCustomShape(x, y);
        }
    }

    drawCustomShape(x, y) {
        this.ctx.save();
        this.ctx.fillStyle = this.currentColor;
        
        switch(this.currentShape) {
            case 'square':
                this.ctx.fillRect(x - this.currentSize/2, y - this.currentSize/2, this.currentSize, this.currentSize);
                break;
            case 'star':
                this.drawStar(x, y, this.currentSize/2);
                break;
            case 'heart':
                this.drawHeart(x, y, this.currentSize/2);
                break;
        }
        
        this.ctx.restore();
    }

    drawStar(cx, cy, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = cx + Math.cos(angle - Math.PI/2) * radius;
            const y = cy + Math.sin(angle - Math.PI/2) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawHeart(x, y, size) {
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        this.ctx.moveTo(x, y + topCurveHeight);
        
        // Top left curve
        this.ctx.bezierCurveTo(
            x, y, 
            x - size / 2, y, 
            x - size / 2, y + topCurveHeight
        );
        
        // Bottom left curve
        this.ctx.bezierCurveTo(
            x - size / 2, y + (size + topCurveHeight) / 2, 
            x, y + (size + topCurveHeight) / 2, 
            x, y + size
        );
        
        // Bottom right curve
        this.ctx.bezierCurveTo(
            x, y + (size + topCurveHeight) / 2, 
            x + size / 2, y + (size + topCurveHeight) / 2, 
            x + size / 2, y + topCurveHeight
        );
        
        // Top right curve
        this.ctx.bezierCurveTo(
            x + size / 2, y, 
            x, y, 
            x, y + topCurveHeight
        );
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    erase(x, y) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.currentSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawShape(x, y) {
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.previewCtx.globalAlpha = this.currentOpacity;
        this.previewCtx.strokeStyle = this.currentColor;
        this.previewCtx.lineWidth = this.currentSize;
        
        switch(this.currentTool) {
            case 'line':
                this.previewCtx.beginPath();
                this.previewCtx.moveTo(this.startX, this.startY);
                this.previewCtx.lineTo(x, y);
                this.previewCtx.stroke();
                break;
            case 'rectangle':
                this.previewCtx.strokeRect(
                    this.startX,
                    this.startY,
                    x - this.startX,
                    y - this.startY
                );
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
                this.previewCtx.beginPath();
                this.previewCtx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                this.previewCtx.stroke();
                break;
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        if (this.currentTool === 'line' || this.currentTool === 'rectangle' || this.currentTool === 'circle') {
            this.ctx.drawImage(this.previewCanvas, 0, 0);
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
        
        this.isDrawing = false;
        this.ctx.beginPath();
        this.saveState();
    }

    clearCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
        this.updateHistory('Clear Canvas');
    }

    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        
        this.history.push(this.canvas.toDataURL());
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyStep--;
        }
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
            this.updateHistory('Undo');
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
            this.updateHistory('Redo');
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

    saveToLocalStorage() {
        const dataURL = this.canvas.toDataURL();
        localStorage.setItem('paintSystemImage', dataURL);
        localStorage.setItem('paintSystemDate', new Date().toISOString());
        this.showNotification('画像を保存しました');
        this.updateHistory('Save to Storage');
    }

    download() {
        const link = document.createElement('a');
        link.download = `paint-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        this.updateHistory('Download');
    }

    upload(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
                this.updateHistory('Upload Image');
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    addLayer(name) {
        const layer = {
            name: name,
            canvas: document.createElement('canvas'),
            visible: true
        };
        
        layer.canvas.width = this.canvas.width;
        layer.canvas.height = this.canvas.height;
        
        this.layers.push(layer);
        this.updateLayersList();
    }

    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        layersList.innerHTML = '';
        
        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (index === this.activeLayer) {
                layerItem.classList.add('active');
            }
            
            layerItem.innerHTML = `
                <span>${layer.name}</span>
                <button onclick="paintSystem.toggleLayerVisibility(${index})">👁️</button>
            `;
            
            layerItem.addEventListener('click', () => {
                this.activeLayer = index;
                this.updateLayersList();
            });
            
            layersList.appendChild(layerItem);
        });
    }

    toggleLayerVisibility(index) {
        this.layers[index].visible = !this.layers[index].visible;
        this.updateLayersList();
    }

    updateHistory(action) {
        const historyList = document.getElementById('history-list');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = `${new Date().toLocaleTimeString()} - ${action}`;
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        if (historyList.children.length > 20) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ecdc4;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    rgbToHex(rgb) {
        const result = rgb.match(/\d+/g);
        if (!result) return '#000000';
        
        const hex = result.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        });
        
        return '#' + hex.join('');
    }
}

// Initialize paint system when DOM is loaded
let paintSystem;
document.addEventListener('DOMContentLoaded', () => {
    paintSystem = new PaintSystem();
    
    // Load saved image if exists
    const savedImage = localStorage.getItem('paintSystemImage');
    if (savedImage) {
        const img = new Image();
        img.onload = () => {
            paintSystem.ctx.drawImage(img, 0, 0);
        };
        img.src = savedImage;
    }
});