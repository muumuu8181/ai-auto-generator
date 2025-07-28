// 格好良い電卓 - JavaScript実装

class StylishCalculator {
    constructor() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operator = null;
        this.waitingForNewValue = false;
        this.history = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
        this.updateDisplay();
    }

    initializeElements() {
        this.currentDisplay = document.getElementById('currentDisplay');
        this.previousDisplay = document.getElementById('previousDisplay');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    bindEvents() {
        // 数字ボタン
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', () => {
                this.inputNumber(button.dataset.number);
                this.addButtonAnimation(button);
            });
        });

        // 演算子ボタン
        document.querySelectorAll('[data-operator]').forEach(button => {
            button.addEventListener('click', () => {
                this.inputOperator(button.dataset.operator);
                this.addButtonAnimation(button);
            });
        });

        // アクションボタン
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                this.handleAction(button.dataset.action);
                this.addButtonAnimation(button);
            });
        });

        // 履歴クリアボタン
        this.clearHistoryBtn.addEventListener('click', () => {
            this.clearHistory();
            this.addButtonAnimation(this.clearHistoryBtn);
        });

        // キーボードサポート
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
    }

    addButtonAnimation(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    inputNumber(number) {
        if (this.waitingForNewValue) {
            this.currentValue = number;
            this.waitingForNewValue = false;
        } else {
            this.currentValue = this.currentValue === '0' ? number : this.currentValue + number;
        }
        this.updateDisplay();
    }

    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.currentValue);

        if (this.previousValue === '' && !isNaN(inputValue)) {
            this.previousValue = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousValue || 0;
            const newValue = this.calculate(currentValue, inputValue, this.operator);

            this.currentValue = String(newValue);
            this.previousValue = newValue;
        }

        this.waitingForNewValue = true;
        this.operator = nextOperator;
        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'clear-entry':
                this.clearEntry();
                break;
            case 'backspace':
                this.backspace();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'calculate':
                this.calculate();
                break;
        }
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operator = null;
        this.waitingForNewValue = false;
        this.updateDisplay();
    }

    clearEntry() {
        this.currentValue = '0';
        this.updateDisplay();
    }

    backspace() {
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (this.waitingForNewValue) {
            this.currentValue = '0.';
            this.waitingForNewValue = false;
        } else if (this.currentValue.indexOf('.') === -1) {
            this.currentValue += '.';
        }
        this.updateDisplay();
    }

    calculate(firstValue, secondValue, operator) {
        if (typeof firstValue === 'undefined' && typeof secondValue === 'undefined') {
            // = ボタンが押された場合
            if (this.operator && this.previousValue !== '') {
                const prev = parseFloat(this.previousValue);
                const current = parseFloat(this.currentValue);
                const result = this.performCalculation(prev, current, this.operator);
                
                this.addToHistory(`${this.previousValue} ${this.getOperatorSymbol(this.operator)} ${this.currentValue} = ${result}`);
                
                this.currentValue = String(result);
                this.previousValue = '';
                this.operator = null;
                this.waitingForNewValue = true;
                this.updateDisplay();
                return;
            }
            return;
        }

        return this.performCalculation(firstValue, secondValue, operator);
    }

    performCalculation(firstValue, secondValue, operator) {
        let result;

        switch (operator) {
            case '+':
                result = firstValue + secondValue;
                break;
            case '-':
                result = firstValue - secondValue;
                break;
            case '*':
                result = firstValue * secondValue;
                break;
            case '/':
                if (secondValue === 0) {
                    alert('ゼロで割ることはできません');
                    return firstValue;
                }
                result = firstValue / secondValue;
                break;
            default:
                return secondValue;
        }

        return Math.round(result * 1000000000) / 1000000000;
    }

    getOperatorSymbol(operator) {
        const symbols = {
            '+': '+',
            '-': '-',
            '*': '×',
            '/': '÷'
        };
        return symbols[operator] || operator;
    }

    updateDisplay() {
        this.currentDisplay.textContent = this.currentValue;
        
        if (this.operator && this.previousValue !== '') {
            this.previousDisplay.textContent = `${this.previousValue} ${this.getOperatorSymbol(this.operator)}`;
        } else {
            this.previousDisplay.textContent = '';
        }
    }

    addToHistory(calculation) {
        this.history.unshift(calculation);
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        this.updateHistoryDisplay();
        this.saveHistory();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-item">履歴がここに表示されます</div>';
            return;
        }

        this.historyList.innerHTML = this.history
            .map(item => `<div class="history-item">${item}</div>`)
            .join('');
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveHistory();
    }

    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }

    handleKeyboardInput(e) {
        const key = e.key;
        
        // 数字入力
        if (/[0-9]/.test(key)) {
            this.inputNumber(key);
        }
        
        // 演算子入力
        else if (key === '+') {
            this.inputOperator('+');
        }
        else if (key === '-') {
            this.inputOperator('-');
        }
        else if (key === '*') {
            this.inputOperator('*');
        }
        else if (key === '/') {
            e.preventDefault();
            this.inputOperator('/');
        }
        
        // その他のアクション
        else if (key === '=' || key === 'Enter') {
            e.preventDefault();
            this.calculate();
        }
        else if (key === '.') {
            this.inputDecimal();
        }
        else if (key === 'Backspace') {
            this.backspace();
        }
        else if (key === 'Escape') {
            this.clear();
        }
        else if (key === 'Delete') {
            this.clearEntry();
        }
    }
}

// 電卓初期化
document.addEventListener('DOMContentLoaded', () => {
    new StylishCalculator();
    
    // ページロード時のアニメーション
    const calculator = document.querySelector('.calculator');
    const historySection = document.querySelector('.history-section');
    
    calculator.style.opacity = '0';
    calculator.style.transform = 'translateY(50px)';
    
    if (historySection) {
        historySection.style.opacity = '0';
        historySection.style.transform = 'translateY(50px)';
    }
    
    setTimeout(() => {
        calculator.style.transition = 'all 0.8s ease-out';
        calculator.style.opacity = '1';
        calculator.style.transform = 'translateY(0)';
        
        if (historySection) {
            setTimeout(() => {
                historySection.style.transition = 'all 0.8s ease-out';
                historySection.style.opacity = '1';
                historySection.style.transform = 'translateY(0)';
            }, 200);
        }
    }, 100);
});

// サービスワーカー登録（PWA対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}