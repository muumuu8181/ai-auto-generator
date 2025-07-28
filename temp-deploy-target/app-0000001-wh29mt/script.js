/**
 * Smart Finance Manager v5.0
 * Revolutionary AI-integrated platform
 */

class SmartFinanceManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('smartFinanceTransactions')) || [];
        this.currentTheme = localStorage.getItem('smartFinanceTheme') || 'dark';
        this.aiChatHistory = JSON.parse(localStorage.getItem('smartFinanceAIChatHistory')) || [];
        this.editingTransactionId = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Smart Finance Manager v5.0 初期化開始');
        
        // DOM要素の取得
        this.elements = {
            transactionForm: document.getElementById('transactionForm'),
            descriptionInput: document.getElementById('description'),
            amountInput: document.getElementById('amount'),
            categorySelect: document.getElementById('category'),
            typeSelect: document.getElementById('type'),
            dateInput: document.getElementById('date'),
            transactionsList: document.getElementById('transactionsList'),
            totalIncomeSpan: document.getElementById('totalIncome'),
            totalExpenseSpan: document.getElementById('totalExpense'),
            currentBalanceSpan: document.getElementById('currentBalance'),
            aiStatusBanner: document.getElementById('aiStatusBanner'),
            aiAnalysisResult: document.getElementById('aiAnalysisResult'),
            aiChatToggle: document.getElementById('aiChatToggle'),
            aiChat: document.getElementById('aiChat'),
            aiChatBody: document.getElementById('aiChatBody'),
            aiChatInput: document.getElementById('aiChatInput'),
            aiChatSend: document.getElementById('aiChatSend'),
            smartFilters: document.getElementById('smartFilters'),
            exportCSV: document.getElementById('exportCSV'),
            exportJSON: document.getElementById('exportJSON'),
            exportPDF: document.getElementById('exportPDF'),
            themeToggle: document.getElementById('themeToggle'),
            expenseChart: document.getElementById('expenseChart'),
            incomeChart: document.getElementById('incomeChart'),
            trendChart: document.getElementById('trendChart')
        };

        this.setupEventListeners();
        this.applyTheme();
        this.render();
        this.initializeAI();
        this.initializeCharts();
        
        // 初期日付設定
        if (this.elements.dateInput) {
            this.elements.dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        console.log('✅ Smart Finance Manager v5.0 初期化完了');
        this.showWelcomeMessage();
    }

    setupEventListeners() {
        // フォーム送信
        if (this.elements.transactionForm) {
            this.elements.transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit();
            });
        }

        // 取引タイプ変更時のカテゴリ更新
        if (this.elements.typeSelect) {
            this.elements.typeSelect.addEventListener('change', () => {
                this.updateCategoryOptions();
            });
        }

        // AIチャット関連
        if (this.elements.aiChatToggle) {
            this.elements.aiChatToggle.addEventListener('click', () => {
                this.toggleAIChat();
            });
        }

        if (this.elements.aiChatSend) {
            this.elements.aiChatSend.addEventListener('click', () => {
                this.sendAIMessage();
            });
        }

        if (this.elements.aiChatInput) {
            this.elements.aiChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAIMessage();
                }
            });
        }

        // エクスポート機能
        if (this.elements.exportCSV) {
            this.elements.exportCSV.addEventListener('click', () => {
                this.exportToCSV();
            });
        }

        if (this.elements.exportJSON) {
            this.elements.exportJSON.addEventListener('click', () => {
                this.exportToJSON();
            });
        }

        if (this.elements.exportPDF) {
            this.elements.exportPDF.addEventListener('click', () => {
                this.exportToPDF();
            });
        }

        // テーマ切り替え
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // リアルタイム検索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTransactions(e.target.value);
            });
        }

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleTransactionSubmit() {
        const description = this.elements.descriptionInput.value.trim();
        const amount = parseFloat(this.elements.amountInput.value);
        const category = this.elements.categorySelect.value;
        const type = this.elements.typeSelect.value;
        const date = this.elements.dateInput.value || new Date().toISOString().split('T')[0];

        if (!description || !amount || amount <= 0) {
            this.showNotification('説明と金額を正しく入力してください', 'error');
            return;
        }

        const transaction = {
            id: this.editingTransactionId || Date.now().toString(),
            description,
            amount,
            category: category || this.getAISuggestedCategory(description, type),
            type,
            date,
            timestamp: new Date().toISOString(),
            aiSuggested: !category
        };

        if (this.editingTransactionId) {
            const index = this.transactions.findIndex(t => t.id === this.editingTransactionId);
            if (index !== -1) {
                this.transactions[index] = transaction;
                this.showNotification('取引を更新しました', 'success');
            }
            this.editingTransactionId = null;
            document.querySelector('.btn-primary').textContent = '追加する';
        } else {
            this.transactions.unshift(transaction);
            this.showNotification('取引を追加しました', 'success');
        }

        this.saveData();
        this.render();
        this.resetForm();
        this.runAIAnalysis();
    }

    getAISuggestedCategory(description, type) {
        const keywords = {
            expense: {
                '食費': ['食事', '食べ物', 'レストラン', 'カフェ', 'コンビニ', 'スーパー', '弁当', 'ランチ', 'ディナー'],
                '交通費': ['電車', 'バス', 'タクシー', 'ガソリン', '駐車場', '高速', '切符', '定期'],
                '医療費': ['病院', '薬局', '薬', '診察', '治療', '歯医者', '眼科'],
                '娯楽費': ['映画', 'ゲーム', '本', '音楽', 'コンサート', '旅行', 'ホテル'],
                '公共料金': ['電気', 'ガス', '水道', '電話', 'インターネット', 'Wi-Fi'],
                '日用品': ['洗剤', 'シャンプー', 'トイレットペーパー', '掃除用品'],
                '衣服': ['服', '靴', 'バッグ', '帽子', 'アクセサリー'],
                '家賃': ['家賃', '管理費', '更新料', '敷金', '礼金']
            },
            income: {
                '給与': ['給料', '給与', 'サラリー', 'ボーナス', '賞与'],
                '副業': ['副業', 'バイト', 'アルバイト', 'フリーランス'],
                '投資': ['株', '配当', '利息', 'FX', '仮想通貨'],
                'その他': ['お小遣い', 'プレゼント', '還付金', 'キャッシュバック']
            }
        };

        const descLower = description.toLowerCase();
        const categories = keywords[type] || {};
        
        for (const [category, keywordList] of Object.entries(categories)) {
            if (keywordList.some(keyword => descLower.includes(keyword))) {
                return category;
            }
        }
        
        return type === 'expense' ? 'その他' : 'その他';
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.elements.descriptionInput.value = transaction.description;
        this.elements.amountInput.value = transaction.amount;
        this.elements.categorySelect.value = transaction.category;
        this.elements.typeSelect.value = transaction.type;
        this.elements.dateInput.value = transaction.date;

        this.editingTransactionId = id;
        document.querySelector('.btn-primary').textContent = '更新する';
        
        this.elements.transactionForm.scrollIntoView({ behavior: 'smooth' });
    }

    deleteTransaction(id) {
        if (confirm('この取引を削除しますか？')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.render();
            this.showNotification('取引を削除しました', 'success');
        }
    }

    updateCategoryOptions() {
        const type = this.elements.typeSelect.value;
        const categories = {
            expense: ['食費', '交通費', '医療費', '娯楽費', '公共料金', '日用品', '衣服', '家賃', 'その他'],
            income: ['給与', '副業', '投資', 'その他']
        };

        this.elements.categorySelect.innerHTML = '<option value="">AIが自動選択</option>';
        
        (categories[type] || []).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.categorySelect.appendChild(option);
        });
    }

    render() {
        this.renderTransactions();
        this.renderStats();
        this.renderSmartFilters();
        this.updateCharts();
    }

    renderTransactions() {
        if (!this.elements.transactionsList) return;

        if (this.transactions.length === 0) {
            this.elements.transactionsList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📊</div>
                    <h3>取引データがありません</h3>
                    <p>最初の取引を追加して家計管理を始めましょう</p>
                </div>
            `;
            return;
        }

        const html = this.transactions.map(transaction => `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-icon ${transaction.type}">
                    ${transaction.type === 'income' ? '💰' : '💸'}
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">
                        ${transaction.category}
                        ${transaction.aiSuggested ? '<span style="background: var(--ai-gradient); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">AI</span>' : ''}
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount.toLocaleString()}
                </div>
                <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                <div class="transaction-actions">
                    <button class="btn btn-sm btn-icon" onclick="financeManager.editTransaction('${transaction.id}')" title="編集">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-icon" onclick="financeManager.deleteTransaction('${transaction.id}')" title="削除">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.transactionsList.innerHTML = html;
    }

    renderStats() {
        const income = this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        // ヘッダー統計更新
        if (this.elements.totalIncomeSpan) {
            this.elements.totalIncomeSpan.textContent = `¥${income.toLocaleString()}`;
        }
        if (this.elements.totalExpenseSpan) {
            this.elements.totalExpenseSpan.textContent = `¥${expense.toLocaleString()}`;
        }
        if (this.elements.currentBalanceSpan) {
            this.elements.currentBalanceSpan.textContent = `¥${balance.toLocaleString()}`;
        }

        // カード統計更新
        const totalIncomeCard = document.getElementById('totalIncomeCard');
        const totalExpenseCard = document.getElementById('totalExpenseCard');
        const currentBalanceCard = document.getElementById('currentBalanceCard');
        
        if (totalIncomeCard) totalIncomeCard.textContent = `¥${income.toLocaleString()}`;
        if (totalExpenseCard) totalExpenseCard.textContent = `¥${expense.toLocaleString()}`;
        if (currentBalanceCard) currentBalanceCard.textContent = `¥${balance.toLocaleString()}`;
    }

    renderSmartFilters() {
        if (!this.elements.smartFilters) return;

        const categories = [...new Set(this.transactions.map(t => t.category))];
        const recentDays = [7, 30, 90];
        
        const html = `
            <div class="filter-section">
                <div class="filter-label" style="font-weight: 600; margin-bottom: 10px;">期間フィルター（AI推奨）</div>
                <div class="filter-chips">
                    <div class="filter-chip active" data-filter="all">すべて</div>
                    ${recentDays.map(days => `
                        <div class="filter-chip ai-suggested" data-filter="days" data-value="${days}">
                            過去${days}日
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${categories.length > 0 ? `
            <div class="filter-section" style="margin-top: 20px;">
                <div class="filter-label" style="font-weight: 600; margin-bottom: 10px;">カテゴリ</div>
                <div class="filter-chips">
                    ${categories.map(category => `
                        <div class="filter-chip" data-filter="category" data-value="${category}">
                            ${category}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;

        this.elements.smartFilters.innerHTML = html;

        this.elements.smartFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                this.applyFilter(e.target);
            }
        });
    }

    applyFilter(chipElement) {
        const siblings = chipElement.parentElement.querySelectorAll('.filter-chip');
        siblings.forEach(chip => chip.classList.remove('active'));
        chipElement.classList.add('active');

        const filterType = chipElement.dataset.filter;
        const filterValue = chipElement.dataset.value;

        let filteredTransactions = [...this.transactions];

        if (filterType === 'days') {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(filterValue));
            filteredTransactions = this.transactions.filter(t => 
                new Date(t.date) >= cutoffDate
            );
        } else if (filterType === 'category') {
            filteredTransactions = this.transactions.filter(t => 
                t.category === filterValue
            );
        }

        this.renderFilteredTransactions(filteredTransactions);
    }

    renderFilteredTransactions(transactions) {
        const originalTransactions = this.transactions;
        this.transactions = transactions;
        this.renderTransactions();
        this.renderStats();
        this.transactions = originalTransactions;
    }

    initializeAI() {
        console.log('🤖 AI システム初期化中...');
        this.renderAIChatHistory();
        console.log('✅ AI システム初期化完了');
    }

    runAIAnalysis() {
        if (this.transactions.length === 0) return;

        console.log('🔍 AI分析実行中...');
        const analysis = this.generateAIInsights();
        this.showAIBanner(analysis);
        console.log('✅ AI分析完了:', analysis.summary);
    }

    generateAIInsights() {
        const recentTransactions = this.transactions.slice(0, 10);
        const totalExpense = recentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        const categoryExpenses = {};
        recentTransactions.filter(t => t.type === 'expense').forEach(t => {
            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
        });
        
        const topCategory = Object.entries(categoryExpenses).sort(([,a], [,b]) => b - a)[0];
        const insights = [];
        
        if (topCategory) {
            const [category, amount] = topCategory;
            const percentage = Math.round((amount / totalExpense) * 100);
            insights.push(`${category}が支出の${percentage}%を占めています`);
        }
        
        const dailyAverage = totalExpense / 7;
        if (dailyAverage > 3000) {
            insights.push('日平均支出が高めです。予算の見直しを検討してください');
        } else if (dailyAverage < 1000) {
            insights.push('支出管理が良好です！');
        }

        return {
            summary: insights[0] || '財務状況は良好です',
            details: insights
        };
    }

    showAIBanner(analysis) {
        if (!this.elements.aiStatusBanner || !this.elements.aiAnalysisResult) return;

        this.elements.aiAnalysisResult.textContent = analysis.summary;
        this.elements.aiStatusBanner.classList.add('show');
        
        setTimeout(() => {
            this.elements.aiStatusBanner.classList.remove('show');
        }, 10000);
    }

    toggleAIChat() {
        if (!this.elements.aiChat) return;
        
        const isVisible = this.elements.aiChat.classList.contains('show');
        if (isVisible) {
            this.elements.aiChat.classList.remove('show');
        } else {
            this.elements.aiChat.classList.add('show');
        }
    }

    sendAIMessage() {
        if (!this.elements.aiChatInput) return;
        
        const message = this.elements.aiChatInput.value.trim();
        if (!message) return;

        this.addAIChatMessage(message, 'user');
        this.elements.aiChatInput.value = '';

        setTimeout(() => {
            const response = this.generateAIResponse(message);
            this.addAIChatMessage(response, 'ai');
        }, 1000);
    }

    addAIChatMessage(message, sender) {
        if (!this.elements.aiChatBody) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="ai-message-avatar ${sender}">
                ${sender === 'ai' ? '🤖' : '👤'}
            </div>
            <div class="ai-message-content">${message}</div>
        `;

        this.elements.aiChatBody.appendChild(messageDiv);
        this.elements.aiChatBody.scrollTop = this.elements.aiChatBody.scrollHeight;

        this.aiChatHistory.push({
            message,
            sender,
            timestamp: new Date().toISOString()
        });
        
        if (this.aiChatHistory.length > 50) {
            this.aiChatHistory = this.aiChatHistory.slice(-50);
        }
        
        this.saveData();
    }

    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('支出') || message.includes('出費')) {
            const totalExpense = this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            return `現在の総支出は¥${totalExpense.toLocaleString()}です。最も多い支出カテゴリの見直しをお勧めします。`;
        } else if (message.includes('収入')) {
            const totalIncome = this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            return `現在の総収入は¥${totalIncome.toLocaleString()}です。収入源の多様化も検討してみてください。`;
        } else if (message.includes('予算') || message.includes('バジェット')) {
            return '予算設定機能を使って、カテゴリ別の支出上限を設定することをお勧めします。';
        } else if (message.includes('節約')) {
            return '節約のコツ：固定費の見直し、食費の管理、不要なサブスクリプションの解約などから始めましょう。';
        } else if (message.includes('投資')) {
            return '投資を始める前に、緊急資金（3-6ヶ月分の生活費）を確保することが重要です。';
        } else {
            const responses = [
                '詳しい質問をしていただけますか？家計管理について何でもお聞きください。',
                'どのような点についてアドバイスが必要でしょうか？',
                '家計の改善について、もう少し具体的に教えてください。',
                'その件について、現在の収支状況を確認しながらアドバイスいたします。'
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    renderAIChatHistory() {
        if (!this.elements.aiChatBody) return;
        
        this.elements.aiChatBody.innerHTML = `
            <div class="ai-message ai">
                <div class="ai-message-avatar ai">🤖</div>
                <div class="ai-message-content">
                    こんにちは！AI財務アドバイザーです。家計管理について何でもお聞きください。支出分析、予算設定、節約のコツなど、お手伝いします！
                </div>
            </div>
        `;
        
        this.aiChatHistory.forEach(chat => {
            this.addAIChatMessage(chat.message, chat.sender);
        });
    }

    initializeCharts() {
        if (this.elements.expenseChart) this.createExpenseChart();
        if (this.elements.incomeChart) this.createIncomeChart();
        if (this.elements.trendChart) this.createTrendChart();
    }

    createExpenseChart() {
        const ctx = this.elements.expenseChart.getContext('2d');
        const expenses = this.transactions.filter(t => t.type === 'expense');
        
        if (expenses.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('データがありません', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        const categoryData = {};
        expenses.forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

        this.drawPieChart(ctx, categoryData, ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']);
    }

    createIncomeChart() {
        const ctx = this.elements.incomeChart.getContext('2d');
        const income = this.transactions.filter(t => t.type === 'income');
        
        if (income.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('データがありません', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        const categoryData = {};
        income.forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

        this.drawBarChart(ctx, categoryData, ['#10B981', '#059669', '#047857', '#065F46']);
    }

    createTrendChart() {
        const ctx = this.elements.trendChart.getContext('2d');
        
        const last30Days = [];
        const dailyBalance = {};
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last30Days.push(dateStr);
            dailyBalance[dateStr] = 0;
        }

        this.transactions.forEach(t => {
            if (last30Days.includes(t.date)) {
                const amount = t.type === 'income' ? t.amount : -t.amount;
                dailyBalance[t.date] += amount;
            }
        });

        const data = last30Days.map(date => dailyBalance[date]);
        this.drawLineChart(ctx, data, '#64FFDA');
    }

    drawPieChart(ctx, data, colors) {
        const total = Object.values(data).reduce((sum, value) => sum + value, 0);
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        let currentAngle = -Math.PI / 2;
        let colorIndex = 0;
        
        Object.entries(data).forEach(([category, value]) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = colors[colorIndex % colors.length];
            ctx.fill();
            
            currentAngle += sliceAngle;
            colorIndex++;
        });
    }

    drawBarChart(ctx, data, colors) {
        const maxValue = Math.max(...Object.values(data));
        const padding = 40;
        const chartWidth = ctx.canvas.width - padding * 2;
        const chartHeight = ctx.canvas.height - padding * 2;
        const barWidth = chartWidth / Object.keys(data).length - 10;
        
        let index = 0;
        Object.entries(data).forEach(([category, value]) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + 10);
            const y = padding + chartHeight - barHeight;
            
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);
            
            index++;
        });
    }

    drawLineChart(ctx, data, color) {
        const padding = 40;
        const chartWidth = ctx.canvas.width - padding * 2;
        const chartHeight = ctx.canvas.height - padding * 2;
        
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const range = maxValue - minValue || 1;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        ctx.fillStyle = color;
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    updateCharts() {
        if (this.elements.expenseChart) this.createExpenseChart();
        if (this.elements.incomeChart) this.createIncomeChart();
        if (this.elements.trendChart) this.createTrendChart();
    }

    exportToCSV() {
        if (this.transactions.length === 0) {
            this.showNotification('エクスポートするデータがありません', 'warning');
            return;
        }

        const headers = ['日付', '説明', 'カテゴリ', 'タイプ', '金額'];
        const csvContent = [
            headers.join(','),
            ...this.transactions.map(t => [
                t.date,
                `"${t.description}"`,
                t.category,
                t.type === 'income' ? '収入' : '支出',
                t.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `家計簿_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showNotification('CSVファイルをダウンロードしました', 'success');
    }

    exportToJSON() {
        if (this.transactions.length === 0) {
            this.showNotification('エクスポートするデータがありません', 'warning');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            version: 'v5.0',
            transactions: this.transactions,
            summary: {
                totalTransactions: this.transactions.length,
                totalIncome: this.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                totalExpense: this.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `家計簿_詳細データ_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('JSONファイルをダウンロードしました', 'success');
    }

    exportToPDF() {
        this.showNotification('PDF生成中...', 'info');
        window.print();
        this.showNotification('PDF生成完了', 'success');
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveData();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.innerHTML = `
                ${this.currentTheme === 'dark' ? '☀️' : '🌙'}
                <span>${this.currentTheme === 'dark' ? 'ライト' : 'ダーク'}</span>
            `;
        }
    }

    filterTransactions(searchTerm) {
        const filtered = this.transactions.filter(t => 
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredTransactions(filtered);
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.elements.descriptionInput?.focus();
        }
        
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            this.exportToCSV();
        }
        
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            this.toggleAIChat();
        }
    }

    resetForm() {
        if (this.elements.transactionForm) {
            this.elements.transactionForm.reset();
            if (this.elements.dateInput) {
                this.elements.dateInput.value = new Date().toISOString().split('T')[0];
            }
            this.updateCategoryOptions();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

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
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    showWelcomeMessage() {
        if (this.transactions.length === 0) {
            setTimeout(() => {
                this.showNotification('Smart Finance Manager v5.0へようこそ！', 'success');
                setTimeout(() => {
                    this.showNotification('AIが支出パターンを分析してアドバイスします', 'info');
                }, 2000);
            }, 1000);
        }
    }

    saveData() {
        try {
            localStorage.setItem('smartFinanceTransactions', JSON.stringify(this.transactions));
            localStorage.setItem('smartFinanceTheme', this.currentTheme);
            localStorage.setItem('smartFinanceAIChatHistory', JSON.stringify(this.aiChatHistory));
        } catch (error) {
            console.error('データ保存エラー:', error);
            this.showNotification('データの保存に失敗しました', 'error');
        }
    }
}

// アプリケーション初期化
let financeManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Smart Finance Manager v5.0 起動開始');
    financeManager = new SmartFinanceManager();
    
    window.addEventListener('error', (e) => {
        console.error('アプリケーションエラー:', e.error);
        if (financeManager) {
            financeManager.showNotification('アプリケーションエラーが発生しました', 'error');
        }
    });
    
    console.log('✅ Smart Finance Manager v5.0 起動完了');
});

window.SmartFinanceManager = SmartFinanceManager;