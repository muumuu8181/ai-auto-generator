// お金管理システム - メインスクリプト

// データ管理
let transactions = JSON.parse(localStorage.getItem('moneyTransactions')) || [];
let editingId = null;

// DOM要素の取得
const moneyForm = document.getElementById('money-form');
const editForm = document.getElementById('edit-form');
const transactionList = document.getElementById('transaction-list');
const totalIncome = document.getElementById('total-income');
const totalExpense = document.getElementById('total-expense');
const totalBalance = document.getElementById('total-balance');
const exportCsvBtn = document.getElementById('export-csv');
const filterType = document.getElementById('filter-type');
const filterMonth = document.getElementById('filter-month');
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close');
const cancelEdit = document.getElementById('cancel-edit');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 今日の日付をデフォルトに設定
    document.getElementById('date').valueAsDate = new Date();
    
    // 現在の年月をフィルターのデフォルトに設定
    const now = new Date();
    filterMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    updateDisplay();
});

// イベントリスナー
moneyForm.addEventListener('submit', handleSubmit);
editForm.addEventListener('submit', handleEditSubmit);
exportCsvBtn.addEventListener('click', exportToCSV);
filterType.addEventListener('change', updateDisplay);
filterMonth.addEventListener('change', updateDisplay);
closeModal.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);

// 新規取引の追加
function handleSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseInt(document.getElementById('amount').value),
        memo: document.getElementById('memo').value
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateDisplay();
    moneyForm.reset();
    
    // 今日の日付を再設定
    document.getElementById('date').valueAsDate = new Date();
    
    // 追加成功のフィードバック
    showNotification('取引を追加しました');
}

// 取引の編集
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    editingId = id;
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-date').value = transaction.date;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-category').value = transaction.category;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-memo').value = transaction.memo;
    
    editModal.style.display = 'block';
}

// 編集の保存
function handleEditSubmit(e) {
    e.preventDefault();
    
    const index = transactions.findIndex(t => t.id === editingId);
    if (index === -1) return;
    
    transactions[index] = {
        id: editingId,
        date: document.getElementById('edit-date').value,
        type: document.getElementById('edit-type').value,
        category: document.getElementById('edit-category').value,
        amount: parseInt(document.getElementById('edit-amount').value),
        memo: document.getElementById('edit-memo').value
    };
    
    saveTransactions();
    updateDisplay();
    closeEditModal();
    showNotification('取引を更新しました');
}

// 取引の削除
function deleteTransaction(id) {
    if (!confirm('この取引を削除してもよろしいですか？')) return;
    
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDisplay();
    showNotification('取引を削除しました');
}

// モーダルを閉じる
function closeEditModal() {
    editModal.style.display = 'none';
    editingId = null;
}

// 表示の更新
function updateDisplay() {
    // フィルタリング
    let filteredTransactions = [...transactions];
    
    // 種別フィルター
    const typeFilter = filterType.value;
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    // 月フィルター
    const monthFilter = filterMonth.value;
    if (monthFilter) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.date.startsWith(monthFilter)
        );
    }
    
    // 日付でソート（新しい順）
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // リストの表示
    displayTransactions(filteredTransactions);
    
    // サマリーの計算と表示
    updateSummary(filteredTransactions);
}

// 取引リストの表示
function displayTransactions(transactionArray) {
    if (transactionArray.length === 0) {
        transactionList.innerHTML = '<p class="empty-message">表示する取引がありません</p>';
        return;
    }
    
    transactionList.innerHTML = transactionArray.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-category">${transaction.category}</div>
                ${transaction.memo ? `<div class="transaction-memo">${transaction.memo}</div>` : ''}
            </div>
            <div class="transaction-amount">
                ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount.toLocaleString()}
            </div>
            <div class="transaction-actions">
                <button class="btn-edit" onclick="editTransaction(${transaction.id})">編集</button>
                <button class="btn-delete" onclick="deleteTransaction(${transaction.id})">削除</button>
            </div>
        </div>
    `).join('');
}

// サマリーの更新
function updateSummary(transactionArray) {
    const income = transactionArray
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactionArray
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    totalIncome.textContent = `¥${income.toLocaleString()}`;
    totalExpense.textContent = `¥${expense.toLocaleString()}`;
    totalBalance.textContent = `¥${balance.toLocaleString()}`;
    
    // バランスの色を変更
    if (balance > 0) {
        totalBalance.style.color = '#5cb85c';
    } else if (balance < 0) {
        totalBalance.style.color = '#d9534f';
    } else {
        totalBalance.style.color = '#4a90e2';
    }
}

// CSVエクスポート
function exportToCSV() {
    if (transactions.length === 0) {
        alert('エクスポートする取引がありません');
        return;
    }
    
    // CSVヘッダー
    let csv = '\uFEFF日付,種別,カテゴリー,金額,メモ\n';
    
    // データ行
    transactions
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(t => {
            csv += `${t.date},${t.type === 'income' ? '収入' : '支出'},${t.category},${t.amount},${t.memo || ''}\n`;
        });
    
    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `money_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSVファイルをダウンロードしました');
}

// データの保存
function saveTransactions() {
    localStorage.setItem('moneyTransactions', JSON.stringify(transactions));
}

// 日付のフォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    
    return `${year}年${month}月${day}日(${weekday})`;
}

// 通知の表示
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #4a90e2;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
        z-index: 1001;
    `;
    notification.textContent = message;
    
    // アニメーションのスタイル追加
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

// モーダルの外側クリックで閉じる
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});