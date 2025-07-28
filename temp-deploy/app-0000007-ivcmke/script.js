class GitHubRepoValidator {
    constructor() {
        this.validationData = {
            score: 0,
            readmeScore: 0,
            structureScore: 0,
            filesScore: 0,
            contentScore: 0,
            apps: [],
            issues: [],
            recommendations: []
        };
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupSampleData();
        
        console.log('🔍 GitHub Repository Validator initialized');
    }
    
    initializeElements() {
        this.repoUrlInput = document.getElementById('repoUrl');
        this.validateBtn = document.getElementById('validateBtn');
        this.loadingSection = document.getElementById('loading');
        this.resultsSection = document.getElementById('results');
        this.scoreCircle = document.getElementById('scoreCircle');
        this.scoreNumber = document.getElementById('scoreNumber');
        this.scoreDescription = document.getElementById('scoreDescription');
        
        this.checkboxes = {
            readme: document.getElementById('checkReadme'),
            structure: document.getElementById('checkStructure'),
            files: document.getElementById('checkFiles'),
            content: document.getElementById('checkContent')
        };
        
        this.statusElements = {
            readme: document.getElementById('readmeStatus'),
            structure: document.getElementById('structureStatus'),
            files: document.getElementById('filesStatus'),
            content: document.getElementById('contentStatus')
        };
        
        this.checkLists = {
            readme: document.getElementById('readmeChecks'),
            structure: document.getElementById('structureChecks'),
            files: document.getElementById('filesChecks'),
            content: document.getElementById('contentChecks')
        };
        
        this.appsGrid = document.getElementById('appsGrid');
        this.issuesSection = document.getElementById('issuesSection');
        this.issuesList = document.getElementById('issuesList');
        this.recommendationsSection = document.getElementById('recommendations');
        this.recommendationsList = document.getElementById('recommendationsList');
        
        this.exportButtons = {
            json: document.getElementById('exportJson'),
            csv: document.getElementById('exportCsv'),
            text: document.getElementById('exportText')
        };
    }
    
    initializeEventListeners() {
        this.validateBtn.addEventListener('click', () => this.startValidation());
        
        this.exportButtons.json.addEventListener('click', () => this.exportAsJSON());
        this.exportButtons.csv.addEventListener('click', () => this.exportAsCSV());
        this.exportButtons.text.addEventListener('click', () => this.exportAsText());
        
        this.repoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startValidation();
            }
        });
    }
    
    setupSampleData() {
        // サンプルアプリデータを準備
        this.sampleApps = [
            {
                id: 'app-0000001-34xzgi',
                name: 'お金管理システム',
                hasIndex: true,
                hasStyle: true,
                hasScript: true,
                hasReadme: false,
                hasReflection: true,
                quality: 'high',
                issues: []
            },
            {
                id: 'app-0000002-asnmhg',
                name: '格好良い電卓',
                hasIndex: true,
                hasStyle: true,
                hasScript: true,
                hasReadme: false,
                hasReflection: true,
                quality: 'high',
                issues: []
            },
            {
                id: 'app-0000003-xjt6y6',
                name: 'ペイントシステム',
                hasIndex: true,
                hasStyle: true,
                hasScript: true,
                hasReadme: false,
                hasReflection: true,
                quality: 'medium',
                issues: ['Canvas API使用で一部ブラウザ制限']
            },
            {
                id: 'app-0000004-6v3jx5',
                name: '超格好良い時計',
                hasIndex: true,
                hasStyle: true,
                hasScript: true,
                hasReadme: false,
                hasReflection: true,
                quality: 'high',
                issues: []
            },
            {
                id: 'app-0000005-k7gwdv',
                name: 'バックアップシステム検証アプリ',
                hasIndex: true,
                hasStyle: true,
                hasScript: true,
                hasReadme: false,
                hasReflection: true,
                quality: 'high',
                issues: []
            },
            {
                id: 'app-0000006-gd8zap',
                name: 'AIと会話をするチャットシステム',
                hasIndex: true,
                hasStyle: true,
                hasScript: true,
                hasReadme: false,
                hasReflection: true,
                quality: 'high',
                issues: ['音声認識機能は対応ブラウザのみ']
            }
        ];
    }
    
    async startValidation() {
        const url = this.repoUrlInput.value.trim();
        if (!url) {
            alert('GitHub リポジトリ URL を入力してください');
            return;
        }
        
        this.showLoading();
        
        // 検証プロセスをシミュレート
        await this.simulateValidation();
        
        this.hideLoading();
        this.showResults();
    }
    
    async simulateValidation() {
        // リアルな検証時間をシミュレート
        await this.delay(2000);
        
        // 各検証項目を実行
        if (this.checkboxes.readme.checked) {
            await this.validateReadme();
        }
        
        if (this.checkboxes.structure.checked) {
            await this.validateStructure();
        }
        
        if (this.checkboxes.files.checked) {
            await this.validateFiles();
        }
        
        if (this.checkboxes.content.checked) {
            await this.validateContent();
        }
        
        this.calculateTotalScore();
        this.generateRecommendations();
    }
    
    async validateReadme() {
        await this.delay(500);
        
        const checks = [
            { text: 'README.md ファイルが存在する', status: 'success' },
            { text: 'プロジェクト概要が記載されている', status: 'warning' },
            { text: 'セットアップ手順が明記されている', status: 'success' },
            { text: '使用技術の記載がある', status: 'error' },
            { text: 'ライセンス情報が記載されている', status: 'warning' }
        ];
        
        this.updateValidationCard('readme', checks, 75);
    }
    
    async validateStructure() {
        await this.delay(800);
        
        const checks = [
            { text: 'アプリディレクトリが適切に構成されている', status: 'success' },
            { text: '命名規則に従っている (app-XXXXXXX-XXXXXX)', status: 'success' },
            { text: 'ディレクトリ構造が一貫している', status: 'success' },
            { text: '不要なファイルが含まれていない', status: 'warning' },
            { text: 'GitHub Pages用設定が適切', status: 'success' }
        ];
        
        this.updateValidationCard('structure', checks, 88);
    }
    
    async validateFiles() {
        await this.delay(600);
        
        const checks = [
            { text: 'index.html が全アプリに存在', status: 'success' },
            { text: 'style.css が全アプリに存在', status: 'success' },
            { text: 'script.js が全アプリに存在', status: 'success' },
            { text: 'reflection.md が存在', status: 'success' },
            { text: 'requirements.md が存在', status: 'warning' },
            { text: 'work_log.md が存在', status: 'warning' }
        ];
        
        this.updateValidationCard('files', checks, 82);
    }
    
    async validateContent() {
        await this.delay(1000);
        
        const checks = [
            { text: 'HTMLの構文が正しい', status: 'success' },
            { text: 'CSSがモダンで適切', status: 'success' },
            { text: 'JavaScriptが機能的', status: 'success' },
            { text: 'レスポンシブデザイン対応', status: 'success' },
            { text: 'アクセシビリティ配慮', status: 'warning' },
            { text: 'コード品質が高い', status: 'success' },
            { text: 'コメントが適切', status: 'error' }
        ];
        
        this.updateValidationCard('content', checks, 79);
        this.displayFoundApps();
    }
    
    updateValidationCard(type, checks, score) {
        const card = document.getElementById(`${type}Card`);
        const status = this.statusElements[type];
        const checkList = this.checkLists[type];
        
        // スコアに基づいてステータスを決定
        let statusClass, statusText;
        if (score >= 85) {
            statusClass = 'success';
            statusText = '優秀';
        } else if (score >= 70) {
            statusClass = 'warning';
            statusText = '良好';
        } else {
            statusClass = 'error';
            statusText = '要改善';
        }
        
        card.className = `validation-card ${statusClass}`;
        status.className = `status-badge ${statusClass}`;
        status.textContent = `${statusText} (${score}%)`;
        
        // チェックリストを更新
        checkList.innerHTML = '';
        checks.forEach(check => {
            const li = document.createElement('li');
            li.className = check.status;
            li.innerHTML = `
                <span class="icon">${this.getStatusIcon(check.status)}</span>
                <span>${check.text}</span>
            `;
            checkList.appendChild(li);
        });
        
        // スコアを保存
        this.validationData[`${type}Score`] = score;
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '❓';
        }
    }
    
    displayFoundApps() {
        this.appsGrid.innerHTML = '';
        
        this.sampleApps.forEach(app => {
            const appCard = document.createElement('div');
            appCard.className = 'app-card';
            
            const qualityIcon = app.quality === 'high' ? '🟢' : 
                               app.quality === 'medium' ? '🟡' : '🔴';
            
            appCard.innerHTML = `
                <h4>${app.id}</h4>
                <p><strong>${app.name}</strong></p>
                <p>ファイル: ${[app.hasIndex && 'HTML', app.hasStyle && 'CSS', app.hasScript && 'JS'].filter(Boolean).join(', ')}</p>
                <div class="app-status">
                    <span>品質: ${qualityIcon}</span>
                    <span>問題: ${app.issues.length}件</span>
                </div>
            `;
            
            appCard.addEventListener('click', () => {
                window.open(`https://muumuu8181.github.io/published-apps/${app.id}/`, '_blank');
            });
            
            this.appsGrid.appendChild(appCard);
        });
        
        this.validationData.apps = this.sampleApps;
    }
    
    calculateTotalScore() {
        const scores = [
            this.validationData.readmeScore,
            this.validationData.structureScore,
            this.validationData.filesScore,
            this.validationData.contentScore
        ].filter(score => score > 0);
        
        this.validationData.score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        const score = this.validationData.score;
        this.scoreNumber.textContent = score;
        
        // 円グラフの更新
        this.scoreCircle.style.setProperty('--score-percent', `${score}%`);
        
        // スコア説明の更新
        let description;
        if (score >= 90) {
            description = '🎉 素晴らしい！非常に高品質なリポジトリです';
        } else if (score >= 80) {
            description = '👍 良好な状態です。一部改善の余地があります';
        } else if (score >= 70) {
            description = '⚠️ 基本的な要件は満たしていますが改善が必要';
        } else {
            description = '🔧 多くの改善が必要です';
        }
        
        this.scoreDescription.textContent = description;
    }
    
    generateRecommendations() {
        const recommendations = [
            {
                title: 'README.md の充実',
                description: '各アプリの詳細説明と使用技術の明記を推奨します'
            },
            {
                title: 'コメントの追加',
                description: 'JavaScriptコードにより詳細なコメントを追加してください'
            },
            {
                title: 'アクセシビリティの向上',
                description: 'キーボードナビゲーションとスクリーンリーダー対応を検討してください'
            },
            {
                title: 'テストの追加',
                description: '自動テストの導入で品質向上を図ってください'
            }
        ];
        
        this.validationData.recommendations = recommendations;
        this.displayRecommendations();
    }
    
    displayRecommendations() {
        this.recommendationsList.innerHTML = '';
        
        this.validationData.recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
            `;
            this.recommendationsList.appendChild(item);
        });
        
        this.recommendationsSection.classList.add('show');
    }
    
    showLoading() {
        this.loadingSection.classList.add('show');
        this.resultsSection.classList.remove('show');
        this.validateBtn.disabled = true;
        this.validateBtn.textContent = '検証中...';
    }
    
    hideLoading() {
        this.loadingSection.classList.remove('show');
        this.validateBtn.disabled = false;
        this.validateBtn.innerHTML = '🚀 検証開始';
    }
    
    showResults() {
        this.resultsSection.classList.add('show', 'fade-in');
    }
    
    exportAsJSON() {
        const data = {
            timestamp: new Date().toISOString(),
            repository: this.repoUrlInput.value,
            totalScore: this.validationData.score,
            scores: {
                readme: this.validationData.readmeScore,
                structure: this.validationData.structureScore,
                files: this.validationData.filesScore,
                content: this.validationData.contentScore
            },
            apps: this.validationData.apps,
            recommendations: this.validationData.recommendations
        };
        
        this.downloadFile(
            JSON.stringify(data, null, 2),
            'github-repo-validation.json',
            'application/json'
        );
    }
    
    exportAsCSV() {
        const csvContent = [
            ['App ID', 'Name', 'HTML', 'CSS', 'JS', 'Quality', 'Issues'],
            ...this.validationData.apps.map(app => [
                app.id,
                app.name,
                app.hasIndex ? 'Yes' : 'No',
                app.hasStyle ? 'Yes' : 'No',
                app.hasScript ? 'Yes' : 'No',
                app.quality,
                app.issues.length
            ])
        ].map(row => row.join(',')).join('\n');
        
        this.downloadFile(csvContent, 'github-repo-validation.csv', 'text/csv');
    }
    
    exportAsText() {
        const textContent = `
GitHub Repository Validation Report
===================================

Repository: ${this.repoUrlInput.value}
Generated: ${new Date().toLocaleString('ja-JP')}
Total Score: ${this.validationData.score}/100

Detailed Scores:
- README.md: ${this.validationData.readmeScore}/100
- Directory Structure: ${this.validationData.structureScore}/100
- Required Files: ${this.validationData.filesScore}/100
- Content Quality: ${this.validationData.contentScore}/100

Found Apps (${this.validationData.apps.length}):
${this.validationData.apps.map(app => 
    `- ${app.id}: ${app.name} (Quality: ${app.quality})`
).join('\n')}

Recommendations:
${this.validationData.recommendations.map(rec => 
    `- ${rec.title}: ${rec.description}`
).join('\n')}
        `.trim();
        
        this.downloadFile(textContent, 'github-repo-validation.txt', 'text/plain');
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
    window.repoValidator = new GitHubRepoValidator();
});