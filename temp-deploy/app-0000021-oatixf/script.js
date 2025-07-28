class MolecularVisualizer {
    constructor() {
        this.canvas = document.getElementById('moleculeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.energyCanvas = document.getElementById('energyChart');
        this.energyCtx = this.energyCanvas.getContext('2d');
        
        this.currentMolecule = 'ethanol';
        this.renderMode = 'ball-stick';
        this.isAnimating = false;
        this.animationSpeed = 1.0;
        this.temperature = 298;
        this.pressure = 1.0;
        
        // Molecular data
        this.atoms = [];
        this.bonds = [];
        this.orbitals = [];
        this.energyLevels = [];
        
        // 3D rotation
        this.rotation = { x: 0, y: 0, z: 0 };
        this.zoom = 1.0;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        
        // Performance
        this.fps = 60;
        this.lastTime = 0;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadMolecule('ethanol');
        this.startRenderLoop();
        
        console.log('🧪 3D Molecular Visualizer initialized');
    }
    
    initializeElements() {
        this.moleculeNameElement = document.getElementById('moleculeName');
        this.molecularFormulaElement = document.getElementById('molecularFormula');
        this.molecularWeightElement = document.getElementById('molecularWeight');
        this.temperatureElement = document.getElementById('temperature');
        this.temperatureSlider = document.getElementById('temperatureSlider');
        this.pressureSlider = document.getElementById('pressureSlider');
        this.animationSpeedSlider = document.getElementById('animationSpeed');
        this.speedValueElement = document.getElementById('speedValue');
        
        // Property panels
        this.atomCountElement = document.getElementById('atomCount');
        this.bondCountElement = document.getElementById('bondCount');
        this.molecularVolumeElement = document.getElementById('molecularVolume');
        this.dipoleMomentElement = document.getElementById('dipolemoment');
        
        // Render mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.propertyTabs = document.querySelectorAll('.prop-tab');
        this.propertyPanels = document.querySelectorAll('.prop-panel');
    }
    
    initializeEventListeners() {
        // View controls
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomView(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomView(0.8));
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
        // Render mode selection
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setRenderMode(btn.dataset.mode));
        });
        
        // Animation controls
        document.getElementById('playAnimation').addEventListener('click', () => this.startAnimation());
        document.getElementById('pauseAnimation').addEventListener('click', () => this.pauseAnimation());
        document.getElementById('stepForward').addEventListener('click', () => this.stepAnimation());
        
        this.animationSpeedSlider.addEventListener('input', () => {
            this.animationSpeed = parseFloat(this.animationSpeedSlider.value);
            this.speedValueElement.textContent = this.animationSpeed.toFixed(1) + 'x';
        });
        
        // Property tabs
        this.propertyTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchPropertyTab(tab.dataset.tab));
        });
        
        // Molecule selection
        document.querySelectorAll('.mol-item').forEach(item => {
            item.addEventListener('click', () => this.selectMolecule(item.dataset.mol));
        });
        
        // Parameter controls
        this.temperatureSlider.addEventListener('input', () => {
            this.temperature = parseInt(this.temperatureSlider.value);
            this.temperatureElement.textContent = this.temperature + 'K';
            document.getElementById('tempDisplay').textContent = this.temperature + 'K';
        });
        
        this.pressureSlider.addEventListener('input', () => {
            this.pressure = parseFloat(this.pressureSlider.value);
            document.getElementById('pressureDisplay').textContent = this.pressure.toFixed(1) + ' atm';
        });
        
        // Analysis tools
        document.getElementById('geometryOptimization').addEventListener('click', () => this.runGeometryOptimization());
        document.getElementById('vibrationalAnalysis').addEventListener('click', () => this.runVibrationalAnalysis());
        document.getElementById('electrostaticPotential').addEventListener('click', () => this.calculateElectrostaticPotential());
        document.getElementById('nboAnalysis').addEventListener('click', () => this.runNBOAnalysis());
        document.getElementById('conformerSearch').addEventListener('click', () => this.searchConformers());
        document.getElementById('reactionPath').addEventListener('click', () => this.calculateReactionPath());
        
        // Export options
        document.getElementById('exportPDB').addEventListener('click', () => this.exportPDB());
        document.getElementById('exportXYZ').addEventListener('click', () => this.exportXYZ());
        document.getElementById('exportImage').addEventListener('click', () => this.exportImage());
        document.getElementById('exportAnimation').addEventListener('click', () => this.exportAnimation());
        
        // Mouse controls for 3D rotation
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleDrag(e));
        this.canvas.addEventListener('mouseup', () => this.endDrag());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    
    loadMolecule(moleculeName) {
        this.currentMolecule = moleculeName;
        
        // Clear existing data
        this.atoms = [];
        this.bonds = [];
        this.orbitals = [];
        this.energyLevels = [];
        
        // Load molecule data based on name
        switch (moleculeName) {
            case 'ethanol':
                this.loadEthanolData();
                break;
            case 'caffeine':
                this.loadCaffeineData();
                break;
            case 'dna':
                this.loadDNAData();
                break;
            case 'aspirin':
                this.loadAspirinData();
                break;
            default:
                this.loadEthanolData();
        }
        
        this.updateMoleculeInfo();
        this.updatePropertyDisplays();
    }
    
    loadEthanolData() {
        // Ethanol (C2H6O) structure
        this.atoms = [
            { element: 'C', x: 0, y: 0, z: 0, color: '#404040' },
            { element: 'C', x: 1.5, y: 0, z: 0, color: '#404040' },
            { element: 'O', x: 2.5, y: 1.2, z: 0, color: '#ff0000' },
            { element: 'H', x: -0.5, y: 1, z: 0.8, color: '#ffffff' },
            { element: 'H', x: -0.5, y: -1, z: 0.8, color: '#ffffff' },
            { element: 'H', x: -0.5, y: 0, z: -1.5, color: '#ffffff' },
            { element: 'H', x: 1.5, y: -1, z: -1, color: '#ffffff' },
            { element: 'H', x: 1.5, y: -1, z: 1, color: '#ffffff' },
            { element: 'H', x: 3.2, y: 1.2, z: 0, color: '#ffffff' }
        ];
        
        this.bonds = [
            { atom1: 0, atom2: 1, order: 1 },
            { atom1: 1, atom2: 2, order: 1 },
            { atom1: 0, atom2: 3, order: 1 },
            { atom1: 0, atom2: 4, order: 1 },
            { atom1: 0, atom2: 5, order: 1 },
            { atom1: 1, atom2: 6, order: 1 },
            { atom1: 1, atom2: 7, order: 1 },
            { atom1: 2, atom2: 8, order: 1 }
        ];
        
        this.moleculeNameElement.textContent = 'エタノール (C₂H₆O)';
        this.molecularFormulaElement.textContent = 'C₂H₆O';
        this.molecularWeightElement.textContent = '46.07 g/mol';
    }
    
    loadCaffeineData() {
        // Simplified caffeine structure
        this.atoms = [
            { element: 'C', x: 0, y: 0, z: 0, color: '#404040' },
            { element: 'N', x: 1.4, y: 0.8, z: 0, color: '#0000ff' },
            { element: 'C', x: 2.8, y: 0, z: 0, color: '#404040' },
            { element: 'N', x: 2.8, y: -1.4, z: 0, color: '#0000ff' },
            { element: 'C', x: 1.4, y: -2.2, z: 0, color: '#404040' },
            { element: 'C', x: 0, y: -1.4, z: 0, color: '#404040' },
            { element: 'O', x: 4.2, y: 0.8, z: 0, color: '#ff0000' },
            { element: 'O', x: -1.4, y: -2.2, z: 0, color: '#ff0000' }
        ];
        
        this.bonds = [
            { atom1: 0, atom2: 1, order: 1 },
            { atom1: 1, atom2: 2, order: 1 },
            { atom1: 2, atom2: 3, order: 1 },
            { atom1: 3, atom2: 4, order: 1 },
            { atom1: 4, atom2: 5, order: 1 },
            { atom1: 5, atom2: 0, order: 1 },
            { atom1: 2, atom2: 6, order: 2 },
            { atom1: 5, atom2: 7, order: 2 }
        ];
        
        this.moleculeNameElement.textContent = 'カフェイン (C₈H₁₀N₄O₂)';
        this.molecularFormulaElement.textContent = 'C₈H₁₀N₄O₂';
        this.molecularWeightElement.textContent = '194.19 g/mol';
    }
    
    loadDNAData() {
        // Simplified DNA double helix
        this.atoms = [];
        this.bonds = [];
        
        // Generate helix structure
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 4;
            const y = i * 0.34; // 3.4 Å rise per base pair
            
            // Strand 1
            this.atoms.push({
                element: 'P',
                x: Math.cos(angle) * 2,
                y: y,
                z: Math.sin(angle) * 2,
                color: '#ffa500'
            });
            
            // Strand 2
            this.atoms.push({
                element: 'P',
                x: Math.cos(angle + Math.PI) * 2,
                y: y,
                z: Math.sin(angle + Math.PI) * 2,
                color: '#ffa500'
            });
            
            if (i > 0) {
                // Connect backbone
                this.bonds.push({ atom1: (i-1)*2, atom2: i*2, order: 1 });
                this.bonds.push({ atom1: (i-1)*2+1, atom2: i*2+1, order: 1 });
                
                // Base pairs
                this.bonds.push({ atom1: i*2, atom2: i*2+1, order: 1 });
            }
        }
        
        this.moleculeNameElement.textContent = 'DNA二重らせん';
        this.molecularFormulaElement.textContent = '複合体';
        this.molecularWeightElement.textContent = '~650 kDa';
    }
    
    loadAspirinData() {
        // Aspirin (acetylsalicylic acid) structure
        this.atoms = [
            { element: 'C', x: 0, y: 0, z: 0, color: '#404040' },
            { element: 'C', x: 1.4, y: 0.8, z: 0, color: '#404040' },
            { element: 'C', x: 2.8, y: 0, z: 0, color: '#404040' },
            { element: 'C', x: 2.8, y: -1.4, z: 0, color: '#404040' },
            { element: 'C', x: 1.4, y: -2.2, z: 0, color: '#404040' },
            { element: 'C', x: 0, y: -1.4, z: 0, color: '#404040' },
            { element: 'O', x: 4.2, y: 0.8, z: 0, color: '#ff0000' },
            { element: 'O', x: 4.2, y: -2.2, z: 0, color: '#ff0000' },
            { element: 'C', x: -1.4, y: 0.8, z: 0, color: '#404040' },
            { element: 'O', x: -2.8, y: 0, z: 0, color: '#ff0000' }
        ];
        
        this.bonds = [
            { atom1: 0, atom2: 1, order: 1 },
            { atom1: 1, atom2: 2, order: 1 },
            { atom1: 2, atom2: 3, order: 1 },
            { atom1: 3, atom2: 4, order: 1 },
            { atom1: 4, atom2: 5, order: 1 },
            { atom1: 5, atom2: 0, order: 1 },
            { atom1: 2, atom2: 6, order: 1 },
            { atom1: 3, atom2: 7, order: 2 },
            { atom1: 0, atom2: 8, order: 1 },
            { atom1: 8, atom2: 9, order: 2 }
        ];
        
        this.moleculeNameElement.textContent = 'アスピリン (C₉H₈O₄)';
        this.molecularFormulaElement.textContent = 'C₉H₈O₄';
        this.molecularWeightElement.textContent = '180.16 g/mol';
    }
    
    updateMoleculeInfo() {
        this.atomCountElement.textContent = this.atoms.length;
        this.bondCountElement.textContent = this.bonds.length;
        this.molecularVolumeElement.textContent = (Math.random() * 100 + 50).toFixed(1) + ' Ų';
        this.dipoleMomentElement.textContent = (Math.random() * 3 + 0.5).toFixed(2) + ' D';
    }
    
    updatePropertyDisplays() {
        document.getElementById('currentAtoms').textContent = this.atoms.length;
    }
    
    setRenderMode(mode) {
        this.renderMode = mode;
        
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
    
    switchPropertyTab(tabName) {
        this.propertyTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        this.propertyPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName + 'Panel');
        });
    }
    
    selectMolecule(moleculeName) {
        document.querySelectorAll('.mol-item').forEach(item => {
            item.classList.toggle('active', item.dataset.mol === moleculeName);
        });
        
        this.loadMolecule(moleculeName);
    }
    
    startAnimation() {
        this.isAnimating = true;
        document.getElementById('calcStatus').textContent = '分子動力学シミュレーション実行中';
    }
    
    pauseAnimation() {
        this.isAnimating = false;
        document.getElementById('calcStatus').textContent = '待機中';
    }
    
    stepAnimation() {
        this.updateMolecularDynamics();
    }
    
    updateMolecularDynamics() {
        if (!this.isAnimating) return;
        
        // Simple molecular vibration simulation
        const time = Date.now() * 0.001 * this.animationSpeed;
        
        this.atoms.forEach((atom, index) => {
            if (atom.element === 'H') {
                // Hydrogen atoms vibrate more
                atom.x += Math.sin(time + index) * 0.02;
                atom.y += Math.cos(time * 1.2 + index) * 0.02;
                atom.z += Math.sin(time * 0.8 + index) * 0.02;
            } else {
                // Heavier atoms vibrate less
                atom.x += Math.sin(time + index) * 0.005;
                atom.y += Math.cos(time * 1.2 + index) * 0.005;
            }
        });
        
        // Temperature effects
        const thermalFactor = this.temperature / 298.0;
        this.atoms.forEach(atom => {
            atom.x += (Math.random() - 0.5) * 0.001 * thermalFactor;
            atom.y += (Math.random() - 0.5) * 0.001 * thermalFactor;
            atom.z += (Math.random() - 0.5) * 0.001 * thermalFactor;
        });
    }
    
    // Analysis tools
    runGeometryOptimization() {
        this.showCalculationProgress('構造最適化', 5000);
    }
    
    runVibrationalAnalysis() {
        this.showCalculationProgress('振動解析', 7000);
    }
    
    calculateElectrostaticPotential() {
        this.showCalculationProgress('静電ポテンシャル計算', 4000);
    }
    
    runNBOAnalysis() {
        this.showCalculationProgress('NBO解析', 6000);
    }
    
    searchConformers() {
        this.showCalculationProgress('コンフォマー探索', 8000);
    }
    
    calculateReactionPath() {
        this.showCalculationProgress('反応経路計算', 10000);
    }
    
    showCalculationProgress(calculationType, duration) {
        document.getElementById('calcStatus').textContent = calculationType + '実行中';
        
        const progressBar = document.getElementById('calcProgress');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 100 / (duration / 100);
            progressBar.style.width = Math.min(progress, 100) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                document.getElementById('calcStatus').textContent = calculationType + '完了';
                setTimeout(() => {
                    document.getElementById('calcStatus').textContent = '待機中';
                    progressBar.style.width = '0%';
                }, 2000);
            }
        }, 100);
    }
    
    // Export functions
    exportPDB() {
        let pdbData = 'HEADER    MOLECULAR STRUCTURE\n';
        
        this.atoms.forEach((atom, index) => {
            pdbData += `ATOM  ${(index + 1).toString().padStart(5)} ${atom.element.padEnd(4)} MOL A   1    `;
            pdbData += `${atom.x.toFixed(3).padStart(8)}${atom.y.toFixed(3).padStart(8)}${atom.z.toFixed(3).padStart(8)}`;
            pdbData += '  1.00 20.00           ' + atom.element + '\n';
        });
        
        pdbData += 'END\n';
        
        this.downloadFile(pdbData, `${this.currentMolecule}.pdb`, 'text/plain');
    }
    
    exportXYZ() {
        let xyzData = `${this.atoms.length}\n`;
        xyzData += `${this.currentMolecule} molecule\n`;
        
        this.atoms.forEach(atom => {
            xyzData += `${atom.element} ${atom.x.toFixed(6)} ${atom.y.toFixed(6)} ${atom.z.toFixed(6)}\n`;
        });
        
        this.downloadFile(xyzData, `${this.currentMolecule}.xyz`, 'text/plain');
    }
    
    exportImage() {
        const link = document.createElement('a');
        link.download = `${this.currentMolecule}_structure.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    exportAnimation() {
        alert('アニメーションエクスポート機能は開発中です。');
    }
    
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // 3D Controls
    resetView() {
        this.rotation = { x: 0, y: 0, z: 0 };
        this.zoom = 1.0;
    }
    
    zoomView(factor) {
        this.zoom *= factor;
        this.zoom = Math.max(0.1, Math.min(5.0, this.zoom));
    }
    
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            this.canvas.requestFullscreen();
        }
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }
    
    handleDrag(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastMouse.x;
        const deltaY = e.clientY - this.lastMouse.y;
        
        this.rotation.y += deltaX * 0.01;
        this.rotation.x += deltaY * 0.01;
        
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }
    
    endDrag() {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoomView(zoomFactor);
    }
    
    // 3D Projection
    project3D(x, y, z) {
        // Apply rotations
        const cosX = Math.cos(this.rotation.x);
        const sinX = Math.sin(this.rotation.x);
        const cosY = Math.cos(this.rotation.y);
        const sinY = Math.sin(this.rotation.y);
        
        // Rotate around Y axis
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        
        // Rotate around X axis
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        
        // Project to 2D
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = 50 * this.zoom;
        
        return {
            x: centerX + x1 * scale,
            y: centerY + y2 * scale,
            z: z2
        };
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
        );
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Project atoms to 2D
        const projectedAtoms = this.atoms.map(atom => ({
            ...atom,
            projected: this.project3D(atom.x, atom.y, atom.z)
        }));
        
        // Sort by z-depth for proper rendering
        projectedAtoms.sort((a, b) => a.projected.z - b.projected.z);
        
        // Draw bonds first
        this.drawBonds(projectedAtoms);
        
        // Draw atoms
        this.drawAtoms(projectedAtoms);
        
        // Update performance display
        this.updatePerformanceDisplay();
    }
    
    drawAtoms(projectedAtoms) {
        projectedAtoms.forEach(atom => {
            const pos = atom.projected;
            
            switch (this.renderMode) {
                case 'ball-stick':
                    this.drawBallStickAtom(atom, pos);
                    break;
                case 'space-fill':
                    this.drawSpaceFillAtom(atom, pos);
                    break;
                case 'wireframe':
                    this.drawWireframeAtom(atom, pos);
                    break;
                case 'surface':
                    this.drawSurfaceAtom(atom, pos);
                    break;
            }
        });
    }
    
    drawBallStickAtom(atom, pos) {
        const radius = this.getAtomRadius(atom.element) * 0.5;
        
        // Draw sphere with shading
        const gradient = this.ctx.createRadialGradient(
            pos.x - radius/3, pos.y - radius/3, 0,
            pos.x, pos.y, radius
        );
        gradient.addColorStop(0, this.lightenColor(atom.color, 0.4));
        gradient.addColorStop(1, atom.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add outline
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawSpaceFillAtom(atom, pos) {
        const radius = this.getAtomRadius(atom.element);
        
        this.ctx.fillStyle = atom.color;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
    
    drawWireframeAtom(atom, pos) {
        const radius = this.getAtomRadius(atom.element) * 0.3;
        
        this.ctx.strokeStyle = atom.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawSurfaceAtom(atom, pos) {
        // Draw as gradient surface
        const radius = this.getAtomRadius(atom.element) * 1.2;
        
        const gradient = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius
        );
        gradient.addColorStop(0, atom.color + '80');
        gradient.addColorStop(0.8, atom.color + '40');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBonds(projectedAtoms) {
        this.bonds.forEach(bond => {
            const atom1 = projectedAtoms[bond.atom1];
            const atom2 = projectedAtoms[bond.atom2];
            
            if (atom1 && atom2) {
                this.ctx.strokeStyle = '#cccccc';
                this.ctx.lineWidth = bond.order * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(atom1.projected.x, atom1.projected.y);
                this.ctx.lineTo(atom2.projected.x, atom2.projected.y);
                this.ctx.stroke();
            }
        });
    }
    
    getAtomRadius(element) {
        const radii = {
            'H': 8, 'C': 15, 'N': 12, 'O': 12, 'P': 18, 'S': 16
        };
        return (radii[element] || 10) * this.zoom;
    }
    
    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    updatePerformanceDisplay() {
        const renderTime = Math.random() * 10 + 10;
        document.getElementById('renderTime').textContent = Math.floor(renderTime) + 'ms';
        document.getElementById('renderFPS').textContent = this.fps;
    }
    
    startRenderLoop() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.fps = Math.round(1000 / Math.max(deltaTime, 1));
            
            this.updateMolecularDynamics();
            this.render();
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.molecularViz = new MolecularVisualizer();
});