// データ管理
let transactions = JSON.parse(localStorage.getItem('moneyTransactions')) || [];
let editingId = null;

// DOM要素
const transactionForm = document.getElementById('transactionForm');
const transactionList = document.getElementById('transactionList');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceEl = document.getElementById('balance');
const exportBtn = document.getElementById('exportBtn');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModal = document.querySelector('.close');
const cancelEdit = document.getElementById('cancelEdit');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 今日の日付をデフォルト設定
    document.getElementById('date').valueAsDate = new Date();
    renderTransactions();
    updateSummary();
});

// 取引追加
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseInt(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        memo: document.getElementById('memo').value
    };
    
    transactions.unshift(transaction);
    saveTransactions();
    renderTransactions();
    updateSummary();
    
    // フォームリセット
    transactionForm.reset();
    document.getElementById('date').valueAsDate = new Date();
});

// 取引一覧表示
function renderTransactions() {
    transactionList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px 0;">取引履歴はありません</p>';
        return;
    }
    
    transactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        const typeText = transaction.type === 'income' ? '収入' : '支出';
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const sign = transaction.type === 'income' ? '+' : '-';
        
        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-header">
                    <span class="transaction-type ${transaction.type}">${typeText}</span>
                    <span class="transaction-category">${transaction.category}</span>
                    <span class="transaction-amount ${amountClass}">${sign}¥${transaction.amount.toLocaleString()}</span>
                </div>
                <div class="transaction-meta">
                    <span>${formatDate(transaction.date)}</span>
                    ${transaction.memo ? `<span>${transaction.memo}</span>` : ''}
                </div>
            </div>
            <div class="transaction-actions">
                <button class="edit-btn" onclick="editTransaction(${transaction.id})">編集</button>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">削除</button>
            </div>
        `;
        
        transactionList.appendChild(item);
    });
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// サマリー更新
function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    totalIncomeEl.textContent = `¥${totalIncome.toLocaleString()}`;
    totalExpenseEl.textContent = `¥${totalExpense.toLocaleString()}`;
    balanceEl.textContent = `¥${balance.toLocaleString()}`;
    
    // 残高の色を変更
    if (balance > 0) {
        balanceEl.style.color = 'var(--success-color)';
    } else if (balance < 0) {
        balanceEl.style.color = 'var(--danger-color)';
    } else {
        balanceEl.style.color = 'var(--text-primary)';
    }
}

// 取引編集
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    editingId = id;
    
    document.getElementById('editType').value = transaction.type;
    document.getElementById('editCategory').value = transaction.category;
    document.getElementById('editAmount').value = transaction.amount;
    document.getElementById('editDate').value = transaction.date;
    document.getElementById('editMemo').value = transaction.memo;
    
    editModal.style.display = 'block';
}

// 編集フォーム送信
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const index = transactions.findIndex(t => t.id === editingId);
    if (index === -1) return;
    
    transactions[index] = {
        id: editingId,
        type: document.getElementById('editType').value,
        category: document.getElementById('editCategory').value,
        amount: parseInt(document.getElementById('editAmount').value),
        date: document.getElementById('editDate').value,
        memo: document.getElementById('editMemo').value
    };
    
    saveTransactions();
    renderTransactions();
    updateSummary();
    
    editModal.style.display = 'none';
    editingId = null;
});

// 取引削除
function deleteTransaction(id) {
    if (!confirm('この取引を削除しますか？')) return;
    
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateSummary();
}

// データ保存
function saveTransactions() {
    localStorage.setItem('moneyTransactions', JSON.stringify(transactions));
}

// CSVエクスポート
exportBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    const headers = ['日付', '種別', 'カテゴリ', '金額', 'メモ'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            t.date,
            t.type === 'income' ? '収入' : '支出',
            t.category,
            t.amount,
            t.memo || ''
        ].map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `お金管理_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// モーダルクローズ
closeModal.onclick = () => {
    editModal.style.display = 'none';
    editingId = null;
};

cancelEdit.onclick = () => {
    editModal.style.display = 'none';
    editingId = null;
};

window.onclick = (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
        editingId = null;
    }
};