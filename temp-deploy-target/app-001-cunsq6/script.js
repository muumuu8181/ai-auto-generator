class StylishCalculator {
    constructor() {
        this.display = document.getElementById('result');
        this.expression = document.getElementById('expression');
        this.historyPanel = document.getElementById('history-panel');
        this.historyList = document.getElementById('history-list');
        
        this.currentValue = '0';
        this.previousValue = '';
        this.operator = null;
        this.shouldResetDisplay = false;
        this.history = this.loadHistory();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.renderHistory();
    }

    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = btn.dataset.num;
                this.inputNumber(num);
            });
        });

        // Operator buttons
        document.querySelectorAll('.operator').forEach(btn => {
            btn.addEventListener('click', () => {
                const op = btn.dataset.op;
                this.inputOperator(op);
            });
        });

        // Function buttons
        document.getElementById('clear').addEventListener('click', () => this.clear());
        document.getElementById('delete').addEventListener('click', () => this.delete());
        document.getElementById('percent').addEventListener('click', () => this.percent());
        document.getElementById('equals').addEventListener('click', () => this.calculate());

        // History buttons
        document.getElementById('history-btn').addEventListener('click', () => this.toggleHistory());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        document.getElementById('download-history').addEventListener('click', () => this.downloadHistory());

        // Theme switcher
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.body.setAttribute('data-theme', btn.dataset.theme);
                localStorage.setItem('calculator-theme', btn.dataset.theme);
            });
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Load saved theme
        const savedTheme = localStorage.getItem('calculator-theme') || 'neon';
        document.body.setAttribute('data-theme', savedTheme);
        document.querySelector(`[data-theme="${savedTheme}"]`).classList.add('active');
    }

    inputNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentValue = '0';
            this.shouldResetDisplay = false;
        }

        if (num === '.') {
            if (this.currentValue.includes('.')) return;
            if (this.currentValue === '0') {
                this.currentValue = '0.';
            } else {
                this.currentValue += '.';
            }
        } else {
            if (this.currentValue === '0') {
                this.currentValue = num;
            } else {
                this.currentValue += num;
            }
        }

        this.updateDisplay();
    }

    inputOperator(op) {
        if (this.operator && !this.shouldResetDisplay) {
            this.calculate();
        }

        this.previousValue = this.currentValue;
        this.operator = op;
        this.shouldResetDisplay = true;
        this.updateExpression();
    }

    calculate() {
        if (!this.operator || !this.previousValue) return;

        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result;

        switch (this.operator) {
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
                    this.currentValue = 'Error';
                    this.updateDisplay();
                    this.shouldResetDisplay = true;
                    return;
                }
                result = prev / current;
                break;
        }

        const expression = `${this.previousValue} ${this.operator} ${this.currentValue}`;
        this.currentValue = this.formatResult(result);
        
        // Add to history
        this.addToHistory(expression, this.currentValue);
        
        // Reset for next calculation
        this.operator = null;
        this.previousValue = '';
        this.shouldResetDisplay = true;
        
        this.updateDisplay();
        this.expression.textContent = '';
    }

    formatResult(result) {
        // Handle very large or very small numbers
        if (Math.abs(result) > 999999999999) {
            return result.toExponential(6);
        }
        
        // Round to avoid floating point issues
        const rounded = Math.round(result * 100000000) / 100000000;
        
        // Convert to string and remove trailing zeros
        return rounded.toString();
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operator = null;
        this.shouldResetDisplay = false;
        this.updateDisplay();
        this.expression.textContent = '';
    }

    delete() {
        if (this.currentValue !== '0' && this.currentValue !== 'Error') {
            if (this.currentValue.length === 1) {
                this.currentValue = '0';
            } else {
                this.currentValue = this.currentValue.slice(0, -1);
            }
            this.updateDisplay();
        }
    }

    percent() {
        const value = parseFloat(this.currentValue);
        this.currentValue = this.formatResult(value / 100);
        this.updateDisplay();
    }

    updateDisplay() {
        this.display.textContent = this.currentValue;
    }

    updateExpression() {
        if (this.operator) {
            this.expression.textContent = `${this.previousValue} ${this.operator}`;
        }
    }

    handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9' || e.key === '.') {
            e.preventDefault();
            this.inputNumber(e.key);
        } else if (e.key === '+' || e.key === '-') {
            e.preventDefault();
            this.inputOperator(e.key);
        } else if (e.key === '*') {
            e.preventDefault();
            this.inputOperator('×');
        } else if (e.key === '/') {
            e.preventDefault();
            this.inputOperator('÷');
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.calculate();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.clear();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.delete();
        } else if (e.key === '%') {
            e.preventDefault();
            this.percent();
        }
    }

    // History Management
    toggleHistory() {
        this.historyPanel.classList.toggle('active');
    }

    addToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date().toISOString()
        };
        
        this.history.unshift(historyItem);
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        this.historyList.innerHTML = '';
        
        this.history.forEach((item, index) => {
            const historyEl = document.createElement('div');
            historyEl.className = 'history-item';
            historyEl.innerHTML = `
                <div class="history-expression">${item.expression} =</div>
                <div class="history-result">${item.result}</div>
            `;
            
            historyEl.addEventListener('click', () => {
                this.currentValue = item.result;
                this.updateDisplay();
                this.shouldResetDisplay = true;
            });
            
            this.historyList.appendChild(historyEl);
        });
    }

    clearHistory() {
        if (confirm('履歴をすべて削除しますか？')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }

    downloadHistory() {
        const historyText = this.history.map(item => {
            const date = new Date(item.timestamp).toLocaleString('ja-JP');
            return `${date}: ${item.expression} = ${item.result}`;
        }).join('\n');
        
        const blob = new Blob([historyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculator-history-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    saveHistory() {
        localStorage.setItem('calculator-history', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('calculator-history');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new StylishCalculator();
});