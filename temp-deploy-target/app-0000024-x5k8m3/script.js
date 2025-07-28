// Virtual Pet Paradise - バーチャルペット育成ゲーム
class VirtualPet {
    constructor() {
        this.pet = {
            name: 'プチ',
            level: 1,
            age: 0,
            happiness: 100,
            hunger: 100,
            energy: 100,
            sleep: 0,
            color: 'default',
            lastFed: Date.now(),
            lastPlayed: Date.now(),
            lastSlept: Date.now(),
            birthDate: Date.now()
        };
        
        this.gameState = {
            coins: 100,
            volume: 50,
            isPlaying: false,
            isSleeping: false,
            minigameScore: 0,
            ballPosition: { x: 50, y: 50 }
        };
        
        this.colorThemes = {
            default: 'linear-gradient(145deg, #ff9a9e, #fecfef)',
            blue: 'linear-gradient(145deg, #a8edea, #fed6e3)',
            green: 'linear-gradient(145deg, #d299c2, #fef9d7)',
            orange: 'linear-gradient(145deg, #fad0c4, #ffd1ff)'
        };
        
        this.init();
    }
    
    init() {
        this.loadGameData();
        this.setupEventListeners();
        this.startGameLoop();
        this.updateDisplay();
        this.applyPetColor();
        
        // ローディング画面を隠す
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 2000);
    }
    
    setupEventListeners() {
        // アクションボタン
        document.getElementById('feed-btn').addEventListener('click', () => this.feedPet());
        document.getElementById('play-btn').addEventListener('click', () => this.playWithPet());
        document.getElementById('sleep-btn').addEventListener('click', () => this.makePetSleep());
        document.getElementById('clean-btn').addEventListener('click', () => this.cleanPet());
        
        // メニューボタン
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('shop-btn').addEventListener('click', () => this.showNotification('ショップは開発中です！', 'info'));
        
        // 設定モーダル
        document.getElementById('close-settings').addEventListener('click', () => this.closeModal('settings-modal'));
        document.getElementById('save-name-btn').addEventListener('click', () => this.savePetName());
        document.getElementById('reset-pet-btn').addEventListener('click', () => this.resetPet());
        
        // ペットの色変更
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => this.changePetColor(btn.dataset.color));
        });
        
        // 音量調整
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.gameState.volume = e.target.value;
            this.saveGameData();
        });
        
        // ミニゲーム
        document.getElementById('close-minigame').addEventListener('click', () => this.closeModal('minigame-modal'));
        document.getElementById('game-ball').addEventListener('click', () => this.catchBall());
        
        // ペットをクリックで反応
        document.getElementById('pet-character').addEventListener('click', () => this.petInteraction());
        
        // モーダル外クリック
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }
    
    feedPet() {
        if (this.gameState.coins < 10) {
            this.showNotification('コインが足りません！', 'error');
            return;
        }
        
        if (this.pet.hunger >= 100) {
            this.showNotification('もうお腹いっぱいです！', 'info');
            return;
        }
        
        this.gameState.coins -= 10;
        this.pet.hunger = Math.min(100, this.pet.hunger + 30);
        this.pet.happiness = Math.min(100, this.pet.happiness + 10);
        this.pet.lastFed = Date.now();
        
        this.createEffect('food');
        this.showNotification('美味しそうに食べています！', 'success');
        this.updateDisplay();
        this.saveGameData();
    }
    
    playWithPet() {
        if (this.pet.energy < 20) {
            this.showNotification('ペットが疲れています...', 'error');
            return;
        }
        
        this.openModal('minigame-modal');
        this.startMinigame();
    }
    
    makePetSleep() {
        if (this.gameState.isSleeping) {
            this.showNotification('すでに寝ています...', 'info');
            return;
        }
        
        this.gameState.isSleeping = true;
        this.pet.lastSlept = Date.now();
        
        // 5分間のスリープタイマー
        setTimeout(() => {
            this.gameState.isSleeping = false;
            this.pet.energy = Math.min(100, this.pet.energy + 50);
            this.pet.sleep = Math.max(0, this.pet.sleep - 30);
            this.showNotification('ぐっすり眠りました！', 'success');
            this.updateDisplay();
            this.saveGameData();
        }, 5000); // 実際は300000ms (5分) だが、デモ用に5秒
        
        this.showNotification('おやすみなさい...', 'info');
        this.updateDisplay();
        this.saveGameData();
    }
    
    cleanPet() {
        if (this.gameState.coins < 5) {
            this.showNotification('コインが足りません！', 'error');
            return;
        }
        
        this.gameState.coins -= 5;
        this.pet.happiness = Math.min(100, this.pet.happiness + 20);
        
        this.createEffect('sparkle');
        this.showNotification('さっぱりしました！', 'success');
        this.updateDisplay();
        this.saveGameData();
    }
    
    petInteraction() {
        this.pet.happiness = Math.min(100, this.pet.happiness + 5);
        this.createEffect('heart');
        this.playPetSound();
        this.updateDisplay();
        this.saveGameData();
    }
    
    startMinigame() {
        this.gameState.minigameScore = 0;
        this.gameState.isPlaying = true;
        this.moveBall();
        
        // 30秒でゲーム終了
        setTimeout(() => {
            this.endMinigame();
        }, 30000);
    }
    
    moveBall() {
        if (!this.gameState.isPlaying) return;
        
        const ball = document.getElementById('game-ball');
        const area = document.getElementById('minigame-area');
        
        const maxX = area.clientWidth - 40;
        const maxY = area.clientHeight - 40;
        
        this.gameState.ballPosition.x = Math.random() * maxX;
        this.gameState.ballPosition.y = Math.random() * maxY;
        
        ball.style.left = this.gameState.ballPosition.x + 'px';
        ball.style.top = this.gameState.ballPosition.y + 'px';
        
        setTimeout(() => this.moveBall(), 1500);
    }
    
    catchBall() {
        if (!this.gameState.isPlaying) return;
        
        this.gameState.minigameScore += 10;
        document.getElementById('minigame-score').textContent = this.gameState.minigameScore;
        
        // ボールキャッチエフェクト
        const ball = document.getElementById('game-ball');
        ball.style.transform = 'scale(1.5)';
        setTimeout(() => {
            ball.style.transform = 'scale(1)';
        }, 200);
    }
    
    endMinigame() {
        this.gameState.isPlaying = false;
        this.closeModal('minigame-modal');
        
        const earnedCoins = Math.floor(this.gameState.minigameScore / 10);
        this.gameState.coins += earnedCoins;
        this.pet.energy = Math.max(0, this.pet.energy - 20);
        this.pet.happiness = Math.min(100, this.pet.happiness + 15);
        
        this.showNotification(`ゲーム終了！ ${earnedCoins}コイン獲得！`, 'success');
        this.updateDisplay();
        this.saveGameData();
    }
    
    openSettings() {
        document.getElementById('pet-name-input').value = this.pet.name;
        document.getElementById('volume-slider').value = this.gameState.volume;
        this.updateColorSelection();
        this.openModal('settings-modal');
    }
    
    savePetName() {
        const newName = document.getElementById('pet-name-input').value.trim();
        if (newName && newName.length <= 10) {
            this.pet.name = newName;
            document.getElementById('pet-name').textContent = newName;
            this.showNotification('名前を変更しました！', 'success');
            this.saveGameData();
        }
    }
    
    changePetColor(color) {
        this.pet.color = color;
        this.applyPetColor();
        this.updateColorSelection();
        this.saveGameData();
    }
    
    applyPetColor() {
        const petBody = document.querySelector('.pet-body');
        const ears = document.querySelectorAll('.ear');
        const gradient = this.colorThemes[this.pet.color];
        
        petBody.style.background = gradient;
        ears.forEach(ear => {
            ear.style.background = gradient;
        });
    }
    
    updateColorSelection() {
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === this.pet.color);
        });
    }
    
    resetPet() {
        if (confirm('本当にペットをリセットしますか？すべてのデータが消去されます。')) {
            localStorage.removeItem('virtualPetData');
            location.reload();
        }
    }
    
    createEffect(type) {
        const container = document.getElementById('effects-container');
        const effect = document.createElement('div');
        
        switch (type) {
            case 'heart':
                effect.className = 'heart-effect';
                effect.innerHTML = '💖';
                break;
            case 'food':
                effect.className = 'heart-effect';
                effect.innerHTML = '🍎';
                break;
            case 'sparkle':
                effect.className = 'sparkle-effect';
                break;
        }
        
        effect.style.left = Math.random() * 200 + 'px';
        effect.style.top = Math.random() * 100 + 'px';
        
        container.appendChild(effect);
        
        setTimeout(() => {
            container.removeChild(effect);
        }, 2000);
    }
    
    playPetSound() {
        // Web Audio APIでかわいい音を再生（簡易版）
        if (this.gameState.volume > 0) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(this.gameState.volume / 100 * 0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 3000);
    }
    
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    updateDisplay() {
        // ステータス更新
        document.getElementById('happiness-value').textContent = Math.floor(this.pet.happiness);
        document.getElementById('hunger-value').textContent = Math.floor(this.pet.hunger);
        document.getElementById('energy-value').textContent = Math.floor(this.pet.energy);
        document.getElementById('sleep-value').textContent = Math.floor(this.pet.sleep);
        
        // ステータスバー更新
        document.getElementById('happiness-bar').style.width = this.pet.happiness + '%';
        document.getElementById('hunger-bar').style.width = this.pet.hunger + '%';
        document.getElementById('energy-bar').style.width = this.pet.energy + '%';
        document.getElementById('sleep-bar').style.width = this.pet.sleep + '%';
        
        // ゲーム情報更新
        document.getElementById('coins').textContent = this.gameState.coins;
        document.getElementById('pet-level').textContent = this.pet.level;
        document.getElementById('pet-age').textContent = Math.floor((Date.now() - this.pet.birthDate) / (1000 * 60 * 60 * 24));
        
        // ペットの表情更新
        this.updatePetMood();
    }
    
    updatePetMood() {
        const mouth = document.getElementById('pet-mouth');
        const petCharacter = document.getElementById('pet-character');
        
        if (this.gameState.isSleeping) {
            mouth.innerHTML = '<div class="sleep-mouth">💤</div>';
            petCharacter.style.animation = 'none';
        } else if (this.pet.happiness < 30) {
            mouth.innerHTML = '<div class="sad-mouth">😢</div>';
        } else if (this.pet.happiness > 80) {
            mouth.innerHTML = '<div class="happy-mouth">😊</div>';
        } else {
            mouth.innerHTML = '<div class="smile"></div>';
        }
    }
    
    startGameLoop() {
        setInterval(() => {
            this.updatePetNeeds();
            this.checkLevelUp();
            this.autoSave();
        }, 60000); // 1分ごと
    }
    
    updatePetNeeds() {
        const now = Date.now();
        const minute = 60 * 1000;
        
        // 時間経過でステータス減少
        if (now - this.pet.lastFed > 10 * minute) {
            this.pet.hunger = Math.max(0, this.pet.hunger - 5);
        }
        
        if (!this.gameState.isSleeping) {
            this.pet.energy = Math.max(0, this.pet.energy - 2);
            this.pet.sleep = Math.min(100, this.pet.sleep + 3);
        }
        
        // ステータスが低い時の幸福度減少
        if (this.pet.hunger < 20 || this.pet.energy < 20) {
            this.pet.happiness = Math.max(0, this.pet.happiness - 10);
        }
        
        this.updateDisplay();
    }
    
    checkLevelUp() {
        const targetHappiness = this.pet.level * 100;
        if (this.pet.happiness >= targetHappiness && this.pet.level < 10) {
            this.pet.level++;
            this.gameState.coins += 50;
            this.showNotification(`レベルアップ！レベル${this.pet.level}になりました！`, 'success');
            this.createEffect('sparkle');
            this.updateDisplay();
        }
    }
    
    autoSave() {
        this.saveGameData();
    }
    
    saveGameData() {
        const gameData = {
            pet: this.pet,
            gameState: this.gameState,
            lastSaved: Date.now()
        };
        localStorage.setItem('virtualPetData', JSON.stringify(gameData));
    }
    
    loadGameData() {
        const saved = localStorage.getItem('virtualPetData');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                this.pet = { ...this.pet, ...gameData.pet };
                this.gameState = { ...this.gameState, ...gameData.gameState };
                
                // 離脱時間の計算
                const offlineTime = Date.now() - (gameData.lastSaved || Date.now());
                this.handleOfflineProgress(offlineTime);
                
            } catch (error) {
                console.log('セーブデータの読み込みに失敗しました');
            }
        }
    }
    
    handleOfflineProgress(offlineTime) {
        const hours = Math.floor(offlineTime / (1000 * 60 * 60));
        if (hours > 0) {
            // オフライン中の変化を計算
            this.pet.hunger = Math.max(0, this.pet.hunger - hours * 5);
            this.pet.energy = Math.max(0, this.pet.energy - hours * 3);
            this.pet.sleep = Math.min(100, this.pet.sleep + hours * 5);
            
            if (hours > 2) {
                this.showNotification(`${hours}時間お疲れ様でした！ペットがあなたを待っていました。`, 'info');
            }
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new VirtualPet();
});