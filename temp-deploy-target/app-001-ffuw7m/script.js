// Clock System
class ClockSystem {
    constructor() {
        this.currentTheme = 'neon';
        this.currentClock = 'digital';
        this.timerInterval = null;
        this.stopwatchInterval = null;
        this.stopwatchTime = 0;
        this.init();
    }

    init() {
        this.setupThemeSelector();
        this.setupClockSelector();
        this.setupTimer();
        this.setupStopwatch();
        this.startClock();
        this.createHourMarks();
    }

    setupThemeSelector() {
        const themeBtns = document.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTheme = btn.dataset.theme;
                document.body.setAttribute('data-theme', this.currentTheme);
            });
        });
        themeBtns[0].classList.add('active');
    }

    setupClockSelector() {
        const clockBtns = document.querySelectorAll('.clock-btn');
        const clockDisplays = document.querySelectorAll('.clock-display');
        
        clockBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                clockBtns.forEach(b => b.classList.remove('active'));
                clockDisplays.forEach(d => d.classList.remove('active'));
                
                btn.classList.add('active');
                this.currentClock = btn.dataset.clock;
                document.getElementById(`${this.currentClock}-clock`).classList.add('active');
            });
        });
    }

    startClock() {
        const updateClocks = () => {
            const now = new Date();
            
            // Update Digital Clock
            this.updateDigitalClock(now);
            
            // Update Analog Clock
            this.updateAnalogClock(now);
            
            // Update Binary Clock
            this.updateBinaryClock(now);
            
            requestAnimationFrame(updateClocks);
        };
        
        updateClocks();
    }

    updateDigitalClock(now) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        
        document.querySelector('.hours').textContent = hours;
        document.querySelector('.minutes').textContent = minutes;
        document.querySelector('.seconds').textContent = seconds;
        document.querySelector('.milliseconds').textContent = `.${milliseconds}`;
        
        // Update date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('ja-JP', options);
        document.querySelector('.date-display').textContent = dateStr;
    }

    updateAnalogClock(now) {
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();
        
        const hourDeg = (hours * 30) + (minutes * 0.5);
        const minuteDeg = (minutes * 6) + (seconds * 0.1);
        const secondDeg = (seconds * 6) + (milliseconds * 0.006);
        
        document.querySelector('.hour-hand').style.transform = `rotate(${hourDeg}deg)`;
        document.querySelector('.minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
        document.querySelector('.second-hand').style.transform = `rotate(${secondDeg}deg)`;
    }

    updateBinaryClock(now) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        this.updateBinaryColumn('hours-tens', Math.floor(hours / 10), 2);
        this.updateBinaryColumn('hours-ones', hours % 10, 4);
        this.updateBinaryColumn('minutes-tens', Math.floor(minutes / 10), 3);
        this.updateBinaryColumn('minutes-ones', minutes % 10, 4);
        this.updateBinaryColumn('seconds-tens', Math.floor(seconds / 10), 3);
        this.updateBinaryColumn('seconds-ones', seconds % 10, 4);
    }

    updateBinaryColumn(id, value, bits) {
        const column = document.getElementById(id);
        column.innerHTML = '';
        
        for (let i = bits - 1; i >= 0; i--) {
            const bit = document.createElement('div');
            bit.className = 'binary-bit';
            if (value & (1 << i)) {
                bit.classList.add('on');
            }
            column.appendChild(bit);
        }
    }

    createHourMarks() {
        const hourMarks = document.querySelector('.hour-marks');
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = 100 + Math.sin(angle) * 85;
            const y1 = 100 - Math.cos(angle) * 85;
            const x2 = 100 + Math.sin(angle) * 92;
            const y2 = 100 - Math.cos(angle) * 92;
            
            const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            mark.setAttribute('x1', x1);
            mark.setAttribute('y1', y1);
            mark.setAttribute('x2', x2);
            mark.setAttribute('y2', y2);
            mark.setAttribute('stroke', 'var(--accent)');
            mark.setAttribute('stroke-width', i % 3 === 0 ? '3' : '1');
            hourMarks.appendChild(mark);
        }
    }

    // Timer Functions
    setupTimer() {
        const startBtn = document.getElementById('timer-start');
        const stopBtn = document.getElementById('timer-stop');
        const display = document.querySelector('.timer-display');
        
        startBtn.addEventListener('click', () => {
            const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
            const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
            let totalSeconds = minutes * 60 + seconds;
            
            if (totalSeconds <= 0) return;
            
            clearInterval(this.timerInterval);
            
            this.timerInterval = setInterval(() => {
                totalSeconds--;
                const displayMinutes = Math.floor(totalSeconds / 60);
                const displaySeconds = totalSeconds % 60;
                display.textContent = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;
                
                if (totalSeconds <= 0) {
                    clearInterval(this.timerInterval);
                    display.style.animation = 'blink 0.5s 5';
                    setTimeout(() => {
                        display.style.animation = '';
                    }, 2500);
                }
            }, 1000);
        });
        
        stopBtn.addEventListener('click', () => {
            clearInterval(this.timerInterval);
            display.textContent = '00:00';
        });
    }

    // Stopwatch Functions
    setupStopwatch() {
        const startBtn = document.getElementById('stopwatch-start');
        const stopBtn = document.getElementById('stopwatch-stop');
        const resetBtn = document.getElementById('stopwatch-reset');
        const display = document.querySelector('.stopwatch-display');
        
        startBtn.addEventListener('click', () => {
            if (!this.stopwatchInterval) {
                const startTime = Date.now() - this.stopwatchTime;
                
                this.stopwatchInterval = setInterval(() => {
                    this.stopwatchTime = Date.now() - startTime;
                    const totalSeconds = Math.floor(this.stopwatchTime / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    
                    display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }, 10);
            }
        });
        
        stopBtn.addEventListener('click', () => {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
        });
        
        resetBtn.addEventListener('click', () => {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
            this.stopwatchTime = 0;
            display.textContent = '00:00:00';
        });
    }
}

// Initialize the clock system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ClockSystem();
});