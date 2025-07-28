// 電卓クラス
class Calculator {
    constructor() {
        this.displayValue = '0';
        this.firstOperand = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.history = [];
        this.currentExpression = '';
        
        this.initializeElements();
        this.addEventListeners();
        this.loadTheme();
        this.loadHistory();
    }

    initializeElements() {
        this.display = document.getElementById('display');
        this.historyDisplay = document.getElementById('history');
        this.historyList = document.getElementById('history-list');
        this.numberButtons = document.querySelectorAll('.number');
        this.operatorButtons = document.querySelectorAll('.operator');
        this.clearButton = document.getElementById('clear');
        this.deleteButton = document.getElementById('delete');
        this.percentButton = document.getElementById('percent');
        this.equalsButton = document.getElementById('equals');
        this.clearHistoryButton = document.getElementById('clear-history');
        this.themeButtons = document.querySelectorAll('.theme-btn');
    }

    addEventListeners() {
        // 数字ボタン
        this.numberButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.inputNumber(button.dataset.num);
                this.animateButton(button);
            });
        });

        // 演算子ボタン
        this.operatorButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.inputOperator(button.dataset.op);
                this.animateButton(button);
            });
        });

        // その他のボタン
        this.clearButton.addEventListener('click', () => {
            this.clear();
            this.animateButton(this.clearButton);
        });

        this.deleteButton.addEventListener('click', () => {
            this.delete();
            this.animateButton(this.deleteButton);
        });

        this.percentButton.addEventListener('click', () => {
            this.percent();
            this.animateButton(this.percentButton);
        });

        this.equalsButton.addEventListener('click', () => {
            this.calculate();
            this.animateButton(this.equalsButton);
        });

        this.clearHistoryButton.addEventListener('click', () => {
            this.clearHistory();
        });

        // テーマボタン
        this.themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.changeTheme(button.dataset.theme);
            });
        });

        // キーボードサポート
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    inputNumber(num) {
        if (this.waitingForOperand) {
            this.displayValue = num;
            this.waitingForOperand = false;
        } else {
            this.displayValue = this.displayValue === '0' ? num : this.displayValue + num;
        }
        
        // 小数点の重複を防ぐ
        if (num === '.' && this.displayValue.includes('.')) {
            return;
        }
        
        this.updateDisplay();
    }

    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.displayValue);

        if (this.firstOperand === null) {
            this.firstOperand = inputValue;
        } else if (this.operator) {
            const result = this.performCalculation();
            this.displayValue = `${parseFloat(result.toFixed(7))}`;
            this.firstOperand = result;
        }

        this.waitingForOperand = true;
        this.operator = nextOperator;
        
        // 式を表示
        this.currentExpression = `${this.firstOperand} ${nextOperator}`;
        this.historyDisplay.textContent = this.currentExpression;
        
        this.updateDisplay();
    }

    performCalculation() {
        const inputValue = parseFloat(this.displayValue);
        let result = 0;

        switch (this.operator) {
            case '+':
                result = this.firstOperand + inputValue;
                break;
            case '-':
                result = this.firstOperand - inputValue;
                break;
            case '×':
                result = this.firstOperand * inputValue;
                break;
            case '÷':
                result = this.firstOperand / inputValue;
                break;
        }

        return result;
    }

    calculate() {
        if (this.operator && this.firstOperand !== null) {
            const inputValue = parseFloat(this.displayValue);
            const result = this.performCalculation();
            
            // 履歴に追加
            const expression = `${this.firstOperand} ${this.operator} ${inputValue}`;
            this.addToHistory(expression, result);
            
            // 結果を表示
            this.displayValue = `${parseFloat(result.toFixed(7))}`;
            this.firstOperand = null;
            this.operator = null;
            this.waitingForOperand = false;
            this.currentExpression = '';
            this.historyDisplay.textContent = '';
            
            this.updateDisplay();
        }
    }

    clear() {
        this.displayValue = '0';
        this.firstOperand = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.currentExpression = '';
        this.historyDisplay.textContent = '';
        this.updateDisplay();
    }

    delete() {
        if (this.displayValue.length > 1) {
            this.displayValue = this.displayValue.slice(0, -1);
        } else {
            this.displayValue = '0';
        }
        this.updateDisplay();
    }

    percent() {
        const value = parseFloat(this.displayValue);
        this.displayValue = `${value / 100}`;
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = this.displayValue;
    }

    addToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date().toISOString()
        };
        
        this.history.unshift(historyItem);
        
        // 最大50件まで保存
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">まだ履歴がありません</p>';
            return;
        }

        this.historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
            </div>
        `).join('');

        // 履歴アイテムのクリックイベント
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const historyItem = this.history[index];
                this.displayValue = `${historyItem.result}`;
                this.updateDisplay();
            });
        });
    }

    clearHistory() {
        if (confirm('履歴をすべて削除しますか？')) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryDisplay();
        }
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

    changeTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('calculatorTheme', theme);
    }

    loadTheme() {
        const saved = localStorage.getItem('calculatorTheme');
        if (saved) {
            document.body.setAttribute('data-theme', saved);
        }
    }

    animateButton(button) {
        button.classList.add('animate');
        setTimeout(() => {
            button.classList.remove('animate');
        }, 300);
    }

    handleKeyPress(e) {
        e.preventDefault();
        
        // 数字キー
        if (e.key >= '0' && e.key <= '9') {
            const button = document.querySelector(`[data-num="${e.key}"]`);
            if (button) {
                button.click();
            }
        }
        
        // 演算子キー
        const operatorMap = {
            '+': '+',
            '-': '-',
            '*': '×',
            '/': '÷',
            'Enter': '=',
            'Escape': 'AC',
            'Backspace': 'DEL',
            '.': '.',
            '%': '%'
        };
        
        if (operatorMap[e.key]) {
            if (e.key === 'Enter') {
                this.equalsButton.click();
            } else if (e.key === 'Escape') {
                this.clearButton.click();
            } else if (e.key === 'Backspace') {
                this.deleteButton.click();
            } else if (e.key === '%') {
                this.percentButton.click();
            } else if (e.key === '.') {
                const button = document.querySelector(`[data-num="."]`);
                if (button) button.click();
            } else {
                const button = document.querySelector(`[data-op="${operatorMap[e.key]}"]`);
                if (button) button.click();
            }
        }
    }
}

// 電卓インスタンスを作成
const calculator = new Calculator();