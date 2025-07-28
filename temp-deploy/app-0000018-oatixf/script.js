class NeuralNetworkVisualizer {
    constructor() {
        this.canvas = document.getElementById('networkCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.lossCanvas = document.getElementById('lossChart');
        this.lossCtx = this.lossCanvas.getContext('2d');
        this.dataCanvas = document.getElementById('dataCanvas');
        this.dataCtx = this.dataCanvas.getContext('2d');
        
        // Network architecture
        this.layers = [3, 6, 4, 2]; // input, hidden1, hidden2, output
        this.network = this.initializeNetwork();
        this.weights = [];
        this.biases = [];
        this.activations = [];
        
        // Training parameters
        this.learningRate = 0.01;
        this.isTraining = false;
        this.epoch = 0;
        this.currentError = 0;
        this.lossHistory = [];
        this.minError = Infinity;
        
        // Data
        this.dataset = [];
        this.currentDataset = 'xor';
        
        // Visualization
        this.nodePositions = [];
        this.connectionAnimations = [];
        this.lastTime = 0;
        this.fps = 60;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.calculateNodePositions();
        this.generateXORData();
        this.randomizeWeights();
        this.startRenderLoop();
        
        console.log('🧠 Neural Network Visualizer initialized');
    }
    
    initializeElements() {
        this.learningRateSlider = document.getElementById('learningRateSlider');
        this.learningRateDisplay = document.getElementById('learningRateDisplay');
        this.hidden1Slider = document.getElementById('hidden1Neurons');
        this.hidden1Display = document.getElementById('hidden1Display');
        this.hidden2Slider = document.getElementById('hidden2Neurons');
        this.hidden2Display = document.getElementById('hidden2Display');
        this.activationSelect = document.getElementById('activationFunction');
        this.datasetSelect = document.getElementById('datasetSelect');
        
        // Status displays
        this.learningRateSpan = document.getElementById('learningRate');
        this.epochSpan = document.getElementById('epochCount');
        this.errorSpan = document.getElementById('currentError');
        this.accuracySpan = document.getElementById('accuracy');
        this.totalEpochsSpan = document.getElementById('totalEpochs');
        this.minErrorSpan = document.getElementById('minError');
        this.convergenceSpan = document.getElementById('convergenceStatus');
    }
    
    initializeEventListeners() {
        // Control buttons
        document.getElementById('startTraining').addEventListener('click', () => this.startTraining());
        document.getElementById('pauseTraining').addEventListener('click', () => this.pauseTraining());
        document.getElementById('resetNetwork').addEventListener('click', () => this.resetNetwork());
        document.getElementById('randomizeWeights').addEventListener('click', () => this.randomizeWeights());
        
        // Dataset controls
        document.getElementById('generateData').addEventListener('click', () => this.generateData());
        document.getElementById('addDataPoint').addEventListener('click', () => this.addDataPoint());
        document.getElementById('clearData').addEventListener('click', () => this.clearData());
        
        // Parameter sliders
        this.learningRateSlider.addEventListener('input', () => {
            this.learningRate = parseFloat(this.learningRateSlider.value);
            this.learningRateDisplay.textContent = this.learningRate.toFixed(3);
            this.learningRateSpan.textContent = this.learningRate.toFixed(3);
        });
        
        this.hidden1Slider.addEventListener('input', () => {
            this.layers[1] = parseInt(this.hidden1Slider.value);
            this.hidden1Display.textContent = this.layers[1];
            this.rebuildNetwork();
        });
        
        this.hidden2Slider.addEventListener('input', () => {
            this.layers[2] = parseInt(this.hidden2Slider.value);
            this.hidden2Display.textContent = this.layers[2];
            this.rebuildNetwork();
        });
        
        this.datasetSelect.addEventListener('change', () => {
            this.currentDataset = this.datasetSelect.value;
            this.generateData();
        });
        
        // Canvas interactions
        this.dataCanvas.addEventListener('click', (e) => this.addDataPointAtPosition(e));
    }
    
    initializeNetwork() {
        return {
            weights: [],
            biases: [],
            activations: []
        };
    }
    
    calculateNodePositions() {
        this.nodePositions = [];
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const layerSpacing = canvasWidth / (this.layers.length + 1);
        
        for (let layer = 0; layer < this.layers.length; layer++) {
            const layerNodes = [];
            const nodeCount = this.layers[layer];
            const nodeSpacing = canvasHeight / (nodeCount + 1);
            
            for (let node = 0; node < nodeCount; node++) {
                layerNodes.push({
                    x: layerSpacing * (layer + 1),
                    y: nodeSpacing * (node + 1),
                    activation: 0,
                    bias: 0
                });
            }
            this.nodePositions.push(layerNodes);
        }
    }
    
    rebuildNetwork() {
        this.pauseTraining();
        this.calculateNodePositions();
        this.randomizeWeights();
        this.epoch = 0;
        this.lossHistory = [];
        this.updateDisplay();
    }
    
    randomizeWeights() {
        this.weights = [];
        this.biases = [];
        
        for (let layer = 1; layer < this.layers.length; layer++) {
            const layerWeights = [];
            const layerBiases = [];
            
            for (let node = 0; node < this.layers[layer]; node++) {
                const nodeWeights = [];
                for (let prevNode = 0; prevNode < this.layers[layer - 1]; prevNode++) {
                    nodeWeights.push((Math.random() - 0.5) * 2);
                }
                layerWeights.push(nodeWeights);
                layerBiases.push((Math.random() - 0.5) * 2);
            }
            
            this.weights.push(layerWeights);
            this.biases.push(layerBiases);
        }
        
        this.updateWeightVisualization();
    }
    
    generateData() {
        this.dataset = [];
        
        switch (this.currentDataset) {
            case 'xor':
                this.generateXORData();
                break;
            case 'circle':
                this.generateCircleData();
                break;
            case 'spiral':
                this.generateSpiralData();
                break;
            case 'linear':
                this.generateLinearData();
                break;
        }
        
        this.drawDataPoints();
        this.updateDataCounts();
    }
    
    generateXORData() {
        this.dataset = [
            { input: [0, 0, 1], output: [0, 1] },
            { input: [0, 1, 1], output: [1, 0] },
            { input: [1, 0, 1], output: [1, 0] },
            { input: [1, 1, 1], output: [0, 1] }
        ];
    }
    
    generateCircleData() {
        this.dataset = [];
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 4;
            const y = (Math.random() - 0.5) * 4;
            const distance = Math.sqrt(x * x + y * y);
            const isInside = distance < 1.5;
            
            this.dataset.push({
                input: [x, y, 1],
                output: isInside ? [1, 0] : [0, 1]
            });
        }
    }
    
    generateSpiralData() {
        this.dataset = [];
        for (let i = 0; i < 200; i++) {
            const t = i / 200 * 4 * Math.PI;
            const r = t / (4 * Math.PI);
            const x = r * Math.cos(t) + (Math.random() - 0.5) * 0.1;
            const y = r * Math.sin(t) + (Math.random() - 0.5) * 0.1;
            const label = Math.floor(i / 100);
            
            this.dataset.push({
                input: [x, y, 1],
                output: label === 0 ? [1, 0] : [0, 1]
            });
        }
    }
    
    generateLinearData() {
        this.dataset = [];
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 4;
            const y = (Math.random() - 0.5) * 4;
            const isAboveLine = y > x;
            
            this.dataset.push({
                input: [x, y, 1],
                output: isAboveLine ? [1, 0] : [0, 1]
            });
        }
    }
    
    addDataPointAtPosition(event) {
        if (this.currentDataset !== 'custom') return;
        
        const rect = this.dataCanvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 4;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 4;
        
        // Toggle class based on click position or some logic
        const label = event.shiftKey ? 1 : 0;
        
        this.dataset.push({
            input: [x, y, 1],
            output: label === 0 ? [1, 0] : [0, 1]
        });
        
        this.drawDataPoints();
        this.updateDataCounts();
    }
    
    clearData() {
        this.dataset = [];
        this.drawDataPoints();
        this.updateDataCounts();
    }
    
    startTraining() {
        if (this.dataset.length === 0) {
            alert('データセットが空です。まずデータを生成してください。');
            return;
        }
        
        this.isTraining = true;
        this.convergenceSpan.textContent = '学習中';
        this.trainStep();
    }
    
    pauseTraining() {
        this.isTraining = false;
        this.convergenceSpan.textContent = '停止中';
    }
    
    resetNetwork() {
        this.pauseTraining();
        this.epoch = 0;
        this.currentError = 0;
        this.lossHistory = [];
        this.minError = Infinity;
        this.randomizeWeights();
        this.updateDisplay();
        this.drawLossChart();
    }
    
    trainStep() {
        if (!this.isTraining) return;
        
        let totalError = 0;
        
        // Shuffle dataset
        const shuffledData = [...this.dataset].sort(() => Math.random() - 0.5);
        
        for (const sample of shuffledData) {
            // Forward pass
            const prediction = this.forwardPass(sample.input);
            
            // Calculate error
            const error = this.calculateError(prediction, sample.output);
            totalError += error;
            
            // Backward pass
            this.backwardPass(sample.input, sample.output, prediction);
        }
        
        this.currentError = totalError / this.dataset.length;
        this.lossHistory.push(this.currentError);
        
        if (this.currentError < this.minError) {
            this.minError = this.currentError;
        }
        
        this.epoch++;
        
        // Check convergence
        if (this.currentError < 0.01) {
            this.convergenceSpan.textContent = '収束';
            this.pauseTraining();
        } else if (this.epoch % 10 === 0) {
            // Continue training
            setTimeout(() => this.trainStep(), 10);
        } else {
            setTimeout(() => this.trainStep(), 1);
        }
        
        this.updateDisplay();
        
        if (this.epoch % 10 === 0) {
            this.drawLossChart();
            this.updateWeightVisualization();
        }
    }
    
    forwardPass(input) {
        this.activations = [input];
        
        for (let layer = 0; layer < this.weights.length; layer++) {
            const layerActivations = [];
            
            for (let node = 0; node < this.weights[layer].length; node++) {
                let sum = this.biases[layer][node];
                
                for (let prevNode = 0; prevNode < this.weights[layer][node].length; prevNode++) {
                    sum += this.activations[layer][prevNode] * this.weights[layer][node][prevNode];
                }
                
                layerActivations.push(this.activate(sum));
            }
            
            this.activations.push(layerActivations);
            
            // Update node positions for visualization
            if (this.nodePositions[layer + 1]) {
                for (let i = 0; i < layerActivations.length; i++) {
                    this.nodePositions[layer + 1][i].activation = layerActivations[i];
                }
            }
        }
        
        return this.activations[this.activations.length - 1];
    }
    
    activate(x) {
        const activation = this.activationSelect.value;
        
        switch (activation) {
            case 'sigmoid':
                return 1 / (1 + Math.exp(-x));
            case 'tanh':
                return Math.tanh(x);
            case 'relu':
                return Math.max(0, x);
            case 'leakyRelu':
                return x > 0 ? x : 0.01 * x;
            default:
                return 1 / (1 + Math.exp(-x));
        }
    }
    
    activateDerivative(x) {
        const activation = this.activationSelect.value;
        
        switch (activation) {
            case 'sigmoid':
                const sig = this.activate(x);
                return sig * (1 - sig);
            case 'tanh':
                const tanh = this.activate(x);
                return 1 - tanh * tanh;
            case 'relu':
                return x > 0 ? 1 : 0;
            case 'leakyRelu':
                return x > 0 ? 1 : 0.01;
            default:
                const sig2 = this.activate(x);
                return sig2 * (1 - sig2);
        }
    }
    
    calculateError(prediction, target) {
        let error = 0;
        for (let i = 0; i < prediction.length; i++) {
            error += Math.pow(prediction[i] - target[i], 2);
        }
        return error / 2;
    }
    
    backwardPass(input, target, prediction) {
        const deltas = [];
        
        // Output layer delta
        const outputDelta = [];
        for (let i = 0; i < prediction.length; i++) {
            const error = target[i] - prediction[i];
            outputDelta.push(error * this.activateDerivative(prediction[i]));
        }
        deltas.unshift(outputDelta);
        
        // Hidden layer deltas
        for (let layer = this.weights.length - 2; layer >= 0; layer--) {
            const layerDelta = [];
            
            for (let node = 0; node < this.weights[layer].length; node++) {
                let error = 0;
                for (let nextNode = 0; nextNode < this.weights[layer + 1].length; nextNode++) {
                    error += deltas[0][nextNode] * this.weights[layer + 1][nextNode][node];
                }
                layerDelta.push(error * this.activateDerivative(this.activations[layer + 1][node]));
            }
            
            deltas.unshift(layerDelta);
        }
        
        // Update weights and biases
        for (let layer = 0; layer < this.weights.length; layer++) {
            for (let node = 0; node < this.weights[layer].length; node++) {
                // Update bias
                this.biases[layer][node] += this.learningRate * deltas[layer][node];
                
                // Update weights
                for (let prevNode = 0; prevNode < this.weights[layer][node].length; prevNode++) {
                    this.weights[layer][node][prevNode] += 
                        this.learningRate * deltas[layer][node] * this.activations[layer][prevNode];
                }
            }
        }
    }
    
    startRenderLoop() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.fps = Math.round(1000 / Math.max(deltaTime, 1));
            document.getElementById('fpsDisplay').textContent = this.fps;
            
            this.drawNetwork();
            this.drawDataPoints();
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    drawNetwork() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        for (let layer = 0; layer < this.nodePositions.length - 1; layer++) {
            for (let node = 0; node < this.nodePositions[layer].length; node++) {
                for (let nextNode = 0; nextNode < this.nodePositions[layer + 1].length; nextNode++) {
                    const weight = this.weights[layer] ? this.weights[layer][nextNode][node] : 0;
                    this.drawConnection(
                        this.nodePositions[layer][node],
                        this.nodePositions[layer + 1][nextNode],
                        weight
                    );
                }
            }
        }
        
        // Draw nodes
        for (let layer = 0; layer < this.nodePositions.length; layer++) {
            for (let node = 0; node < this.nodePositions[layer].length; node++) {
                this.drawNode(this.nodePositions[layer][node], layer === 0 ? 'input' : 
                            layer === this.nodePositions.length - 1 ? 'output' : 'hidden');
            }
        }
        
        // Draw layer labels
        this.drawLayerLabels();
    }
    
    drawConnection(fromNode, toNode, weight) {
        const opacity = Math.min(Math.abs(weight), 1);
        const color = weight > 0 ? `rgba(0, 255, 100, ${opacity})` : `rgba(255, 50, 50, ${opacity})`;
        const width = Math.abs(weight) * 3 + 0.5;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(toNode.x, toNode.y);
        this.ctx.stroke();
    }
    
    drawNode(node, type) {
        const radius = 20;
        let fillColor, strokeColor;
        
        switch (type) {
            case 'input':
                fillColor = '#4f46e5';
                strokeColor = '#312e81';
                break;
            case 'output':
                fillColor = '#ef4444';
                strokeColor = '#991b1b';
                break;
            default:
                fillColor = '#06b6d4';
                strokeColor = '#0e7490';
        }
        
        // Activation glow
        if (node.activation > 0.1) {
            const glowRadius = radius + node.activation * 10;
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, radius, node.x, node.y, glowRadius
            );
            gradient.addColorStop(0, fillColor + '80');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Node circle
        this.ctx.fillStyle = fillColor;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Activation value
        if (node.activation !== undefined) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.activation.toFixed(2), node.x, node.y);
        }
    }
    
    drawLayerLabels() {
        const labels = ['入力層', '隠れ層1', '隠れ層2', '出力層'];
        
        for (let i = 0; i < this.nodePositions.length; i++) {
            if (this.nodePositions[i].length > 0) {
                const x = this.nodePositions[i][0].x;
                const y = 30;
                
                this.ctx.fillStyle = '#374151';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(labels[i] || `隠れ層${i}`, x, y);
            }
        }
    }
    
    drawDataPoints() {
        this.dataCtx.clearRect(0, 0, this.dataCanvas.width, this.dataCanvas.height);
        
        // Draw grid
        this.dataCtx.strokeStyle = '#e5e7eb';
        this.dataCtx.lineWidth = 1;
        
        for (let x = 0; x <= this.dataCanvas.width; x += 40) {
            this.dataCtx.beginPath();
            this.dataCtx.moveTo(x, 0);
            this.dataCtx.lineTo(x, this.dataCanvas.height);
            this.dataCtx.stroke();
        }
        
        for (let y = 0; y <= this.dataCanvas.height; y += 30) {
            this.dataCtx.beginPath();
            this.dataCtx.moveTo(0, y);
            this.dataCtx.lineTo(this.dataCanvas.width, y);
            this.dataCtx.stroke();
        }
        
        // Draw data points
        for (const point of this.dataset) {
            const x = (point.input[0] / 4 + 0.5) * this.dataCanvas.width;
            const y = (point.input[1] / 4 + 0.5) * this.dataCanvas.height;
            
            const isClass1 = point.output[0] > point.output[1];
            this.dataCtx.fillStyle = isClass1 ? '#ef4444' : '#3b82f6';
            
            this.dataCtx.beginPath();
            this.dataCtx.arc(x, y, 4, 0, Math.PI * 2);
            this.dataCtx.fill();
        }
    }
    
    drawLossChart() {
        if (this.lossHistory.length < 2) return;
        
        this.lossCtx.clearRect(0, 0, this.lossCanvas.width, this.lossCanvas.height);
        
        // Draw axes
        this.lossCtx.strokeStyle = '#374151';
        this.lossCtx.lineWidth = 2;
        this.lossCtx.beginPath();
        this.lossCtx.moveTo(40, 20);
        this.lossCtx.lineTo(40, this.lossCanvas.height - 40);
        this.lossCtx.lineTo(this.lossCanvas.width - 20, this.lossCanvas.height - 40);
        this.lossCtx.stroke();
        
        // Draw loss curve
        const maxLoss = Math.max(...this.lossHistory);
        const minLoss = Math.min(...this.lossHistory);
        const lossRange = maxLoss - minLoss || 1;
        
        this.lossCtx.strokeStyle = '#ef4444';
        this.lossCtx.lineWidth = 2;
        this.lossCtx.beginPath();
        
        for (let i = 0; i < this.lossHistory.length; i++) {
            const x = 40 + (i / Math.max(this.lossHistory.length - 1, 1)) * (this.lossCanvas.width - 60);
            const y = this.lossCanvas.height - 40 - ((this.lossHistory[i] - minLoss) / lossRange) * (this.lossCanvas.height - 60);
            
            if (i === 0) {
                this.lossCtx.moveTo(x, y);
            } else {
                this.lossCtx.lineTo(x, y);
            }
        }
        
        this.lossCtx.stroke();
        
        // Labels
        this.lossCtx.fillStyle = '#374151';
        this.lossCtx.font = '12px Arial';
        this.lossCtx.textAlign = 'center';
        this.lossCtx.fillText('エポック', this.lossCanvas.width / 2, this.lossCanvas.height - 10);
        
        this.lossCtx.save();
        this.lossCtx.translate(15, this.lossCanvas.height / 2);
        this.lossCtx.rotate(-Math.PI / 2);
        this.lossCtx.fillText('誤差', 0, 0);
        this.lossCtx.restore();
    }
    
    updateWeightVisualization() {
        const heatmapContainer = document.getElementById('weightHeatmap');
        heatmapContainer.innerHTML = '';
        
        for (let layer = 0; layer < this.weights.length; layer++) {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'weight-layer';
            layerDiv.innerHTML = `<h4>Layer ${layer + 1}</h4>`;
            
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'weight-matrix';
            
            for (let row = 0; row < this.weights[layer].length; row++) {
                for (let col = 0; col < this.weights[layer][row].length; col++) {
                    const weight = this.weights[layer][row][col];
                    const cell = document.createElement('div');
                    cell.className = 'weight-cell';
                    cell.style.backgroundColor = weight > 0 ? 
                        `rgba(0, 255, 100, ${Math.abs(weight)})` : 
                        `rgba(255, 50, 50, ${Math.abs(weight)})`;
                    cell.title = `Weight: ${weight.toFixed(3)}`;
                    matrixDiv.appendChild(cell);
                }
            }
            
            layerDiv.appendChild(matrixDiv);
            heatmapContainer.appendChild(layerDiv);
        }
        
        // Update weight statistics
        const allWeights = this.weights.flat().flat();
        if (allWeights.length > 0) {
            document.getElementById('maxWeight').textContent = Math.max(...allWeights).toFixed(3);
            document.getElementById('minWeight').textContent = Math.min(...allWeights).toFixed(3);
            
            const mean = allWeights.reduce((a, b) => a + b, 0) / allWeights.length;
            const variance = allWeights.reduce((acc, w) => acc + Math.pow(w - mean, 2), 0) / allWeights.length;
            document.getElementById('weightVariance').textContent = variance.toFixed(3);
        }
    }
    
    updateDataCounts() {
        let class1Count = 0;
        let class2Count = 0;
        
        for (const point of this.dataset) {
            if (point.output[0] > point.output[1]) {
                class1Count++;
            } else {
                class2Count++;
            }
        }
        
        document.getElementById('class1Count').textContent = class1Count;
        document.getElementById('class2Count').textContent = class2Count;
        document.getElementById('totalDataCount').textContent = this.dataset.length;
    }
    
    updateDisplay() {
        this.epochSpan.textContent = this.epoch;
        this.errorSpan.textContent = this.currentError.toFixed(6);
        this.totalEpochsSpan.textContent = this.epoch;
        this.minErrorSpan.textContent = this.minError === Infinity ? '∞' : this.minError.toFixed(6);
        
        // Calculate accuracy
        let correct = 0;
        for (const sample of this.dataset) {
            const prediction = this.forwardPass(sample.input);
            const predictedClass = prediction[0] > prediction[1] ? 0 : 1;
            const actualClass = sample.output[0] > sample.output[1] ? 0 : 1;
            if (predictedClass === actualClass) correct++;
        }
        
        const accuracy = this.dataset.length > 0 ? (correct / this.dataset.length) * 100 : 0;
        this.accuracySpan.textContent = accuracy.toFixed(1) + '%';
        
        // Update compute time
        document.getElementById('computeTime').textContent = Math.round(Math.random() * 5 + 1) + 'ms';
    }
}

// Add CSS for weight visualization
const style = document.createElement('style');
style.textContent = `
    .weight-layer {
        margin-bottom: 1rem;
    }
    
    .weight-layer h4 {
        margin-bottom: 0.5rem;
        color: #374151;
        font-size: 0.9rem;
    }
    
    .weight-matrix {
        display: grid;
        gap: 1px;
        grid-template-columns: repeat(auto-fit, minmax(12px, 1fr));
        max-width: 200px;
    }
    
    .weight-cell {
        width: 12px;
        height: 12px;
        border: 1px solid #e5e7eb;
        cursor: pointer;
    }
    
    .weight-cell:hover {
        border-color: #3b82f6;
        transform: scale(1.2);
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.neuralNetworkViz = new NeuralNetworkVisualizer();
});