#!/usr/bin/env node

/**
 * Inspector AI App Scanner
 * Worker作成アプリの自動発見・URL抽出・デプロイ状態確認
 */

const fs = require('fs');
const path = require('path');

class InspectorAppScanner {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.tempDeployDir = path.join(this.baseDir, 'temp-deploy');
        this.publishedAppsDir = path.join(this.baseDir, 'published-apps');
        this.scanResultFile = path.join(this.baseDir, 'logs', 'app-scan-results.json');
        
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.scanResultFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * アプリディレクトリの完全スキャン
     */
    scanAllAppDirectories() {
        console.log('🔍 Inspector App Scanner: アプリディレクトリスキャン開始');
        
        const apps = [];
        
        // temp-deployディレクトリスキャン
        if (fs.existsSync(this.tempDeployDir)) {
            const tempApps = this.scanDirectory(this.tempDeployDir, 'temp-deploy');
            apps.push(...tempApps);
        }
        
        // published-appsディレクトリスキャン
        if (fs.existsSync(this.publishedAppsDir)) {
            const publishedApps = this.scanDirectory(this.publishedAppsDir, 'published-apps');
            apps.push(...publishedApps);
        }
        
        console.log(`📋 発見されたアプリ: ${apps.length}件`);
        
        return apps;
    }

    /**
     * ディレクトリ内のアプリスキャン
     */
    scanDirectory(dirPath, type) {
        const apps = [];
        
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            entries.forEach(entry => {
                if (entry.isDirectory() && entry.name.startsWith('app-')) {
                    const appData = this.analyzeAppDirectory(path.join(dirPath, entry.name), entry.name, type);
                    if (appData) {
                        apps.push(appData);
                    }
                }
            });
        } catch (error) {
            console.error(`❌ ディレクトリスキャンエラー: ${dirPath}`, error.message);
        }
        
        return apps;
    }

    /**
     * 個別アプリディレクトリ分析
     */
    analyzeAppDirectory(appDir, appId, type) {
        try {
            const sessionLogPath = path.join(appDir, 'session-log.json');
            const indexHtmlPath = path.join(appDir, 'index.html');
            
            const appData = {
                appId,
                type, // 'temp-deploy' or 'published-apps'
                appDir,
                sessionLogPath,
                indexHtmlPath,
                status: 'unknown',
                urls: [],
                files: [],
                features: [],
                lastModified: null,
                deploymentInfo: null,
                errors: []
            };

            // ファイル存在確認
            if (fs.existsSync(indexHtmlPath)) {
                appData.files.push('index.html');
                appData.status = 'files_exist';
                
                const stats = fs.statSync(indexHtmlPath);
                appData.lastModified = stats.mtime.toISOString();
            }

            // 追加ファイル確認
            ['script.js', 'style.css', 'styles.css'].forEach(fileName => {
                const filePath = path.join(appDir, fileName);
                if (fs.existsSync(filePath)) {
                    appData.files.push(fileName);
                }
            });

            // session-log.json分析
            if (fs.existsSync(sessionLogPath)) {
                try {
                    const sessionLog = JSON.parse(fs.readFileSync(sessionLogPath, 'utf8'));
                    
                    // URL抽出
                    this.extractUrlsFromSessionLog(sessionLog, appData);
                    
                    // 機能・情報抽出
                    this.extractAppInfoFromSessionLog(sessionLog, appData);
                    
                } catch (error) {
                    appData.errors.push(`session-log.json解析エラー: ${error.message}`);
                }
            }

            // URLの推測生成
            this.generatePredictedUrls(appData);

            return appData;
        } catch (error) {
            console.error(`❌ アプリ分析エラー: ${appId}`, error.message);
            return null;
        }
    }

    /**
     * session-log.jsonからURL抽出
     */
    extractUrlsFromSessionLog(sessionLog, appData) {
        // パターン1: deployment.targetUrl
        if (sessionLog.deployment && sessionLog.deployment.targetUrl) {
            appData.urls.push({
                type: 'deployment_target',
                url: sessionLog.deployment.targetUrl,
                source: 'session-log.deployment.targetUrl'
            });
        }

        // パターン2: deployUrl (直接)
        if (sessionLog.deployUrl) {
            appData.urls.push({
                type: 'deploy_url',
                url: sessionLog.deployUrl,
                source: 'session-log.deployUrl'
            });
        }

        // パターン3: artifacts.urls
        if (sessionLog.artifacts && sessionLog.artifacts.urls) {
            sessionLog.artifacts.urls.forEach(url => {
                appData.urls.push({
                    type: 'artifact_url',
                    url,
                    source: 'session-log.artifacts.urls'
                });
            });
        }

        // パターン4: 任意のフィールドからURL検索
        this.searchUrlsInObject(sessionLog, appData, 'session-log');
    }

    /**
     * オブジェクト内のURL検索
     */
    searchUrlsInObject(obj, appData, source, depth = 0) {
        if (depth > 5) return; // 深度制限

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && this.isUrl(value)) {
                appData.urls.push({
                    type: 'found_in_object',
                    url: value,
                    source: `${source}.${key}`
                });
            } else if (typeof value === 'object' && value !== null) {
                this.searchUrlsInObject(value, appData, `${source}.${key}`, depth + 1);
            }
        }
    }

    /**
     * URL判定
     */
    isUrl(str) {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * アプリ情報抽出
     */
    extractAppInfoFromSessionLog(sessionLog, appData) {
        // アプリタイトル
        if (sessionLog.appTitle) {
            appData.title = sessionLog.appTitle;
        }

        // アプリ説明
        if (sessionLog.appDescription) {
            appData.description = sessionLog.appDescription;
        }

        // 機能リスト
        if (sessionLog.features) {
            appData.features = sessionLog.features;
        }

        // デプロイ情報
        if (sessionLog.deployment) {
            appData.deploymentInfo = {
                status: sessionLog.deployment.status,
                startTime: sessionLog.deployment.startTime,
                endTime: sessionLog.deployment.endTime
            };
        }

        // ファイル情報
        if (sessionLog.files) {
            sessionLog.files.forEach(file => {
                if (!appData.files.includes(file)) {
                    appData.files.push(file);
                }
            });
        }
    }

    /**
     * 予測URL生成
     */
    generatePredictedUrls(appData) {
        const baseUrl = 'https://muumuu8181.github.io/published-apps';
        
        // 基本的なGitHub Pages URL
        const predictedUrl = `${baseUrl}/${appData.appId}/`;
        
        appData.urls.push({
            type: 'predicted',
            url: predictedUrl,
            source: 'pattern_prediction'
        });

        // index.htmlを明示的に含む
        appData.urls.push({
            type: 'predicted_with_index',
            url: `${predictedUrl}index.html`,
            source: 'pattern_prediction_index'
        });
    }

    /**
     * URLチェック実行
     */
    async performUrlChecks(apps) {
        const InspectorUrlChecker = require('./inspector-url-checker.cjs');
        const urlChecker = new InspectorUrlChecker();
        
        const allUrls = [];
        const urlAppMapping = {};
        
        // 全URLを収集
        apps.forEach(app => {
            app.urls.forEach(urlData => {
                allUrls.push(urlData.url);
                urlAppMapping[urlData.url] = {
                    appId: app.appId,
                    type: urlData.type,
                    source: urlData.source
                };
            });
        });

        // 重複URL除去
        const uniqueUrls = [...new Set(allUrls)];
        
        if (uniqueUrls.length === 0) {
            console.log('⚠️ チェック対象URLが見つかりませんでした');
            return [];
        }

        console.log(`🔍 URL Accessibility Check: ${uniqueUrls.length}件のURLをチェック`);
        
        // URLチェック実行
        const urlResults = await urlChecker.checkMultipleUrls(uniqueUrls);
        
        // 結果にアプリ情報を付加
        urlResults.forEach(result => {
            const mapping = urlAppMapping[result.url];
            if (mapping) {
                result.appId = mapping.appId;
                result.urlType = mapping.type;
                result.urlSource = mapping.source;
            }
        });

        return urlResults;
    }

    /**
     * 統合スキャン＆チェック実行
     */
    async performCompleteAppScan() {
        const startTime = Date.now();
        console.log('🚀 Inspector App Scanner: 完全スキャン開始');
        
        // アプリディレクトリスキャン
        const apps = this.scanAllAppDirectories();
        
        if (apps.length === 0) {
            console.log('⚠️ アプリが見つかりませんでした');
            return { success: false, message: 'No apps found' };
        }

        // URLチェック実行
        const urlResults = await this.performUrlChecks(apps);
        
        // 結果統合
        const scanResult = {
            timestamp: new Date().toISOString(),
            scanId: `scan-${Date.now()}`,
            summary: {
                totalApps: apps.length,
                totalUrls: urlResults.length,
                accessibleUrls: urlResults.filter(r => r.accessible).length,
                failedUrls: urlResults.filter(r => !r.accessible).length,
                duration: Date.now() - startTime
            },
            apps,
            urlResults
        };

        // 結果保存
        this.saveScanResults(scanResult);
        
        // レポート生成
        this.generateAppScanReport(scanResult);
        
        console.log(`✅ Complete App Scan: 完了 (${scanResult.summary.duration}ms)`);
        console.log(`📊 アプリ: ${scanResult.summary.totalApps}件, URL: ${scanResult.summary.accessibleUrls}/${scanResult.summary.totalUrls}件正常`);
        
        return scanResult;
    }

    /**
     * スキャン結果保存
     */
    saveScanResults(scanResult) {
        try {
            let allResults = [];
            
            if (fs.existsSync(this.scanResultFile)) {
                allResults = JSON.parse(fs.readFileSync(this.scanResultFile, 'utf8'));
            }
            
            allResults.unshift(scanResult);
            allResults = allResults.slice(0, 20); // 最新20件保持
            
            fs.writeFileSync(this.scanResultFile, JSON.stringify(allResults, null, 2));
            console.log(`💾 スキャン結果保存完了`);
        } catch (error) {
            console.error('❌ スキャン結果保存エラー:', error.message);
        }
    }

    /**
     * アプリスキャンレポート生成
     */
    generateAppScanReport(scanResult) {
        const reportFile = path.join(this.baseDir, 'logs', `app-scan-report-${Date.now()}.md`);
        const timestamp = new Date(scanResult.timestamp).toLocaleString('ja-JP');
        
        let report = `# 📱 Inspector AI App Scan Report

**スキャン実行**: ${timestamp}
**処理時間**: ${scanResult.summary.duration}ms

## 📊 スキャン結果サマリー

| 項目 | 件数 | ステータス |
|------|------|------------|
| 発見アプリ | ${scanResult.summary.totalApps} | 📱 |
| 検出URL | ${scanResult.summary.totalUrls} | 🔗 |
| 正常URL | ${scanResult.summary.accessibleUrls} | ✅ |
| 異常URL | ${scanResult.summary.failedUrls} | ${scanResult.summary.failedUrls > 0 ? '❌' : '✅'} |

## 📋 発見アプリ詳細

`;

        scanResult.apps.forEach(app => {
            const appUrls = scanResult.urlResults.filter(r => r.appId === app.appId);
            const workingUrls = appUrls.filter(r => r.accessible);
            
            report += `### 📱 ${app.appId}\n\n`;
            report += `- **ファイル**: ${app.files.join(', ')}\n`;
            if (app.title) report += `- **タイトル**: ${app.title}\n`;
            if (app.features && app.features.length > 0) {
                report += `- **機能**: ${app.features.slice(0, 3).join(', ')}${app.features.length > 3 ? '...' : ''}\n`;
            }
            report += `- **URL発見**: ${app.urls.length}件\n`;
            report += `- **正常URL**: ${workingUrls.length}件\n`;
            
            if (workingUrls.length > 0) {
                report += `- **アクセス可能**: ${workingUrls[0].url}\n`;
            }
            
            report += '\n';
        });

        if (scanResult.summary.failedUrls > 0) {
            report += `## 🚨 アクセス不可URL\n\n`;
            const failedUrls = scanResult.urlResults.filter(r => !r.accessible);
            
            failedUrls.forEach(result => {
                report += `- **${result.appId}**: ${result.url} (${result.status || 'ERROR'})\n`;
            });
        }

        fs.writeFileSync(reportFile, report);
        console.log(`📄 スキャンレポート生成: ${path.basename(reportFile)}`);
    }
}

// CLI実行部分
if (require.main === module) {
    const appScanner = new InspectorAppScanner();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'scan':
            appScanner.performCompleteAppScan().then(result => {
                if (result.success !== false) {
                    console.log('\n📊 完全スキャン成功');
                    console.log(`📱 アプリ: ${result.summary.totalApps}件`);
                    console.log(`✅ 正常URL: ${result.summary.accessibleUrls}件`);
                    console.log(`❌ 異常URL: ${result.summary.failedUrls}件`);
                }
            });
            break;
        case 'list':
            const apps = appScanner.scanAllAppDirectories();
            console.log('\n📱 発見されたアプリ:');
            apps.forEach(app => {
                console.log(`  ${app.appId}: ${app.files.length}ファイル, ${app.urls.length}URL`);
            });
            break;
        default:
            console.log(`
📱 Inspector App Scanner

使用方法:
  node inspector-app-scanner.cjs scan     # 完全スキャン実行
  node inspector-app-scanner.cjs list     # アプリ一覧表示
            `);
    }
}

module.exports = InspectorAppScanner;