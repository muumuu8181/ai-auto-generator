// お金管理システム - app-004-eb82au

// データ保存キー
const STORAGE_KEY = 'money-manager-transactions';

// 取引データ
let transactions = [];
let currentEditId = null;
let expenseChart = null;

// カテゴリ名のマッピング
const categoryNames = {
    // 収入
    'salary': '給料',
    'bonus': 'ボーナス',
    'side-job': '副業',
    'investment': '投資収益',
    'other-income': 'その他収入',
    // 支出
    'food': '食費',
    'transport': '交通費',
    'utilities': '光熱費',
    'rent': '家賃',
    'entertainment': '娯楽',
    'shopping': '買い物',
    'health': '医療費',
    'education': '教育費',
    'other-expense': 'その他支出'
};

// DOM要素
const elements = {
    form: document.getElementById('transaction-form'),
    editForm: document.getElementById('edit-form'),
    modal: document.getElementById('edit-modal'),
    closeModal: document.getElementById('close-modal'),
    cancelEdit: document.getElementById('cancel-edit'),
    transactionsList: document.getElementById('transactions-list'),
    totalBalance: document.getElementById('total-balance'),
    monthIncome: document.getElementById('month-income'),
    monthExpense: document.getElementById('month-expense'),
    filterMonth: document.getElementById('filter-month'),
    filterCategory: document.getElementById('filter-category'),
    exportCsv: document.getElementById('export-csv'),
    clearData: document.getElementById('clear-data'),
    avgDailyExpense: document.getElementById('avg-daily-expense'),
    maxExpense: document.getElementById('max-expense'),
    transactionCount: document.getElementById('transaction-count'),
    dateInput: document.getElementById('date')
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setupEventListeners();
    setDefaultDate();
    updateAllDisplays();
    initializeFilters();
});

// イベントリスナー設定
function setupEventListeners() {
    elements.form.addEventListener('submit', handleSubmit);
    elements.editForm.addEventListener('submit', handleEditSubmit);
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelEdit.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });
    elements.filterMonth.addEventListener('change', filterTransactions);
    elements.filterCategory.addEventListener('change', filterTransactions);
    elements.exportCsv.addEventListener('click', exportToCsv);
    elements.clearData.addEventListener('click', clearAllData);
    
    // Escキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.style.display === 'block') {
            closeModal();
        }
    });
}

// デフォルト日付設定
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    elements.dateInput.value = today;
    document.getElementById('edit-date').value = today;
}

// 取引追加フォーム処理
function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transaction = {
        id: Date.now().toString(),
        type: document.getElementById('transaction-type').value,
        amount: parseInt(document.getElementById('amount').value),
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        timestamp: new Date().toISOString()
    };
    
    // バリデーション
    if (!validateTransaction(transaction)) {
        return;
    }
    
    transactions.unshift(transaction);
    saveTransactions();
    updateAllDisplays();
    e.target.reset();
    setDefaultDate();
    
    // 成功通知
    showNotification('取引が追加されました', 'success');
}

// 取引編集フォーム処理
function handleEditSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: document.getElementById('edit-id').value,
        type: document.getElementById('edit-type').value,
        amount: parseInt(document.getElementById('edit-amount').value),
        description: document.getElementById('edit-description').value.trim(),
        category: document.getElementById('edit-category').value,
        date: document.getElementById('edit-date').value,
        timestamp: new Date().toISOString()
    };
    
    // バリデーション
    if (!validateTransaction(transaction)) {
        return;
    }
    
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
        transactions[index] = transaction;
        saveTransactions();
        updateAllDisplays();
        closeModal();
        showNotification('取引が更新されました', 'success');
    }
}

// バリデーション
function validateTransaction(transaction) {
    if (transaction.amount <= 0) {
        showNotification('金額は1円以上で入力してください', 'error');
        return false;
    }
    
    if (transaction.amount > 100000000) {
        showNotification('金額は1億円以下で入力してください', 'error');
        return false;
    }
    
    if (!transaction.description || transaction.description.length === 0) {
        showNotification('説明を入力してください', 'error');
        return false;
    }
    
    if (transaction.description.length > 100) {
        showNotification('説明は100文字以下で入力してください', 'error');
        return false;
    }
    
    return true;
}

// 通知表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// CSS追加（通知アニメーション）
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 取引データの読み込み
function loadTransactions() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            transactions = JSON.parse(saved);
        } catch (e) {
            console.error('データの読み込みに失敗しました:', e);
            transactions = [];
        }
    }
}

// 取引データの保存
function saveTransactions() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
        console.error('データの保存に失敗しました:', e);
        showNotification('データの保存に失敗しました', 'error');
    }
}

// 全表示更新
function updateAllDisplays() {
    updateBalance();
    updateMonthlySummary();
    displayTransactions();
    updateStatistics();
    updateChart();
}

// 残高計算・表示
function updateBalance() {
    const balance = transactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    elements.totalBalance.textContent = formatCurrency(balance);
    elements.totalBalance.className = balance >= 0 ? 'balance-amount positive' : 'balance-amount negative';
}

// 月間サマリー更新
function updateMonthlySummary() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    elements.monthIncome.textContent = formatCurrency(income);
    elements.monthExpense.textContent = formatCurrency(expense);
}

// 取引履歴表示
function displayTransactions() {
    if (transactions.length === 0) {
        elements.transactionsList.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-inbox"></i>
                <p>まだ取引が登録されていません</p>
            </div>
        `;
        return;
    }
    
    let filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
        elements.transactionsList.innerHTML = `
            <div class="no-transactions">
                <i class="fas fa-search"></i>
                <p>該当する取引が見つかりません</p>
            </div>
        `;
        return;
    }
    
    elements.transactionsList.innerHTML = filteredTransactions
        .map(transaction => createTransactionElement(transaction))
        .join('');
}

// フィルター処理
function getFilteredTransactions() {
    let filtered = [...transactions];
    
    // 月フィルター
    const monthFilter = elements.filterMonth.value;
    if (monthFilter !== 'all') {
        filtered = filtered.filter(t => t.date.startsWith(monthFilter));
    }
    
    // カテゴリフィルター
    const categoryFilter = elements.filterCategory.value;
    if (categoryFilter !== 'all') {
        if (categoryFilter === 'income' || categoryFilter === 'expense') {
            filtered = filtered.filter(t => t.type === categoryFilter);
        } else {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 取引要素作成
function createTransactionElement(transaction) {
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const categoryName = categoryNames[transaction.category] || transaction.category;
    
    return `
        <div class="transaction-item fade-in">
            <div class="transaction-info">
                <span class="transaction-type ${transaction.type}">
                    ${transaction.type === 'income' ? '収入' : '支出'}
                </span>
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-meta">
                    ${categoryName} • ${formattedDate}
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </span>
                <div class="transaction-actions">
                    <button class="edit-btn" onclick="editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteTransaction('${transaction.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 通貨フォーマット
function formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0
    }).format(Math.abs(amount));
}

// 取引編集
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    document.getElementById('edit-id').value = transaction.id;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-description').value = transaction.description;
    document.getElementById('edit-category').value = transaction.category;
    document.getElementById('edit-date').value = transaction.date;
    
    elements.modal.style.display = 'block';
    currentEditId = id;
}

// 取引削除
function deleteTransaction(id) {
    if (confirm('この取引を削除しますか？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateAllDisplays();
        showNotification('取引が削除されました', 'success');
    }
}

// モーダル閉じる
function closeModal() {
    elements.modal.style.display = 'none';
    currentEditId = null;
    elements.editForm.reset();
}

// フィルター初期化
function initializeFilters() {
    // 月フィルター
    const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
    const monthOptions = months.map(month => {
        const date = new Date(month + '-01');
        const label = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
        return `<option value="${month}">${label}</option>`;
    }).join('');
    
    elements.filterMonth.innerHTML = `<option value="all">全期間</option>${monthOptions}`;
    
    // カテゴリフィルター（既存のオプションを維持）
}

// フィルター適用
function filterTransactions() {
    displayTransactions();
}

// 統計更新
function updateStatistics() {
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // 平均日額支出
    if (expenses.length > 0) {
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        const dates = [...new Set(expenses.map(t => t.date))];
        const avgDaily = Math.round(totalExpense / Math.max(dates.length, 1));
        elements.avgDailyExpense.textContent = formatCurrency(avgDaily);
    } else {
        elements.avgDailyExpense.textContent = '¥0';
    }
    
    // 最大支出
    const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(t => t.amount)) : 0;
    elements.maxExpense.textContent = formatCurrency(maxExpense);
    
    // 取引回数
    elements.transactionCount.textContent = `${transactions.length}回`;
}

// チャート更新
function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // 既存チャートを破棄
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    // 支出カテゴリ別データ
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryData = {};
    
    expenses.forEach(t => {
        const categoryName = categoryNames[t.category] || t.category;
        categoryData[categoryName] = (categoryData[categoryName] || 0) + t.amount;
    });
    
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    if (labels.length === 0) {
        // データがない場合
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['データなし'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#ecf0f1'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        return;
    }
    
    // カラーパレット
    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#e67e22', '#34495e', '#16a085', '#27ae60'
    ];
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// CSV出力
function exportToCsv() {
    if (transactions.length === 0) {
        showNotification('出力するデータがありません', 'error');
        return;
    }
    
    const headers = ['日付', '種類', 'カテゴリ', '説明', '金額'];
    const csvData = [
        headers.join(','),
        ...transactions.map(t => [
            t.date,
            t.type === 'income' ? '収入' : '支出',
            categoryNames[t.category] || t.category,
            `"${t.description.replace(/"/g, '""')}"`,
            t.type === 'income' ? t.amount : -t.amount
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    
    link.href = URL.createObjectURL(blob);
    link.download = `家計簿_${today}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSVファイルをダウンロードしました', 'success');
}

// 全データ削除
function clearAllData() {
    if (confirm('全ての取引データを削除しますか？この操作は取り消せません。')) {
        transactions = [];
        saveTransactions();
        updateAllDisplays();
        showNotification('全てのデータが削除されました', 'success');
    }
}

// グローバル関数として公開
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;