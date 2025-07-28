// Shelf Life Tracker - 消費期限管理アプリ
class ShelfLifeTracker {
    constructor() {
        // DOM要素
        this.itemsGrid = document.getElementById('items-grid');
        this.emptyState = document.getElementById('empty-state');
        this.noResults = document.getElementById('no-results');
        this.searchInput = document.getElementById('search-input');
        this.clearSearch = document.getElementById('clear-search');
        this.categoryFilter = document.getElementById('category-filter');
        this.sortOrder = document.getElementById('sort-order');
        this.addItemBtn = document.getElementById('add-item-btn');
        this.toastContainer = document.getElementById('toast-container');
        this.fileInput = document.getElementById('file-input');
        
        // 統計表示要素
        this.totalItemsEl = document.getElementById('total-items');
        this.urgentItemsEl = document.getElementById('urgent-items');
        this.expiredItemsEl = document.getElementById('expired-items');
        this.freshCountEl = document.getElementById('fresh-count');
        this.warningCountEl = document.getElementById('warning-count');
        this.criticalCountEl = document.getElementById('critical-count');
        
        // アプリの状態
        this.items = [];
        this.itemIdCounter = 0;
        this.currentSearchTerm = '';
        this.currentCategory = '';
        this.currentSort = 'expiry-asc';
        this.filteredItems = [];
        
        // 設定
        this.settings = {
            expiryWarnings: true,
            warningDays: 3,
            darkMode: false,
            hideExpired: false
        };
        
        // カテゴリー別の色設定
        this.categoryColors = {
            '食品': '#10b981',
            '冷凍食品': '#3b82f6',
            '調味料': '#f59e0b',
            '化粧品': '#ec4899',
            '医薬品': '#ef4444',
            '日用品': '#8b5cf6',
            'その他': '#64748b'
        };
        
        // 初期化
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.applySettings();
        this.updateDisplay();
        this.updateStatistics();
        this.setupKeyboardShortcuts();
        this.checkExpiryWarnings();
        
        // 定期的に期限をチェック（1時間ごと）
        setInterval(() => {
            this.checkExpiryWarnings();
            this.updateDisplay();
            this.updateStatistics();
        }, 3600000);
    }
    
    setupEventListeners() {
        // アイテム追加
        this.addItemBtn.addEventListener('click', () => this.showAddItemModal());
        
        // 検索
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearch.addEventListener('click', () => this.clearSearchFunction());
        
        // フィルタリング
        this.categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        this.sortOrder.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        
        // モーダル関連
        this.setupModalEventListeners();
        
        // 設定関連
        this.setupSettingsEventListeners();
        
        // データ管理
        this.setupDataManagementListeners();
        
        // 外部クリックでモーダルを閉じる
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // ページ離脱前の確認
        window.addEventListener('beforeunload', () => this.saveData());
    }
    
    setupModalEventListeners() {
        // アイテム追加モーダル
        document.getElementById('close-add-modal').addEventListener('click', () => this.closeModal('add-item-modal'));
        document.getElementById('cancel-add').addEventListener('click', () => this.closeModal('add-item-modal'));
        document.getElementById('item-form').addEventListener('submit', (e) => this.handleAddItem(e));
        
        // 数量調整ボタン
        document.getElementById('quantity-minus').addEventListener('click', () => this.adjustQuantity(-1));
        document.getElementById('quantity-plus').addEventListener('click', () => this.adjustQuantity(1));
        
        // アイテム詳細モーダル
        document.getElementById('close-detail-modal').addEventListener('click', () => this.closeModal('item-detail-modal'));
        
        // 統計モーダル
        document.getElementById('stats-btn').addEventListener('click', () => this.showStatsModal());
        document.getElementById('close-stats-modal').addEventListener('click', () => this.closeModal('stats-modal'));
        
        // 設定モーダル
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('close-settings-modal').addEventListener('click', () => this.closeModal('settings-modal'));
        
        // 確認ダイアログ
        document.getElementById('confirm-cancel').addEventListener('click', () => this.closeModal('confirm-modal'));
    }
    
    setupSettingsEventListeners() {
        document.getElementById('expiry-warnings').addEventListener('change', (e) => {
            this.settings.expiryWarnings = e.target.checked;
            this.saveData();
        });
        
        document.getElementById('warning-days').addEventListener('change', (e) => {
            this.settings.warningDays = parseInt(e.target.value);
            this.saveData();
            this.updateDisplay();
        });
        
        document.getElementById('dark-mode').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            this.toggleDarkMode(e.target.checked);
            this.saveData();
        });
        
        document.getElementById('hide-expired').addEventListener('change', (e) => {
            this.settings.hideExpired = e.target.checked;
            this.saveData();
            this.updateDisplay();
        });
    }
    
    setupDataManagementListeners() {
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('import-data').addEventListener('click', () => this.fileInput.click());
        document.getElementById('clear-expired').addEventListener('click', () => this.clearExpiredItems());
        document.getElementById('reset-data').addEventListener('click', () => this.resetAllData());
        
        this.fileInput.addEventListener('change', (e) => this.importData(e));
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: 新しいアイテム追加
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showAddItemModal();
            }
            
            // Ctrl/Cmd + F: 検索にフォーカス
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            }
            
            // Ctrl/Cmd + S: 手動保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveData();
                this.showToast('データを保存しました', 'success');
            }
            
            // Escape: モーダルを閉じる
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    this.closeModal(activeModal.id);
                }
            }
        });
    }
    
    // ===== データ管理 =====
    saveData() {
        const data = {
            items: this.items,
            settings: this.settings,
            itemIdCounter: this.itemIdCounter,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('shelf_life_tracker_data', JSON.stringify(data));
    }
    
    loadData() {
        try {
            const savedData = localStorage.getItem('shelf_life_tracker_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.items = data.items || [];
                this.settings = { ...this.settings, ...(data.settings || {}) };
                this.itemIdCounter = data.itemIdCounter || 0;
                
                // IDカウンターを修正（データの整合性確保）
                if (this.items.length > 0) {
                    this.itemIdCounter = Math.max(...this.items.map(item => item.id), this.itemIdCounter) + 1;
                }
            }
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            this.showToast('データの読み込みに失敗しました', 'error');
        }
    }
    
    // ===== アイテム管理 =====
    addItem(itemData) {
        const item = {\n            id: this.itemIdCounter++,\n            name: itemData.name,\n            category: itemData.category,\n            purchaseDate: itemData.purchaseDate || new Date().toISOString().split('T')[0],\n            expiryDate: itemData.expiryDate,\n            notes: itemData.notes || '',\n            quantity: parseInt(itemData.quantity) || 1,\n            created: new Date().toISOString(),\n            updated: new Date().toISOString()\n        };\n        \n        this.items.push(item);\n        this.saveData();\n        this.updateDisplay();\n        this.updateStatistics();\n        this.showToast(`「${item.name}」を追加しました`, 'success');\n    }\n    \n    updateItem(id, itemData) {\n        const index = this.items.findIndex(item => item.id === id);\n        if (index !== -1) {\n            this.items[index] = {\n                ...this.items[index],\n                ...itemData,\n                updated: new Date().toISOString()\n            };\n            this.saveData();\n            this.updateDisplay();\n            this.updateStatistics();\n            this.showToast('アイテムを更新しました', 'success');\n        }\n    }\n    \n    deleteItem(id) {\n        const item = this.items.find(item => item.id === id);\n        if (item) {\n            this.showConfirmDialog(\n                'アイテムの削除',\n                `「${item.name}」を削除しますか？この操作は元に戻せません。`,\n                () => {\n                    this.items = this.items.filter(item => item.id !== id);\n                    this.saveData();\n                    this.updateDisplay();\n                    this.updateStatistics();\n                    this.showToast('アイテムを削除しました', 'info');\n                }\n            );\n        }\n    }\n    \n    markAsUsed(id) {\n        const item = this.items.find(item => item.id === id);\n        if (item) {\n            if (item.quantity > 1) {\n                item.quantity -= 1;\n                item.updated = new Date().toISOString();\n                this.saveData();\n                this.updateDisplay();\n                this.updateStatistics();\n                this.showToast(`「${item.name}」の数量を1つ減らしました`, 'success');\n            } else {\n                this.showConfirmDialog(\n                    '使用済みにする',\n                    `「${item.name}」を使用済みにして削除しますか？`,\n                    () => {\n                        this.items = this.items.filter(item => item.id !== id);\n                        this.saveData();\n                        this.updateDisplay();\n                        this.updateStatistics();\n                        this.showToast('アイテムを使用済みにしました', 'success');\n                    }\n                );\n            }\n        }\n    }\n    \n    // ===== 表示更新 =====\n    updateDisplay() {\n        this.filterAndSortItems();\n        this.renderItems();\n        this.updateEmptyState();\n    }\n    \n    filterAndSortItems() {\n        let filtered = [...this.items];\n        \n        // 検索フィルタ\n        if (this.currentSearchTerm) {\n            filtered = filtered.filter(item => \n                item.name.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||\n                item.category.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||\n                (item.notes && item.notes.toLowerCase().includes(this.currentSearchTerm.toLowerCase()))\n            );\n        }\n        \n        // カテゴリフィルタ\n        if (this.currentCategory) {\n            filtered = filtered.filter(item => item.category === this.currentCategory);\n        }\n        \n        // 期限切れアイテムを非表示にする設定\n        if (this.settings.hideExpired) {\n            filtered = filtered.filter(item => !this.isExpired(item));\n        }\n        \n        // ソート\n        filtered.sort((a, b) => {\n            switch (this.currentSort) {\n                case 'expiry-asc':\n                    return new Date(a.expiryDate) - new Date(b.expiryDate);\n                case 'expiry-desc':\n                    return new Date(b.expiryDate) - new Date(a.expiryDate);\n                case 'name-asc':\n                    return a.name.localeCompare(b.name, 'ja');\n                case 'date-desc':\n                    return new Date(b.created) - new Date(a.created);\n                default:\n                    return 0;\n            }\n        });\n        \n        this.filteredItems = filtered;\n    }\n    \n    renderItems() {\n        this.itemsGrid.innerHTML = '';\n        \n        this.filteredItems.forEach(item => {\n            const itemCard = this.createItemCard(item);\n            this.itemsGrid.appendChild(itemCard);\n        });\n    }\n    \n    createItemCard(item) {\n        const template = document.getElementById('item-card-template');\n        const cardElement = template.content.cloneNode(true);\n        const card = cardElement.querySelector('.item-card');\n        \n        // アイテムデータを設定\n        card.dataset.itemId = item.id;\n        \n        // ステータスクラスを追加\n        const status = this.getItemStatus(item);\n        card.classList.add(`status-${status}`);\n        \n        // カテゴリバッジ\n        const categoryBadge = card.querySelector('.item-category-badge');\n        categoryBadge.textContent = item.category;\n        categoryBadge.style.backgroundColor = this.categoryColors[item.category] || this.categoryColors['その他'];\n        categoryBadge.style.color = 'white';\n        \n        // アイテム名\n        card.querySelector('.item-name').textContent = item.name;\n        \n        // 期限情報\n        const expiryDate = card.querySelector('.expiry-date');\n        expiryDate.textContent = this.formatDate(item.expiryDate);\n        \n        // 残り日数\n        const daysRemaining = card.querySelector('.days-count');\n        const daysContainer = card.querySelector('.days-remaining');\n        const days = this.getDaysUntilExpiry(item);\n        \n        if (days < 0) {\n            daysRemaining.textContent = `${Math.abs(days)}日前に期限切れ`;\n            daysContainer.classList.add('expired');\n        } else if (days === 0) {\n            daysRemaining.textContent = '今日が期限';\n            daysContainer.classList.add('critical');\n        } else if (days <= this.settings.warningDays) {\n            daysRemaining.textContent = `あと${days}日`;\n            daysContainer.classList.add('critical');\n        } else if (days <= this.settings.warningDays * 2) {\n            daysRemaining.textContent = `あと${days}日`;\n            daysContainer.classList.add('warning');\n        } else {\n            daysRemaining.textContent = `あと${days}日`;\n            daysContainer.classList.add('fresh');\n        }\n        \n        // 数量\n        card.querySelector('.quantity-text').textContent = `${item.quantity}個`;\n        \n        // 購入日\n        card.querySelector('.purchase-date').textContent = this.formatDate(item.purchaseDate);\n        \n        // イベントリスナー\n        card.addEventListener('click', (e) => {\n            if (!e.target.closest('.item-actions') && !e.target.closest('.use-btn')) {\n                this.showItemDetail(item.id);\n            }\n        });\n        \n        // アクションボタン\n        card.querySelector('.edit-btn').addEventListener('click', (e) => {\n            e.stopPropagation();\n            this.editItem(item.id);\n        });\n        \n        card.querySelector('.delete-btn').addEventListener('click', (e) => {\n            e.stopPropagation();\n            this.deleteItem(item.id);\n        });\n        \n        card.querySelector('.use-btn').addEventListener('click', (e) => {\n            e.stopPropagation();\n            this.markAsUsed(item.id);\n        });\n        \n        return card;\n    }\n    \n    updateEmptyState() {\n        if (this.items.length === 0) {\n            this.emptyState.style.display = 'flex';\n            this.noResults.style.display = 'none';\n            this.itemsGrid.style.display = 'none';\n        } else if (this.filteredItems.length === 0) {\n            this.emptyState.style.display = 'none';\n            this.noResults.style.display = 'flex';\n            this.itemsGrid.style.display = 'none';\n        } else {\n            this.emptyState.style.display = 'none';\n            this.noResults.style.display = 'none';\n            this.itemsGrid.style.display = 'grid';\n        }\n    }\n    \n    updateStatistics() {\n        const total = this.items.length;\n        const urgent = this.items.filter(item => {\n            const days = this.getDaysUntilExpiry(item);\n            return days >= 0 && days <= this.settings.warningDays;\n        }).length;\n        const expired = this.items.filter(item => this.isExpired(item)).length;\n        \n        const fresh = this.items.filter(item => {\n            const days = this.getDaysUntilExpiry(item);\n            return days > this.settings.warningDays * 2;\n        }).length;\n        \n        const warning = this.items.filter(item => {\n            const days = this.getDaysUntilExpiry(item);\n            return days > this.settings.warningDays && days <= this.settings.warningDays * 2;\n        }).length;\n        \n        const critical = urgent;\n        \n        // ヘッダー統計を更新\n        if (this.totalItemsEl) this.totalItemsEl.textContent = total;\n        if (this.urgentItemsEl) this.urgentItemsEl.textContent = urgent;\n        if (this.expiredItemsEl) this.expiredItemsEl.textContent = expired;\n        \n        // クイック統計を更新\n        if (this.freshCountEl) this.freshCountEl.textContent = fresh;\n        if (this.warningCountEl) this.warningCountEl.textContent = warning;\n        if (this.criticalCountEl) this.criticalCountEl.textContent = critical;\n    }\n    \n    // ===== ユーティリティ関数 =====\n    getDaysUntilExpiry(item) {\n        const today = new Date();\n        const expiryDate = new Date(item.expiryDate);\n        const diffTime = expiryDate - today;\n        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));\n    }\n    \n    isExpired(item) {\n        return this.getDaysUntilExpiry(item) < 0;\n    }\n    \n    getItemStatus(item) {\n        const days = this.getDaysUntilExpiry(item);\n        if (days < 0) return 'expired';\n        if (days <= this.settings.warningDays) return 'critical';\n        if (days <= this.settings.warningDays * 2) return 'warning';\n        return 'fresh';\n    }\n    \n    formatDate(dateString) {\n        const date = new Date(dateString);\n        return date.toLocaleDateString('ja-JP', {\n            year: 'numeric',\n            month: 'short',\n            day: 'numeric'\n        });\n    }\n    \n    // ===== イベントハンドラー =====\n    handleSearch(searchTerm) {\n        this.currentSearchTerm = searchTerm;\n        \n        if (searchTerm) {\n            this.clearSearch.style.display = 'block';\n        } else {\n            this.clearSearch.style.display = 'none';\n        }\n        \n        this.updateDisplay();\n    }\n    \n    clearSearchFunction() {\n        this.searchInput.value = '';\n        this.currentSearchTerm = '';\n        this.clearSearch.style.display = 'none';\n        this.updateDisplay();\n    }\n    \n    handleCategoryFilter(category) {\n        this.currentCategory = category;\n        this.updateDisplay();\n    }\n    \n    handleSortChange(sortOrder) {\n        this.currentSort = sortOrder;\n        this.updateDisplay();\n    }\n    \n    handleAddItem(e) {\n        e.preventDefault();\n        \n        const formData = new FormData(e.target);\n        const itemData = {\n            name: formData.get('name').trim(),\n            category: formData.get('category'),\n            purchaseDate: formData.get('purchaseDate'),\n            expiryDate: formData.get('expiryDate'),\n            notes: formData.get('notes').trim(),\n            quantity: formData.get('quantity')\n        };\n        \n        // バリデーション\n        if (!itemData.name) {\n            this.showToast('アイテム名を入力してください', 'error');\n            return;\n        }\n        \n        if (!itemData.expiryDate) {\n            this.showToast('消費期限を入力してください', 'error');\n            return;\n        }\n        \n        // 購入日が未入力の場合は今日の日付を設定\n        if (!itemData.purchaseDate) {\n            itemData.purchaseDate = new Date().toISOString().split('T')[0];\n        }\n        \n        this.addItem(itemData);\n        this.closeModal('add-item-modal');\n        e.target.reset();\n        document.getElementById('item-quantity').value = 1;\n    }\n    \n    adjustQuantity(delta) {\n        const quantityInput = document.getElementById('item-quantity');\n        const currentValue = parseInt(quantityInput.value) || 1;\n        const newValue = Math.max(1, Math.min(999, currentValue + delta));\n        quantityInput.value = newValue;\n    }\n    \n    handleOutsideClick(e) {\n        const modals = document.querySelectorAll('.modal-overlay.active');\n        modals.forEach(modal => {\n            if (e.target === modal) {\n                this.closeModal(modal.id);\n            }\n        });\n    }\n    \n    // ===== モーダル管理 =====\n    showModal(modalId) {\n        const modal = document.getElementById(modalId);\n        if (modal) {\n            modal.classList.add('active');\n            document.body.style.overflow = 'hidden';\n        }\n    }\n    \n    closeModal(modalId) {\n        const modal = document.getElementById(modalId);\n        if (modal) {\n            modal.classList.remove('active');\n            document.body.style.overflow = '';\n        }\n    }\n    \n    showAddItemModal() {\n        // 今日の日付をデフォルトで設定\n        const today = new Date().toISOString().split('T')[0];\n        document.getElementById('purchase-date').value = today;\n        \n        // 期限日を1週間後に設定（デフォルト）\n        const weekLater = new Date();\n        weekLater.setDate(weekLater.getDate() + 7);\n        document.getElementById('expiry-date').value = weekLater.toISOString().split('T')[0];\n        \n        this.showModal('add-item-modal');\n        \n        // アイテム名にフォーカス\n        setTimeout(() => {\n            document.getElementById('item-name').focus();\n        }, 300);\n    }\n    \n    showItemDetail(id) {\n        const item = this.items.find(item => item.id === id);\n        if (!item) return;\n        \n        const modal = document.getElementById('item-detail-modal');\n        const title = document.getElementById('detail-title');\n        const content = document.getElementById('detail-content');\n        \n        title.innerHTML = `<i class=\"fas fa-info-circle\"></i> ${item.name}`;\n        \n        const status = this.getItemStatus(item);\n        const statusText = {\n            fresh: '新鮮',\n            warning: '注意',\n            critical: '緊急',\n            expired: '期限切れ'\n        }[status];\n        \n        const statusColor = {\n            fresh: 'var(--status-fresh)',\n            warning: 'var(--status-warning)',\n            critical: 'var(--status-critical)',\n            expired: 'var(--status-expired)'\n        }[status];\n        \n        const days = this.getDaysUntilExpiry(item);\n        let daysText;\n        if (days < 0) {\n            daysText = `${Math.abs(days)}日前に期限切れ`;\n        } else if (days === 0) {\n            daysText = '今日が期限';\n        } else {\n            daysText = `あと${days}日`;\n        }\n        \n        content.innerHTML = `\n            <div class=\"detail-grid\" style=\"display: grid; gap: 1rem; margin-bottom: 1.5rem;\">\n                <div class=\"detail-item\">\n                    <strong style=\"color: var(--text-secondary); font-size: 0.875rem;\">カテゴリ</strong>\n                    <div style=\"margin-top: 0.25rem;\">\n                        <span style=\"background: ${this.categoryColors[item.category] || this.categoryColors['その他']}; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;\">\n                            ${item.category}\n                        </span>\n                    </div>\n                </div>\n                \n                <div class=\"detail-item\">\n                    <strong style=\"color: var(--text-secondary); font-size: 0.875rem;\">ステータス</strong>\n                    <div style=\"margin-top: 0.25rem; color: ${statusColor}; font-weight: 600;\">\n                        ${statusText} (${daysText})\n                    </div>\n                </div>\n                \n                <div class=\"detail-item\">\n                    <strong style=\"color: var(--text-secondary); font-size: 0.875rem;\">数量</strong>\n                    <div style=\"margin-top: 0.25rem;\">${item.quantity}個</div>\n                </div>\n                \n                <div class=\"detail-item\">\n                    <strong style=\"color: var(--text-secondary); font-size: 0.875rem;\">購入日</strong>\n                    <div style=\"margin-top: 0.25rem;\">${this.formatDate(item.purchaseDate)}</div>\n                </div>\n                \n                <div class=\"detail-item\">\n                    <strong style=\"color: var(--text-secondary); font-size: 0.875rem;\">消費期限</strong>\n                    <div style=\"margin-top: 0.25rem;\">${this.formatDate(item.expiryDate)}</div>\n                </div>\n                \n                ${item.notes ? `\n                <div class=\"detail-item\" style=\"grid-column: 1 / -1;\">\n                    <strong style=\"color: var(--text-secondary); font-size: 0.875rem;\">メモ</strong>\n                    <div style=\"margin-top: 0.25rem; background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap;\">${item.notes}</div>\n                </div>\n                ` : ''}\n            </div>\n        `;\n        \n        // ボタンイベント\n        document.getElementById('edit-item-btn').onclick = () => {\n            this.closeModal('item-detail-modal');\n            this.editItem(id);\n        };\n        \n        document.getElementById('mark-used-btn').onclick = () => {\n            this.closeModal('item-detail-modal');\n            this.markAsUsed(id);\n        };\n        \n        document.getElementById('delete-item-btn').onclick = () => {\n            this.closeModal('item-detail-modal');\n            this.deleteItem(id);\n        };\n        \n        this.showModal('item-detail-modal');\n    }\n    \n    editItem(id) {\n        const item = this.items.find(item => item.id === id);\n        if (!item) return;\n        \n        // フォームに現在の値を設定\n        document.getElementById('item-name').value = item.name;\n        document.getElementById('item-category').value = item.category;\n        document.getElementById('purchase-date').value = item.purchaseDate;\n        document.getElementById('expiry-date').value = item.expiryDate;\n        document.getElementById('item-notes').value = item.notes || '';\n        document.getElementById('item-quantity').value = item.quantity;\n        \n        // フォームのsubmitイベントを変更\n        const form = document.getElementById('item-form');\n        const newForm = form.cloneNode(true);\n        form.parentNode.replaceChild(newForm, form);\n        \n        newForm.addEventListener('submit', (e) => {\n            e.preventDefault();\n            \n            const formData = new FormData(e.target);\n            const itemData = {\n                name: formData.get('name').trim(),\n                category: formData.get('category'),\n                purchaseDate: formData.get('purchaseDate'),\n                expiryDate: formData.get('expiryDate'),\n                notes: formData.get('notes').trim(),\n                quantity: parseInt(formData.get('quantity'))\n            };\n            \n            // バリデーション\n            if (!itemData.name) {\n                this.showToast('アイテム名を入力してください', 'error');\n                return;\n            }\n            \n            if (!itemData.expiryDate) {\n                this.showToast('消費期限を入力してください', 'error');\n                return;\n            }\n            \n            this.updateItem(id, itemData);\n            this.closeModal('add-item-modal');\n        });\n        \n        // 数量調整ボタンを再設定\n        document.getElementById('quantity-minus').onclick = () => this.adjustQuantity(-1);\n        document.getElementById('quantity-plus').onclick = () => this.adjustQuantity(1);\n        \n        this.showModal('add-item-modal');\n        \n        // タイトルを変更\n        document.querySelector('#add-item-modal .modal-header h2').innerHTML = '<i class=\"fas fa-edit\"></i> アイテムを編集';\n        document.querySelector('#add-item-modal .btn-primary').innerHTML = '<i class=\"fas fa-save\"></i> 更新';\n    }\n    \n    showStatsModal() {\n        const modal = document.getElementById('stats-modal');\n        const content = modal.querySelector('.stats-content');\n        \n        // 今月の統計を計算\n        const now = new Date();\n        const thisMonth = now.getMonth();\n        const thisYear = now.getFullYear();\n        \n        const monthlyAdded = this.items.filter(item => {\n            const created = new Date(item.created);\n            return created.getMonth() === thisMonth && created.getFullYear() === thisYear;\n        }).length;\n        \n        const monthlyUsed = 0; // 使用済みアイテムの記録は現在未実装\n        const monthlyExpired = this.items.filter(item => {\n            const expiry = new Date(item.expiryDate);\n            return expiry.getMonth() === thisMonth && expiry.getFullYear() === thisYear && this.isExpired(item);\n        }).length;\n        \n        // カテゴリ別内訳\n        const categoryStats = {};\n        this.items.forEach(item => {\n            categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;\n        });\n        \n        document.getElementById('monthly-added').textContent = monthlyAdded;\n        document.getElementById('monthly-used').textContent = monthlyUsed;\n        document.getElementById('monthly-expired').textContent = monthlyExpired;\n        \n        // カテゴリチャート\n        const chart = document.getElementById('category-chart');\n        chart.innerHTML = '';\n        \n        Object.entries(categoryStats).forEach(([category, count]) => {\n            const item = document.createElement('div');\n            item.className = 'category-item';\n            item.innerHTML = `\n                <div style=\"display: flex; align-items: center; gap: 0.75rem;\">\n                    <div style=\"width: 12px; height: 12px; border-radius: 50%; background: ${this.categoryColors[category] || this.categoryColors['その他']}\"></div>\n                    <span>${category}</span>\n                </div>\n                <span style=\"font-weight: 600;\">${count}個</span>\n            `;\n            chart.appendChild(item);\n        });\n        \n        this.showModal('stats-modal');\n    }\n    \n    showSettingsModal() {\n        // 現在の設定値を反映\n        document.getElementById('expiry-warnings').checked = this.settings.expiryWarnings;\n        document.getElementById('warning-days').value = this.settings.warningDays;\n        document.getElementById('dark-mode').checked = this.settings.darkMode;\n        document.getElementById('hide-expired').checked = this.settings.hideExpired;\n        \n        this.showModal('settings-modal');\n    }\n    \n    showConfirmDialog(title, message, onConfirm) {\n        const modal = document.getElementById('confirm-modal');\n        const titleEl = document.getElementById('confirm-title');\n        const messageEl = document.getElementById('confirm-message');\n        const okBtn = document.getElementById('confirm-ok');\n        \n        titleEl.textContent = title;\n        messageEl.textContent = message;\n        \n        // 既存のイベントリスナーを削除\n        const newOkBtn = okBtn.cloneNode(true);\n        okBtn.parentNode.replaceChild(newOkBtn, okBtn);\n        \n        newOkBtn.addEventListener('click', () => {\n            this.closeModal('confirm-modal');\n            onConfirm();\n        });\n        \n        this.showModal('confirm-modal');\n    }\n    \n    // ===== 設定 =====\n    applySettings() {\n        this.toggleDarkMode(this.settings.darkMode);\n    }\n    \n    toggleDarkMode(enabled) {\n        if (enabled) {\n            document.body.classList.add('dark-mode');\n        } else {\n            document.body.classList.remove('dark-mode');\n        }\n    }\n    \n    // ===== 期限警告 =====\n    checkExpiryWarnings() {\n        if (!this.settings.expiryWarnings) return;\n        \n        const urgentItems = this.items.filter(item => {\n            const days = this.getDaysUntilExpiry(item);\n            return days >= 0 && days <= this.settings.warningDays;\n        });\n        \n        const expiredItems = this.items.filter(item => this.isExpired(item));\n        \n        if (expiredItems.length > 0) {\n            this.showToast(`${expiredItems.length}個のアイテムが期限切れです`, 'error');\n        } else if (urgentItems.length > 0) {\n            this.showToast(`${urgentItems.length}個のアイテムが期限間近です`, 'warning');\n        }\n    }\n    \n    // ===== データインポート/エクスポート =====\n    exportData() {\n        const data = {\n            items: this.items,\n            settings: this.settings,\n            exported: new Date().toISOString(),\n            version: '1.0.0'\n        };\n        \n        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });\n        const url = URL.createObjectURL(blob);\n        \n        const a = document.createElement('a');\n        a.href = url;\n        a.download = `shelf-life-tracker-${new Date().toISOString().split('T')[0]}.json`;\n        a.click();\n        \n        URL.revokeObjectURL(url);\n        this.showToast('データをエクスポートしました', 'success');\n    }\n    \n    importData(e) {\n        const file = e.target.files[0];\n        if (!file) return;\n        \n        const reader = new FileReader();\n        reader.onload = (event) => {\n            try {\n                const data = JSON.parse(event.target.result);\n                \n                if (data.items && Array.isArray(data.items)) {\n                    this.showConfirmDialog(\n                        'データのインポート',\n                        '現在のデータを上書きしますか？この操作は元に戻せません。',\n                        () => {\n                            this.items = data.items;\n                            if (data.settings) {\n                                this.settings = { ...this.settings, ...data.settings };\n                            }\n                            this.itemIdCounter = Math.max(...this.items.map(item => item.id), 0) + 1;\n                            this.saveData();\n                            this.applySettings();\n                            this.updateDisplay();\n                            this.updateStatistics();\n                            this.showToast('データをインポートしました', 'success');\n                        }\n                    );\n                } else {\n                    this.showToast('無効なファイル形式です', 'error');\n                }\n            } catch (error) {\n                console.error('Import error:', error);\n                this.showToast('ファイルの読み込みに失敗しました', 'error');\n            }\n        };\n        reader.readAsText(file);\n        \n        // ファイル入力をリセット\n        e.target.value = '';\n    }\n    \n    clearExpiredItems() {\n        const expiredItems = this.items.filter(item => this.isExpired(item));\n        \n        if (expiredItems.length === 0) {\n            this.showToast('期限切れのアイテムはありません', 'info');\n            return;\n        }\n        \n        this.showConfirmDialog(\n            '期限切れアイテムの削除',\n            `${expiredItems.length}個の期限切れアイテムを削除しますか？この操作は元に戻せません。`,\n            () => {\n                this.items = this.items.filter(item => !this.isExpired(item));\n                this.saveData();\n                this.updateDisplay();\n                this.updateStatistics();\n                this.showToast(`${expiredItems.length}個の期限切れアイテムを削除しました`, 'info');\n            }\n        );\n    }\n    \n    resetAllData() {\n        this.showConfirmDialog(\n            'すべてのデータを削除',\n            'すべてのアイテムと設定を削除しますか？この操作は元に戻せません。',\n            () => {\n                this.items = [];\n                this.settings = {\n                    expiryWarnings: true,\n                    warningDays: 3,\n                    darkMode: false,\n                    hideExpired: false\n                };\n                this.itemIdCounter = 0;\n                localStorage.removeItem('shelf_life_tracker_data');\n                this.applySettings();\n                this.updateDisplay();\n                this.updateStatistics();\n                this.showToast('すべてのデータを削除しました', 'info');\n            }\n        );\n    }\n    \n    // ===== トースト通知 =====\n    showToast(message, type = 'info') {\n        const toast = document.createElement('div');\n        toast.className = `toast ${type}`;\n        \n        const icons = {\n            success: 'fa-check-circle',\n            error: 'fa-exclamation-circle',\n            warning: 'fa-exclamation-triangle',\n            info: 'fa-info-circle'\n        };\n        \n        toast.innerHTML = `\n            <i class=\"fas ${icons[type] || icons.info} toast-icon\"></i>\n            <span class=\"toast-message\">${message}</span>\n        `;\n        \n        this.toastContainer.appendChild(toast);\n        \n        // アニメーション\n        setTimeout(() => toast.classList.add('show'), 100);\n        \n        // 自動削除\n        setTimeout(() => {\n            toast.classList.remove('show');\n            setTimeout(() => {\n                if (toast.parentNode) {\n                    toast.remove();\n                }\n            }, 300);\n        }, 4000);\n    }\n}\n\n// アプリケーションの初期化\nlet shelfLifeTracker;\ndocument.addEventListener('DOMContentLoaded', () => {\n    shelfLifeTracker = new ShelfLifeTracker();\n    \n    // グローバルアクセス用\n    window.shelfLifeTracker = shelfLifeTracker;\n    \n    // PWA対応（Service Workerがある場合）\n    if ('serviceWorker' in navigator) {\n        navigator.serviceWorker.register('/sw.js').catch(() => {\n            // Service Worker の登録に失敗した場合は無視\n        });\n    }\n});