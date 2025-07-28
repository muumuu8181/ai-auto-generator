// キャンバス設定
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズ設定（固定サイズ）
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// モバイル対応のサイズ調整
function adjustCanvasSize() {
    const container = document.querySelector('.canvas-container');
    const maxWidth = container.clientWidth - 40;
    
    if (maxWidth < CANVAS_WIDTH) {
        const scale = maxWidth / CANVAS_WIDTH;
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = (CANVAS_HEIGHT * scale) + 'px';
    } else {
        canvas.style.width = CANVAS_WIDTH + 'px';
        canvas.style.height = CANVAS_HEIGHT + 'px';
    }
}

// 描画状態
let isDrawing = false;
let currentColor = '#FF5733';
let currentBrushSize = 5;
let lastX = 0;
let lastY = 0;

// 初期設定
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.globalCompositeOperation = 'source-over';

// カラー選択
const colorButtons = document.querySelectorAll('.color-btn');
colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // アクティブクラスを移動
        colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentColor = btn.dataset.color;
        updateBrushPreview();
    });
});

// ブラシサイズ調整
const brushSizeSlider = document.getElementById('brushSize');
const brushDisplay = document.getElementById('brushDisplay');

brushSizeSlider.addEventListener('input', (e) => {
    currentBrushSize = e.target.value;
    brushDisplay.textContent = currentBrushSize + 'px';
    updateBrushPreview();
});

// ブラシプレビュー
let brushPreview = null;

function createBrushPreview() {
    if (!brushPreview) {
        brushPreview = document.createElement('div');
        brushPreview.className = 'brush-preview';
        document.body.appendChild(brushPreview);
    }
}

function updateBrushPreview() {
    if (brushPreview) {
        brushPreview.style.width = currentBrushSize + 'px';
        brushPreview.style.height = currentBrushSize + 'px';
        brushPreview.style.backgroundColor = currentColor;
    }
}

// マウス/タッチイベントの座標取得
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// 描画関数
function draw(e) {
    if (!isDrawing) return;
    
    const pos = getEventPos(e);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentBrushSize;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    [lastX, lastY] = [pos.x, pos.y];
}

// マウスイベント
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const pos = getEventPos(e);
    [lastX, lastY] = [pos.x, pos.y];
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// タッチイベント
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const pos = getEventPos(e);
    [lastX, lastY] = [pos.x, pos.y];
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDrawing = false;
});

// ブラシプレビューの表示/非表示
canvas.addEventListener('mouseenter', () => {
    createBrushPreview();
    updateBrushPreview();
    brushPreview.style.display = 'block';
});

canvas.addEventListener('mouseleave', () => {
    if (brushPreview) {
        brushPreview.style.display = 'none';
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (brushPreview) {
        brushPreview.style.left = (e.clientX - currentBrushSize/2) + 'px';
        brushPreview.style.top = (e.clientY - currentBrushSize/2) + 'px';
    }
});

// 全消去機能
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('描画を全て消去しますか？')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // クリアアニメーション
        canvas.style.transform = 'scale(0.95)';
        setTimeout(() => {
            canvas.style.transform = 'scale(1)';
        }, 150);
    }
});

// 保存機能
document.getElementById('saveBtn').addEventListener('click', () => {
    try {
        // キャンバスを画像として保存
        const link = document.createElement('a');
        link.download = `drawing_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.png`;
        link.href = canvas.toDataURL();
        
        // 保存アニメーション
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '💾 保存中...';
        saveBtn.disabled = true;
        
        setTimeout(() => {
            link.click();
            saveBtn.textContent = '✅ 保存完了!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 1000);
        }, 500);
        
    } catch (error) {
        alert('保存に失敗しました。ブラウザの設定を確認してください。');
    }
});

// 初期化
window.addEventListener('load', () => {
    adjustCanvasSize();
    
    // キャンバスを白で初期化
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ウェルカムメッセージ
    ctx.fillStyle = '#ddd';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ここに描画できます', canvas.width/2, canvas.height/2);
    ctx.fillStyle = '#bbb';
    ctx.font = '16px Arial';
    ctx.fillText('ドラッグまたはタッチして描画開始', canvas.width/2, canvas.height/2 + 30);
});

window.addEventListener('resize', adjustCanvasSize);

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                document.getElementById('saveBtn').click();
                break;
            case 'z':
                e.preventDefault();
                // Ctrl+Z で全消去（簡易的な実装）
                if (confirm('描画を全て消去しますか？（Ctrl+Z）')) {
                    document.getElementById('clearBtn').click();
                }
                break;
        }
    }
    
    // 数字キーでブラシサイズ変更
    if (e.key >= '1' && e.key <= '9') {
        const size = parseInt(e.key) * 2;
        if (size <= 20) {
            brushSizeSlider.value = size;
            brushSizeSlider.dispatchEvent(new Event('input'));
        }
    }
});