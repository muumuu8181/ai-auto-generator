// グローバル変数
let canvas, ctx;
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let currentSize = 5;
let currentShape = 'round';
let history = [];
let historyStep = -1;
let savedImages = [];
let showGrid = false;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initTools();
    initControls();
    loadSavedImages();
});

// キャンバス初期化
function initCanvas() {
    canvas = document.getElementById('paint-canvas');
    ctx = canvas.getContext('2d');
    
    // キャンバスサイズ設定
    canvas.width = 800;
    canvas.height = 600;
    
    // 白背景で初期化
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
    
    // イベントリスナー
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // タッチイベント対応
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // マウス位置表示
    canvas.addEventListener('mousemove', updateMousePosition);
}

// ツール初期化
function initTools() {
    // ツールボタン
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });
    
    // カラーピッカー
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
    });
    
    // プリセットカラー
    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            currentColor = btn.style.backgroundColor;
            colorPicker.value = rgbToHex(currentColor);
        });
    });
    
    // ブラシサイズ
    const brushSize = document.getElementById('brush-size');
    const sizeDisplay = document.getElementById('size-display');
    brushSize.addEventListener('input', (e) => {
        currentSize = e.target.value;
        sizeDisplay.textContent = `${currentSize}px`;
    });
    
    // ブラシ形状
    const brushShape = document.getElementById('brush-shape');
    brushShape.addEventListener('change', (e) => {
        currentShape = e.target.value;
    });
}

// コントロール初期化
function initControls() {
    // クリア
    document.getElementById('clear-canvas').addEventListener('click', () => {
        if (confirm('キャンバスをクリアしますか？')) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveState();
        }
    });
    
    // 元に戻す
    document.getElementById('undo').addEventListener('click', undo);
    
    // やり直し
    document.getElementById('redo').addEventListener('click', redo);
    
    // 保存
    document.getElementById('save-image').addEventListener('click', saveImage);
    
    // ダウンロード
    document.getElementById('download-image').addEventListener('click', downloadImage);
    
    // アップロード
    document.getElementById('upload-image').addEventListener('change', uploadImage);
    
    // 塗りつぶし
    document.getElementById('fill-bucket').addEventListener('click', () => {
        currentTool = 'fill';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    });
    
    // グリッド
    document.getElementById('grid-toggle').addEventListener('click', toggleGrid);
    
    // 全画面
    document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);
}

// 描画開始
function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (currentTool === 'fill') {
        fillArea(x, y);
        isDrawing = false;
    }
}

// 描画
function draw(e) {
    if (!isDrawing || currentTool === 'fill') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = currentSize;
    ctx.lineCap = currentShape === 'square' ? 'square' : 'round';
    
    if (currentTool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        
        if (currentShape === 'spray') {
            drawSpray(x, y);
        } else if (currentShape === 'pattern') {
            drawPattern(x, y);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    } else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'shape') {
        // 図形描画（簡易版）
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHistory();
        ctx.strokeStyle = currentColor;
        ctx.strokeRect(x - 50, y - 50, 100, 100);
    }
}

// 描画終了
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState();
    }
}

// タッチイベント処理
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

// スプレー効果
function drawSpray(x, y) {
    const density = 50;
    for (let i = 0; i < density; i++) {
        const offsetX = (Math.random() - 0.5) * currentSize;
        const offsetY = (Math.random() - 0.5) * currentSize;
        ctx.fillStyle = currentColor;
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
}

// パターン描画
function drawPattern(x, y) {
    const pattern = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
    ];
    const size = currentSize / 3;
    
    for (let i = 0; i < pattern.length; i++) {
        for (let j = 0; j < pattern[i].length; j++) {
            if (pattern[i][j]) {
                ctx.fillStyle = currentColor;
                ctx.fillRect(x + (j - 1) * size, y + (i - 1) * size, size, size);
            }
        }
    }
}

// 塗りつぶし（簡易版）
function fillArea(x, y) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const targetColor = getPixelColor(imageData, x, y);
    const fillColor = hexToRgb(currentColor);
    
    if (colorsMatch(targetColor, fillColor)) return;
    
    // フラッドフィル（簡易実装）
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
}

// 状態保存
function saveState() {
    historyStep++;
    if (historyStep < history.length) {
        history.length = historyStep;
    }
    history.push(canvas.toDataURL());
}

// 元に戻す
function undo() {
    if (historyStep > 0) {
        historyStep--;
        restoreState();
    }
}

// やり直し
function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        restoreState();
    }
}

// 状態復元
function restoreState() {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = history[historyStep];
}

// 履歴描画
function drawHistory() {
    if (historyStep >= 0) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        img.src = history[historyStep];
    }
}

// 画像保存
function saveImage() {
    const imageData = canvas.toDataURL();
    const id = Date.now();
    savedImages.push({ id, data: imageData });
    localStorage.setItem('paintApp-savedImages', JSON.stringify(savedImages));
    displaySavedImages();
    
    // アニメーション
    canvas.classList.add('saving');
    setTimeout(() => canvas.classList.remove('saving'), 500);
}

// 画像ダウンロード
function downloadImage() {
    const link = document.createElement('a');
    link.download = `paint-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// 画像アップロード
function uploadImage(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            saveState();
        };
        img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
}

// 保存済み画像読み込み
function loadSavedImages() {
    const saved = localStorage.getItem('paintApp-savedImages');
    if (saved) {
        savedImages = JSON.parse(saved);
        displaySavedImages();
    }
}

// 保存済み画像表示
function displaySavedImages() {
    const container = document.getElementById('saved-images');
    container.innerHTML = '';
    
    savedImages.forEach(image => {
        const div = document.createElement('div');
        div.className = 'saved-image';
        div.innerHTML = `
            <img src="${image.data}" alt="Saved image">
            <button class="delete-btn" onclick="deleteImage(${image.id})">×</button>
        `;
        div.querySelector('img').addEventListener('click', () => loadImageToCanvas(image.data));
        container.appendChild(div);
    });
}

// 画像削除
function deleteImage(id) {
    savedImages = savedImages.filter(img => img.id !== id);
    localStorage.setItem('paintApp-savedImages', JSON.stringify(savedImages));
    displaySavedImages();
}

// キャンバスに画像読み込み
function loadImageToCanvas(imageData) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        saveState();
    };
    img.src = imageData;
}

// グリッド切り替え
function toggleGrid() {
    showGrid = !showGrid;
    if (showGrid) {
        drawGrid();
    } else {
        restoreState();
    }
}

// グリッド描画
function drawGrid() {
    const gridSize = 20;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 全画面切り替え
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// マウス位置更新
function updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    document.getElementById('mouse-position').textContent = `X: ${x}, Y: ${y}`;
}

// ユーティリティ関数
function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    return '#' + result.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getPixelColor(imageData, x, y) {
    const index = (y * imageData.width + x) * 4;
    return {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2]
    };
}

function colorsMatch(color1, color2) {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
}