// フラクタル生成アートツール実装
class FractalGenerator {
    constructor() {
        this.canvas = document.getElementById('fractalCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // フラクタルパラメータ
        this.fractalType = 'mandelbrot';
        this.maxIterations = 100;
        this.zoom = 1.0;
        this.centerX = 0;
        this.centerY = 0;
        this.colorPalette = 'rainbow';
        this.colorShift = 0;
        this.colorIntensity = 1.0;
        
        // ジュリア集合パラメータ
        this.juliaCReal = -0.4;
        this.juliaCImag = 0.6;
        
        // アニメーション
        this.isAnimating = false;
        this.animationId = null;
        this.animationStep = 0;
        
        // イベント処理
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // ワーカー処理用
        this.worker = null;
        this.isCalculating = false;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupWorker();
        this.render();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const container = document.querySelector('.canvas-container');
            const rect = container.getBoundingClientRect();
            
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.render();
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // タッチイベント
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onMouseUp());
        
        // スライダーイベント
        this.setupSliders();
    }
    
    setupSliders() {
        const sliders = [
            { id: 'iterationsSlider', valueId: 'iterationsValue', property: 'maxIterations' },
            { id: 'zoomSlider', valueId: 'zoomValue', property: 'zoom' },
            { id: 'juliaCRealSlider', valueId: 'juliaCRealValue', property: 'juliaCReal' },
            { id: 'juliaCImagSlider', valueId: 'juliaCImagValue', property: 'juliaCImag' },
            { id: 'colorShiftSlider', valueId: 'colorShiftValue', property: 'colorShift' },
            { id: 'colorIntensitySlider', valueId: 'colorIntensityValue', property: 'colorIntensity' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            if (element) {
                element.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this[slider.property] = value;
                    document.getElementById(slider.valueId).textContent = 
                        slider.property === 'zoom' ? value.toFixed(1) + 'x' : 
                        (typeof value === 'number' && value % 1 !== 0) ? value.toFixed(2) : value;
                    
                    this.render();
                });
            }
        });
    }
    
    setupWorker() {
        // Web Workerを使用して計算を別スレッドで実行
        const workerCode = `
            self.onmessage = function(e) {
                const { width, height, params } = e.data;
                const imageData = new ImageData(width, height);
                const data = imageData.data;
                
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const [r, g, b] = calculatePixel(x, y, width, height, params);
                        const index = (y * width + x) * 4;
                        data[index] = r;
                        data[index + 1] = g;
                        data[index + 2] = b;
                        data[index + 3] = 255;
                    }
                    
                    // 進捗報告
                    if (y % 10 === 0) {
                        self.postMessage({ type: 'progress', progress: y / height });
                    }
                }
                
                self.postMessage({ type: 'complete', imageData });
            };
            
            function calculatePixel(x, y, width, height, params) {
                const { fractalType, maxIterations, zoom, centerX, centerY, 
                        juliaCReal, juliaCImag, colorPalette, colorShift, colorIntensity } = params;
                
                // 画面座標を複素平面座標に変換
                const scale = 4 / zoom;
                const real = (x - width / 2) * scale / width + centerX;
                const imag = (y - height / 2) * scale / height + centerY;
                
                let iterations;
                if (fractalType === 'mandelbrot') {
                    iterations = mandelbrot(real, imag, maxIterations);
                } else {
                    iterations = julia(real, imag, juliaCReal, juliaCImag, maxIterations);
                }
                
                return getColor(iterations, maxIterations, colorPalette, colorShift, colorIntensity);
            }
            
            function mandelbrot(cReal, cImag, maxIterations) {
                let zReal = 0;
                let zImag = 0;
                let iterations = 0;
                
                while (zReal * zReal + zImag * zImag <= 4 && iterations < maxIterations) {
                    const tempReal = zReal * zReal - zImag * zImag + cReal;
                    zImag = 2 * zReal * zImag + cImag;
                    zReal = tempReal;
                    iterations++;
                }
                
                return iterations;
            }
            
            function julia(zReal, zImag, cReal, cImag, maxIterations) {
                let iterations = 0;
                
                while (zReal * zReal + zImag * zImag <= 4 && iterations < maxIterations) {
                    const tempReal = zReal * zReal - zImag * zImag + cReal;
                    zImag = 2 * zReal * zImag + cImag;
                    zReal = tempReal;
                    iterations++;
                }
                
                return iterations;
            }
            
            function getColor(iterations, maxIterations, palette, shift, intensity) {
                if (iterations === maxIterations) {
                    return [0, 0, 0]; // 集合内部は黒
                }
                
                const t = (iterations / maxIterations) * intensity;
                const hue = (t * 360 + shift) % 360;
                
                switch (palette) {
                    case 'rainbow':
                        return hslToRgb(hue, 100, 50 + t * 30);
                    case 'fire':
                        return t < 0.5 
                            ? [Math.floor(t * 512), 0, 0]
                            : [255, Math.floor((t - 0.5) * 512), Math.floor((t - 0.5) * 512)];
                    case 'ocean':
                        return hslToRgb(200 + t * 60, 80, 30 + t * 40);
                    case 'sunset':
                        return hslToRgb(30 - t * 30, 90, 40 + t * 30);
                    case 'emerald':
                        return hslToRgb(120, 80, t * 70);
                    case 'purple':
                        return hslToRgb(280, 80, t * 70);
                    case 'gold':
                        return hslToRgb(45, 90, t * 70);
                    case 'grayscale':
                        const gray = Math.floor(t * 255);
                        return [gray, gray, gray];
                    default:
                        return [255, 255, 255];
                }
            }
            
            function hslToRgb(h, s, l) {
                h /= 360;
                s /= 100;
                l /= 100;
                
                const a = s * Math.min(l, 1 - l);
                const f = n => {
                    const k = (n + h * 12) % 12;
                    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                };
                
                return [
                    Math.floor(f(0) * 255),
                    Math.floor(f(8) * 255),
                    Math.floor(f(4) * 255)
                ];
            }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        
        this.worker.onmessage = (e) => {
            const { type, imageData, progress } = e.data;
            
            if (type === 'progress') {
                // 進捗表示の更新（オプション）
            } else if (type === 'complete') {
                this.ctx.putImageData(imageData, 0, 0);
                this.hideLoading();
                this.isCalculating = false;
                this.updateInfo();
            }
        };
    }
    
    render() {
        if (this.isCalculating) return;
        
        this.isCalculating = true;
        this.showLoading();
        
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        const params = {
            fractalType: this.fractalType,
            maxIterations: this.maxIterations,
            zoom: this.zoom,
            centerX: this.centerX,
            centerY: this.centerY,
            juliaCReal: this.juliaCReal,
            juliaCImag: this.juliaCImag,
            colorPalette: this.colorPalette,
            colorShift: this.colorShift,
            colorIntensity: this.colorIntensity
        };
        
        this.worker.postMessage({ width, height, params });
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging) {
            const deltaX = x - this.lastX;
            const deltaY = y - this.lastY;
            
            const scale = 4 / this.zoom;
            this.centerX -= deltaX * scale / this.canvas.width;
            this.centerY -= deltaY * scale / this.canvas.height;
            
            this.lastX = x;
            this.lastY = y;
            
            this.render();
        }
        
        this.updateCoordinates(x, y);
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.lastX = touch.clientX - rect.left;
        this.lastY = touch.clientY - rect.top;
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;
        
        const scale = 4 / this.zoom;
        this.centerX -= deltaX * scale / this.canvas.width;
        this.centerY -= deltaY * scale / this.canvas.height;
        
        this.lastX = x;
        this.lastY = y;
        
        this.render();
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // マウス位置を中心にズーム
        const scale = 4 / this.zoom;
        const mouseReal = (x - this.canvas.width / window.devicePixelRatio / 2) * scale / this.canvas.width + this.centerX;
        const mouseImag = (y - this.canvas.height / window.devicePixelRatio / 2) * scale / this.canvas.height + this.centerY;
        
        const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(10000, this.zoom));
        
        // ズーム中心を調整
        const newScale = 4 / this.zoom;
        this.centerX = mouseReal - (x - this.canvas.width / window.devicePixelRatio / 2) * newScale / this.canvas.width;
        this.centerY = mouseImag - (y - this.canvas.height / window.devicePixelRatio / 2) * newScale / this.canvas.height;
        
        document.getElementById('zoomSlider').value = this.zoom;
        document.getElementById('zoomValue').textContent = this.zoom.toFixed(1) + 'x';
        
        this.updateZoomInfo();
        this.render();
    }
    
    updateCoordinates(x, y) {
        const scale = 4 / this.zoom;
        const real = (x - this.canvas.width / window.devicePixelRatio / 2) * scale / this.canvas.width + this.centerX;
        const imag = (y - this.canvas.height / window.devicePixelRatio / 2) * scale / this.canvas.height + this.centerY;
        
        document.getElementById('coordsInfo').textContent = 
            `座標: (${real.toFixed(6)}, ${imag.toFixed(6)})`;
    }
    
    updateZoomInfo() {
        document.getElementById('zoomInfo').textContent = `ズーム: ${this.zoom.toFixed(1)}x`;
    }
    
    updateInfo() {
        const info = `
フラクタルタイプ: ${this.fractalType === 'mandelbrot' ? 'マンデルブロ集合' : 'ジュリア集合'}
最大反復回数: ${this.maxIterations}
ズーム倍率: ${this.zoom.toFixed(2)}x
中心座標: (${this.centerX.toFixed(6)}, ${this.centerY.toFixed(6)})
${this.fractalType === 'julia' ? `ジュリア定数: (${this.juliaCReal.toFixed(3)}, ${this.juliaCImag.toFixed(3)})` : ''}
カラーパレット: ${this.colorPalette}
色相シフト: ${this.colorShift}°
`;
        document.getElementById('infoDisplay').textContent = info;
    }
    
    setFractalType(type) {
        this.fractalType = type;
        
        // ボタンの状態更新
        document.getElementById('mandelbrotBtn').classList.toggle('active', type === 'mandelbrot');
        document.getElementById('juliaBtn').classList.toggle('active', type === 'julia');
        
        // ジュリア集合用コントロールの表示/非表示
        const juliaControls = document.querySelectorAll('[id^="juliaControls"]');
        juliaControls.forEach(control => {
            control.style.display = type === 'julia' ? 'block' : 'none';
        });
        
        this.render();
    }
    
    selectColorPalette(palette) {
        this.colorPalette = palette;
        
        // パレット選択の状態更新
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.render();
    }
    
    loadPreset(presetName) {
        const presets = {
            classic: {
                fractalType: 'mandelbrot',
                zoom: 1,
                centerX: -0.5,
                centerY: 0,
                maxIterations: 100
            },
            seahorse: {
                fractalType: 'mandelbrot',
                zoom: 100,
                centerX: -0.74529,
                centerY: 0.11307,
                maxIterations: 150
            },
            spiral: {
                fractalType: 'mandelbrot',
                zoom: 500,
                centerX: -0.8,
                centerY: 0.156,
                maxIterations: 200
            },
            lightning: {
                fractalType: 'mandelbrot',
                zoom: 1000,
                centerX: -1.25066,
                centerY: 0.02012,
                maxIterations: 250
            },
            phoenix: {
                fractalType: 'julia',
                zoom: 1,
                centerX: 0,
                centerY: 0,
                juliaCReal: -0.7269,
                juliaCImag: 0.1889,
                maxIterations: 150
            },
            dragon: {
                fractalType: 'julia',
                zoom: 1,
                centerX: 0,
                centerY: 0,
                juliaCReal: -0.8,
                juliaCImag: 0.156,
                maxIterations: 200
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            Object.assign(this, preset);
            this.updateUIFromState();
            this.render();
        }
    }
    
    updateUIFromState() {
        document.getElementById('iterationsSlider').value = this.maxIterations;
        document.getElementById('iterationsValue').textContent = this.maxIterations;
        
        document.getElementById('zoomSlider').value = this.zoom;
        document.getElementById('zoomValue').textContent = this.zoom.toFixed(1) + 'x';
        
        if (this.fractalType === 'julia') {
            document.getElementById('juliaCRealSlider').value = this.juliaCReal;
            document.getElementById('juliaCRealValue').textContent = this.juliaCReal.toFixed(2);
            
            document.getElementById('juliaCImagSlider').value = this.juliaCImag;
            document.getElementById('juliaCImagValue').textContent = this.juliaCImag.toFixed(2);
        }
        
        this.setFractalType(this.fractalType);
    }
    
    resetView() {
        this.zoom = 1;
        this.centerX = this.fractalType === 'mandelbrot' ? -0.5 : 0;
        this.centerY = 0;
        this.maxIterations = 100;
        this.colorShift = 0;
        this.colorIntensity = 1.0;
        
        this.updateUIFromState();
        this.render();
    }
    
    startAnimation() {
        const btn = document.getElementById('animateBtn');
        
        if (this.isAnimating) {
            this.stopAnimation();
            btn.textContent = '🎬 アニメーション開始';
            return;
        }
        
        this.isAnimating = true;
        btn.textContent = '⏹ アニメーション停止';
        this.animationStep = 0;
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            this.animationStep += 0.02;
            
            if (this.fractalType === 'julia') {
                this.juliaCReal = Math.cos(this.animationStep) * 0.7;
                this.juliaCImag = Math.sin(this.animationStep * 1.3) * 0.7;
                
                document.getElementById('juliaCRealSlider').value = this.juliaCReal;
                document.getElementById('juliaCRealValue').textContent = this.juliaCReal.toFixed(3);
                
                document.getElementById('juliaCImagSlider').value = this.juliaCImag;
                document.getElementById('juliaCImagValue').textContent = this.juliaCImag.toFixed(3);
            } else {
                this.colorShift = (this.colorShift + 2) % 360;
                document.getElementById('colorShiftSlider').value = this.colorShift;
                document.getElementById('colorShiftValue').textContent = this.colorShift;
            }
            
            this.render();
            this.animationId = setTimeout(animate, 100);
        };
        
        animate();
    }
    
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
    }
    
    exportImage() {
        // 高解像度でレンダリング
        const originalWidth = this.canvas.width;
        const originalHeight = this.canvas.height;
        
        // 4K解像度での出力
        this.canvas.width = 3840;
        this.canvas.height = 2160;
        this.ctx.scale(1, 1);
        
        // 高解像度でレンダリング
        this.render();
        
        // 元の解像度に戻してダウンロード
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `fractal-${this.fractalType}-${Date.now()}.png`;
            link.href = this.canvas.toDataURL();
            link.click();
            
            // 元の解像度に戻す
            this.canvas.width = originalWidth;
            this.canvas.height = originalHeight;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.render();
        }, 1000);
    }
}

// グローバル関数
let fractal;

function setFractalType(type) {
    fractal.setFractalType(type);
}

function selectColorPalette(palette) {
    fractal.selectColorPalette(palette);
}

function loadPreset(presetName) {
    fractal.loadPreset(presetName);
}

function resetView() {
    fractal.resetView();
}

function startAnimation() {
    fractal.startAnimation();
}

function exportImage() {
    fractal.exportImage();
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    fractal = new FractalGenerator();
});