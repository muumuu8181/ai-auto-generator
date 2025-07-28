class MeteorImpactGenerator {
    constructor() {
        this.canvas = document.getElementById('meteorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.meteors = [];
        this.particles = [];
        this.isAnimating = false;
        this.stats = { totalMeteors: 0, maxSpeed: 0, avgSize: 0, runtime: 0 };
        this.startTime = Date.now();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.startAnimation();
        this.updateStats();
        
        console.log('☄️ Meteor Impact Generator initialized');
    }
    
    initializeElements() {
        this.meteorSize = document.getElementById('meteorSize');
        this.meteorSpeed = document.getElementById('meteorSpeed');
        this.meteorCount = document.getElementById('meteorCount');
        this.meteorAngle = document.getElementById('meteorAngle');
        this.explosionSize = document.getElementById('explosionSize');
        this.particleCount = document.getElementById('particleCount');
        this.fireEffect = document.getElementById('fireEffect');
        this.shakeEffect = document.getElementById('shakeEffect');
        this.meteorTypes = document.querySelectorAll('.meteor-type');
        this.currentType = 'normal';
    }
    
    initializeEventListeners() {
        this.meteorSize.addEventListener('input', () => {
            document.getElementById('sizeValue').textContent = this.meteorSize.value + 'px';
        });
        
        this.meteorSpeed.addEventListener('input', () => {
            document.getElementById('speedValue').textContent = this.meteorSpeed.value;
        });
        
        this.meteorCount.addEventListener('input', () => {
            document.getElementById('countValue').textContent = this.meteorCount.value + '個';
        });
        
        this.meteorAngle.addEventListener('input', () => {
            document.getElementById('angleValue').textContent = this.meteorAngle.value + '°';
        });
        
        this.explosionSize.addEventListener('input', () => {
            document.getElementById('explosionSizeValue').textContent = this.explosionSize.value + 'px';
        });
        
        this.particleCount.addEventListener('input', () => {
            document.getElementById('particleCountValue').textContent = this.particleCount.value + '個';
        });
        
        this.meteorTypes.forEach(type => {
            type.addEventListener('click', () => this.selectMeteorType(type.dataset.type));
        });
        
        document.getElementById('launchBtn').addEventListener('click', () => this.launchMeteors());
        document.getElementById('presetBtn').addEventListener('click', () => this.randomizeSettings());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecording());
        document.getElementById('autoBtn').addEventListener('click', () => this.toggleAutoGeneration());
        
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this.loadPreset(btn.dataset.preset));
        });
    }
    
    selectMeteorType(type) {
        this.currentType = type;
        this.meteorTypes.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
    }
    
    launchMeteors() {
        const count = parseInt(this.meteorCount.value);
        const size = parseInt(this.meteorSize.value);
        const speed = parseInt(this.meteorSpeed.value);
        const angle = parseInt(this.meteorAngle.value);
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createMeteor(size, speed, angle);
            }, i * 200);
        }
        
        this.stats.totalMeteors += count;
        this.stats.maxSpeed = Math.max(this.stats.maxSpeed, speed);
        this.updateDisplayStats();
    }
    
    createMeteor(size, speed, angle) {
        const startX = Math.random() * this.canvas.width;
        const startY = -size;
        const endX = startX + Math.sin(angle * Math.PI / 180) * this.canvas.height;
        const endY = this.canvas.height + size;
        
        const meteor = {
            x: startX,
            y: startY,
            endX: endX,
            endY: endY,
            size: size,
            speed: speed / 10,
            type: this.currentType,
            trail: [],
            life: 1.0
        };
        
        this.meteors.push(meteor);
    }
    
    startAnimation() {
        const animate = () => {
            this.updateMeteors();
            this.updateParticles();
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateMeteors() {
        this.meteors = this.meteors.filter(meteor => {
            const dx = meteor.endX - meteor.x;
            const dy = meteor.endY - meteor.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < meteor.speed) {
                this.createImpactEffect(meteor.x, meteor.y, meteor);
                return false;
            }
            
            const moveX = (dx / distance) * meteor.speed;
            const moveY = (dy / distance) * meteor.speed;
            
            meteor.trail.push({ x: meteor.x, y: meteor.y, life: 1.0 });
            if (meteor.trail.length > 10) meteor.trail.shift();
            
            meteor.x += moveX;
            meteor.y += moveY;
            
            meteor.trail.forEach(t => t.life -= 0.1);
            meteor.trail = meteor.trail.filter(t => t.life > 0);
            
            return true;
        });
    }
    
    createImpactEffect(x, y, meteor) {
        const explosionSize = parseInt(this.explosionSize.value);
        const particleCount = parseInt(this.particleCount.value);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = Math.random() * 10 + 5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: Math.random() * 8 + 2,
                life: 1.0,
                decay: 0.02,
                color: this.getParticleColor(meteor.type),
                gravity: 0.2
            });
        }
        
        if (this.shakeEffect.checked) {
            this.shakeScreen();
        }
        
        document.getElementById('impactCount').textContent = 
            parseInt(document.getElementById('impactCount').textContent) + 1;
    }
    
    getParticleColor(type) {
        const colors = {
            normal: '#ff6b35',
            fire: '#ff4500',
            ice: '#87ceeb',
            energy: '#ffff00',
            rainbow: `hsl(${Math.random() * 360}, 70%, 60%)`,
            dark: '#8b008b'
        };
        return colors[type] || '#ff6b35';
    }
    
    getMeteorColor(type) {
        const colors = {
            normal: '#8b4513',
            fire: '#ff4500',
            ice: '#87ceeb',
            energy: '#ffff00',
            rainbow: `hsl(${Math.random() * 360}, 70%, 60%)`,
            dark: '#4b0082'
        };
        return colors[type] || '#8b4513';
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.life -= particle.decay;
            
            return particle.life > 0 && particle.y < this.canvas.height + 50;
        });
    }
    
    render() {
        this.ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() * this.canvas.width + Date.now() * 0.01) % this.canvas.width;
            const y = (Math.random() * this.canvas.height + Date.now() * 0.005) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw meteors
        this.meteors.forEach(meteor => {
            // Draw trail
            meteor.trail.forEach((point, index) => {
                this.ctx.fillStyle = this.getMeteorColor(meteor.type) + Math.floor(point.life * 255).toString(16).padStart(2, '0');
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, meteor.size * point.life * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw meteor
            this.ctx.fillStyle = this.getMeteorColor(meteor.type);
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fire effect
            if (this.fireEffect.checked && meteor.type === 'fire') {
                for (let i = 0; i < 5; i++) {
                    this.ctx.fillStyle = `rgba(255, ${69 + Math.random() * 100}, 0, 0.5)`;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        meteor.x + (Math.random() - 0.5) * meteor.size,
                        meteor.y + (Math.random() - 0.5) * meteor.size,
                        Math.random() * meteor.size * 0.3,
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    shakeScreen() {
        const intensity = 10;
        this.canvas.style.transform = `translate(${(Math.random() - 0.5) * intensity}px, ${(Math.random() - 0.5) * intensity}px)`;
        
        setTimeout(() => {
            this.canvas.style.transform = '';
        }, 200);
    }
    
    randomizeSettings() {
        this.meteorSize.value = Math.floor(Math.random() * 40) + 10;
        this.meteorSpeed.value = Math.floor(Math.random() * 15) + 5;
        this.meteorCount.value = Math.floor(Math.random() * 8) + 2;
        this.meteorAngle.value = Math.floor(Math.random() * 90) - 45;
        this.explosionSize.value = Math.floor(Math.random() * 200) + 100;
        this.particleCount.value = Math.floor(Math.random() * 150) + 50;
        
        this.updateSliderDisplays();
    }
    
    updateSliderDisplays() {
        document.getElementById('sizeValue').textContent = this.meteorSize.value + 'px';
        document.getElementById('speedValue').textContent = this.meteorSpeed.value;
        document.getElementById('countValue').textContent = this.meteorCount.value + '個';
        document.getElementById('angleValue').textContent = this.meteorAngle.value + '°';
        document.getElementById('explosionSizeValue').textContent = this.explosionSize.value + 'px';
        document.getElementById('particleCountValue').textContent = this.particleCount.value + '個';
    }
    
    loadPreset(preset) {
        switch (preset) {
            case 'shower':
                this.meteorCount.value = 8;
                this.meteorSize.value = 15;
                this.meteorSpeed.value = 12;
                this.particleCount.value = 80;
                break;
            case 'apocalypse':
                this.meteorCount.value = 10;
                this.meteorSize.value = 45;
                this.meteorSpeed.value = 20;
                this.particleCount.value = 200;
                this.selectMeteorType('fire');
                break;
            case 'festival':
                this.meteorCount.value = 6;
                this.meteorSize.value = 25;
                this.meteorSpeed.value = 8;
                this.particleCount.value = 150;
                this.selectMeteorType('rainbow');
                break;
            case 'gentle':
                this.meteorCount.value = 3;
                this.meteorSize.value = 20;
                this.meteorSpeed.value = 5;
                this.particleCount.value = 50;
                this.selectMeteorType('ice');
                break;
        }
        this.updateSliderDisplays();
    }
    
    clearCanvas() {
        this.meteors = [];
        this.particles = [];
        this.ctx.fillStyle = '#000014';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        document.getElementById('impactCount').textContent = '0';
    }
    
    toggleRecording() {
        // Placeholder for recording functionality
        console.log('Recording toggled');
    }
    
    toggleAutoGeneration() {
        // Placeholder for auto generation
        if (!this.autoInterval) {
            this.autoInterval = setInterval(() => {
                this.randomizeSettings();
                this.launchMeteors();
            }, 3000);
        } else {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    }
    
    updateStats() {
        setInterval(() => {
            this.stats.runtime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateDisplayStats();
        }, 1000);
    }
    
    updateDisplayStats() {
        document.getElementById('totalMeteors').textContent = this.stats.totalMeteors;
        document.getElementById('maxSpeed').textContent = this.stats.maxSpeed;
        document.getElementById('avgSize').textContent = Math.floor(this.stats.avgSize) || 0;
        
        const minutes = Math.floor(this.stats.runtime / 60);
        const seconds = this.stats.runtime % 60;
        document.getElementById('runtime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.meteorGenerator = new MeteorImpactGenerator();
});