/* Smart Finance Manager v3.0 - JavaScript */

// グローバル状態管理
const FinanceApp = {
    data: {
        transactions: JSON.parse(localStorage.getItem('financeData') || '[]'),
        budgets: JSON.parse(localStorage.getItem('budgetData') || '[]'),
        settings: JSON.parse(localStorage.getItem('appSettings') || '{"theme":"dark","currency":"JPY"}')
    },
    
    charts: {
        trend: null,
        category: null
    },
    
    filters: {
        search: '',
        type: '',
        category: '',
        period: 'all'
    },
    
    currentPage: 1,
    itemsPerPage: 10
};

// カテゴリ定義
const CATEGORIES = {
    income: ['給与', '副業', '投資', 'ボーナス', 'その他収入'],
    expense: ['食費', '住居費', '交通費', '娯楽', '医療費', '教育費', '衣服', 'その他支出']
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadTransactions();
    updateDashboard();
    setupEventListeners();
    applyTheme();
});

// アプリ初期化
function initializeApp() {
    console.log('Smart Finance Manager v3.0 Starting...');
    
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    
    // カテゴリリストを初期化
    updateCategoryList();
    
    // サイドバーの状態を復元
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
        document.getElementById('sidebar').classList.add('collapsed');
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // サイドバー切り替え
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileSidebar);
    
    // モーダル関連
    document.getElementById('quickAddBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('closeModal').addEventListener('click', closeTransactionModal);
    document.getElementById('cancelModal').addEventListener('click', closeTransactionModal);
    
    // フォーム送信
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    
    // ナビゲーション
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // フィルター
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('typeFilter').addEventListener('change', handleTypeFilter);
    document.getElementById('categoryFilter').addEventListener('change', handleCategoryFilter);
    document.getElementById('periodFilter').addEventListener('change', handlePeriodFilter);
    
    // エクスポート
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('exportDataBtn').addEventListener('click', exportAllData);
    document.getElementById('importDataBtn').addEventListener('click', importData);
    
    // テーマ切り替え
    document.getElementById('themeSelect').addEventListener('change', handleThemeChange);
    
    // チャート期間変更
    document.getElementById('chartPeriod').addEventListener('change', updateTrendChart);
    
    // モーダル外クリックで閉じる
    document.getElementById('transactionModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeTransactionModal();
        }
    });
}

// サイドバー切り替え
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

// モバイルサイドバー切り替え
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// ナビゲーション処理
function handleNavigation(e) {
    e.preventDefault();
    
    const targetSection = e.target.closest('.nav-link').dataset.section;
    
    // アクティブナビを更新
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    e.target.closest('.nav-link').classList.add('active');
    
    // セクションを切り替え
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${targetSection}-section`).classList.add('active');
    
    // ページタイトルを更新
    const titles = {
        dashboard: 'ダッシュボード',
        transactions: '取引管理',
        budget: '予算管理',
        reports: 'レポート',
        settings: '設定'
    };
    document.querySelector('.page-title').textContent = titles[targetSection];
    
    // セクション固有の処理
    switch(targetSection) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'budget':
            loadBudgets();
            break;
        case 'reports':
            generateReports();
            break;
    }
    
    // モバイルサイドバーを閉じる
    document.getElementById('sidebar').classList.remove('mobile-open');
}

// 取引モーダルを開く
function openTransactionModal(transaction = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const title = document.getElementById('modalTitle');
    
    if (transaction) {
        // 編集モード
        title.textContent = '取引を編集';
        form.elements.editingId.value = transaction.id;
        form.elements.transactionDate.value = transaction.date;
        form.elements.transactionType.value = transaction.type;
        form.elements.transactionCategory.value = transaction.category;
        form.elements.transactionAmount.value = transaction.amount;
        form.elements.transactionMemo.value = transaction.memo || '';
    } else {
        // 新規追加モード
        title.textContent = '取引を追加';
        form.reset();
        form.elements.transactionDate.value = new Date().toISOString().split('T')[0];
    }
    
    updateCategoryList();
    modal.classList.add('show');
}

// 取引モーダルを閉じる
function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('show');
    document.getElementById('transactionForm').reset();
}

// フォーム送信処理
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transaction = {
        id: formData.get('editingId') || generateId(),
        date: formData.get('transactionDate'),
        type: formData.get('transactionType'),
        category: formData.get('transactionCategory'),
        amount: parseFloat(formData.get('transactionAmount')),
        memo: formData.get('transactionMemo'),
        timestamp: new Date().toISOString()
    };
    
    if (formData.get('editingId')) {
        // 編集
        const index = FinanceApp.data.transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
            FinanceApp.data.transactions[index] = transaction;
        }
    } else {
        // 新規追加
        FinanceApp.data.transactions.push(transaction);
    }
    
    // データを保存
    saveData();
    
    // UIを更新
    loadTransactions();
    updateDashboard();
    
    // モーダルを閉じる
    closeTransactionModal();
    
    // 通知を表示
    showNotification(`取引を${formData.get('editingId') ? '更新' : '追加'}しました`, 'success');
}

// データ保存
function saveData() {
    localStorage.setItem('financeData', JSON.stringify(FinanceApp.data.transactions));
    localStorage.setItem('budgetData', JSON.stringify(FinanceApp.data.budgets));
    localStorage.setItem('appSettings', JSON.stringify(FinanceApp.data.settings));
}

// ダッシュボード更新
function updateDashboard() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = FinanceApp.data.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    // 月次サマリー計算
    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyBalance = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? ((monthlyBalance / monthlyIncome) * 100) : 0;
    
    // UI更新
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpense').textContent = formatCurrency(monthlyExpense);
    document.getElementById('monthlyBalance').textContent = formatCurrency(monthlyBalance);
    document.getElementById('savingsRate').textContent = savingsRate.toFixed(1) + '%';
    
    // 前月比較
    updateChangeIndicators();
    
    // チャートを更新
    updateTrendChart();
    updateCategoryChart();
    
    // 最近の取引を表示
    displayRecentTransactions();
}

// 前月比較表示
function updateChangeIndicators() {
    // 前月のデータを取得して比較
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthTransactions = FinanceApp.data.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === lastMonth.getMonth() && 
               transactionDate.getFullYear() === lastMonth.getFullYear();
    });
    
    const lastMonthIncome = lastMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthExpense = lastMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // 現月データ
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = FinanceApp.data.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // 変化率計算
    const incomeChange = lastMonthIncome > 0 ? 
        ((monthlyIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
    const expenseChange = lastMonthExpense > 0 ? 
        ((monthlyExpense - lastMonthExpense) / lastMonthExpense * 100) : 0;
    
    // UI更新
    const incomeChangeEl = document.getElementById('incomeChange');
    const expenseChangeEl = document.getElementById('expenseChange');
    
    incomeChangeEl.textContent = `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%`;
    incomeChangeEl.className = `card-change ${incomeChange >= 0 ? 'positive' : 'negative'}`;
    
    expenseChangeEl.textContent = `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`;
    expenseChangeEl.className = `card-change ${expenseChange >= 0 ? 'negative' : 'positive'}`;
}

// トレンドチャート更新
function updateTrendChart() {
    const canvas = document.getElementById('trendChart');
    const ctx = canvas.getContext('2d');
    const period = parseInt(document.getElementById('chartPeriod').value);
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 過去N月のデータを準備
    const monthsData = [];
    for (let i = period - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthTransactions = FinanceApp.data.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === date.getMonth() && 
                   transactionDate.getFullYear() === date.getFullYear();
        });
        
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        monthsData.push({
            month: date.toLocaleDateString('ja-JP', { month: 'short' }),
            income,
            expense,
            balance: income - expense
        });
    }
    
    // チャートを描画
    drawLineChart(ctx, canvas, monthsData);
}

// 線グラフ描画
function drawLineChart(ctx, canvas, data) {
    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;
    
    // 最大値を計算
    const maxValue = Math.max(
        ...data.map(d => Math.max(d.income, d.expense)),
        0
    );
    const scale = height / (maxValue * 1.1);
    
    // グリッド線を描画
    ctx.strokeStyle = 'var(--border-color)';
    ctx.lineWidth = 1;
    
    // 横線
    for (let i = 0; i <= 5; i++) {
        const y = padding + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + width, y);
        ctx.stroke();
    }
    
    // 縦線
    const stepX = width / (data.length - 1);
    for (let i = 0; i < data.length; i++) {
        const x = padding + stepX * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + height);
        ctx.stroke();
    }
    
    // 収入線を描画
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = padding + stepX * i;
        const y = padding + height - (d.income * scale);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // 支出線を描画
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = padding + stepX * i;
        const y = padding + height - (d.expense * scale);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // データポイントを描画
    data.forEach((d, i) => {
        const x = padding + stepX * i;
        
        // 収入ポイント
        const incomeY = padding + height - (d.income * scale);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, incomeY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 支出ポイント
        const expenseY = padding + height - (d.expense * scale);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, expenseY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 月ラベル
        ctx.fillStyle = '#b8b8d1';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(d.month, x, padding + height + 20);
    });
    
    // 凡例
    ctx.font = '14px Inter';
    ctx.textAlign = 'left';
    
    // 収入凡例
    ctx.fillStyle = '#10b981';
    ctx.fillRect(padding, 10, 15, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('収入', padding + 20, 22);
    
    // 支出凡例
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padding + 80, 10, 15, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('支出', padding + 100, 22);
}

// カテゴリチャート更新
function updateCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 今月の支出をカテゴリ別に集計
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = FinanceApp.data.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' &&
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
    });
    
    const categoryData = {};
    monthlyExpenses.forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });
    
    // 円グラフを描画
    drawPieChart(ctx, canvas, categoryData);
}

// 円グラフ描画
function drawPieChart(ctx, canvas, data) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('データがありません', centerX, centerY);
        return;
    }
    
    const colors = [
        '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    let currentAngle = -Math.PI / 2;
    let colorIndex = 0;
    
    Object.entries(data).forEach(([category, amount]) => {
        const sliceAngle = (amount / total) * Math.PI * 2;
        
        // スライスを描画
        ctx.fillStyle = colors[colorIndex % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // ラベルを描画
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        const percentage = ((amount / total) * 100).toFixed(1);
        if (percentage > 5) { // 5%以上の場合のみラベル表示
            ctx.fillText(`${category}`, labelX, labelY - 5);
            ctx.fillText(`${percentage}%`, labelX, labelY + 10);
        }
        
        currentAngle += sliceAngle;
        colorIndex++;
    });
}

// 最近の取引表示
function displayRecentTransactions() {
    const container = document.getElementById('recentTransactionsList');
    const recentTransactions = FinanceApp.data.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">取引がありません</p>';
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item" onclick="editTransaction('${transaction.id}')">
            <div class="transaction-info">
                <div class="transaction-category">
                    <span class="category-icon">${transaction.type === 'income' ? '📈' : '📉'}</span>
                    ${transaction.category}
                </div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
        </div>
    `).join('');
}

// 取引一覧読み込み
function loadTransactions() {
    updateCategoryFilter();
    renderTransactionTable();
}

// カテゴリフィルター更新
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(FinanceApp.data.transactions.map(t => t.category))];
    
    // 既存のオプションをクリア（最初のオプション以外）
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }
    
    // カテゴリオプションを追加
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// 取引テーブル描画
function renderTransactionTable() {
    const container = document.getElementById('transactionsTable');
    const filteredTransactions = getFilteredTransactions();
    
    // ページネーション計算
    const totalPages = Math.ceil(filteredTransactions.length / FinanceApp.itemsPerPage);
    const startIndex = (FinanceApp.currentPage - 1) * FinanceApp.itemsPerPage;
    const endIndex = startIndex + FinanceApp.itemsPerPage;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    if (pageTransactions.length === 0) {
        container.innerHTML = '<p class="text-center p-4">該当する取引がありません</p>';
        return;
    }
    
    // テーブルHTML生成
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>日付</th>
                    <th>種別</th>
                    <th>カテゴリ</th>
                    <th>金額</th>
                    <th>メモ</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${pageTransactions.map(transaction => `
                    <tr>
                        <td>${formatDate(transaction.date)}</td>
                        <td>
                            <span class="badge ${transaction.type}">
                                ${transaction.type === 'income' ? '収入' : '支出'}
                            </span>
                        </td>
                        <td>${transaction.category}</td>
                        <td class="amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                        </td>
                        <td class="memo">${transaction.memo || '-'}</td>
                        <td>
                            <button class="btn-icon" onclick="editTransaction('${transaction.id}')" title="編集">
                                ✏️
                            </button>
                            <button class="btn-icon" onclick="deleteTransaction('${transaction.id}')" title="削除">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // ページネーション更新
    updatePagination(totalPages);
}

// フィルタリングされた取引を取得
function getFilteredTransactions() {
    return FinanceApp.data.transactions.filter(transaction => {
        // 検索フィルター
        if (FinanceApp.filters.search) {
            const searchTerm = FinanceApp.filters.search.toLowerCase();
            const searchFields = [
                transaction.category,
                transaction.memo || '',
                transaction.amount.toString()
            ].join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }
        
        // 種別フィルター
        if (FinanceApp.filters.type && transaction.type !== FinanceApp.filters.type) {
            return false;
        }
        
        // カテゴリフィルター
        if (FinanceApp.filters.category && transaction.category !== FinanceApp.filters.category) {
            return false;
        }
        
        // 期間フィルター
        if (FinanceApp.filters.period !== 'all') {
            const transactionDate = new Date(transaction.date);
            const now = new Date();
            
            switch (FinanceApp.filters.period) {
                case 'this-month':
                    if (transactionDate.getMonth() !== now.getMonth() || 
                        transactionDate.getFullYear() !== now.getFullYear()) {
                        return false;
                    }
                    break;
                case 'last-month':
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                    if (transactionDate.getMonth() !== lastMonth.getMonth() || 
                        transactionDate.getFullYear() !== lastMonth.getFullYear()) {
                        return false;
                    }
                    break;
                case 'this-year':
                    if (transactionDate.getFullYear() !== now.getFullYear()) {
                        return false;
                    }
                    break;
            }
        }
        
        return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ページネーション更新
function updatePagination(totalPages) {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // 前のページ
    paginationHTML += `
        <button class="btn btn-secondary" onclick="changePage(${FinanceApp.currentPage - 1})" 
                ${FinanceApp.currentPage === 1 ? 'disabled' : ''}>
            ← 前
        </button>
    `;
    
    // ページ番号
    for (let i = 1; i <= totalPages; i++) {
        if (i === FinanceApp.currentPage || 
            i === 1 || 
            i === totalPages || 
            (i >= FinanceApp.currentPage - 1 && i <= FinanceApp.currentPage + 1)) {
            paginationHTML += `
                <button class="btn ${i === FinanceApp.currentPage ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === FinanceApp.currentPage - 2 || i === FinanceApp.currentPage + 2) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }
    
    // 次のページ
    paginationHTML += `
        <button class="btn btn-secondary" onclick="changePage(${FinanceApp.currentPage + 1})" 
                ${FinanceApp.currentPage === totalPages ? 'disabled' : ''}>
            次 →
        </button>
    `;
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

// ページ変更
function changePage(page) {
    const filteredTransactions = getFilteredTransactions();
    const totalPages = Math.ceil(filteredTransactions.length / FinanceApp.itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        FinanceApp.currentPage = page;
        renderTransactionTable();
    }
}

// フィルター処理
function handleSearch(e) {
    FinanceApp.filters.search = e.target.value;
    FinanceApp.currentPage = 1;
    renderTransactionTable();
}

function handleTypeFilter(e) {
    FinanceApp.filters.type = e.target.value;
    FinanceApp.currentPage = 1;
    renderTransactionTable();
}

function handleCategoryFilter(e) {
    FinanceApp.filters.category = e.target.value;
    FinanceApp.currentPage = 1;
    renderTransactionTable();
}

function handlePeriodFilter(e) {
    FinanceApp.filters.period = e.target.value;
    FinanceApp.currentPage = 1;
    renderTransactionTable();
}

// 取引編集
function editTransaction(id) {
    const transaction = FinanceApp.data.transactions.find(t => t.id === id);
    if (transaction) {
        openTransactionModal(transaction);
    }
}

// 取引削除
function deleteTransaction(id) {
    if (confirm('この取引を削除しますか？')) {
        FinanceApp.data.transactions = FinanceApp.data.transactions.filter(t => t.id !== id);
        saveData();
        loadTransactions();
        updateDashboard();
        showNotification('取引を削除しました', 'success');
    }
}

// CSV出力
function exportToCSV() {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
        showNotification('出力するデータがありません', 'warning');
        return;
    }
    
    const headers = ['日付', '種別', 'カテゴリ', '金額', 'メモ'];
    const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => [
            t.date,
            t.type === 'income' ? '収入' : '支出',
            `"${t.category}"`,
            t.amount,
            `"${t.memo || ''}"`
        ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, `取引履歴_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('CSVファイルをダウンロードしました', 'success');
}

// 全データエクスポート
function exportAllData() {
    const data = {
        transactions: FinanceApp.data.transactions,
        budgets: FinanceApp.data.budgets,
        settings: FinanceApp.data.settings,
        exportDate: new Date().toISOString()
    };
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('データをエクスポートしました', 'success');
}

// データインポート
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.transactions) {
                    FinanceApp.data.transactions = data.transactions;
                }
                if (data.budgets) {
                    FinanceApp.data.budgets = data.budgets;
                }
                if (data.settings) {
                    FinanceApp.data.settings = data.settings;
                }
                
                saveData();
                loadTransactions();
                updateDashboard();
                applyTheme();
                
                showNotification('データをインポートしました', 'success');
            } catch (error) {
                showNotification('ファイルの読み込みに失敗しました', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// テーマ変更
function handleThemeChange(e) {
    FinanceApp.data.settings.theme = e.target.value;
    saveData();
    applyTheme();
}

// テーマ適用
function applyTheme() {
    const theme = FinanceApp.data.settings.theme;
    document.documentElement.setAttribute('data-theme', 
        theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme
    );
    
    document.getElementById('themeSelect').value = theme;
}

// カテゴリリスト更新
function updateCategoryList() {
    const typeSelect = document.getElementById('transactionType');
    const categoryInput = document.getElementById('transactionCategory');
    const categoryList = document.getElementById('categoryList');
    
    const selectedType = typeSelect.value;
    const categories = selectedType ? CATEGORIES[selectedType] : [];
    
    categoryList.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
}

// 予算管理
function loadBudgets() {
    // 予算管理機能の実装
    console.log('Loading budgets...');
}

// レポート生成
function generateReports() {
    // レポート生成機能の実装
    console.log('Generating reports...');
}

// ユーティリティ関数
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 取引種別変更時のカテゴリ更新
document.addEventListener('DOMContentLoaded', function() {
    const typeSelect = document.getElementById('transactionType');
    if (typeSelect) {
        typeSelect.addEventListener('change', updateCategoryList);
    }
});

// PWA サービスワーカー登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// レスポンシブ対応
window.addEventListener('resize', function() {
    // チャートのリサイズ処理
    setTimeout(() => {
        updateTrendChart();
        updateCategoryChart();
    }, 100);
});

console.log('Smart Finance Manager v3.0 Loaded Successfully! 🎉');