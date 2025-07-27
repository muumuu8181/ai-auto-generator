#!/usr/bin/env node
/**
 * External App Detector
 * GitHub Pages上の実際のアプリ数を検出
 */

const https = require('https');
const { exec } = require('child_process');

class ExternalAppDetector {
    constructor() {
        this.githubPagesUrl = 'https://muumuu8181.github.io/published-apps/';
        this.githubApiUrl = 'https://api.github.com/repos/muumuu8181/published-apps/contents';
        this.detectedApps = [];
    }

    /**
     * GitHub Pages直接スクレイピング（修正版）
     */
    async detectFromGitHubPages() {
        return new Promise((resolve, reject) => {
            // より包括的なパターンマッチング
            const command = `curl -s "${this.githubPagesUrl}" | grep -oE 'href="[^"]*app-[^/"]*/' | sed 's/href="//;s|./||;s|/||' | sort -u`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log('📄 GitHub Pages: スクレイピング失敗');
                    resolve([]);
                    return;
                }
                
                const apps = stdout.trim().split('\n').filter(app => app.length > 0);
                console.log(`📄 GitHub Pages検出: ${apps.length}件`);
                apps.forEach(app => console.log(`  - ${app}`));
                resolve(apps);
            });
        });
    }

    /**
     * GitHub API経由でリポジトリ内容取得
     */
    async detectFromGitHubAPI() {
        return new Promise((resolve, reject) => {
            const command = `curl -s "${this.githubApiUrl}" | grep -o '"name":"app-[^"]*"' | sed 's/"name":"//;s/"//' | sort -u`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log('🔗 GitHub API: アクセス失敗');
                    resolve([]);
                    return;
                }
                
                const apps = stdout.trim().split('\n').filter(app => app.length > 0);
                console.log(`🔗 GitHub API検出: ${apps.length}件`);
                apps.forEach(app => console.log(`  - ${app}`));
                resolve(apps);
            });
        });
    }

    /**
     * 包括的アプリ検索（複数パターン）
     */
    async detectComprehensive() {
        console.log('🔍 包括的アプリ検索開始');
        
        // 複数の命名パターンを試行
        const patterns = [
            'app-[0-9][0-9][0-9]-*',      // app-001-xxxxx
            'app-[0-9][0-9][0-9][0-9][0-9][0-9][0-9]-*', // app-0000001-xxxxx
            'app-[a-z]*',                  // app-xxxxx
        ];
        
        const foundApps = [];
        
        // GitHub Pages HTMLパース
        const command = `curl -s "${this.githubPagesUrl}" | grep -oE 'href="[^"]*app-[^/"]*/' | sed 's/href="//;s|./||;s|/$||' | sort -u`;
        
        return new Promise((resolve) => {
            exec(command, async (error, stdout, stderr) => {
                if (!error && stdout.trim()) {
                    const apps = stdout.trim().split('\n').filter(app => app.length > 0);
                    console.log(`📄 HTMLパース検出: ${apps.length}件`);
                    
                    // 生存確認
                    for (const app of apps) {
                        const url = `${this.githubPagesUrl}${app}/`;
                        const isAlive = await this.checkUrlAlive(url);
                        console.log(`  - ${app}: ${isAlive ? '✅正常' : '❌404'}`);
                        if (isAlive) foundApps.push(app);
                    }
                } else {
                    console.log('📄 HTMLパース失敗 - 既知URLで確認');
                    
                    // フォールバック: 既知URL確認
                    const knownUrls = [
                        'app-001-auctrh',
                        'app-0000004-wssf74',
                        'app-0000016-r9dth7', 
                        'app-0000017-k7x9m2',
                        'app-0000018-m9x3k2'
                    ];
                    
                    for (const app of knownUrls) {
                        const url = `${this.githubPagesUrl}${app}/`;
                        const isAlive = await this.checkUrlAlive(url);
                        console.log(`  - ${app}: ${isAlive ? '✅正常' : '❌404'}`);
                        if (isAlive) foundApps.push(app);
                    }
                }
                
                resolve(foundApps);
            });
        });
    }

    /**
     * URL生存確認
     */
    async checkUrlAlive(url) {
        return new Promise((resolve) => {
            exec(`curl -s -I "${url}" | head -1 | grep -q "200"`, (error) => {
                resolve(!error);
            });
        });
    }

    /**
     * 統合検出実行
     */
    async detectAllApps() {
        console.log('🔍 External App Detector: 開始\n');

        try {
            // 包括的検出実行
            const foundApps = await this.detectComprehensive();

            console.log('\n📊 最終結果:');
            console.log(`総検出アプリ数: ${foundApps.length}件`);
            console.log('稼働中アプリ一覧:');
            foundApps.forEach(app => console.log(`  - ${app}`));

            // 結果保存
            this.detectedApps = foundApps;
            await this.saveResults();

            return foundApps;

        } catch (error) {
            console.error('🚨 検出エラー:', error.message);
            return [];
        }
    }

    /**
     * 結果保存
     */
    async saveResults() {
        const fs = require('fs');
        const path = require('path');
        
        const result = {
            timestamp: new Date().toISOString(),
            totalApps: this.detectedApps.length,
            apps: this.detectedApps,
            baseUrl: this.githubPagesUrl
        };

        const outputPath = path.join(__dirname, '../logs/external-app-detection.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        console.log(`\n💾 結果保存: ${outputPath}`);
    }
}

// 実行
if (require.main === module) {
    const detector = new ExternalAppDetector();
    detector.detectAllApps();
}

module.exports = ExternalAppDetector;