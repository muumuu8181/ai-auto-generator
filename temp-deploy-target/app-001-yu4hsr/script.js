// Canvas and Context Setup
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;
previewCanvas.width = canvas.width;
previewCanvas.height = canvas.height;

// Drawing State
let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 5;
let globalOpacity = 1;
let brushShape = 'round';
let startX, startY;

// History for undo/redo
let history = [];
let historyStep = -1;

// Layers
let layers = [{
    id: 0,
    canvas: document.createElement('canvas'),
    visible: true,
    opacity: 1
}];
let activeLayer = 0;

// Initialize first layer
layers[0].canvas.width = canvas.width;
layers[0].canvas.height = canvas.height;

// Save initial state
saveHistory();

// Tool Selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentTool = btn.getAttribute('data-tool');
        updateCursor();
    });
});

// Brush Settings
document.getElementById('brush-size').addEventListener('input', (e) => {
    brushSize = e.target.value;
    document.getElementById('brush-size-value').textContent = brushSize;
    updateCursor();
});

document.getElementById('opacity').addEventListener('input', (e) => {
    globalOpacity = e.target.value / 100;
    document.getElementById('opacity-value').textContent = e.target.value;
});

// Color Picker
document.getElementById('color-picker').addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// Color Presets
document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
        currentColor = btn.getAttribute('data-color');
        document.getElementById('color-picker').value = currentColor;
    });
});

// Brush Shapes
document.querySelectorAll('.brush-shape').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.brush-shape.active').classList.remove('active');
        btn.classList.add('active');
        brushShape = btn.getAttribute('data-shape');
    });
});

// Canvas Events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDrawing);

// Mouse position tracking
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    document.getElementById('cursor-position').textContent = `X: ${x}, Y: ${y}`;
});

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    
    if (currentTool === 'brush' || currentTool === 'eraser') {
        drawPoint(startX, startY);
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const layerCtx = layers[activeLayer].canvas.getContext('2d');
    
    switch (currentTool) {
        case 'brush':
            drawLine(layerCtx, startX, startY, x, y);
            startX = x;
            startY = y;
            break;
            
        case 'eraser':
            layerCtx.globalCompositeOperation = 'destination-out';
            drawLine(layerCtx, startX, startY, x, y);
            layerCtx.globalCompositeOperation = 'source-over';
            startX = x;
            startY = y;
            break;
            
        case 'line':
        case 'rectangle':
        case 'circle':
            // Clear preview
            previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            drawShape(previewCtx, startX, startY, x, y);
            break;
    }
    
    renderCanvas();
}

function stopDrawing(e) {
    if (!isDrawing) return;
    
    if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const layerCtx = layers[activeLayer].canvas.getContext('2d');
        drawShape(layerCtx, startX, startY, x, y);
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    
    isDrawing = false;
    saveHistory();
    renderCanvas();
}

function drawPoint(x, y) {
    const layerCtx = layers[activeLayer].canvas.getContext('2d');
    layerCtx.globalAlpha = globalOpacity;
    layerCtx.fillStyle = currentColor;
    layerCtx.beginPath();
    
    switch (brushShape) {
        case 'round':
            layerCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            layerCtx.fill();
            break;
        case 'square':
            layerCtx.fillRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
            break;
        case 'star':
            drawStar(layerCtx, x, y, brushSize / 2);
            break;
        case 'heart':
            drawHeart(layerCtx, x, y, brushSize / 2);
            break;
    }
    
    layerCtx.globalAlpha = 1;
}

function drawLine(context, x1, y1, x2, y2) {
    context.globalAlpha = globalOpacity;
    context.strokeStyle = currentColor;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    
    context.globalAlpha = 1;
}

function drawShape(context, x1, y1, x2, y2) {
    context.globalAlpha = globalOpacity;
    context.strokeStyle = currentColor;
    context.lineWidth = brushSize;
    
    switch (currentTool) {
        case 'line':
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
            break;
            
        case 'rectangle':
            context.strokeRect(x1, y1, x2 - x1, y2 - y1);
            break;
            
        case 'circle':
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            context.beginPath();
            context.arc(x1, y1, radius, 0, Math.PI * 2);
            context.stroke();
            break;
    }
    
    context.globalAlpha = 1;
}

function drawStar(context, cx, cy, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;
    
    context.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        i === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
}

function drawHeart(context, cx, cy, size) {
    context.beginPath();
    context.moveTo(cx, cy + size / 4);
    context.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + size / 4);
    context.bezierCurveTo(cx - size / 2, cy + size / 2, cx, cy + size * 3/4, cx, cy + size);
    context.bezierCurveTo(cx, cy + size * 3/4, cx + size / 2, cy + size / 2, cx + size / 2, cy + size / 4);
    context.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + size / 4);
    context.fill();
}

// Touch Events
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// Render all layers
function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    layers.forEach(layer => {
        if (layer.visible) {
            ctx.globalAlpha = layer.opacity;
            ctx.drawImage(layer.canvas, 0, 0);
        }
    });
    
    ctx.globalAlpha = 1;
}

// History Management
function saveHistory() {
    historyStep++;
    if (historyStep < history.length) {
        history.length = historyStep;
    }
    
    // Clone all layers
    const layerData = layers.map(layer => {
        const data = layer.canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        return {
            id: layer.id,
            data: data,
            visible: layer.visible,
            opacity: layer.opacity
        };
    });
    
    history.push({
        layers: layerData,
        activeLayer: activeLayer
    });
    
    // Limit history size
    if (history.length > 50) {
        history.shift();
        historyStep--;
    }
}

function restoreHistory(step) {
    if (step < 0 || step >= history.length) return;
    
    const state = history[step];
    layers = state.layers.map(layerData => {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        canvas.getContext('2d').putImageData(layerData.data, 0, 0);
        
        return {
            id: layerData.id,
            canvas: canvas,
            visible: layerData.visible,
            opacity: layerData.opacity
        };
    });
    
    activeLayer = state.activeLayer;
    updateLayersList();
    renderCanvas();
}

// Actions
document.getElementById('undo').addEventListener('click', () => {
    if (historyStep > 0) {
        historyStep--;
        restoreHistory(historyStep);
    }
});

document.getElementById('redo').addEventListener('click', () => {
    if (historyStep < history.length - 1) {
        historyStep++;
        restoreHistory(historyStep);
    }
});

document.getElementById('clear').addEventListener('click', () => {
    if (confirm('キャンバスをクリアしますか？')) {
        const layerCtx = layers[activeLayer].canvas.getContext('2d');
        layerCtx.clearRect(0, 0, canvas.width, canvas.height);
        saveHistory();
        renderCanvas();
    }
});

// New Canvas
document.getElementById('new-canvas').addEventListener('click', () => {
    if (confirm('新しいキャンバスを作成しますか？現在の作業は失われます。')) {
        layers = [{
            id: 0,
            canvas: document.createElement('canvas'),
            visible: true,
            opacity: 1
        }];
        layers[0].canvas.width = canvas.width;
        layers[0].canvas.height = canvas.height;
        activeLayer = 0;
        history = [];
        historyStep = -1;
        saveHistory();
        updateLayersList();
        renderCanvas();
    }
});

// Save and Download
document.getElementById('save-image').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `paint_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById('download-image').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `paint_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
});

// Upload Image
document.getElementById('upload-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const layerCtx = layers[activeLayer].canvas.getContext('2d');
            layerCtx.drawImage(img, 0, 0);
            saveHistory();
            renderCanvas();
        };
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
});

// Cursor
function updateCursor() {
    if (currentTool === 'brush' || currentTool === 'eraser') {
        const cursorSize = brushSize * 2;
        const cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = cursorSize;
        cursorCanvas.height = cursorSize;
        const cursorCtx = cursorCanvas.getContext('2d');
        
        cursorCtx.strokeStyle = currentTool === 'eraser' ? '#ff0000' : '#000000';
        cursorCtx.lineWidth = 2;
        cursorCtx.beginPath();
        cursorCtx.arc(cursorSize / 2, cursorSize / 2, brushSize, 0, Math.PI * 2);
        cursorCtx.stroke();
        
        canvas.style.cursor = `url(${cursorCanvas.toDataURL()}) ${cursorSize / 2} ${cursorSize / 2}, crosshair`;
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

// Layer Management
function updateLayersList() {
    const layersList = document.getElementById('layers-list');
    layersList.innerHTML = '';
    
    layers.forEach((layer, index) => {
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item' + (index === activeLayer ? ' active' : '');
        layerItem.setAttribute('data-layer-id', index);
        
        layerItem.innerHTML = `
            <input type="checkbox" ${layer.visible ? 'checked' : ''}>
            <span>レイヤー ${index + 1}</span>
            <input type="range" min="0" max="100" value="${layer.opacity * 100}" class="layer-opacity">
        `;
        
        layerItem.addEventListener('click', () => selectLayer(index));
        layersList.appendChild(layerItem);
    });
}

function selectLayer(index) {
    activeLayer = index;
    updateLayersList();
}

// Initialize
updateCursor();
renderCanvas();