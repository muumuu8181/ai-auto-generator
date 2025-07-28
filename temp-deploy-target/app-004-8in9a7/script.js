class MoneyManagementSystem {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Edit form submission
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTransaction();
        });

        // Delete button
        document.getElementById('delete-btn').addEventListener('click', () => {
            this.deleteTransaction();
        });

        // CSV download
        document.getElementById('download-csv').addEventListener('click', () => {
            this.downloadCSV();
        });

        // Filter
        document.getElementById('filter-category').addEventListener('change', () => {
            this.renderTransactions();
        });

        // Modal controls
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('edit-modal')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    addTransaction() {
        const form = document.getElementById('transaction-form');
        const formData = new FormData(form);
        
        const transaction = {
            id: Date.now().toString(),
            type: formData.get('type') || document.getElementById('type').value,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDisplay();
        form.reset();
        this.setDefaultDate();

        // Show success message
        this.showNotification('取引を追加しました', 'success');
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.currentEditId = id;
        
        // Populate edit form
        document.getElementById('edit-id').value = transaction.id;
        document.getElementById('edit-type').value = transaction.type;
        document.getElementById('edit-amount').value = transaction.amount;
        document.getElementById('edit-description').value = transaction.description;
        document.getElementById('edit-category').value = transaction.category;
        document.getElementById('edit-date').value = transaction.date;

        // Show modal
        document.getElementById('edit-modal').style.display = 'block';
    }

    updateTransaction() {
        if (!this.currentEditId) return;

        const index = this.transactions.findIndex(t => t.id === this.currentEditId);
        if (index === -1) return;

        this.transactions[index] = {
            ...this.transactions[index],
            type: document.getElementById('edit-type').value,
            amount: parseFloat(document.getElementById('edit-amount').value),
            description: document.getElementById('edit-description').value,
            category: document.getElementById('edit-category').value,
            date: document.getElementById('edit-date').value,
            updatedAt: new Date().toISOString()
        };

        this.saveTransactions();
        this.updateDisplay();
        this.closeModal();

        this.showNotification('取引を更新しました', 'success');
    }

    deleteTransaction() {
        if (!this.currentEditId) return;

        if (confirm('この取引を削除しますか？')) {
            this.transactions = this.transactions.filter(t => t.id !== this.currentEditId);
            this.saveTransactions();
            this.updateDisplay();
            this.closeModal();

            this.showNotification('取引を削除しました', 'warning');
        }
    }

    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentEditId = null;
    }

    updateDisplay() {
        this.updateBalanceDisplay();
        this.updateStats();
        this.renderTransactions();
    }

    updateBalanceDisplay() {
        const { totalIncome, totalExpense, balance } = this.calculateTotals();
        
        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = this.formatCurrency(totalExpense);
        document.getElementById('balance').textContent = this.formatCurrency(balance);

        // Update balance color
        const balanceElement = document.getElementById('balance');
        balanceElement.className = `amount ${balance >= 0 ? 'income' : 'expense'}`;
    }

    updateStats() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        const monthIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthBalance = monthIncome - monthExpense;
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyAverage = monthBalance / daysInMonth;

        document.getElementById('month-income').textContent = this.formatCurrency(monthIncome);
        document.getElementById('month-expense').textContent = this.formatCurrency(monthExpense);
        document.getElementById('month-balance').textContent = this.formatCurrency(monthBalance);
        document.getElementById('daily-average').textContent = this.formatCurrency(dailyAverage);

        // Update colors
        document.getElementById('month-balance').className = `stat-value ${monthBalance >= 0 ? 'income' : 'expense'}`;
        document.getElementById('daily-average').className = `stat-value ${dailyAverage >= 0 ? 'income' : 'expense'}`;
    }

    renderTransactions() {
        const container = document.getElementById('transactions-list');
        const filterCategory = document.getElementById('filter-category').value;
        
        let filteredTransactions = this.transactions;
        if (filterCategory) {
            filteredTransactions = this.transactions.filter(t => t.category === filterCategory);
        }

        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>取引がありません</h3>
                    <p>新しい取引を追加してください</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-type">
                    ${transaction.type === 'income' ? '💰' : '💸'}
                </div>
                <div class="transaction-details">
                    <h4>${transaction.description}</h4>
                    <p>${this.getCategoryName(transaction.category)}</p>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-date">
                    ${this.formatDate(transaction.date)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-edit" onclick="moneyManager.editTransaction('${transaction.id}')">
                        編集
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    calculateTotals() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, balance };
    }

    downloadCSV() {
        if (this.transactions.length === 0) {
            this.showNotification('ダウンロードする取引がありません', 'warning');
            return;
        }

        const headers = ['日付', '種類', '金額', '説明', 'カテゴリ'];
        const csvContent = [
            headers.join(','),
            ...this.transactions.map(t => [
                t.date,
                t.type === 'income' ? '収入' : '支出',
                t.amount,
                `"${t.description}"`,
                this.getCategoryName(t.category)
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `money-management-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('CSVファイルをダウンロードしました', 'success');
    }

    getCategoryName(category) {
        const categories = {
            salary: '給料',
            freelance: '副業',
            investment: '投資',
            food: '食費',
            transport: '交通費',
            utilities: '光熱費',
            entertainment: '娯楽',
            shopping: '買い物',
            healthcare: '医療費',
            other: 'その他'
        };
        return categories[category] || category;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            default:
                notification.style.backgroundColor = '#2563eb';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    saveTransactions() {
        localStorage.setItem('money-management-transactions', JSON.stringify(this.transactions));
    }

    loadTransactions() {
        const saved = localStorage.getItem('money-management-transactions');
        return saved ? JSON.parse(saved) : [];
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the money management system
let moneyManager;
document.addEventListener('DOMContentLoaded', () => {
    moneyManager = new MoneyManagementSystem();
});