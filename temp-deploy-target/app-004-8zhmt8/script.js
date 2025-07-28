// Money Manager Application
class MoneyManager {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.currentEditId = null;
        this.categories = {
            income: ['給与', '副業', 'ボーナス', '投資収益', 'その他収入'],
            expense: ['食費', '住居費', '交通費', '光熱費', '通信費', '医療費', '娯楽費', '衣服費', 'その他支出']
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCategories();
        this.updateSummary();
        this.renderTransactions();
        this.setDefaultDate();
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
            this.saveEdit();
        });

        // Type change for category update
        document.getElementById('type').addEventListener('change', () => {
            this.updateCategories('category');
        });

        document.getElementById('edit-type').addEventListener('change', () => {
            this.updateCategories('edit-category');
        });

        // Filter and sort
        document.getElementById('filter-type').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('sort-by').addEventListener('change', () => {
            this.renderTransactions();
        });

        // CSV export
        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Modal controls
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.btn-cancel').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
        });
    }

    setupCategories() {
        this.updateCategories('category');
        this.updateCategories('edit-category');
    }

    updateCategories(selectId) {
        const typeSelect = selectId === 'category' ? 
            document.getElementById('type') : 
            document.getElementById('edit-type');
        const categorySelect = document.getElementById(selectId);
        const type = typeSelect.value;

        // Clear existing options except first one
        categorySelect.innerHTML = '<option value="">選択してください</option>';

        if (type && this.categories[type]) {
            this.categories[type].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    addTransaction() {
        const formData = this.getFormData('transaction-form');
        
        if (!this.validateTransaction(formData)) {
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            ...formData,
            amount: parseFloat(formData.amount),
            createdAt: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.saveToStorage();
        this.updateSummary();
        this.renderTransactions();
        this.resetForm();
        
        this.showNotification('取引が追加されました', 'success');
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};

        // Get all form values
        data.type = form.querySelector('#type, #edit-type').value;
        data.amount = form.querySelector('#amount, #edit-amount').value;
        data.category = form.querySelector('#category, #edit-category').value;
        data.date = form.querySelector('#date, #edit-date').value;
        data.description = form.querySelector('#description, #edit-description').value || data.category;

        return data;
    }

    validateTransaction(data) {
        if (!data.type || !data.amount || !data.category || !data.date) {
            this.showNotification('すべての必須項目を入力してください', 'error');
            return false;
        }

        if (parseFloat(data.amount) <= 0) {
            this.showNotification('金額は0より大きい値を入力してください', 'error');
            return false;
        }

        return true;
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.currentEditId = id;
        
        // Populate edit form
        document.getElementById('edit-type').value = transaction.type;
        this.updateCategories('edit-category');
        document.getElementById('edit-category').value = transaction.category;
        document.getElementById('edit-amount').value = transaction.amount;
        document.getElementById('edit-date').value = transaction.date;
        document.getElementById('edit-description').value = transaction.description;

        this.openModal();
    }

    saveEdit() {
        if (!this.currentEditId) return;

        const formData = this.getFormData('edit-form');
        
        if (!this.validateTransaction(formData)) {
            return;
        }

        const transactionIndex = this.transactions.findIndex(t => t.id === this.currentEditId);
        if (transactionIndex === -1) return;

        this.transactions[transactionIndex] = {
            ...this.transactions[transactionIndex],
            ...formData,
            amount: parseFloat(formData.amount),
            updatedAt: new Date().toISOString()
        };

        this.saveToStorage();
        this.updateSummary();
        this.renderTransactions();
        this.closeModal();
        
        this.showNotification('取引が更新されました', 'success');
    }

    deleteTransaction(id) {
        if (!confirm('この取引を削除しますか？')) return;

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToStorage();
        this.updateSummary();
        this.renderTransactions();
        
        this.showNotification('取引が削除されました', 'success');
    }

    updateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = this.formatCurrency(totalExpense);
        document.getElementById('balance').textContent = this.formatCurrency(balance);

        // Update balance color
        const balanceElement = document.getElementById('balance');
        const balanceCard = balanceElement.closest('.summary-item');
        balanceCard.className = 'summary-item ' + (balance >= 0 ? 'income' : 'expense');
    }

    renderTransactions() {
        const container = document.getElementById('transactions-list');
        let transactions = [...this.transactions];

        // Apply filters
        const filterType = document.getElementById('filter-type').value;
        if (filterType !== 'all') {
            transactions = transactions.filter(t => t.type === filterType);
        }

        // Apply sorting
        const sortBy = document.getElementById('sort-by').value;
        transactions.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="no-transactions">
                    <p>表示する取引がありません。</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-type ${transaction.type}"></div>
                <div class="transaction-info">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${this.escapeHtml(transaction.category)}</div>
                </div>
                <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-edit" onclick="moneyManager.editTransaction('${transaction.id}')">編集</button>
                    <button class="btn-delete" onclick="moneyManager.deleteTransaction('${transaction.id}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    openModal() {
        document.getElementById('edit-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('edit-modal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }

    exportToCSV() {
        if (this.transactions.length === 0) {
            this.showNotification('エクスポートするデータがありません', 'error');
            return;
        }

        const headers = ['日付', '種類', 'カテゴリ', '説明', '金額'];
        const csvContent = [
            headers.join(','),
            ...this.transactions.map(t => [
                t.date,
                t.type === 'income' ? '収入' : '支出',
                t.category,
                `"${t.description.replace(/"/g, '""')}"`,
                t.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `money_manager_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('CSVファイルをダウンロードしました', 'success');
    }

    resetForm() {
        document.getElementById('transaction-form').reset();
        this.setDefaultDate();
        this.updateCategories('category');
    }

    saveToStorage() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background: #059669;' : 'background: #dc2626;'}
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const moneyManager = new MoneyManager();