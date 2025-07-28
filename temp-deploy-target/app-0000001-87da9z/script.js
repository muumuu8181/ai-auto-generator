// データ管理
let transactions = [];
let editingId = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // LocalStorageからデータを読み込み
    loadTransactions();
    
    // 今日の日付をセット
    document.getElementById('date').valueAsDate = new Date();
    
    // イベントリスナーの設定
    document.getElementById('transactionForm').addEventListener('submit', handleSubmit);
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    document.getElementById('downloadCsv').addEventListener('click', downloadCSV);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // 初期表示
    updateDisplay();
});

// 取引を追加
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
    
    // フォームをリセット
    e.target.reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // 成功メッセージ（簡易的なフィードバック）
    showNotification('取引を追加しました');
}

// 取引を更新
function handleEditSubmit(e) {
    e.preventDefault();
    
    const index = transactions.findIndex(t => t.id === editingId);
    if (index !== -1) {
        transactions[index] = {
            id: editingId,
            date: document.getElementById('editDate').value,
            type: document.getElementById('editType').value,
            category: document.getElementById('editCategory').value,
            amount: parseInt(document.getElementById('editAmount').value),
            memo: document.getElementById('editMemo').value
        };
        
        saveTransactions();
        updateDisplay();
        closeModal();
        showNotification('取引を更新しました');
    }
}

// 編集モーダルを開く
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        editingId = id;
        document.getElementById('editId').value = id;
        document.getElementById('editDate').value = transaction.date;
        document.getElementById('editType').value = transaction.type;
        document.getElementById('editCategory').value = transaction.category;
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editMemo').value = transaction.memo;
        
        document.getElementById('editModal').style.display = 'block';
    }
}

// 取引を削除
function deleteTransaction(id) {
    if (confirm('この取引を削除してもよろしいですか？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDisplay();
        showNotification('取引を削除しました');
    }
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    editingId = null;
}

// 表示を更新
function updateDisplay() {
    updateTransactionList();
    updateSummary();
}

// 取引リストを更新
function updateTransactionList() {
    const tbody = document.getElementById('transactionList');
    const noDataMsg = document.getElementById('noDataMessage');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '';
        noDataMsg.style.display = 'block';
        return;
    }
    
    noDataMsg.style.display = 'none';
    
    // 日付の新しい順にソート
    const sorted = [...transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    tbody.innerHTML = sorted.map(transaction => `
        <tr class="${transaction.type}-row">
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.type === 'income' ? '収入' : '支出'}</td>
            <td>${transaction.category}</td>
            <td>¥${formatNumber(transaction.amount)}</td>
            <td>${transaction.memo || '-'}</td>
            <td>
                <button class="btn btn-edit" onclick="editTransaction(${transaction.id})">編集</button>
                <button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">削除</button>
            </td>
        </tr>
    `).join('');
}

// サマリーを更新
function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    document.getElementById('totalIncome').textContent = `¥${formatNumber(totalIncome)}`;
    document.getElementById('totalExpense').textContent = `¥${formatNumber(totalExpense)}`;
    document.getElementById('balance').textContent = `¥${formatNumber(balance)}`;
    
    // バランスの色を変更
    const balanceElement = document.getElementById('balance');
    if (balance < 0) {
        balanceElement.style.color = '#e74c3c';
    } else {
        balanceElement.style.color = 'white';
    }
}

// CSVダウンロード
function downloadCSV() {
    if (transactions.length === 0) {
        alert('ダウンロードするデータがありません');
        return;
    }
    
    // ヘッダー
    let csv = '日付,種別,カテゴリ,金額,メモ\n';
    
    // データ
    const sorted = [...transactions].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    csv += sorted.map(t => {
        return [
            t.date,
            t.type === 'income' ? '収入' : '支出',
            t.category,
            t.amount,
            t.memo || ''
        ].map(field => `"${field}"`).join(',');
    }).join('\n');
    
    // BOMを追加（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロード
    const link = document.createElement('a');
    const filename = `money_management_${formatDateForFilename(new Date())}.csv`;
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
    
    showNotification('CSVファイルをダウンロードしました');
}

// LocalStorage操作
function saveTransactions() {
    localStorage.setItem('moneyTransactions', JSON.stringify(transactions));
}

function loadTransactions() {
    const saved = localStorage.getItem('moneyTransactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
        } catch (e) {
            console.error('データの読み込みに失敗しました', e);
            transactions = [];
        }
    }
}

// ユーティリティ関数
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

function formatDateForFilename(date) {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    return num.toLocaleString('ja-JP');
}

function showNotification(message) {
    // 簡易的な通知表示
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}