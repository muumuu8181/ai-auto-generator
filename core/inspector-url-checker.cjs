#!/usr/bin/env node

/**
 * Inspector AI URL Accessibility Checker
 * Worker作成アプリのデプロイ状態・アクセシビリティ確認
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class InspectorUrlChecker {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.checkResultsFile = path.join(this.baseDir, 'logs', 'inspector-url-checks.json');
        this.statusTableFile = path.join(this.baseDir, 'logs', 'deployment-status-table.md');
        this.mermaidReportFile = path.join(this.baseDir, 'logs', 'url-check-mermaid.md');
        
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.checkResultsFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * URLの生存確認
     */
    async checkUrlStatus(url, timeout = 10000) {
        return new Promise((resolve) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const startTime = Date.now();
            
            const req = client.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: 'HEAD',
                timeout: timeout,
                headers: {
                    'User-Agent': 'Inspector-AI-URL-Checker/1.0'
                }
            }, (res) => {
                const responseTime = Date.now() - startTime;
                
                resolve({
                    url,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    responseTime,
                    accessible: res.statusCode >= 200 && res.statusCode < 400,
                    is404: res.statusCode === 404,
                    headers: res.headers,
                    timestamp: new Date().toISOString(),
                    error: null
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                
                resolve({
                    url,
                    status: null,
                    statusText: 'ERROR',
                    responseTime,
                    accessible: false,
                    is404: false,
                    headers: {},
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                
                resolve({
                    url,
                    status: null,
                    statusText: 'TIMEOUT',
                    responseTime,
                    accessible: false,
                    is404: false,
                    headers: {},
                    timestamp: new Date().toISOString(),
                    error: 'Request timeout'
                });
            });

            req.end();
        });
    }

    /**
     * 複数URLの一括チェック
     */
    async checkMultipleUrls(urls) {
        console.log(`🔍 URL Accessibility Check: ${urls.length}件のURLをチェック開始`);
        
        const results = [];
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`📡 チェック中 [${i + 1}/${urls.length}]: ${url}`);
            
            const result = await this.checkUrlStatus(url);
            results.push(result);
            
            // ステータス表示
            const status = result.accessible ? '✅' : (result.is404 ? '❌ (404)' : '⚠️');
            console.log(`   ${status} ${result.status || 'ERROR'} (${result.responseTime}ms)`);
            
            // 連続リクエスト間の間隔
            if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return results;
    }

    /**
     * アプリディレクトリからURL抽出
     */
    async scanAppDirectoriesForUrls() {
        const appUrls = [];
        const tempDeployDir = path.join(this.baseDir, 'temp-deploy');
        
        if (!fs.existsSync(tempDeployDir)) {
            console.log('⚠️ temp-deployディレクトリが見つかりません');
            return appUrls;
        }

        const entries = fs.readdirSync(tempDeployDir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith('app-')) {
                const appDir = path.join(tempDeployDir, entry.name);
                const sessionLogFile = path.join(appDir, 'session-log.json');
                
                if (fs.existsSync(sessionLogFile)) {
                    try {
                        const sessionLog = JSON.parse(fs.readFileSync(sessionLogFile, 'utf8'));
                        
                        // URLを探す
                        if (sessionLog.deployUrl) {
                            appUrls.push({
                                appId: entry.name,
                                url: sessionLog.deployUrl,
                                appDir: appDir,
                                sessionLog: sessionLogFile
                            });
                        }
                    } catch (error) {
                        console.error(`❌ session-log.json読み込みエラー: ${entry.name}`, error.message);
                    }
                }
            }
        }
        
        return appUrls;
    }

    /**
     * 手動URL追加チェック
     */
    async checkCustomUrls(urls) {
        const urlList = Array.isArray(urls) ? urls : [urls];
        const results = await this.checkMultipleUrls(urlList);
        
        this.saveCheckResults(results);
        this.generateStatusTable(results);
        this.generateMermaidReport(results);
        
        return results;
    }

    /**
     * 全アプリのデプロイ状態チェック
     */
    async performFullDeploymentCheck() {
        console.log('🚀 Inspector URL Checker: 全アプリデプロイ状態チェック開始');
        
        const startTime = Date.now();
        
        // アプリディレクトリからURL抽出
        const appUrls = await this.scanAppDirectoriesForUrls();
        
        if (appUrls.length === 0) {
            console.log('⚠️ チェック対象のアプリURLが見つかりませんでした');
            return { success: false, message: 'No URLs found' };
        }

        console.log(`📋 発見されたアプリ: ${appUrls.length}件`);
        
        // URL一括チェック
        const urls = appUrls.map(app => app.url);
        const results = await this.checkMultipleUrls(urls);
        
        // 結果にアプリ情報を追加
        results.forEach((result, index) => {
            result.appId = appUrls[index].appId;
            result.appDir = appUrls[index].appDir;
        });
        
        // 結果保存・レポート生成
        this.saveCheckResults(results);
        this.generateStatusTable(results);
        this.generateMermaidReport(results);
        
        // Evidence Trackerに記録
        try {
            const InspectorEvidenceTracker = require('./inspector-evidence-tracker.cjs');
            const evidenceTracker = new InspectorEvidenceTracker();
            
            results.forEach(result => {
                const status = result.accessible ? 'pass' : 'fail';
                const details = {
                    status: result.status,
                    responseTime: result.responseTime,
                    is404: result.is404,
                    error: result.error
                };
                
                evidenceTracker.recordFileCheck(result.url, status, details);
            });
            
            evidenceTracker.recordAction(
                'URL Accessibility Check',
                'completed',
                { 
                    totalChecked: results.length,
                    accessible: results.filter(r => r.accessible).length,
                    failed: results.filter(r => !r.accessible).length,
                    duration: Date.now() - startTime
                }
            );
        } catch (error) {
            console.error('⚠️ Evidence Tracker記録エラー:', error.message);
        }
        
        const duration = Date.now() - startTime;
        const accessibleCount = results.filter(r => r.accessible).length;
        const failedCount = results.filter(r => !r.accessible).length;
        
        console.log(`✅ URL Accessibility Check: 完了 (${duration}ms)`);
        console.log(`📊 結果: ${accessibleCount}件 OK, ${failedCount}件 NG`);
        
        return {
            success: true,
            results,
            summary: {
                total: results.length,
                accessible: accessibleCount,
                failed: failedCount,
                duration
            }
        };
    }

    /**
     * チェック結果保存
     */
    saveCheckResults(results) {
        try {
            let allResults = [];
            
            if (fs.existsSync(this.checkResultsFile)) {
                allResults = JSON.parse(fs.readFileSync(this.checkResultsFile, 'utf8'));
            }
            
            // 新しい結果を追加
            const newEntry = {
                timestamp: new Date().toISOString(),
                checkId: `check-${Date.now()}`,
                results: results
            };
            
            allResults.unshift(newEntry);
            
            // 最新50件まで保持
            allResults = allResults.slice(0, 50);
            
            fs.writeFileSync(this.checkResultsFile, JSON.stringify(allResults, null, 2));
            console.log(`💾 チェック結果保存: ${results.length}件`);
        } catch (error) {
            console.error('❌ チェック結果保存エラー:', error.message);
        }
    }

    /**
     * デプロイ状態一覧表生成（○×表示）
     */
    generateStatusTable(results) {
        const timestamp = new Date().toLocaleString('ja-JP');
        
        let table = `# 🌐 アプリデプロイ状態一覧表

**最終チェック**: ${timestamp}
**チェック件数**: ${results.length}件

## 📊 デプロイ状態サマリー

| 状態 | 件数 | 割合 |
|------|------|------|
| ✅ 正常アクセス可能 | ${results.filter(r => r.accessible).length} | ${((results.filter(r => r.accessible).length / results.length) * 100).toFixed(1)}% |
| ❌ アクセス不可 | ${results.filter(r => !r.accessible).length} | ${((results.filter(r => !r.accessible).length / results.length) * 100).toFixed(1)}% |
| 🚨 404エラー | ${results.filter(r => r.is404).length} | ${((results.filter(r => r.is404).length / results.length) * 100).toFixed(1)}% |

## 📋 詳細チェック結果

| アプリID | URL | ステータス | レスポンス時間 | 最終確認 |
|----------|-----|------------|----------------|----------|
`;

        results.forEach(result => {
            const appId = result.appId || 'Manual';
            const statusIcon = result.accessible ? '✅' : (result.is404 ? '❌' : '⚠️');
            const statusCode = result.status || 'ERROR';
            const responseTime = `${result.responseTime}ms`;
            const lastCheck = new Date(result.timestamp).toLocaleString('ja-JP');
            
            table += `| ${appId} | [${result.url}](${result.url}) | ${statusIcon} ${statusCode} | ${responseTime} | ${lastCheck} |\n`;
        });

        // 問題のあるURLの詳細
        const problematicUrls = results.filter(r => !r.accessible);
        if (problematicUrls.length > 0) {
            table += `\n## 🚨 問題のあるURL詳細\n\n`;
            
            problematicUrls.forEach(result => {
                table += `### ❌ ${result.appId || 'Manual Check'}\n`;
                table += `- **URL**: ${result.url}\n`;
                table += `- **ステータス**: ${result.status || 'ERROR'}\n`;
                table += `- **エラー**: ${result.error || result.statusText}\n`;
                table += `- **レスポンス時間**: ${result.responseTime}ms\n\n`;
            });
        }

        fs.writeFileSync(this.statusTableFile, table);
        console.log(`📋 ステータステーブル生成: ${path.basename(this.statusTableFile)}`);
    }

    /**
     * Mermaidレポート生成
     */
    generateMermaidReport(results) {
        const timestamp = new Date().toLocaleString('ja-JP');
        const accessibleCount = results.filter(r => r.accessible).length;
        const failedCount = results.filter(r => !r.accessible).length;
        const error404Count = results.filter(r => r.is404).length;
        
        const report = `# 🌐 URL Accessibility Check Report

**チェック実行時刻**: ${timestamp}

## 📊 Overall Status Flow

\`\`\`mermaid
graph TD
    A[🚀 URL Check Start] --> B[📋 ${results.length} URLs Scanned]
    B --> C{🔍 Accessibility Test}
    C -->|${accessibleCount} URLs| D[✅ Accessible]
    C -->|${failedCount} URLs| E[❌ Failed]
    
    E --> F{🚨 Error Type}
    F -->|${error404Count} URLs| G[🚨 404 Not Found]
    F -->|${failedCount - error404Count} URLs| H[⚠️ Other Errors]
    
    D --> I[📊 Check Complete]
    G --> I
    H --> I
    
    style A fill:#e3f2fd
    style D fill:#e8f5e8
    style G fill:#ffcdd2
    style H fill:#fff3e0
    style I fill:#f3e5f5
\`\`\`

## 📈 Status Distribution

\`\`\`mermaid
pie title URL Accessibility Status
    "Accessible (${accessibleCount})" : ${accessibleCount}
    ${failedCount > 0 ? `"Failed (${failedCount})" : ${failedCount}` : ''}
\`\`\`

## 🎯 Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total URLs | ${results.length} | 📊 |
| Accessible | ${accessibleCount} | ${accessibleCount === results.length ? '✅' : '📊'} |
| Failed | ${failedCount} | ${failedCount === 0 ? '✅' : '❌'} |
| 404 Errors | ${error404Count} | ${error404Count === 0 ? '✅' : '🚨'} |
| Success Rate | ${((accessibleCount / results.length) * 100).toFixed(1)}% | ${accessibleCount === results.length ? '🎯' : '📊'} |

${failedCount > 0 ? this.generateFailedUrlsMermaid(results.filter(r => !r.accessible)) : ''}
`;

        fs.writeFileSync(this.mermaidReportFile, report);
        console.log(`📊 Mermaidレポート生成: ${path.basename(this.mermaidReportFile)}`);
    }

    /**
     * 失敗URLのMermaid図生成
     */
    generateFailedUrlsMermaid(failedResults) {
        if (failedResults.length === 0) return '';

        let diagram = `\n## 🚨 Failed URLs Detail\n\n\`\`\`mermaid\ngraph LR\n`;
        
        failedResults.forEach((result, index) => {
            const nodeId = `F${index + 1}`;
            const appId = result.appId || `URL${index + 1}`;
            const errorType = result.is404 ? '404' : 'ERROR';
            
            diagram += `    ${nodeId}[${appId}<br/>${errorType}]\n`;
            
            if (result.is404) {
                diagram += `    style ${nodeId} fill:#ffcdd2\n`;
            } else {
                diagram += `    style ${nodeId} fill:#fff3e0\n`;
            }
        });
        
        diagram += `\`\`\`\n`;
        return diagram;
    }
}

// CLI実行部分
if (require.main === module) {
    const urlChecker = new InspectorUrlChecker();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            const url = process.argv[3];
            if (url) {
                urlChecker.checkCustomUrls([url]).then(results => {
                    console.log('\n📊 チェック結果:');
                    results.forEach(result => {
                        const status = result.accessible ? '✅ OK' : '❌ NG';
                        console.log(`${status} ${result.url} (${result.status || 'ERROR'})`);
                    });
                });
            } else {
                console.error('❌ URLが必要です');
            }
            break;
        case 'check-all':
            urlChecker.performFullDeploymentCheck().then(result => {
                if (result.success) {
                    console.log('\n📊 全アプリチェック完了');
                    console.log(`✅ 正常: ${result.summary.accessible}件`);
                    console.log(`❌ 異常: ${result.summary.failed}件`);
                } else {
                    console.log(`❌ チェック失敗: ${result.message}`);
                }
            });
            break;
        case 'table':
            // 最新結果からテーブル再生成
            if (fs.existsSync(urlChecker.checkResultsFile)) {
                const allResults = JSON.parse(fs.readFileSync(urlChecker.checkResultsFile, 'utf8'));
                if (allResults.length > 0) {
                    urlChecker.generateStatusTable(allResults[0].results);
                    console.log('📋 ステータステーブル再生成完了');
                }
            }
            break;
        default:
            console.log(`
🌐 Inspector URL Checker

使用方法:
  node inspector-url-checker.cjs check <url>           # 個別URL確認
  node inspector-url-checker.cjs check-all             # 全アプリ一括確認
  node inspector-url-checker.cjs table                 # ステータステーブル再生成
            `);
    }
}

module.exports = InspectorUrlChecker;