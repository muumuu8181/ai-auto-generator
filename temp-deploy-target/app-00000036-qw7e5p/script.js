// 暗号解読パズルゲーム実装
class CryptoPuzzleGame {
    constructor() {
        this.currentStage = 1;
        this.totalStages = 20;
        this.score = 0;
        this.timeLimit = 300; // 5分
        this.timeRemaining = this.timeLimit;
        this.timer = null;
        this.hintsUsed = 0;
        this.completedStages = [];
        this.statistics = {
            totalTime: 0,
            totalHints: 0,
            correctAnswers: 0,
            totalAttempts: 0
        };
        
        // ステージデータ
        this.stages = this.generateStages();
        this.currentCipher = null;
        
        this.init();
    }
    
    init() {
        this.createMatrixBackground();
        this.generateStageSelector();
        this.loadStage(1);
        this.loadStatistics();
        this.updateUI();
    }
    
    generateStages() {
        return [
            // レベル1-5: シーザー暗号
            {
                id: 1,
                title: "シーザー暗号 - 基本",
                type: "caesar",
                plaintext: "HELLO WORLD",
                key: 3,
                description: "各文字を3つずつ後ろにずらした暗号",
                hints: [
                    "これは最も古典的な暗号の一つです",
                    "各文字を同じ数だけ後ろにずらしています",
                    "キーは3です"
                ]
            },
            {
                id: 2,
                title: "シーザー暗号 - 中級",
                type: "caesar",
                plaintext: "CRYPTOGRAPHY IS FUN",
                key: 7,
                description: "キーが7のシーザー暗号",
                hints: [
                    "キーは7です",
                    "アルファベットを7つ後ろにずらしています",
                    "Cが→J、Rが→Yになります"
                ]
            },
            {
                id: 3,
                title: "シーザー暗号 - 逆回転",
                type: "caesar",
                plaintext: "REVERSE CIPHER",
                key: -5,
                description: "後ろではなく前にずらした暗号",
                hints: [
                    "今度は文字を前にずらしています",
                    "キーは負の数です",
                    "5つ前にずらしています"
                ]
            },
            {
                id: 4,
                title: "シーザー暗号 - 大きなキー",
                type: "caesar",
                plaintext: "BIG KEY CHALLENGE",
                key: 13,
                description: "キーが13のROT13暗号",
                hints: [
                    "これはROT13として知られています",
                    "キーは13です",
                    "同じ操作を2回すると元に戻ります"
                ]
            },
            {
                id: 5,
                title: "シーザー暗号 - 謎のキー",
                type: "caesar",
                plaintext: "MYSTERY KEY AWAITS",
                key: 11,
                description: "キーを推測してください",
                hints: [
                    "キーは1-25の間です",
                    "頻度分析を試してみてください",
                    "キーは11です"
                ]
            },
            
            // レベル6-10: アトバシュ暗号とその他
            {
                id: 6,
                title: "アトバシュ暗号",
                type: "atbash",
                plaintext: "ATBASH CIPHER",
                key: null,
                description: "アルファベットを逆順にマッピング",
                hints: [
                    "A=Z, B=Y, C=X... というマッピングです",
                    "アルファベットを鏡のように反転させます",
                    "古代ヘブライ語起源の暗号です"
                ]
            },
            {
                id: 7,
                title: "アルファベット置換",
                type: "substitution",
                plaintext: "SUBSTITUTION",
                key: "ZYXWVUTSRQPONMLKJIHGFEDCBA",
                description: "完全なアルファベット置換",
                hints: [
                    "各文字が別の文字に置き換えられています",
                    "アルファベットが逆順になっています",
                    "AはZ、BはY、CはXに対応します"
                ]
            },
            {
                id: 8,
                title: "シーザー暗号 - ランダムキー",
                type: "caesar",
                plaintext: "RANDOM KEY CIPHER",
                key: 19,
                description: "ランダムなキーのシーザー暗号",
                hints: [
                    "キーは大きな数です",
                    "19文字後ろにずらしています",
                    "Rが→Kになることを確認してください"
                ]
            },
            {
                id: 9,
                title: "逆アトバシュ",
                type: "reverse_atbash",
                plaintext: "REVERSE ATBASH",
                key: null,
                description: "文字列を逆にしてからアトバシュ",
                hints: [
                    "文字列が逆順になっています",
                    "さらにアトバシュ暗号が適用されています",
                    "2段階の処理が必要です"
                ]
            },
            {
                id: 10,
                title: "複合シーザー",
                type: "multi_caesar",
                plaintext: "MULTI CAESAR",
                key: [3, 7, 11],
                description: "複数のキーを使用するシーザー暗号",
                hints: [
                    "3つの異なるキーが循環使用されています",
                    "1文字目は+3、2文字目は+7、3文字目は+11",
                    "4文字目は再び+3に戻ります"
                ]
            },
            
            // レベル11-15: ヴィジュネル暗号
            {
                id: 11,
                title: "ヴィジュネル暗号 - 短いキー",
                type: "vigenere",
                plaintext: "VIGENERE CIPHER",
                key: "KEY",
                description: "キーワード暗号の入門",
                hints: [
                    "キーワードが繰り返し使用されます",
                    "キーワードは3文字です",
                    "キーワードは「KEY」です"
                ]
            },
            {
                id: 12,
                title: "ヴィジュネル暗号 - 中級",
                type: "vigenere",
                plaintext: "POLYALPHABETIC",
                key: "SECRET",
                description: "6文字のキーワード暗号",
                hints: [
                    "キーワードは6文字です",
                    "各文字で異なるシーザー暗号が適用されます",
                    "キーワードは「SECRET」です"
                ]
            },
            {
                id: 13,
                title: "ヴィジュネル暗号 - 長文",
                type: "vigenere",
                plaintext: "THIS IS A LONG MESSAGE FOR VIGENERE",
                key: "KEYWORD",
                description: "長い文章のヴィジュネル暗号",
                hints: [
                    "キーワードは7文字です",
                    "スペースは無視されます",
                    "キーワードは「KEYWORD」です"
                ]
            },
            {
                id: 14,
                title: "ヴィジュネル暗号 - 謎のキー",
                type: "vigenere",
                plaintext: "MYSTERY VIGENERE PUZZLE",
                key: "PUZZLE",
                description: "キーワードを推測してください",
                hints: [
                    "キーワードは6文字です",
                    "頻度分析とパターン認識を使用してください",
                    "キーワードは「PUZZLE」です"
                ]
            },
            {
                id: 15,
                title: "ヴィジュネル暗号 - 自動キー",
                type: "autokey_vigenere",
                plaintext: "AUTOKEY VIGENERE",
                key: "AUTO",
                description: "平文自体がキーに含まれる暗号",
                hints: [
                    "初期キーの後に平文が続きます",
                    "初期キーは4文字です",
                    "キーは「AUTO」で始まります"
                ]
            },
            
            // レベル16-20: 高難度暗号
            {
                id: 16,
                title: "ヒル暗号 2x2",
                type: "hill_2x2",
                plaintext: "HILL CIPHER",
                key: [[3, 2], [5, 7]],
                description: "行列を使用した数学的暗号",
                hints: [
                    "2x2行列を使用した暗号です",
                    "線形代数の知識が必要です",
                    "行列は [[3,2],[5,7]] です"
                ]
            },
            {
                id: 17,
                title: "レイルフェンス暗号",
                type: "railfence",
                plaintext: "RAILFENCE CIPHER",
                key: 3,
                description: "ジグザグパターンの配置暗号",
                hints: [
                    "文字がジグザグに配置されます",
                    "3つのレールを使用します",
                    "上から順番に読み取ります"
                ]
            },
            {
                id: 18,
                title: "プレイフェア暗号",
                type: "playfair",
                plaintext: "PLAYFAIR",
                key: "MONARCHY",
                description: "5x5グリッドを使用したペア暗号",
                hints: [
                    "文字をペアで暗号化します",
                    "5x5のキーグリッドを使用します",
                    "キーワードは「MONARCHY」です"
                ]
            },
            {
                id: 19,
                title: "四方暗号",
                type: "four_square",
                plaintext: "FOUR SQUARE",
                key: ["EXAMPLE", "KEYWORD"],
                description: "4つの5x5グリッドを使用",
                hints: [
                    "4つの正方形グリッドを使用します",
                    "2つのキーワードが必要です",
                    "キーワードは「EXAMPLE」と「KEYWORD」です"
                ]
            },
            {
                id: 20,
                title: "最終チャレンジ",
                type: "mixed_cipher",
                plaintext: "CONGRATULATIONS YOU WIN",
                key: { caesar: 7, vigenere: "FINAL" },
                description: "複数の暗号技術の組み合わせ",
                hints: [
                    "複数の暗号が組み合わされています",
                    "まずヴィジュネル、次にシーザーが適用されています",
                    "ヴィジュネルキー「FINAL」、シーザーキー7"
                ]
            }
        ];
    }
    
    createMatrixBackground() {
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = Array(columns).fill(0);
        
        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(15, 15, 35, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px monospace`;
            
            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        
        setInterval(drawMatrix, 50);
        
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
    
    generateStageSelector() {
        const selector = document.getElementById('stageSelector');
        selector.innerHTML = '';
        
        for (let i = 1; i <= this.totalStages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'stage-btn';
            btn.onclick = () => this.loadStage(i);
            
            if (this.completedStages.includes(i)) {
                btn.classList.add('completed');
            }
            if (i === this.currentStage) {
                btn.classList.add('current');
            }
            
            selector.appendChild(btn);
        }
    }
    
    loadStage(stageNumber) {
        if (stageNumber < 1 || stageNumber > this.totalStages) return;
        
        this.currentStage = stageNumber;
        const stage = this.stages[stageNumber - 1];
        this.currentCipher = stage;
        
        // UIの更新
        document.getElementById('stageTitle').textContent = `ステージ ${stageNumber}: ${stage.title}`;
        
        // 暗号文の生成と表示
        const ciphertext = this.encrypt(stage.plaintext, stage.key, stage.type);
        this.displayCipherText(ciphertext);
        
        // 入力欄のクリア
        document.getElementById('keyInput').value = '';
        document.getElementById('answerInput').value = '';
        
        // ヒントのリセット
        this.resetHints();
        
        // タイマーのリセット
        this.resetTimer();
        
        // ステージセレクターの更新
        this.generateStageSelector();
        
        // フィードバックのクリア
        this.hideFeedback();
        
        this.updateUI();
    }
    
    encrypt(plaintext, key, type) {
        const text = plaintext.replace(/[^A-Z]/g, '');
        
        switch (type) {
            case 'caesar':
                return this.caesarEncrypt(text, key);
            case 'atbash':
                return this.atbashEncrypt(text);
            case 'substitution':
                return this.substitutionEncrypt(text, key);
            case 'reverse_atbash':
                return this.atbashEncrypt(text.split('').reverse().join(''));
            case 'multi_caesar':
                return this.multiCaesarEncrypt(text, key);
            case 'vigenere':
                return this.vigenereEncrypt(text, key);
            case 'autokey_vigenere':
                return this.autokeyVigenereEncrypt(text, key);
            case 'railfence':
                return this.railfenceEncrypt(text, key);
            case 'mixed_cipher':
                let result = this.vigenereEncrypt(text, key.vigenere);
                return this.caesarEncrypt(result, key.caesar);
            default:
                return text;
        }
    }
    
    caesarEncrypt(text, shift) {
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode((char.charCodeAt(0) - 65 + shift + 26) % 26 + 65);
            }
            return char;
        }).join('');
    }
    
    atbashEncrypt(text) {
        return text.split('').map(char => {
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode(90 - (char.charCodeAt(0) - 65));
            }
            return char;
        }).join('');
    }
    
    substitutionEncrypt(text, key) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return text.split('').map(char => {
            const index = alphabet.indexOf(char);
            return index !== -1 ? key[index] : char;
        }).join('');
    }
    
    multiCaesarEncrypt(text, keys) {
        return text.split('').map((char, index) => {
            const shift = keys[index % keys.length];
            if (char >= 'A' && char <= 'Z') {
                return String.fromCharCode((char.charCodeAt(0) - 65 + shift) % 26 + 65);
            }
            return char;
        }).join('');
    }
    
    vigenereEncrypt(text, key) {
        const keyText = key.repeat(Math.ceil(text.length / key.length)).substr(0, text.length);
        return text.split('').map((char, index) => {
            if (char >= 'A' && char <= 'Z') {
                const shift = keyText.charCodeAt(index) - 65;
                return String.fromCharCode((char.charCodeAt(0) - 65 + shift) % 26 + 65);
            }
            return char;
        }).join('');
    }
    
    autokeyVigenereEncrypt(text, key) {
        const fullKey = (key + text).substr(0, text.length);
        return this.vigenereEncrypt(text, fullKey);
    }
    
    railfenceEncrypt(text, rails) {
        const fence = Array(rails).fill().map(() => []);
        let rail = 0;
        let direction = 1;
        
        for (let char of text) {
            fence[rail].push(char);
            rail += direction;
            if (rail === rails - 1 || rail === 0) {
                direction = -direction;
            }
        }
        
        return fence.flat().join('');
    }
    
    displayCipherText(ciphertext) {
        const display = document.getElementById('cipherText');
        display.textContent = '';
        display.style.animation = 'none';
        
        setTimeout(() => {
            display.textContent = this.formatCipherText(ciphertext);
            display.style.animation = 'typewriter 3s steps(40) forwards';
        }, 100);
    }
    
    formatCipherText(text) {
        // 5文字ごとにスペースを入れて読みやすくする
        return text.match(/.{1,5}/g).join(' ');
    }
    
    submitAnswer() {
        const keyInput = document.getElementById('keyInput').value.toUpperCase();
        const answerInput = document.getElementById('answerInput').value.toUpperCase().replace(/[^A-Z]/g, '');
        
        this.statistics.totalAttempts++;
        
        // 正解チェック
        const correctAnswer = this.currentCipher.plaintext.replace(/[^A-Z]/g, '');
        
        if (answerInput === correctAnswer) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
    }
    
    handleCorrectAnswer() {
        this.statistics.correctAnswers++;
        this.statistics.totalTime += (this.timeLimit - this.timeRemaining);
        
        // スコア計算
        const timeBonus = Math.floor(this.timeRemaining * 2);
        const hintPenalty = this.hintsUsed * 50;
        const stageBonus = this.currentStage * 100;
        const earnedScore = Math.max(100, stageBonus + timeBonus - hintPenalty);
        
        this.score += earnedScore;
        this.completedStages.push(this.currentStage);
        
        this.showFeedback(`正解！ +${earnedScore}点`, 'success');
        
        // 次のステージに進む
        setTimeout(() => {
            if (this.currentStage < this.totalStages) {
                this.loadStage(this.currentStage + 1);
            } else {
                this.completeGame();
            }
        }, 2000);
        
        this.saveStatistics();
        this.updateUI();
    }
    
    handleIncorrectAnswer() {
        this.showFeedback('不正解です。もう一度試してください。', 'error');
        this.score = Math.max(0, this.score - 25);
        this.updateUI();
    }
    
    getHint() {
        const hints = this.currentCipher.hints;
        if (this.hintsUsed < hints.length) {
            const hintElement = document.createElement('div');
            hintElement.className = 'hint-item revealed';
            hintElement.textContent = `💡 ${hints[this.hintsUsed]}`;
            
            document.getElementById('hintsContainer').appendChild(hintElement);
            
            this.hintsUsed++;
            this.statistics.totalHints++;
            this.score = Math.max(0, this.score - 50);
            
            this.updateUI();
        }
    }
    
    skipStage() {
        if (confirm('このステージをスキップしますか？（スコアが大幅に減少します）')) {
            this.score = Math.max(0, this.score - 200);
            if (this.currentStage < this.totalStages) {
                this.loadStage(this.currentStage + 1);
            }
        }
    }
    
    resetStage() {
        this.loadStage(this.currentStage);
    }
    
    resetHints() {
        this.hintsUsed = 0;
        const container = document.getElementById('hintsContainer');
        container.innerHTML = '<div class=\"hint-item\">ヒントを使用すると、スコアが減少します</div>';
    }
    
    resetTimer() {
        this.timeRemaining = this.timeLimit;
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();
            
            if (this.timeRemaining <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    handleTimeUp() {
        clearInterval(this.timer);
        this.showFeedback('時間切れです！', 'error');
        this.score = Math.max(0, this.score - 100);
        
        setTimeout(() => {
            if (this.currentStage < this.totalStages) {
                this.loadStage(this.currentStage + 1);
            }
        }, 2000);
    }
    
    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
        feedback.style.display = 'block';
        
        setTimeout(() => {
            this.hideFeedback();
        }, 3000);
    }
    
    hideFeedback() {
        document.getElementById('feedback').style.display = 'none';
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('completedStages').textContent = this.completedStages.length;
        document.getElementById('hintsUsed').textContent = this.statistics.totalHints;
        
        const progress = (this.completedStages.length / this.totalStages) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        
        // 統計の更新
        if (this.statistics.correctAnswers > 0) {
            const avgTime = Math.floor(this.statistics.totalTime / this.statistics.correctAnswers);
            const minutes = Math.floor(avgTime / 60);
            const seconds = avgTime % 60;
            document.getElementById('avgTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const accuracy = Math.floor((this.statistics.correctAnswers / this.statistics.totalAttempts) * 100);
            document.getElementById('accuracy').textContent = `${accuracy}%`;
        }
        
        const bestScore = localStorage.getItem('cryptoPuzzleBestScore') || '0';
        document.getElementById('bestScore').textContent = bestScore;
        
        if (this.score > parseInt(bestScore)) {
            localStorage.setItem('cryptoPuzzleBestScore', this.score.toString());
            document.getElementById('bestScore').textContent = this.score;
        }
    }
    
    saveStatistics() {
        localStorage.setItem('cryptoPuzzleStats', JSON.stringify(this.statistics));
        localStorage.setItem('cryptoPuzzleCompleted', JSON.stringify(this.completedStages));
        localStorage.setItem('cryptoPuzzleScore', this.score.toString());
    }
    
    loadStatistics() {
        const stats = localStorage.getItem('cryptoPuzzleStats');
        if (stats) {
            this.statistics = JSON.parse(stats);
        }
        
        const completed = localStorage.getItem('cryptoPuzzleCompleted');
        if (completed) {
            this.completedStages = JSON.parse(completed);
        }
        
        const score = localStorage.getItem('cryptoPuzzleScore');
        if (score) {
            this.score = parseInt(score);
        }
    }
    
    completeGame() {
        alert(`🎉 ゲームクリア！\\n最終スコア: ${this.score}\\n\\nすべての暗号を解読しました！`);
        
        // ハイスコアの更新
        const bestScore = localStorage.getItem('cryptoPuzzleBestScore') || '0';
        if (this.score > parseInt(bestScore)) {
            localStorage.setItem('cryptoPuzzleBestScore', this.score.toString());
            alert('🏆 新記録達成！');
        }
    }
}

// グローバル関数
let game;

function submitAnswer() {
    game.submitAnswer();
}

function getHint() {
    game.getHint();
}

function skipStage() {
    game.skipStage();
}

function resetStage() {
    game.resetStage();
}

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    game = new CryptoPuzzleGame();
});