#!/usr/bin/env node
/**
 * Published Apps Inventory Tool
 * GitHubリポジトリから全パブリッシュ済みアプリを調査・分類
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class PublishedAppsInventory {
    constructor() {
        this.repoApiUrl = 'https://api.github.com/repos/muumuu8181/published-apps/git/trees/main?recursive=1';
        this.baseUrl = 'https://muumuu8181.github.io/published-apps/';
        this.inventory = {
            timestamp: new Date().toISOString(),
            totalApps: 0,
            workingApps: [],
            brokenApps: [],
            allApps: [],
            summary: {}
        };
    }

    /**
     * GitHubリポジトリから全アプリディレクトリを取得
     */
    async fetchAllAppsFromRepo() {
        console.log('🔍 GitHub Repository Apps Inventory: 開始');
        console.log(`📄 対象リポジトリ: muumuu8181/published-apps`);
        
        return new Promise((resolve, reject) => {
            // GitHub API contents エンドポイントから直接取得（Python使用）
            const command = `curl -s "https://api.github.com/repos/muumuu8181/published-apps/contents" | python3 -c "
import sys, json
data = json.load(sys.stdin)
apps = [item['name'] for item in data if item['name'].startswith('app-')]
for app in sorted(apps):
    print(app)
"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ GitHub API取得エラー:', error.message);
                    reject(error);
                    return;
                }
                
                const apps = stdout.trim().split('\n').filter(app => app.length > 0);
                console.log(`📋 リポジトリから検出したアプリ: ${apps.length}件`);
                apps.forEach((app, index) => {
                    console.log(`  ${index + 1}. ${app}`);
                });
                
                resolve(apps);
            });
        });
    }

    /**
     * 各アプリの動作確認（GitHub Pages）
     */
    async testAppFunctionality(appList) {
        console.log('\n🔍 アプリ動作確認開始');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const workingApps = [];
        const brokenApps = [];

        for (let i = 0; i < appList.length; i++) {
            const app = appList[i];
            const appUrl = `${this.baseUrl}${app}/`;
            
            console.log(`📱 [${i + 1}/${appList.length}] テスト中: ${app}`);
            console.log(`   URL: ${appUrl}`);
            
            try {
                const status = await this.checkAppStatus(appUrl);
                
                if (status.working) {
                    workingApps.push({
                        name: app,
                        url: appUrl,
                        status: 'working',
                        httpCode: status.httpCode,
                        responseTime: status.responseTime
                    });
                    console.log(`   ✅ 正常動作 (${status.httpCode}) - ${status.responseTime}ms`);
                } else {
                    brokenApps.push({
                        name: app,
                        url: appUrl,
                        status: 'broken',
                        httpCode: status.httpCode,
                        error: status.error
                    });
                    console.log(`   ❌ エラー (${status.httpCode}) - ${status.error}`);
                }
            } catch (error) {
                brokenApps.push({
                    name: app,
                    url: appUrl,
                    status: 'error',
                    error: error.message
                });
                console.log(`   ❌ 接続エラー: ${error.message}`);
            }
            
            console.log('');
        }

        return { workingApps, brokenApps };
    }

    /**
     * 個別アプリの詳細ステータス確認
     */
    async checkAppStatus(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            exec(`curl -s -w "%{http_code}" -o /dev/null "${url}"`, (error, stdout, stderr) => {
                const responseTime = Date.now() - startTime;
                const httpCode = stdout.trim();
                
                if (error) {
                    resolve({
                        working: false,
                        httpCode: 'ERROR',
                        error: error.message,
                        responseTime: responseTime
                    });
                    return;
                }
                
                resolve({
                    working: httpCode === '200',
                    httpCode: httpCode,
                    error: httpCode !== '200' ? `HTTP ${httpCode}` : null,
                    responseTime: responseTime
                });
            });
        });
    }

    /**
     * 詳細分析・サマリー生成
     */
    generateSummary(workingApps, brokenApps, allApps) {
        const summary = {
            totalApps: allApps.length,
            workingCount: workingApps.length,
            brokenCount: brokenApps.length,
            successRate: allApps.length > 0 ? Math.round((workingApps.length / allApps.length) * 100) : 0,
            categories: {
                working: workingApps.map(app => app.name),
                broken: brokenApps.map(app => app.name)
            },
            recommendations: []
        };

        // 推奨アクション
        if (brokenApps.length > 0) {
            summary.recommendations.push(`${brokenApps.length}件の故障アプリの修復が必要`);
        }
        
        if (workingApps.length > 0) {
            summary.recommendations.push(`${workingApps.length}件の正常アプリの定期監視推奨`);
        }

        if (summary.successRate < 50) {
            summary.recommendations.push('システム全体の健全性見直しが必要');
        }

        return summary;
    }

    /**
     * 結果保存（複数形式）
     */
    async saveResults(inventory) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // JSON詳細レポート
        const jsonPath = path.join(__dirname, '../logs/published-apps-inventory.json');
        fs.writeFileSync(jsonPath, JSON.stringify(inventory, null, 2));
        
        // Markdown読みやすいレポート
        const mdContent = this.generateMarkdownReport(inventory);
        const mdPath = path.join(__dirname, '../logs/published-apps-inventory.md');
        fs.writeFileSync(mdPath, mdContent);

        console.log(`💾 結果保存完了:`);
        console.log(`   📄 JSON: ${jsonPath}`);
        console.log(`   📝 Markdown: ${mdPath}`);
        
        return { jsonPath, mdPath };
    }

    /**
     * Markdownレポート生成
     */
    generateMarkdownReport(inventory) {
        return `# Published Apps Inventory Report

## 📊 概要

- **調査日時**: ${inventory.timestamp}
- **総アプリ数**: ${inventory.summary.totalApps}件
- **正常動作**: ${inventory.summary.workingCount}件
- **故障・エラー**: ${inventory.summary.brokenCount}件
- **成功率**: ${inventory.summary.successRate}%

## ✅ 正常動作アプリ (${inventory.workingApps.length}件)

${inventory.workingApps.map((app, index) => 
    `${index + 1}. **${app.name}**\n   - URL: ${app.url}\n   - ステータス: ${app.httpCode} (${app.responseTime}ms)`
).join('\n\n')}

## ❌ 故障・エラーアプリ (${inventory.brokenApps.length}件)

${inventory.brokenApps.map((app, index) => 
    `${index + 1}. **${app.name}**\n   - URL: ${app.url}\n   - エラー: ${app.error || app.httpCode}`
).join('\n\n')}

## 🔧 推奨アクション

${inventory.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by Published Apps Inventory Tool*`;
    }

    /**
     * メイン実行
     */
    async run() {
        try {
            // Step 1: GitHubリポジトリから全アプリ取得
            const allApps = await this.fetchAllAppsFromRepo();
            
            if (allApps.length === 0) {
                console.log('❌ アプリが見つかりませんでした');
                return null;
            }

            // Step 2: 各アプリの動作確認
            const { workingApps, brokenApps } = await this.testAppFunctionality(allApps);

            // Step 3: サマリー生成
            const summary = this.generateSummary(workingApps, brokenApps, allApps);

            // Step 4: インベントリ完成
            this.inventory = {
                timestamp: new Date().toISOString(),
                totalApps: allApps.length,
                workingApps: workingApps,
                brokenApps: brokenApps,
                allApps: allApps,
                summary: summary
            };

            // Step 5: 結果保存
            await this.saveResults(this.inventory);

            // Step 6: コンソール最終結果
            console.log('\n📊 Published Apps Inventory 完了結果:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🎯 総アプリ数: ${summary.totalApps}件`);
            console.log(`✅ 正常動作: ${summary.workingCount}件 (${summary.successRate}%)`);
            console.log(`❌ 故障・エラー: ${summary.brokenCount}件`);
            console.log('\n📋 正常動作アプリ:');
            summary.categories.working.forEach((app, i) => console.log(`  ${i + 1}. ${app}`));
            console.log('\n🚨 故障アプリ:');
            summary.categories.broken.forEach((app, i) => console.log(`  ${i + 1}. ${app}`));

            return this.inventory;

        } catch (error) {
            console.error('🚨 インベントリ作成エラー:', error.message);
            return null;
        }
    }
}

// 実行
if (require.main === module) {
    const inventory = new PublishedAppsInventory();
    inventory.run().then(result => {
        if (result) {
            console.log('\n🎉 Published Apps Inventory 完了');
        } else {
            console.log('\n❌ Inventory作成失敗');
        }
    });
}

module.exports = PublishedAppsInventory;