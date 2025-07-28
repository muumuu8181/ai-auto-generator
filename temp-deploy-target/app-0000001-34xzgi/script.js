// データ管理クラス
class MoneyManager {
    constructor() {
        this.data = this.loadData();
        this.editingId = null;
    }

    // ローカルストレージからデータを読み込み
    loadData() {
        const saved = localStorage.getItem('moneyData');
        return saved ? JSON.parse(saved) : [];
    }

    // ローカルストレージにデータを保存
    saveData() {
        localStorage.setItem('moneyData', JSON.stringify(this.data));
    }

    // 新規データ追加
    addItem(item) {
        const newItem = {
            id: Date.now(),
            ...item,
            createdAt: new Date().toISOString()
        };
        this.data.push(newItem);
        this.saveData();
        return newItem;
    }

    // データ更新
    updateItem(id, updates) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.saveData();
            return true;
        }
        return false;
    }

    // データ削除
    deleteItem(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // サマリー計算
    calculateSummary() {
        const summary = {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0
        };

        this.data.forEach(item => {
            if (item.type === 'income') {
                summary.totalIncome += item.amount;
            } else {
                summary.totalExpense += item.amount;
            }
        });

        summary.balance = summary.totalIncome - summary.totalExpense;
        return summary;
    }

    // CSV生成
    generateCSV() {
        const headers = ['日付', '種類', 'カテゴリ', '金額', 'メモ'];
        const rows = [headers];

        // 日付順にソート
        const sortedData = [...this.data].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        sortedData.forEach(item => {
            rows.push([
                item.date,
                item.type === 'income' ? '収入' : '支出',
                item.category,
                item.amount,
                item.memo || ''
            ]);
        });

        // CSVフォーマットに変換
        return rows.map(row => 
            row.map(cell => 
                typeof cell === 'string' && cell.includes(',') 
                    ? `"${cell}"` 
                    : cell
            ).join(',')
        ).join('\n');
    }
}

// アプリケーション初期化
const moneyManager = new MoneyManager();

// DOM要素の取得
const moneyForm = document.getElementById('money-form');
const moneyList = document.getElementById('money-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const totalBalanceEl = document.getElementById('total-balance');
const downloadBtn = document.getElementById('download-csv');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const deleteBtn = document.getElementById('delete-btn');
const closeModal = document.querySelector('.close');

// 初期表示
updateDisplay();

// フォーム送信イベント
moneyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseInt(document.getElementById('amount').value),
        memo: document.getElementById('memo').value
    };

    moneyManager.addItem(formData);
    moneyForm.reset();
    
    // 今日の日付をデフォルトに設定
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    updateDisplay();
});

// 編集フォーム送信イベント
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const updates = {
        date: document.getElementById('edit-date').value,
        type: document.getElementById('edit-type').value,
        category: document.getElementById('edit-category').value,
        amount: parseInt(document.getElementById('edit-amount').value),
        memo: document.getElementById('edit-memo').value
    };

    moneyManager.updateItem(moneyManager.editingId, updates);
    closeEditModal();
    updateDisplay();
});

// 削除ボタンイベント
deleteBtn.addEventListener('click', () => {
    if (confirm('本当に削除しますか？')) {
        moneyManager.deleteItem(moneyManager.editingId);
        closeEditModal();
        updateDisplay();
    }
});

// CSVダウンロードイベント
downloadBtn.addEventListener('click', () => {
    const csv = moneyManager.generateCSV();
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `money_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// モーダルを閉じる
closeModal.addEventListener('click', closeEditModal);
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// 表示更新関数
function updateDisplay() {
    // サマリー更新
    const summary = moneyManager.calculateSummary();
    totalIncomeEl.textContent = `¥${summary.totalIncome.toLocaleString()}`;
    totalExpenseEl.textContent = `¥${summary.totalExpense.toLocaleString()}`;
    totalBalanceEl.textContent = `¥${summary.balance.toLocaleString()}`;

    // リスト更新
    moneyList.innerHTML = '';
    
    // 日付の新しい順にソート
    const sortedData = [...moneyManager.data].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedData.forEach(item => {
        const itemEl = createListItem(item);
        moneyList.appendChild(itemEl);
    });

    if (sortedData.length === 0) {
        moneyList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">データがありません</p>';
    }
}

// リストアイテム作成関数
function createListItem(item) {
    const div = document.createElement('div');
    div.className = `money-item ${item.type}`;
    
    div.innerHTML = `
        <div class="money-item-left">
            <div class="money-item-date">${formatDate(item.date)}</div>
            <div class="money-item-category">${item.category}</div>
            ${item.memo ? `<div class="money-item-memo">${item.memo}</div>` : ''}
        </div>
        <div class="money-item-right">
            <div class="money-item-amount">
                ${item.type === 'income' ? '+' : '-'}¥${item.amount.toLocaleString()}
            </div>
            <button class="edit-btn" onclick="openEditModal(${item.id})">編集</button>
        </div>
    `;
    
    return div;
}

// 日付フォーマット関数
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 編集モーダルを開く
function openEditModal(id) {
    const item = moneyManager.data.find(item => item.id === id);
    if (!item) return;

    moneyManager.editingId = id;
    
    document.getElementById('edit-date').value = item.date;
    document.getElementById('edit-type').value = item.type;
    document.getElementById('edit-category').value = item.category;
    document.getElementById('edit-amount').value = item.amount;
    document.getElementById('edit-memo').value = item.memo || '';
    
    editModal.style.display = 'block';
}

// 編集モーダルを閉じる
function closeEditModal() {
    editModal.style.display = 'none';
    moneyManager.editingId = null;
}

// 初期値設定
document.getElementById('date').value = new Date().toISOString().split('T')[0];