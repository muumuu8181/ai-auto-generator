class ParticlePhysicsSimulator {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isPaused = false;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.collisionCount = 0;
        this.trailMode = 'normal';
        this.gravityWells = [];
        this.forceFields = [];
        
        this.settings = {
            particleCount: 50,
            gravity: 0.1,
            restitution: 0.8,
            friction: 0.99,
            particleSize: 3,
            trailLength: 20,
            timeScale: 1.0,
            collisionEffects: true,
            backgroundFade: true
        };

        this.colors = {
            normal: ['#4ecdc4', '#45b7d1', '#96ceb4', '#f9ca24', '#ff6b6b'],
            fire: ['#ff4757', '#ff6348', '#ff7675', '#fdcb6e', '#e17055'],
            rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080'],
            glow: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0000']
        };

        this.initCanvas();
        this.setupEventListeners();
        this.createInitialParticles();
        this.animate();
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    setupEventListeners() {
        document.getElementById('particleCountSlider').addEventListener('input', (e) => {
            this.settings.particleCount = parseInt(e.target.value);
            document.getElementById('particleCountValue').textContent = e.target.value;
            this.adjustParticleCount();
        });

        document.getElementById('gravitySlider').addEventListener('input', (e) => {
            this.settings.gravity = parseFloat(e.target.value);
            document.getElementById('gravityValue').textContent = e.target.value;
        });

        document.getElementById('restitutionSlider').addEventListener('input', (e) => {
            this.settings.restitution = parseFloat(e.target.value);
            document.getElementById('restitutionValue').textContent = e.target.value;
        });

        document.getElementById('frictionSlider').addEventListener('input', (e) => {
            this.settings.friction = parseFloat(e.target.value);
            document.getElementById('frictionValue').textContent = e.target.value;
        });

        document.getElementById('particleSizeSlider').addEventListener('input', (e) => {
            this.settings.particleSize = parseInt(e.target.value);
            document.getElementById('particleSizeValue').textContent = e.target.value;
        });

        document.getElementById('trailLengthSlider').addEventListener('input', (e) => {
            this.settings.trailLength = parseInt(e.target.value);
            document.getElementById('trailLengthValue').textContent = e.target.value;
        });

        document.getElementById('timeScaleSlider').addEventListener('input', (e) => {
            this.settings.timeScale = parseFloat(e.target.value);
            document.getElementById('timeScaleValue').textContent = e.target.value;
        });

        document.getElementById('collisionEffects').addEventListener('change', (e) => {
            this.settings.collisionEffects = e.target.checked;
        });

        document.getElementById('backgroundFade').addEventListener('change', (e) => {
            this.settings.backgroundFade = e.target.checked;
        });
    }

    createParticle(x, y, vx = 0, vy = 0) {
        const colorArray = this.colors[this.trailMode] || this.colors.normal;
        return {
            x: x || Math.random() * this.width,
            y: y || Math.random() * this.height,
            vx: vx || (Math.random() - 0.5) * 4,
            vy: vy || (Math.random() - 0.5) * 4,
            ax: 0,
            ay: 0,
            radius: this.settings.particleSize + Math.random() * 2,
            mass: 1 + Math.random() * 2,
            color: colorArray[Math.floor(Math.random() * colorArray.length)],
            trail: [],
            energy: 0,
            collisionEffect: 0
        };
    }

    createInitialParticles() {
        this.particles = [];
        for (let i = 0; i < this.settings.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    adjustParticleCount() {
        const currentCount = this.particles.length;
        const targetCount = this.settings.particleCount;
        
        if (currentCount < targetCount) {
            for (let i = currentCount; i < targetCount; i++) {
                this.particles.push(this.createParticle());
            }
        } else if (currentCount > targetCount) {
            this.particles = this.particles.slice(0, targetCount);
        }
    }

    rungeKuttaIntegration(particle, dt) {
        const k1 = {
            x: particle.vx * dt,
            y: particle.vy * dt,
            vx: particle.ax * dt,
            vy: particle.ay * dt
        };

        const k2 = {
            x: (particle.vx + k1.vx / 2) * dt,
            y: (particle.vy + k1.vy / 2) * dt,
            vx: this.calculateAcceleration(particle, particle.x + k1.x / 2, particle.y + k1.y / 2).ax * dt,
            vy: this.calculateAcceleration(particle, particle.x + k1.x / 2, particle.y + k1.y / 2).ay * dt
        };

        const k3 = {
            x: (particle.vx + k2.vx / 2) * dt,
            y: (particle.vy + k2.vy / 2) * dt,
            vx: this.calculateAcceleration(particle, particle.x + k2.x / 2, particle.y + k2.y / 2).ax * dt,
            vy: this.calculateAcceleration(particle, particle.x + k2.x / 2, particle.y + k2.y / 2).ay * dt
        };

        const k4 = {
            x: (particle.vx + k3.vx) * dt,
            y: (particle.vy + k3.vy) * dt,
            vx: this.calculateAcceleration(particle, particle.x + k3.x, particle.y + k3.y).ax * dt,
            vy: this.calculateAcceleration(particle, particle.x + k3.x, particle.y + k3.y).ay * dt
        };

        particle.x += (k1.x + 2 * k2.x + 2 * k3.x + k4.x) / 6;
        particle.y += (k1.y + 2 * k2.y + 2 * k3.y + k4.y) / 6;
        particle.vx += (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx) / 6;
        particle.vy += (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy) / 6;
    }

    calculateAcceleration(particle, x, y) {
        let ax = 0;
        let ay = this.settings.gravity;

        for (const well of this.gravityWells) {
            const dx = well.x - x;
            const dy = well.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                const force = well.strength / (distance * distance);
                ax += force * dx / distance;
                ay += force * dy / distance;
            }
        }

        for (const field of this.forceFields) {
            const dx = x - field.x;
            const dy = y - field.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < field.radius) {
                const strength = field.strength * (1 - distance / field.radius);
                ax += strength * Math.cos(field.angle);
                ay += strength * Math.sin(field.angle);
            }
        }

        return { ax, ay };
    }

    updatePhysics(dt) {
        this.collisionCount = 0;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            const acceleration = this.calculateAcceleration(particle, particle.x, particle.y);
            particle.ax = acceleration.ax;
            particle.ay = acceleration.ay;
            
            this.rungeKuttaIntegration(particle, dt);
            
            particle.vx *= this.settings.friction;
            particle.vy *= this.settings.friction;
            
            particle.energy = 0.5 * particle.mass * (particle.vx * particle.vx + particle.vy * particle.vy);
            
            if (particle.trail.length > this.settings.trailLength) {
                particle.trail.shift();
            }
            particle.trail.push({ x: particle.x, y: particle.y });
            
            this.handleBoundaryCollision(particle);
            
            for (let j = i + 1; j < this.particles.length; j++) {
                this.handleParticleCollision(particle, this.particles[j]);
            }
            
            if (particle.collisionEffect > 0) {
                particle.collisionEffect -= dt * 60;
            }
        }
    }

    handleBoundaryCollision(particle) {
        if (particle.x - particle.radius < 0) {
            particle.x = particle.radius;
            particle.vx = -particle.vx * this.settings.restitution;
            this.createCollisionEffect(particle);
        }
        if (particle.x + particle.radius > this.width) {
            particle.x = this.width - particle.radius;
            particle.vx = -particle.vx * this.settings.restitution;
            this.createCollisionEffect(particle);
        }
        if (particle.y - particle.radius < 0) {
            particle.y = particle.radius;
            particle.vy = -particle.vy * this.settings.restitution;
            this.createCollisionEffect(particle);
        }
        if (particle.y + particle.radius > this.height) {
            particle.y = this.height - particle.radius;
            particle.vy = -particle.vy * this.settings.restitution;
            this.createCollisionEffect(particle);
        }
    }

    handleParticleCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = p1.radius + p2.radius;

        if (distance < minDistance) {
            this.collisionCount++;
            
            const overlap = minDistance - distance;
            const separationX = (dx / distance) * overlap * 0.5;
            const separationY = (dy / distance) * overlap * 0.5;
            
            p1.x -= separationX;
            p1.y -= separationY;
            p2.x += separationX;
            p2.y += separationY;
            
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            const relativeVelX = p2.vx - p1.vx;
            const relativeVelY = p2.vy - p1.vy;
            
            const speed = relativeVelX * normalX + relativeVelY * normalY;
            
            if (speed < 0) return;
            
            const impulse = 2 * speed / (p1.mass + p2.mass);
            
            p1.vx += impulse * p2.mass * normalX * this.settings.restitution;
            p1.vy += impulse * p2.mass * normalY * this.settings.restitution;
            p2.vx -= impulse * p1.mass * normalX * this.settings.restitution;
            p2.vy -= impulse * p1.mass * normalY * this.settings.restitution;
            
            if (this.settings.collisionEffects) {
                this.createCollisionEffect(p1);
                this.createCollisionEffect(p2);
            }
        }
    }

    createCollisionEffect(particle) {
        particle.collisionEffect = 15;
    }

    render() {
        if (this.settings.backgroundFade) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }

        for (const particle of this.particles) {
            this.renderParticleTrail(particle);
            this.renderParticle(particle);
        }

        this.renderForceFields();
        this.updatePerformanceInfo();
        this.updatePhysicsInfo();
    }

    renderParticleTrail(particle) {
        if (particle.trail.length < 2 || this.settings.trailLength === 0) return;

        this.ctx.lineWidth = 1;
        
        for (let i = 1; i < particle.trail.length; i++) {
            const point = particle.trail[i];
            const prevPoint = particle.trail[i - 1];
            const alpha = i / particle.trail.length;
            
            let color = particle.color;
            
            switch (this.trailMode) {
                case 'glow':
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = color;
                    break;
                case 'rainbow':
                    const hue = (i * 360 / particle.trail.length + this.frameCount) % 360;
                    color = `hsl(${hue}, 100%, 50%)`;
                    break;
                case 'fire':
                    const fireColors = ['#ff4757', '#ff6348', '#ff7675', '#fdcb6e'];
                    color = fireColors[Math.floor(Math.random() * fireColors.length)];
                    break;
            }
            
            this.ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.moveTo(prevPoint.x, prevPoint.y);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
        }
    }

    renderParticle(particle) {
        this.ctx.save();
        
        let size = particle.radius;
        let color = particle.color;
        
        if (particle.collisionEffect > 0) {
            size += particle.collisionEffect * 0.5;
            this.ctx.shadowBlur = particle.collisionEffect;
            this.ctx.shadowColor = color;
        }
        
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, size
        );
        
        switch (this.trailMode) {
            case 'glow':
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.7, color + '80');
                gradient.addColorStop(1, color + '00');
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = color;
                break;
            case 'rainbow':
                const hue = (this.frameCount + particle.x + particle.y) % 360;
                color = `hsl(${hue}, 100%, 50%)`;
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, color + '40');
                break;
            case 'fire':
                const fireGradient = this.ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, size
                );
                fireGradient.addColorStop(0, '#ffffff');
                fireGradient.addColorStop(0.3, '#ffff00');
                fireGradient.addColorStop(0.6, '#ff6348');
                fireGradient.addColorStop(1, '#ff4757');
                this.ctx.fillStyle = fireGradient;
                break;
            default:
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.8, color + '80');
                gradient.addColorStop(1, color + '20');
        }
        
        if (this.trailMode !== 'fire') {
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    renderForceFields() {
        for (const field of this.forceFields) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    updatePerformanceInfo() {
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (now - this.lastTime));
            this.frameCount = 0;
            this.lastTime = now;
        }
        this.frameCount++;

        document.getElementById('performanceInfo').textContent = 
            `FPS: ${this.fps} | 粒子数: ${this.particles.length} | 衝突: ${this.collisionCount}`;
    }

    updatePhysicsInfo() {
        const totalEnergy = this.particles.reduce((sum, p) => sum + p.energy, 0);
        const avgVelocity = this.particles.reduce((sum, p) => 
            sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;

        document.getElementById('physicsInfo').innerHTML = `
            <strong>物理統計:</strong><br>
            総エネルギー: ${totalEnergy.toFixed(2)}<br>
            平均速度: ${avgVelocity.toFixed(2)}<br>
            重力: ${this.settings.gravity}<br>
            反発係数: ${this.settings.restitution}<br>
            時間倍率: ${this.settings.timeScale}x
        `;
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (e.shiftKey) {
            this.gravityWells.push({
                x: x,
                y: y,
                strength: 50
            });
        } else {
            const particle = this.createParticle(x, y, 
                (Math.random() - 0.5) * 10, 
                (Math.random() - 0.5) * 10
            );
            this.particles.push(particle);
        }
    }

    handleMouseMove(e) {
        if (e.buttons === 1 && !e.shiftKey) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const particle = this.createParticle(x, y);
            this.particles.push(particle);
            
            if (this.particles.length > this.settings.particleCount + 100) {
                this.particles.shift();
            }
        }
    }

    animate() {
        if (!this.isPaused) {
            const dt = 1/60 * this.settings.timeScale;
            this.updatePhysics(dt);
        }
        
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

function addParticles(count) {
    for (let i = 0; i < count; i++) {
        simulator.particles.push(simulator.createParticle());
    }
    document.getElementById('particleCountSlider').value = simulator.particles.length;
    document.getElementById('particleCountValue').textContent = simulator.particles.length;
    simulator.settings.particleCount = simulator.particles.length;
}

function clearParticles() {
    simulator.particles = [];
    simulator.gravityWells = [];
    simulator.forceFields = [];
    document.getElementById('particleCountSlider').value = 0;
    document.getElementById('particleCountValue').textContent = 0;
    simulator.settings.particleCount = 0;
}

function setTrailMode(mode) {
    simulator.trailMode = mode;
    
    document.querySelectorAll('.trail-option').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    
    const colorArray = simulator.colors[mode] || simulator.colors.normal;
    simulator.particles.forEach(particle => {
        particle.color = colorArray[Math.floor(Math.random() * colorArray.length)];
    });
}

function togglePause() {
    simulator.isPaused = !simulator.isPaused;
    const btn = document.getElementById('pauseBtn');
    btn.textContent = simulator.isPaused ? '▶ 再生' : '⏸ 一時停止';
}

function resetSimulation() {
    simulator.particles = [];
    simulator.gravityWells = [];
    simulator.forceFields = [];
    simulator.createInitialParticles();
    simulator.isPaused = false;
    document.getElementById('pauseBtn').textContent = '⏸ 一時停止';
}

function loadPreset(preset) {
    simulator.particles = [];
    simulator.gravityWells = [];
    simulator.forceFields = [];
    
    switch (preset) {
        case 'gravity':
            simulator.settings.gravity = 0.3;
            simulator.settings.restitution = 0.7;
            simulator.settings.friction = 0.98;
            for (let i = 0; i < 100; i++) {
                const particle = simulator.createParticle(
                    Math.random() * simulator.width,
                    Math.random() * simulator.height * 0.2
                );
                simulator.particles.push(particle);
            }
            break;
            
        case 'bounce':
            simulator.settings.gravity = 0.1;
            simulator.settings.restitution = 0.95;
            simulator.settings.friction = 0.999;
            for (let i = 0; i < 50; i++) {
                const particle = simulator.createParticle();
                particle.vx = (Math.random() - 0.5) * 8;
                particle.vy = (Math.random() - 0.5) * 8;
                simulator.particles.push(particle);
            }
            break;
            
        case 'explosion':
            simulator.settings.gravity = 0.05;
            simulator.settings.restitution = 0.8;
            simulator.settings.friction = 0.995;
            const centerX = simulator.width / 2;
            const centerY = simulator.height / 2;
            for (let i = 0; i < 200; i++) {
                const angle = (i / 200) * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                const particle = simulator.createParticle(centerX, centerY);
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                simulator.particles.push(particle);
            }
            break;
            
        case 'orbit':
            simulator.settings.gravity = 0;
            simulator.settings.restitution = 1.0;
            simulator.settings.friction = 1.0;
            simulator.gravityWells.push({
                x: simulator.width / 2,
                y: simulator.height / 2,
                strength: 100
            });
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 100 + Math.random() * 100;
                const x = simulator.width / 2 + Math.cos(angle) * radius;
                const y = simulator.height / 2 + Math.sin(angle) * radius;
                const speed = Math.sqrt(100 / radius) * 2;
                const particle = simulator.createParticle(x, y);
                particle.vx = -Math.sin(angle) * speed;
                particle.vy = Math.cos(angle) * speed;
                simulator.particles.push(particle);
            }
            break;
            
        case 'chaos':
            simulator.settings.gravity = 0.2;
            simulator.settings.restitution = 0.9;
            simulator.settings.friction = 0.99;
            for (let i = 0; i < 5; i++) {
                simulator.gravityWells.push({
                    x: Math.random() * simulator.width,
                    y: Math.random() * simulator.height,
                    strength: 20 + Math.random() * 30
                });
            }
            for (let i = 0; i < 150; i++) {
                simulator.particles.push(simulator.createParticle());
            }
            break;
            
        case 'galaxy':
            simulator.settings.gravity = 0;
            simulator.settings.restitution = 1.0;
            simulator.settings.friction = 0.999;
            simulator.gravityWells.push({
                x: simulator.width / 2,
                y: simulator.height / 2,
                strength: 200
            });
            for (let i = 0; i < 300; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 50 + Math.random() * 200;
                const x = simulator.width / 2 + Math.cos(angle) * radius;
                const y = simulator.height / 2 + Math.sin(angle) * radius;
                const speed = Math.sqrt(200 / radius) * (0.8 + Math.random() * 0.4);
                const particle = simulator.createParticle(x, y);
                particle.vx = -Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5;
                particle.vy = Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5;
                simulator.particles.push(particle);
            }
            break;
    }
    
    document.getElementById('gravitySlider').value = simulator.settings.gravity;
    document.getElementById('gravityValue').textContent = simulator.settings.gravity;
    document.getElementById('restitutionSlider').value = simulator.settings.restitution;
    document.getElementById('restitutionValue').textContent = simulator.settings.restitution;
    document.getElementById('frictionSlider').value = simulator.settings.friction;
    document.getElementById('frictionValue').textContent = simulator.settings.friction;
    
    document.getElementById('particleCountSlider').value = simulator.particles.length;
    document.getElementById('particleCountValue').textContent = simulator.particles.length;
    simulator.settings.particleCount = simulator.particles.length;
}

let simulator;

document.addEventListener('DOMContentLoaded', () => {
    simulator = new ParticlePhysicsSimulator();
    
    setTimeout(() => {
        simulator.resizeCanvas();
    }, 100);
});