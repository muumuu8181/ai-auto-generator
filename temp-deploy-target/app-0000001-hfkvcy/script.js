// お金管理システム v2.0
class MoneyManager {
    constructor() {
        this.transactions = [];
        this.editingId = null;
        this.categories = new Set();
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateDisplay();
        this.setTodayDate();
        this.updateCategoryDatalist();
    }

    setupEventListeners() {
        // フォームイベント
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleAddTransaction(e));
        document.getElementById('editForm').addEventListener('submit', (e) => this.handleEditTransaction(e));
        
        // モーダルイベント
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeModal();
        });
        
        // フィルター・エクスポートイベント
        document.getElementById('filterType').addEventListener('change', () => this.updateDisplay());
        document.getElementById('sortOrder').addEventListener('change', () => this.updateDisplay());
        document.getElementById('exportCsv').addEventListener('click', () => this.exportToCSV());
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transactionDate').value = today;
    }

    // トランザクション追加
    handleAddTransaction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: Date.now(),
            date: formData.get('date'),
            type: formData.get('type'),
            category: formData.get('category').trim(),
            amount: parseInt(formData.get('amount')),
            memo: formData.get('memo').trim(),
            createdAt: new Date().toISOString()
        };
        
        this.transactions.push(transaction);
        this.categories.add(transaction.category);
        this.saveToStorage();
        this.updateDisplay();
        this.updateCategoryDatalist();
        
        // フォームリセット
        e.target.reset();
        this.setTodayDate();
        
        this.showNotification('取引を追加しました');
    }

    // トランザクション編集
    handleEditTransaction(e) {
        e.preventDefault();
        
        const index = this.transactions.findIndex(t => t.id === this.editingId);
        if (index === -1) return;
        
        const updatedTransaction = {
            ...this.transactions[index],
            date: document.getElementById('editDate').value,
            type: document.getElementById('editType').value,
            category: document.getElementById('editCategory').value.trim(),
            amount: parseInt(document.getElementById('editAmount').value),
            memo: document.getElementById('editMemo').value.trim(),
            updatedAt: new Date().toISOString()
        };
        
        this.transactions[index] = updatedTransaction;
        this.categories.add(updatedTransaction.category);
        this.saveToStorage();
        this.updateDisplay();
        this.updateCategoryDatalist();
        this.closeModal();
        
        this.showNotification('取引を更新しました');
    }

    // 編集モーダル表示
    openEditModal(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;
        
        this.editingId = id;
        document.getElementById('editDate').value = transaction.date;
        document.getElementById('editType').value = transaction.type;
        document.getElementById('editCategory').value = transaction.category;
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editMemo').value = transaction.memo || '';
        
        document.getElementById('editModal').classList.add('show');
    }

    // モーダルを閉じる
    closeModal() {
        document.getElementById('editModal').classList.remove('show');
        this.editingId = null;
    }

    // トランザクション削除
    deleteTransaction(id) {
        if (!confirm('この取引を削除してもよろしいですか？')) return;
        
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToStorage();
        this.updateDisplay();
        
        this.showNotification('取引を削除しました');
    }

    // 表示更新
    updateDisplay() {
        this.updateTransactionList();
        this.updateSummary();
    }

    // 取引リスト更新
    updateTransactionList() {
        const filterType = document.getElementById('filterType').value;
        const sortOrder = document.getElementById('sortOrder').value;
        const listContainer = document.getElementById('transactionList');
        
        // フィルタリング
        let filteredTransactions = this.transactions;
        if (filterType !== 'all') {
            filteredTransactions = this.transactions.filter(t => t.type === filterType);
        }
        
        // ソート
        filteredTransactions = this.sortTransactions(filteredTransactions, sortOrder);
        
        // リスト表示
        if (filteredTransactions.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>まだ取引データがありません</p>
                    <p class="empty-hint">上のフォームから取引を追加してください</p>
                </div>
            `;
            return;
        }
        
        const html = filteredTransactions.map(transaction => `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <div class="transaction-header">
                        <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                        <span class="transaction-type type-${transaction.type}">
                            ${transaction.type === 'income' ? '収入' : '支出'}
                        </span>
                    </div>
                    <div class="transaction-details">
                        <span class="transaction-category">${transaction.category}</span>
                        <span class="transaction-amount">¥${this.formatNumber(transaction.amount)}</span>
                    </div>
                    ${transaction.memo ? `<div class="transaction-memo">${this.escapeHtml(transaction.memo)}</div>` : ''}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-edit" onclick="moneyManager.openEditModal(${transaction.id})">編集</button>
                    <button class="btn btn-danger" onclick="moneyManager.deleteTransaction(${transaction.id})">削除</button>
                </div>
            </div>
        `).join('');
        
        listContainer.innerHTML = html;
    }

    // トランザクションのソート
    sortTransactions(transactions, sortOrder) {
        const sorted = [...transactions];
        
        switch(sortOrder) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'amount-desc':
                return sorted.sort((a, b) => b.amount - a.amount);
            case 'amount-asc':
                return sorted.sort((a, b) => a.amount - b.amount);
            default:
                return sorted;
        }
    }

    // サマリー更新
    updateSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expense;
        
        document.getElementById('totalIncome').textContent = `¥${this.formatNumber(income)}`;
        document.getElementById('totalExpense').textContent = `¥${this.formatNumber(expense)}`;
        document.getElementById('totalBalance').textContent = `¥${this.formatNumber(balance)}`;
        
        // バランスの色を更新
        const balanceCard = document.querySelector('.balance-card');
        if (balance < 0) {
            balanceCard.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else {
            balanceCard.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        }
    }

    // カテゴリデータリスト更新
    updateCategoryDatalist() {
        const datalist = document.getElementById('categoryList');
        const categories = Array.from(this.categories).sort();
        
        datalist.innerHTML = categories
            .map(cat => `<option value="${cat}">`)
            .join('');
    }

    // CSV エクスポート
    exportToCSV() {
        if (this.transactions.length === 0) {
            this.showNotification('エクスポートするデータがありません', 'error');
            return;
        }
        
        // ヘッダー
        const headers = ['日付', '種別', 'カテゴリ', '金額', 'メモ'];
        
        // データ行
        const rows = this.transactions
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(t => [
                t.date,
                t.type === 'income' ? '収入' : '支出',
                t.category,
                t.amount,
                t.memo || ''
            ]);
        
        // CSV生成
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // BOM付きUTF-8でダウンロード
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `money_management_${this.formatDateForFilename(new Date())}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('CSVファイルをダウンロードしました');
    }

    // ストレージ操作
    saveToStorage() {
        const data = {
            transactions: this.transactions,
            categories: Array.from(this.categories),
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('moneyManagerData', JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('moneyManagerData');
        if (!stored) return;
        
        try {
            const data = JSON.parse(stored);
            this.transactions = data.transactions || [];
            this.categories = new Set(data.categories || []);
        } catch (e) {
            console.error('データの読み込みに失敗しました:', e);
            this.showNotification('データの読み込みに失敗しました', 'error');
        }
    }

    // ユーティリティメソッド
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}/${month}/${day}`;
    }

    formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// アプリケーション初期化
const moneyManager = new MoneyManager();

// PWA対応
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service Worker登録失敗（ファイルがない場合など）は無視
        });
    });
}