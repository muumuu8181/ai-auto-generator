class UltraMeteorStormGenerator {
    constructor() {
        this.canvas = document.getElementById('meteorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.meteors = [];
        this.particles = [];
        this.trails = [];
        
        this.isRunning = false;
        this.isPaused = false;
        this.animationId = null;
        this.lastTime = 0;
        
        // Settings
        this.settings = {
            spawnRate: 200,
            sizeVariation: 5,
            speedFactor: 1.5,
            currentType: 'standard',
            effects: {
                sound: true,
                particles: true,
                shake: true,
                trails: true
            }
        };
        
        // Statistics
        this.stats = {
            impactCounter: 0,
            activeMeteors: 0,
            totalDamage: 0,
            atmosphereHealth: 100
        };
        
        // Meteor types with unique properties
        this.meteorTypes = {
            standard: {
                color: '#ff4500',
                trailColor: '#ffa500',
                size: { min: 5, max: 25 },
                speed: { min: 2, max: 8 },
                damage: 10,
                sound: { frequency: 200, wave: 'sawtooth' },
                particles: 15,
                glow: '#ff6600'
            },
            ice: {
                color: '#87ceeb',
                trailColor: '#00ffff',
                size: { min: 8, max: 30 },
                speed: { min: 1.5, max: 6 },
                damage: 8,
                sound: { frequency: 400, wave: 'sine' },
                particles: 20,
                glow: '#b0e0e6'
            },
            plasma: {
                color: '#8a2be2',
                trailColor: '#ff1493',
                size: { min: 4, max: 20 },
                speed: { min: 4, max: 12 },
                damage: 15,
                sound: { frequency: 800, wave: 'square' },
                particles: 25,
                glow: '#da70d6'
            },
            toxic: {
                color: '#32cd32',
                trailColor: '#00ff00',
                size: { min: 6, max: 28 },
                speed: { min: 2, max: 7 },
                damage: 12,
                sound: { frequency: 150, wave: 'triangle' },
                particles: 18,
                glow: '#7fff00'
            },
            crystal: {
                color: '#b9f2ff',
                trailColor: '#dda0dd',
                size: { min: 10, max: 35 },
                speed: { min: 1, max: 5 },
                damage: 20,
                sound: { frequency: 600, wave: 'sine' },
                particles: 30,
                glow: '#e6e6fa'
            },
            dark: {
                color: '#2f2f2f',
                trailColor: '#000000',
                size: { min: 15, max: 40 },
                speed: { min: 3, max: 9 },
                damage: 25,
                sound: { frequency: 100, wave: 'sawtooth' },
                particles: 12,
                glow: '#696969'
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupControls();
        this.setupEventListeners();
        this.updateDisplays();
        
        // Show info panel briefly on load
        setTimeout(() => {
            document.getElementById('infoPanel').classList.add('show');
            setTimeout(() => {
                document.getElementById('infoPanel').classList.remove('show');
            }, 3000);
        }, 1000);
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupControls() {
        // Sliders
        const spawnRate = document.getElementById('spawnRate');
        const sizeVariation = document.getElementById('sizeVariation');
        const speedFactor = document.getElementById('speedFactor');
        
        spawnRate.addEventListener('input', (e) => {
            this.settings.spawnRate = parseInt(e.target.value);
            document.getElementById('spawnRateValue').textContent = `${e.target.value}ms`;
        });
        
        sizeVariation.addEventListener('input', (e) => {
            this.settings.sizeVariation = parseInt(e.target.value);
            document.getElementById('sizeVariationValue').textContent = `${e.target.value}x`;
        });
        
        speedFactor.addEventListener('input', (e) => {
            this.settings.speedFactor = parseFloat(e.target.value);
            document.getElementById('speedFactorValue').textContent = `${e.target.value}x`;
        });
        
        // Meteor type buttons
        document.querySelectorAll('.meteor-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.meteor-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.currentType = btn.dataset.type;
            });
        });
        
        // Effect toggles
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const effect = btn.id.replace('Toggle', '');
                this.settings.effects[effect] = !this.settings.effects[effect];
                btn.classList.toggle('active');
            });
        });
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('megaStormBtn').addEventListener('click', () => this.megaStorm());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.isRunning ? this.pause() : this.start();
                    break;
                case 'r':
                    this.reset();
                    break;
                case 'm':
                    this.megaStorm();
                    break;
                case '1': this.switchMeteorType('standard'); break;
                case '2': this.switchMeteorType('ice'); break;
                case '3': this.switchMeteorType('plasma'); break;
                case '4': this.switchMeteorType('toxic'); break;
                case '5': this.switchMeteorType('crystal'); break;
                case '6': this.switchMeteorType('dark'); break;
            }
        });
    }
    
    switchMeteorType(type) {
        this.settings.currentType = type;
        document.querySelectorAll('.meteor-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.lastTime = performance.now();
            this.spawnTimer = 0;
            this.animate();
            
            document.getElementById('startBtn').innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">RUNNING</span>';
            document.getElementById('pauseBtn').style.opacity = '1';
        }
    }
    
    pause() {
        if (this.isRunning) {
            this.isPaused = !this.isPaused;
            
            if (!this.isPaused) {
                this.lastTime = performance.now();
                this.animate();
            }
            
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.innerHTML = this.isPaused 
                ? '<span class="btn-icon">▶️</span><span class="btn-text">RESUME</span>'
                : '<span class="btn-icon">⏸️</span><span class="btn-text">PAUSE</span>';
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.meteors = [];
        this.particles = [];
        this.trails = [];
        
        this.stats = {
            impactCounter: 0,
            activeMeteors: 0,
            totalDamage: 0,
            atmosphereHealth: 100
        };
        
        this.updateDisplays();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        document.getElementById('startBtn').innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">START STORM</span>';
        document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">PAUSE</span>';
        document.getElementById('pauseBtn').style.opacity = '0.5';
        
        // Clear impact effects
        document.getElementById('impactEffects').innerHTML = '';
    }
    
    megaStorm() {
        if (!this.isRunning) this.start();
        
        // Spawn multiple meteors of different types
        const types = Object.keys(this.meteorTypes);
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const randomType = types[Math.floor(Math.random() * types.length)];
                this.spawnMeteor(randomType);
            }, i * 100);
        }
        
        this.playSound('megaStorm', 1000, 1.0);
    }
    
    spawnMeteor(type = this.settings.currentType) {
        const meteorType = this.meteorTypes[type];
        const size = this.randomBetween(meteorType.size.min, meteorType.size.max) * this.settings.sizeVariation * 0.2;
        const speed = this.randomBetween(meteorType.speed.min, meteorType.speed.max) * this.settings.speedFactor;
        
        const meteor = {
            x: Math.random() * this.canvas.width,
            y: -size,
            size: size,
            speed: speed,
            angle: this.randomBetween(-30, 30) * Math.PI / 180,
            rotation: 0,
            rotationSpeed: this.randomBetween(-5, 5),
            type: type,
            properties: meteorType,
            life: 1.0,
            trail: []
        };
        
        this.meteors.push(meteor);
        this.stats.activeMeteors++;
    }
    
    animate() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Spawn meteors
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.settings.spawnRate) {
            this.spawnMeteor();
            this.spawnTimer = 0;
        }
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Update meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            
            // Update position
            meteor.x += Math.sin(meteor.angle) * meteor.speed * dt;
            meteor.y += Math.cos(meteor.angle) * meteor.speed * dt;
            meteor.rotation += meteor.rotationSpeed * dt;
            
            // Add trail point
            if (this.settings.effects.trails) {
                meteor.trail.push({ x: meteor.x, y: meteor.y, age: 0 });
                if (meteor.trail.length > 15) {
                    meteor.trail.shift();
                }
                
                // Age trail points
                meteor.trail.forEach(point => point.age += dt);
            }
            
            // Check for impact
            if (meteor.y > this.canvas.height - 50) {
                this.createImpact(meteor);
                this.meteors.splice(i, 1);
                this.stats.activeMeteors--;
                continue;
            }
            
            // Remove meteors that went off screen
            if (meteor.x < -100 || meteor.x > this.canvas.width + 100 || meteor.y > this.canvas.height + 100) {
                this.meteors.splice(i, 1);
                this.stats.activeMeteors--;
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt * 0.02;
            particle.size *= 0.995;
            
            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }
        
        this.updateDisplays();
    }
    
    render() {
        // Clear canvas with subtle fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render trails
        if (this.settings.effects.trails) {
            this.meteors.forEach(meteor => this.renderTrail(meteor));
        }
        
        // Render meteors
        this.meteors.forEach(meteor => this.renderMeteor(meteor));
        
        // Render particles
        if (this.settings.effects.particles) {
            this.particles.forEach(particle => this.renderParticle(particle));
        }
    }
    
    renderMeteor(meteor) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(meteor.x, meteor.y);
        ctx.rotate(meteor.rotation);
        
        // Glow effect
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size * 2);
        glow.addColorStop(0, meteor.properties.glow + 'ff');
        glow.addColorStop(0.5, meteor.properties.glow + '80');
        glow.addColorStop(1, meteor.properties.glow + '00');
        
        ctx.fillStyle = glow;
        ctx.fillRect(-meteor.size * 2, -meteor.size * 2, meteor.size * 4, meteor.size * 4);
        
        // Main meteor body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, meteor.properties.color);
        gradient.addColorStop(1, this.darkenColor(meteor.properties.color, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Surface details
        ctx.fillStyle = this.darkenColor(meteor.properties.color, 0.5) + '80';
        for (let i = 0; i < 3; i++) {
            const angle = (meteor.rotation + i * 2.1) % (Math.PI * 2);
            const distance = meteor.size * 0.3;
            const craterSize = meteor.size * 0.15;
            
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance,
                craterSize,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderTrail(meteor) {
        if (meteor.trail.length < 2) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        for (let i = 1; i < meteor.trail.length; i++) {
            const point = meteor.trail[i];
            const prevPoint = meteor.trail[i - 1];
            const alpha = Math.max(0, 1 - point.age * 0.1);
            const width = meteor.size * 0.5 * alpha;
            
            ctx.strokeStyle = meteor.properties.trailColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    renderParticle(particle) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = particle.life;
        
        const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, particle.color + 'ff');
        gradient.addColorStop(1, particle.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    createImpact(meteor) {
        this.stats.impactCounter++;
        this.stats.totalDamage += meteor.properties.damage;
        this.stats.atmosphereHealth = Math.max(0, this.stats.atmosphereHealth - meteor.properties.damage * 0.1);
        
        // Sound effect
        if (this.settings.effects.sound) {
            this.playSound(meteor.type, meteor.properties.sound.frequency, meteor.size / 20);
        }
        
        // Screen shake
        if (this.settings.effects.shake && meteor.size > 10) {
            this.screenShake();
        }
        
        // Visual impact effect
        this.createImpactFlash(meteor.x, this.canvas.height - 25, meteor.size * 2, meteor.properties.color);
        
        // Particles
        if (this.settings.effects.particles) {
            this.createImpactParticles(meteor.x, this.canvas.height - 25, meteor);
        }
        
        // Debris
        this.createDebris(meteor.x, this.canvas.height - 25, meteor);
    }
    
    createImpactFlash(x, y, size, color) {
        const flash = document.createElement('div');
        flash.className = 'impact-flash';
        flash.style.left = x + 'px';
        flash.style.top = y + 'px';
        flash.style.width = size + 'px';
        flash.style.height = size + 'px';
        flash.style.background = `radial-gradient(circle, ${color}ff 0%, ${color}80 50%, transparent 100%)`;
        
        document.getElementById('impactEffects').appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 600);
    }
    
    createImpactParticles(x, y, meteor) {
        const particleCount = meteor.properties.particles;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + this.randomBetween(-0.3, 0.3);
            const speed = this.randomBetween(2, 8);
            const size = this.randomBetween(2, 6);
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - this.randomBetween(1, 3),
                size: size,
                life: 1.0,
                color: meteor.properties.color
            });
        }
    }
    
    createDebris(x, y, meteor) {
        for (let i = 0; i < 8; i++) {
            const debris = document.createElement('div');
            debris.className = 'debris-particle';
            debris.style.left = x + 'px';
            debris.style.top = y + 'px';
            debris.style.background = meteor.properties.color;
            
            const dx = this.randomBetween(-100, 100) + 'px';
            const dy = this.randomBetween(-50, -150) + 'px';
            debris.style.setProperty('--dx', dx);
            debris.style.setProperty('--dy', dy);
            
            document.getElementById('impactEffects').appendChild(debris);
            
            setTimeout(() => {
                if (debris.parentNode) {
                    debris.parentNode.removeChild(debris);
                }
            }, 1000);
        }
    }
    
    screenShake() {
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 500);
    }
    
    playSound(type, frequency, volume = 0.3) {
        if (!this.settings.effects.sound) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filterNode = audioContext.createBiquadFilter();
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            let freq, duration, waveform;
            
            if (type === 'megaStorm') {
                freq = 80;
                duration = 1.0;
                waveform = 'sawtooth';
                volume = 0.5;
            } else {
                const meteorType = this.meteorTypes[type];
                freq = frequency || meteorType.sound.frequency;
                duration = 0.3;
                waveform = meteorType.sound.wave;
            }
            
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, audioContext.currentTime + duration);
            
            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(freq * 4, audioContext.currentTime);
            filterNode.frequency.exponentialRampToValueAtTime(freq, audioContext.currentTime + duration);
            
            gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    updateDisplays() {
        document.getElementById('impactCounter').textContent = this.stats.impactCounter;
        document.getElementById('activeMeteors').textContent = this.stats.activeMeteors;
        document.getElementById('totalDamage').textContent = this.stats.totalDamage;
        document.getElementById('atmosphereHealth').textContent = Math.floor(this.stats.atmosphereHealth);
        
        // Update atmosphere health color
        const healthElement = document.getElementById('atmosphereHealth');
        if (this.stats.atmosphereHealth > 70) {
            healthElement.style.color = 'var(--neon-green)';
        } else if (this.stats.atmosphereHealth > 30) {
            healthElement.style.color = 'var(--neon-yellow)';
        } else {
            healthElement.style.color = 'var(--neon-red)';
        }
    }
    
    // Utility functions
    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    darkenColor(color, factor) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// Initialize the meteor storm generator
document.addEventListener('DOMContentLoaded', () => {
    const meteorStorm = new UltraMeteorStormGenerator();
    
    // Add some startup effects
    console.log('🌠 Ultra Meteor Storm Generator v1.0 Initialized');
    console.log('🎮 Controls: Space=Start/Pause, R=Reset, M=Mega Storm, 1-6=Meteor Types');
    console.log('🎯 Features: 6 Meteor Types, Realistic Physics, Dynamic Audio, Particle Systems');
    
    // Auto-start after 2 seconds for demo
    setTimeout(() => {
        if (!meteorStorm.isRunning) {
            meteorStorm.start();
        }
    }, 2000);
});