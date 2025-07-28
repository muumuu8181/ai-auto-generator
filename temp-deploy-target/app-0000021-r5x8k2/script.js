class RhythmGame {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.isPlaying = false;
        this.difficulty = 'normal';
        this.notes = [];
        this.lanes = ['d', 'f', 'j', 'k'];
        this.speeds = { easy: 3, normal: 5, hard: 8 };
        this.noteIntervals = { easy: 1500, normal: 1000, hard: 600 };
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && this.lanes.includes(e.key)) {
                this.hitNote(e.key);
            }
        });
        
        // タッチイベント
        document.querySelectorAll('.lane').forEach(lane => {
            lane.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.isPlaying) {
                    this.hitNote(lane.dataset.key);
                }
            });
        });
    }
    
    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.updateDisplay();
        this.spawnNotes();
        this.gameLoop();
        
        document.getElementById('start-btn').disabled = true;
        setTimeout(() => this.endGame(), 60000); // 1分でゲーム終了
    }
    
    pauseGame() {
        this.isPlaying = !this.isPlaying;
        document.getElementById('pause-btn').textContent = this.isPlaying ? 'ポーズ' : '再開';
    }
    
    spawnNotes() {
        if (!this.isPlaying) return;
        
        const lane = Math.floor(Math.random() * 4);
        const laneElement = document.querySelectorAll('.lane')[lane];
        const note = document.createElement('div');
        note.className = 'note';
        note.style.animationDuration = `${this.speeds[this.difficulty]}s`;
        
        const noteObj = {
            element: note,
            lane: lane,
            startTime: Date.now()
        };
        
        this.notes.push(noteObj);
        laneElement.appendChild(note);
        
        setTimeout(() => {
            if (note.parentNode) {
                note.remove();
                this.notes = this.notes.filter(n => n !== noteObj);
                this.missNote();
            }
        }, this.speeds[this.difficulty] * 1000);
        
        setTimeout(() => this.spawnNotes(), this.noteIntervals[this.difficulty]);
    }
    
    hitNote(key) {
        const laneIndex = this.lanes.indexOf(key);
        const hitZone = document.querySelectorAll('.hit-zone')[laneIndex];
        
        // エフェクト
        hitZone.style.background = 'rgba(255, 255, 0, 0.8)';
        setTimeout(() => {
            hitZone.style.background = 'rgba(255,255,255,0.2)';
        }, 100);
        
        // ノートヒット判定
        const note = this.notes.find(n => n.lane === laneIndex);
        if (note) {
            const noteRect = note.element.getBoundingClientRect();
            const hitZoneRect = hitZone.getBoundingClientRect();
            
            if (Math.abs(noteRect.bottom - hitZoneRect.top) < 100) {
                this.score += 100 * (this.combo + 1);
                this.combo++;
                this.maxCombo = Math.max(this.maxCombo, this.combo);
                note.element.remove();
                this.notes = this.notes.filter(n => n !== note);
                this.updateDisplay();
            }
        }
    }
    
    missNote() {
        this.combo = 0;
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo;
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        requestAnimationFrame(() => this.gameLoop());
    }
    
    endGame() {
        this.isPlaying = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('max-combo').textContent = this.maxCombo;
        document.getElementById('result-modal').style.display = 'flex';
        
        // ノートをクリア
        this.notes.forEach(note => note.element.remove());
        this.notes = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RhythmGame();
});