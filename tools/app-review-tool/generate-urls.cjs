#!/usr/bin/env node

/**
 * URL生成スクリプト v1.0
 * published-appsディレクトリをスキャンしてアプリURL一覧を自動生成
 */

const fs = require('fs');
const path = require('path');

class UrlGenerator {
    constructor() {
        this.baseUrl = 'https://muumuu8181.github.io/published-apps/';
        this.appsDirectory = '../../published-apps'; // tools/app-review-tool からの相対パス
        this.outputFile = './urls.js';
    }
    
    /**
     * URL一覧生成
     */
    generateUrlList() {
        try {
            console.log('🔍 Scanning published-apps directory...');
            
            const appsPath = path.resolve(__dirname, this.appsDirectory);
            
            if (!fs.existsSync(appsPath)) {
                throw new Error(`Directory not found: ${appsPath}`);
            }
            
            const apps = this.scanAppsDirectory(appsPath);
            
            if (apps.length === 0) {
                console.warn('⚠️ No app directories found');
                this.generateEmptyUrlFile();
                return;
            }
            
            this.generateUrlFile(apps);
            
            console.log(`✅ Generated ${this.outputFile} with ${apps.length} apps`);
            console.log('📱 Apps found:');
            apps.forEach((app, index) => {
                console.log(`  ${index + 1}. ${app.name} (${app.created})`);
            });
            
        } catch (error) {
            console.error('❌ URL generation failed:', error.message);
            process.exit(1);
        }
    }
    
    /**
     * appsディレクトリスキャン
     */
    scanAppsDirectory(appsPath) {
        const apps = [];
        
        try {
            const items = fs.readdirSync(appsPath);
            
            items.forEach(item => {
                const itemPath = path.join(appsPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory() && item.match(/^app-\d{3,8}-[a-z0-9]+$/)) {
                    const appInfo = this.analyzeApp(itemPath, item);
                    apps.push(appInfo);
                }
            });
            
            // 作成日時でソート（新しい順）
            apps.sort((a, b) => new Date(b.created) - new Date(a.created));
            
        } catch (error) {
            console.error(`Failed to scan directory: ${error.message}`);
        }
        
        return apps;
    }
    
    /**
     * 個別アプリ分析
     */
    analyzeApp(appPath, appName) {
        const appInfo = {
            name: appName,
            url: `${this.baseUrl}${appName}/`,
            path: appPath,
            created: null,
            title: null,
            description: null,
            techStack: [],
            hasMainFiles: false,
            metadata: {}
        };
        
        try {
            // 作成日時取得
            const stat = fs.statSync(appPath);
            appInfo.created = stat.birthtime.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // index.htmlから情報抽出
            const indexPath = path.join(appPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                appInfo.hasMainFiles = true;
                const htmlContent = fs.readFileSync(indexPath, 'utf8');
                
                // タイトル抽出
                const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
                if (titleMatch) {
                    appInfo.title = titleMatch[1].trim();
                }
                
                // メタ説明抽出
                const descMatch = htmlContent.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]+)['"][^>]*>/i);
                if (descMatch) {
                    appInfo.description = descMatch[1].trim();
                }
                
                // 技術スタック検出
                appInfo.techStack = this.detectTechStack(htmlContent, appPath);
            }
            
            // requirements.mdから情報抽出
            const reqPath = path.join(appPath, 'requirements.md');
            if (fs.existsSync(reqPath)) {
                const reqContent = fs.readFileSync(reqPath, 'utf8');
                if (!appInfo.description && reqContent.length > 10) {
                    // 最初の行をdescriptionとして使用
                    const firstLine = reqContent.split('\n').find(line => line.trim().length > 10);
                    if (firstLine) {
                        appInfo.description = firstLine.replace(/^#+\s*/, '').trim();
                    }
                }
            }
            
            // メタデータ
            appInfo.metadata = {
                fileCount: this.countFiles(appPath),
                hasReflection: fs.existsSync(path.join(appPath, 'reflection.md')),
                hasWorkLog: fs.existsSync(path.join(appPath, 'work_log.md')),
                hasGeminiFeedback: fs.existsSync(path.join(appPath, 'gemini-feedback.txt'))
            };
            
        } catch (error) {
            console.warn(`⚠️ Failed to analyze ${appName}:`, error.message);
        }
        
        return appInfo;
    }
    
    /**
     * 技術スタック検出
     */
    detectTechStack(htmlContent, appPath) {
        const techStack = new Set();
        
        // HTMLから検出
        if (htmlContent.includes('react') || htmlContent.includes('React')) {
            techStack.add('React');
        }
        if (htmlContent.includes('vue') || htmlContent.includes('Vue')) {
            techStack.add('Vue.js');
        }
        if (htmlContent.includes('angular') || htmlContent.includes('Angular')) {
            techStack.add('Angular');
        }
        if (htmlContent.includes('bootstrap') || htmlContent.includes('Bootstrap')) {
            techStack.add('Bootstrap');
        }
        if (htmlContent.includes('tailwind') || htmlContent.includes('Tailwind')) {
            techStack.add('Tailwind CSS');
        }
        
        // ファイル存在による検出
        if (fs.existsSync(path.join(appPath, 'script.js'))) {
            techStack.add('JavaScript');
        }
        if (fs.existsSync(path.join(appPath, 'style.css'))) {
            techStack.add('CSS');
        }
        if (fs.existsSync(path.join(appPath, 'package.json'))) {
            techStack.add('Node.js');
        }
        
        return Array.from(techStack);
    }
    
    /**
     * ファイル数カウント
     */
    countFiles(dirPath) {
        let count = 0;
        
        try {
            const items = fs.readdirSync(dirPath, { recursive: true });
            items.forEach(item => {
                try {
                    const itemPath = path.join(dirPath, item);
                    if (fs.statSync(itemPath).isFile()) {
                        count++;
                    }
                } catch (error) {
                    // スキップ
                }
            });
        } catch (error) {
            // スキップ
        }
        
        return count;
    }
    
    /**
     * URLs.jsファイル生成
     */
    generateUrlFile(apps) {
        const jsContent = `// Auto-generated URL list for App Review Tool
// Generated at: ${new Date().toISOString()}
// Total apps: ${apps.length}

const appUrls = ${JSON.stringify(apps, null, 2)};

// App statistics
const appStats = {
    total: ${apps.length},
    generatedAt: "${new Date().toISOString()}",
    techStackDistribution: ${JSON.stringify(this.calculateTechStackDistribution(apps), null, 2)},
    recentApps: ${JSON.stringify(apps.slice(0, 5).map(app => ({ name: app.name, created: app.created })), null, 2)}
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { appUrls, appStats };
}`;
        
        fs.writeFileSync(this.outputFile, jsContent, 'utf8');
    }
    
    /**
     * 空のURLファイル生成
     */
    generateEmptyUrlFile() {
        const jsContent = `// Auto-generated URL list for App Review Tool
// Generated at: ${new Date().toISOString()}
// No apps found

const appUrls = [];

const appStats = {
    total: 0,
    generatedAt: "${new Date().toISOString()}",
    techStackDistribution: {},
    recentApps: []
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { appUrls, appStats };
}`;
        
        fs.writeFileSync(this.outputFile, jsContent, 'utf8');
    }
    
    /**
     * 技術スタック分布計算
     */
    calculateTechStackDistribution(apps) {
        const distribution = {};
        
        apps.forEach(app => {
            app.techStack.forEach(tech => {
                distribution[tech] = (distribution[tech] || 0) + 1;
            });
        });
        
        return distribution;
    }
    
    /**
     * 統計表示
     */
    showStatistics() {
        const appsPath = path.resolve(__dirname, this.appsDirectory);
        
        if (!fs.existsSync(appsPath)) {
            console.error(`❌ Directory not found: ${appsPath}`);
            return;
        }
        
        const apps = this.scanAppsDirectory(appsPath);
        
        console.log('\n📊 Published Apps Statistics:');
        console.log(`Total apps: ${apps.length}`);
        
        if (apps.length > 0) {
            console.log(`Latest app: ${apps[0].name} (${apps[0].created})`);
            console.log(`Oldest app: ${apps[apps.length - 1].name} (${apps[apps.length - 1].created})`);
            
            const techDistribution = this.calculateTechStackDistribution(apps);
            console.log('\nTech Stack Distribution:');
            Object.entries(techDistribution)
                .sort(([,a], [,b]) => b - a)
                .forEach(([tech, count]) => {
                    console.log(`  ${tech}: ${count}`);
                });
            
            console.log('\nRecent Apps:');
            apps.slice(0, 5).forEach((app, index) => {
                console.log(`  ${index + 1}. ${app.name} - ${app.title || 'No title'} (${app.created})`);
            });
        }
    }
}

// CLI実行
if (require.main === module) {
    const generator = new UrlGenerator();
    const command = process.argv[2] || 'generate';
    
    switch (command) {
        case 'generate':
            generator.generateUrlList();
            break;
            
        case 'stats':
            generator.showStatistics();
            break;
            
        default:
            console.log('URL Generator Commands:');
            console.log('  generate  - Generate urls.js from published-apps');
            console.log('  stats     - Show published apps statistics');
            console.log('\nExample:');
            console.log('  node generate-urls.cjs generate');
            console.log('  node generate-urls.cjs stats');
    }
}

module.exports = UrlGenerator;