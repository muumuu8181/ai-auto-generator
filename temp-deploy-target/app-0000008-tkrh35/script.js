class DeepLearningTextAnalyzer {
    constructor() {
        this.texts = [];
        this.vectors = [];
        this.similarities = [];
        this.isAnalyzing = false;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupSampleTexts();
        this.initializeGraph();
        
        console.log('🧠 Deep Learning Text Analyzer initialized');
    }
    
    initializeElements() {
        this.textInputs = {
            short: document.getElementById('shortText'),
            medium: document.getElementById('mediumText'),
            long: document.getElementById('longText')
        };
        
        this.charCounts = {
            short: document.getElementById('shortCount'),
            medium: document.getElementById('mediumCount'),
            long: document.getElementById('longCount')
        };
        
        this.buttons = {
            loadSamples: document.getElementById('loadSamples'),
            clearAll: document.getElementById('clearAll'),
            analyze: document.getElementById('analyzeBtn'),
            vectorize: document.getElementById('vectorizeBtn')
        };
        
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        this.displayElements = {
            vectors: document.getElementById('vectorsDisplay'),
            similarity: document.getElementById('similarityMatrix'),
            ranking: document.getElementById('similarityRanking'),
            stats: document.getElementById('statsGrid')
        };
        
        this.canvas = document.getElementById('scatterPlot');
        this.ctx = this.canvas.getContext('2d');
        
        this.exportButtons = {
            vectors: document.getElementById('exportVectors'),
            similarity: document.getElementById('exportSimilarity'),
            graph: document.getElementById('exportGraph'),
            report: document.getElementById('exportReport')
        };
        
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        this.showLabels = document.getElementById('showLabels');
        this.showConnections = document.getElementById('showConnections');
        this.resetZoom = document.getElementById('resetZoom');
    }
    
    initializeEventListeners() {
        // テキスト入力の文字数カウント
        Object.keys(this.textInputs).forEach(key => {
            this.textInputs[key].addEventListener('input', () => this.updateCharCount(key));
        });
        
        // ボタンイベント
        this.buttons.loadSamples.addEventListener('click', () => this.loadSampleTexts());
        this.buttons.clearAll.addEventListener('click', () => this.clearAllTexts());
        this.buttons.analyze.addEventListener('click', () => this.startAnalysis());
        this.buttons.vectorize.addEventListener('click', () => this.vectorizeTexts());
        
        // タブ切替
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // エクスポートボタン
        Object.keys(this.exportButtons).forEach(key => {
            this.exportButtons[key].addEventListener('click', () => this.exportData(key));
        });
        
        // グラフコントロール
        this.showLabels.addEventListener('change', () => this.updateGraph());
        this.showConnections.addEventListener('change', () => this.updateGraph());
        this.resetZoom.addEventListener('click', () => this.resetGraphZoom());
        
        // キャンバスイベント
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }
    
    setupSampleTexts() {
        this.sampleData = {
            tech: [
                {
                    title: "機械学習の基本",
                    text: "機械学習は人工知能の一分野で、データから自動的にパターンを学習するアルゴリズムです。"
                },
                {
                    title: "ニューラルネットワーク",
                    text: "ニューラルネットワークは人間の脳の神経細胞を模倣した数学的モデルで、複雑なパターン認識が可能です。深層学習の基盤技術として広く活用されています。"
                },
                {
                    title: "ディープラーニング革命",
                    text: "ディープラーニングは多層のニューラルネットワークを用いた機械学習手法で、画像認識、自然言語処理、音声認識など様々な分野で画期的な成果を上げています。特に畳み込みニューラルネットワーク（CNN）は画像処理において、リカレントニューラルネットワーク（RNN）は時系列データ処理において優れた性能を発揮します。近年では注意機構を用いたTransformerアーキテクチャが自然言語処理分野を大きく変革し、GPTやBERTなどの大規模言語モデルの基盤となっています。"
                }
            ],
            literature: [
                {
                    title: "春の訪れ",
                    text: "桜の花びらが舞い散る季節がやってきました。"
                },
                {
                    title: "夏の思い出",
                    text: "夏の夕暮れ時、蝉の声が響く中で、子供たちは公園で遊んでいました。青い空と白い雲が印象的な一日でした。"
                },
                {
                    title: "秋の物語",
                    text: "紅葉が美しく色づく季節、山々は赤や黄色の絨毯に包まれていました。風は涼しく、空気は澄んでいて、深呼吸をするたびに心が洗われるような気持ちになりました。この時期になると、いつも故郷の山を思い出します。祖父と一緒に歩いた山道、拾い集めた色とりどりの落ち葉、暖かい焚き火の香り。そんな懐かしい記憶が蘇ってくるのです。時は流れ、季節は巡り、人生もまた同じように変化していくのだなと感じます。"
                }
            ],
            science: [
                {
                    title: "量子力学入門",
                    text: "量子力学は原子レベルでの物理現象を扱う理論です。"
                },
                {
                    title: "DNA構造",
                    text: "DNAは二重らせん構造を持つ遺伝情報を担う分子で、生命の設計図として機能します。"
                },
                {
                    title: "宇宙の起源と進化",
                    text: "宇宙は約138億年前のビッグバンから始まったとされています。初期の宇宙は極めて高温高密度の状態にあり、時間の経過とともに冷却と膨張を続けました。最初の数分間で水素やヘリウムなどの軽元素が形成され、約38万年後に宇宙の温度が下がって原子が安定的に存在できるようになりました。その後、重力により物質が集まって最初の星が誕生し、星の内部での核融合反応により重い元素が作られました。星の一生の終わりには超新星爆発が起こり、作られた重元素が宇宙空間にばらまかれ、次世代の星や惑星の材料となりました。"
                }
            ]
        };
        
        this.displaySampleTexts();
    }
    
    displaySampleTexts() {
        Object.keys(this.sampleData).forEach(category => {
            const container = document.querySelector(`[data-category="${category}"]`);
            container.innerHTML = '';
            
            this.sampleData[category].forEach(sample => {
                const item = document.createElement('div');
                item.className = 'sample-item';
                item.innerHTML = `
                    <h5>${sample.title}</h5>
                    <p>${sample.text}</p>
                `;
                
                item.addEventListener('click', () => this.loadSampleText(sample.text));
                container.appendChild(item);
            });
        });
    }
    
    loadSampleText(text) {
        const length = text.length;
        
        if (length <= 50 && !this.textInputs.short.value) {
            this.textInputs.short.value = text;
            this.updateCharCount('short');
        } else if (length <= 200 && !this.textInputs.medium.value) {
            this.textInputs.medium.value = text;
            this.updateCharCount('medium');
        } else if (!this.textInputs.long.value) {
            this.textInputs.long.value = text;
            this.updateCharCount('long');
        } else {
            // 空いているフィールドに入力
            if (!this.textInputs.short.value) {
                this.textInputs.short.value = text.substring(0, 50);
                this.updateCharCount('short');
            } else if (!this.textInputs.medium.value) {
                this.textInputs.medium.value = text.substring(0, 200);
                this.updateCharCount('medium');
            } else {
                this.textInputs.long.value = text;
                this.updateCharCount('long');
            }
        }
    }
    
    loadSampleTexts() {
        const samples = [
            this.sampleData.tech[0].text,
            this.sampleData.literature[1].text,
            this.sampleData.science[2].text
        ];
        
        this.textInputs.short.value = samples[0];
        this.textInputs.medium.value = samples[1];
        this.textInputs.long.value = samples[2];
        
        this.updateCharCount('short');
        this.updateCharCount('medium');
        this.updateCharCount('long');
    }
    
    clearAllTexts() {
        Object.keys(this.textInputs).forEach(key => {
            this.textInputs[key].value = '';
            this.updateCharCount(key);
        });
        
        this.texts = [];
        this.vectors = [];
        this.similarities = [];
        this.clearDisplays();
    }
    
    updateCharCount(type) {
        const input = this.textInputs[type];
        const counter = this.charCounts[type];
        const maxLengths = { short: 50, medium: 200, long: 1000 };
        
        const length = input.value.length;
        const maxLength = maxLengths[type];
        
        counter.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength * 0.9) {
            counter.style.color = '#ef4444';
        } else if (length > maxLength * 0.7) {
            counter.style.color = '#f59e0b';
        } else {
            counter.style.color = '#64748b';
        }
    }
    
    async startAnalysis() {
        if (this.isAnalyzing) return;
        
        const texts = this.getInputTexts();
        if (texts.length === 0) {
            alert('分析するテキストを入力してください');
            return;
        }
        
        this.isAnalyzing = true;
        this.showLoading();
        
        try {
            await this.performAnalysis(texts);
            this.displayResults();
        } catch (error) {
            console.error('Analysis error:', error);
            alert('分析中にエラーが発生しました');
        } finally {
            this.hideLoading();
            this.isAnalyzing = false;
        }
    }
    
    getInputTexts() {
        const texts = [];
        
        Object.keys(this.textInputs).forEach(key => {
            const text = this.textInputs[key].value.trim();
            if (text) {
                texts.push({
                    type: key,
                    content: text,
                    length: text.length
                });
            }
        });
        
        return texts;
    }
    
    async performAnalysis(texts) {
        this.texts = texts;
        
        // ベクトル化のシミュレーション
        await this.updateProgress(20, 'テキスト前処理中...');
        await this.delay(800);
        
        await this.updateProgress(40, 'ベクトル化実行中...');
        this.vectors = this.generateVectors(texts);
        await this.delay(1200);
        
        await this.updateProgress(70, '類似度計算中...');
        this.similarities = this.calculateSimilarities();
        await this.delay(1000);
        
        await this.updateProgress(90, '結果生成中...');
        await this.delay(600);
        
        await this.updateProgress(100, '完了');
    }
    
    generateVectors(texts) {
        return texts.map((text, index) => {
            // シンプルな特徴ベクトル生成（実際のディープラーニングをシミュレート）
            const vector = [];
            const words = text.content.toLowerCase().split(/\\s+/);
            
            // 基本的な特徴量
            vector.push(text.length / 1000); // 長さの正規化
            vector.push(words.length / 100); // 単語数の正規化
            vector.push(text.content.split('。').length / 10); // 文数の正規化
            
            // 単語の特徴量（簡易的な埋め込み表現）
            const vocab = ['技術', '学習', '機械', '人工', '知能', '春', '夏', '秋', '冬', '美しい', '量子', '宇宙', '科学', '研究'];
            vocab.forEach(word => {
                vector.push(text.content.includes(word) ? 1 : 0);
            });
            
            // ランダムな高次元特徴量（ディープラーニングの隠れ層をシミュレート）
            for (let i = 0; i < 50; i++) {
                vector.push(Math.random() * 2 - 1);
            }
            
            return {
                textIndex: index,
                vector: vector,
                dimension: vector.length
            };
        });
    }
    
    calculateSimilarities() {
        const similarities = [];
        
        for (let i = 0; i < this.vectors.length; i++) {
            const row = [];
            for (let j = 0; j < this.vectors.length; j++) {
                if (i === j) {
                    row.push(1.0);
                } else {
                    const similarity = this.cosineSimilarity(
                        this.vectors[i].vector,
                        this.vectors[j].vector
                    );
                    row.push(similarity);
                }
            }
            similarities.push(row);
        }
        
        return similarities;
    }
    
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        
        if (normA === 0 || normB === 0) return 0;
        
        return dotProduct / (normA * normB);
    }
    
    displayResults() {
        this.displayVectors();
        this.displaySimilarityMatrix();
        this.displayStatistics();
        this.updateGraph();
    }
    
    displayVectors() {
        const container = this.displayElements.vectors;
        container.innerHTML = '';
        
        this.vectors.forEach((vecData, index) => {
            const text = this.texts[index];
            const item = document.createElement('div');
            item.className = 'vector-item';
            
            const vectorDisplay = vecData.vector.slice(0, 10).map(v => v.toFixed(3)).join(', ');
            
            item.innerHTML = `
                <h4>${text.type}文 (${text.length}文字)</h4>
                <p><strong>内容:</strong> ${text.content.substring(0, 100)}...</p>
                <div class="vector-values">
                    [${vectorDisplay}...] (${vecData.dimension}次元)
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    displaySimilarityMatrix() {
        const matrixContainer = this.displayElements.similarity;
        const rankingContainer = this.displayElements.ranking;
        
        // マトリックス表示
        const table = document.createElement('table');
        table.className = 'matrix-table';
        
        // ヘッダー行
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th></th>' + this.texts.map((text, i) => 
            `<th>${text.type}文</th>`
        ).join('');
        table.appendChild(headerRow);
        
        // データ行
        this.similarities.forEach((row, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<th>${this.texts[i].type}文</th>` + 
                row.map((sim, j) => {
                    const value = sim.toFixed(3);
                    let className = 'similarity-cell ';
                    if (i !== j) {
                        if (sim > 0.7) className += 'similarity-high';
                        else if (sim > 0.4) className += 'similarity-medium';
                        else className += 'similarity-low';
                    }
                    return `<td class="${className}">${value}</td>`;
                }).join('');
            table.appendChild(tr);
        });
        
        matrixContainer.innerHTML = '';
        matrixContainer.appendChild(table);
        
        // ランキング表示
        const pairs = [];
        for (let i = 0; i < this.similarities.length; i++) {
            for (let j = i + 1; j < this.similarities[i].length; j++) {
                pairs.push({
                    text1: this.texts[i].type,
                    text2: this.texts[j].type,
                    similarity: this.similarities[i][j]
                });
            }
        }
        
        pairs.sort((a, b) => b.similarity - a.similarity);
        
        rankingContainer.innerHTML = '<h4>類似度ランキング</h4>';
        pairs.forEach((pair, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `
                <span>#${index + 1} ${pair.text1}文 ⟷ ${pair.text2}文</span>
                <strong>${(pair.similarity * 100).toFixed(1)}%</strong>
            `;
            rankingContainer.appendChild(item);
        });
    }
    
    displayStatistics() {
        const container = this.displayElements.stats;
        container.innerHTML = '';
        
        const stats = this.calculateStatistics();
        
        Object.keys(stats).forEach(key => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-value">${stats[key].value}</div>
                <div class="stat-label">${stats[key].label}</div>
            `;
            container.appendChild(card);
        });
    }
    
    calculateStatistics() {
        const similarities = this.similarities.flat().filter((sim, i, arr) => {
            const row = Math.floor(i / this.similarities.length);
            const col = i % this.similarities.length;
            return row !== col;
        });
        
        const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        const maxSimilarity = Math.max(...similarities);
        const minSimilarity = Math.min(...similarities);
        
        return {
            textCount: { value: this.texts.length, label: 'テキスト数' },
            avgLength: { 
                value: Math.round(this.texts.reduce((a, b) => a + b.length, 0) / this.texts.length),
                label: '平均文字数'
            },
            vectorDim: { value: this.vectors[0]?.dimension || 0, label: 'ベクトル次元数' },
            avgSimilarity: { value: (avgSimilarity * 100).toFixed(1) + '%', label: '平均類似度' },
            maxSimilarity: { value: (maxSimilarity * 100).toFixed(1) + '%', label: '最高類似度' },
            minSimilarity: { value: (minSimilarity * 100).toFixed(1) + '%', label: '最低類似度' }
        };
    }
    
    initializeGraph() {
        this.graphScale = 1;
        this.graphOffset = { x: 0, y: 0 };
        this.hoveredPoint = null;
    }
    
    updateGraph() {
        if (this.vectors.length === 0) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 2D座標に変換（PCAの簡易版）
        const points = this.vectors.map((vecData, index) => {
            // 簡易的な次元削減（最初の2次元を使用）
            return {
                x: (vecData.vector[0] + 1) * this.canvas.width / 4 + this.canvas.width / 4,
                y: (vecData.vector[1] + 1) * this.canvas.height / 4 + this.canvas.height / 4,
                text: this.texts[index],
                index: index
            };
        });
        
        // 類似度に基づく線の描画
        if (this.showConnections.checked) {
            this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
            this.ctx.lineWidth = 1;
            
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const similarity = this.similarities[i][j];
                    if (similarity > 0.5) {
                        this.ctx.globalAlpha = similarity;
                        this.ctx.beginPath();
                        this.ctx.moveTo(points[i].x, points[i].y);
                        this.ctx.lineTo(points[j].x, points[j].y);
                        this.ctx.stroke();
                    }
                }
            }
            this.ctx.globalAlpha = 1;
        }
        
        // ポイントの描画
        points.forEach((point, index) => {
            this.ctx.fillStyle = `hsl(${index * 120}, 70%, 50%)`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // ラベル表示
            if (this.showLabels.checked) {
                this.ctx.fillStyle = '#1e293b';
                this.ctx.font = '12px sans-serif';
                this.ctx.fillText(
                    point.text.type,
                    point.x + 12,
                    point.y + 4
                );
            }
        });
        
        this.graphPoints = points;
    }
    
    handleCanvasHover(e) {
        if (!this.graphPoints) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let hoveredPoint = null;
        
        this.graphPoints.forEach(point => {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance < 15) {
                hoveredPoint = point;
            }
        });
        
        if (hoveredPoint !== this.hoveredPoint) {
            this.hoveredPoint = hoveredPoint;
            this.canvas.style.cursor = hoveredPoint ? 'pointer' : 'crosshair';
            
            if (hoveredPoint) {
                this.canvas.title = `${hoveredPoint.text.type}文: ${hoveredPoint.text.content.substring(0, 100)}...`;
            } else {
                this.canvas.title = '';
            }
        }
    }
    
    handleCanvasClick(e) {
        if (this.hoveredPoint) {
            alert(`${this.hoveredPoint.text.type}文\\n\\n${this.hoveredPoint.text.content}`);
        }
    }
    
    resetGraphZoom() {
        this.graphScale = 1;
        this.graphOffset = { x: 0, y: 0 };
        this.updateGraph();
    }
    
    switchTab(tabName) {
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        if (tabName === 'graph') {
            setTimeout(() => this.updateGraph(), 100);
        }
    }
    
    async vectorizeTexts() {
        const texts = this.getInputTexts();
        if (texts.length === 0) {
            alert('ベクトル化するテキストを入力してください');
            return;
        }
        
        this.showLoading();
        
        try {
            await this.updateProgress(50, 'ベクトル化実行中...');
            this.vectors = this.generateVectors(texts);
            this.texts = texts;
            await this.delay(1000);
            
            await this.updateProgress(100, '完了');
            this.displayVectors();
            this.switchTab('vectors');
        } finally {
            this.hideLoading();
        }
    }
    
    exportData(type) {
        if (this.vectors.length === 0) {
            alert('エクスポートするデータがありません。先に分析を実行してください。');
            return;
        }
        
        switch (type) {
            case 'vectors':
                this.exportVectorData();
                break;
            case 'similarity':
                this.exportSimilarityData();
                break;
            case 'graph':
                this.exportGraphImage();
                break;
            case 'report':
                this.exportAnalysisReport();
                break;
        }
    }
    
    exportVectorData() {
        const data = {
            timestamp: new Date().toISOString(),
            texts: this.texts,
            vectors: this.vectors.map(v => ({
                textIndex: v.textIndex,
                vector: v.vector,
                dimension: v.dimension
            }))
        };
        
        this.downloadJSON(data, 'text-vectors.json');
    }
    
    exportSimilarityData() {
        const rows = [['', ...this.texts.map(t => t.type)]];
        
        this.similarities.forEach((row, i) => {
            rows.push([this.texts[i].type, ...row.map(sim => sim.toFixed(4))]);
        });
        
        const csv = rows.map(row => row.join(',')).join('\\n');
        this.downloadFile(csv, 'similarity-matrix.csv', 'text/csv');
    }
    
    exportGraphImage() {
        const link = document.createElement('a');
        link.download = 'text-analysis-graph.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    exportAnalysisReport() {
        const stats = this.calculateStatistics();
        const report = `
テキスト分析レポート
===================

生成日時: ${new Date().toLocaleString('ja-JP')}

基本統計:
${Object.values(stats).map(stat => `- ${stat.label}: ${stat.value}`).join('\\n')}

テキスト一覧:
${this.texts.map((text, i) => `${i + 1}. ${text.type}文 (${text.length}文字)\\n   "${text.content.substring(0, 100)}..."`).join('\\n\\n')}

類似度分析:
${this.similarities.map((row, i) => 
    row.map((sim, j) => 
        i !== j ? `${this.texts[i].type}文 ⟷ ${this.texts[j].type}文: ${(sim * 100).toFixed(1)}%` : null
    ).filter(Boolean).join('\\n')
).filter(row => row.length > 0).join('\\n')}
        `.trim();
        
        this.downloadFile(report, 'analysis-report.txt', 'text/plain');
    }
    
    clearDisplays() {
        this.displayElements.vectors.innerHTML = '<p class="placeholder">テキストを入力して分析を開始してください</p>';
        this.displayElements.similarity.innerHTML = '<p class="placeholder">分析後に類似度が表示されます</p>';
        this.displayElements.ranking.innerHTML = '';
        this.displayElements.stats.innerHTML = '<p class="placeholder">分析後に統計情報が表示されます</p>';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    showLoading() {
        this.loadingOverlay.classList.add('show');
    }
    
    hideLoading() {
        this.loadingOverlay.classList.remove('show');
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0%';
    }
    
    async updateProgress(percent, message) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%`;
        
        const loadingText = document.querySelector('.loading-content p');
        if (message && loadingText) {
            loadingText.textContent = message;
        }
        
        await this.delay(50);
    }
    
    downloadJSON(data, filename) {
        this.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
    }
    
    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.textAnalyzer = new DeepLearningTextAnalyzer();
});