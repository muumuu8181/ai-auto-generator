class QuantumPhysicsSimulator {
    constructor() {
        this.canvas = document.getElementById('quantumCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        this.currentExperiment = 'wave-particle';
        this.isSimulating = false;
        this.timeScale = 1.0;
        this.particleCount = 20;
        this.energy = 2.0;
        
        // Quantum particles
        this.particles = [];
        this.waveFunction = [];
        this.probabilityDensity = [];
        
        // Experimental setup
        this.barriers = [];
        this.detectors = [];
        this.entangledPairs = [];
        
        // Measurements
        this.lastMeasurement = null;
        this.measurementHistory = [];
        
        // Performance
        this.fps = 60;
        this.lastTime = 0;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupExperiment();
        this.startRenderLoop();
        
        console.log('⚛️ Quantum Physics Simulator initialized');
    }
    
    initializeElements() {
        this.experimentButtons = document.querySelectorAll('.experiment-btn');
        this.timeScaleSlider = document.getElementById('timeScale');
        this.timeScaleValue = document.getElementById('timeScaleValue');
        this.particleCountSlider = document.getElementById('particleCount');
        this.particleCountValue = document.getElementById('particleCountValue');
        this.energySlider = document.getElementById('energySlider');
        this.energyValue = document.getElementById('energyValue');
        
        // Wave function canvas
        this.waveFunctionCanvas = document.getElementById('waveFunctionCanvas');
        this.waveFunctionCtx = this.waveFunctionCanvas.getContext('2d');
        
        // Probability canvas
        this.probabilityCanvas = document.getElementById('probabilityCanvas');
        this.probabilityCtx = this.probabilityCanvas.getContext('2d');
    }
    
    initializeEventListeners() {
        // Experiment selection
        this.experimentButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectExperiment(btn.dataset.experiment);
            });
        });
        
        // Simulation controls
        document.getElementById('playSimulation').addEventListener('click', () => this.startSimulation());
        document.getElementById('pauseSimulation').addEventListener('click', () => this.pauseSimulation());
        document.getElementById('resetSimulation').addEventListener('click', () => this.resetSimulation());
        document.getElementById('stepSimulation').addEventListener('click', () => this.stepSimulation());
        
        // Parameter controls
        this.timeScaleSlider.addEventListener('input', () => {
            this.timeScale = parseFloat(this.timeScaleSlider.value);
            this.timeScaleValue.textContent = this.timeScale.toFixed(1) + 'x';
        });
        
        this.particleCountSlider.addEventListener('input', () => {
            this.particleCount = parseInt(this.particleCountSlider.value);
            this.particleCountValue.textContent = this.particleCount;
            this.setupExperiment();
        });
        
        this.energySlider.addEventListener('input', () => {
            this.energy = parseFloat(this.energySlider.value);
            this.energyValue.textContent = this.energy.toFixed(1) + ' eV';
            document.getElementById('energyLevel').textContent = this.energy.toFixed(1) + ' eV';
        });
        
        // Measurement tools
        document.getElementById('measurePosition').addEventListener('click', () => this.measurePosition());
        document.getElementById('measureMomentum').addEventListener('click', () => this.measureMomentum());
        document.getElementById('measureSpin').addEventListener('click', () => this.measureSpin());
        document.getElementById('measureEnergy').addEventListener('click', () => this.measureEnergy());
        
        // Quantum gates
        document.getElementById('hadamardGate').addEventListener('click', () => this.applyHadamardGate());
        document.getElementById('pauliXGate').addEventListener('click', () => this.applyPauliXGate());
        document.getElementById('pauliYGate').addEventListener('click', () => this.applyPauliYGate());
        document.getElementById('pauliZGate').addEventListener('click', () => this.applyPauliZGate());
    }
    
    selectExperiment(experimentType) {
        this.currentExperiment = experimentType;
        this.pauseSimulation();
        
        // Update active button
        this.experimentButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.experiment === experimentType);
        });
        
        this.setupExperiment();
        this.updateExperimentInfo();
    }
    
    setupExperiment() {
        this.particles = [];
        this.barriers = [];
        this.detectors = [];
        this.entangledPairs = [];
        
        switch (this.currentExperiment) {
            case 'wave-particle':
                this.setupWaveParticleExperiment();
                break;
            case 'quantum-tunnel':
                this.setupQuantumTunnelExperiment();
                break;
            case 'double-slit':
                this.setupDoubleSlitExperiment();
                break;
            case 'entanglement':
                this.setupEntanglementExperiment();
                break;
            case 'superposition':
                this.setupSuperpositionExperiment();
                break;
            case 'uncertainty':
                this.setupUncertaintyExperiment();
                break;
        }
    }
    
    setupWaveParticleExperiment() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: 100 + Math.random() * 50,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                vx: 2 + Math.random(),
                vy: (Math.random() - 0.5) * 0.5,
                energy: this.energy,
                wavePhase: Math.random() * Math.PI * 2,
                isObserved: false,
                probability: 1.0
            });
        }
    }
    
    setupQuantumTunnelExperiment() {
        // Create potential barrier
        this.barriers.push({
            x: this.canvas.width / 2 - 50,
            y: 0,
            width: 100,
            height: this.canvas.height,
            potential: 5.0
        });
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: 200,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 200,
                vx: 1.5,
                vy: 0,
                energy: this.energy,
                tunnelProbability: this.calculateTunnelProbability(this.energy, 5.0)
            });
        }
    }
    
    setupDoubleSlitExperiment() {
        // Create double slit barrier
        const slitWidth = 20;
        const slitSeparation = 80;
        const barrierX = this.canvas.width / 3;
        
        this.barriers.push({
            x: barrierX,
            y: 0,
            width: 20,
            height: this.canvas.height / 2 - slitSeparation / 2 - slitWidth / 2
        });
        
        this.barriers.push({
            x: barrierX,
            y: this.canvas.height / 2 - slitSeparation / 2 + slitWidth / 2,
            width: 20,
            height: slitSeparation - slitWidth
        });
        
        this.barriers.push({
            x: barrierX,
            y: this.canvas.height / 2 + slitSeparation / 2 + slitWidth / 2,
            width: 20,
            height: this.canvas.height / 2 - slitSeparation / 2 - slitWidth / 2
        });
        
        // Create detector screen
        this.detectors.push({
            x: this.canvas.width * 0.8,
            y: 0,
            width: 10,
            height: this.canvas.height,
            hits: new Array(Math.floor(this.canvas.height / 5)).fill(0)
        });
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: 50,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 50,
                vx: 2,
                vy: 0,
                energy: this.energy,
                waveAmplitude: 1.0,
                phaseShift: 0
            });
        }
    }
    
    setupEntanglementExperiment() {
        for (let i = 0; i < this.particleCount / 2; i++) {
            const pair = this.createEntangledPair();
            this.entangledPairs.push(pair);
            this.particles.push(pair.particleA, pair.particleB);
        }
        
        this.updateEntanglementVisualization();
    }
    
    setupSuperpositionExperiment() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: this.canvas.width / 4 + Math.random() * 100,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                superpositionStates: [
                    { amplitude: 0.707, phase: 0 },
                    { amplitude: 0.707, phase: Math.PI }
                ],
                isMeasured: false
            });
        }
    }
    
    setupUncertaintyExperiment() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 200,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                positionUncertainty: 10 + Math.random() * 20,
                momentumUncertainty: 1 + Math.random() * 2
            });
        }
    }
    
    createEntangledPair() {
        return {
            particleA: {
                x: this.canvas.width / 4,
                y: this.canvas.height / 2 - 50,
                spin: Math.random() > 0.5 ? 'up' : 'down',
                entangled: true,
                pairId: Math.random().toString(36).substr(2, 9)
            },
            particleB: {
                x: this.canvas.width * 3 / 4,
                y: this.canvas.height / 2 + 50,
                spin: null, // Will be opposite of A when measured
                entangled: true,
                pairId: null // Will match A's pairId
            },
            entanglementStrength: 0.85 + Math.random() * 0.15
        };
    }
    
    startSimulation() {
        this.isSimulating = true;
        document.getElementById('statusText').textContent = '実行中';
        document.getElementById('simStatus').className = 'status-indicator running';
    }
    
    pauseSimulation() {
        this.isSimulating = false;
        document.getElementById('statusText').textContent = '停止中';
        document.getElementById('simStatus').className = 'status-indicator paused';
    }
    
    resetSimulation() {
        this.pauseSimulation();
        this.setupExperiment();
        this.measurementHistory = [];
        this.lastMeasurement = null;
        document.getElementById('lastMeasurement').textContent = '未測定';
        document.getElementById('collapse').textContent = 'なし';
    }
    
    stepSimulation() {
        this.updateSimulation();
    }
    
    updateSimulation() {
        if (!this.isSimulating) return;
        
        for (const particle of this.particles) {
            this.updateParticle(particle);
        }
        
        this.updateWaveFunction();
        this.updateProbabilityDensity();
        this.checkMeasurements();
    }
    
    updateParticle(particle) {
        switch (this.currentExperiment) {
            case 'wave-particle':
                this.updateWaveParticle(particle);
                break;
            case 'quantum-tunnel':
                this.updateTunnelingParticle(particle);
                break;
            case 'double-slit':
                this.updateDoubleSlitParticle(particle);
                break;
            case 'entanglement':
                this.updateEntangledParticle(particle);
                break;
            case 'superposition':
                this.updateSuperpositionParticle(particle);
                break;
            case 'uncertainty':
                this.updateUncertaintyParticle(particle);
                break;
        }
    }
    
    updateWaveParticle(particle) {
        if (!particle.isObserved) {
            // Show wave-like behavior
            particle.wavePhase += 0.1 * this.timeScale;
            particle.y += Math.sin(particle.wavePhase) * 2;
        }
        
        particle.x += particle.vx * this.timeScale;
        
        if (particle.x > this.canvas.width) {
            particle.x = 0;
        }
    }
    
    updateTunnelingParticle(particle) {
        const barrier = this.barriers[0];
        
        if (particle.x >= barrier.x && particle.x <= barrier.x + barrier.width) {
            // Inside barrier - quantum tunneling
            if (Math.random() < particle.tunnelProbability) {
                particle.x += particle.vx * this.timeScale; // Tunnel through
            } else {
                particle.vx *= -1; // Reflect
            }
        } else {
            particle.x += particle.vx * this.timeScale;
        }
        
        if (particle.x > this.canvas.width || particle.x < 0) {
            particle.x = 200;
            particle.vx = Math.abs(particle.vx);
        }
    }
    
    updateDoubleSlitParticle(particle) {
        particle.x += particle.vx * this.timeScale;
        
        // Check collision with detector
        const detector = this.detectors[0];
        if (particle.x >= detector.x) {
            const detectorIndex = Math.floor(particle.y / 5);
            if (detectorIndex >= 0 && detectorIndex < detector.hits.length) {
                detector.hits[detectorIndex]++;
            }
            
            // Reset particle
            particle.x = 50;
            particle.y = this.canvas.height / 2 + (Math.random() - 0.5) * 50;
        }
    }
    
    updateEntangledParticle(particle) {
        if (particle.entangled && particle.spin && !particle.measured) {
            // Find entangled partner
            const pair = this.entangledPairs.find(p => 
                p.particleA === particle || p.particleB === particle
            );
            
            if (pair) {
                const partner = pair.particleA === particle ? pair.particleB : pair.particleA;
                if (particle.spin === 'up') {
                    partner.spin = 'down';
                } else {
                    partner.spin = 'up';
                }
            }
        }
    }
    
    updateSuperpositionParticle(particle) {
        if (!particle.isMeasured) {
            // Particle exists in superposition
            particle.alpha = Math.random() * Math.PI * 2;
        }
    }
    
    updateUncertaintyParticle(particle) {
        // Heisenberg uncertainty principle visualization
        const deltaX = particle.positionUncertainty;
        const deltaP = particle.momentumUncertainty;
        
        // Add quantum fluctuations
        particle.x += (Math.random() - 0.5) * deltaX * 0.1;
        particle.y += (Math.random() - 0.5) * deltaX * 0.1;
        particle.vx += (Math.random() - 0.5) * deltaP * 0.1;
        particle.vy += (Math.random() - 0.5) * deltaP * 0.1;
        
        // Keep in bounds
        particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
    }
    
    calculateTunnelProbability(energy, barrierHeight) {
        if (energy >= barrierHeight) return 1.0;
        
        const k = Math.sqrt(2 * 9.109e-31 * (barrierHeight - energy) * 1.602e-19) / 1.055e-34;
        const width = 100e-10; // 100 angstroms
        return Math.exp(-2 * k * width);
    }
    
    measurePosition() {
        if (this.particles.length === 0) return;
        
        const particle = this.particles[Math.floor(Math.random() * this.particles.length)];
        const measurement = {
            type: 'position',
            value: `(${particle.x.toFixed(1)}, ${particle.y.toFixed(1)})`,
            time: Date.now(),
            uncertainty: '±5.2 nm'
        };
        
        this.recordMeasurement(measurement);
        this.collapseWaveFunction(particle);
    }
    
    measureMomentum() {
        if (this.particles.length === 0) return;
        
        const particle = this.particles[Math.floor(Math.random() * this.particles.length)];
        const px = particle.vx || (Math.random() - 0.5) * 4;
        const py = particle.vy || (Math.random() - 0.5) * 4;
        
        const measurement = {
            type: 'momentum',
            value: `p=(${px.toFixed(2)}, ${py.toFixed(2)}) kg⋅m/s`,
            time: Date.now(),
            uncertainty: '±0.15 kg⋅m/s'
        };
        
        this.recordMeasurement(measurement);
        this.collapseWaveFunction(particle);
    }
    
    measureSpin() {
        if (this.currentExperiment === 'entanglement' && this.entangledPairs.length > 0) {
            const pair = this.entangledPairs[0];
            const spinA = Math.random() > 0.5 ? 'up' : 'down';
            const spinB = spinA === 'up' ? 'down' : 'up';
            
            pair.particleA.spin = spinA;
            pair.particleB.spin = spinB;
            pair.particleA.measured = true;
            pair.particleB.measured = true;
            
            const measurement = {
                type: 'spin',
                value: `A: ${spinA}, B: ${spinB}`,
                time: Date.now(),
                uncertainty: 'デジタル'
            };
            
            this.recordMeasurement(measurement);
            this.updateEntanglementVisualization();
        }
    }
    
    measureEnergy() {
        const energy = this.energy + (Math.random() - 0.5) * 0.5;
        const measurement = {
            type: 'energy',
            value: `${energy.toFixed(2)} eV`,
            time: Date.now(),
            uncertainty: '±0.05 eV'
        };
        
        this.recordMeasurement(measurement);
    }
    
    recordMeasurement(measurement) {
        this.lastMeasurement = measurement;
        this.measurementHistory.push(measurement);
        
        document.getElementById('lastMeasurement').textContent = 
            `${measurement.type}: ${measurement.value}`;
        document.getElementById('uncertainty').textContent = measurement.uncertainty;
        document.getElementById('collapse').textContent = '発生';
        
        // Clear collapse status after 3 seconds
        setTimeout(() => {
            document.getElementById('collapse').textContent = 'なし';
        }, 3000);
    }
    
    collapseWaveFunction(particle) {
        if (particle.isObserved !== undefined) {
            particle.isObserved = true;
        }
        if (particle.isMeasured !== undefined) {
            particle.isMeasured = true;
        }
    }
    
    applyHadamardGate() {
        // Apply Hadamard gate to create superposition
        this.particles.forEach(particle => {
            if (particle.superpositionStates) {
                particle.superpositionStates = [
                    { amplitude: 0.707, phase: 0 },
                    { amplitude: 0.707, phase: 0 }
                ];
            }
        });
    }
    
    applyPauliXGate() {
        // Pauli-X gate (bit flip)
        this.particles.forEach(particle => {
            if (particle.spin) {
                particle.spin = particle.spin === 'up' ? 'down' : 'up';
            }
        });
    }
    
    applyPauliYGate() {
        // Pauli-Y gate
        this.particles.forEach(particle => {
            if (particle.superpositionStates) {
                particle.superpositionStates.forEach(state => {
                    state.phase += Math.PI / 2;
                });
            }
        });
    }
    
    applyPauliZGate() {
        // Pauli-Z gate (phase flip)
        this.particles.forEach(particle => {
            if (particle.superpositionStates) {
                particle.superpositionStates[1].phase += Math.PI;
            }
        });
    }
    
    updateWaveFunction() {
        this.waveFunction = [];
        const resolution = 100;
        
        for (let i = 0; i < resolution; i++) {
            const x = (i / resolution) * this.canvas.width;
            let psi = 0;
            
            for (const particle of this.particles) {
                if (!particle.isObserved) {
                    const k = 2 * Math.PI / 50; // wave number
                    const phase = particle.wavePhase || 0;
                    psi += Math.sin(k * (x - particle.x) + phase);
                }
            }
            
            this.waveFunction.push(psi);
        }
        
        this.drawWaveFunction();
    }
    
    updateProbabilityDensity() {
        this.probabilityDensity = this.waveFunction.map(psi => psi * psi);
        this.drawProbabilityDensity();
    }
    
    drawWaveFunction() {
        this.waveFunctionCtx.clearRect(0, 0, this.waveFunctionCanvas.width, this.waveFunctionCanvas.height);
        
        if (this.waveFunction.length === 0) return;
        
        const width = this.waveFunctionCanvas.width;
        const height = this.waveFunctionCanvas.height;
        const centerY = height / 2;
        
        this.waveFunctionCtx.strokeStyle = '#3b82f6';
        this.waveFunctionCtx.lineWidth = 2;
        this.waveFunctionCtx.beginPath();
        
        for (let i = 0; i < this.waveFunction.length; i++) {
            const x = (i / this.waveFunction.length) * width;
            const y = centerY - this.waveFunction[i] * 20;
            
            if (i === 0) {
                this.waveFunctionCtx.moveTo(x, y);
            } else {
                this.waveFunctionCtx.lineTo(x, y);
            }
        }
        
        this.waveFunctionCtx.stroke();
        
        // Draw zero line
        this.waveFunctionCtx.strokeStyle = '#e5e7eb';
        this.waveFunctionCtx.lineWidth = 1;
        this.waveFunctionCtx.beginPath();
        this.waveFunctionCtx.moveTo(0, centerY);
        this.waveFunctionCtx.lineTo(width, centerY);
        this.waveFunctionCtx.stroke();
    }
    
    drawProbabilityDensity() {
        this.probabilityCtx.clearRect(0, 0, this.probabilityCanvas.width, this.probabilityCanvas.height);
        
        if (this.probabilityDensity.length === 0) return;
        
        const width = this.probabilityCanvas.width;
        const height = this.probabilityCanvas.height;
        const maxProb = Math.max(...this.probabilityDensity);
        
        this.probabilityCtx.fillStyle = '#ef4444';
        
        for (let i = 0; i < this.probabilityDensity.length; i++) {
            const x = (i / this.probabilityDensity.length) * width;
            const barHeight = (this.probabilityDensity[i] / maxProb) * height;
            const y = height - barHeight;
            
            this.probabilityCtx.fillRect(x, y, width / this.probabilityDensity.length, barHeight);
        }
    }
    
    updateEntanglementVisualization() {
        if (this.entangledPairs.length > 0) {
            const pair = this.entangledPairs[0];
            
            document.getElementById('spinA').textContent = pair.particleA.spin === 'up' ? '↑' : '↓';
            document.getElementById('spinB').textContent = pair.particleB.spin === 'up' ? '↑' : '↓';
            
            const strength = pair.entanglementStrength;
            document.getElementById('entanglementStrength').style.width = (strength * 100) + '%';
            document.getElementById('entanglementValue').textContent = strength.toFixed(2);
            document.getElementById('entanglement').textContent = strength.toFixed(2);
        }
    }
    
    updateExperimentInfo() {
        const info = {
            'wave-particle': {
                title: '波動粒子二重性',
                description: '光や電子などの量子粒子は、波動性と粒子性の両方の性質を同時に持っています。この実験では、粒子の行動が観測方法によって変化する様子を観察できます。',
                concepts: ['波動関数', '確率解釈', '観測者効果']
            },
            'quantum-tunnel': {
                title: '量子トンネル効果',
                description: '古典物理学では不可能な現象で、粒子がエネルギー障壁を通り抜けることができます。これは量子力学の重要な予測の一つです。',
                concepts: ['トンネル確率', 'ポテンシャル障壁', '波動関数']
            },
            'double-slit': {
                title: '二重スリット実験',
                description: '量子力学の最も重要な実験の一つ。粒子が二つのスリットを同時に通過し、干渉パターンを作り出します。',
                concepts: ['波動干渉', '重ね合わせ', '測定問題']
            },
            'entanglement': {
                title: '量子もつれ',
                description: '二つの粒子が量子的に結び付けられ、一方の測定が瞬時に他方に影響を与える現象です。',
                concepts: ['非局所性', 'EPRパラドックス', 'ベルの不等式']
            },
            'superposition': {
                title: '重ね合わせ',
                description: '量子系が複数の状態を同時に存在することができる原理です。測定によって一つの状態に収束します。',
                concepts: ['シュレーディンガーの猫', '状態ベクトル', '測定']
            },
            'uncertainty': {
                title: '不確定性原理',
                description: 'ハイゼンベルクの不確定性原理により、位置と運動量を同時に正確に測定することはできません。',
                concepts: ['位置運動量不確定性', '測定限界', '量子ゆらぎ']
            }
        };
        
        const currentInfo = info[this.currentExperiment];
        if (currentInfo) {
            document.querySelector('.info-content h4').textContent = currentInfo.title;
            document.querySelector('.info-content p').textContent = currentInfo.description;
            
            const conceptTags = document.querySelector('.key-concepts');
            conceptTags.innerHTML = '';
            currentInfo.concepts.forEach(concept => {
                const tag = document.createElement('span');
                tag.className = 'concept-tag';
                tag.textContent = concept;
                conceptTags.appendChild(tag);
            });
        }
    }
    
    checkMeasurements() {
        // Simulate random measurements
        if (Math.random() < 0.001) {
            const measurements = ['position', 'momentum', 'energy'];
            const randomMeasurement = measurements[Math.floor(Math.random() * measurements.length)];
            
            switch (randomMeasurement) {
                case 'position':
                    this.measurePosition();
                    break;
                case 'momentum':
                    this.measureMomentum();
                    break;
                case 'energy':
                    this.measureEnergy();
                    break;
            }
        }
    }
    
    render() {
        // Clear canvases
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Draw experiment setup
        this.drawExperimentSetup();
        this.drawParticles();
        this.drawMeasurements();
        
        // Update displays
        this.updateQuantumStates();
        this.updateStatistics();
    }
    
    drawExperimentSetup() {
        // Draw barriers
        this.ctx.fillStyle = '#374151';
        for (const barrier of this.barriers) {
            this.ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
        }
        
        // Draw detectors
        this.ctx.fillStyle = '#ef4444';
        for (const detector of this.detectors) {
            this.ctx.fillRect(detector.x, detector.y, detector.width, detector.height);
            
            // Draw detection pattern
            if (detector.hits) {
                this.ctx.fillStyle = '#fbbf24';
                for (let i = 0; i < detector.hits.length; i++) {
                    const intensity = Math.min(detector.hits[i] / 10, 1);
                    this.ctx.globalAlpha = intensity;
                    this.ctx.fillRect(detector.x + 10, i * 5, 20, 4);
                }
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            this.drawParticle(particle);
        }
    }
    
    drawParticle(particle) {
        this.particleCtx.save();
        
        if (particle.isObserved === false || (!particle.isMeasured && particle.superpositionStates)) {
            // Draw as wave
            this.particleCtx.strokeStyle = '#3b82f6';
            this.particleCtx.lineWidth = 2;
            this.particleCtx.globalAlpha = 0.6;
            
            this.particleCtx.beginPath();
            for (let i = 0; i < 50; i++) {
                const x = particle.x - 25 + i;
                const y = particle.y + Math.sin((i + particle.wavePhase) * 0.3) * 10;
                
                if (i === 0) {
                    this.particleCtx.moveTo(x, y);
                } else {
                    this.particleCtx.lineTo(x, y);
                }
            }
            this.particleCtx.stroke();
        } else {
            // Draw as particle
            this.particleCtx.fillStyle = '#ef4444';
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
            this.particleCtx.fill();
        }
        
        // Draw uncertainty visualization
        if (particle.positionUncertainty) {
            this.particleCtx.strokeStyle = '#9ca3af';
            this.particleCtx.lineWidth = 1;
            this.particleCtx.globalAlpha = 0.3;
            this.particleCtx.beginPath();
            this.particleCtx.arc(particle.x, particle.y, particle.positionUncertainty, 0, Math.PI * 2);
            this.particleCtx.stroke();
        }
        
        this.particleCtx.restore();
    }
    
    drawMeasurements() {
        // Visual feedback for measurements
        if (this.lastMeasurement && Date.now() - this.lastMeasurement.time < 1000) {
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }
    }
    
    updateQuantumStates() {
        const statesContainer = document.getElementById('quantumStates');
        
        if (this.currentExperiment === 'superposition') {
            // Update superposition state display
            const states = [
                { label: '|0⟩', amplitude: 0.707 },
                { label: '|1⟩', amplitude: 0.707 }
            ];
            
            statesContainer.innerHTML = '';
            states.forEach(state => {
                const stateDiv = document.createElement('div');
                stateDiv.className = 'state-item';
                stateDiv.innerHTML = `
                    <span class="state-label">${state.label}</span>
                    <span class="state-amplitude">${state.amplitude.toFixed(3)}</span>
                    <div class="state-bar" style="width: ${state.amplitude * 100}%"></div>
                `;
                statesContainer.appendChild(stateDiv);
            });
        }
    }
    
    updateStatistics() {
        document.getElementById('maxProbability').textContent = 
            this.probabilityDensity.length > 0 ? Math.max(...this.probabilityDensity).toFixed(2) : '0.00';
        
        document.getElementById('expectedValue').textContent = '⟨x⟩ = 0.0';
        document.getElementById('variance').textContent = 'σ² = 1.2';
        
        // Update wave function equation
        document.getElementById('schrodingerEq').textContent = 'iℏ ∂ψ/∂t = Ĥψ';
    }
    
    startRenderLoop() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.fps = Math.round(1000 / Math.max(deltaTime, 1));
            document.getElementById('fpsCounter').textContent = this.fps;
            document.getElementById('computeLoad').textContent = this.fps > 50 ? '低' : this.fps > 30 ? '中' : '高';
            
            this.updateSimulation();
            this.render();
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quantumSim = new QuantumPhysicsSimulator();
});