class MeteorSystem {
    constructor() {
        this.canvas = document.getElementById('meteorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.meteors = [];
        this.explosions = [];
        this.particles = [];
        this.stars = [];
        this.audioContext = null;
        this.soundEnabled = true;
        this.animationId = null;
        
        this.meteorCount = 0;
        this.explosionCount = 0;
        this.lastFpsTime = Date.now();
        this.frameCount = 0;
        
        this.init();
        this.createStarField();
        this.animate();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', (e) => this.createMeteorAtPosition(e));
        this.initAudio();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
            this.soundEnabled = false;
        }
    }
    
    playSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createStarField() {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2,
                opacity: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    createMeteorAtPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.createMeteor(x, y);
    }
    
    createMeteor(startX = null, startY = null) {
        const meteorType = document.getElementById('meteorType').value;
        const size = parseInt(document.getElementById('meteorSize').value);
        const speed = parseInt(document.getElementById('fallSpeed').value);
        
        const meteor = {
            x: startX || Math.random() * this.canvas.width,
            y: startY || -50,
            size: size + Math.random() * 20,
            speed: speed + Math.random() * 5,
            angle: Math.random() * Math.PI * 2,
            rotation: Math.random() * 0.1,
            type: meteorType,
            trail: [],
            life: 1.0,
            heat: Math.random() * 100 + 50
        };
        
        meteor.vx = Math.sin(meteor.angle) * meteor.speed * 0.3;
        meteor.vy = Math.cos(meteor.angle) * meteor.speed + Math.random() * 2;
        
        this.meteors.push(meteor);
        this.meteorCount++;
        
        // 隕石生成音
        this.playSound(200 + Math.random() * 300, 0.1, 'sawtooth', 0.05);
    }
    
    createExplosion(x, y, size, type) {
        const explosion = {
            x: x,
            y: y,
            particles: [],
            life: 1.0,
            maxLife: 60,
            type: type
        };
        
        // パーティクル生成
        const particleCount = Math.floor(size / 2) + 20;
        for (let i = 0; i < particleCount; i++) {
            explosion.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * (size / 2),
                vy: (Math.random() - 0.5) * (size / 2),
                size: Math.random() * 8 + 2,
                life: Math.random() * 60 + 30,
                maxLife: Math.random() * 60 + 30,
                color: this.getExplosionColor(type),
                gravity: Math.random() * 0.2
            });
        }
        
        this.explosions.push(explosion);
        this.explosionCount++;
        
        // 爆発音
        this.playSound(80 + Math.random() * 200, 0.5, 'square', 0.15);
        
        // 大きな隕石の場合は警告表示
        if (size > 70) {
            this.showImpactWarning();
        }
    }
    
    getExplosionColor(type) {
        const colors = {
            classic: ['#ff6b35', '#f7931e', '#ffcd3c'],
            fire: ['#ff0000', '#ff4500', '#ffa500'],
            ice: ['#00ffff', '#87ceeb', '#b0e0e6'],
            metal: ['#c0c0c0', '#696969', '#dcdcdc'],
            rainbow: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
            dark: ['#800080', '#4b0082', '#2f4f4f']
        };
        
        const typeColors = colors[type] || colors.classic;
        return typeColors[Math.floor(Math.random() * typeColors.length)];
    }
    
    showImpactWarning() {
        const warning = document.getElementById('impactWarning');
        warning.style.display = 'block';
        setTimeout(() => {
            warning.style.display = 'none';
        }, 2000);
    }
    
    drawStar(star) {
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0) {
            star.twinkleSpeed *= -1;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = Math.abs(star.opacity);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawMeteor(meteor) {
        this.ctx.save();
        
        // トレイル効果
        meteor.trail.unshift({ x: meteor.x, y: meteor.y });
        if (meteor.trail.length > 20) {
            meteor.trail.pop();
        }
        
        // トレイル描画
        for (let i = 0; i < meteor.trail.length; i++) {
            const alpha = (meteor.trail.length - i) / meteor.trail.length;
            const size = meteor.size * alpha * 0.8;
            
            this.ctx.globalAlpha = alpha * 0.6;
            this.ctx.fillStyle = this.getMeteorColor(meteor.type, alpha);
            this.ctx.beginPath();
            this.ctx.arc(meteor.trail[i].x, meteor.trail[i].y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // メイン隕石描画
        this.ctx.globalAlpha = meteor.life;
        this.ctx.translate(meteor.x, meteor.y);
        this.ctx.rotate(meteor.rotation);
        
        // グラデーション効果
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size);
        gradient.addColorStop(0, this.getMeteorColor(meteor.type, 1));
        gradient.addColorStop(0.7, this.getMeteorColor(meteor.type, 0.8));
        gradient.addColorStop(1, this.getMeteorColor(meteor.type, 0.2));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内部のディテール
        if (meteor.type !== 'dark') {
            this.ctx.fillStyle = this.getMeteorColor(meteor.type, 0.5);
            this.ctx.beginPath();
            this.ctx.arc(meteor.size * 0.3, -meteor.size * 0.3, meteor.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 熱による発光効果
        if (meteor.heat > 70) {
            this.ctx.shadowColor = this.getMeteorColor(meteor.type, 1);
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = this.getMeteorColor(meteor.type, 0.3);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, meteor.size * 1.2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    getMeteorColor(type, alpha) {
        const colors = {
            classic: `rgba(255, 107, 53, ${alpha})`,
            fire: `rgba(255, 0, 0, ${alpha})`,
            ice: `rgba(173, 216, 230, ${alpha})`,
            metal: `rgba(192, 192, 192, ${alpha})`,
            rainbow: `hsl(${Date.now() * 0.1 % 360}, 100%, 50%)`,
            dark: `rgba(75, 0, 130, ${alpha})`
        };
        
        return colors[type] || colors.classic;
    }
    
    drawExplosion(explosion) {
        explosion.particles.forEach(particle => {
            if (particle.life <= 0) return;
            
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            // パーティクルのサイズアニメーション
            const currentSize = particle.size * (0.5 + alpha * 0.5);
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 発光効果
            if (alpha > 0.5) {
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
            }
            
            this.ctx.restore();
            
            // パーティクル更新
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            particle.life--;
        });
        
        explosion.particles = explosion.particles.filter(p => p.life > 0);
        explosion.life--;
    }
    
    updateMeteors() {
        this.meteors.forEach(meteor => {
            meteor.x += meteor.vx;
            meteor.y += meteor.vy;
            meteor.rotation += 0.05;
            meteor.vy += 0.1; // 重力効果
            
            // 地面との衝突判定
            if (meteor.y > this.canvas.height - meteor.size) {
                this.createExplosion(meteor.x, meteor.y, meteor.size, meteor.type);
                meteor.life = 0;
            }
            
            // 画面外判定
            if (meteor.x < -meteor.size || meteor.x > this.canvas.width + meteor.size) {
                meteor.life = 0;
            }
        });
        
        // 生存している隕石のみ保持
        this.meteors = this.meteors.filter(meteor => meteor.life > 0);
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            this.drawExplosion(explosion);
            return explosion.particles.length > 0 && explosion.life > 0;
        });
    }
    
    updateStats() {
        document.getElementById('meteorCount').textContent = this.meteorCount;
        document.getElementById('explosionCount').textContent = this.explosionCount;
        document.getElementById('soundStatus').textContent = this.soundEnabled ? 'ON' : 'OFF';
        
        // FPS計算
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFpsTime >= 1000) {
            document.getElementById('fpsCounter').textContent = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }
    }
    
    animate() {
        // 背景クリア
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 星空描画
        this.stars.forEach(star => this.drawStar(star));
        
        // 隕石更新と描画
        this.meteors.forEach(meteor => this.drawMeteor(meteor));
        this.updateMeteors();
        
        // 爆発更新
        this.updateExplosions();
        
        // 統計更新
        this.updateStats();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    startMeteorShower() {
        const density = parseInt(document.getElementById('meteorDensity').value);
        
        // 隕石シャワー開始音
        this.playSound(150, 0.2, 'triangle', 0.1);
        
        for (let i = 0; i < density; i++) {
            setTimeout(() => {
                this.createMeteor();
            }, i * 100 + Math.random() * 200);
        }
    }
    
    clearScreen() {
        this.meteors = [];
        this.explosions = [];
        this.particles = [];
        this.ctx.fillStyle = 'rgba(27, 39, 53, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.createStarField();
        
        // クリア音
        this.playSound(440, 0.3, 'sine', 0.08);
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        if (this.soundEnabled && !this.audioContext) {
            this.initAudio();
        }
    }
}

// アプリケーション初期化
let meteorSystem;

window.addEventListener('DOMContentLoaded', () => {
    meteorSystem = new MeteorSystem();
});

// グローバル関数
function startMeteorShower() {
    meteorSystem.startMeteorShower();
}

function clearScreen() {
    meteorSystem.clearScreen();
}

function toggleSound() {
    meteorSystem.toggleSound();
}

// 自動隕石生成
setInterval(() => {
    if (meteorSystem && Math.random() < 0.3) {
        meteorSystem.createMeteor();
    }
}, 2000);

// ウィンドウフォーカス時の音声コンテキスト再開
window.addEventListener('focus', () => {
    if (meteorSystem && meteorSystem.audioContext && meteorSystem.audioContext.state === 'suspended') {
        meteorSystem.audioContext.resume();
    }
});

// タッチイベント対応
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (meteorSystem && meteorSystem.audioContext && meteorSystem.audioContext.state === 'suspended') {
        meteorSystem.audioContext.resume();
    }
});

// 自動保存機能（統計データ）
setInterval(() => {
    const stats = {
        meteorCount: meteorSystem?.meteorCount || 0,
        explosionCount: meteorSystem?.explosionCount || 0,
        timestamp: Date.now()
    };
    localStorage.setItem('meteorSystemStats', JSON.stringify(stats));
}, 10000);

// 統計データの復元
window.addEventListener('load', () => {
    const savedStats = localStorage.getItem('meteorSystemStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        if (meteorSystem) {
            meteorSystem.meteorCount = stats.meteorCount || 0;
            meteorSystem.explosionCount = stats.explosionCount || 0;
        }
    }
});