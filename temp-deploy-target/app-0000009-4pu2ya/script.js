class YouTubeExtractor {
    constructor() {
        this.searchResults = [];
        this.isSearching = false;
        this.currentView = 'grid';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.setupSampleData();
        
        console.log('🎥 YouTube URL Extraction System initialized');
    }
    
    initializeElements() {
        this.searchKeyword = document.getElementById('searchKeyword');
        this.searchBtn = document.getElementById('searchBtn');
        this.maxResults = document.getElementById('maxResults');
        this.sortBy = document.getElementById('sortBy');
        this.duration = document.getElementById('duration');
        
        this.minViews = document.getElementById('minViews');
        this.minSubscribers = document.getElementById('minSubscribers');
        this.dateRange = document.getElementById('dateRange');
        
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsTitle = document.getElementById('resultsTitle');
        this.resultsStats = document.getElementById('resultsStats');
        this.videoGrid = document.getElementById('videoGrid');
        
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.gridView = document.getElementById('gridView');
        this.listView = document.getElementById('listView');
        
        this.exportModal = document.getElementById('exportModal');
        this.closeModal = document.getElementById('closeModal');
        this.exportCsv = document.getElementById('exportCsv');
        this.exportJson = document.getElementById('exportJson');
        this.exportTxt = document.getElementById('exportTxt');
        
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        this.keywordTags = document.querySelectorAll('.keyword-tag');
    }
    
    initializeEventListeners() {
        this.searchBtn.addEventListener('click', () => this.startSearch());
        this.searchKeyword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startSearch();
        });
        
        this.exportBtn.addEventListener('click', () => this.showExportModal());
        this.clearBtn.addEventListener('click', () => this.clearResults());
        
        this.gridView.addEventListener('click', () => this.setView('grid'));
        this.listView.addEventListener('click', () => this.setView('list'));
        
        this.closeModal.addEventListener('click', () => this.hideExportModal());
        this.exportCsv.addEventListener('click', () => this.exportData('csv'));
        this.exportJson.addEventListener('click', () => this.exportData('json'));
        this.exportTxt.addEventListener('click', () => this.exportData('txt'));
        
        this.keywordTags.forEach(tag => {
            tag.addEventListener('click', () => {
                this.searchKeyword.value = tag.dataset.keyword;
                this.startSearch();
            });
        });
        
        // モーダル外クリックで閉じる
        this.exportModal.addEventListener('click', (e) => {
            if (e.target === this.exportModal) {
                this.hideExportModal();
            }
        });
    }
    
    setupSampleData() {
        this.sampleVideos = [
            {
                title: "JavaScript完全攻略 - 初心者から上級者まで",
                channel: "プログラミング講座チャンネル",
                channelUrl: "https://youtube.com/@programming-course",
                videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
                views: "1,234,567",
                viewsNum: 1234567,
                subscribers: "856,000",
                subscribersNum: 856000,
                publishedAt: "2024-03-15",
                duration: "45:32",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                description: "JavaScriptの基礎から応用まで詳しく解説する完全ガイドです。"
            },
            {
                title: "Pythonで機械学習を始めよう！基礎から実践まで",
                channel: "AI学習ラボ",
                channelUrl: "https://youtube.com/@ai-learning-lab",
                videoUrl: "https://youtube.com/watch?v=abc123xyz",
                views: "892,341",
                viewsNum: 892341,
                subscribers: "1,200,000",
                subscribersNum: 1200000,
                publishedAt: "2024-02-28",
                duration: "1:12:45",
                thumbnail: "https://img.youtube.com/vi/abc123xyz/maxresdefault.jpg",
                description: "Python言語を使った機械学習の入門から実践的な応用まで学べます。"
            },
            {
                title: "React Hooks完全ガイド - useStateからカスタムフックまで",
                channel: "Web開発マスター",
                channelUrl: "https://youtube.com/@web-dev-master",
                videoUrl: "https://youtube.com/watch?v=react123",
                views: "567,890",
                viewsNum: 567890,
                subscribers: "445,000",
                subscribersNum: 445000,
                publishedAt: "2024-03-10",
                duration: "38:21",
                thumbnail: "https://img.youtube.com/vi/react123/maxresdefault.jpg",
                description: "React Hooksの使い方を基礎から応用まで詳しく解説します。"
            },
            {
                title: "データサイエンス入門 - Pythonでデータ分析",
                channel: "データ分析チャンネル",
                channelUrl: "https://youtube.com/@data-analysis",
                videoUrl: "https://youtube.com/watch?v=data456",
                views: "234,567",
                viewsNum: 234567,
                subscribers: "123,000",
                subscribersNum: 123000,
                publishedAt: "2024-03-20",
                duration: "55:18",
                thumbnail: "https://img.youtube.com/vi/data456/maxresdefault.jpg",
                description: "Pythonを使ったデータサイエンスの基礎を学びます。"
            },
            {
                title: "Webデザイン基礎講座 - Figmaを使ったデザイン作成",
                channel: "デザイン学習室",
                channelUrl: "https://youtube.com/@design-learning",
                videoUrl: "https://youtube.com/watch?v=design789",
                views: "456,789",
                viewsNum: 456789,
                subscribers: "678,000",
                subscribersNum: 678000,
                publishedAt: "2024-03-05",
                duration: "42:15",
                thumbnail: "https://img.youtube.com/vi/design789/maxresdefault.jpg",
                description: "Figmaを使ったモダンなWebデザインの作成方法を学びます。"
            },
            {
                title: "AI技術の最前線 - ChatGPTとGPT-4の活用法",
                channel: "AI Tech News",
                channelUrl: "https://youtube.com/@ai-tech-news",
                videoUrl: "https://youtube.com/watch?v=ai123gpt",
                views: "1,567,890",
                viewsNum: 1567890,
                subscribers: "2,100,000",
                subscribersNum: 2100000,
                publishedAt: "2024-03-25",
                duration: "1:05:42",
                thumbnail: "https://img.youtube.com/vi/ai123gpt/maxresdefault.jpg",
                description: "最新のAI技術とChatGPTの実践的な活用方法を詳しく解説します。"
            }
        ];
    }
    
    async startSearch() {
        const keyword = this.searchKeyword.value.trim();
        if (!keyword) {
            alert('検索キーワードを入力してください');
            return;
        }
        
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.showLoading();
        
        try {
            await this.simulateSearch(keyword);
            this.displayResults();
        } catch (error) {
            console.error('Search error:', error);
            alert('検索中にエラーが発生しました');
        } finally {
            this.hideLoading();
            this.isSearching = false;
        }
    }
    
    async simulateSearch(keyword) {
        const maxResults = parseInt(this.maxResults.value);
        const sortBy = this.sortBy.value;
        const duration = this.duration.value;
        const minViews = parseInt(this.minViews.value) || 0;
        const minSubscribers = parseInt(this.minSubscribers.value) || 0;
        const dateRange = this.dateRange.value;
        
        await this.updateProgress(20, 'YouTube API接続中...');
        await this.delay(800);
        
        await this.updateProgress(40, '検索条件設定中...');
        await this.delay(600);
        
        await this.updateProgress(60, '動画情報取得中...');
        
        // キーワードベースでサンプルデータをフィルタリング
        let filteredVideos = this.sampleVideos.filter(video => {
            const keywordMatch = video.title.toLowerCase().includes(keyword.toLowerCase()) ||
                               video.description.toLowerCase().includes(keyword.toLowerCase()) ||
                               video.channel.toLowerCase().includes(keyword.toLowerCase());
            
            const viewsMatch = video.viewsNum >= minViews;
            const subscribersMatch = video.subscribersNum >= minSubscribers;
            
            return keywordMatch && viewsMatch && subscribersMatch;
        });
        
        // サンプルデータが不足している場合は生成
        if (filteredVideos.length < maxResults) {
            filteredVideos = this.generateVideoData(keyword, maxResults);
        }
        
        await this.delay(1000);
        
        await this.updateProgress(80, 'チャンネル情報取得中...');
        await this.delay(800);
        
        await this.updateProgress(95, 'データ整理中...');
        
        // ソート処理
        filteredVideos = this.sortVideos(filteredVideos, sortBy);
        
        // 結果数制限
        this.searchResults = filteredVideos.slice(0, maxResults);
        
        await this.delay(500);
        await this.updateProgress(100, '完了');
    }
    
    generateVideoData(keyword, count) {
        const videos = [];
        const titles = [
            `${keyword}の基礎講座 - 初心者向け完全ガイド`,
            `${keyword}実践編 - プロジェクトベース学習`,
            `${keyword}上級テクニック集`,
            `${keyword}で作る実用アプリケーション`,
            `${keyword}トレンド解説 2024年版`,
            `${keyword}のベストプラクティス`,
            `${keyword}エラー解決法まとめ`,
            `${keyword}パフォーマンス最適化`,
            `${keyword}セキュリティ対策`,
            `${keyword}将来性と学習ロードマップ`
        ];
        
        const channels = [
            { name: 'プログラミング講座', subscribers: 850000 },
            { name: 'Tech解説チャンネル', subscribers: 1200000 },
            { name: '開発者向けTips', subscribers: 450000 },
            { name: 'IT学習ラボ', subscribers: 670000 },
            { name: 'コーディング道場', subscribers: 320000 },
            { name: 'Web技術研究所', subscribers: 890000 }
        ];
        
        for (let i = 0; i < count; i++) {
            const channel = channels[i % channels.length];
            const title = titles[i % titles.length];
            const views = Math.floor(Math.random() * 2000000) + 10000;
            const publishedDays = Math.floor(Math.random() * 365);
            const publishedDate = new Date();
            publishedDate.setDate(publishedDate.getDate() - publishedDays);
            
            videos.push({
                title: title,
                channel: channel.name,
                channelUrl: `https://youtube.com/@${channel.name.toLowerCase().replace(/\\s+/g, '-')}`,
                videoUrl: `https://youtube.com/watch?v=${this.generateVideoId()}`,
                views: this.formatNumber(views),
                viewsNum: views,
                subscribers: this.formatNumber(channel.subscribers),
                subscribersNum: channel.subscribers,
                publishedAt: publishedDate.toISOString().split('T')[0],
                duration: this.generateDuration(),
                thumbnail: `https://img.youtube.com/vi/${this.generateVideoId()}/maxresdefault.jpg`,
                description: `${keyword}に関する詳しい解説動画です。基礎から応用まで幅広くカバーしています。`
            });
        }
        
        return videos;
    }
    
    generateVideoId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        let result = '';
        for (let i = 0; i < 11; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    generateDuration() {
        const minutes = Math.floor(Math.random() * 120) + 5;
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    sortVideos(videos, sortBy) {
        switch (sortBy) {
            case 'date':
                return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            case 'viewCount':
                return videos.sort((a, b) => b.viewsNum - a.viewsNum);
            case 'rating':
                return videos.sort((a, b) => b.subscribersNum - a.subscribersNum);
            default: // relevance
                return videos;
        }
    }
    
    displayResults() {
        this.resultsTitle.textContent = `検索結果 (${this.searchResults.length}件)`;
        this.displayStats();
        this.displayVideos();
    }
    
    displayStats() {
        const totalViews = this.searchResults.reduce((sum, video) => sum + video.viewsNum, 0);
        const avgViews = Math.floor(totalViews / this.searchResults.length);
        const totalSubscribers = this.searchResults.reduce((sum, video) => sum + video.subscribersNum, 0);
        const avgSubscribers = Math.floor(totalSubscribers / this.searchResults.length);
        
        this.resultsStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${this.searchResults.length}</div>
                <div class="stat-label">動画数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatNumber(totalViews)}</div>
                <div class="stat-label">総再生回数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatNumber(avgViews)}</div>
                <div class="stat-label">平均再生回数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatNumber(avgSubscribers)}</div>
                <div class="stat-label">平均登録者数</div>
            </div>
        `;
    }
    
    displayVideos() {
        this.videoGrid.innerHTML = '';
        this.videoGrid.className = `video-grid ${this.currentView}-view`;
        
        this.searchResults.forEach(video => {
            const videoCard = this.createVideoCard(video);
            this.videoGrid.appendChild(videoCard);
        });
    }
    
    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card fade-in';
        
        const publishedDate = new Date(video.publishedAt).toLocaleDateString('ja-JP');
        
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><rect width='320' height='180' fill='%23ff4757'/><polygon points='120,60 120,120 180,90' fill='white'/></svg>" alt="Thumbnail" loading="lazy">
                <div class="video-duration">${video.duration}</div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <a href="${video.channelUrl}" class="video-channel" target="_blank">${video.channel}</a>
                <div class="video-stats">
                    <div>👁️ ${video.views} 回再生</div>
                    <div>👥 ${video.subscribers} 人</div>
                </div>
                <div class="video-meta">
                    <span class="video-date">📅 ${publishedDate}</span>
                    <a href="${video.videoUrl}" class="video-url" target="_blank">🔗 動画を見る</a>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.matches('a')) {
                window.open(video.videoUrl, '_blank');
            }
        });
        
        return card;
    }
    
    setView(view) {
        this.currentView = view;
        
        this.gridView.classList.toggle('active', view === 'grid');
        this.listView.classList.toggle('active', view === 'list');
        
        if (this.searchResults.length > 0) {
            this.displayVideos();
        }
    }
    
    clearResults() {
        this.searchResults = [];
        this.searchKeyword.value = '';
        this.resultsTitle.textContent = '検索結果';
        this.resultsStats.innerHTML = '';
        this.videoGrid.innerHTML = `
            <div class="placeholder">
                <h4>🔍 検索を開始してください</h4>
                <p>キーワードを入力して「検索開始」ボタンを押してください</p>
            </div>
        `;
    }
    
    showExportModal() {
        if (this.searchResults.length === 0) {
            alert('エクスポートするデータがありません');
            return;
        }
        this.exportModal.classList.add('show');
    }
    
    hideExportModal() {
        this.exportModal.classList.remove('show');
    }
    
    exportData(format) {
        const options = {
            title: document.getElementById('includeTitle').checked,
            url: document.getElementById('includeUrl').checked,
            channel: document.getElementById('includeChannel').checked,
            views: document.getElementById('includeViews').checked,
            date: document.getElementById('includeDate').checked,
            subscribers: document.getElementById('includeSubscribers').checked,
            duration: document.getElementById('includeDuration').checked,
            description: document.getElementById('includeDescription').checked
        };
        
        switch (format) {
            case 'csv':
                this.exportAsCSV(options);
                break;
            case 'json':
                this.exportAsJSON(options);
                break;
            case 'txt':
                this.exportAsText(options);
                break;
        }
        
        this.hideExportModal();
    }
    
    exportAsCSV(options) {
        const headers = [];
        if (options.title) headers.push('タイトル');
        if (options.url) headers.push('URL');
        if (options.channel) headers.push('チャンネル名');
        if (options.views) headers.push('再生回数');
        if (options.date) headers.push('投稿日');
        if (options.subscribers) headers.push('登録者数');
        if (options.duration) headers.push('動画長');
        if (options.description) headers.push('説明文');
        
        const rows = [headers];
        
        this.searchResults.forEach(video => {
            const row = [];
            if (options.title) row.push(`"${video.title.replace(/"/g, '""')}"`);
            if (options.url) row.push(video.videoUrl);
            if (options.channel) row.push(`"${video.channel}"`);
            if (options.views) row.push(video.views);
            if (options.date) row.push(video.publishedAt);
            if (options.subscribers) row.push(video.subscribers);
            if (options.duration) row.push(video.duration);
            if (options.description) row.push(`"${video.description.replace(/"/g, '""')}"`);
            rows.push(row);
        });
        
        const csvContent = rows.map(row => row.join(',')).join('\\n');
        this.downloadFile(csvContent, 'youtube-search-results.csv', 'text/csv');
    }
    
    exportAsJSON(options) {
        const data = this.searchResults.map(video => {
            const item = {};
            if (options.title) item.title = video.title;
            if (options.url) item.url = video.videoUrl;
            if (options.channel) item.channel = video.channel;
            if (options.views) item.views = video.views;
            if (options.date) item.publishedAt = video.publishedAt;
            if (options.subscribers) item.subscribers = video.subscribers;
            if (options.duration) item.duration = video.duration;
            if (options.description) item.description = video.description;
            return item;
        });
        
        const jsonData = {
            searchKeyword: this.searchKeyword.value,
            searchDate: new Date().toISOString(),
            resultCount: this.searchResults.length,
            videos: data
        };
        
        this.downloadFile(JSON.stringify(jsonData, null, 2), 'youtube-search-results.json', 'application/json');
    }
    
    exportAsText(options) {
        let content = `YouTube検索結果\\n`;
        content += `検索キーワード: ${this.searchKeyword.value}\\n`;
        content += `検索日時: ${new Date().toLocaleString('ja-JP')}\\n`;
        content += `結果件数: ${this.searchResults.length}件\\n\\n`;
        
        this.searchResults.forEach((video, index) => {
            content += `${index + 1}. `;
            if (options.title) content += `${video.title}\\n`;
            if (options.channel) content += `   チャンネル: ${video.channel}\\n`;
            if (options.views) content += `   再生回数: ${video.views}\\n`;
            if (options.subscribers) content += `   登録者数: ${video.subscribers}\\n`;
            if (options.date) content += `   投稿日: ${video.publishedAt}\\n`;
            if (options.duration) content += `   動画長: ${video.duration}\\n`;
            if (options.url) content += `   URL: ${video.videoUrl}\\n`;
            if (options.description) content += `   説明: ${video.description}\\n`;
            content += '\\n';
        });
        
        this.downloadFile(content, 'youtube-search-results.txt', 'text/plain');
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
        
        if (message) {
            this.loadingText.textContent = message;
        }
        
        await this.delay(50);
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
    window.youtubeExtractor = new YouTubeExtractor();
});