// タスクデータ管理
let tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
let currentFilter = 'all';
const MAX_TASKS = 50;

// DOM要素
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const remainingTasks = document.getElementById('remainingTasks');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompleted = document.getElementById('clearCompleted');
const clearAll = document.getElementById('clearAll');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    taskInput.focus();
});

// タスク追加
function addTask() {
    const text = taskInput.value.trim();
    
    if (!text) {
        showNotification('タスク内容を入力してください', 'warning');
        return;
    }
    
    if (tasks.length >= MAX_TASKS) {
        showNotification(`タスクの上限（${MAX_TASKS}件）に達しました`, 'error');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(task); // 新しいタスクを先頭に追加
    taskInput.value = '';
    
    saveData();
    updateDisplay();
    showNotification('タスクを追加しました', 'success');
}

// タスク削除
function deleteTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    
    if (taskElement) {
        taskElement.classList.add('removing');
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveData();
            updateDisplay();
            showNotification('タスクを削除しました', 'info');
        }, 300);
    }
}

// タスク完了切り替え
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        saveData();
        updateDisplay();
    }
}

// データ保存
function saveData() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// フィルタリング
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// 統計更新
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    
    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    remainingTasks.textContent = remaining;
    
    // 統計のアニメーション
    [totalTasks, completedTasks, remainingTasks].forEach(el => {
        el.style.transform = 'scale(1.2)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
        }, 150);
    });
}

// タスクリスト表示
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="toggleTask(${task.id})"></div>
            <div class="task-text" onclick="toggleTask(${task.id})">${escapeHtml(task.text)}</div>
            <button class="task-delete" onclick="deleteTask(${task.id})" title="削除">×</button>
        </div>
    `).join('');
}

// 表示更新
function updateDisplay() {
    updateStats();
    renderTasks();
    updateButtons();
}

// ボタン状態更新
function updateButtons() {
    const hasCompleted = tasks.some(task => task.completed);
    const hasTasks = tasks.length > 0;
    
    clearCompleted.disabled = !hasCompleted;
    clearAll.disabled = !hasTasks;
    addBtn.disabled = tasks.length >= MAX_TASKS;
    
    if (tasks.length >= MAX_TASKS) {
        taskInput.placeholder = `タスク上限（${MAX_TASKS}件）に達しました`;
        taskInput.disabled = true;
    } else {
        taskInput.placeholder = '新しいタスクを入力してください';
        taskInput.disabled = false;
    }
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 通知表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    // 色分け
    switch (type) {
        case 'success':
            notification.style.background = '#4ecdc4';
            break;
        case 'error':
            notification.style.background = '#ff6b6b';
            break;
        case 'warning':
            notification.style.background = '#f39c12';
            break;
        default:
            notification.style.background = '#667eea';
    }
    
    document.body.appendChild(notification);
    
    // アニメーション
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// イベントリスナー
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// フィルターボタン
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        updateDisplay();
    });
});

// 完了済み削除
clearCompleted.addEventListener('click', () => {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showNotification('完了済みのタスクがありません', 'warning');
        return;
    }
    
    if (confirm(`完了済みのタスク${completedCount}件を削除しますか？`)) {
        tasks = tasks.filter(task => !task.completed);
        saveData();
        updateDisplay();
        showNotification(`${completedCount}件のタスクを削除しました`, 'success');
    }
});

// 全削除
clearAll.addEventListener('click', () => {
    if (tasks.length === 0) {
        showNotification('削除するタスクがありません', 'warning');
        return;
    }
    
    if (confirm(`全てのタスク（${tasks.length}件）を削除しますか？`)) {
        tasks = [];
        saveData();
        updateDisplay();
        showNotification('全てのタスクを削除しました', 'success');
    }
});

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'a':
                e.preventDefault();
                taskInput.focus();
                break;
            case 'd':
                e.preventDefault();
                if (tasks.filter(task => task.completed).length > 0) {
                    clearCompleted.click();
                }
                break;
        }
    }
    
    // 数字キーでフィルター切り替え
    switch(e.key) {
        case '1':
            filterBtns[0].click(); // すべて
            break;
        case '2':
            filterBtns[1].click(); // 未完了
            break;
        case '3':
            filterBtns[2].click(); // 完了済み
            break;
    }
});

// 自動保存とバックアップ
setInterval(() => {
    if (tasks.length > 0) {
        saveData();
    }
}, 30000); // 30秒ごとに自動保存

// プログレスバー（視覚的な進捗表示）
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    let progressBar = document.querySelector('.progress-bar');
    if (!progressBar && total > 0) {
        progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.cssText = `
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            transition: width 0.3s ease;
            width: 0%;
        `;
        
        progressBar.appendChild(progressFill);
        document.querySelector('.stats-section').appendChild(progressBar);
    }
    
    if (progressBar) {
        const progressFill = progressBar.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (total === 0) {
            progressBar.remove();
        }
    }
}

// 表示更新時にプログレスバーも更新
const originalUpdateDisplay = updateDisplay;
updateDisplay = function() {
    originalUpdateDisplay();
    updateProgress();
};