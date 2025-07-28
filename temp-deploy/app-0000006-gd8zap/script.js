class ChatSystem {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.sessionStartTime = new Date();
        this.messageCount = 1; // Initial AI greeting
        this.currentTheme = localStorage.getItem('chat-theme') || 'light';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.applyTheme();
        this.startSessionTimer();
        this.loadChatHistory();
        
        // AI responses database
        this.aiResponses = this.createResponseDatabase();
        
        console.log('🤖 Chat System initialized');
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.charCount = document.getElementById('charCount');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.messageCountElement = document.getElementById('messageCount');
        this.sessionTimeElement = document.getElementById('sessionTime');
        this.clearChatButton = document.getElementById('clearChat');
        this.downloadChatButton = document.getElementById('downloadChat');
        this.themeToggleButton = document.getElementById('themeToggle');
        this.scrollToBottomButton = document.getElementById('scrollToBottom');
        this.voiceInputButton = document.getElementById('voiceInput');
    }

    initializeEventListeners() {
        // メッセージ送信
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // テキストエリアの自動リサイズ
        this.messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResizeTextarea();
        });

        // コントロールボタン
        this.clearChatButton.addEventListener('click', () => this.clearChat());
        this.downloadChatButton.addEventListener('click', () => this.downloadChatHistory());
        this.themeToggleButton.addEventListener('click', () => this.toggleTheme());
        this.scrollToBottomButton.addEventListener('click', () => this.scrollToBottom());
        this.voiceInputButton.addEventListener('click', () => this.startVoiceInput());

        // チャットメッセージエリアのスクロール監視
        this.chatMessages.addEventListener('scroll', () => this.handleScroll());
    }

    createResponseDatabase() {
        return {
            greeting: [
                "こんにちは！今日はどのようなことでお手伝いできますか？",
                "お疲れ様です！何かご質問はありますか？",
                "いらっしゃいませ！お気軽に何でもお聞きください。"
            ],
            general: [
                "なるほど、興味深いですね。詳しく教えていただけますか？",
                "そうですね。それについて考えてみましょう。",
                "いい質問ですね！私の見解をお伝えします。",
                "とても重要なポイントですね。以下のように考えています。",
                "その通りです。さらに詳細に説明させていただきます。"
            ],
            technical: [
                "技術的な観点から見ると、いくつかのアプローチが考えられます。",
                "プログラミングに関してですね。具体的な実装方法をご提案します。",
                "システム設計の観点から、以下の要素を考慮する必要があります。",
                "開発効率を向上させるために、このような手法が有効です。"
            ],
            creative: [
                "クリエイティブなアイデアですね！以下のような発想はいかがでしょうか？",
                "芸術的な視点から見ると、とても面白いアプローチです。",
                "創造性を活かして、新しい可能性を探ってみましょう。",
                "デザイン思考を取り入れると、より良いソリューションが見つかりそうです。"
            ],
            problem_solving: [
                "問題解決のために、段階的にアプローチしてみましょう。",
                "まず原因を特定し、それから解決策を検討しましょう。",
                "この課題には複数の解決方法があります。一つずつ見ていきましょう。",
                "効果的な解決策を見つけるため、以下の手順で進めましょう。"
            ]
        };
    }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || this.isTyping) return;

        // ユーザーメッセージを追加
        this.addMessage(text, 'user');
        this.messageInput.value = '';
        this.updateCharCount();
        this.autoResizeTextarea();
        
        // AI応答をシミュレート
        this.simulateAIResponse(text);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleString('ja-JP');
        
        messageContent.appendChild(messageText);
        messageContent.appendChild(timestamp);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        
        // メッセージを配列に保存
        this.messages.push({
            text,
            sender,
            timestamp: new Date().toISOString()
        });
        
        this.updateMessageCount();
        this.scrollToBottom();
        this.saveChatHistory();
    }

    simulateAIResponse(userMessage) {
        this.showTypingIndicator();
        this.isTyping = true;
        
        // AIレスポンスを生成
        const response = this.generateAIResponse(userMessage);
        
        // リアルなタイピング時間をシミュレート
        const typingTime = Math.max(1000, response.length * 50 + Math.random() * 2000);
        
        setTimeout(() => {
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
            this.isTyping = false;
        }, typingTime);
    }

    generateAIResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // キーワードベースの応答選択
        if (lowerMessage.includes('プログラミング') || lowerMessage.includes('コード') || 
            lowerMessage.includes('開発') || lowerMessage.includes('技術')) {
            return this.getRandomResponse('technical') + this.generateDetailedResponse(userMessage);
        }
        
        if (lowerMessage.includes('デザイン') || lowerMessage.includes('アート') || 
            lowerMessage.includes('創造') || lowerMessage.includes('アイデア')) {
            return this.getRandomResponse('creative') + this.generateDetailedResponse(userMessage);
        }
        
        if (lowerMessage.includes('問題') || lowerMessage.includes('困っ') || 
            lowerMessage.includes('解決') || lowerMessage.includes('どうすれば')) {
            return this.getRandomResponse('problem_solving') + this.generateDetailedResponse(userMessage);
        }
        
        if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして') || 
            lowerMessage.includes('よろしく')) {
            return this.getRandomResponse('greeting');
        }
        
        return this.getRandomResponse('general') + this.generateDetailedResponse(userMessage);
    }

    generateDetailedResponse(userMessage) {
        const responses = [
            `「${userMessage}」について、私なりの見解をお伝えします。`,
            `ご質問の件ですが、以下のように考えています。`,
            `${userMessage.length > 20 ? '詳細な' : ''}ご質問をありがとうございます。`,
            `お役に立てるよう、具体的にお答えします。`,
            `興味深いトピックですね。私の経験からお話しします。`
        ];
        
        return ' ' + responses[Math.floor(Math.random() * responses.length)];
    }

    getRandomResponse(category) {
        const responses = this.aiResponses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
        this.sendButton.disabled = true;
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
        this.sendButton.disabled = false;
    }

    updateCharCount() {
        const length = this.messageInput.value.length;
        this.charCount.textContent = `${length} / 1000`;
        
        if (length > 800) {
            this.charCount.style.color = '#e53e3e';
        } else if (length > 600) {
            this.charCount.style.color = '#ed8936';
        } else {
            this.charCount.style.color = 'var(--text-secondary)';
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateMessageCount() {
        this.messageCount++;
        this.messageCountElement.textContent = this.messageCount;
    }

    clearChat() {
        if (confirm('チャット履歴をクリアしますか？')) {
            this.chatMessages.innerHTML = '';
            this.messages = [];
            this.messageCount = 0;
            this.updateMessageCount();
            this.saveChatHistory();
            
            // 初期メッセージを再追加
            setTimeout(() => {
                this.addMessage('こんにちは！私はAIアシスタントです。何でもお気軽にお聞きください。', 'ai');
            }, 300);
        }
    }

    downloadChatHistory() {
        const chatData = {
            sessionStart: this.sessionStartTime.toISOString(),
            sessionDuration: this.getSessionDuration(),
            messageCount: this.messageCount,
            messages: this.messages
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // CSV形式でもダウンロード可能
        setTimeout(() => {
            this.downloadChatAsCSV();
        }, 500);
    }

    downloadChatAsCSV() {
        const csvContent = [
            ['Timestamp', 'Sender', 'Message'],
            ...this.messages.map(msg => [
                new Date(msg.timestamp).toLocaleString('ja-JP'),
                msg.sender,
                `"${msg.text.replace(/"/g, '""')}"`
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('chat-theme', this.currentTheme);
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        this.themeToggleButton.textContent = this.currentTheme === 'light' ? '🌙 Dark' : '☀️ Light';
    }

    scrollToBottom() {
        this.chatMessages.scrollTo({
            top: this.chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        this.scrollToBottomButton.style.opacity = isNearBottom ? '0' : '1';
        this.scrollToBottomButton.style.pointerEvents = isNearBottom ? 'none' : 'auto';
    }

    startVoiceInput() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'ja-JP';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = () => {
                this.voiceInputButton.classList.add('pulse');
                this.voiceInputButton.textContent = '🔴';
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.updateCharCount();
                this.autoResizeTextarea();
            };
            
            recognition.onend = () => {
                this.voiceInputButton.classList.remove('pulse');
                this.voiceInputButton.textContent = '🎤';
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.voiceInputButton.classList.remove('pulse');
                this.voiceInputButton.textContent = '🎤';
            };
            
            recognition.start();
        } else {
            alert('お使いのブラウザは音声認識をサポートしていません。');
        }
    }

    startSessionTimer() {
        setInterval(() => {
            const duration = this.getSessionDuration();
            this.sessionTimeElement.textContent = duration;
        }, 1000);
    }

    getSessionDuration() {
        const now = new Date();
        const diff = now - this.sessionStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    saveChatHistory() {
        localStorage.setItem('chat-history', JSON.stringify(this.messages));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('chat-history');
        if (saved) {
            try {
                this.messages = JSON.parse(saved);
                this.messageCount = this.messages.length;
                this.updateMessageCount();
                
                // 保存されたメッセージを表示（初期メッセージ以外）
                this.messages.slice(1).forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${msg.sender}-message`;
                    
                    const avatar = document.createElement('div');
                    avatar.className = 'avatar';
                    avatar.textContent = msg.sender === 'user' ? '👤' : '🤖';
                    
                    const messageContent = document.createElement('div');
                    messageContent.className = 'message-content';
                    
                    const messageText = document.createElement('div');
                    messageText.className = 'message-text';
                    messageText.textContent = msg.text;
                    
                    const timestamp = document.createElement('div');
                    timestamp.className = 'timestamp';
                    timestamp.textContent = new Date(msg.timestamp).toLocaleString('ja-JP');
                    
                    messageContent.appendChild(messageText);
                    messageContent.appendChild(timestamp);
                    messageDiv.appendChild(avatar);
                    messageDiv.appendChild(messageContent);
                    
                    this.chatMessages.appendChild(messageDiv);
                });
                
                this.scrollToBottom();
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        }
    }
}

// システム初期化
document.addEventListener('DOMContentLoaded', () => {
    window.chatSystem = new ChatSystem();
});