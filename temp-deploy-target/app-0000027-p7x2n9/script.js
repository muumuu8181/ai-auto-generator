// Stock-Pal - Modern Inventory Management App
class StockPalApp {
    constructor() {
        // アプリの状態
        this.items = [];
        this.currentTab = 'inventory';
        this.editingItemId = null;
        
        // 設定
        this.settings = {
            darkMode: false,
            expiryNotifications: true,
            alertDays: 3
        };
        
        // ストレージキー
        this.STORAGE_KEYS = {
            items: 'stockpal_items',
            settings: 'stockpal_settings'
        };
        
        // DOM要素の取得
        this.initializeElements();
        
        // アプリの初期化
        this.init();
    }
    
    initializeElements() {
        // タブ関連
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 在庫管理関連
        this.addItemBtn = document.getElementById('add-item-btn');
        this.inventoryList = document.getElementById('inventory-list');
        this.searchInput = document.getElementById('search-input');
        this.categoryFilter = document.getElementById('category-filter');
        this.emptyInventory = document.getElementById('empty-inventory');
        
        // 買い物リスト関連
        this.shoppingListContainer = document.getElementById('shopping-list-container');
        this.clearCompletedBtn = document.getElementById('clear-completed-btn');
        this.shoppingBadge = document.getElementById('shopping-badge');
        this.emptyShopping = document.getElementById('empty-shopping');
        
        // 設定関連
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.expiryNotificationsToggle = document.getElementById('expiry-notifications');
        this.alertDaysSelect = document.getElementById('alert-days');
        this.exportDataBtn = document.getElementById('export-data-btn');
        this.importDataBtn = document.getElementById('import-data-btn');
        this.clearAllDataBtn = document.getElementById('clear-all-data-btn');
        this.fileInput = document.getElementById('file-input');
        
        // モーダル関連
        this.modal = document.getElementById('item-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.itemForm = document.getElementById('item-form');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelBtn = document.getElementById('cancel-btn');
        
        // フォーム要素
        this.itemNameInput = document.getElementById('item-name');
        this.itemCategoryInput = document.getElementById('item-category');
        this.itemQuantityInput = document.getElementById('item-quantity');
        this.itemExpiryInput = document.getElementById('item-expiry');
        this.itemMemoInput = document.getElementById('item-memo');
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.applySettings();
        this.renderCurrentTab();
        this.checkExpiryItems();
    }
    
    setupEventListeners() {
        // タブ切り替え
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // アイテム追加
        this.addItemBtn.addEventListener('click', () => this.openModal());
        
        // 検索・フィルター
        this.searchInput.addEventListener('input', () => this.renderInventory());
        this.categoryFilter.addEventListener('change', () => this.renderInventory());
        
        // 買い物リスト
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedItems());
        
        // 設定
        this.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
        this.expiryNotificationsToggle.addEventListener('change', () => this.updateSettings());
        this.alertDaysSelect.addEventListener('change', () => this.updateSettings());
        
        // データ管理
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.importDataBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.importData(e));
        this.clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        
        // モーダル
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        this.itemForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    // データの読み込み・保存
    loadData() {
        try {
            const itemsData = localStorage.getItem(this.STORAGE_KEYS.items);
            this.items = itemsData ? JSON.parse(itemsData) : [];
            
            const settingsData = localStorage.getItem(this.STORAGE_KEYS.settings);
            this.settings = settingsData ? { ...this.settings, ...JSON.parse(settingsData) } : this.settings;
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            this.items = [];
        }
    }
    
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.items, JSON.stringify(this.items));
            localStorage.setItem(this.STORAGE_KEYS.settings, JSON.stringify(this.settings));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            this.showNotification('データの保存に失敗しました', 'error');
        }
    }
    
    // タブ切り替え
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // タブボタンのアクティブ状態を更新
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // タブコンテンツの表示切り替え
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
        
        this.renderCurrentTab();
    }
    
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'inventory':
                this.renderInventory();
                break;
            case 'shopping-list':
                this.renderShoppingList();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }
    
    // 在庫一覧の描画
    renderInventory() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const categoryFilter = this.categoryFilter.value;
        
        let filteredItems = this.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
        
        if (filteredItems.length === 0) {
            this.inventoryList.style.display = 'none';
            this.emptyInventory.style.display = 'block';
            return;
        }
        
        this.inventoryList.style.display = 'block';
        this.emptyInventory.style.display = 'none';
        
        // カテゴリ別にグループ化
        const groupedItems = this.groupByCategory(filteredItems);
        
        this.inventoryList.innerHTML = '';
        
        Object.entries(groupedItems).forEach(([category, items]) => {
            const categorySection = this.createCategorySection(category, items);
            this.inventoryList.appendChild(categorySection);
        });
    }
    
    groupByCategory(items) {
        return items.reduce((groups, item) => {
            const category = item.category || 'その他';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
            return groups;
        }, {});
    }
    
    createCategorySection(category, items) {
        const section = document.createElement('div');
        section.className = 'category-section';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `<i class="fas fa-${this.getCategoryIcon(category)}"></i> ${category} (${items.length})`;
        
        const itemList = document.createElement('div');
        itemList.className = 'item-list';
        
        items.forEach(item => {
            const itemCard = this.createItemCard(item);
            itemList.appendChild(itemCard);
        });
        
        section.appendChild(header);
        section.appendChild(itemList);
        
        return section;
    }
    
    getCategoryIcon(category) {
        const icons = {
            '冷蔵庫': 'snowflake',
            '冷凍庫': 'ice-cream',
            'パントリー': 'bread-slice',
            '日用品': 'spray-can',
            'その他': 'box'
        };
        return icons[category] || 'box';
    }
    
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.itemId = item.id;
        
        const status = this.getItemStatus(item);
        const statusClass = this.getStatusClass(status);
        
        card.innerHTML = `
            <div class="item-info">
                <span class="item-name">${this.escapeHtml(item.name)}</span>
                <div class="item-details">
                    <span class="item-status ${statusClass}">${status}</span>
                    ${item.expiry ? `<span class="item-expiry">期限: ${this.formatDate(item.expiry)}</span>` : ''}
                    ${item.memo ? `<span class="item-memo">${this.escapeHtml(item.memo)}</span>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="stockPal.updateQuantity('${item.id}', -1)" aria-label="数量を減らす">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="stockPal.updateQuantity('${item.id}', 1)" aria-label="数量を増やす">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="action-btn edit-btn" onclick="stockPal.editItem('${item.id}')" aria-label="編集">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="stockPal.deleteItem('${item.id}')" aria-label="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }
    
    getItemStatus(item) {
        if (item.quantity === 0) return '在庫なし';
        if (item.quantity <= 2) return '少ない';
        if (this.isExpiringSoon(item)) return '期限間近';
        return '十分';
    }
    
    getStatusClass(status) {
        const classes = {
            '在庫なし': 'status-out',
            '少ない': 'status-low',
            '期限間近': 'status-expiring',
            '十分': 'status-good'
        };
        return classes[status] || 'status-good';
    }
    
    isExpiringSoon(item) {
        if (!item.expiry) return false;
        
        const today = new Date();
        const expiryDate = new Date(item.expiry);
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= this.settings.alertDays && diffDays >= 0;
    }
    
    // 買い物リストの描画
    renderShoppingList() {
        const shoppingItems = this.items.filter(item => item.quantity === 0);
        
        if (shoppingItems.length === 0) {
            this.shoppingListContainer.style.display = 'none';
            this.emptyShopping.style.display = 'block';
        } else {
            this.shoppingListContainer.style.display = 'block';
            this.emptyShopping.style.display = 'none';
            
            this.shoppingListContainer.innerHTML = shoppingItems.map(item => `
                <div class="shopping-item" data-item-id="${item.id}">
                    <input type="checkbox" class="shopping-checkbox" id="shopping-${item.id}">
                    <label for="shopping-${item.id}" class="item-name">${this.escapeHtml(item.name)}</label>
                    <button class="action-btn delete-btn" onclick="stockPal.removeFromShopping('${item.id}')" aria-label="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        
        this.updateShoppingBadge();
    }
    
    updateShoppingBadge() {
        const count = this.items.filter(item => item.quantity === 0).length;
        
        if (count > 0) {
            this.shoppingBadge.textContent = count;
            this.shoppingBadge.style.display = 'block';
        } else {
            this.shoppingBadge.style.display = 'none';
        }
    }
    
    // 設定の描画
    renderSettings() {
        this.darkModeToggle.checked = this.settings.darkMode;
        this.expiryNotificationsToggle.checked = this.settings.expiryNotifications;
        this.alertDaysSelect.value = this.settings.alertDays;
    }
    
    // アイテム操作
    openModal(itemId = null) {
        this.editingItemId = itemId;
        
        if (itemId) {
            const item = this.items.find(i => i.id === itemId);
            if (item) {
                this.modalTitle.textContent = 'アイテムを編集';
                this.itemNameInput.value = item.name;
                this.itemCategoryInput.value = item.category;
                this.itemQuantityInput.value = item.quantity;
                this.itemExpiryInput.value = item.expiry || '';
                this.itemMemoInput.value = item.memo || '';
            }
        } else {
            this.modalTitle.textContent = 'アイテムを追加';
            this.itemForm.reset();
            this.itemQuantityInput.value = 1;
        }
        
        this.modal.classList.add('active');
        setTimeout(() => this.itemNameInput.focus(), 100);
    }
    
    closeModal() {
        this.modal.classList.remove('active');
        this.editingItemId = null;
        this.itemForm.reset();
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.itemForm);
        const itemData = {
            name: formData.get('item-name').trim(),
            category: formData.get('item-category'),
            quantity: parseInt(formData.get('item-quantity')),
            expiry: formData.get('item-expiry') || null,
            memo: formData.get('item-memo').trim() || null
        };
        
        if (!itemData.name) {
            this.showNotification('アイテム名を入力してください', 'error');
            return;
        }
        
        if (this.editingItemId) {
            this.updateItem(this.editingItemId, itemData);
        } else {
            this.addItem(itemData);
        }
        
        this.closeModal();
    }
    
    addItem(itemData) {
        const newItem = {
            id: this.generateId(),
            ...itemData,
            createdAt: new Date().toISOString()
        };
        
        this.items.push(newItem);
        this.saveData();
        this.renderCurrentTab();
        this.showNotification('アイテムを追加しました', 'success');
    }
    
    updateItem(itemId, itemData) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            this.items[itemIndex] = {
                ...this.items[itemIndex],
                ...itemData,
                updatedAt: new Date().toISOString()
            };
            this.saveData();
            this.renderCurrentTab();
            this.showNotification('アイテムを更新しました', 'success');
        }
    }
    
    editItem(itemId) {
        this.openModal(itemId);
    }
    
    deleteItem(itemId) {
        if (confirm('このアイテムを削除しますか？')) {
            this.items = this.items.filter(item => item.id !== itemId);
            this.saveData();
            this.renderCurrentTab();
            this.showNotification('アイテムを削除しました', 'success');
        }
    }
    
    updateQuantity(itemId, change) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            const newQuantity = Math.max(0, item.quantity + change);
            item.quantity = newQuantity;
            this.saveData();
            this.renderCurrentTab();
            
            if (newQuantity === 0) {
                this.showNotification(`${item.name}が買い物リストに追加されました`, 'info');
            }
        }
    }
    
    removeFromShopping(itemId) {
        this.deleteItem(itemId);
    }
    
    clearCompletedItems() {
        const checkboxes = document.querySelectorAll('.shopping-checkbox:checked');
        const completedIds = Array.from(checkboxes).map(checkbox => 
            checkbox.id.replace('shopping-', '')
        );
        
        if (completedIds.length > 0 && confirm('チェックされたアイテムを削除しますか？')) {
            this.items = this.items.filter(item => !completedIds.includes(item.id));
            this.saveData();
            this.renderCurrentTab();
            this.showNotification(`${completedIds.length}個のアイテムを削除しました`, 'success');
        }
    }
    
    // 設定管理
    toggleDarkMode() {
        this.settings.darkMode = this.darkModeToggle.checked;
        this.applySettings();
        this.saveData();
    }
    
    updateSettings() {
        this.settings.expiryNotifications = this.expiryNotificationsToggle.checked;
        this.settings.alertDays = parseInt(this.alertDaysSelect.value);
        this.saveData();
    }
    
    applySettings() {
        document.body.classList.toggle('dark-mode', this.settings.darkMode);
    }
    
    // データ管理
    exportData() {
        const data = {
            items: this.items,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stockpal-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('データをエクスポートしました', 'success');
    }
    
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.items && Array.isArray(data.items)) {
                    if (confirm('現在のデータを上書きしますか？この操作は元に戻せません。')) {
                        this.items = data.items;
                        if (data.settings) {
                            this.settings = { ...this.settings, ...data.settings };
                        }
                        this.saveData();
                        this.renderCurrentTab();
                        this.applySettings();
                        this.showNotification('データをインポートしました', 'success');
                    }
                } else {
                    this.showNotification('無効なデータファイルです', 'error');
                }
            } catch (error) {
                this.showNotification('ファイルの読み込みに失敗しました', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // ファイル入力をリセット
        e.target.value = '';
    }
    
    clearAllData() {
        if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
            this.items = [];
            this.saveData();
            this.renderCurrentTab();
            this.showNotification('すべてのデータを削除しました', 'success');
        }
    }
    
    // 期限チェック
    checkExpiryItems() {
        if (!this.settings.expiryNotifications) return;
        
        const expiringItems = this.items.filter(item => this.isExpiringSoon(item));
        
        if (expiringItems.length > 0) {
            const itemNames = expiringItems.map(item => item.name).join(', ');
            this.showNotification(`期限が近いアイテム: ${itemNames}`, 'warning');
        }
    }
    
    // キーボードショートカット
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.openModal();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveData();
                    this.showNotification('データを保存しました', 'success');
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }
    
    // ユーティリティ関数
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
    }
    
    showNotification(message, type = 'info') {
        // 簡単な通知システム（実際のプロジェクトではより高度な通知ライブラリを使用）
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // アニメーション
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自動削除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// アプリケーションの初期化
let stockPal;
document.addEventListener('DOMContentLoaded', () => {
    stockPal = new StockPalApp();
    
    // グローバルアクセス用（HTMLのonclick属性で使用）
    window.stockPal = stockPal;
});