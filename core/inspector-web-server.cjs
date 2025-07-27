#!/usr/bin/env node

/**
 * Inspector AI Web Report Server
 * Markdownレポートを美しいWebページでブラウザ表示
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { spawn } = require('child_process');

class InspectorWebServer {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.logsDir = path.join(this.baseDir, 'logs');
        this.port = 3001; // デフォルトポート
        this.server = null;
        this.isRunning = false;
    }

    /**
     * Markdownを美しいHTMLに変換
     */
    markdownToHtml(markdown, title = 'Inspector AI Report') {
        // 基本的なMarkdown→HTML変換
        let html = markdown
            // コードブロック
            .replace(/```mermaid\n([\s\S]*?)\n```/g, (match, code) => {
                return `<div class="mermaid">\n${code}\n</div>`;
            })
            .replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
            })
            // テーブル
            .replace(/\|(.+)\|\n\|[-:\s\|]+\|\n((?:\|.+\|\n?)*)/g, (match, header, rows) => {
                const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell)
                    .map(cell => `<th>${cell}</th>`).join('');
                const bodyRows = rows.trim().split('\n').map(row => {
                    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
                        .map(cell => `<td>${this.processInlineMarkdown(cell)}</td>`).join('');
                    return `<tr>${cells}</tr>`;
                }).join('');
                
                return `<table class="inspector-table">
                    <thead><tr>${headerCells}</tr></thead>
                    <tbody>${bodyRows}</tbody>
                </table>`;
            })
            // 見出し
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // リスト
            .replace(/^- \*\*(.*?)\*\*: (.*$)/gm, '<li><strong>$1</strong>: $2</li>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            // 改行をliで囲む
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\s*<ul>/g, '')
            // 強調
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // リンク
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 改行
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // pタグで囲む
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><\/p>/g, '').replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1');

        return this.generateFullHtml(html, title);
    }

    /**
     * インライン Markdown 処理
     */
    processInlineMarkdown(text) {
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    /**
     * HTML エスケープ
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 完全なHTMLページ生成
     */
    generateFullHtml(content, title) {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        h2 {
            color: #34495e;
            border-left: 4px solid #3498db;
            padding-left: 15px;
            margin-top: 35px;
            margin-bottom: 20px;
        }
        
        h3 {
            color: #7f8c8d;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        
        .inspector-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .inspector-table th {
            background: #3498db;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .inspector-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .inspector-table tr:hover {
            background: #f8f9fa;
        }
        
        .inspector-table tr:last-child td {
            border-bottom: none;
        }
        
        ul {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 6px;
            border-left: 4px solid #27ae60;
        }
        
        li {
            margin: 8px 0;
        }
        
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        code {
            background: #ecf0f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            color: #e74c3c;
        }
        
        pre code {
            background: none;
            color: #ecf0f1;
            padding: 0;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .mermaid {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #fefefe;
            border-radius: 8px;
            border: 1px solid #ecf0f1;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
            margin: 2px;
        }
        
        .status-ok { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-error { background: #f8d7da; color: #721c24; }
        
        .inspector-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .inspector-header h1 {
            margin: 0;
            border: none;
            color: white;
        }
        
        .timestamp {
            opacity: 0.8;
            font-size: 0.9em;
            margin-top: 10px;
        }
        
        .navigation {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 15px;
            max-width: 200px;
        }
        
        .navigation h4 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 0.9em;
        }
        
        .navigation a {
            display: block;
            padding: 5px 0;
            font-size: 0.85em;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .navigation a:last-child {
            border-bottom: none;
        }
        
        @media (max-width: 768px) {
            .navigation {
                display: none;
            }
            
            body {
                padding: 10px;
            }
            
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="inspector-header">
        <h1>🔍 Inspector AI Report</h1>
        <div class="timestamp">Generated: ${new Date().toLocaleString('ja-JP')}</div>
    </div>
    
    <div class="navigation">
        <h4>📋 Navigation</h4>
        <a href="#summary">Summary</a>
        <a href="#details">Details</a>
        <a href="#mermaid">Visualizations</a>
    </div>
    
    <div class="container">
        ${content}
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: { useMaxWidth: true }
        });
        
        // スムーススクロール
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    </script>
</body>
</html>`;
    }

    /**
     * HTTPサーバー開始
     */
    startServer() {
        if (this.isRunning) {
            console.log(`🌐 Inspector Web Server: 既に稼働中 (http://localhost:${this.port})`);
            return `http://localhost:${this.port}`;
        }

        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // CORS設定
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (pathname === '/') {
                this.serveMainReport(res);
            } else if (pathname === '/latest') {
                this.serveLatestReport(res);
            } else if (pathname.startsWith('/file/')) {
                const fileName = pathname.replace('/file/', '');
                this.serveSpecificFile(res, fileName);
            } else if (pathname === '/api/files') {
                this.serveFileList(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - ページが見つかりません</h1>');
            }
        });

        this.server.listen(this.port, () => {
            this.isRunning = true;
            console.log(`🌐 Inspector Web Server: 起動完了 (http://localhost:${this.port})`);
        });

        this.server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                this.port++;
                console.log(`📡 ポート${this.port - 1}使用中、ポート${this.port}で再試行`);
                this.startServer();
            } else {
                console.error('❌ Web Server エラー:', err.message);
            }
        });

        return `http://localhost:${this.port}`;
    }

    /**
     * メインレポート提供
     */
    serveMainReport(res) {
        try {
            const reportFiles = this.getLatestReportFiles();
            
            if (reportFiles.length === 0) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(this.generateFullHtml('<h2>📋 レポートがまだ生成されていません</h2><p>Inspector AIでチェックを実行してください。</p>', 'Inspector AI - No Reports'));
                return;
            }

            // 最新のレポートを統合
            let combinedMarkdown = '# 🔍 Inspector AI 統合レポート\n\n';
            
            reportFiles.forEach(file => {
                const content = fs.readFileSync(file.path, 'utf8');
                combinedMarkdown += `## 📄 ${file.name}\n\n${content}\n\n---\n\n`;
            });

            const html = this.markdownToHtml(combinedMarkdown, 'Inspector AI - 統合レポート');
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (error) {
            console.error('❌ メインレポート生成エラー:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>500 - サーバーエラー</h1>');
        }
    }

    /**
     * 最新レポート提供
     */
    serveLatestReport(res) {
        try {
            const latestFile = this.getLatestReportFiles()[0];
            
            if (!latestFile) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>レポートが見つかりません</h1>');
                return;
            }

            const markdown = fs.readFileSync(latestFile.path, 'utf8');
            const html = this.markdownToHtml(markdown, `Inspector AI - ${latestFile.name}`);
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (error) {
            console.error('❌ 最新レポート生成エラー:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>500 - サーバーエラー</h1>');
        }
    }

    /**
     * 特定ファイル提供
     */
    serveSpecificFile(res, fileName) {
        try {
            const filePath = path.join(this.logsDir, fileName);
            
            if (!fs.existsSync(filePath) || !fileName.endsWith('.md')) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>ファイルが見つかりません</h1>');
                return;
            }

            const markdown = fs.readFileSync(filePath, 'utf8');
            const html = this.markdownToHtml(markdown, `Inspector AI - ${fileName}`);
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        } catch (error) {
            console.error('❌ ファイル提供エラー:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>500 - サーバーエラー</h1>');
        }
    }

    /**
     * ファイル一覧API
     */
    serveFileList(res) {
        try {
            const files = this.getLatestReportFiles();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(files));
        } catch (error) {
            console.error('❌ ファイル一覧エラー:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    /**
     * 最新レポートファイル取得
     */
    getLatestReportFiles() {
        if (!fs.existsSync(this.logsDir)) {
            return [];
        }

        const files = fs.readdirSync(this.logsDir)
            .filter(file => file.endsWith('.md'))
            .map(file => {
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    mtime: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.mtime - a.mtime)
            .slice(0, 10); // 最新10件

        return files;
    }

    /**
     * ブラウザ自動起動
     */
    openInBrowser(url) {
        const platform = process.platform;
        let command, args = [];

        if (platform === 'darwin') {
            command = 'open';
            args = [url];
        } else if (platform === 'win32') {
            command = 'cmd';
            args = ['/c', 'start', url];
        } else if (platform === 'linux') {
            // WSLかLinuxかを判定
            try {
                const releaseInfo = fs.readFileSync('/proc/version', 'utf8');
                if (releaseInfo.includes('microsoft') || releaseInfo.includes('WSL')) {
                    // WSL環境 - Windowsのstart コマンドを使用
                    command = 'cmd.exe';
                    args = ['/c', 'start', url];
                } else {
                    // 通常のLinux
                    command = 'xdg-open';
                    args = [url];
                }
            } catch (error) {
                // /proc/versionが読めない場合は通常のLinuxとして処理
                command = 'xdg-open';
                args = [url];
            }
        } else {
            console.log(`🌐 ブラウザで開いてください: ${url}`);
            return;
        }

        try {
            const child = spawn(command, args, { 
                detached: true, 
                stdio: 'ignore'
            });
            
            child.on('error', (error) => {
                console.log(`🌐 ブラウザで開いてください: ${url}`);
            });
            
            child.unref();
            console.log(`🚀 ブラウザで開きました: ${url}`);
        } catch (error) {
            console.log(`🌐 ブラウザで開いてください: ${url}`);
        }
    }

    /**
     * サーバー停止
     */
    stopServer() {
        if (this.server && this.isRunning) {
            this.server.close(() => {
                console.log('🛑 Inspector Web Server: 停止');
                this.isRunning = false;
            });
        }
    }

    /**
     * レポート生成＆ブラウザ起動
     */
    async generateAndServeReport() {
        const url = this.startServer();
        
        // 少し待ってからブラウザ起動
        setTimeout(() => {
            this.openInBrowser(url);
        }, 1000);

        return url;
    }
}

// CLI実行部分
if (require.main === module) {
    const webServer = new InspectorWebServer();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            webServer.generateAndServeReport().then(url => {
                console.log(`🌐 Inspector Web Server: ${url}`);
            });
            break;
        case 'stop':
            webServer.stopServer();
            break;
        default:
            console.log(`
🌐 Inspector Web Server

使用方法:
  node inspector-web-server.cjs start     # サーバー起動＆ブラウザ表示
  node inspector-web-server.cjs stop      # サーバー停止
            `);
    }
}

module.exports = InspectorWebServer;