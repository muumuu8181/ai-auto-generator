// 電卓の状態管理
let currentNumber = '0';
let previousNumber = null;
let currentOperator = null;
let shouldResetDisplay = false;
let history = [];

// DOM要素
const display = document.getElementById('display');
const historyDisplay = document.getElementById('history');
const buttons = document.querySelectorAll('.btn');

// 音効果用のAudio Context
let audioContext = null;

// 音効果の初期化
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// ボタンクリック音
function playClickSound(frequency = 600) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// ディスプレイ更新
function updateDisplay(value) {
    display.textContent = value;
    display.classList.remove('error');
}

// 履歴更新
function updateHistory(expression) {
    history.unshift(expression);
    if (history.length > 3) {
        history = history.slice(0, 3);
    }
    historyDisplay.textContent = history.join(' | ');
}

// 数値入力処理
function handleNumber(num) {
    if (shouldResetDisplay) {
        currentNumber = '0';
        shouldResetDisplay = false;
    }
    
    if (currentNumber === '0' && num !== '.') {
        currentNumber = num;
    } else if (num === '.' && currentNumber.includes('.')) {
        return;
    } else {
        currentNumber += num;
    }
    
    updateDisplay(currentNumber);
}

// 演算子処理
function handleOperator(operator) {
    const inputNumber = parseFloat(currentNumber);
    
    if (previousNumber === null) {
        previousNumber = inputNumber;
    } else if (currentOperator) {
        const result = calculate();
        updateDisplay(result);
        previousNumber = result;
    }
    
    shouldResetDisplay = true;
    currentOperator = operator;
}

// 計算実行
function calculate() {
    const prev = parseFloat(previousNumber);
    const current = parseFloat(currentNumber);
    
    if (isNaN(prev) || isNaN(current)) return 0;
    
    let result;
    switch (currentOperator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '×':
            result = prev * current;
            break;
        case '÷':
            if (current === 0) {
                display.classList.add('error');
                return 'Error';
            }
            result = prev / current;
            break;
        default:
            return current;
    }
    
    // 小数点以下の処理
    return Math.round(result * 100000000) / 100000000;
}

// イコール処理
function handleEquals() {
    if (currentOperator && previousNumber !== null) {
        const expression = `${previousNumber} ${currentOperator} ${currentNumber}`;
        const result = calculate();
        updateDisplay(result);
        updateHistory(`${expression} = ${result}`);
        
        currentNumber = result.toString();
        previousNumber = null;
        currentOperator = null;
        shouldResetDisplay = true;
    }
}

// クリア処理
function handleClear() {
    currentNumber = '0';
    previousNumber = null;
    currentOperator = null;
    shouldResetDisplay = false;
    updateDisplay('0');
}

// 削除処理
function handleDelete() {
    if (currentNumber.length > 1) {
        currentNumber = currentNumber.slice(0, -1);
    } else {
        currentNumber = '0';
    }
    updateDisplay(currentNumber);
}

// パーセント処理
function handlePercent() {
    currentNumber = (parseFloat(currentNumber) / 100).toString();
    updateDisplay(currentNumber);
}

// ボタンイベント設定
buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        initAudio();
        
        const btn = e.target;
        const btnId = btn.id;
        const btnText = btn.textContent;
        
        // アニメーション
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 600);
        
        // 音効果
        if (btn.classList.contains('number')) {
            playClickSound(800);
        } else if (btn.classList.contains('operator')) {
            playClickSound(600);
        } else {
            playClickSound(400);
        }
        
        // 数値ボタン
        if (btn.classList.contains('number') && btnId !== 'decimal') {
            handleNumber(btnText);
        }
        // 小数点
        else if (btnId === 'decimal') {
            handleNumber('.');
        }
        // 演算子
        else if (btn.classList.contains('operator')) {
            handleOperator(btnText);
        }
        // イコール
        else if (btnId === 'equals') {
            handleEquals();
        }
        // クリア
        else if (btnId === 'clear') {
            handleClear();
        }
        // 削除
        else if (btnId === 'delete') {
            handleDelete();
        }
        // パーセント
        else if (btnId === 'percent') {
            handlePercent();
        }
    });
});

// キーボードサポート
document.addEventListener('keydown', (e) => {
    initAudio();
    
    const key = e.key;
    
    // 数字キー
    if (key >= '0' && key <= '9') {
        handleNumber(key);
        playClickSound(800);
    }
    // 演算子
    else if (key === '+' || key === '-') {
        handleOperator(key);
        playClickSound(600);
    }
    else if (key === '*') {
        handleOperator('×');
        playClickSound(600);
    }
    else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
        playClickSound(600);
    }
    // その他
    else if (key === 'Enter' || key === '=') {
        handleEquals();
        playClickSound(400);
    }
    else if (key === 'Escape' || key === 'c' || key === 'C') {
        handleClear();
        playClickSound(400);
    }
    else if (key === 'Backspace') {
        handleDelete();
        playClickSound(400);
    }
    else if (key === '.') {
        handleNumber('.');
        playClickSound(800);
    }
    else if (key === '%') {
        handlePercent();
        playClickSound(400);
    }
});

// 初期表示
updateDisplay('0');