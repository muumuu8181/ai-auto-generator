// お金管理システム - JavaScript実装
class MoneyManager {
    constructor() {
        this.transactions = this.loadFromStorage();
        this.currentEditId = null;
        
        // カテゴリ定義
        this.categories = {
            income: [
                '給料', 'ボーナス', '副業', '投資', 'その他収入'
            ],
            expense: [
                '食費', '住居費', '光熱費', '交通費', '通信費', 
                '医療費', '教育費', '娯楽費', '衣服費', 'その他支出'
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCategories();
        this.setDefaultDate();
        this.renderTransactions();
        this.updateStats();
        
        console.log('💰 お金管理システム初期化完了');
    }

    setupEventListeners() {
        // フォーム送信
        document.getElementById('transactionForm').addEventListener('submit', this.handleAddTransaction.bind(this));
        document.getElementById('editForm').addEventListener('submit', this.handleEditTransaction.bind(this));
        
        // 種類変更時のカテゴリ更新
        document.getElementById('type').addEventListener('change', this.updateCategories.bind(this));
        document.getElementById('editType').addEventListener('change', this.updateEditCategories.bind(this));
        
        // フィルター機能
        document.getElementById('filterType').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('filterCategory').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('searchText').addEventListener('input', this.applyFilters.bind(this));
        document.getElementById('dateFrom').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('dateTo').addEventListener('change', this.applyFilters.bind(this));
        document.getElementById('clearFilter').addEventListener('click', this.clearFilters.bind(this));
        
        // CSV機能
        document.getElementById('exportCSV').addEventListener('click', this.exportCSV.bind(this));
        document.getElementById('importCSV').addEventListener('click', () => {
            document.getElementById('csvFileInput').click();
        });
        document.getElementById('csvFileInput').addEventListener('change', this.importCSV.bind(this));
        
        // モーダル機能
        document.querySelector('.close').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('cancelEdit').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('deleteTransaction').addEventListener('click', this.handleDeleteTransaction.bind(this));
        
        // モーダル外クリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeModal();
            }
        });
    }

    setupCategories() {
        this.populateCategories('category', []);
        this.populateCategories('filterCategory', []);
        this.populateCategories('editCategory', []);
    }

    populateCategories(elementId, categories) {
        const select = document.getElementById(elementId);
        const currentValue = select.value;
        
        // 既存のオプションをクリア（最初のoptionは残す）
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        if (currentValue && categories.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    updateCategories() {
        const type = document.getElementById('type').value;
        const categories = type ? this.categories[type] : [];
        this.populateCategories('category', categories);
        
        // フィルターのカテゴリも更新
        this.updateFilterCategories();
    }

    updateEditCategories() {
        const type = document.getElementById('editType').value;
        const categories = type ? this.categories[type] : [];
        this.populateCategories('editCategory', categories);
    }

    updateFilterCategories() {
        const allCategories = [...this.categories.income, ...this.categories.expense];
        this.populateCategories('filterCategory', allCategories);
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    handleAddTransaction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: Date.now().toString(),
            description: formData.get('description').trim(),
            amount: parseFloat(formData.get('amount')),
            type: formData.get('type'),
            category: formData.get('category'),
            date: formData.get('date'),
            timestamp: new Date().toISOString()
        };

        // バリデーション
        if (!this.validateTransaction(transaction)) {
            return;
        }

        this.transactions.push(transaction);
        this.saveToStorage();
        this.renderTransactions();
        this.updateStats();
        
        // フォームリセット
        e.target.reset();
        this.setDefaultDate();
        document.getElementById('category').innerHTML = '<option value="">選択してください</option>';
        
        this.showMessage('取引が追加されました', 'success');
    }

    handleEditTransaction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedTransaction = {
            id: this.currentEditId,
            description: formData.get('description').trim(),
            amount: parseFloat(formData.get('amount')),
            type: formData.get('type'),
            category: formData.get('category'),
            date: formData.get('date'),
            timestamp: new Date().toISOString()
        };

        // バリデーション
        if (!this.validateTransaction(updatedTransaction)) {
            return;
        }

        const index = this.transactions.findIndex(t => t.id === this.currentEditId);
        if (index !== -1) {
            this.transactions[index] = updatedTransaction;
            this.saveToStorage();
            this.renderTransactions();
            this.updateStats();
            this.closeModal();
            this.showMessage('取引が更新されました', 'success');
        }
    }

    handleDeleteTransaction() {
        if (confirm('この取引を削除しますか？')) {
            this.transactions = this.transactions.filter(t => t.id !== this.currentEditId);
            this.saveToStorage();
            this.renderTransactions();
            this.updateStats();
            this.closeModal();
            this.showMessage('取引が削除されました', 'success');
        }
    }

    validateTransaction(transaction) {
        if (!transaction.description) {
            this.showMessage('説明を入力してください', 'error');
            return false;
        }
        
        if (!transaction.amount || transaction.amount <= 0) {
            this.showMessage('正しい金額を入力してください', 'error');
            return false;
        }
        
        if (!transaction.type) {
            this.showMessage('種類を選択してください', 'error');
            return false;
        }
        
        if (!transaction.category) {
            this.showMessage('カテゴリを選択してください', 'error');
            return false;
        }
        
        if (!transaction.date) {
            this.showMessage('日付を選択してください', 'error');
            return false;
        }
        
        return true;
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.currentEditId = id;
        
        // フォームに値を設定
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editType').value = transaction.type;
        document.getElementById('editDate').value = transaction.date;
        
        // カテゴリを更新してから値を設定
        this.updateEditCategories();
        setTimeout(() => {
            document.getElementById('editCategory').value = transaction.category;
        }, 10);
        
        // モーダルを表示
        document.getElementById('editModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditId = null;
    }

    applyFilters() {
        this.renderTransactions();
    }

    getFilteredTransactions() {
        let filtered = [...this.transactions];
        
        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;
        const searchText = document.getElementById('searchText').value.toLowerCase();
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        
        if (typeFilter) {
            filtered = filtered.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter) {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }
        
        if (searchText) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchText) ||
                t.category.toLowerCase().includes(searchText)
            );
        }
        
        if (dateFrom) {
            filtered = filtered.filter(t => t.date >= dateFrom);
        }
        
        if (dateTo) {
            filtered = filtered.filter(t => t.date <= dateTo);
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    clearFilters() {
        document.getElementById('filterType').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('searchText').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        this.renderTransactions();
    }

    renderTransactions() {
        const container = document.getElementById('transactionList');
        const noTransactions = document.getElementById('noTransactions');
        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = '';
            container.appendChild(noTransactions);
            return;
        }
        
        container.innerHTML = '';
        
        filteredTransactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            const formattedAmount = new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY'
            }).format(transaction.amount);
            
            const formattedDate = new Date(transaction.date).toLocaleDateString('ja-JP');
            
            item.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-meta">${transaction.category} • ${formattedDate}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${formattedAmount}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-secondary btn-small" onclick="moneyManager.editTransaction('${transaction.id}')">
                        編集
                    </button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    updateStats() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = income - expense;
        
        const formatter = new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        });
        
        document.getElementById('totalIncome').textContent = formatter.format(income);
        document.getElementById('totalExpense').textContent = formatter.format(expense);
        document.getElementById('balance').textContent = formatter.format(balance);
        
        // 残高の色を動的に変更
        const balanceElement = document.getElementById('balance');
        balanceElement.className = 'stat-value balance';
        if (balance > 0) {
            balanceElement.style.color = '#34d399';
        } else if (balance < 0) {
            balanceElement.style.color = '#fca5a5';
        } else {
            balanceElement.style.color = '#fbbf24';
        }
    }

    exportCSV() {
        if (this.transactions.length === 0) {
            this.showMessage('エクスポートする取引がありません', 'error');
            return;
        }
        
        const headers = ['日付', '説明', '種類', 'カテゴリ', '金額'];
        const csvContent = [
            headers.join(','),
            ...this.transactions.map(t => [
                t.date,
                `"${t.description}"`,
                t.type === 'income' ? '収入' : '支出',
                `"${t.category}"`,
                t.amount
            ].join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `取引履歴_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showMessage('CSVファイルがダウンロードされました', 'success');
    }

    importCSV(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    this.showMessage('CSVファイルが空または不正です', 'error');
                    return;
                }
                
                const importedTransactions = [];
                
                // ヘッダー行をスキップ
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const columns = this.parseCSVLine(line);
                    if (columns.length >= 5) {
                        const transaction = {
                            id: Date.now().toString() + '_' + i,
                            date: columns[0],
                            description: columns[1],
                            type: columns[2] === '収入' ? 'income' : 'expense',
                            category: columns[3],
                            amount: parseFloat(columns[4]) || 0,
                            timestamp: new Date().toISOString()
                        };
                        
                        if (this.validateImportedTransaction(transaction)) {
                            importedTransactions.push(transaction);
                        }
                    }
                }
                
                if (importedTransactions.length > 0) {
                    this.transactions.push(...importedTransactions);
                    this.saveToStorage();
                    this.renderTransactions();
                    this.updateStats();
                    this.showMessage(`${importedTransactions.length}件の取引をインポートしました`, 'success');
                } else {
                    this.showMessage('インポート可能な取引がありませんでした', 'error');
                }
                
            } catch (error) {
                console.error('CSV import error:', error);
                this.showMessage('CSVファイルの読み込みに失敗しました', 'error');
            }
        };
        
        reader.readAsText(file, 'UTF-8');
        e.target.value = ''; // ファイル選択をリセット
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    validateImportedTransaction(transaction) {
        return transaction.date && 
               transaction.description && 
               transaction.type && 
               transaction.category && 
               !isNaN(transaction.amount) && 
               transaction.amount > 0;
    }

    saveToStorage() {
        try {
            localStorage.setItem('moneyManagerTransactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Storage save error:', error);
            this.showMessage('データの保存に失敗しました', 'error');
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('moneyManagerTransactions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Storage load error:', error);
            return [];
        }
    }

    showMessage(text, type) {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        const container = document.querySelector('.input-section');
        container.insertBefore(message, container.firstChild);
        
        // 3秒後にメッセージを削除
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// アプリケーション初期化
let moneyManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('💰 お金管理システム起動中...');
    
    moneyManager = new MoneyManager();
    
    console.log('✅ お金管理システム起動完了');
    
    // パフォーマンス監視
    if ('performance' in window) {
        console.log(`⚡ ページ読み込み時間: ${Math.round(performance.now())}ms`);
    }
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('🚨 JavaScript Error:', e.error);
    console.error('📍 Error Location:', e.filename, 'Line:', e.lineno);
});

// ローカルストレージ容量監視
window.addEventListener('beforeunload', () => {
    try {
        const usage = JSON.stringify(localStorage).length;
        console.log(`💾 Local Storage Usage: ${Math.round(usage / 1024)}KB`);
    } catch (error) {
        console.warn('Storage usage check failed:', error);
    }
});