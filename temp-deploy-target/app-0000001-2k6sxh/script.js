// データ管理
let entries = JSON.parse(localStorage.getItem('moneyEntries')) || [];
let editingId = null;

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
    // 今日の日付をデフォルトに設定
    document.getElementById('date').valueAsDate = new Date();
    updateDisplay();
});

// エントリー追加・編集
function addEntry() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    if (!date || !description || !amount || amount <= 0) {
        alert('すべての項目を正しく入力してください');
        return;
    }
    
    if (editingId) {
        // 編集モード
        const index = entries.findIndex(e => e.id === editingId);
        if (index !== -1) {
            entries[index] = {
                id: editingId,
                type,
                date,
                description,
                amount
            };
        }
        editingId = null;
    } else {
        // 新規追加
        const entry = {
            id: Date.now(),
            type,
            date,
            description,
            amount
        };
        entries.push(entry);
    }
    
    // フォームクリア
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.querySelector('input[name="type"][value="income"]').checked = true;
    
    // 保存と更新
    saveData();
    updateDisplay();
}

// データ保存
function saveData() {
    localStorage.setItem('moneyEntries', JSON.stringify(entries));
}

// 表示更新
function updateDisplay() {
    updateSummary();
    updateList();
}

// 集計更新
function updateSummary() {
    const totalIncome = entries
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpense = entries
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
    
    const balance = totalIncome - totalExpense;
    
    document.getElementById('totalIncome').textContent = `¥${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpense').textContent = `¥${totalExpense.toLocaleString()}`;
    document.getElementById('balance').textContent = `¥${balance.toLocaleString()}`;
}

// リスト更新
function updateList() {
    const listContainer = document.getElementById('entriesList');
    listContainer.innerHTML = '';
    
    // 日付順（新しい順）でソート
    const sortedEntries = [...entries].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedEntries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = `entry-item ${entry.type}`;
        
        entryDiv.innerHTML = `
            <div class="entry-info">
                <div class="entry-date">${formatDate(entry.date)}</div>
                <div class="entry-description">${escapeHtml(entry.description)}</div>
                <div class="entry-amount ${entry.type}">
                    ${entry.type === 'income' ? '+' : '-'}¥${entry.amount.toLocaleString()}
                </div>
            </div>
            <div class="entry-actions">
                <button class="btn-edit" onclick="editEntry(${entry.id})">編集</button>
                <button class="btn-delete" onclick="deleteEntry(${entry.id})">削除</button>
            </div>
        `;
        
        listContainer.appendChild(entryDiv);
    });
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 編集
function editEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    editingId = id;
    document.querySelector(`input[name="type"][value="${entry.type}"]`).checked = true;
    document.getElementById('date').value = entry.date;
    document.getElementById('description').value = entry.description;
    document.getElementById('amount').value = entry.amount;
    
    // 入力欄にスクロール
    document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth' });
}

// 削除
function deleteEntry(id) {
    if (confirm('このエントリーを削除しますか？')) {
        entries = entries.filter(e => e.id !== id);
        saveData();
        updateDisplay();
    }
}

// CSV ダウンロード
function downloadCSV() {
    if (entries.length === 0) {
        alert('ダウンロードするデータがありません');
        return;
    }
    
    // CSVヘッダー
    let csv = 'ID,種別,日付,内容,金額\n';
    
    // データ行
    entries.forEach(entry => {
        csv += `${entry.id},${entry.type === 'income' ? '収入' : '支出'},${entry.date},"${entry.description}",${entry.amount}\n`;
    });
    
    // BOMを追加（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロード
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `money_data_${formatDate(new Date().toISOString().split('T')[0])}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}