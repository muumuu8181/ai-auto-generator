class SpaceDefenseCommand {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.effectCanvas = document.getElementById('effectCanvas');
        this.effectCtx = this.effectCanvas.getContext('2d');
        
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.wave = 1;
        this.powerLevel = 100;
        this.hullIntegrity = 100;
        this.gameTime = 0;
        this.startTime = 0;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.powerUps = [];
        
        // Weapon systems
        this.currentWeapon = 'laser';
        this.weapons = {
            laser: { ammo: Infinity, damage: 25, cooldown: 0, maxCooldown: 8 },
            missile: { ammo: 20, damage: 75, cooldown: 0, maxCooldown: 30 },
            plasma: { ammo: 5, damage: 150, cooldown: 0, maxCooldown: 60 },
            shield: { charge: 100, active: false, cooldown: 0, maxCooldown: 120 }
        };
        
        // Performance tracking
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 60;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        // Game stats
        this.stats = {
            totalKills: 0,
            shotsFired: 0,
            shotsHit: 0,
            survivalTime: 0,
            highScore: parseInt(localStorage.getItem('spaceDefenseHighScore') || '0')
        };
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupGameObjects();
        this.startGameLoop();
        
        console.log('🚀 Space Defense Command initialized');
    }
    
    initializeElements() {
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.waveDisplay = document.getElementById('waveNumber');
        this.powerDisplay = document.getElementById('powerLevel');
        this.hullDisplay = document.getElementById('hullIntegrity');
        this.fpsDisplay = document.getElementById('fpsValue');
        this.objectCountDisplay = document.getElementById('objectCount');
        this.weaponSlots = document.querySelectorAll('.weapon-slot');
        this.radarBlips = document.getElementById('radarBlips');
        this.warningSystem = document.getElementById('warningSystem');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.sfxVolumeSlider = document.getElementById('sfxVolume');
        this.autoFireCheckbox = document.getElementById('autoFire');
    }
    
    initializeEventListeners() {
        // Game controls
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('pauseGame').addEventListener('click', () => this.pauseGame());
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        
        // Weapon selection
        this.weaponSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectWeapon(slot.dataset.weapon);
            });
        });
        
        // Effect tests
        document.getElementById('testExplosion').addEventListener('click', () => {
            this.createExplosion(600, 350, 80);
        });
        document.getElementById('testLaser').addEventListener('click', () => {
            this.createLaserBeam(100, 350, 1100, 350);
        });
        document.getElementById('testShield').addEventListener('click', () => {
            this.createShieldEffect(600, 350);
        });
        document.getElementById('clearEffects').addEventListener('click', () => {
            this.effects = [];
        });
        
        // Modal controls
        document.getElementById('retryGame').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('show');
            this.startGame();
        });
        document.getElementById('backToMenu').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('show');
            this.gameState = 'menu';
        });
        
        // Settings
        this.sfxVolumeSlider.addEventListener('input', () => {
            document.getElementById('sfxVolumeValue').textContent = this.sfxVolumeSlider.value + '%';
        });
        
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Weapon hotkeys
            if (e.code === 'Digit1') this.selectWeapon('laser');
            if (e.code === 'Digit2') this.selectWeapon('missile');
            if (e.code === 'Digit3') this.selectWeapon('plasma');
            if (e.code === 'Digit4') this.selectWeapon('shield');
            
            // Game controls
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') this.pauseGame();
                else if (this.gameState === 'paused') this.resumeGame();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            if (this.gameState === 'playing') {
                this.fireWeapon();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    }
    
    setupGameObjects() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 60,
            height: 40,
            speed: 5,
            health: 100,
            maxHealth: 100
        };
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.hullIntegrity = 100;
        this.startTime = Date.now();
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.powerUps = [];
        
        // Reset weapon ammo
        this.weapons.missile.ammo = 20;
        this.weapons.plasma.ammo = 5;
        this.weapons.shield.charge = 100;
        
        this.spawnEnemyWave();
        this.updateDisplay();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    resetGame() {
        this.gameState = 'menu';
        this.effects = [];
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.updateDisplay();
    }
    
    selectWeapon(weaponType) {
        this.currentWeapon = weaponType;
        this.weaponSlots.forEach(slot => {
            slot.classList.toggle('active', slot.dataset.weapon === weaponType);
        });
    }
    
    fireWeapon() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.cooldown > 0) return;
        
        switch (this.currentWeapon) {
            case 'laser':
                this.fireLaser();
                break;
            case 'missile':
                if (weapon.ammo > 0) {
                    this.fireMissile();
                    weapon.ammo--;
                }
                break;
            case 'plasma':
                if (weapon.ammo > 0) {
                    this.firePlasma();
                    weapon.ammo--;
                }
                break;
            case 'shield':
                if (weapon.charge > 20) {
                    this.activateShield();
                    weapon.charge -= 20;
                }
                break;
        }
        
        weapon.cooldown = weapon.maxCooldown;
        this.stats.shotsFired++;
    }
    
    fireLaser() {
        const startX = this.player.x;
        const startY = this.player.y;
        const endX = this.mouse.x;
        const endY = this.mouse.y;
        
        this.projectiles.push({
            type: 'laser',
            x: startX,
            y: startY,
            targetX: endX,
            targetY: endY,
            speed: 20,
            damage: this.weapons.laser.damage,
            life: 60
        });
        
        this.createLaserBeam(startX, startY, endX, endY);
    }
    
    fireMissile() {
        const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
        
        this.projectiles.push({
            type: 'missile',
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            damage: this.weapons.missile.damage,
            life: 120,
            angle: angle
        });
    }
    
    firePlasma() {
        for (let i = 0; i < 5; i++) {
            const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
            const spread = (Math.random() - 0.5) * 0.5;
            
            this.projectiles.push({
                type: 'plasma',
                x: this.player.x + (Math.random() - 0.5) * 30,
                y: this.player.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle + spread) * 12,
                vy: Math.sin(angle + spread) * 12,
                damage: this.weapons.plasma.damage / 5,
                life: 90,
                size: Math.random() * 8 + 6
            });
        }
        
        this.createExplosion(this.player.x, this.player.y, 40);
    }
    
    activateShield() {
        this.weapons.shield.active = true;
        this.createShieldEffect(this.player.x, this.player.y);
        
        setTimeout(() => {
            this.weapons.shield.active = false;
        }, 3000);
    }
    
    spawnEnemyWave() {
        const enemyCount = Math.min(5 + this.wave * 2, 20);
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 500);
        }
        
        // Spawn boss every 5 waves
        if (this.wave % 5 === 0) {
            setTimeout(() => {
                this.spawnBoss();
            }, enemyCount * 500 + 2000);
        }
    }
    
    spawnEnemy() {
        const enemyTypes = [
            { type: 'scout', health: 30, speed: 3, size: 25, score: 100 },
            { type: 'fighter', health: 60, speed: 2, size: 35, score: 200 },
            { type: 'heavy', health: 120, speed: 1, size: 45, score: 400 }
        ];
        
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        this.enemies.push({
            ...enemyType,
            id: Math.random().toString(36).substr(2, 9),
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: -50,
            vx: (Math.random() - 0.5) * 2,
            vy: enemyType.speed,
            maxHealth: enemyType.health,
            lastShot: 0,
            shotCooldown: 60 + Math.random() * 120
        });
    }
    
    spawnBoss() {
        this.enemies.push({
            type: 'boss',
            id: 'boss-' + this.wave,
            x: this.canvas.width / 2,
            y: -100,
            vx: 0,
            vy: 0.5,
            health: 500 + this.wave * 200,
            maxHealth: 500 + this.wave * 200,
            size: 80,
            score: 2000,
            speed: 1,
            lastShot: 0,
            shotCooldown: 30,
            phase: 1
        });
        
        this.showWarning('BOSS APPROACHING!');
    }
    
    updateGameLogic() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateEnemies();
        this.updateProjectiles();
        this.updateWeaponCooldowns();
        this.checkCollisions();
        this.updateRadar();
        this.updateStats();
        
        // Check wave completion
        if (this.enemies.length === 0) {
            this.wave++;
            this.score += this.wave * 500;
            this.spawnEnemyWave();
        }
        
        // Check game over
        if (this.hullIntegrity <= 0) {
            this.gameOver();
        }
    }
    
    updatePlayer() {
        // Player movement with keyboard
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(this.player.width / 2, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.canvas.width - this.player.width / 2, this.player.x + this.player.speed);
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.player.y = Math.max(this.player.height / 2, this.player.y - this.player.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.player.y = Math.min(this.canvas.height - this.player.height / 2, this.player.y + this.player.speed);
        }
        
        // Auto-fire if enabled
        if (this.autoFireCheckbox.checked && this.mouse.down) {
            this.fireWeapon();
        }
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            
            // Enemy AI based on type
            if (enemy.type === 'boss') {
                this.updateBossAI(enemy);
            } else {
                // Basic enemy movement
                if (enemy.y > 100) {
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 200) {
                        enemy.vx += (dx / distance) * 0.02;
                        enemy.vy += (dy / distance) * 0.02;
                    }
                }
                
                // Enemy shooting
                enemy.lastShot++;
                if (enemy.lastShot > enemy.shotCooldown && enemy.y > 0 && enemy.y < this.canvas.height - 100) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = 0;
                }
            }
            
            // Remove enemies that are off-screen
            if (enemy.y > this.canvas.height + 100 || enemy.x < -100 || enemy.x > this.canvas.width + 100) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    updateBossAI(boss) {
        // Boss movement patterns
        if (boss.y < 150) {
            boss.vy = 1;
        } else {
            boss.vy = 0;
            boss.vx = Math.sin(Date.now() * 0.001) * 2;
        }
        
        // Boss shooting pattern
        boss.lastShot++;
        if (boss.lastShot > boss.shotCooldown) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x) + (i - 1) * 0.3;
                this.projectiles.push({
                    type: 'enemyBullet',
                    x: boss.x,
                    y: boss.y + boss.size / 2,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    damage: 15,
                    life: 180,
                    size: 8,
                    enemy: true
                });
            }
            boss.lastShot = 0;
        }
    }
    
    enemyShoot(enemy) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        
        this.projectiles.push({
            type: 'enemyBullet',
            x: enemy.x,
            y: enemy.y + enemy.size / 2,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            damage: 10,
            life: 120,
            size: 5,
            enemy: true
        });
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            projectile.x += projectile.vx || 0;
            projectile.y += projectile.vy || 0;
            projectile.life--;
            
            // Remove expired projectiles
            if (projectile.life <= 0 || 
                projectile.x < -50 || projectile.x > this.canvas.width + 50 ||
                projectile.y < -50 || projectile.y > this.canvas.height + 50) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateWeaponCooldowns() {
        Object.values(this.weapons).forEach(weapon => {
            if (weapon.cooldown > 0) weapon.cooldown--;
        });
        
        // Regenerate shield charge
        if (this.weapons.shield.charge < 100) {
            this.weapons.shield.charge += 0.2;
        }
    }
    
    checkCollisions() {
        // Player projectiles vs enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (projectile.enemy) continue;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = projectile.x - enemy.x;
                const dy = projectile.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.size / 2 + (projectile.size || 5)) {
                    // Hit!
                    enemy.health -= projectile.damage;
                    this.createHitEffect(enemy.x, enemy.y);
                    this.projectiles.splice(i, 1);
                    this.stats.shotsHit++;
                    
                    if (enemy.health <= 0) {
                        this.score += enemy.score;
                        this.stats.totalKills++;
                        this.createExplosion(enemy.x, enemy.y, enemy.size);
                        this.enemies.splice(j, 1);
                        
                        // Chance to drop power-up
                        if (Math.random() < 0.3) {
                            this.spawnPowerUp(enemy.x, enemy.y);
                        }
                    }
                    break;
                }
            }
        }
        
        // Enemy projectiles vs player
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (!projectile.enemy) continue;
            
            const dx = projectile.x - this.player.x;
            const dy = projectile.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.width / 2 + (projectile.size || 5)) {
                if (!this.weapons.shield.active) {
                    this.hullIntegrity -= projectile.damage;
                    this.createHitEffect(this.player.x, this.player.y);
                }
                this.projectiles.splice(i, 1);
            }
        }
        
        // Enemies vs player (collision damage)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.size / 2 + this.player.width / 2) {
                if (!this.weapons.shield.active) {
                    this.hullIntegrity -= 20;
                    this.createExplosion(enemy.x, enemy.y, enemy.size);
                    this.enemies.splice(i, 1);
                }
            }
        }
    }
    
    spawnPowerUp(x, y) {
        const powerUpTypes = [
            { type: 'health', icon: '💊', effect: () => this.hullIntegrity = Math.min(100, this.hullIntegrity + 25) },
            { type: 'ammo', icon: '📦', effect: () => { this.weapons.missile.ammo += 5; this.weapons.plasma.ammo += 2; } },
            { type: 'power', icon: '⚡', effect: () => this.powerLevel = Math.min(150, this.powerLevel + 25) },
            { type: 'shield', icon: '🛡️', effect: () => this.weapons.shield.charge = 100 }
        ];
        
        const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        this.powerUps.push({
            ...powerUp,
            x: x,
            y: y,
            life: 300,
            size: 30
        });
    }
    
    updateRadar() {
        this.radarBlips.innerHTML = '';
        
        this.enemies.forEach(enemy => {
            const blip = document.createElement('div');
            blip.className = 'radar-blip ' + enemy.type;
            
            // Convert world coordinates to radar coordinates
            const radarX = (enemy.x / this.canvas.width) * 100;
            const radarY = (enemy.y / this.canvas.height) * 100;
            
            blip.style.left = radarX + '%';
            blip.style.top = radarY + '%';
            
            this.radarBlips.appendChild(blip);
        });
    }
    
    updateStats() {
        this.stats.survivalTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        document.getElementById('totalKills').textContent = this.stats.totalKills;
        document.getElementById('accuracy').textContent = 
            this.stats.shotsFired > 0 ? Math.floor((this.stats.shotsHit / this.stats.shotsFired) * 100) + '%' : '0%';
        
        const minutes = Math.floor(this.stats.survivalTime / 60);
        const seconds = this.stats.survivalTime % 60;
        document.getElementById('survivalTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('highScore').textContent = this.stats.highScore;
    }
    
    createExplosion(x, y, size) {
        for (let i = 0; i < size / 4; i++) {
            this.effects.push({
                type: 'explosion',
                x: x + (Math.random() - 0.5) * size,
                y: y + (Math.random() - 0.5) * size,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30 + Math.random() * 20,
                maxLife: 30 + Math.random() * 20,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 30 + 50}%)`
            });
        }
    }
    
    createLaserBeam(x1, y1, x2, y2) {
        this.effects.push({
            type: 'laser',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            life: 10,
            width: 4
        });
    }
    
    createShieldEffect(x, y) {
        this.effects.push({
            type: 'shield',
            x: x,
            y: y,
            life: 60,
            size: 80,
            opacity: 0.8
        });
    }
    
    createHitEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.effects.push({
                type: 'spark',
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 15,
                size: 2
            });
        }
    }
    
    showWarning(text) {
        this.warningSystem.querySelector('#warningText').textContent = text;
        this.warningSystem.classList.add('active');
        
        setTimeout(() => {
            this.warningSystem.classList.remove('active');
        }, 3000);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        if (this.score > this.stats.highScore) {
            this.stats.highScore = this.score;
            localStorage.setItem('spaceDefenseHighScore', this.score.toString());
        }
        
        // Show game over modal
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalKills').textContent = this.stats.totalKills;
        document.getElementById('finalWave').textContent = this.wave;
        
        const minutes = Math.floor(this.stats.survivalTime / 60);
        const seconds = this.stats.survivalTime % 60;
        document.getElementById('finalTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('gameOverModal').classList.add('show');
    }
    
    render() {
        // Clear canvases
        this.ctx.fillStyle = '#000014';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.effectCtx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
        
        // Draw space background
        this.drawStarfield();
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.drawPlayer();
            this.drawEnemies();
            this.drawProjectiles();
            this.drawPowerUps();
        }
        
        this.drawEffects();
        
        if (this.gameState === 'paused') {
            this.drawPauseOverlay();
        }
        
        this.updateDisplay();
    }
    
    drawStarfield() {
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = ((i * 157.3) + Date.now() * 0.02) % this.canvas.height;
            const size = (i % 3) + 1;
            const opacity = Math.sin(Date.now() * 0.001 + i) * 0.3 + 0.7;
            
            this.ctx.globalAlpha = opacity;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // Draw player ship
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.player.height / 2);
        this.ctx.lineTo(-this.player.width / 2, this.player.height / 2);
        this.ctx.lineTo(0, this.player.height / 4);
        this.ctx.lineTo(this.player.width / 2, this.player.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw engine trail
        this.ctx.fillStyle = '#ff6600';
        this.ctx.fillRect(-8, this.player.height / 2, 4, 15);
        this.ctx.fillRect(4, this.player.height / 2, 4, 15);
        
        this.ctx.restore();
        
        // Draw shield if active
        if (this.weapons.shield.active) {
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 50, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            
            // Draw enemy based on type
            switch (enemy.type) {
                case 'scout':
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
                    break;
                case 'fighter':
                    this.ctx.fillStyle = '#ff8844';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, enemy.size / 2);
                    this.ctx.lineTo(-enemy.size / 2, -enemy.size / 2);
                    this.ctx.lineTo(enemy.size / 2, -enemy.size / 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'heavy':
                    this.ctx.fillStyle = '#aa4444';
                    this.ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.fillRect(-enemy.size / 4, -enemy.size / 4, enemy.size / 2, enemy.size / 2);
                    break;
                case 'boss':
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
                    this.ctx.fillStyle = '#ffaa00';
                    this.ctx.fillRect(-enemy.size / 3, -enemy.size / 3, enemy.size * 2 / 3, enemy.size * 2 / 3);
                    break;
            }
            
            // Draw health bar
            if (enemy.health < enemy.maxHealth) {
                const barWidth = enemy.size;
                const barHeight = 4;
                const healthPercent = enemy.health / enemy.maxHealth;
                
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(-barWidth / 2, enemy.size / 2 + 5, barWidth, barHeight);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
                this.ctx.fillRect(-barWidth / 2, enemy.size / 2 + 5, barWidth * healthPercent, barHeight);
            }
            
            this.ctx.restore();
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            this.ctx.save();
            
            switch (projectile.type) {
                case 'laser':
                    this.ctx.strokeStyle = '#ff0000';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(projectile.x, projectile.y);
                    this.ctx.lineTo(projectile.targetX, projectile.targetY);
                    this.ctx.stroke();
                    break;
                    
                case 'missile':
                    this.ctx.translate(projectile.x, projectile.y);
                    this.ctx.rotate(projectile.angle);
                    this.ctx.fillStyle = '#ffaa00';
                    this.ctx.fillRect(-8, -2, 16, 4);
                    this.ctx.fillStyle = '#ff4400';
                    this.ctx.fillRect(-12, -1, 4, 2);
                    break;
                    
                case 'plasma':
                    this.ctx.fillStyle = '#44ff44';
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.beginPath();
                    this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                    break;
                    
                case 'enemyBullet':
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.beginPath();
                    this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawPowerUps() {
        this.powerUps.forEach((powerUp, index) => {
            powerUp.life--;
            if (powerUp.life <= 0) {
                this.powerUps.splice(index, 1);
                return;
            }
            
            // Check collision with player
            const dx = powerUp.x - this.player.x;
            const dy = powerUp.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < powerUp.size) {
                powerUp.effect();
                this.powerUps.splice(index, 1);
                return;
            }
            
            this.ctx.save();
            this.ctx.translate(powerUp.x, powerUp.y);
            this.ctx.rotate(Date.now() * 0.005);
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.icon, 0, 0);
            this.ctx.restore();
        });
    }
    
    drawEffects() {
        this.effects = this.effects.filter(effect => {
            effect.life--;
            
            this.effectCtx.save();
            
            switch (effect.type) {
                case 'explosion':
                    const alpha = effect.life / effect.maxLife;
                    this.effectCtx.globalAlpha = alpha;
                    this.effectCtx.fillStyle = effect.color;
                    this.effectCtx.beginPath();
                    this.effectCtx.arc(effect.x + effect.vx * (effect.maxLife - effect.life), 
                                     effect.y + effect.vy * (effect.maxLife - effect.life), 
                                     effect.size * alpha, 0, Math.PI * 2);
                    this.effectCtx.fill();
                    break;
                    
                case 'laser':
                    this.effectCtx.strokeStyle = '#ff0000';
                    this.effectCtx.lineWidth = effect.width;
                    this.effectCtx.globalAlpha = effect.life / 10;
                    this.effectCtx.beginPath();
                    this.effectCtx.moveTo(effect.x1, effect.y1);
                    this.effectCtx.lineTo(effect.x2, effect.y2);
                    this.effectCtx.stroke();
                    break;
                    
                case 'shield':
                    this.effectCtx.strokeStyle = '#00ffff';
                    this.effectCtx.lineWidth = 3;
                    this.effectCtx.globalAlpha = effect.opacity * (effect.life / 60);
                    this.effectCtx.beginPath();
                    this.effectCtx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                    this.effectCtx.stroke();
                    break;
                    
                case 'spark':
                    this.effectCtx.fillStyle = '#ffff00';
                    this.effectCtx.globalAlpha = effect.life / 15;
                    this.effectCtx.fillRect(effect.x + effect.vx * (15 - effect.life), 
                                          effect.y + effect.vy * (15 - effect.life), 
                                          effect.size, effect.size);
                    break;
            }
            
            this.effectCtx.restore();
            
            return effect.life > 0;
        });
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    updateDisplay() {
        this.scoreDisplay.textContent = this.score;
        this.waveDisplay.textContent = this.wave;
        this.powerDisplay.textContent = this.powerLevel;
        this.hullDisplay.textContent = Math.max(0, Math.floor(this.hullIntegrity)) + '%';
        
        // Update weapon ammo displays
        document.getElementById('missileAmmo').textContent = this.weapons.missile.ammo;
        document.getElementById('plasmaAmmo').textContent = this.weapons.plasma.ammo;
        document.getElementById('shieldCharge').textContent = Math.floor(this.weapons.shield.charge) + '%';
        
        // Update object count
        const objectCount = this.enemies.length + this.projectiles.length + this.effects.length + this.powerUps.length;
        this.objectCountDisplay.textContent = objectCount;
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            // Calculate FPS
            if (currentTime - this.lastTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = currentTime;
                this.fpsDisplay.textContent = this.fps;
            }
            this.frameCount++;
            
            this.updateGameLogic();
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spaceDefense = new SpaceDefenseCommand();
});