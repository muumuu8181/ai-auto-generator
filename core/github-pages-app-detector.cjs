#!/usr/bin/env node
/**
 * GitHub Pages App Detector Tool
 * https://muumuu8181.github.io/published-apps/ から全アプリを検出
 */

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubPagesAppDetector {
    constructor() {
        this.baseUrl = 'https://muumuu8181.github.io/published-apps/';
        this.detectedApps = [];
        this.results = {
            timestamp: new Date().toISOString(),
            totalApps: 0,
            workingApps: [],
            brokenApps: [],
            allApps: []
        };
    }

    /**
     * GitHub Pages HTMLを完全解析
     */
    async fetchCompleteAppList() {
        console.log('🔍 GitHub Pages App Detector: 開始');
        console.log(`📄 対象URL: ${this.baseUrl}`);
        
        return new Promise((resolve, reject) => {
            // より包括的なパターンでHTMLから全app-エントリを抽出
            const commands = [
                // パターン1: href属性内のapp-リンク
                `curl -s "${this.baseUrl}" | grep -oE 'href="[^"]*app-[^"]*"' | sed 's/href="//;s/"//' | sed 's|^\\./||' | sed 's|/$||' | sort -u`,
                
                // パターン2: HTMLコンテンツ内のapp-文字列
                `curl -s "${this.baseUrl}" | grep -oE 'app-[a-zA-Z0-9]+-[a-zA-Z0-9]+' | sort -u`,
                
                // パターン3: ディレクトリリスト形式（Apacheスタイル）
                `curl -s "${this.baseUrl}" | grep -oE '>app-[^<]*<' | sed 's/>//;s/<///' | sort -u`
            ];

            let allFoundApps = [];
            let completedCommands = 0;

            commands.forEach((command, index) => {
                exec(command, (error, stdout, stderr) => {
                    completedCommands++;
                    
                    if (!error && stdout.trim()) {
                        const apps = stdout.trim().split('\n').filter(app => 
                            app.length > 0 && app.includes('app-')
                        );
                        console.log(`📋 パターン${index + 1}検出: ${apps.length}件`);
                        apps.forEach(app => console.log(`  - ${app}`));
                        allFoundApps = allFoundApps.concat(apps);
                    } else {
                        console.log(`📋 パターン${index + 1}: 検出なし`);
                    }

                    // 全パターン完了時
                    if (completedCommands === commands.length) {
                        // 重複除去
                        const uniqueApps = [...new Set(allFoundApps)];
                        console.log(`\n📊 統合結果: ${uniqueApps.length}件のユニークなアプリを発見`);
                        resolve(uniqueApps);
                    }
                });
            });
        });
    }

    /**
     * 各アプリの生存・動作確認
     */
    async verifyApps(appList) {
        console.log('\n🔍 アプリ生存確認開始');
        
        const workingApps = [];
        const brokenApps = [];

        for (const app of appList) {
            const appUrl = `${this.baseUrl}${app}/`;
            console.log(`📱 確認中: ${app}`);
            
            try {
                const isWorking = await this.checkAppStatus(appUrl);
                
                if (isWorking) {
                    workingApps.push(app);
                    console.log(`  ✅ 正常: ${appUrl}`);
                } else {
                    brokenApps.push(app);
                    console.log(`  ❌ 404/エラー: ${appUrl}`);
                }
            } catch (error) {
                brokenApps.push(app);
                console.log(`  ❌ 接続エラー: ${app}`);
            }
        }

        return { workingApps, brokenApps };
    }

    /**
     * 個別アプリのステータス確認
     */
    async checkAppStatus(url) {
        return new Promise((resolve) => {
            exec(`curl -s -I "${url}" | head -1`, (error, stdout, stderr) => {
                if (error) {
                    resolve(false);
                    return;
                }
                
                const response = stdout.trim();
                resolve(response.includes('200 OK'));
            });
        });
    }

    /**
     * 詳細分析レポート生成
     */
    async generateDetailedReport() {
        const report = {
            ...this.results,
            analysis: {
                successRate: this.results.totalApps > 0 
                    ? Math.round((this.results.workingApps.length / this.results.totalApps) * 100) 
                    : 0,
                recommendedActions: [],
                detectionMethods: [
                    'href属性パターンマッチング',
                    'HTML内容テキスト抽出', 
                    'ディレクトリリスト解析'
                ]
            }
        };

        // 推奨アクション生成
        if (this.results.brokenApps.length > 0) {
            report.analysis.recommendedActions.push(
                `${this.results.brokenApps.length}件の404エラーアプリの修復が必要`
            );
        }
        
        if (this.results.workingApps.length > 0) {
            report.analysis.recommendedActions.push(
                `${this.results.workingApps.length}件の正常アプリの監視継続が推奨`
            );
        }

        return report;
    }

    /**
     * 結果保存
     */
    async saveResults(detailedReport) {
        const outputPath = path.join(__dirname, '../logs/github-pages-app-detection.json');
        fs.writeFileSync(outputPath, JSON.stringify(detailedReport, null, 2));
        
        console.log(`\n💾 詳細レポート保存: ${outputPath}`);
        return outputPath;
    }

    /**
     * メイン実行
     */
    async detect() {
        try {
            // Step 1: 全アプリリスト取得
            const foundApps = await this.fetchCompleteAppList();
            
            if (foundApps.length === 0) {
                console.log('❌ アプリが検出されませんでした');
                return this.results;
            }

            // Step 2: 生存確認
            const { workingApps, brokenApps } = await this.verifyApps(foundApps);

            // Step 3: 結果統合
            this.results = {
                timestamp: new Date().toISOString(),
                totalApps: foundApps.length,
                workingApps: workingApps,
                brokenApps: brokenApps,
                allApps: foundApps,
                baseUrl: this.baseUrl
            };

            // Step 4: 詳細レポート生成・保存
            const detailedReport = await this.generateDetailedReport();
            await this.saveResults(detailedReport);

            // Step 5: 結果表示
            console.log('\n📊 最終検出結果:');
            console.log(`🎯 総アプリ数: ${this.results.totalApps}件`);
            console.log(`✅ 正常稼働: ${this.results.workingApps.length}件`);
            console.log(`❌ エラー: ${this.results.brokenApps.length}件`);
            console.log(`📈 成功率: ${detailedReport.analysis.successRate}%`);

            return this.results;

        } catch (error) {
            console.error('🚨 検出処理エラー:', error.message);
            return null;
        }
    }
}

// 実行
if (require.main === module) {
    const detector = new GitHubPagesAppDetector();
    detector.detect().then(results => {
        if (results) {
            console.log('\n🎉 GitHub Pages App Detection 完了');
        }
    });
}

module.exports = GitHubPagesAppDetector;