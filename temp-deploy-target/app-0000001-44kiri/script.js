// データ管理
let records = [];
let editingId = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // LocalStorageからデータ読み込み
    loadRecords();
    
    // 今日の日付をデフォルトに設定
    document.getElementById('date').valueAsDate = new Date();
    
    // イベントリスナー設定
    document.getElementById('moneyForm').addEventListener('submit', handleSubmit);
    document.getElementById('downloadBtn').addEventListener('click', downloadCSV);
    document.getElementById('editForm').addEventListener('submit', handleEdit);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('editModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    updateDisplay();
});

// データ読み込み
function loadRecords() {
    const saved = localStorage.getItem('moneyRecords');
    if (saved) {
        records = JSON.parse(saved);
    }
}

// データ保存
function saveRecords() {
    localStorage.setItem('moneyRecords', JSON.stringify(records));
}

// 新規追加
function handleSubmit(e) {
    e.preventDefault();
    
    const record = {
        id: Date.now(),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseInt(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        memo: document.getElementById('memo').value
    };
    
    records.push(record);
    saveRecords();
    updateDisplay();
    
    // フォームリセット
    document.getElementById('moneyForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // 成功フィードバック
    showNotification('記録を追加しました');
}

// 表示更新
function updateDisplay() {
    updateSummary();
    updateTable();
}

// サマリー更新
function updateSummary() {
    let totalIncome = 0;
    let totalExpense = 0;
    
    records.forEach(record => {
        if (record.type === 'income') {
            totalIncome += record.amount;
        } else {
            totalExpense += record.amount;
        }
    });
    
    const balance = totalIncome - totalExpense;
    
    document.getElementById('totalIncome').textContent = `¥${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpense').textContent = `¥${totalExpense.toLocaleString()}`;
    document.getElementById('balance').textContent = `¥${balance.toLocaleString()}`;
    
    // 残高の色を変更
    const balanceElement = document.getElementById('balance');
    if (balance >= 0) {
        balanceElement.style.color = '#4caf50';
    } else {
        balanceElement.style.color = '#f44336';
    }
}

// テーブル更新
function updateTable() {
    const tbody = document.getElementById('recordsBody');
    const noRecords = document.getElementById('noRecords');
    
    if (records.length === 0) {
        tbody.innerHTML = '';
        noRecords.style.display = 'block';
        return;
    }
    
    noRecords.style.display = 'none';
    
    // 日付でソート（新しい順）
    const sortedRecords = [...records].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    tbody.innerHTML = sortedRecords.map(record => `
        <tr class="${record.type}-row">
            <td>${formatDate(record.date)}</td>
            <td>${record.type === 'income' ? '収入' : '支出'}</td>
            <td>${record.category}</td>
            <td>¥${record.amount.toLocaleString()}</td>
            <td>${record.memo || '-'}</td>
            <td>
                <button class="edit-btn" onclick="openEditModal(${record.id})">編集</button>
                <button class="delete-btn" onclick="deleteRecord(${record.id})">削除</button>
            </td>
        </tr>
    `).join('');
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

// 編集モーダルを開く
function openEditModal(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;
    
    editingId = id;
    document.getElementById('editType').value = record.type;
    document.getElementById('editCategory').value = record.category;
    document.getElementById('editAmount').value = record.amount;
    document.getElementById('editDate').value = record.date;
    document.getElementById('editMemo').value = record.memo;
    
    document.getElementById('editModal').style.display = 'block';
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    editingId = null;
}

// 編集処理
function handleEdit(e) {
    e.preventDefault();
    
    const index = records.findIndex(r => r.id === editingId);
    if (index === -1) return;
    
    records[index] = {
        id: editingId,
        type: document.getElementById('editType').value,
        category: document.getElementById('editCategory').value,
        amount: parseInt(document.getElementById('editAmount').value),
        date: document.getElementById('editDate').value,
        memo: document.getElementById('editMemo').value
    };
    
    saveRecords();
    updateDisplay();
    closeModal();
    showNotification('記録を更新しました');
}

// 削除処理
function deleteRecord(id) {
    if (!confirm('この記録を削除しますか？')) return;
    
    records = records.filter(r => r.id !== id);
    saveRecords();
    updateDisplay();
    showNotification('記録を削除しました');
}

// CSV ダウンロード
function downloadCSV() {
    if (records.length === 0) {
        alert('ダウンロードする記録がありません');
        return;
    }
    
    // ヘッダー
    let csv = '\ufeff日付,種別,カテゴリー,金額,メモ\n';
    
    // データ
    const sortedRecords = [...records].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    sortedRecords.forEach(record => {
        csv += `${record.date},`;
        csv += `${record.type === 'income' ? '収入' : '支出'},`;
        csv += `${record.category},`;
        csv += `${record.amount},`;
        csv += `${record.memo || ''}\n`;
    });
    
    // ダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `money_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSVファイルをダウンロードしました');
}

// 通知表示
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
        z-index: 1001;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// アニメーション定義
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100px);
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
            transform: translateX(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);