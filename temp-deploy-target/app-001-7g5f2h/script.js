// Calculator State
let currentExpression = '';
let currentResult = '0';
let previousResult = '';
let history = [];
const MAX_HISTORY = 10;

// Elements
const expressionDisplay = document.getElementById('expression');
const resultDisplay = document.getElementById('result');
const historyDisplay = document.getElementById('history');
const historyList = document.getElementById('history-list');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeButtons();
    initializeThemeSwitcher();
    loadHistory();
    updateDisplay();
});

// Button Initialization
function initializeButtons() {
    // Number buttons
    document.querySelectorAll('.btn-number').forEach(btn => {
        btn.addEventListener('click', () => {
            const number = btn.getAttribute('data-number');
            handleNumber(number);
        });
    });

    // Operator buttons
    document.querySelectorAll('.btn-operator').forEach(btn => {
        btn.addEventListener('click', () => {
            const operator = btn.getAttribute('data-operator');
            handleOperator(operator);
        });
    });

    // Function buttons
    document.getElementById('clear').addEventListener('click', clear);
    document.getElementById('clear-all').addEventListener('click', clearAll);
    document.getElementById('backspace').addEventListener('click', backspace);
    document.getElementById('equals').addEventListener('click', calculate);
    document.getElementById('clear-history').addEventListener('click', clearHistory);

    // Keyboard support
    document.addEventListener('keydown', handleKeyboard);
}

// Theme Switcher
function initializeThemeSwitcher() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('calculatorTheme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    themeButtons.forEach(btn => {
        if (btn.getAttribute('data-theme') === savedTheme) {
            btn.classList.add('active');
        }
    });

    // Theme button clicks
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('calculatorTheme', theme);
            
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Number Input
function handleNumber(number) {
    if (currentExpression === '0' && number !== '.') {
        currentExpression = number;
    } else if (number === '.') {
        // Handle decimal point
        const lastNumber = getLastNumber();
        if (!lastNumber.includes('.')) {
            currentExpression += number;
        }
    } else {
        currentExpression += number;
    }
    updateDisplay();
}

// Operator Input
function handleOperator(operator) {
    if (currentExpression === '') {
        if (previousResult !== '') {
            currentExpression = previousResult + operator;
        }
    } else {
        const lastChar = currentExpression.slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) {
            // Replace last operator
            currentExpression = currentExpression.slice(0, -1) + operator;
        } else {
            currentExpression += operator;
        }
    }
    updateDisplay();
}

// Calculate Result
function calculate() {
    if (currentExpression === '') return;
    
    try {
        // Replace display symbols with math operators
        let mathExpression = currentExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');
        
        // Evaluate expression
        const result = eval(mathExpression);
        
        // Check for valid result
        if (isFinite(result)) {
            previousResult = result.toString();
            currentResult = formatResult(result);
            
            // Add to history
            addToHistory(currentExpression, currentResult);
            
            // Reset expression
            currentExpression = '';
            updateDisplay();
        }
    } catch (error) {
        currentResult = 'Error';
        updateDisplay();
        setTimeout(() => {
            currentResult = '0';
            updateDisplay();
        }, 1500);
    }
}

// Clear Functions
function clear() {
    currentExpression = '';
    currentResult = '0';
    updateDisplay();
}

function clearAll() {
    currentExpression = '';
    currentResult = '0';
    previousResult = '';
    historyDisplay.textContent = '';
    updateDisplay();
}

function backspace() {
    if (currentExpression.length > 0) {
        currentExpression = currentExpression.slice(0, -1);
        updateDisplay();
    }
}

// History Management
function addToHistory(expression, result) {
    const historyItem = {
        expression: expression,
        result: result,
        timestamp: Date.now()
    };
    
    history.unshift(historyItem);
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.pop();
    }
    
    saveHistory();
    displayHistory();
    
    // Update history display
    historyDisplay.textContent = `${expression} = ${result}`;
}

function displayHistory() {
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-item';
        historyElement.innerHTML = `
            <span class="history-expression">${item.expression}</span>
            <span class="history-result">${item.result}</span>
        `;
        
        historyElement.addEventListener('click', () => {
            currentExpression = item.expression;
            updateDisplay();
        });
        
        historyList.appendChild(historyElement);
    });
}

function clearHistory() {
    history = [];
    saveHistory();
    displayHistory();
    historyDisplay.textContent = '';
}

function saveHistory() {
    localStorage.setItem('calculatorHistory', JSON.stringify(history));
}

function loadHistory() {
    const saved = localStorage.getItem('calculatorHistory');
    if (saved) {
        history = JSON.parse(saved);
        displayHistory();
    }
}

// Utility Functions
function getLastNumber() {
    const matches = currentExpression.match(/(\d+\.?\d*)$/);
    return matches ? matches[0] : '';
}

function formatResult(number) {
    // Format large numbers
    if (Math.abs(number) > 1e9) {
        return number.toExponential(4);
    }
    // Round to 10 decimal places
    return parseFloat(number.toPrecision(10)).toString();
}

// Display Update
function updateDisplay() {
    expressionDisplay.textContent = currentExpression || '';
    resultDisplay.textContent = currentResult;
}

// Keyboard Support
function handleKeyboard(e) {
    e.preventDefault();
    
    if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
    } else if (e.key === '.') {
        handleNumber('.');
    } else if (e.key === '+' || e.key === '-') {
        handleOperator(e.key);
    } else if (e.key === '*') {
        handleOperator('*');
    } else if (e.key === '/') {
        handleOperator('/');
    } else if (e.key === 'Enter' || e.key === '=') {
        calculate();
    } else if (e.key === 'Escape') {
        clearAll();
    } else if (e.key === 'Backspace') {
        backspace();
    }
}

// Add button press animation
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 100);
    });
});