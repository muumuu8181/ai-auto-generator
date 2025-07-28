// 音波ビジュアライザーエディター実装
class AudioVisualizer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.bufferLength = null;
        this.isRecording = false;
        this.animationId = null;
        this.currentMode = 'waveform';
        this.filter = null;
        this.particles = [];
        
        // キャンバス要素
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.particleCanvas = document.getElementById('particleCanvas');
        
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        // 設定値
        this.sensitivity = 50;
        this.colorMix = 70;
        this.particleDensity = 30;
        this.freqRange = 20000;
        this.currentFilter = 'none';
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.createParticles();
        this.hidePermissionNotice();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const container = document.querySelector('.canvas-container');
            const rect = container.getBoundingClientRect();
            
            [this.waveformCanvas, this.spectrumCanvas, this.particleCanvas].forEach(canvas => {
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
                
                const ctx = canvas.getContext('2d');
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            });
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupEventListeners() {
        // スライダーイベント
        document.getElementById('sensitivitySlider').addEventListener('input', (e) => {
            this.sensitivity = parseInt(e.target.value);
            document.getElementById('sensitivityValue').textContent = this.sensitivity;
        });
        
        document.getElementById('colorMixSlider').addEventListener('input', (e) => {
            this.colorMix = parseInt(e.target.value);
            document.getElementById('colorMixValue').textContent = this.colorMix;
        });
        
        document.getElementById('particleDensitySlider').addEventListener('input', (e) => {
            this.particleDensity = parseInt(e.target.value);
            document.getElementById('particleDensityValue').textContent = this.particleDensity;
            this.createParticles();
        });
        
        document.getElementById('freqRangeSlider').addEventListener('input', (e) => {
            this.freqRange = parseInt(e.target.value);
            document.getElementById('freqRangeValue').textContent = this.freqRange;
        });
    }
    
    async requestMicPermission() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            // FFT設定
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.3;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            this.microphone.connect(this.analyser);
            
            this.hidePermissionNotice();
            this.updateStatus('マイク接続完了', 'stopped');
            
            document.getElementById('startBtn').disabled = false;
            
        } catch (error) {
            console.error('マイクアクセスエラー:', error);
            alert('マイクアクセスが拒否されました。ブラウザの設定を確認してください。');
        }
    }
    
    hidePermissionNotice() {
        document.getElementById('permissionNotice').classList.add('hidden');
    }
    
    startRecording() {
        if (!this.audioContext) {
            this.requestMicPermission();
            return;
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isRecording = true;
        this.updateStatus('🔴 録音中', 'recording');
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        
        this.animate();
    }
    
    stopRecording() {
        this.isRecording = false;
        this.updateStatus('⏹ 停止', 'stopped');
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // キャンバスをクリア
        this.clearCanvas();
    }
    
    updateStatus(text, type) {
        const indicator = document.getElementById('statusIndicator');
        indicator.textContent = text;
        indicator.className = `status-indicator status-${type}`;
    }
    
    animate() {
        if (!this.isRecording) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        this.clearCanvas();
        
        switch (this.currentMode) {
            case 'waveform':
                this.drawWaveform();
                break;
            case 'spectrum':
                this.drawSpectrum();
                break;
            case 'both':
                this.drawWaveform();
                this.drawSpectrum();
                break;
        }
        
        this.updateParticles();
        this.drawParticles();
        this.updateFrequencyDisplay();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    clearCanvas() {
        const width = this.waveformCanvas.width / window.devicePixelRatio;
        const height = this.waveformCanvas.height / window.devicePixelRatio;
        
        this.waveformCtx.clearRect(0, 0, width, height);
        this.spectrumCtx.clearRect(0, 0, width, height);
        this.particleCtx.clearRect(0, 0, width, height);
    }
    
    drawWaveform() {
        const width = this.waveformCanvas.width / window.devicePixelRatio;
        const height = this.waveformCanvas.height / window.devicePixelRatio;
        
        // 波形データの取得
        const timeDataArray = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(timeDataArray);
        
        this.waveformCtx.lineWidth = 2;
        this.waveformCtx.strokeStyle = `rgba(0, 255, 136, ${this.colorMix / 100})`;
        this.waveformCtx.beginPath();
        
        const sliceWidth = width / timeDataArray.length;
        let x = 0;
        
        for (let i = 0; i < timeDataArray.length; i++) {
            const v = (timeDataArray[i] / 128.0) * (this.sensitivity / 50);
            const y = v * height / 2;
            
            if (i === 0) {
                this.waveformCtx.moveTo(x, y);
            } else {
                this.waveformCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.waveformCtx.stroke();
        
        // 中央線の描画
        this.waveformCtx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        this.waveformCtx.lineWidth = 1;
        this.waveformCtx.beginPath();
        this.waveformCtx.moveTo(0, height / 2);
        this.waveformCtx.lineTo(width, height / 2);
        this.waveformCtx.stroke();
    }
    
    drawSpectrum() {
        const width = this.spectrumCanvas.width / window.devicePixelRatio;
        const height = this.spectrumCanvas.height / window.devicePixelRatio;
        
        const barWidth = width / this.bufferLength * 2;
        let x = 0;
        
        // スペクトラム解析範囲の制限
        const maxFreqIndex = Math.floor(this.bufferLength * (this.freqRange / 22050));
        
        for (let i = 0; i < maxFreqIndex; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * (this.sensitivity / 50);
            
            // 周波数に基づく色の計算
            const hue = (i / maxFreqIndex) * 240; // 0-240度（青から赤）
            const saturation = 80 + (this.colorMix / 100) * 20;
            const lightness = 50 + (this.dataArray[i] / 255) * 30;
            
            this.spectrumCtx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            this.spectrumCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            // グロー効果
            this.spectrumCtx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`;
            this.spectrumCtx.fillRect(x - 1, height - barHeight - 2, barWidth + 2, barHeight + 4);
            
            x += barWidth + 1;
        }
        
        // 周波数グリッドの描画
        this.drawFrequencyGrid();
    }
    
    drawFrequencyGrid() {
        const width = this.spectrumCanvas.width / window.devicePixelRatio;
        const height = this.spectrumCanvas.height / window.devicePixelRatio;
        
        this.spectrumCtx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        this.spectrumCtx.lineWidth = 1;
        this.spectrumCtx.font = '10px monospace';
        this.spectrumCtx.fillStyle = 'rgba(0, 255, 136, 0.7)';
        
        // 主要な周波数にグリッドを描画
        const frequencies = [100, 1000, 5000, 10000, 15000, 20000];
        frequencies.forEach(freq => {
            if (freq <= this.freqRange) {
                const x = (freq / this.freqRange) * width;
                
                this.spectrumCtx.beginPath();
                this.spectrumCtx.moveTo(x, 0);
                this.spectrumCtx.lineTo(x, height);
                this.spectrumCtx.stroke();
                
                this.spectrumCtx.fillText(`${freq}Hz`, x + 2, 15);
            }
        });
    }
    
    createParticles() {
        this.particles = [];
        const numParticles = Math.floor(this.particleDensity * 2);
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: Math.random() * (this.particleCanvas.width / window.devicePixelRatio),
                y: Math.random() * (this.particleCanvas.height / window.devicePixelRatio),
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.3,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }
    }
    
    updateParticles() {
        if (!this.dataArray) return;
        
        const avgFreq = this.dataArray.reduce((sum, val) => sum + val, 0) / this.dataArray.length;
        const intensity = (avgFreq / 255) * (this.sensitivity / 50);
        
        this.particles.forEach(particle => {
            // 音の強度に応じて粒子の動きを制御
            particle.vx += (Math.random() - 0.5) * intensity * 0.1;
            particle.vy += (Math.random() - 0.5) * intensity * 0.1;
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 境界での反射
            const width = this.particleCanvas.width / window.devicePixelRatio;
            const height = this.particleCanvas.height / window.devicePixelRatio;
            
            if (particle.x < 0 || particle.x > width) particle.vx *= -0.8;
            if (particle.y < 0 || particle.y > height) particle.vy *= -0.8;
            
            particle.x = Math.max(0, Math.min(width, particle.x));
            particle.y = Math.max(0, Math.min(height, particle.y));
            
            // サイズと透明度の音響連動
            particle.size = (Math.random() * 2 + 1) * (1 + intensity);
            particle.opacity = (0.3 + intensity * 0.7) * (this.particleDensity / 100);
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.particleCtx.globalAlpha = particle.opacity;
            this.particleCtx.fillStyle = particle.color;
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.particleCtx.fill();
            
            // グロー効果
            this.particleCtx.shadowBlur = 10;
            this.particleCtx.shadowColor = particle.color;
            this.particleCtx.fill();
            this.particleCtx.shadowBlur = 0;
        });
        
        this.particleCtx.globalAlpha = 1;
    }
    
    updateFrequencyDisplay() {
        if (!this.dataArray) return;
        
        // 主要な周波数帯域での解析
        const bands = [
            { name: 'Sub Bass', range: [20, 60] },
            { name: 'Bass', range: [60, 250] },
            { name: 'Low Mid', range: [250, 500] },
            { name: 'Mid', range: [500, 2000] },
            { name: 'High Mid', range: [2000, 4000] },
            { name: 'Presence', range: [4000, 6000] },
            { name: 'Brilliance', range: [6000, 20000] }
        ];
        
        let displayText = '=== 周波数解析 ===\\n';
        
        bands.forEach(band => {
            const startIndex = Math.floor(band.range[0] * this.bufferLength / (this.audioContext.sampleRate / 2));
            const endIndex = Math.floor(band.range[1] * this.bufferLength / (this.audioContext.sampleRate / 2));
            
            let sum = 0;
            for (let i = startIndex; i < endIndex && i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            
            const avg = sum / (endIndex - startIndex);
            const db = 20 * Math.log10(avg / 255 + 0.001);
            const bars = '█'.repeat(Math.max(0, Math.floor((avg / 255) * 10)));
            
            displayText += `${band.name.padEnd(10)}: ${bars.padEnd(10)} ${db.toFixed(1)}dB\\n`;
        });
        
        // ピーク周波数の検出
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        
        const peakFreq = (maxIndex * this.audioContext.sampleRate) / (2 * this.bufferLength);
        displayText += `\\nピーク周波数: ${peakFreq.toFixed(1)}Hz`;
        displayText += `\\n信号強度: ${((maxValue / 255) * 100).toFixed(1)}%`;
        
        document.getElementById('frequencyDisplay').textContent = displayText;
    }
    
    applyFilter(type) {
        if (!this.audioContext) return;
        
        // 既存フィルターの削除
        if (this.filter) {
            this.microphone.disconnect(this.filter);
            this.filter.disconnect(this.analyser);
        }
        
        this.currentFilter = type;
        
        if (type === 'none') {
            this.microphone.connect(this.analyser);
            return;
        }
        
        // 新しいフィルターの作成
        this.filter = this.audioContext.createBiquadFilter();
        
        switch (type) {
            case 'lowpass':
                this.filter.type = 'lowpass';
                this.filter.frequency.value = 5000;
                break;
            case 'highpass':
                this.filter.type = 'highpass';
                this.filter.frequency.value = 200;
                break;
            case 'bandpass':
                this.filter.type = 'bandpass';
                this.filter.frequency.value = 1000;
                this.filter.Q.value = 5;
                break;
        }
        
        // フィルターチェーンの再接続
        this.microphone.connect(this.filter);
        this.filter.connect(this.analyser);
    }
    
    exportImage() {
        // 全キャンバスを合成して画像として出力
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const width = this.waveformCanvas.width / window.devicePixelRatio;
        const height = this.waveformCanvas.height / window.devicePixelRatio;
        
        canvas.width = width;
        canvas.height = height;
        
        // 背景を黒で塗りつぶし
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // 各キャンバスを合成
        ctx.drawImage(this.spectrumCanvas, 0, 0, width, height);
        ctx.drawImage(this.waveformCanvas, 0, 0, width, height);
        ctx.drawImage(this.particleCanvas, 0, 0, width, height);
        
        // ダウンロード
        const link = document.createElement('a');
        link.download = `audio-visualizer-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
}

// グローバル関数
let visualizer;

function requestMicPermission() {
    visualizer.requestMicPermission();
}

function startRecording() {
    visualizer.startRecording();
}

function stopRecording() {
    visualizer.stopRecording();
}

function setMode(mode) {
    visualizer.currentMode = mode;
    
    // タブの表示更新
    document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // キャンバスの表示/非表示
    const waveformCanvas = document.getElementById('waveformCanvas');
    const spectrumCanvas = document.getElementById('spectrumCanvas');
    
    switch (mode) {
        case 'waveform':
            waveformCanvas.style.opacity = '1';
            spectrumCanvas.style.opacity = '0';
            break;
        case 'spectrum':
            waveformCanvas.style.opacity = '0';
            spectrumCanvas.style.opacity = '1';
            break;
        case 'both':
            waveformCanvas.style.opacity = '0.7';
            spectrumCanvas.style.opacity = '0.7';
            break;
    }
}

function applyFilter(type) {
    visualizer.applyFilter(type);
    
    // ボタンの状態更新
    document.querySelectorAll('.button-group button').forEach(btn => {
        btn.style.background = '';
    });
    event.target.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e8e)';
}

function exportImage() {
    visualizer.exportImage();
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    visualizer = new AudioVisualizer();
});