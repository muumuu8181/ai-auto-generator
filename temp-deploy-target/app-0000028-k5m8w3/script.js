// Habit Forest - 習慣を育てる森
class HabitForest {
    constructor() {
        // アプリケーションの状態
        this.habits = [];
        this.completions = {}; // Date -> [habitId, ...] の形式
        this.currentDate = new Date().toISOString().split('T')[0];
        
        // 設定
        this.settings = {
            autoCelebration: true,
            soundEffects: true,
            dailyReminders: false,
            reminderTime: '20:00'
        };
        
        // 植物の種類と成長段階
        this.plantTypes = {
            sunflower: { icon: '🌻', name: 'ひまわり', color: '#ffb300' },
            tree: { icon: '🌳', name: '木', color: '#4caf50' },
            flower: { icon: '🌸', name: '花', color: '#e91e63' },
            cactus: { icon: '🌵', name: 'サボテン', color: '#66bb6a' },
            cherry: { icon: '🌺', name: '桜', color: '#f06292' },
            bamboo: { icon: '🎋', name: '竹', color: '#81c784' }
        };
        
        this.growthStages = {
            seed: { icon: '🌱', name: '種', daysRequired: 0 },
            sprout: { icon: '🌿', name: '芽', daysRequired: 3 },
            young: { icon: '🌲', name: '若木', daysRequired: 7 },
            mature: { icon: '🌳', name: '成木', daysRequired: 14 },
            blooming: { icon: '🌺', name: '開花', daysRequired: 30 }
        };
        
        // DOM要素の取得
        this.initializeElements();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // データの読み込み
        this.loadData();
        
        // 初期描画
        this.render();
        
        // 日付チェック（日が変わった時の処理）
        this.checkDateChange();
    }
    
    initializeElements() {
        // 統計要素
        this.currentStreakEl = document.getElementById('current-streak');
        this.totalPlantsEl = document.getElementById('total-plants');
        this.todayCompletionEl = document.getElementById('today-completion');
        
        // サイドバー関連
        this.sidebar = document.getElementById('sidebar');
        this.toggleSidebar = document.getElementById('toggle-sidebar');
        this.habitsListEl = document.getElementById('habits-list');
        this.emptyHabitsEl = document.getElementById('empty-habits');
        this.addHabitBtn = document.getElementById('add-habit-btn');
        
        // 森エリア
        this.plantsContainer = document.getElementById('plants-container');
        this.emptyForestEl = document.getElementById('empty-forest');
        
        // モーダル関連
        this.addHabitModal = document.getElementById('add-habit-modal');
        this.statsModal = document.getElementById('stats-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.celebrationModal = document.getElementById('celebration-modal');
        
        // フォーム要素
        this.habitForm = document.getElementById('habit-form');
        this.habitNameInput = document.getElementById('habit-name');
        this.habitDescriptionInput = document.getElementById('habit-description');
        this.plantSelector = document.getElementById('plant-selector');
        this.colorSelector = document.getElementById('color-selector');
        
        // ボタン類
        this.statsBtn = document.getElementById('stats-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        
        // ファイル入力
        this.fileInput = document.getElementById('file-input');
        
        // 効果音
        this.successSound = document.getElementById('success-sound');
    }
    
    setupEventListeners() {
        // サイドバー切り替え
        this.toggleSidebar.addEventListener('click', () => this.toggleSidebarVisibility());
        
        // 習慣追加
        this.addHabitBtn.addEventListener('click', () => this.openAddHabitModal());
        
        // フォーム送信
        this.habitForm.addEventListener('submit', (e) => this.handleAddHabit(e));
        
        // モーダル関連
        this.setupModalEventListeners();
        
        // 設定関連
        this.setupSettingsEventListeners();
        
        // データ管理
        this.setupDataManagementListeners();
        
        // ウィンドウサイズ変更
        window.addEventListener('resize', () => this.handleResize());
        
        // ページ離脱前の確認
        window.addEventListener('beforeunload', () => this.saveData());
        
        // 一定時間ごとの日付チェック
        setInterval(() => this.checkDateChange(), 60000); // 1分ごと
    }
    
    setupModalEventListeners() {
        // 統計モーダル
        this.statsBtn.addEventListener('click', () => this.openStatsModal());
        document.getElementById('close-stats').addEventListener('click', () => this.closeModal('stats-modal'));
        
        // 設定モーダル
        this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        document.getElementById('close-settings').addEventListener('click', () => this.closeModal('settings-modal'));
        
        // 習慣追加モーダル
        document.getElementById('close-add-habit').addEventListener('click', () => this.closeModal('add-habit-modal'));
        document.getElementById('cancel-habit').addEventListener('click', () => this.closeModal('add-habit-modal'));
        
        // お祝いモーダル
        document.getElementById('close-celebration').addEventListener('click', () => this.closeModal('celebration-modal'));
        
        // モーダル外クリックで閉じる
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // 植物・色選択
        this.plantSelector.addEventListener('click', (e) => this.handlePlantSelection(e));
        this.colorSelector.addEventListener('click', (e) => this.handleColorSelection(e));
    }
    
    setupSettingsEventListeners() {
        const settingInputs = [
            'auto-celebration',
            'sound-effects', 
            'daily-reminders',
            'reminder-time'
        ];
        
        settingInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateSettings());
            }
        });
    }
    
    setupDataManagementListeners() {
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('import-data').addEventListener('click', () => this.fileInput.click());
        document.getElementById('reset-data').addEventListener('click', () => this.resetData());
        
        this.fileInput.addEventListener('change', (e) => this.importData(e));
    }
    
    // データ管理
    loadData() {
        try {
            const habitsData = localStorage.getItem('habitforest_habits');
            this.habits = habitsData ? JSON.parse(habitsData) : [];
            
            const completionsData = localStorage.getItem('habitforest_completions');
            this.completions = completionsData ? JSON.parse(completionsData) : {};
            
            const settingsData = localStorage.getItem('habitforest_settings');
            this.settings = settingsData ? { ...this.settings, ...JSON.parse(settingsData) } : this.settings;
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            this.showNotification('データの読み込みに失敗しました', 'error');
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('habitforest_habits', JSON.stringify(this.habits));
            localStorage.setItem('habitforest_completions', JSON.stringify(this.completions));
            localStorage.setItem('habitforest_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            this.showNotification('データの保存に失敗しました', 'error');
        }
    }
    
    // 習慣管理
    addHabit(habitData) {
        const habit = {
            id: this.generateId(),
            name: habitData.name,
            description: habitData.description || '',
            plantType: habitData.plantType || 'tree',
            color: habitData.color || 'green',
            createdAt: new Date().toISOString(),
            totalCompletions: 0,
            currentStreak: 0,
            bestStreak: 0
        };
        
        this.habits.push(habit);
        this.saveData();
        this.render();
        this.showNotification('新しい習慣が追加されました！', 'success');
    }
    
    deleteHabit(habitId) {
        if (confirm('この習慣を削除しますか？成長データも失われます。')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            
            // 完了記録からも削除
            Object.keys(this.completions).forEach(date => {
                this.completions[date] = this.completions[date].filter(id => id !== habitId);
                if (this.completions[date].length === 0) {
                    delete this.completions[date];
                }
            });
            
            this.saveData();
            this.render();
            this.showNotification('習慣が削除されました', 'info');
        }
    }
    
    toggleHabitCompletion(habitId) {
        const today = this.currentDate;
        
        if (!this.completions[today]) {
            this.completions[today] = [];
        }
        
        const isCompleted = this.completions[today].includes(habitId);
        
        if (isCompleted) {
            // 完了を取り消し
            this.completions[today] = this.completions[today].filter(id => id !== habitId);
            if (this.completions[today].length === 0) {
                delete this.completions[today];
            }
        } else {
            // 完了を記録
            this.completions[today].push(habitId);
            this.playSuccessSound();
            
            if (this.settings.autoCelebration) {
                this.showCelebration(habitId);
            }
        }
        
        this.updateHabitStats();
        this.saveData();
        this.render();
    }
    
    updateHabitStats() {
        this.habits.forEach(habit => {
            let currentStreak = 0;
            let totalCompletions = 0;
            let bestStreak = 0;
            let tempStreak = 0;
            
            // 日付を逆順でソート（最新から過去へ）
            const dates = Object.keys(this.completions).sort().reverse();
            const today = new Date();
            
            for (let i = 0; i < dates.length; i++) {
                const date = dates[i];
                const dateObj = new Date(date);
                const daysDiff = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
                
                if (this.completions[date].includes(habit.id)) {
                    totalCompletions++;
                    tempStreak++;
                    
                    // 現在のストリークを計算（連続した日のみ）
                    if (daysDiff === i) {
                        currentStreak = tempStreak;
                    }
                    
                    bestStreak = Math.max(bestStreak, tempStreak);
                } else {
                    tempStreak = 0;
                }
            }
            
            habit.totalCompletions = totalCompletions;
            habit.currentStreak = currentStreak;
            habit.bestStreak = bestStreak;
        });
    }
    
    // 植物の成長計算
    getPlantGrowthStage(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return 'seed';
        
        const streak = habit.currentStreak;
        
        if (streak >= 30) return 'blooming';
        if (streak >= 14) return 'mature';
        if (streak >= 7) return 'young';
        if (streak >= 3) return 'sprout';
        return 'seed';
    }
    
    getPlantIcon(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return '🌱';
        
        const stage = this.getPlantGrowthStage(habitId);
        const plantType = this.plantTypes[habit.plantType];
        
        if (stage === 'blooming') {
            return plantType.icon;
        } else {
            return this.growthStages[stage].icon;
        }
    }
    
    // UI描画
    render() {
        this.renderHeaderStats();
        this.renderHabitsList();
        this.renderForest();
    }
    
    renderHeaderStats() {
        const todayCompletions = this.completions[this.currentDate] || [];
        const totalHabits = this.habits.length;
        
        // 現在のストリーク（全体）
        const overallStreak = this.calculateOverallStreak();
        this.currentStreakEl.textContent = overallStreak;
        
        // 育てた植物の数
        const totalPlants = this.habits.reduce((sum, habit) => sum + habit.totalCompletions, 0);
        this.totalPlantsEl.textContent = totalPlants;
        
        // 今日の達成率
        this.todayCompletionEl.textContent = `${todayCompletions.length}/${totalHabits}`;
    }
    
    renderHabitsList() {
        if (this.habits.length === 0) {
            this.habitsListEl.style.display = 'none';
            this.emptyHabitsEl.style.display = 'block';
            return;
        }
        
        this.habitsListEl.style.display = 'block';
        this.emptyHabitsEl.style.display = 'none';
        
        this.habitsListEl.innerHTML = this.habits.map(habit => {
            const isCompleted = (this.completions[this.currentDate] || []).includes(habit.id);
            const plantIcon = this.getPlantIcon(habit.id);
            const stage = this.getPlantGrowthStage(habit.id);
            
            return `
                <div class="habit-item ${isCompleted ? 'completed' : ''}" 
                     onclick="habitForest.toggleHabitCompletion('${habit.id}')"
                     style="position: relative;">
                    <div class="habit-header">
                        <span class="habit-icon">${plantIcon}</span>
                        <span class="habit-name">${this.escapeHtml(habit.name)}</span>
                    </div>
                    <div class="habit-streak">
                        <i class="fas fa-fire"></i>
                        <span class="streak-number">${habit.currentStreak}</span>
                        日連続
                    </div>
                    <button class="habit-delete" onclick="event.stopPropagation(); habitForest.deleteHabit('${habit.id}')" 
                            title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    renderForest() {
        if (this.habits.length === 0) {
            this.plantsContainer.style.display = 'none';
            this.emptyForestEl.style.display = 'flex';
            return;
        }
        
        this.plantsContainer.style.display = 'grid';
        this.emptyForestEl.style.display = 'none';
        
        this.plantsContainer.innerHTML = this.habits.map(habit => {
            const plantIcon = this.getPlantIcon(habit.id);
            const stage = this.getPlantGrowthStage(habit.id);
            const isCompleted = (this.completions[this.currentDate] || []).includes(habit.id);
            
            return `
                <div class="plant stage-${stage}" onclick="habitForest.toggleHabitCompletion('${habit.id}')">
                    <div class="plant-visual">${plantIcon}</div>
                    <div class="plant-label">${this.escapeHtml(habit.name)}</div>
                    ${habit.currentStreak > 0 ? `
                        <div class="plant-growth-indicator">${habit.currentStreak}</div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }
    
    // モーダル管理
    openAddHabitModal() {
        this.habitForm.reset();
        this.clearSelections();
        this.openModal('add-habit-modal');
    }
    
    openStatsModal() {
        this.renderStats();
        this.openModal('stats-modal');
    }
    
    openSettingsModal() {
        this.renderSettings();
        this.openModal('settings-modal');
    }
    
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    // フォーム処理
    handleAddHabit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.habitForm);
        const selectedPlant = this.plantSelector.querySelector('.plant-option.selected');
        const selectedColor = this.colorSelector.querySelector('.color-option.selected');
        
        if (!selectedPlant) {
            this.showNotification('植物を選択してください', 'error');
            return;
        }
        
        const habitData = {
            name: formData.get('habit-name').trim(),
            description: formData.get('habit-description').trim(),
            plantType: selectedPlant.dataset.plant,
            color: selectedColor ? selectedColor.dataset.color : 'green'
        };
        
        if (!habitData.name) {
            this.showNotification('習慣名を入力してください', 'error');
            return;
        }
        
        this.addHabit(habitData);
        this.closeModal('add-habit-modal');
    }
    
    handlePlantSelection(e) {
        const option = e.target.closest('.plant-option');
        if (!option) return;
        
        this.plantSelector.querySelectorAll('.plant-option').forEach(el => 
            el.classList.remove('selected'));
        option.classList.add('selected');
    }
    
    handleColorSelection(e) {
        const option = e.target.closest('.color-option');
        if (!option) return;
        
        this.colorSelector.querySelectorAll('.color-option').forEach(el => 
            el.classList.remove('selected'));
        option.classList.add('selected');
    }
    
    clearSelections() {
        this.plantSelector.querySelectorAll('.plant-option').forEach(el => 
            el.classList.remove('selected'));
        this.colorSelector.querySelectorAll('.color-option').forEach(el => 
            el.classList.remove('selected'));
        
        // デフォルト選択
        this.plantSelector.querySelector('[data-plant="tree"]').classList.add('selected');
        this.colorSelector.querySelector('[data-color="green"]').classList.add('selected');
    }
    
    // 統計描画
    renderStats() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // 今日の統計
        const todayCompletions = (this.completions[todayStr] || []).length;
        document.getElementById('stats-today').textContent = todayCompletions;
        
        // 今週の統計
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekCompletions = this.getCompletionsInRange(weekStart, today);
        document.getElementById('stats-week').textContent = weekCompletions;
        
        // 今月の統計
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthCompletions = this.getCompletionsInRange(monthStart, today);
        document.getElementById('stats-month').textContent = monthCompletions;
        
        // 最長記録
        const longestStreak = Math.max(...this.habits.map(h => h.bestStreak), 0);
        document.getElementById('stats-longest').textContent = longestStreak;
        
        // 習慣別統計
        this.renderHabitsStats();
    }
    
    renderHabitsStats() {
        const statsListEl = document.getElementById('habits-stats-list');
        
        if (this.habits.length === 0) {
            statsListEl.innerHTML = '<p>まだ習慣がありません</p>';
            return;
        }
        
        statsListEl.innerHTML = this.habits.map(habit => `
            <div class="habit-stat-item">
                <div>
                    <span class="habit-icon">${this.getPlantIcon(habit.id)}</span>
                    <strong>${this.escapeHtml(habit.name)}</strong>
                </div>
                <div>
                    <span>現在: ${habit.currentStreak}日</span> | 
                    <span>最高: ${habit.bestStreak}日</span> | 
                    <span>合計: ${habit.totalCompletions}回</span>
                </div>
            </div>
        `).join('');
    }
    
    // 設定描画
    renderSettings() {
        document.getElementById('auto-celebration').checked = this.settings.autoCelebration;
        document.getElementById('sound-effects').checked = this.settings.soundEffects;
        document.getElementById('daily-reminders').checked = this.settings.dailyReminders;
        document.getElementById('reminder-time').value = this.settings.reminderTime;
    }
    
    updateSettings() {
        this.settings.autoCelebration = document.getElementById('auto-celebration').checked;
        this.settings.soundEffects = document.getElementById('sound-effects').checked;
        this.settings.dailyReminders = document.getElementById('daily-reminders').checked;
        this.settings.reminderTime = document.getElementById('reminder-time').value;
        
        this.saveData();
        this.showNotification('設定が保存されました', 'success');
    }
    
    // お祝い表示
    showCelebration(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;
        
        const stage = this.getPlantGrowthStage(habitId);
        const plantIcon = this.getPlantIcon(habitId);
        
        const messages = {
            seed: '新しい種が芽を出しました！',
            sprout: '芽が育ってきています！',
            young: '若い木に成長しました！',
            mature: '立派な木になりました！',
            blooming: '美しく開花しました！'
        };
        
        document.getElementById('celebration-message').textContent = 
            messages[stage] || '習慣を達成しました！';
        
        document.getElementById('celebration-plant').innerHTML = 
            `<div class="plant-visual">${plantIcon}</div>`;
        
        this.openModal('celebration-modal');
        
        // パーティクル効果
        this.createCelebrationParticles();
    }
    
    createCelebrationParticles() {
        const particles = document.createElement('div');
        particles.className = 'celebration-particles';
        document.body.appendChild(particles);
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.backgroundColor = [
                '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'
            ][Math.floor(Math.random() * 6)];
            
            particles.appendChild(particle);
        }
        
        setTimeout(() => particles.remove(), 3000);
    }
    
    // ユーティリティ関数
    calculateOverallStreak() {
        const dates = Object.keys(this.completions).sort().reverse();
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            const dateObj = new Date(date);
            const daysDiff = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === i && this.completions[date].length > 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    getCompletionsInRange(startDate, endDate) {
        let count = 0;
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        
        Object.keys(this.completions).forEach(date => {
            if (date >= start && date <= end) {
                count += this.completions[date].length;
            }
        });
        
        return count;
    }
    
    checkDateChange() {
        const currentDate = new Date().toISOString().split('T')[0];
        if (currentDate !== this.currentDate) {
            this.currentDate = currentDate;
            this.render();
        }
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    playSuccessSound() {
        if (this.settings.soundEffects && this.successSound) {
            this.successSound.currentTime = 0;
            this.successSound.play().catch(() => {
                // 音声再生に失敗した場合は無視
            });
        }
    }
    
    // レスポンシブ対応
    toggleSidebarVisibility() {
        this.sidebar.classList.toggle('open');
    }
    
    handleResize() {
        if (window.innerWidth > 768) {
            this.sidebar.classList.remove('open');
        }
    }
    
    // データ管理
    exportData() {
        const data = {
            habits: this.habits,
            completions: this.completions,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-forest-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('データをエクスポートしました', 'success');
    }
    
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.habits && data.completions) {
                    if (confirm('現在のデータを上書きしますか？この操作は元に戻せません。')) {
                        this.habits = data.habits;
                        this.completions = data.completions;
                        if (data.settings) {
                            this.settings = { ...this.settings, ...data.settings };
                        }
                        this.saveData();
                        this.render();
                        this.showNotification('データをインポートしました', 'success');
                    }
                } else {
                    this.showNotification('無効なデータファイルです', 'error');
                }
            } catch (error) {
                this.showNotification('ファイルの読み込みに失敗しました', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        e.target.value = '';
    }
    
    resetData() {
        if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
            if (confirm('本当によろしいですか？すべての習慣と記録が失われます。')) {
                this.habits = [];
                this.completions = {};
                localStorage.removeItem('habitforest_habits');
                localStorage.removeItem('habitforest_completions');
                this.render();
                this.showNotification('すべてのデータがリセットされました', 'info');
            }
        }
    }
    
    // 通知表示
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            max-width: 300px;
        `;
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// アプリケーションの初期化
let habitForest;
document.addEventListener('DOMContentLoaded', () => {
    habitForest = new HabitForest();
    
    // グローバルアクセス用
    window.habitForest = habitForest;
    
    // PWA対応のための追加設定
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service Worker の登録に失敗した場合は無視
        });
    }
});

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                habitForest?.openAddHabitModal();
                break;
            case 's':
                e.preventDefault();
                habitForest?.saveData();
                habitForest?.showNotification('データを保存しました', 'success');
                break;
        }
    }
    
    if (e.key === 'Escape') {
        // 開いているモーダルを閉じる
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});