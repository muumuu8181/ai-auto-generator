// 電卓の状態管理
const calculator = {
    displayValue: '0',
    firstOperand: null,
    waitingForOperand: false,
    operator: null,
    history: [],
    currentExpression: ''
};

// DOM要素の取得
const display = document.getElementById('display');
const historyDisplay = document.getElementById('history');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // ボタンイベントの設定
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });
    
    // 履歴クリアボタン
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // キーボードサポート
    document.addEventListener('keydown', handleKeyPress);
    
    // LocalStorageから履歴を読み込み
    loadHistory();
    updateDisplay();
});

// ボタンクリックハンドラ
function handleButtonClick(event) {
    const button = event.target;
    
    // リップルエフェクト
    createRipple(event);
    
    if (button.hasAttribute('data-number')) {
        inputDigit(button.getAttribute('data-number'));
    } else if (button.hasAttribute('data-operator')) {
        handleOperator(button.getAttribute('data-operator'));
    } else if (button.hasAttribute('data-action')) {
        handleAction(button.getAttribute('data-action'));
    }
    
    updateDisplay();
}

// 数字入力
function inputDigit(digit) {
    const { displayValue, waitingForOperand } = calculator;
    
    if (waitingForOperand) {
        calculator.displayValue = digit;
        calculator.waitingForOperand = false;
    } else {
        calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
}

// 演算子処理
function handleOperator(nextOperator) {
    const { firstOperand, displayValue, operator } = calculator;
    const inputValue = parseFloat(displayValue);
    
    if (firstOperand === null && !isNaN(inputValue)) {
        calculator.firstOperand = inputValue;
        calculator.currentExpression = `${inputValue} ${nextOperator}`;
    } else if (operator) {
        const result = calculate(firstOperand, inputValue, operator);
        
        calculator.displayValue = `${parseFloat(result.toFixed(7))}`;
        calculator.firstOperand = result;
        calculator.currentExpression = `${calculator.currentExpression} ${inputValue} = ${result}`;
        
        // 履歴に追加
        addToHistory(calculator.currentExpression, result);
        calculator.currentExpression = `${result} ${nextOperator}`;
    }
    
    calculator.waitingForOperand = true;
    calculator.operator = nextOperator;
    updateHistoryDisplay();
}

// 計算実行
function calculate(firstOperand, secondOperand, operator) {
    switch (operator) {
        case '+':
            return firstOperand + secondOperand;
        case '-':
            return firstOperand - secondOperand;
        case '×':
            return firstOperand * secondOperand;
        case '÷':
            return secondOperand !== 0 ? firstOperand / secondOperand : NaN;
        default:
            return secondOperand;
    }
}

// アクション処理
function handleAction(action) {
    switch (action) {
        case 'clear':
            resetCalculator();
            break;
        case 'delete':
            deleteLastDigit();
            break;
        case 'percent':
            handlePercent();
            break;
        case 'equals':
            handleEquals();
            break;
    }
}

// リセット
function resetCalculator() {
    calculator.displayValue = '0';
    calculator.firstOperand = null;
    calculator.waitingForOperand = false;
    calculator.operator = null;
    calculator.currentExpression = '';
    updateHistoryDisplay();
}

// 最後の桁を削除
function deleteLastDigit() {
    const { displayValue } = calculator;
    if (displayValue.length > 1) {
        calculator.displayValue = displayValue.slice(0, -1);
    } else {
        calculator.displayValue = '0';
    }
}

// パーセント計算
function handlePercent() {
    const { displayValue } = calculator;
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
        calculator.displayValue = `${value / 100}`;
    }
}

// イコール処理
function handleEquals() {
    const { firstOperand, displayValue, operator } = calculator;
    const inputValue = parseFloat(displayValue);
    
    if (firstOperand !== null && operator && !calculator.waitingForOperand) {
        const result = calculate(firstOperand, inputValue, operator);
        const expression = `${firstOperand} ${operator} ${inputValue} = ${result}`;
        
        calculator.displayValue = `${parseFloat(result.toFixed(7))}`;
        calculator.firstOperand = null;
        calculator.operator = null;
        calculator.waitingForOperand = false;
        calculator.currentExpression = '';
        
        // 履歴に追加
        addToHistory(expression, result);
        updateHistoryDisplay();
    }
}

// 表示更新
function updateDisplay() {
    display.textContent = calculator.displayValue;
}

// 履歴表示更新
function updateHistoryDisplay() {
    historyDisplay.textContent = calculator.currentExpression || '';
}

// 履歴に追加
function addToHistory(expression, result) {
    const historyItem = {
        expression: expression,
        result: result,
        timestamp: new Date().toISOString()
    };
    
    calculator.history.unshift(historyItem);
    if (calculator.history.length > 50) {
        calculator.history.pop();
    }
    
    saveHistory();
    renderHistory();
}

// 履歴のレンダリング
function renderHistory() {
    historyList.innerHTML = '';
    
    calculator.history.forEach((item, index) => {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-item';
        historyElement.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">${item.result}</div>
        `;
        
        historyElement.addEventListener('click', () => {
            calculator.displayValue = `${item.result}`;
            updateDisplay();
        });
        
        historyList.appendChild(historyElement);
    });
}

// 履歴をクリア
function clearHistory() {
    if (confirm('履歴をすべて削除しますか？')) {
        calculator.history = [];
        saveHistory();
        renderHistory();
    }
}

// LocalStorageに保存
function saveHistory() {
    localStorage.setItem('calculatorHistory', JSON.stringify(calculator.history));
}

// LocalStorageから読み込み
function loadHistory() {
    const saved = localStorage.getItem('calculatorHistory');
    if (saved) {
        calculator.history = JSON.parse(saved);
        renderHistory();
    }
}

// キーボードサポート
function handleKeyPress(event) {
    const key = event.key;
    
    if (key >= '0' && key <= '9') {
        inputDigit(key);
        updateDisplay();
    } else if (key === '.') {
        inputDigit('.');
        updateDisplay();
    } else if (key === '+' || key === '-') {
        handleOperator(key);
        updateDisplay();
    } else if (key === '*') {
        handleOperator('×');
        updateDisplay();
    } else if (key === '/') {
        event.preventDefault();
        handleOperator('÷');
        updateDisplay();
    } else if (key === 'Enter' || key === '=') {
        handleEquals();
        updateDisplay();
    } else if (key === 'Escape') {
        resetCalculator();
        updateDisplay();
    } else if (key === 'Backspace') {
        deleteLastDigit();
        updateDisplay();
    } else if (key === '%') {
        handlePercent();
        updateDisplay();
    }
}

// リップルエフェクト
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    // リップル用のCSS追加
    if (!document.querySelector('style[data-ripple]')) {
        const style = document.createElement('style');
        style.setAttribute('data-ripple', 'true');
        style.textContent = `
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}