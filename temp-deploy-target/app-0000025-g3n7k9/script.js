// ThinkBot AI - 思考プロセスを可視化するAIアシスタント
class ThinkBotAI {
    constructor() {
        this.messages = [];
        this.thinkingSteps = [];
        this.isProcessing = false;
        this.currentSessionId = this.generateSessionId();
        
        this.settings = {
            aiModel: 'balanced',
            responseSpeed: 50,
            showThinking: true,
            darkMode: false,
            fontSize: 'medium'
        };
        
        this.aiResponses = {
            balanced: {
                speed: 1000,
                style: 'バランスの取れた回答を提供します'
            },
            creative: {
                speed: 1500,
                style: '創造的で独創的な回答を提供します'
            },
            precise: {
                speed: 2000,
                style: '正確で詳細な回答を提供します'
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadMessages();
        this.setupEventListeners();
        this.applySettings();
        this.adjustTextareaHeight();
    }
    
    setupEventListeners() {
        // メニューとサイドバー
        document.getElementById('menu-btn').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebar-toggle').addEventListener('click', () => this.toggleSidebar());
        
        // チャット入力
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('input', (e) => this.handleInputChange(e));
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 送信ボタン
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        
        // スタータープロンプト
        document.querySelectorAll('.prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.dataset.prompt;
                document.getElementById('chat-input').value = prompt;
                this.sendMessage();
            });
        });
        
        // 新規チャット
        document.getElementById('new-chat-btn').addEventListener('click', () => this.startNewChat());
        
        // 設定
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());
        
        // 設定の変更
        document.getElementById('ai-model').addEventListener('change', (e) => {
            this.settings.aiModel = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('response-speed').addEventListener('input', (e) => {
            this.settings.responseSpeed = e.target.value;
            this.updateSpeedLabel(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('show-thinking').addEventListener('change', (e) => {
            this.settings.showThinking = e.target.checked;
            this.toggleThinkingPanel(e.target.checked);
            this.saveSettings();
        });
        
        document.getElementById('dark-mode').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            this.toggleDarkMode(e.target.checked);
            this.saveSettings();
        });
        
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.settings.fontSize = e.target.value;
            this.applyFontSize(e.target.value);
            this.saveSettings();
        });
        
        // データ管理
        document.getElementById('export-chat').addEventListener('click', () => this.exportChat());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        
        // その他の機能
        document.getElementById('voice-input-btn').addEventListener('click', () => this.toggleVoiceInput());
        document.getElementById('attach-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileUpload(e));
        
        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.handleResize());
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }
    
    handleInputChange(e) {
        const input = e.target;
        const charCount = input.value.length;
        document.getElementById('char-count').textContent = charCount;
        
        // 自動高さ調整
        this.adjustTextareaHeight();
        
        // 送信ボタンの状態
        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = charCount === 0 || this.isProcessing;
    }
    
    adjustTextareaHeight() {
        const textarea = document.getElementById('chat-input');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || this.isProcessing) return;
        
        // メッセージを追加
        this.addMessage('user', message);
        
        // 入力をクリア
        input.value = '';
        this.handleInputChange({ target: input });
        
        // ウェルカムメッセージを隠す
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }
        
        // AI応答を処理
        this.processAIResponse(message);
    }
    
    async processAIResponse(userMessage) {
        this.isProcessing = true;
        this.showLoading(true);
        this.updateThinkingStatus('active');
        
        // 思考プロセスをクリア
        this.clearThinkingSteps();
        
        // 思考プロセスのシミュレーション
        const thinkingSteps = [
            { icon: 'fas fa-search', title: '情報を分析中...', content: 'ユーザーの質問を理解し、関連する情報を検索しています。' },
            { icon: 'fas fa-brain', title: '関連性を評価中...', content: '見つかった情報の関連性と信頼性を評価しています。' },
            { icon: 'fas fa-cogs', title: '回答を構築中...', content: '最適な回答を構築し、わかりやすく整理しています。' },
            { icon: 'fas fa-check', title: '最終確認中...', content: '回答の正確性と完全性を確認しています。' }
        ];
        
        const startTime = Date.now();
        const modelSettings = this.aiResponses[this.settings.aiModel];
        const speed = modelSettings.speed * (1 - this.settings.responseSpeed / 100);
        
        // 思考ステップを順番に表示
        for (let i = 0; i < thinkingSteps.length; i++) {
            await this.delay(speed / 4);
            if (this.settings.showThinking) {
                this.addThinkingStep(thinkingSteps[i]);
            }
        }
        
        // AI応答を生成
        const aiResponse = await this.generateAIResponse(userMessage);
        
        // 処理時間を計算
        const processTime = ((Date.now() - startTime) / 1000).toFixed(1);
        this.updateMetrics(processTime, '95%', aiResponse.length);
        
        // 応答を追加
        this.addMessage('ai', aiResponse);
        
        this.isProcessing = false;
        this.showLoading(false);
        this.updateThinkingStatus('completed');
    }
    
    async generateAIResponse(userMessage) {
        // 簡単なルールベースのレスポンス生成
        const responses = {
            'プログラミングの勉強方法': '効果的なプログラミング学習方法をご紹介します：\n\n1. **基礎から始める**: 選んだ言語の基本構文をしっかり理解しましょう。\n2. **実践的なプロジェクト**: 小さなプロジェクトから始めて、徐々に複雑なものに挑戦してください。\n3. **コードを読む**: 他の人のコードを読むことで、新しいパターンや技術を学べます。\n4. **定期的な練習**: 毎日少しずつでも継続することが大切です。\n5. **コミュニティへの参加**: フォーラムやGitHubで他の開発者と交流しましょう。',
            
            '効果的な時間管理': '時間管理を改善する方法：\n\n• **優先順位の設定**: タスクを重要度と緊急度で分類しましょう。\n• **ポモドーロテクニック**: 25分作業、5分休憩のサイクルを試してみてください。\n• **時間ブロッキング**: カレンダーに特定のタスクの時間を予約しましょう。\n• **断る勇気**: すべてを引き受けず、重要なことに集中しましょう。',
            
            '健康的な生活習慣': '健康的な生活を送るためのアドバイス：\n\n1. **規則正しい睡眠**: 毎日同じ時間に寝起きしましょう。\n2. **バランスの取れた食事**: 野菜、果物、タンパク質をバランスよく摂取してください。\n3. **定期的な運動**: 週3回以上、30分程度の運動を心がけましょう。\n4. **ストレス管理**: 瞑想や深呼吸でストレスを軽減しましょう。',
            
            '創造性を高める方法': '創造性を向上させる方法：\n\n• **新しい経験**: 普段と違うことに挑戦してみましょう。\n• **マインドマップ**: アイデアを視覚的に整理してみてください。\n• **制約を設ける**: あえて制限を設けることで創造性が刺激されます。\n• **休憩の重要性**: リラックスした状態で良いアイデアが生まれやすくなります。'
        };
        
        // キーワードマッチング
        for (const [key, response] of Object.entries(responses)) {
            if (userMessage.includes(key.substring(0, 10))) {
                return response;
            }
        }
        
        // デフォルト応答
        return `「${userMessage}」についてのご質問ありがとうございます。\n\nこの質問に対する私の見解は以下の通りです：\n\n${this.aiResponses[this.settings.aiModel].style}\n\n具体的な情報やアドバイスが必要な場合は、より詳細な質問をしていただければ、それに応じた回答を提供させていただきます。`;
    }
    
    addMessage(type, content) {
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.saveMessages();
        
        // スクロール
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.type}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageEl.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${message.type === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${message.type === 'user' ? 'あなた' : 'ThinkBot AI'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.formatMessage(message.content)}</div>
                ${message.type === 'ai' ? `
                    <div class="message-actions">
                        <button class="message-action" onclick="app.copyMessage('${message.id}')">
                            <i class="fas fa-copy"></i> コピー
                        </button>
                        <button class="message-action" onclick="app.regenerateMessage('${message.id}')">
                            <i class="fas fa-redo"></i> 再生成
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
    }
    
    formatMessage(content) {
        // 改行を<br>に変換
        content = content.replace(/\n/g, '<br>');
        
        // マークダウン風の装飾
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        
        return content;
    }
    
    addThinkingStep(step) {
        const container = document.getElementById('thinking-content');
        
        // プレースホルダーを削除
        const placeholder = container.querySelector('.thinking-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const stepEl = document.createElement('div');
        stepEl.className = 'thinking-step';
        stepEl.innerHTML = `
            <div class="thinking-step-header">
                <i class="${step.icon}"></i>
                <span>${step.title}</span>
            </div>
            <div class="thinking-step-content">${step.content}</div>
        `;
        
        container.appendChild(stepEl);
    }
    
    clearThinkingSteps() {
        const container = document.getElementById('thinking-content');
        container.innerHTML = '';
    }
    
    updateThinkingStatus(status) {
        const statusEl = document.getElementById('thinking-status');
        
        if (status === 'active') {
            statusEl.className = 'thinking-status active';
            statusEl.innerHTML = '<i class="fas fa-circle"></i> 処理中';
        } else if (status === 'completed') {
            statusEl.className = 'thinking-status';
            statusEl.innerHTML = '<i class="fas fa-check-circle"></i> 完了';
            
            setTimeout(() => {
                statusEl.innerHTML = '<i class="fas fa-circle"></i> 待機中';
            }, 3000);
        }
    }
    
    updateMetrics(time, confidence, tokens) {
        document.getElementById('process-time').textContent = time + 's';
        document.getElementById('confidence').textContent = confidence;
        document.getElementById('token-count').textContent = tokens;
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.toggle('active', show);
    }
    
    toggleThinkingPanel(show) {
        const sidebar = document.getElementById('sidebar');
        if (!show && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
        }
    }
    
    updateSpeedLabel(value) {
        const label = document.querySelector('#response-speed + .range-value');
        if (value < 33) {
            label.textContent = '遅い';
        } else if (value < 66) {
            label.textContent = '標準';
        } else {
            label.textContent = '速い';
        }
    }
    
    toggleDarkMode(enabled) {
        document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    }
    
    applyFontSize(size) {
        const root = document.documentElement;
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        root.style.setProperty('font-size', sizes[size]);
    }
    
    openSettings() {
        document.getElementById('settings-modal').classList.add('active');
        
        // 現在の設定を反映
        document.getElementById('ai-model').value = this.settings.aiModel;
        document.getElementById('response-speed').value = this.settings.responseSpeed;
        document.getElementById('show-thinking').checked = this.settings.showThinking;
        document.getElementById('dark-mode').checked = this.settings.darkMode;
        document.getElementById('font-size').value = this.settings.fontSize;
        
        this.updateSpeedLabel(this.settings.responseSpeed);
    }
    
    closeSettings() {
        document.getElementById('settings-modal').classList.remove('active');
    }
    
    startNewChat() {
        if (confirm('新しいチャットを開始しますか？現在の会話は保存されます。')) {
            this.messages = [];
            document.getElementById('chat-messages').innerHTML = '';
            this.clearThinkingSteps();
            this.currentSessionId = this.generateSessionId();
            this.showWelcomeMessage();
            this.saveMessages();
        }
    }
    
    showWelcomeMessage() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h2>ThinkBot AIへようこそ！</h2>
                <p>私は思考プロセスを可視化するAIアシスタントです。</p>
                <p>何でもお聞きください。私の考え方も一緒にお見せします。</p>
                
                <div class="starter-prompts">
                    <button class="prompt-chip" data-prompt="プログラミングの勉強方法を教えて">
                        <i class="fas fa-code"></i> プログラミング学習
                    </button>
                    <button class="prompt-chip" data-prompt="効果的な時間管理の方法は？">
                        <i class="fas fa-clock"></i> 時間管理
                    </button>
                    <button class="prompt-chip" data-prompt="健康的な生活習慣について">
                        <i class="fas fa-heart"></i> 健康習慣
                    </button>
                    <button class="prompt-chip" data-prompt="創造性を高める方法">
                        <i class="fas fa-palette"></i> 創造性向上
                    </button>
                </div>
            </div>
        `;
        
        // イベントリスナーを再設定
        document.querySelectorAll('.prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.dataset.prompt;
                document.getElementById('chat-input').value = prompt;
                this.sendMessage();
            });
        });
    }
    
    copyMessage(messageId) {
        const message = this.messages.find(m => m.id == messageId);
        if (message) {
            navigator.clipboard.writeText(message.content).then(() => {
                this.showToast('メッセージをコピーしました', 'success');
            });
        }
    }
    
    regenerateMessage(messageId) {
        const messageIndex = this.messages.findIndex(m => m.id == messageId);
        if (messageIndex > 0) {
            const userMessage = this.messages[messageIndex - 1].content;
            
            // 元のメッセージを削除
            this.messages.splice(messageIndex, 1);
            
            // メッセージを再描画
            const messagesContainer = document.getElementById('chat-messages');
            const messageElements = messagesContainer.querySelectorAll('.message');
            messageElements[messageIndex].remove();
            
            // 再生成
            this.processAIResponse(userMessage);
        }
    }
    
    exportChat() {
        const data = {
            sessionId: this.currentSessionId,
            messages: this.messages,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `thinkbot-chat-${this.currentSessionId}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('チャット履歴をエクスポートしました', 'success');
    }
    
    clearHistory() {
        if (confirm('すべてのチャット履歴を削除しますか？この操作は元に戻せません。')) {
            localStorage.removeItem('thinkbot_messages');
            this.messages = [];
            this.showWelcomeMessage();
            this.showToast('履歴を削除しました', 'success');
        }
    }
    
    toggleVoiceInput() {
        this.showToast('音声入力機能は開発中です', 'info');
    }
    
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.showToast(`ファイル「${file.name}」を受け取りました（機能開発中）`, 'info');
            e.target.value = '';
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    handleResize() {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (!sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
            }
        }
    }
    
    generateSessionId() {
        return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    saveSettings() {
        localStorage.setItem('thinkbot_settings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('thinkbot_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    applySettings() {
        this.toggleDarkMode(this.settings.darkMode);
        this.applyFontSize(this.settings.fontSize);
        this.toggleThinkingPanel(this.settings.showThinking);
    }
    
    saveMessages() {
        localStorage.setItem('thinkbot_messages', JSON.stringify(this.messages));
    }
    
    loadMessages() {
        const saved = localStorage.getItem('thinkbot_messages');
        if (saved) {
            this.messages = JSON.parse(saved);
            if (this.messages.length > 0) {
                this.messages.forEach(msg => this.renderMessage(msg));
            } else {
                this.showWelcomeMessage();
            }
        } else {
            this.showWelcomeMessage();
        }
    }
}

// アプリケーションの初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ThinkBotAI();
});