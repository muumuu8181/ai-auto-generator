// ニューラルネットワーク簡易シミュレーター
class NeuralNetworkSimulator {
    constructor() {
        this.drawCanvas = document.getElementById('drawCanvas');
        this.drawCtx = this.drawCanvas.getContext('2d');
        this.networkCanvas = document.getElementById('networkCanvas');
        this.networkCtx = this.networkCanvas.getContext('2d');
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // 事前学習済みの重みとバイアス（簡略化されたモデル）
        this.model = this.initializeModel();
        
        this.init();
    }
    
    init() {
        // キャンバスのセットアップ
        this.setupCanvas();
        
        // イベントリスナー
        this.setupEventListeners();
        
        // ネットワーク可視化の初期化
        this.resizeNetworkCanvas();
        this.drawNetwork();
        
        // 予測バーの初期化
        this.initializePredictionBars();
    }
    
    setupCanvas() {
        // 描画キャンバスの設定
        this.drawCtx.fillStyle = '#000';
        this.drawCtx.fillRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        this.drawCtx.strokeStyle = '#fff';
        this.drawCtx.lineWidth = 15;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
    }
    
    setupEventListeners() {
        // マウスイベント
        this.drawCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.drawCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.drawCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.drawCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // タッチイベント
        this.drawCanvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        this.drawCanvas.addEventListener('touchmove', (e) => this.draw(e));
        this.drawCanvas.addEventListener('touchend', () => this.stopDrawing());
        
        // ボタンイベント
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('predictBtn').addEventListener('click', () => this.predict());
        
        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.resizeNetworkCanvas());
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.drawCanvas.getBoundingClientRect();
        
        if (e.touches) {
            this.lastX = e.touches[0].clientX - rect.left;
            this.lastY = e.touches[0].clientY - rect.top;
        } else {
            this.lastX = e.clientX - rect.left;
            this.lastY = e.clientY - rect.top;
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        e.preventDefault();
        const rect = this.drawCanvas.getBoundingClientRect();
        let currentX, currentY;
        
        if (e.touches) {
            currentX = e.touches[0].clientX - rect.left;
            currentY = e.touches[0].clientY - rect.top;
        } else {
            currentX = e.clientX - rect.left;
            currentY = e.clientY - rect.top;
        }
        
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(this.lastX, this.lastY);
        this.drawCtx.lineTo(currentX, currentY);
        this.drawCtx.stroke();
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    clearCanvas() {
        this.drawCtx.fillStyle = '#000';
        this.drawCtx.fillRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
        document.getElementById('predictedDigit').textContent = '-';
        document.getElementById('confidence').textContent = '準備完了';
        document.getElementById('inferenceTime').textContent = '- ms';
        this.resetPredictionBars();
        this.drawNetwork();
    }
    
    // 簡略化されたモデルの初期化
    initializeModel() {
        return {
            // 各層の重みとバイアス（実際のMNISTモデルの簡略版）
            layers: [
                { neurons: 784, activation: 'input' },
                { neurons: 128, activation: 'relu', weights: this.generateRandomWeights(784, 128) },
                { neurons: 64, activation: 'relu', weights: this.generateRandomWeights(128, 64) },
                { neurons: 10, activation: 'softmax', weights: this.generateRandomWeights(64, 10) }
            ]
        };
    }
    
    generateRandomWeights(inputSize, outputSize) {
        // Xavier初期化に基づく重み生成（簡略化）
        const weights = [];
        const scale = Math.sqrt(2.0 / inputSize);
        
        for (let i = 0; i < outputSize; i++) {
            weights[i] = [];
            for (let j = 0; j < inputSize; j++) {
                weights[i][j] = (Math.random() - 0.5) * scale;
            }
        }
        return weights;
    }
    
    async predict() {
        const startTime = performance.now();
        
        // 画像データの取得と前処理
        const imageData = this.preprocessImage();
        
        // ニューラルネットワークの順伝播
        const output = this.forward(imageData);
        
        // 結果の表示
        const endTime = performance.now();
        const inferenceTime = (endTime - startTime).toFixed(2);
        
        this.displayResults(output, inferenceTime);
        this.animateNetwork(imageData, output);
    }
    
    preprocessImage() {
        // キャンバスから画像データを取得
        const imageData = this.drawCtx.getImageData(0, 0, 280, 280);
        const data = imageData.data;
        
        // 28x28にダウンサンプリング
        const downsampled = new Float32Array(784);
        
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                let sum = 0;
                // 10x10ピクセルの平均を取る
                for (let dy = 0; dy < 10; dy++) {
                    for (let dx = 0; dx < 10; dx++) {
                        const srcX = x * 10 + dx;
                        const srcY = y * 10 + dy;
                        const idx = (srcY * 280 + srcX) * 4;
                        // グレースケール値（RGBの平均）
                        sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    }
                }
                downsampled[y * 28 + x] = sum / 100 / 255; // 正規化
            }
        }
        
        return downsampled;
    }
    
    forward(input) {
        let activation = input;
        
        // 各層を通過
        for (let i = 1; i < this.model.layers.length; i++) {
            const layer = this.model.layers[i];
            activation = this.computeLayer(activation, layer);
        }
        
        return activation;
    }
    
    computeLayer(input, layer) {
        const output = new Float32Array(layer.neurons);
        
        // 重み付き和の計算
        for (let i = 0; i < layer.neurons; i++) {
            let sum = 0;
            for (let j = 0; j < input.length; j++) {
                sum += input[j] * layer.weights[i][j];
            }
            output[i] = sum;
        }
        
        // 活性化関数の適用
        if (layer.activation === 'relu') {
            return this.relu(output);
        } else if (layer.activation === 'softmax') {
            return this.softmax(output);
        }
        
        return output;
    }
    
    relu(x) {
        return x.map(val => Math.max(0, val));
    }
    
    softmax(x) {
        const max = Math.max(...x);
        const exp = x.map(val => Math.exp(val - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(val => val / sum);
    }
    
    displayResults(output, inferenceTime) {
        // 最も確率の高い数字を見つける
        let maxProb = 0;
        let predictedDigit = 0;
        
        for (let i = 0; i < output.length; i++) {
            if (output[i] > maxProb) {
                maxProb = output[i];
                predictedDigit = i;
            }
        }
        
        // 結果の表示
        document.getElementById('predictedDigit').textContent = predictedDigit;
        document.getElementById('confidence').textContent = `信頼度: ${(maxProb * 100).toFixed(1)}%`;
        document.getElementById('inferenceTime').textContent = `${inferenceTime} ms`;
        document.getElementById('accuracy').textContent = `${(maxProb * 100).toFixed(1)} %`;
        
        // 予測バーの更新
        this.updatePredictionBars(output);
    }
    
    initializePredictionBars() {
        const container = document.getElementById('predictionBars');
        container.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const item = document.createElement('div');
            item.className = 'prediction-item';
            item.innerHTML = `
                <div class="prediction-label">${i}</div>
                <div class="prediction-bar-container">
                    <div class="prediction-bar" id="bar-${i}" style="width: 0%"></div>
                    <div class="prediction-percentage" id="percent-${i}">0%</div>
                </div>
            `;
            container.appendChild(item);
        }
    }
    
    updatePredictionBars(output) {
        for (let i = 0; i < output.length; i++) {
            const percentage = (output[i] * 100).toFixed(1);
            const bar = document.getElementById(`bar-${i}`);
            const label = document.getElementById(`percent-${i}`);
            
            bar.style.width = `${percentage}%`;
            label.textContent = `${percentage}%`;
        }
    }
    
    resetPredictionBars() {
        for (let i = 0; i < 10; i++) {
            document.getElementById(`bar-${i}`).style.width = '0%';
            document.getElementById(`percent-${i}`).textContent = '0%';
        }
    }
    
    resizeNetworkCanvas() {
        const container = this.networkCanvas.parentElement;
        this.networkCanvas.width = container.clientWidth - 40;
        this.networkCanvas.height = container.clientHeight - 100;
        this.drawNetwork();
    }
    
    drawNetwork() {
        const ctx = this.networkCtx;
        const width = this.networkCanvas.width;
        const height = this.networkCanvas.height;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        // ネットワークのレイアウト
        const layers = [
            { x: width * 0.1, neurons: 16 },  // 入力層（簡略表示）
            { x: width * 0.35, neurons: 8 },   // 隠れ層1
            { x: width * 0.65, neurons: 6 },   // 隠れ層2
            { x: width * 0.9, neurons: 10 }    // 出力層
        ];
        
        // 接続線を描画
        for (let i = 0; i < layers.length - 1; i++) {
            const currentLayer = layers[i];
            const nextLayer = layers[i + 1];
            
            for (let j = 0; j < currentLayer.neurons; j++) {
                const y1 = this.getNeuronY(j, currentLayer.neurons, height);
                
                for (let k = 0; k < nextLayer.neurons; k++) {
                    const y2 = this.getNeuronY(k, nextLayer.neurons, height);
                    
                    ctx.beginPath();
                    ctx.moveTo(currentLayer.x, y1);
                    ctx.lineTo(nextLayer.x, y2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        // ニューロンを描画
        layers.forEach((layer, layerIndex) => {
            for (let i = 0; i < layer.neurons; i++) {
                const y = this.getNeuronY(i, layer.neurons, height);
                
                ctx.beginPath();
                ctx.arc(layer.x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#00d2ff';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }
    
    getNeuronY(index, total, height) {
        const spacing = height / (total + 1);
        return spacing * (index + 1);
    }
    
    animateNetwork(input, output) {
        // ネットワークのアニメーション（簡略版）
        this.drawNetwork();
        
        const ctx = this.networkCtx;
        const width = this.networkCanvas.width;
        const height = this.networkCanvas.height;
        
        // アクティブなニューロンをハイライト
        const layers = [
            { x: width * 0.1, neurons: 16 },
            { x: width * 0.35, neurons: 8 },
            { x: width * 0.65, neurons: 6 },
            { x: width * 0.9, neurons: 10 }
        ];
        
        // 出力層のニューロンをハイライト
        layers[3].neurons = 10;
        for (let i = 0; i < 10; i++) {
            const y = this.getNeuronY(i, 10, height);
            const intensity = output[i];
            
            ctx.beginPath();
            ctx.arc(layers[3].x, y, 8 + intensity * 10, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 204, 0, ${intensity})`;
            ctx.fill();
            
            if (intensity > 0.5) {
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 20;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new NeuralNetworkSimulator();
});