// お金管理システム - JavaScript実装
class MoneyManager {
    constructor() {
        this.records = this.loadRecords();
        this.editingId = null;
        this.init();
    }
    
    init() {
        // フォーム要素の取得
        this.form = document.getElementById('moneyForm');
        this.typeSelect = document.getElementById('type');
        this.categoryInput = document.getElementById('category');
        this.amountInput = document.getElementById('amount');
        this.descriptionInput = document.getElementById('description');
        this.dateInput = document.getElementById('date');
        this.editIdInput = document.getElementById('editId');
        this.submitBtn = document.getElementById('submitBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // サマリー要素の取得
        this.totalIncomeEl = document.getElementById('totalIncome');
        this.totalExpenseEl = document.getElementById('totalExpense');
        this.balanceEl = document.getElementById('balance');
        
        // その他の要素
        this.recordsContainer = document.getElementById('recordsContainer');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // イベントリスナーの設定
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        this.downloadBtn.addEventListener('click', () => this.downloadCSV());
        
        // 初期表示
        this.setTodayDate();
        this.updateDisplay();
    }
    
    // ローカルストレージからデータを読み込み
    loadRecords() {
        const saved = localStorage.getItem('moneyRecords');
        return saved ? JSON.parse(saved) : [];
    }
    
    // ローカルストレージにデータを保存
    saveRecords() {
        localStorage.setItem('moneyRecords', JSON.stringify(this.records));
    }
    
    // 今日の日付を設定
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    }
    
    // フォーム送信処理
    handleSubmit(e) {
        e.preventDefault();
        
        const record = {
            id: this.editingId || Date.now().toString(),
            type: this.typeSelect.value,
            category: this.categoryInput.value,
            amount: parseFloat(this.amountInput.value),
            description: this.descriptionInput.value,
            date: this.dateInput.value,
            createdAt: this.editingId ? this.getRecordById(this.editingId).createdAt : new Date().toISOString()
        };
        
        if (this.editingId) {
            // 編集モード
            const index = this.records.findIndex(r => r.id === this.editingId);
            if (index !== -1) {
                this.records[index] = record;
            }
            this.cancelEdit();
        } else {
            // 新規追加
            this.records.push(record);
        }
        
        this.saveRecords();
        this.updateDisplay();
        this.form.reset();
        this.setTodayDate();
    }
    
    // レコードを編集
    editRecord(id) {
        const record = this.getRecordById(id);
        if (!record) return;
        
        this.editingId = id;
        this.typeSelect.value = record.type;
        this.categoryInput.value = record.category;
        this.amountInput.value = record.amount;
        this.descriptionInput.value = record.description;
        this.dateInput.value = record.date;
        
        this.submitBtn.textContent = '更新する';
        this.cancelBtn.style.display = 'block';
        
        // フォームまでスクロール
        this.form.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 編集をキャンセル
    cancelEdit() {
        this.editingId = null;
        this.form.reset();
        this.setTodayDate();
        this.submitBtn.textContent = '記録する';
        this.cancelBtn.style.display = 'none';
    }
    
    // レコードを削除
    deleteRecord(id) {
        if (confirm('この記録を削除してもよろしいですか？')) {
            this.records = this.records.filter(r => r.id !== id);
            this.saveRecords();
            this.updateDisplay();
        }
    }
    
    // IDでレコードを取得
    getRecordById(id) {
        return this.records.find(r => r.id === id);
    }
    
    // 画面を更新
    updateDisplay() {
        this.updateSummary();
        this.updateRecordsList();
    }
    
    // サマリーを更新
    updateSummary() {
        const totalIncome = this.records
            .filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0);
        
        const totalExpense = this.records
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0);
        
        const balance = totalIncome - totalExpense;
        
        this.totalIncomeEl.textContent = this.formatCurrency(totalIncome);
        this.totalExpenseEl.textContent = this.formatCurrency(totalExpense);
        this.balanceEl.textContent = this.formatCurrency(balance);
    }
    
    // レコード一覧を更新
    updateRecordsList() {
        if (this.records.length === 0) {
            this.recordsContainer.innerHTML = '<p class="no-records">まだ記録がありません</p>';
            return;
        }
        
        // 日付でソート（新しい順）
        const sortedRecords = [...this.records].sort((a, b) => 
            new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        const table = document.createElement('table');
        table.className = 'records-table';
        
        // ヘッダー
        table.innerHTML = `
            <thead>
                <tr>
                    <th>日付</th>
                    <th>種類</th>
                    <th>カテゴリ</th>
                    <th>金額</th>
                    <th>説明</th>
                    <th>操作</th>
                </tr>
            </thead>
        `;
        
        // ボディ
        const tbody = document.createElement('tbody');
        sortedRecords.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${this.formatDate(record.date)}</td>
                <td class="type-${record.type}">${record.type === 'income' ? '収入' : '支出'}</td>
                <td>${record.category}</td>
                <td>${this.formatCurrency(record.amount)}</td>
                <td>${record.description || '-'}</td>
                <td>
                    <button class="edit-btn" onclick="moneyManager.editRecord('${record.id}')">編集</button>
                    <button class="delete-btn" onclick="moneyManager.deleteRecord('${record.id}')">削除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        this.recordsContainer.innerHTML = '';
        this.recordsContainer.appendChild(table);
    }
    
    // 通貨フォーマット
    formatCurrency(amount) {
        return '¥' + amount.toLocaleString('ja-JP');
    }
    
    // 日付フォーマット
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
    }
    
    // CSVダウンロード
    downloadCSV() {
        if (this.records.length === 0) {
            alert('ダウンロードする記録がありません');
            return;
        }
        
        // CSVヘッダー
        let csv = '\ufeff日付,種類,カテゴリ,金額,説明\n';
        
        // データ行
        const sortedRecords = [...this.records].sort((a, b) => 
            new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        sortedRecords.forEach(record => {
            const row = [
                record.date,
                record.type === 'income' ? '収入' : '支出',
                record.category,
                record.amount,
                record.description || ''
            ];
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        // ダウンロード
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `money_records_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// アプリケーションの初期化
let moneyManager;
document.addEventListener('DOMContentLoaded', () => {
    moneyManager = new MoneyManager();
});