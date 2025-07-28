// Word Palette - 創造的物語作成ツール
class WordPalette {
    constructor() {
        this.words = {
            mixed: [
                '魔法', '冒険', '星', '海', '山', '森', '城', '村', '橋', '川',
                '愛', '希望', '勇気', '友情', '夢', '謎', '秘密', '宝物', '旅', '家族'
            ],
            fantasy: [
                'ドラゴン', '魔法使い', 'エルフ', 'ドワーフ', '妖精', '騎士', '王国', '魔法の剣',
                '呪文', '魔法の森', 'クリスタル', '古代の呪い', '伝説', '予言', '魔法の杖'
            ],
            science: [
                'ロボット', 'AI', '宇宙', '惑星', '実験', '発明', '研究', 'タイムマシン',
                'テクノロジー', '未来', '科学者', 'データ', 'アルゴリズム', 'バイオ', 'エネルギー'
            ],
            nature: [
                '花', '鳥', '雲', '雨', '雪', '風', '太陽', '月', '虹', '蝶',
                '木', '葉', '種', '根', '枝', '果実', '季節', '朝露', '夕焼け', '星空'
            ],
            emotion: [
                '喜び', '悲しみ', '怒り', '驚き', '安心', '不安', '興奮', '静寂',
                '温かさ', '冷たさ', '優しさ', '強さ', '弱さ', '孤独', '連帯', '感謝'
            ],
            action: [
                '走る', '飛ぶ', '泳ぐ', '踊る', '歌う', '叫ぶ', '笑う', '泣く',
                '戦う', '守る', '助ける', '探す', '見つける', '作る', '壊す', '修理する'
            ]
        };
        
        this.currentStory = [];
        this.savedStories = this.loadStories();
        this.currentEditingId = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateWords();
        this.renderSavedStories();
        this.updateWordCount();
        console.log('🎨 Word Palette initialized');
    }
    
    setupEventListeners() {
        // 単語生成
        document.getElementById('refreshWords').addEventListener('click', () => {
            this.generateWords();
        });
        
        // カテゴリ変更
        document.getElementById('categorySelect').addEventListener('change', () => {
            this.generateWords();
        });
        
        // 物語操作
        document.getElementById('clearStory').addEventListener('click', () => {
            this.clearStory();
        });
        
        document.getElementById('saveStory').addEventListener('click', () => {
            this.saveStory();
        });
        
        document.getElementById('exportStory').addEventListener('click', () => {
            this.exportStory();
        });
        
        // モーダル
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('deleteStory').addEventListener('click', () => {
            this.deleteCurrentStory();
        });
        
        document.getElementById('editStory').addEventListener('click', () => {
            this.editCurrentStory();
        });
        
        // モーダル外クリック
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveStory();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.generateWords();
                        break;
                    case 'Delete':
                        e.preventDefault();
                        this.clearStory();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    generateWords() {
        const category = document.getElementById('categorySelect').value;
        const container = document.getElementById('wordContainer');
        
        // アニメーション効果
        container.style.opacity = '0.5';
        
        setTimeout(() => {
            container.innerHTML = '';
            
            let selectedWords;
            if (category === 'mixed') {
                selectedWords = this.getRandomWordsFromAllCategories(15);
            } else {
                selectedWords = this.getRandomWords(this.words[category], 15);
            }
            
            selectedWords.forEach((word, index) => {
                setTimeout(() => {
                    const wordChip = this.createWordChip(word, category);
                    container.appendChild(wordChip);
                }, index * 50);
            });
            
            container.style.opacity = '1';
            this.showFeedback('新しい単語を生成しました！', 'info');
        }, 200);
    }
    
    getRandomWordsFromAllCategories(count) {
        const allWords = [];
        Object.keys(this.words).forEach(category => {
            if (category !== 'mixed') {
                allWords.push(...this.words[category]);
            }
        });
        
        return this.getRandomWords(allWords, count);
    }
    
    getRandomWords(wordArray, count) {
        const shuffled = [...wordArray].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    createWordChip(word, category) {
        const chip = document.createElement('div');
        chip.className = `word-chip ${category !== 'mixed' ? category : ''}`;
        chip.textContent = word;
        chip.draggable = true;
        chip.tabIndex = 0;
        
        // ドラッグイベント
        chip.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', word);
            chip.style.opacity = '0.5';
        });
        
        chip.addEventListener('dragend', () => {
            chip.style.opacity = '1';
        });
        
        // キーボード操作
        chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.addWordToStory(word);
            }
        });
        
        // ダブルクリックで追加
        chip.addEventListener('dblclick', () => {
            this.addWordToStory(word);
        });
        
        return chip;
    }
    
    addWordToStory(word) {
        this.currentStory.push(word);
        this.renderStory();
        this.updateWordCount();
        
        // 視覚的フィードバック
        const storyArea = document.getElementById('storyArea');
        storyArea.style.backgroundColor = 'rgba(78, 205, 196, 0.2)';
        setTimeout(() => {
            storyArea.style.backgroundColor = '';
        }, 200);
    }
    
    renderStory() {
        const storyArea = document.getElementById('storyArea');
        
        if (this.currentStory.length === 0) {
            storyArea.innerHTML = '<p class="placeholder">ここに単語をドラッグ&ドロップして物語を作成してください...</p>';
            return;
        }
        
        const storyText = this.currentStory.map((word, index) => {
            return `<span class="story-word removable" data-index="${index}">${word}</span>`;
        }).join(' ');
        
        storyArea.innerHTML = storyText;
        
        // 単語削除イベント
        storyArea.querySelectorAll('.story-word').forEach(wordElement => {
            wordElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('removable')) {
                    const index = parseInt(e.target.dataset.index);
                    this.removeWordFromStory(index);
                }
            });
        });
    }
    
    removeWordFromStory(index) {
        this.currentStory.splice(index, 1);
        this.renderStory();
        this.updateWordCount();
        this.showFeedback('単語を削除しました', 'info');
    }
    
    updateWordCount() {
        const wordCount = this.currentStory.length;
        const charCount = this.currentStory.join('').length;
        
        document.getElementById('wordCount').textContent = `単語数: ${wordCount}`;
        document.getElementById('charCount').textContent = `文字数: ${charCount}`;
    }
    
    clearStory() {
        if (this.currentStory.length > 0) {
            if (confirm('現在の物語をクリアしますか？')) {
                this.currentStory = [];
                this.renderStory();
                this.updateWordCount();
                this.currentEditingId = null;
                this.showFeedback('物語をクリアしました', 'info');
            }
        }
    }
    
    saveStory() {
        if (this.currentStory.length === 0) {
            this.showFeedback('保存する物語がありません', 'error');
            return;
        }
        
        const title = prompt('物語のタイトルを入力してください:') || 'untitled';
        const story = {
            id: this.currentEditingId || Date.now().toString(),
            title: title,
            content: this.currentStory.join(' '),
            words: [...this.currentStory],
            createdAt: this.currentEditingId ? 
                this.savedStories.find(s => s.id === this.currentEditingId)?.createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (this.currentEditingId) {
            // 編集モード
            const index = this.savedStories.findIndex(s => s.id === this.currentEditingId);
            this.savedStories[index] = story;
            this.showFeedback('物語を更新しました！', 'success');
            this.currentEditingId = null;
        } else {
            // 新規作成
            this.savedStories.unshift(story);
            this.showFeedback('物語を保存しました！', 'success');
        }
        
        this.saveStories();
        this.renderSavedStories();
        this.clearStory();
    }
    
    exportStory() {
        if (this.currentStory.length === 0) {
            this.showFeedback('エクスポートする物語がありません', 'error');
            return;
        }
        
        const content = this.currentStory.join(' ');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'my-story.txt';
        link.click();
        
        this.showFeedback('物語をエクスポートしました！', 'success');
    }
    
    renderSavedStories() {
        const container = document.getElementById('savedStoriesList');
        
        if (this.savedStories.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; font-style: italic;">保存された物語はありません</p>';
            return;
        }
        
        container.innerHTML = '';
        
        this.savedStories.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card';
            
            const preview = story.content.substring(0, 100);
            const date = new Date(story.createdAt).toLocaleDateString('ja-JP');
            
            card.innerHTML = `
                <div class="story-title">${this.escapeHtml(story.title)}</div>
                <div class="story-preview">${this.escapeHtml(preview)}</div>
                <div class="story-meta">
                    <span>作成日: ${date}</span>
                    <span>単語数: ${story.words.length}</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.showStoryModal(story);
            });
            
            container.appendChild(card);
        });
    }
    
    showStoryModal(story) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        
        title.textContent = story.title;
        body.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4>物語:</h4>
                <p style="line-height: 1.8; margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    ${this.escapeHtml(story.content)}
                </p>
            </div>
            <div style="margin-bottom: 15px;">
                <h4>使用された単語:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                    ${story.words.map(word => `<span class="word-chip" style="font-size: 0.8rem; padding: 4px 8px;">${this.escapeHtml(word)}</span>`).join('')}
                </div>
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                <p>作成日: ${new Date(story.createdAt).toLocaleString('ja-JP')}</p>
                ${story.updatedAt !== story.createdAt ? `<p>更新日: ${new Date(story.updatedAt).toLocaleString('ja-JP')}</p>` : ''}
                <p>単語数: ${story.words.length} | 文字数: ${story.content.length}</p>
            </div>
        `;
        
        this.currentModalStory = story;
        modal.style.display = 'block';
    }
    
    closeModal() {
        document.getElementById('modal').style.display = 'none';
        this.currentModalStory = null;
    }
    
    deleteCurrentStory() {
        if (!this.currentModalStory) return;
        
        if (confirm(`「${this.currentModalStory.title}」を削除しますか？`)) {
            this.savedStories = this.savedStories.filter(story => 
                story.id !== this.currentModalStory.id
            );
            this.saveStories();
            this.renderSavedStories();
            this.closeModal();
            this.showFeedback('物語を削除しました', 'info');
        }
    }
    
    editCurrentStory() {
        if (!this.currentModalStory) return;
        
        this.currentStory = [...this.currentModalStory.words];
        this.currentEditingId = this.currentModalStory.id;
        this.renderStory();
        this.updateWordCount();
        this.closeModal();
        this.showFeedback('編集モードに切り替えました', 'info');
        
        // 物語エリアにスクロール
        document.querySelector('.story-workspace').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    saveStories() {
        try {
            localStorage.setItem('wordPaletteStories', JSON.stringify(this.savedStories));
        } catch (error) {
            console.error('Storage save error:', error);
            this.showFeedback('保存に失敗しました', 'error');
        }
    }
    
    loadStories() {
        try {
            const stored = localStorage.getItem('wordPaletteStories');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Storage load error:', error);
            return [];
        }
    }
    
    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
        feedback.classList.add('show');
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ドラッグ&ドロップ関数（グローバル）
function allowDrop(ev) {
    ev.preventDefault();
    ev.target.classList.add('drag-over');
}

function drop(ev) {
    ev.preventDefault();
    ev.target.classList.remove('drag-over');
    
    const word = ev.dataTransfer.getData('text/plain');
    if (word && window.wordPalette) {
        window.wordPalette.addWordToStory(word);
    }
}

// ドラッグ離脱時のスタイルリセット
document.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('story-area')) {
        e.target.classList.remove('drag-over');
    }
});

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Word Palette starting...');
    window.wordPalette = new WordPalette();
    console.log('✅ Word Palette ready!');
    
    // パフォーマンス監視
    if ('performance' in window) {
        console.log(`⚡ Page load time: ${Math.round(performance.now())}ms`);
    }
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('🚨 Application Error:', e.error);
    console.error('📍 Error Location:', e.filename, 'Line:', e.lineno);
    
    if (window.wordPalette) {
        window.wordPalette.showFeedback('エラーが発生しました', 'error');
    }
});

// ページ離脱時の警告（未保存の物語がある場合）
window.addEventListener('beforeunload', (e) => {
    if (window.wordPalette && window.wordPalette.currentStory.length > 0) {
        e.preventDefault();
        e.returnValue = '未保存の物語があります。ページを離れますか？';
        return e.returnValue;
    }
});

// サービスワーカー登録（PWA対応準備）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // サービスワーカーファイルが存在する場合のみ登録
        navigator.serviceWorker.getRegistrations().then(() => {
            console.log('🔧 Service Worker check completed');
        });
    });
}

// アクセシビリティ向上
document.addEventListener('keydown', (e) => {
    // Tabキーナビゲーション強化
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

// ダークモード検出と対応
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    console.log('🌙 Dark mode detected');
}

// 印刷対応
window.addEventListener('beforeprint', () => {
    console.log('🖨️ Print mode activated');
});

// オフライン検出
window.addEventListener('online', () => {
    if (window.wordPalette) {
        window.wordPalette.showFeedback('インターネットに接続しました', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.wordPalette) {
        window.wordPalette.showFeedback('オフラインモードです', 'info');
    }
});

// メモリリーク防止
window.addEventListener('unload', () => {
    if (window.wordPalette) {
        window.wordPalette = null;
    }
});