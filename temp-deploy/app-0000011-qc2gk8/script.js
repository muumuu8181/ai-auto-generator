class RPGEffectsSystem {
    constructor() {
        this.canvas = document.getElementById('effectCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentCategory = 'physical';
        this.currentEffect = null;
        this.particles = [];
        this.isAnimating = false;
        this.audioContext = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeAudio();
        this.startAnimation();
        
        console.log('⚔️ RPG Effects System initialized');
    }
    
    initializeElements() {
        this.battlefield = document.getElementById('battlefield');
        this.damageNumbers = document.getElementById('damageNumbers');
        this.logContent = document.getElementById('logContent');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.effectCategories = document.querySelectorAll('.effect-category');
        this.effectCards = document.querySelectorAll('.effect-card');
        this.targetSelect = document.getElementById('targetSelect');
        this.intensitySlider = document.getElementById('intensitySlider');
        this.speedSlider = document.getElementById('speedSlider');
        this.previewBtn = document.getElementById('previewBtn');
        this.executeBtn = document.getElementById('executeBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }
    
    initializeEventListeners() {
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchCategory(btn.dataset.category));
        });
        
        this.effectCards.forEach(card => {
            card.addEventListener('click', () => this.selectEffect(card.dataset.effect));
        });
        
        this.intensitySlider.addEventListener('input', () => {
            document.getElementById('intensityValue').textContent = this.intensitySlider.value;
        });
        
        this.speedSlider.addEventListener('input', () => {
            document.getElementById('speedValue').textContent = this.speedSlider.value + 'x';
        });
        
        this.previewBtn.addEventListener('click', () => this.previewEffect());
        this.executeBtn.addEventListener('click', () => this.executeEffect());
        this.resetBtn.addEventListener('click', () => this.resetBattlefield());
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    switchCategory(category) {
        this.currentCategory = category;
        
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.effectCategories.forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
    }
    
    selectEffect(effect) {
        this.currentEffect = effect;
        
        this.effectCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.effect === effect);
        });
        
        this.logMessage(`エフェクト選択: ${this.getEffectName(effect)}`);
    }
    
    getEffectName(effect) {
        const names = {
            slash: '斬撃', pierce: '突き', crush: '強打', combo: '連続攻撃',
            fireball: 'ファイアボール', lightning: 'ライトニング', freeze: 'アイスブラスト', meteor: 'メテオ',
            poison: '毒霧', blind: '暗闇', curse: '呪い', drain: '吸血',
            heal: 'ヒール', regen: 'リジェネ', barrier: 'バリア', revive: '蘇生',
            dragonbreath: 'ドラゴンブレス', earthquake: '大地震', timespace: '時空斬', galaxyblast: '銀河爆裂'
        };
        return names[effect] || effect;
    }
    
    previewEffect() {
        if (!this.currentEffect) {
            this.logMessage('エフェクトが選択されていません');
            return;
        }
        
        this.logMessage(`プレビュー: ${this.getEffectName(this.currentEffect)}`);
        this.createEffect(this.currentEffect, true);
    }
    
    executeEffect() {
        if (!this.currentEffect) {
            this.logMessage('エフェクトが選択されていません');
            return;
        }
        
        const target = this.targetSelect.value;
        this.logMessage(`実行: ${this.getEffectName(this.currentEffect)} → ${this.getTargetName(target)}`);
        
        this.createEffect(this.currentEffect, false, target);
        this.playSound(this.currentEffect);
        this.showDamage(target);
    }
    
    getTargetName(target) {
        const names = {
            enemy1: 'ドラゴン',
            enemy2: 'オーク', 
            enemy3: 'スケルトン',
            all: '全体'
        };
        return names[target] || target;
    }
    
    createEffect(effect, isPreview = false, target = 'enemy1') {
        const intensity = parseInt(this.intensitySlider.value);
        const speed = parseFloat(this.speedSlider.value);
        
        switch (effect) {
            case 'slash':
                this.createSlashEffect(target, intensity, speed);
                break;
            case 'fireball':
                this.createFireballEffect(target, intensity, speed);
                break;
            case 'lightning':
                this.createLightningEffect(target, intensity, speed);
                break;
            case 'meteor':
                this.createMeteorEffect(target, intensity, speed);
                break;
            case 'heal':
                this.createHealEffect(target, intensity, speed);
                break;
            default:
                this.createGenericEffect(effect, target, intensity, speed);
        }
    }
    
    createSlashEffect(target, intensity, speed) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        
        this.createSlashParticles(x, y, intensity);
        this.animateSlash(x, y, speed);
    }
    
    createSlashParticles(x, y, intensity) {
        for (let i = 0; i < intensity * 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: 0.02,
                color: `hsl(${Math.random() * 60 + 15}, 70%, 60%)`,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    animateSlash(x, y, speed) {
        let frame = 0;
        const animate = () => {
            if (frame < 30 / speed) {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                
                const progress = frame / (30 / speed);
                const startX = x - 40 + progress * 80;
                const startY = y + 30 - progress * 60;
                const endX = x + 40 - progress * 80;
                const endY = y - 30 + progress * 60;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                frame++;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    createFireballEffect(target, intensity, speed) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        
        for (let i = 0; i < intensity * 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.015,
                color: `hsl(${Math.random() * 60}, 100%, 60%)`,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    createLightningEffect(target, intensity, speed) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        
        let frame = 0;
        const animate = () => {
            if (frame < 20 / speed) {
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 2;
                
                for (let i = 0; i < intensity; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + (Math.random() - 0.5) * 100, 0);
                    
                    let currentX = x + (Math.random() - 0.5) * 20;
                    let currentY = 20;
                    
                    while (currentY < y) {
                        currentX += (Math.random() - 0.5) * 40;
                        currentY += Math.random() * 20 + 10;
                        this.ctx.lineTo(currentX, currentY);
                    }
                    
                    this.ctx.stroke();
                }
                
                frame++;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    createMeteorEffect(target, intensity, speed) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const endX = rect.left - canvasRect.left + rect.width / 2;
        const endY = rect.top - canvasRect.top + rect.height / 2;
        
        for (let i = 0; i < intensity; i++) {
            const startX = Math.random() * this.canvas.width;
            const startY = -50;
            
            this.animateMeteor(startX, startY, endX, endY, speed);
        }
    }
    
    animateMeteor(startX, startY, endX, endY, speed) {
        let frame = 0;
        const totalFrames = 60 / speed;
        
        const animate = () => {
            if (frame < totalFrames) {
                const progress = frame / totalFrames;
                const x = startX + (endX - startX) * progress;
                const y = startY + (endY - startY) * progress;
                
                this.ctx.fillStyle = '#ff4500';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Trail effect
                for (let i = 1; i <= 5; i++) {
                    const trailX = x - (endX - startX) * 0.02 * i;
                    const trailY = y - (endY - startY) * 0.02 * i;
                    this.ctx.fillStyle = `rgba(255, 69, 0, ${1 - i * 0.2})`;
                    this.ctx.beginPath();
                    this.ctx.arc(trailX, trailY, 8 - i, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                frame++;
                requestAnimationFrame(animate);
            } else {
                this.createExplosion(endX, endY);
            }
        };
        animate();
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1.0,
                decay: 0.025,
                color: `hsl(${Math.random() * 60}, 100%, 70%)`,
                size: Math.random() * 8 + 4
            });
        }
    }
    
    createHealEffect(target, intensity, speed) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        
        for (let i = 0; i < intensity * 6; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 80,
                y: y + Math.random() * 100,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 5 - 2,
                life: 1.0,
                decay: 0.01,
                color: `hsl(120, 70%, ${50 + Math.random() * 30}%)`,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    createGenericEffect(effect, target, intensity, speed) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const rect = targetElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        
        const colors = {
            pierce: '#c0c0c0',
            crush: '#8b4513',
            combo: '#ffd700',
            freeze: '#87ceeb',
            poison: '#9400d3',
            blind: '#2f4f4f',
            curse: '#800080',
            drain: '#8b0000'
        };
        
        const color = colors[effect] || '#ff69b4';
        
        for (let i = 0; i < intensity * 4; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 60,
                y: y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                decay: 0.02,
                color: color,
                size: Math.random() * 5 + 2
            });
        }
    }
    
    showDamage(target) {
        const damage = this.calculateDamage();
        const targetElement = document.getElementById(target);
        
        if (targetElement) {
            const damageElement = document.createElement('div');
            damageElement.className = 'damage-number';
            damageElement.textContent = damage;
            damageElement.style.cssText = `
                position: absolute;
                color: #ff4444;
                font-size: 2rem;
                font-weight: bold;
                pointer-events: none;
                animation: damageFloat 2s ease-out forwards;
                z-index: 100;
            `;
            
            const rect = targetElement.getBoundingClientRect();
            const containerRect = this.battlefield.getBoundingClientRect();
            
            damageElement.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
            damageElement.style.top = (rect.top - containerRect.top) + 'px';
            
            this.damageNumbers.appendChild(damageElement);
            
            setTimeout(() => {
                this.damageNumbers.removeChild(damageElement);
            }, 2000);
            
            this.updateHealthBar(target, damage);
        }
    }
    
    calculateDamage() {
        const baseDamage = {
            slash: 150, pierce: 125, crush: 175, combo: 100,
            fireball: 225, lightning: 205, freeze: 185, meteor: 350,
            poison: 75, blind: 0, curse: 50, drain: 100,
            heal: -175, regen: -50, barrier: 0, revive: -500,
            dragonbreath: 650, earthquake: 500, timespace: 1250, galaxyblast: 1600
        };
        
        const base = baseDamage[this.currentEffect] || 100;
        const variance = Math.random() * 0.4 + 0.8; // 80-120% variance
        return Math.floor(base * variance);
    }
    
    updateHealthBar(target, damage) {
        const targetElement = document.getElementById(target);
        if (!targetElement) return;
        
        const healthBar = targetElement.querySelector('.health-fill');
        if (!healthBar) return;
        
        const currentWidth = parseFloat(healthBar.style.width) || 100;
        const damagePercent = Math.abs(damage) / 10; // Arbitrary scaling
        const newWidth = Math.max(0, currentWidth - damagePercent);
        
        healthBar.style.width = newWidth + '%';
        
        if (newWidth <= 20) {
            healthBar.style.backgroundColor = '#ff4444';
        } else if (newWidth <= 50) {
            healthBar.style.backgroundColor = '#ffaa00';
        }
    }
    
    playSound(effect) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const frequencies = {
            slash: 800, pierce: 1200, crush: 400, combo: 600,
            fireball: 300, lightning: 2000, freeze: 150, meteor: 100,
            heal: 1000, poison: 250
        };
        
        oscillator.frequency.setValueAtTime(frequencies[effect] || 500, this.audioContext.currentTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    startAnimation() {
        const animate = () => {
            this.updateParticles();
            this.renderParticles();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vy += 0.1; // Gravity
            
            return particle.life > 0;
        });
    }
    
    renderParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    resetBattlefield() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.damageNumbers.innerHTML = '';
        
        // Reset health bars
        document.querySelectorAll('.health-fill').forEach(bar => {
            bar.style.width = '100%';
            bar.style.backgroundColor = '#4ade80';
        });
        
        this.logMessage('バトルフィールドをリセットしました');
    }
    
    logMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.logContent.appendChild(logEntry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }
}

// Add CSS for damage animation
const style = document.createElement('style');
style.textContent = `
    @keyframes damageFloat {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        50% { transform: translateY(-50px) scale(1.2); opacity: 1; }
        100% { transform: translateY(-100px) scale(0.8); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the system
document.addEventListener('DOMContentLoaded', () => {
    window.rpgEffects = new RPGEffectsSystem();
});