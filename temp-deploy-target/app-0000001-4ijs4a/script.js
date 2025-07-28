/* Smart Finance Manager v4.0 - Advanced JavaScript Framework */

// Application State Management
class FinanceManager {
    constructor() {
        this.data = {
            transactions: this.loadData('transactions', []),
            categories: this.loadData('categories', this.getDefaultCategories()),
            budgets: this.loadData('budgets', []),
            goals: this.loadData('goals', []),
            settings: this.loadData('settings', this.getDefaultSettings())
        };
        
        this.filters = {
            search: '',
            type: '',
            category: '',
            period: 'all',
            sortBy: 'date',
            sortOrder: 'desc'
        };
        
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 20,
            totalItems: 0
        };
        
        this.charts = {};
        this.observers = [];
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            await this.setupEventListeners();
            await this.initializeCharts();
            await this.updateDashboard();
            await this.applyTheme();
            await this.loadTransactions();
            
            this.isInitialized = true;
            this.showNotification('Smart Finance Manager v4.0 が起動しました', 'success');
            console.log('🚀 Smart Finance Manager v4.0 initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showNotification('初期化に失敗しました', 'error');
        }
    }
    
    // Data Management
    loadData(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(`financeApp_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return defaultValue;
        }
    }
    
    saveData(key, data) {
        try {
            localStorage.setItem(`financeApp_${key}`, JSON.stringify(data));
            this.notifyObservers(key, data);
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            this.showNotification('データの保存に失敗しました', 'error');
        }
    }
    
    // Observer Pattern for Data Changes
    addObserver(callback) {
        this.observers.push(callback);
    }
    
    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }
    
    notifyObservers(key, data) {
        this.observers.forEach(callback => {
            try {
                callback(key, data);
            } catch (error) {
                console.error('Observer error:', error);
            }
        });
    }
    
    // Default Data
    getDefaultCategories() {
        return {
            income: ['給与', '副業', '投資収益', 'ボーナス', 'その他収入'],
            expense: ['食費', '住房費', '交通費', '娯楽費', '医療費', '教育費', '衣服費', 'その他支出']
        };
    }
    
    getDefaultSettings() {
        return {
            theme: 'dark',
            currency: 'JPY',
            language: 'ja',
            dateFormat: 'YYYY-MM-DD',
            notifications: true,
            autoBackup: true,
            budgetAlerts: true
        };
    }
    
    // Event Listeners Setup
    async setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Header Events
        this.setupHeaderEvents();
        
        // Modal Events
        this.setupModalEvents();
        
        // Form Events
        this.setupFormEvents();
        
        // Table Events
        this.setupTableEvents();
        
        // Filter Events
        this.setupFilterEvents();
        
        // Settings Events
        this.setupSettingsEvents();
        
        // Keyboard Shortcuts
        this.setupKeyboardShortcuts();
        
        // Window Events
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
        
        // Service Worker
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
    }
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
        
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', 
                    sidebar.classList.contains('active').toString());
            });
        }
    }
    
    setupHeaderEvents() {
        // Quick add button
        const quickAddBtn = document.getElementById('quickAddBtn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.openTransactionModal());
        }
        
        // User menu dropdown
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });
            
            document.addEventListener('click', () => {
                userDropdown.classList.remove('active');
            });
        }
        
        // Export data from dropdown
        const exportData = document.getElementById('exportData');
        if (exportData) {
            exportData.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportAllData();
            });
        }
    }
    
    setupModalEvents() {
        const modal = document.getElementById('transactionModal');
        const closeBtn = document.getElementById('closeTransactionModal');
        const cancelBtn = document.getElementById('cancelTransactionModal');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeTransactionModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeTransactionModal());
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeTransactionModal();
                }
            });
        }
    }
    
    setupFormEvents() {
        const form = document.getElementById('transactionForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }
        
        // Type change updates categories
        const typeSelect = document.getElementById('transactionType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => this.updateCategoryDatalist());
        }
        
        // Auto-save form data
        const formInputs = form?.querySelectorAll('input, select, textarea');
        formInputs?.forEach(input => {
            input.addEventListener('input', this.debounce(() => {
                this.autoSaveFormData(form);
            }, 500));
        });
    }
    
    setupTableEvents() {
        // Add transaction button
        const addBtn = document.getElementById('addTransactionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openTransactionModal());
        }
        
        // Export/Import buttons
        const exportBtn = document.getElementById('exportTransactionsBtn');
        const importBtn = document.getElementById('importTransactionsBtn');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportTransactions());
        if (importBtn) importBtn.addEventListener('click', () => this.importTransactions());
        
        // Bulk actions
        const bulkActions = document.getElementById('bulkActions');
        const executeBulkAction = document.getElementById('executeBulkAction');
        
        if (executeBulkAction) {
            executeBulkAction.addEventListener('click', () => {
                const action = bulkActions?.value;
                if (action) this.executeBulkAction(action);
            });
        }
        
        // Select all checkbox
        const selectAll = document.getElementById('selectAllTransactions');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleAllTransactions(e.target.checked);
            });
        }
    }
    
    setupFilterEvents() {
        const searchInput = document.getElementById('searchTransactions');
        const typeFilter = document.getElementById('typeFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const periodFilter = document.getElementById('periodFilter');
        const clearFilters = document.getElementById('clearFilters');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.applyFilters();
            }, 300));
        }
        
        [typeFilter, categoryFilter, periodFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.updateFiltersFromUI();
                    this.applyFilters();
                });
            }
        });
        
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearAllFilters());
        }
        
        // Sort headers
        const sortHeaders = document.querySelectorAll('.sortable');
        sortHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.dataset.sort;
                this.toggleSort(sortBy);
            });
        });
    }
    
    setupSettingsEvents() {
        const themeSelect = document.getElementById('themeSelect');
        const currencySelect = document.getElementById('currencySelect');
        const exportAllBtn = document.getElementById('exportAllDataBtn');
        const importDataBtn = document.getElementById('importDataBtn');
        const clearDataBtn = document.getElementById('clearDataBtn');
        
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.data.settings.theme = e.target.value;
                this.saveData('settings', this.data.settings);
                this.applyTheme();
            });
        }
        
        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                this.data.settings.currency = e.target.value;
                this.saveData('settings', this.data.settings);
                this.updateDashboard();
            });
        }
        
        if (exportAllBtn) exportAllBtn.addEventListener('click', () => this.exportAllData());
        if (importDataBtn) importDataBtn.addEventListener('click', () => this.importAllData());
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                if (confirm('すべてのデータが削除されます。この操作は取り消せません。続行しますか？')) {
                    this.clearAllData();
                }
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New transaction
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openTransactionModal();
            }
            
            // Ctrl/Cmd + E: Export data
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportTransactions();
            }
            
            // Escape: Close modal
            if (e.key === 'Escape') {
                this.closeTransactionModal();
            }
            
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchTransactions');
                if (searchInput) searchInput.focus();
            }
        });
    }
    
    // Navigation
    navigateToSection(sectionName) {
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNav) activeNav.classList.add('active');
        
        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
            
            // Load section-specific data
            this.loadSectionData(sectionName);
        }
        
        // Close mobile menu
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
        
        // Update page title
        this.updatePageTitle(sectionName);
    }
    
    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'budget':
                this.loadBudgets();
                break;
            case 'goals':
                this.loadGoals();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    updatePageTitle(sectionName) {
        const titles = {
            dashboard: 'ダッシュボード',
            transactions: '取引履歴',
            analytics: '分析・レポート',
            budget: '予算管理',
            goals: '目標設定',
            categories: 'カテゴリ管理',
            settings: '設定'
        };
        
        document.title = `${titles[sectionName] || sectionName} - Smart Finance Manager v4.0`;
    }
    
    // Transaction Management
    openTransactionModal(transaction = null) {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');
        const title = document.getElementById('modalTitle');
        
        if (!modal || !form || !title) return;
        
        // Reset form
        form.reset();
        
        if (transaction) {
            // Edit mode
            title.textContent = '取引を編集';
            this.populateForm(form, transaction);
        } else {
            // Add mode
            title.textContent = '取引を追加';
            document.getElementById('transactionDate').value = this.getCurrentDate();
        }
        
        this.updateCategoryDatalist();
        modal.classList.add('active');
        
        // Focus first input
        const firstInput = form.querySelector('input, select');
        if (firstInput) firstInput.focus();
    }
    
    closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        if (modal) {
            modal.classList.remove('active');
            
            // Clear any auto-saved data
            this.clearAutoSavedFormData();
        }
    }
    
    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: formData.get('editingTransactionId') || this.generateId(),
            date: formData.get('transactionDate'),
            type: formData.get('transactionType'),
            category: formData.get('transactionCategory'),
            amount: parseFloat(formData.get('transactionAmount')),
            memo: formData.get('transactionMemo') || '',
            timestamp: new Date().toISOString(),
            tags: this.extractTags(formData.get('transactionMemo') || '')
        };
        
        // Validation
        if (!this.validateTransaction(transaction)) {
            return;
        }
        
        // Save transaction
        if (formData.get('editingTransactionId')) {
            this.updateTransaction(transaction);
        } else {
            this.addTransaction(transaction);
        }
        
        this.closeTransactionModal();
    }
    
    validateTransaction(transaction) {
        const errors = [];
        
        if (!transaction.date) errors.push('日付を入力してください');
        if (!transaction.type) errors.push('種別を選択してください');
        if (!transaction.category) errors.push('カテゴリを入力してください');
        if (!transaction.amount || transaction.amount <= 0) errors.push('金額を正しく入力してください');
        
        if (errors.length > 0) {
            this.showNotification(errors.join('\n'), 'error');
            return false;
        }
        
        return true;
    }
    
    addTransaction(transaction) {
        this.data.transactions.push(transaction);
        this.saveData('transactions', this.data.transactions);
        
        // Update category if new
        this.updateCategoryList(transaction.category, transaction.type);
        
        // Refresh displays
        this.updateDashboard();
        this.loadTransactions();
        
        this.showNotification('取引を追加しました', 'success');
    }
    
    updateTransaction(transaction) {
        const index = this.data.transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
            this.data.transactions[index] = transaction;
            this.saveData('transactions', this.data.transactions);
            
            // Refresh displays
            this.updateDashboard();
            this.loadTransactions();
            
            this.showNotification('取引を更新しました', 'success');
        }
    }
    
    deleteTransaction(id) {
        if (!confirm('この取引を削除しますか？')) return;
        
        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.saveData('transactions', this.data.transactions);
        
        // Refresh displays
        this.updateDashboard();
        this.loadTransactions();
        
        this.showNotification('取引を削除しました', 'success');
    }
    
    // Dashboard Updates
    async updateDashboard() {
        this.updateSummaryCards();
        this.updateCharts();
        this.updateRecentTransactions();
        this.updateInsights();
        this.updateHeaderStats();
    }
    
    updateSummaryCards() {
        const period = this.getDashboardPeriod();
        const transactions = this.getTransactionsForPeriod(period);
        
        const income = this.calculateTotal(transactions, 'income');
        const expense = this.calculateTotal(transactions, 'expense');
        const balance = income - expense;
        const savingsRate = income > 0 ? (balance / income * 100) : 0;
        
        // Update values
        this.updateElement('totalIncome', this.formatCurrency(income));
        this.updateElement('totalExpense', this.formatCurrency(expense));
        this.updateElement('totalBalance', this.formatCurrency(balance));
        this.updateElement('savingsRate', `${savingsRate.toFixed(1)}%`);
        
        // Update changes
        this.updateChanges(period, { income, expense, balance, savingsRate });
    }
    
    updateChanges(period, current) {
        const previousPeriod = this.getPreviousPeriod(period);
        const previousTransactions = this.getTransactionsForPeriod(previousPeriod);
        
        const previous = {
            income: this.calculateTotal(previousTransactions, 'income'),
            expense: this.calculateTotal(previousTransactions, 'expense')
        };
        previous.balance = previous.income - previous.expense;
        previous.savingsRate = previous.income > 0 ? (previous.balance / previous.income * 100) : 0;
        
        // Calculate changes
        const changes = {
            income: this.calculatePercentChange(previous.income, current.income),
            expense: this.calculatePercentChange(previous.expense, current.expense),
            balance: this.calculatePercentChange(previous.balance, current.balance),
            savingsRate: current.savingsRate - previous.savingsRate
        };
        
        // Update change displays
        this.updateChangeDisplay('incomeChange', changes.income);
        this.updateChangeDisplay('expenseChange', changes.expense, true); // Reverse for expense
        this.updateChangeDisplay('balanceChange', changes.balance);
        this.updateChangeDisplay('savingsChange', changes.savingsRate, false, '%');
    }
    
    updateChangeDisplay(elementId, change, reverse = false, suffix = '%') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const isPositive = reverse ? change < 0 : change > 0;
        const icon = isPositive ? '↗️' : change < 0 ? '↘️' : '➡️';
        const className = isPositive ? 'positive' : change < 0 ? 'negative' : '';
        const sign = change > 0 ? '+' : '';
        
        element.innerHTML = `
            <span class="change-icon">${icon}</span>
            <span class="change-text">${sign}${change.toFixed(1)}${suffix}</span>
        `;
        element.className = `card-change ${className}`;
    }
    
    // Chart Management
    async initializeCharts() {
        await this.initTrendChart();
        await this.initCategoryChart();
        await this.initAnalyticsCharts();
    }
    
    async initTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.trend = new SimpleChart(ctx, canvas);
    }
    
    async initCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.category = new PieChart(ctx, canvas);
    }
    
    async initAnalyticsCharts() {
        const canvas = document.getElementById('monthlyAnalysisChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.monthlyAnalysis = new BarChart(ctx, canvas);
    }
    
    updateCharts() {
        this.updateTrendChart();
        this.updateCategoryChart();
    }
    
    updateTrendChart() {
        if (!this.charts.trend) return;
        
        const period = parseInt(document.getElementById('trendChartPeriod')?.value || '12');
        const data = this.getTrendData(period);
        
        this.charts.trend.update(data);
    }
    
    updateCategoryChart() {
        if (!this.charts.category) return;
        
        const period = document.getElementById('categoryChartPeriod')?.value || 'this-month';
        const data = this.getCategoryData(period);
        
        this.charts.category.update(data);
    }
    
    // Data Calculation Methods
    getTrendData(months) {
        const data = [];
        const now = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthTransactions = this.getTransactionsForMonth(date);
            
            const income = this.calculateTotal(monthTransactions, 'income');
            const expense = this.calculateTotal(monthTransactions, 'expense');
            
            data.push({
                label: this.formatMonth(date),
                income,
                expense,
                balance: income - expense
            });
        }
        
        return data;
    }
    
    getCategoryData(period) {
        const transactions = this.getTransactionsForPeriod(period)
            .filter(t => t.type === 'expense');
        
        const categoryTotals = {};
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        
        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }
    
    // Transaction Loading and Display
    loadTransactions() {
        this.updateCategoryFilter();
        this.renderTransactionTable();
        this.updatePagination();
    }
    
    renderTransactionTable() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        
        const filteredTransactions = this.getFilteredTransactions();
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const endIndex = startIndex + this.pagination.itemsPerPage;
        const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
        
        if (pageTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--muted-text);">
                        該当する取引がありません
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pageTransactions.map(transaction => `
            <tr class="transaction-row" data-id="${transaction.id}">
                <td class="checkbox-cell">
                    <input type="checkbox" class="transaction-checkbox" value="${transaction.id}">
                </td>
                <td>${this.formatDateDisplay(transaction.date)}</td>
                <td>
                    <span class="type-badge ${transaction.type}">
                        ${transaction.type === 'income' ? '収入' : '支出'}
                    </span>
                </td>
                <td>
                    <span class="category-tag">${transaction.category}</span>
                </td>
                <td class="amount-cell ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </td>
                <td class="memo-cell" title="${transaction.memo}">
                    ${this.truncateText(transaction.memo, 30)}
                </td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" onclick="app.editTransaction('${transaction.id}')" title="編集">
                        ✏️
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteTransaction('${transaction.id}')" title="削除">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update pagination info
        this.updatePaginationInfo(filteredTransactions.length, startIndex, endIndex);
    }
    
    getFilteredTransactions() {
        let filtered = [...this.data.transactions];
        
        // Apply filters
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                t.category.toLowerCase().includes(search) ||
                t.memo.toLowerCase().includes(search) ||
                t.amount.toString().includes(search)
            );
        }
        
        if (this.filters.type) {
            filtered = filtered.filter(t => t.type === this.filters.type);
        }
        
        if (this.filters.category) {
            filtered = filtered.filter(t => t.category === this.filters.category);
        }
        
        if (this.filters.period !== 'all') {
            filtered = this.getTransactionsForPeriod(this.filters.period, filtered);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aVal = a[this.filters.sortBy];
            let bVal = b[this.filters.sortBy];
            
            if (this.filters.sortBy === 'date') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (this.filters.sortBy === 'amount') {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return this.filters.sortOrder === 'desc' ? -result : result;
        });
        
        return filtered;
    }
    
    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }
    
    formatCurrency(amount) {
        const formatter = new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: this.data.settings.currency
        });
        return formatter.format(amount);
    }
    
    formatDateDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    formatMonth(date) {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short'
        });
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substr(0, maxLength) + '...' : text;
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    calculatePercentChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }
    
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }
    
    // Export/Import Functions
    exportTransactions() {
        const transactions = this.getFilteredTransactions();
        const csvContent = this.generateCSV(transactions);
        this.downloadFile(csvContent, `transactions_${this.getCurrentDate()}.csv`, 'text/csv');
        this.showNotification('取引データをエクスポートしました', 'success');
    }
    
    exportAllData() {
        const data = {
            transactions: this.data.transactions,
            categories: this.data.categories,
            budgets: this.data.budgets,
            goals: this.data.goals,
            settings: this.data.settings,
            exportDate: new Date().toISOString(),
            version: '4.0'
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `smart_finance_backup_${this.getCurrentDate()}.json`, 'application/json');
        this.showNotification('全データをエクスポートしました', 'success');
    }
    
    generateCSV(transactions) {
        const headers = ['日付', '種別', 'カテゴリ', '金額', 'メモ'];
        const rows = transactions.map(t => [
            t.date,
            t.type === 'income' ? '収入' : '支出',
            t.category,
            t.amount,
            t.memo || ''
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Notification System
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Trigger show animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Theme Management
    applyTheme() {
        const theme = this.data.settings.theme;
        const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        const actualTheme = theme === 'auto' ? systemTheme : theme;
        
        document.documentElement.setAttribute('data-theme', actualTheme);
        
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = theme;
    }
    
    // Service Worker Registration
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registered successfully:', registration);
        } catch (error) {
            console.log('ServiceWorker registration failed:', error);
        }
    }
    
    // Additional helper methods would go here...
    // This includes methods for analytics, budgets, goals, etc.
}

// Simple Chart Classes
class SimpleChart {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.data = [];
    }
    
    update(data) {
        this.data = data;
        this.draw();
    }
    
    draw() {
        const { ctx, canvas } = this;
        const { width, height } = canvas;
        
        ctx.clearRect(0, 0, width, height);
        
        if (this.data.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        const maxValue = Math.max(...this.data.map(d => Math.max(d.income, d.expense)));
        const scale = chartHeight / (maxValue * 1.1);
        
        this.drawGrid();
        this.drawLines();
        this.drawLabels();
        this.drawLegend();
    }
    
    drawEmptyState() {
        const { ctx, canvas } = this;
        ctx.fillStyle = '#666';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('データがありません', canvas.width / 2, canvas.height / 2);
    }
    
    drawGrid() {
        // Implementation for grid drawing
    }
    
    drawLines() {
        // Implementation for line drawing
    }
    
    drawLabels() {
        // Implementation for label drawing
    }
    
    drawLegend() {
        // Implementation for legend drawing
    }
}

class PieChart {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.data = [];
    }
    
    update(data) {
        this.data = data;
        this.draw();
    }
    
    draw() {
        // Implementation for pie chart drawing
    }
}

class BarChart {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.data = [];
    }
    
    update(data) {
        this.data = data;
        this.draw();
    }
    
    draw() {
        // Implementation for bar chart drawing
    }
}

// Initialize application
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new FinanceManager();
});

// Export for external access
window.FinanceApp = FinanceManager;

console.log('🚀 Smart Finance Manager v4.0 JavaScript loaded successfully!');