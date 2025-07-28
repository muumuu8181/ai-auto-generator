// StiqyBoard - デジタル付箋ボード
class StiqyBoard {
    constructor() {
        // DOM要素
        this.board = document.getElementById('board');
        this.searchBox = document.getElementById('search-box');
        this.clearSearch = document.getElementById('clear-search');
        this.colorPalette = document.getElementById('color-palette');
        this.addNoteBtn = document.getElementById('add-note-btn');
        this.clearBoardBtn = document.getElementById('clear-board-btn');
        this.settingsPanel = document.getElementById('settings-panel');
        this.emptyState = document.getElementById('empty-state');
        this.searchResults = document.getElementById('search-results');
        this.fileInput = document.getElementById('file-input');
        this.toastContainer = document.getElementById('toast-container');
        
        // アプリの状態
        this.notes = [];
        this.currentSearchTerm = '';
        this.selectedColor = '#fff59d';
        this.noteIdCounter = 0;
        this.activeNote = null;
        this.isDragging = false;
        this.dragData = null;
        
        // 設定
        this.settings = {
            gridVisible: true,
            gridSnap: false,
            autoSave: true,
            darkMode: false
        };
        
        // グリッド設定
        this.gridSize = 20;
        
        // 初期化
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.applySettings();
        this.updateEmptyState();
        this.setupKeyboardShortcuts();
    }
    
    setupEventListeners() {
        // 付箋作成
        this.addNoteBtn.addEventListener('click', () => this.createNote());
        this.board.addEventListener('dblclick', (e) => this.handleBoardDoubleClick(e));
        
        // 検索
        this.searchBox.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearch.addEventListener('click', () => this.clearSearchFunction());
        
        // カラーパレット
        this.colorPalette.addEventListener('click', (e) => this.handleColorSelection(e));
        
        // ボードクリア
        this.clearBoardBtn.addEventListener('click', () => this.clearBoard());
        
        // 設定パネル
        document.getElementById('settings-toggle-btn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('close-settings-btn').addEventListener('click', () => this.closeSettings());
        
        // 設定の変更
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
        document.getElementById('grid-visible-toggle').addEventListener('change', (e) => this.toggleGridVisible(e.target.checked));
        document.getElementById('grid-snap-toggle').addEventListener('change', (e) => this.toggleGridSnap(e.target.checked));
        document.getElementById('auto-save-toggle').addEventListener('change', (e) => this.toggleAutoSave(e.target.checked));
        
        // データ管理
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-data-btn').addEventListener('click', () => this.fileInput.click());
        document.getElementById('reset-data-btn').addEventListener('click', () => this.resetData());
        this.fileInput.addEventListener('change', (e) => this.importData(e));
        
        // ヘルプモーダル
        document.getElementById('help-toggle-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('close-help-modal-btn').addEventListener('click', () => this.closeHelp());
        document.getElementById('confirm-help-btn').addEventListener('click', () => this.closeHelp());
        
        // ドラッグ&ドロップ
        this.setupDragAndDrop();
        
        // ウィンドウリサイズ
        window.addEventListener('resize', () => this.handleResize());
        
        // ページ離脱前の警告
        window.addEventListener('beforeunload', () => this.saveData());
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: 新しい付箋
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNote();
            }
            
            // Ctrl/Cmd + F: 検索にフォーカス
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.searchBox.focus();
            }
            
            // Ctrl/Cmd + S: 手動保存
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveData();
                this.showToast('データを保存しました', 'success');
            }
            
            // Delete: 選択された付箋を削除
            if (e.key === 'Delete' && this.activeNote) {
                e.preventDefault();
                this.deleteNote(this.activeNote.dataset.noteId);
            }
            
            // Escape: 選択解除
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }
    
    setupDragAndDrop() {
        // マウスイベント
        this.board.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // タッチイベント
        this.board.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    // ===== データ管理 =====
    saveData() {
        if (this.settings.autoSave) {
            const data = {
                notes: this.notes,
                settings: this.settings,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('stiqyboard_data', JSON.stringify(data));
        }
    }
    
    loadData() {
        try {
            const savedData = localStorage.getItem('stiqyboard_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.notes = data.notes || [];
                this.settings = { ...this.settings, ...(data.settings || {}) };
                this.noteIdCounter = Math.max(...this.notes.map(n => n.id), 0) + 1;
                this.renderAllNotes();
            }
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            this.showToast('データの読み込みに失敗しました', 'error');
        }
    }
    
    // ===== 付箋管理 =====
    createNote(x = null, y = null) {
        const boardRect = this.board.getBoundingClientRect();
        const noteId = this.noteIdCounter++;
        
        const note = {
            id: noteId,
            content: '',
            x: x !== null ? x - boardRect.left : Math.random() * (boardRect.width - 200),
            y: y !== null ? y - boardRect.top : Math.random() * (boardRect.height - 150),
            color: this.selectedColor,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        // グリッドスナップ
        if (this.settings.gridSnap) {
            note.x = Math.round(note.x / this.gridSize) * this.gridSize;
            note.y = Math.round(note.y / this.gridSize) * this.gridSize;
        }
        
        this.notes.push(note);
        this.renderNote(note);
        this.saveData();
        this.updateEmptyState();
        
        // 新しく作成した付箋にフォーカス
        setTimeout(() => {
            const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
            if (noteElement) {
                const textarea = noteElement.querySelector('.note-content');
                textarea.focus();
            }
        }, 100);
    }
    
    renderNote(note) {
        const template = document.getElementById('sticky-note-template');
        const noteElement = template.content.cloneNode(true);
        const noteDiv = noteElement.querySelector('.sticky-note');
        
        noteDiv.dataset.noteId = note.id;
        noteDiv.style.left = `${note.x}px`;
        noteDiv.style.top = `${note.y}px`;
        noteDiv.style.backgroundColor = note.color;
        
        const textarea = noteDiv.querySelector('.note-content');
        textarea.value = note.content;
        textarea.addEventListener('input', () => this.updateNoteContent(note.id, textarea.value));
        textarea.addEventListener('focus', () => this.setActiveNote(noteDiv));
        
        const timestamp = noteDiv.querySelector('.timestamp');
        timestamp.textContent = this.formatDate(note.updated);
        
        const wordCount = noteDiv.querySelector('.word-count');
        this.updateWordCount(textarea, wordCount);
        textarea.addEventListener('input', () => this.updateWordCount(textarea, wordCount));
        
        // ボタンイベント
        const colorBtn = noteDiv.querySelector('.color-btn');
        colorBtn.addEventListener('click', (e) => this.showColorPopup(e, note.id));
        
        const deleteBtn = noteDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.deleteNote(note.id));
        
        this.board.appendChild(noteDiv);
    }
    
    renderAllNotes() {
        // 既存の付箋をクリア
        document.querySelectorAll('.sticky-note').forEach(note => note.remove());
        
        // すべての付箋を再描画
        this.notes.forEach(note => this.renderNote(note));
        
        // 検索フィルタを再適用
        if (this.currentSearchTerm) {
            this.applySearchFilter(this.currentSearchTerm);
        }
    }
    
    deleteNote(noteId) {
        if (confirm('この付箋を削除しますか？')) {
            this.notes = this.notes.filter(note => note.id !== noteId);
            const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
            if (noteElement) {
                noteElement.remove();
            }
            this.saveData();
            this.updateEmptyState();
            this.showToast('付箋を削除しました', 'info');
        }
    }
    
    updateNoteContent(noteId, content) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.content = content;
            note.updated = new Date().toISOString();
            
            // タイムスタンプを更新
            const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
            if (noteElement) {
                const timestamp = noteElement.querySelector('.timestamp');
                timestamp.textContent = this.formatDate(note.updated);
            }
            
            this.saveData();
        }
    }
    
    updateNotePosition(noteId, x, y) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.x = x;
            note.y = y;
            note.updated = new Date().toISOString();
            this.saveData();
        }
    }
    
    updateNoteColor(noteId, color) {
        const note = this.notes.find(n => n.id === noteId);
        const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
        
        if (note && noteElement) {
            note.color = color;
            note.updated = new Date().toISOString();
            noteElement.style.backgroundColor = color;
            this.saveData();
        }
    }
    
    // ===== 検索機能 =====
    handleSearch(searchTerm) {
        this.currentSearchTerm = searchTerm.toLowerCase();
        
        if (searchTerm) {
            this.clearSearch.style.display = 'block';
            this.applySearchFilter(this.currentSearchTerm);
        } else {
            this.clearSearch.style.display = 'none';
            this.clearSearchFilter();
        }
    }
    
    applySearchFilter(searchTerm) {
        let matchCount = 0;
        
        document.querySelectorAll('.sticky-note').forEach(noteElement => {
            const noteId = parseInt(noteElement.dataset.noteId);
            const note = this.notes.find(n => n.id === noteId);
            
            if (note && note.content.toLowerCase().includes(searchTerm)) {
                noteElement.classList.remove('search-dimmed');
                noteElement.classList.add('highlighted');
                matchCount++;
            } else {
                noteElement.classList.add('search-dimmed');
                noteElement.classList.remove('highlighted');
            }
        });
        
        // 検索結果表示
        this.showSearchResults(matchCount);
    }
    
    clearSearchFilter() {
        document.querySelectorAll('.sticky-note').forEach(noteElement => {
            noteElement.classList.remove('search-dimmed', 'highlighted');
        });
        this.hideSearchResults();
    }
    
    clearSearchFunction() {
        this.searchBox.value = '';
        this.currentSearchTerm = '';
        this.clearSearch.style.display = 'none';
        this.clearSearchFilter();
    }
    
    showSearchResults(count) {
        document.getElementById('search-results-count').textContent = count;
        this.searchResults.style.display = 'block';
        
        document.getElementById('clear-search-results').addEventListener('click', () => {
            this.clearSearchFunction();
        });
    }
    
    hideSearchResults() {
        this.searchResults.style.display = 'none';
    }
    
    // ===== 色選択 =====
    handleColorSelection(e) {
        if (e.target.classList.contains('color-swatch')) {
            // 前の選択を解除
            document.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.classList.remove('active');
            });
            
            // 新しい選択
            e.target.classList.add('active');
            this.selectedColor = e.target.dataset.color;
        }
    }
    
    showColorPopup(e, noteId) {
        e.stopPropagation();
        
        const colorPopup = document.getElementById('color-popup');
        const rect = e.target.getBoundingClientRect();
        
        colorPopup.style.left = `${rect.left}px`;
        colorPopup.style.top = `${rect.bottom + 5}px`;
        colorPopup.style.display = 'block';
        
        // 色選択イベント
        const handleColorSelect = (e) => {
            if (e.target.classList.contains('color-option')) {
                const color = e.target.dataset.color;
                this.updateNoteColor(noteId, color);
                colorPopup.style.display = 'none';
                document.removeEventListener('click', handleColorSelect);
            }
        };
        
        colorPopup.addEventListener('click', handleColorSelect);
        
        // 外部クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!colorPopup.contains(e.target)) {
                    colorPopup.style.display = 'none';
                }
            }, { once: true });
        }, 0);
    }
    
    // ===== ドラッグ&ドロップ =====
    handleMouseDown(e) {
        const noteElement = e.target.closest('.sticky-note');
        if (!noteElement || !e.target.closest('.note-header')) return;
        
        this.startDrag(noteElement, e.clientX, e.clientY);
    }
    
    handleTouchStart(e) {
        const noteElement = e.target.closest('.sticky-note');
        if (!noteElement || !e.target.closest('.note-header')) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(noteElement, touch.clientX, touch.clientY);
    }
    
    startDrag(noteElement, clientX, clientY) {
        this.isDragging = true;
        this.setActiveNote(noteElement);
        noteElement.classList.add('dragging');
        
        const rect = noteElement.getBoundingClientRect();
        this.dragData = {
            noteElement,
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || !this.dragData) return;
        this.updateDragPosition(e.clientX, e.clientY);
    }
    
    handleTouchMove(e) {
        if (!this.isDragging || !this.dragData) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDragPosition(touch.clientX, touch.clientY);
    }
    
    updateDragPosition(clientX, clientY) {
        const boardRect = this.board.getBoundingClientRect();
        let x = clientX - this.dragData.offsetX - boardRect.left;
        let y = clientY - this.dragData.offsetY - boardRect.top;
        
        // グリッドスナップ
        if (this.settings.gridSnap) {
            x = Math.round(x / this.gridSize) * this.gridSize;
            y = Math.round(y / this.gridSize) * this.gridSize;
        }
        
        // 境界チェック
        x = Math.max(0, Math.min(x, boardRect.width - this.dragData.noteElement.offsetWidth));
        y = Math.max(0, Math.min(y, boardRect.height - this.dragData.noteElement.offsetHeight));
        
        this.dragData.noteElement.style.left = `${x}px`;
        this.dragData.noteElement.style.top = `${y}px`;
    }
    
    handleMouseUp(e) {
        this.endDrag();
    }
    
    handleTouchEnd(e) {
        this.endDrag();
    }
    
    endDrag() {
        if (!this.isDragging || !this.dragData) return;
        
        this.isDragging = false;
        this.dragData.noteElement.classList.remove('dragging');
        
        // 位置を保存
        const noteId = parseInt(this.dragData.noteElement.dataset.noteId);
        const x = parseInt(this.dragData.noteElement.style.left);
        const y = parseInt(this.dragData.noteElement.style.top);
        this.updateNotePosition(noteId, x, y);
        
        this.dragData = null;
    }
    
    // ===== UI操作 =====
    handleBoardDoubleClick(e) {
        if (e.target === this.board || e.target.closest('.board-grid')) {
            this.createNote(e.clientX, e.clientY);
        }
    }
    
    setActiveNote(noteElement) {
        // 前の選択を解除
        document.querySelectorAll('.sticky-note').forEach(note => {
            note.classList.remove('active');
        });
        
        // 新しい選択
        if (noteElement) {
            noteElement.classList.add('active');
            this.activeNote = noteElement;
        }
    }
    
    clearSelection() {
        if (this.activeNote) {
            this.activeNote.classList.remove('active');
            this.activeNote = null;
        }
    }
    
    clearBoard() {
        if (confirm('すべての付箋を削除しますか？この操作は元に戻せません。')) {
            this.notes = [];
            document.querySelectorAll('.sticky-note').forEach(note => note.remove());
            this.saveData();
            this.updateEmptyState();
            this.showToast('すべての付箋を削除しました', 'info');
        }
    }
    
    updateEmptyState() {
        if (this.notes.length === 0) {
            this.emptyState.style.display = 'flex';
        } else {
            this.emptyState.style.display = 'none';
        }
    }
    
    // ===== 設定 =====
    toggleSettings() {
        this.settingsPanel.classList.add('open');
    }
    
    closeSettings() {
        this.settingsPanel.classList.remove('open');
    }
    
    toggleDarkMode(enabled) {
        this.settings.darkMode = enabled;
        this.applySettings();
        this.saveData();
    }
    
    toggleGridVisible(enabled) {
        this.settings.gridVisible = enabled;
        this.applySettings();
        this.saveData();
    }
    
    toggleGridSnap(enabled) {
        this.settings.gridSnap = enabled;
        this.saveData();
    }
    
    toggleAutoSave(enabled) {
        this.settings.autoSave = enabled;
        this.saveData();
    }
    
    applySettings() {
        // ダークモード
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // グリッド表示
        if (this.settings.gridVisible) {
            this.board.classList.remove('hide-grid');
        } else {
            this.board.classList.add('hide-grid');
        }
        
        // 設定UIを更新
        document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
        document.getElementById('grid-visible-toggle').checked = this.settings.gridVisible;
        document.getElementById('grid-snap-toggle').checked = this.settings.gridSnap;
        document.getElementById('auto-save-toggle').checked = this.settings.autoSave;
    }
    
    // ===== データインポート/エクスポート =====
    exportData() {
        const data = {
            notes: this.notes,
            settings: this.settings,
            exported: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stiqyboard-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('データをエクスポートしました', 'success');
    }
    
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.notes && Array.isArray(data.notes)) {
                    if (confirm('現在のデータを上書きしますか？')) {
                        this.notes = data.notes;
                        if (data.settings) {
                            this.settings = { ...this.settings, ...data.settings };
                        }
                        this.noteIdCounter = Math.max(...this.notes.map(n => n.id), 0) + 1;
                        this.renderAllNotes();
                        this.applySettings();
                        this.updateEmptyState();
                        this.saveData();
                        this.showToast('データをインポートしました', 'success');
                    }
                } else {
                    this.showToast('無効なファイル形式です', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('ファイルの読み込みに失敗しました', 'error');
            }
        };
        reader.readAsText(file);
        
        // ファイル入力をリセット
        e.target.value = '';
    }
    
    resetData() {
        this.showConfirmDialog(
            'データをリセット',
            'すべてのデータが削除されます。この操作は元に戻せません。',
            () => {
                this.notes = [];
                this.settings = {
                    gridVisible: true,
                    gridSnap: false,
                    autoSave: true,
                    darkMode: false
                };
                localStorage.removeItem('stiqyboard_data');
                document.querySelectorAll('.sticky-note').forEach(note => note.remove());
                this.applySettings();
                this.updateEmptyState();
                this.showToast('データをリセットしました', 'info');
            }
        );
    }
    
    // ===== ヘルプ =====
    showHelp() {
        document.getElementById('help-modal').classList.add('active');
    }
    
    closeHelp() {
        document.getElementById('help-modal').classList.remove('active');
    }
    
    // ===== ユーティリティ =====
    updateWordCount(textarea, wordCountElement) {
        const count = textarea.value.length;
        wordCountElement.textContent = `${count}文字`;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1分未満
            return 'たった今';
        } else if (diff < 3600000) { // 1時間未満
            return `${Math.floor(diff / 60000)}分前`;
        } else if (diff < 86400000) { // 1日未満
            return `${Math.floor(diff / 3600000)}時間前`;
        } else {
            return date.toLocaleDateString('ja-JP');
        }
    }
    
    handleResize() {
        // 画面サイズ変更時の処理
        if (window.innerWidth <= 768) {
            this.closeSettings();
        }
    }
    
    showConfirmDialog(title, message, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        const handleCancel = () => {
            modal.style.display = 'none';
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
        };
        
        const handleOk = () => {
            modal.style.display = 'none';
            onConfirm();
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
        };
        
        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
        
        modal.style.display = 'flex';
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // アニメーション
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 自動削除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// アプリケーションの初期化
let stiqyBoard;
document.addEventListener('DOMContentLoaded', () => {
    stiqyBoard = new StiqyBoard();
    
    // グローバルアクセス用
    window.stiqyBoard = stiqyBoard;
    
    // PWA対応
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service Worker の登録に失敗した場合は無視
        });
    }
});