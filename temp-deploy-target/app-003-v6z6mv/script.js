// 格好良い電卓 - app-003-v6z6mv
// 電卓の状態管理
let currentExpression = '';
let currentResult = '0';
let history = [];
let waitingForOperand = false;
let pendingOperator = null;
let displayValue = '0';
let previousValue = null;

// DOM要素の取得
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyDisplayEl = document.getElementById('history-display');
const historyListEl = document.getElementById('history-list');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    updateDisplay();
    
    // 数字ボタンのイベントリスナー
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const number = btn.dataset.number;
            inputNumber(number);
        });
    });
    
    // 演算子ボタンのイベントリスナー
    document.querySelectorAll('.operator-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const operator = btn.dataset.operator;
            performOperation(operator);
        });
    });
    
    // 機能ボタンのイベントリスナー
    document.getElementById('clear').addEventListener('click', clear);
    document.getElementById('delete').addEventListener('click', deleteLastChar);
    document.getElementById('percent').addEventListener('click', calculatePercent);
    document.getElementById('equals').addEventListener('click', calculate);
    document.getElementById('clear-history').addEventListener('click', clearHistory);
    
    // テーマ切り替えボタンのイベントリスナー
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTheme(btn.dataset.theme);
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // キーボードサポート
    document.addEventListener('keydown', handleKeyPress);
});

// 数字入力処理
function inputNumber(num) {
    if (waitingForOperand) {
        displayValue = num;
        waitingForOperand = false;
    } else {
        displayValue = displayValue === '0' ? num : displayValue + num;
    }
    
    // 小数点の重複チェック
    if (num === '.' && displayValue.includes('.')) {
        return;
    }
    
    // 最大桁数チェック
    if (displayValue.length > 15) {
        return;
    }
    
    updateDisplay();
}

// 演算子処理
function performOperation(nextOperator) {
    const inputValue = parseFloat(displayValue);
    
    if (previousValue === null) {
        previousValue = inputValue;
    } else if (pendingOperator) {
        const currentValue = previousValue || 0;
        const newValue = calculate2Numbers(currentValue, inputValue, pendingOperator);
        
        displayValue = `${parseFloat(newValue.toFixed(12))}`;
        previousValue = newValue;
    }
    
    waitingForOperand = true;
    pendingOperator = nextOperator;
    
    // 式の更新
    if (currentExpression === '' || waitingForOperand) {
        currentExpression = displayValue + ' ' + nextOperator;
    } else {
        currentExpression += ' ' + displayValue + ' ' + nextOperator;
    }
    
    updateDisplay();
}

// 2つの数値の計算
function calculate2Numbers(firstOperand, secondOperand, operator) {
    switch (operator) {
        case '+':
            return firstOperand + secondOperand;
        case '-':
            return firstOperand - secondOperand;
        case '×':
            return firstOperand * secondOperand;
        case '÷':
            return secondOperand !== 0 ? firstOperand / secondOperand : 0;
        default:
            return secondOperand;
    }
}

// 計算実行
function calculate() {
    if (pendingOperator && previousValue !== null) {
        const inputValue = parseFloat(displayValue);
        const newValue = calculate2Numbers(previousValue, inputValue, pendingOperator);
        
        // 計算履歴に追加
        const fullExpression = currentExpression + ' ' + displayValue;
        const resultValue = parseFloat(newValue.toFixed(12));
        
        addToHistory(fullExpression, resultValue);
        
        // 表示更新
        currentExpression = fullExpression;
        displayValue = `${resultValue}`;
        previousValue = null;
        pendingOperator = null;
        waitingForOperand = true;
        
        updateDisplay();
    }
}

// クリア処理
function clear() {
    currentExpression = '';
    displayValue = '0';
    previousValue = null;
    pendingOperator = null;
    waitingForOperand = false;
    updateDisplay();
}

// 最後の文字を削除
function deleteLastChar() {
    if (displayValue.length > 1) {
        displayValue = displayValue.slice(0, -1);
    } else {
        displayValue = '0';
    }
    updateDisplay();
}

// パーセント計算
function calculatePercent() {
    const value = parseFloat(displayValue);
    displayValue = `${value / 100}`;
    updateDisplay();
}

// 表示更新
function updateDisplay() {
    expressionEl.textContent = currentExpression || '';
    resultEl.textContent = displayValue;
    
    // 長い数値の場合はフォントサイズを調整
    if (displayValue.length > 10) {
        resultEl.style.fontSize = '2em';
    } else if (displayValue.length > 7) {
        resultEl.style.fontSize = '2.5em';
    } else {
        resultEl.style.fontSize = '3em';
    }
}

// 履歴管理
function addToHistory(expression, result) {
    const historyItem = {
        expression: expression,
        result: result,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(historyItem);
    
    // 履歴は最大50件まで保存
    if (history.length > 50) {
        history.pop();
    }
    
    saveHistory();
    displayHistory();
}

// 履歴表示
function displayHistory() {
    historyListEl.innerHTML = '';
    
    history.forEach((item, index) => {
        const historyDiv = document.createElement('div');
        historyDiv.className = 'history-item';
        historyDiv.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">= ${item.result}</div>
        `;
        
        // 履歴項目クリックで値を復元
        historyDiv.addEventListener('click', () => {
            displayValue = `${item.result}`;
            currentExpression = '';
            updateDisplay();
        });
        
        historyListEl.appendChild(historyDiv);
    });
}

// 履歴保存
function saveHistory() {
    localStorage.setItem('calculator-history', JSON.stringify(history));
}

// 履歴読み込み
function loadHistory() {
    const savedHistory = localStorage.getItem('calculator-history');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        displayHistory();
    }
}

// 履歴クリア
function clearHistory() {
    history = [];
    saveHistory();
    displayHistory();
}

// テーマ切り替え
function switchTheme(theme) {
    document.body.className = '';
    if (theme !== 'dark') {
        document.body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('calculator-theme', theme);
}

// 保存されたテーマの読み込み
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('calculator-theme');
    if (savedTheme && savedTheme !== 'dark') {
        document.body.classList.add(`theme-${savedTheme}`);
        document.querySelector(`[data-theme="${savedTheme}"]`).classList.add('active');
        document.querySelector('[data-theme="dark"]').classList.remove('active');
    }
});

// キーボード操作
function handleKeyPress(e) {
    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputNumber(e.key);
    } else if (e.key === '.') {
        e.preventDefault();
        inputNumber('.');
    } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        performOperation(e.key);
    } else if (e.key === '*') {
        e.preventDefault();
        performOperation('×');
    } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        clear();
    } else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteLastChar();
    } else if (e.key === '%') {
        e.preventDefault();
        calculatePercent();
    }
}

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('Calculator error:', e);
    displayValue = 'Error';
    updateDisplay();
});

// 初期テーマ設定
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (!localStorage.getItem('calculator-theme')) {
    switchTheme(prefersDark ? 'dark' : 'light');
}