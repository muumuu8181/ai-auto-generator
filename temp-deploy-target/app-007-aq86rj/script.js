class RPGEffectSystem {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.soundEnabled = true;
        
        // ゲーム状態
        this.effects = [];
        this.enemies = [];
        this.particles = [];
        this.currentEnemy = null;
        
        // 統計
        this.stats = {
            totalAttacks: 0,
            totalDamage: 0,
            comboCount: 0,
            maxCombo: 0,
            lastAttackTime: 0
        };
        
        this.init();
        this.createEnemies();
        this.animate();
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.initAudio();
        this.setupEventListeners();
        this.loadStats();
        
        // デフォルト敵を配置
        this.selectEnemy('goblin');
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
            this.soundEnabled = false;
        }
    }
    
    setupEventListeners() {
        document.getElementById('effectPower').addEventListener('input', (e) => {
            document.getElementById('powerValue').textContent = e.target.value;
        });
        
        document.getElementById('effectDuration').addEventListener('input', (e) => {
            document.getElementById('durationValue').textContent = (e.target.value / 1000).toFixed(1);
        });
    }
    
    createEnemies() {
        const enemyTypes = {
            goblin: { emoji: '👹', name: 'ゴブリン', hp: 100, color: '#8b4513' },
            orc: { emoji: '👺', name: 'オーク', hp: 150, color: '#654321' },
            dragon: { emoji: '🐉', name: 'ドラゴン', hp: 300, color: '#dc143c' },
            skeleton: { emoji: '💀', name: 'スケルトン', hp: 80, color: '#f5f5dc' },
            demon: { emoji: '😈', name: 'デーモン', hp: 200, color: '#8b0000' },
            wizard: { emoji: '🧙', name: '魔法使い', hp: 120, color: '#4b0082' }
        };
        
        this.enemyTypes = enemyTypes;
    }
    
    selectEnemy(type) {
        const enemyData = this.enemyTypes[type];
        this.currentEnemy = {
            type: type,
            ...enemyData,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            maxHp: enemyData.hp,
            currentHp: enemyData.hp,
            size: 80,
            rotation: 0,
            shakeOffset: { x: 0, y: 0 }
        };
        
        document.getElementById('effectDescription').textContent = 
            `${enemyData.name}を選択しました。HP: ${enemyData.hp}`;
    }
    
    executeAttack() {
        if (!this.currentEnemy) return;
        
        const attackType = document.getElementById('attackType').value;
        const power = parseInt(document.getElementById('effectPower').value);
        const duration = parseInt(document.getElementById('effectDuration').value);
        
        this.createEffect(attackType, power, duration);
        this.updateStats();
        this.updateEffectInfo(attackType, power, duration);
    }
    
    randomAttack() {
        const attackTypes = ['slash', 'punch', 'fireball', 'lightning', 'ice', 'explosion', 'heal', 'poison', 'dark'];
        const randomType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        const randomPower = Math.floor(Math.random() * 10) + 1;
        const randomDuration = Math.floor(Math.random() * 9.5 * 1000) + 500;
        
        document.getElementById('attackType').value = randomType;
        document.getElementById('effectPower').value = randomPower;
        document.getElementById('effectDuration').value = randomDuration;
        document.getElementById('powerValue').textContent = randomPower;
        document.getElementById('durationValue').textContent = (randomDuration / 1000).toFixed(1);
        
        this.createEffect(randomType, randomPower, randomDuration);
        this.updateStats();
        this.updateEffectInfo(randomType, randomPower, randomDuration);
    }
    
    ultimateCombo() {
        const comboAttacks = [
            { type: 'slash', power: 8, duration: 1000 },
            { type: 'fireball', power: 9, duration: 1500 },
            { type: 'lightning', power: 10, duration: 2000 },
            { type: 'explosion', power: 10, duration: 3000 }
        ];
        
        comboAttacks.forEach((attack, index) => {
            setTimeout(() => {
                this.createEffect(attack.type, attack.power, attack.duration);
                if (index === comboAttacks.length - 1) {
                    this.stats.comboCount += comboAttacks.length;
                    this.updateStats();
                }
            }, index * 800);
        });
        
        document.getElementById('effectDescription').textContent = 
            '必殺コンボ！4連続攻撃を実行中...';
    }
    
    createEffect(type, power, duration) {
        if (!this.currentEnemy) return;
        
        const effect = {
            type: type,
            power: power,
            duration: duration,
            timeLeft: duration,
            x: this.currentEnemy.x,
            y: this.currentEnemy.y,
            particles: [],
            color: this.getEffectColor(type),
            damage: Math.floor(power * 10 + Math.random() * 20)
        };
        
        // パーティクル生成
        this.createParticles(effect);
        
        // エフェクト追加
        this.effects.push(effect);
        
        // 敵にダメージ
        this.dealDamage(effect.damage);
        
        // 敵を揺らす
        this.shakeEnemy();
        
        // 音響効果
        this.playEffectSound(type, power);
        
        // ダメージテキスト表示
        this.showDamageText(effect.damage, this.currentEnemy.x, this.currentEnemy.y);
    }
    
    createParticles(effect) {
        const particleCount = effect.power * 5 + 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: effect.x + (Math.random() - 0.5) * 100,
                y: effect.y + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * (effect.power * 2),
                vy: (Math.random() - 0.5) * (effect.power * 2),
                size: Math.random() * effect.power + 2,
                life: effect.duration,
                maxLife: effect.duration,
                color: effect.color,
                type: effect.type,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            };
            
            effect.particles.push(particle);
        }
    }
    
    getEffectColor(type) {
        const colors = {
            slash: '#silver',
            punch: '#ffa500',
            fireball: '#ff4500',
            lightning: '#ffff00',
            ice: '#87ceeb',
            explosion: '#ff6347',
            heal: '#90ee90',
            poison: '#9932cc',
            dark: '#800080',
            ultimate: '#ffd700'
        };
        return colors[type] || '#ffffff';
    }
    
    dealDamage(damage) {
        if (!this.currentEnemy) return;
        
        this.currentEnemy.currentHp = Math.max(0, this.currentEnemy.currentHp - damage);
        this.stats.totalDamage += damage;
        
        if (this.currentEnemy.currentHp <= 0) {
            // 敵撃破エフェクト
            this.createDeathEffect();
            setTimeout(() => {
                this.currentEnemy.currentHp = this.currentEnemy.maxHp;
            }, 2000);
        }
    }
    
    createDeathEffect() {
        for (let i = 0; i < 50; i++) {
            const particle = {
                x: this.currentEnemy.x,
                y: this.currentEnemy.y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                size: Math.random() * 10 + 5,
                life: 2000,
                maxLife: 2000,
                color: '#ffd700',
                type: 'death',
                rotation: 0,
                rotationSpeed: 0
            };
            this.particles.push(particle);
        }
        
        // 画面シェイク
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 500);
    }
    
    shakeEnemy() {
        const shakeIntensity = 15;
        const shakeDuration = 300;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < shakeDuration) {
                this.currentEnemy.shakeOffset.x = (Math.random() - 0.5) * shakeIntensity;
                this.currentEnemy.shakeOffset.y = (Math.random() - 0.5) * shakeIntensity;
                requestAnimationFrame(shake);
            } else {
                this.currentEnemy.shakeOffset.x = 0;
                this.currentEnemy.shakeOffset.y = 0;
            }
        };
        
        shake();
    }
    
    playEffectSound(type, power) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const soundData = {
            slash: { freq: 800 + power * 50, duration: 0.2, wave: 'sawtooth' },
            punch: { freq: 200 + power * 30, duration: 0.3, wave: 'square' },
            fireball: { freq: 400 + power * 40, duration: 0.5, wave: 'sine' },
            lightning: { freq: 1200 + power * 100, duration: 0.1, wave: 'sawtooth' },
            ice: { freq: 600 + power * 60, duration: 0.4, wave: 'triangle' },
            explosion: { freq: 100 + power * 20, duration: 0.6, wave: 'square' },
            heal: { freq: 800 + power * 80, duration: 0.8, wave: 'sine' },
            poison: { freq: 300 + power * 25, duration: 1.0, wave: 'triangle' },
            dark: { freq: 150 + power * 15, duration: 0.7, wave: 'sawtooth' }
        };
        
        const sound = soundData[type] || soundData.slash;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = sound.wave;
        oscillator.frequency.value = sound.freq;
        gainNode.gain.value = 0.1;
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + sound.duration);
    }
    
    showDamageText(damage, x, y) {
        const damageElement = document.createElement('div');
        damageElement.className = 'damage-text';
        damageElement.textContent = `-${damage}`;
        damageElement.style.left = `${x}px`;
        damageElement.style.top = `${y}px`;
        
        document.body.appendChild(damageElement);
        
        setTimeout(() => {
            document.body.removeChild(damageElement);
        }, 2000);
    }
    
    updateStats() {
        this.stats.totalAttacks++;
        
        // コンボ判定
        const now = Date.now();
        if (now - this.stats.lastAttackTime < 3000) {
            this.stats.comboCount++;
        } else {
            if (this.stats.comboCount > this.stats.maxCombo) {
                this.stats.maxCombo = this.stats.comboCount;
            }
            this.stats.comboCount = 1;
        }
        this.stats.lastAttackTime = now;
        
        // UI更新
        document.getElementById('totalAttacks').textContent = this.stats.totalAttacks;
        document.getElementById('totalDamage').textContent = this.stats.totalDamage;
        document.getElementById('comboCount').textContent = this.stats.comboCount;
        document.getElementById('maxCombo').textContent = this.stats.maxCombo;
        
        // 統計保存
        this.saveStats();
    }
    
    updateEffectInfo(type, power, duration) {
        const descriptions = {
            slash: '鋭い斬撃で敵を切り裂く！',
            punch: '強烈な拳で敵を殴りつける！',
            fireball: '燃え盛る火球で敵を焼き尽くす！',
            lightning: '電撃で敵を麻痺させる！',
            ice: '氷結魔法で敵を凍らせる！',
            explosion: '大爆発で周囲を吹き飛ばす！',
            heal: '回復魔法でHPを回復！',
            poison: '毒で継続ダメージを与える！',
            dark: '闇魔法で敵の生命力を吸収！'
        };
        
        document.getElementById('effectDescription').innerHTML = `
            <strong>${descriptions[type] || '攻撃実行中！'}</strong><br>
            威力: ${power}/10<br>
            持続: ${(duration/1000).toFixed(1)}秒
        `;
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // クリック位置にミニエフェクト生成
        const miniEffect = {
            type: 'click',
            power: 3,
            duration: 500,
            timeLeft: 500,
            x: x,
            y: y,
            particles: [],
            color: '#ffd700',
            damage: 0
        };
        
        this.createParticles(miniEffect);
        this.effects.push(miniEffect);
    }
    
    animate() {
        // 背景クリア
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 敵描画
        if (this.currentEnemy) {
            this.drawEnemy();
        }
        
        // エフェクト更新・描画
        this.updateEffects();
        
        // パーティクル更新・描画
        this.updateParticles();
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawEnemy() {
        const enemy = this.currentEnemy;
        const x = enemy.x + enemy.shakeOffset.x;
        const y = enemy.y + enemy.shakeOffset.y;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(enemy.rotation);
        
        // 敵の影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(5, enemy.size + 5, enemy.size * 0.8, enemy.size * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 敵本体
        this.ctx.font = `${enemy.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(enemy.emoji, 0, 0);
        
        // HPバー
        const barWidth = enemy.size * 1.2;
        const barHeight = 8;
        const hpRatio = enemy.currentHp / enemy.maxHp;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(-barWidth/2, -enemy.size - 20, barWidth, barHeight);
        
        this.ctx.fillStyle = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.2 ? '#fbbf24' : '#ef4444';
        this.ctx.fillRect(-barWidth/2, -enemy.size - 20, barWidth * hpRatio, barHeight);
        
        // HP数値
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`${enemy.currentHp}/${enemy.maxHp}`, 0, -enemy.size - 35);
        
        this.ctx.restore();
    }
    
    updateEffects() {
        this.effects = this.effects.filter(effect => {
            effect.timeLeft -= 16; // 約60FPS
            
            // エフェクト固有の描画
            this.drawEffect(effect);
            
            return effect.timeLeft > 0;
        });
    }
    
    drawEffect(effect) {
        const progress = 1 - (effect.timeLeft / effect.duration);
        const alpha = Math.sin(progress * Math.PI);
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        switch (effect.type) {
            case 'slash':
                this.drawSlashEffect(effect, progress);
                break;
            case 'fireball':
                this.drawFireballEffect(effect, progress);
                break;
            case 'lightning':
                this.drawLightningEffect(effect, progress);
                break;
            case 'explosion':
                this.drawExplosionEffect(effect, progress);
                break;
            default:
                this.drawGenericEffect(effect, progress);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawSlashEffect(effect, progress) {
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = effect.power * 2;
        this.ctx.lineCap = 'round';
        
        const length = effect.power * 30;
        const angle = progress * Math.PI * 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(effect.x - Math.cos(angle) * length, effect.y - Math.sin(angle) * length);
        this.ctx.lineTo(effect.x + Math.cos(angle) * length, effect.y + Math.sin(angle) * length);
        this.ctx.stroke();
        
        // 光る効果
        this.ctx.shadowColor = effect.color;
        this.ctx.shadowBlur = 20;
        this.ctx.stroke();
    }
    
    drawFireballEffect(effect, progress) {
        const radius = effect.power * 10 * (1 + progress);
        
        const gradient = this.ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
        gradient.addColorStop(0, '#ff6b35');
        gradient.addColorStop(0.5, '#ff4500');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawLightningEffect(effect, progress) {
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = effect.power;
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 15;
        
        // ジグザグの雷
        this.ctx.beginPath();
        let x = effect.x - 50;
        let y = effect.y - 100;
        this.ctx.moveTo(x, y);
        
        for (let i = 0; i < 10; i++) {
            x += 10 + Math.random() * 10;
            y += 20 + Math.random() * 20 - 10;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
    }
    
    drawExplosionEffect(effect, progress) {
        const maxRadius = effect.power * 15;
        const radius = maxRadius * progress;
        
        // 爆発の輪
        for (let i = 0; i < 3; i++) {
            const ringRadius = radius * (1 - i * 0.3);
            const alpha = (1 - progress) * (1 - i * 0.3);
            
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = i === 0 ? '#ff6347' : i === 1 ? '#ffa500' : '#ffff00';
            this.ctx.lineWidth = effect.power;
            
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawGenericEffect(effect, progress) {
        const radius = effect.power * 8 * (1 + progress * 0.5);
        
        this.ctx.fillStyle = effect.color;
        this.ctx.shadowColor = effect.color;
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    updateParticles() {
        // エフェクトのパーティクル
        this.effects.forEach(effect => {
            effect.particles = effect.particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vx *= 0.98;
                particle.vy *= 0.98;
                particle.life -= 16;
                particle.rotation += particle.rotationSpeed;
                
                this.drawParticle(particle);
                
                return particle.life > 0;
            });
        });
        
        // 独立パーティクル
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.life -= 16;
            
            this.drawParticle(particle);
            
            return particle.life > 0;
        });
    }
    
    drawParticle(particle) {
        const alpha = particle.life / particle.maxLife;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = particle.color;
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        if (particle.type === 'death') {
            this.ctx.font = `${particle.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('✨', 0, 0);
        } else {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundBtn');
        btn.textContent = this.soundEnabled ? '🔊 音響ON' : '🔇 音響OFF';
        
        if (this.soundEnabled && !this.audioContext) {
            this.initAudio();
        }
    }
    
    saveStats() {
        localStorage.setItem('rpgEffectStats', JSON.stringify(this.stats));
    }
    
    loadStats() {
        const saved = localStorage.getItem('rpgEffectStats');
        if (saved) {
            this.stats = { ...this.stats, ...JSON.parse(saved) };
            this.updateStatsDisplay();
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('totalAttacks').textContent = this.stats.totalAttacks;
        document.getElementById('totalDamage').textContent = this.stats.totalDamage;
        document.getElementById('comboCount').textContent = this.stats.comboCount;
        document.getElementById('maxCombo').textContent = this.stats.maxCombo;
    }
}

// グローバル変数
let rpgSystem;

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    rpgSystem = new RPGEffectSystem();
});

// グローバル関数
function executeAttack() {
    rpgSystem.executeAttack();
}

function randomAttack() {
    rpgSystem.randomAttack();
}

function ultimateCombo() {
    rpgSystem.ultimateCombo();
}

function selectEnemy(type) {
    rpgSystem.selectEnemy(type);
    
    // 選択中の敵をハイライト
    document.querySelectorAll('.enemy-card').forEach(card => {
        card.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    event.currentTarget.style.borderColor = '#ffd700';
}

function toggleSound() {
    rpgSystem.toggleSound();
}

// オーディオコンテキスト再開
window.addEventListener('focus', () => {
    if (rpgSystem && rpgSystem.audioContext && rpgSystem.audioContext.state === 'suspended') {
        rpgSystem.audioContext.resume();
    }
});

window.addEventListener('touchstart', () => {
    if (rpgSystem && rpgSystem.audioContext && rpgSystem.audioContext.state === 'suspended') {
        rpgSystem.audioContext.resume();
    }
});

// ショートカットキー
window.addEventListener('keydown', (e) => {
    if (!rpgSystem) return;
    
    switch(e.key) {
        case ' ':
            e.preventDefault();
            executeAttack();
            break;
        case 'r':
        case 'R':
            randomAttack();
            break;
        case 'u':
        case 'U':
            ultimateCombo();
            break;
        case 's':
        case 'S':
            toggleSound();
            break;
    }
});