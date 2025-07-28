// Emotion Topography - 感情の地形図
class EmotionTopography {
    constructor() {
        this.emotions = this.loadData();
        this.currentPeriod = 'week';
        this.currentView = '3d';
        this.isAnimationEnabled = true;
        
        this.emotionColors = {
            joy: '#10b981',
            excitement: '#f59e0b',
            love: '#ec4899',
            gratitude: '#8b5cf6',
            hope: '#06b6d4',
            peace: '#84cc16',
            confidence: '#f97316',
            calm: '#6b7280',
            focused: '#4f46e5',
            thoughtful: '#7c3aed',
            sadness: '#3b82f6',
            anger: '#ef4444',
            fear: '#7c2d12',
            anxiety: '#dc2626',
            frustration: '#ea580c',
            loneliness: '#6366f1',
            stress: '#b91c1c'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.updateVisualization();
        this.updateStats();
        this.loadSettings();
        
        // 初期状態の表示
        if (this.emotions.length === 0) {
            this.showEmptyState();
        }
    }
    
    setupEventListeners() {
        // フォーム送信
        document.getElementById('emotion-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEmotion();
        });
        
        // 強度スライダー
        document.getElementById('intensity-slider').addEventListener('input', (e) => {
            document.getElementById('intensity-value').textContent = e.target.value;
        });
        
        // パネル切り替え
        document.getElementById('panel-toggle').addEventListener('click', () => {
            this.togglePanel();
        });
        
        // 期間ボタン
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePeriod(e.target.dataset.period);
            });
        });
        
        // 表示ボタン
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });
        
        // 設定モーダル
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openModal('settings-modal');
        });
        
        document.getElementById('close-settings').addEventListener('click', () => {
            this.closeModal('settings-modal');
        });
        
        // データ管理
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });
        
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
        
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.clearData();
        });
        
        // 設定の変更
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });
        
        document.getElementById('animations-toggle').addEventListener('change', (e) => {
            this.isAnimationEnabled = e.target.checked;
            this.saveSettings();
        });
        
        // 記録開始ボタン
        document.getElementById('start-recording').addEventListener('click', () => {
            document.getElementById('emotion-select').focus();
        });
        
        // モーダル外クリック
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // ESCキー
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay').forEach(modal => {
                    if (modal.getAttribute('aria-hidden') === 'false') {
                        this.closeModal(modal.id);
                    }
                });
            }
        });
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('topography-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // キャンバスサイズを調整
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // キャンバスクリック
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.updateVisualization();
    }
    
    addEmotion() {
        const select = document.getElementById('emotion-select');
        const intensity = parseInt(document.getElementById('intensity-slider').value);
        const note = document.getElementById('emotion-note').value;
        const tags = document.getElementById('emotion-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        if (!select.value) {
            alert('感情を選択してください');
            return;
        }
        
        const emotion = {
            id: Date.now(),
            type: select.value,
            intensity: intensity,
            note: note,
            tags: tags,
            timestamp: new Date().toISOString(),
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height
        };
        
        this.emotions.push(emotion);
        this.saveData();
        this.updateVisualization();
        this.updateStats();
        
        // フォームリセット
        document.getElementById('emotion-form').reset();
        document.getElementById('intensity-value').textContent = '5';
        
        // 成功フィードバック
        this.showNotification('感情を記録しました', 'success');
        
        // 空状態を隠す
        this.hideEmptyState();
    }
    
    updateVisualization() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const filteredEmotions = this.getFilteredEmotions();
        
        if (filteredEmotions.length === 0) {
            this.drawEmptyCanvas();
            return;
        }
        
        switch (this.currentView) {
            case '3d':
                this.draw3DTopography(filteredEmotions);
                break;
            case 'heatmap':
                this.drawHeatmap(filteredEmotions);
                break;
            case 'timeline':
                this.drawTimeline(filteredEmotions);
                break;
        }
    }
    
    draw3DTopography(emotions) {
        // グラデーション背景
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0e7ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 感情ポイントを描画
        emotions.forEach((emotion, index) => {
            this.drawEmotionPoint(emotion, index);
        });
        
        // 等高線を描画
        this.drawContourLines(emotions);
    }
    
    drawEmotionPoint(emotion, index) {
        const color = this.emotionColors[emotion.type] || '#6b7280';
        const radius = (emotion.intensity / 10) * 30 + 10;
        
        // 影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // グラデーション円
        const gradient = this.ctx.createRadialGradient(
            emotion.x, emotion.y, 0,
            emotion.x, emotion.y, radius
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '40');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(emotion.x, emotion.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // リセット影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 境界線
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // ラベル
        this.ctx.fillStyle = '#1f2937';
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            this.getEmotionLabel(emotion.type),
            emotion.x,
            emotion.y - radius - 10
        );
    }
    
    drawContourLines(emotions) {
        // 簡易的な等高線
        const gridSize = 50;
        const cols = Math.ceil(this.canvas.width / gridSize);
        const rows = Math.ceil(this.canvas.height / gridSize);
        
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * gridSize;
                const y = j * gridSize;
                
                const intensity = this.calculateIntensityAt(x, y, emotions);
                if (intensity > 3) {
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, intensity * 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    calculateIntensityAt(x, y, emotions) {
        let totalIntensity = 0;
        let count = 0;
        
        emotions.forEach(emotion => {
            const distance = Math.sqrt(
                Math.pow(x - emotion.x, 2) + Math.pow(y - emotion.y, 2)
            );
            
            if (distance < 100) {
                const influence = Math.max(0, 1 - distance / 100);
                totalIntensity += emotion.intensity * influence;
                count++;
            }
        });
        
        return count > 0 ? totalIntensity / count : 0;
    }
    
    drawHeatmap(emotions) {
        // ヒートマップ実装
        const cellSize = 20;
        const cols = Math.ceil(this.canvas.width / cellSize);
        const rows = Math.ceil(this.canvas.height / cellSize);
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * cellSize;
                const y = j * cellSize;
                
                const intensity = this.calculateIntensityAt(x, y, emotions);
                const alpha = Math.min(intensity / 10, 1);
                
                this.ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
                this.ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
    }
    
    drawTimeline(emotions) {
        if (emotions.length === 0) return;
        
        const margin = 50;
        const chartWidth = this.canvas.width - margin * 2;
        const chartHeight = this.canvas.height - margin * 2;
        
        // 軸を描画
        this.ctx.strokeStyle = '#6b7280';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(margin, margin);
        this.ctx.lineTo(margin, margin + chartHeight);
        this.ctx.lineTo(margin + chartWidth, margin + chartHeight);
        this.ctx.stroke();
        
        // データポイントを描画
        const sortedEmotions = [...emotions].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        sortedEmotions.forEach((emotion, index) => {
            const x = margin + (index / (sortedEmotions.length - 1)) * chartWidth;
            const y = margin + chartHeight - (emotion.intensity / 10) * chartHeight;
            
            const color = this.emotionColors[emotion.type] || '#6b7280';
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 線でつなぐ
            if (index > 0) {
                const prevX = margin + ((index - 1) / (sortedEmotions.length - 1)) * chartWidth;
                const prevY = margin + chartHeight - (sortedEmotions[index - 1].intensity / 10) * chartHeight;
                
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
        });
    }
    
    drawEmptyCanvas() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#f1f5f9');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 格子模様
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    getFilteredEmotions() {
        const now = new Date();
        let startDate;
        
        switch (this.currentPeriod) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0);
        }
        
        return this.emotions.filter(emotion => 
            new Date(emotion.timestamp) >= startDate
        );
    }
    
    updateStats() {
        const filteredEmotions = this.getFilteredEmotions();
        
        // 記録数
        document.getElementById('total-entries').textContent = filteredEmotions.length;
        
        // 平均気分
        if (filteredEmotions.length > 0) {
            const avgIntensity = filteredEmotions.reduce((sum, e) => sum + e.intensity, 0) / filteredEmotions.length;
            document.getElementById('avg-mood').textContent = avgIntensity.toFixed(1);
        } else {
            document.getElementById('avg-mood').textContent = '-';
        }
        
        // 連続記録日数
        const streakDays = this.calculateStreak();
        document.getElementById('streak-days').textContent = streakDays;
        
        // よくある感情
        const mostCommon = this.getMostCommonEmotion(filteredEmotions);
        document.getElementById('most-common').textContent = 
            mostCommon ? this.getEmotionLabel(mostCommon) : '-';
    }
    
    calculateStreak() {
        if (this.emotions.length === 0) return 0;
        
        const sortedEmotions = [...this.emotions].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const emotion of sortedEmotions) {
            const emotionDate = new Date(emotion.timestamp);
            emotionDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((currentDate - emotionDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (diffDays > streak) {
                break;
            }
        }
        
        return streak;
    }
    
    getMostCommonEmotion(emotions) {
        if (emotions.length === 0) return null;
        
        const counts = {};
        emotions.forEach(emotion => {
            counts[emotion.type] = (counts[emotion.type] || 0) + 1;
        });
        
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }
    
    getEmotionLabel(type) {
        const labels = {
            joy: '喜び',
            excitement: '興奮',
            love: '愛',
            gratitude: '感謝',
            hope: '希望',
            peace: '平和',
            confidence: '自信',
            calm: '穏やか',
            focused: '集中',
            thoughtful: '思考的',
            sadness: '悲しみ',
            anger: '怒り',
            fear: '恐れ',
            anxiety: '不安',
            frustration: 'イライラ',
            loneliness: '孤独',
            stress: 'ストレス'
        };
        return labels[type] || type;
    }
    
    changePeriod(period) {
        this.currentPeriod = period;
        
        // ボタンの状態更新
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        
        this.updateVisualization();
        this.updateStats();
    }
    
    changeView(view) {
        this.currentView = view;
        
        // ボタンの状態更新
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.updateVisualization();
    }
    
    togglePanel() {
        const panel = document.getElementById('emotion-panel');
        panel.classList.toggle('collapsed');
        
        const icon = document.querySelector('#panel-toggle i');
        icon.classList.toggle('fa-chevron-left');
        icon.classList.toggle('fa-chevron-right');
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    
    showEmptyState() {
        document.getElementById('empty-state').style.display = 'block';
    }
    
    hideEmptyState() {
        document.getElementById('empty-state').style.display = 'none';
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // クリックされた感情ポイントを探す
        const clickedEmotion = this.getFilteredEmotions().find(emotion => {
            const distance = Math.sqrt(
                Math.pow(x - emotion.x, 2) + Math.pow(y - emotion.y, 2)
            );
            const radius = (emotion.intensity / 10) * 30 + 10;
            return distance <= radius;
        });
        
        if (clickedEmotion) {
            this.showEmotionDetail(clickedEmotion);
        }
    }
    
    showEmotionDetail(emotion) {
        const modal = document.getElementById('detail-modal');
        const content = document.getElementById('detail-content');
        
        const date = new Date(emotion.timestamp).toLocaleString('ja-JP');
        
        content.innerHTML = `
            <div class="emotion-detail">
                <h3>${this.getEmotionLabel(emotion.type)}</h3>
                <p><strong>強さ:</strong> ${emotion.intensity}/10</p>
                <p><strong>日時:</strong> ${date}</p>
                ${emotion.note ? `<p><strong>メモ:</strong> ${emotion.note}</p>` : ''}
                ${emotion.tags.length > 0 ? `<p><strong>タグ:</strong> ${emotion.tags.join(', ')}</p>` : ''}
                <button onclick="app.deleteEmotion(${emotion.id})" class="action-btn danger">削除</button>
            </div>
        `;
        
        this.openModal('detail-modal');
    }
    
    deleteEmotion(id) {
        if (confirm('この感情記録を削除しますか？')) {
            this.emotions = this.emotions.filter(e => e.id !== id);
            this.saveData();
            this.updateVisualization();
            this.updateStats();
            this.closeModal('detail-modal');
            this.showNotification('感情記録を削除しました', 'info');
            
            if (this.emotions.length === 0) {
                this.showEmptyState();
            }
        }
    }
    
    exportData() {
        const data = {
            emotions: this.emotions,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `emotion-topography-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('データをエクスポートしました', 'success');
    }
    
    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.emotions && Array.isArray(data.emotions)) {
                    if (confirm('既存のデータを上書きしますか？')) {
                        this.emotions = data.emotions;
                        this.saveData();
                        this.updateVisualization();
                        this.updateStats();
                        this.hideEmptyState();
                        this.showNotification('データをインポートしました', 'success');
                    }
                } else {
                    throw new Error('無効なデータ形式');
                }
            } catch (error) {
                alert('ファイルの読み込みに失敗しました: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
    
    clearData() {
        if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
            this.emotions = [];
            this.saveData();
            this.updateVisualization();
            this.updateStats();
            this.showEmptyState();
            this.showNotification('すべてのデータを削除しました', 'info');
        }
    }
    
    toggleDarkMode(enabled) {
        document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
        this.saveSettings();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    saveData() {
        localStorage.setItem('emotionTopographyData', JSON.stringify(this.emotions));
    }
    
    loadData() {
        const saved = localStorage.getItem('emotionTopographyData');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveSettings() {
        const settings = {
            darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
            animations: this.isAnimationEnabled
        };
        localStorage.setItem('emotionTopographySettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('emotionTopographySettings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            if (settings.darkMode) {
                document.getElementById('dark-mode-toggle').checked = true;
                this.toggleDarkMode(true);
            }
            
            if (settings.animations !== undefined) {
                this.isAnimationEnabled = settings.animations;
                document.getElementById('animations-toggle').checked = settings.animations;
            }
        }
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EmotionTopography();
});

// アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);