#!/usr/bin/env node
/**
 * 自動ブラウザ起動ツール
 * Inspector Dashboard を自動的にブラウザで開く
 */

const { exec } = require('child_process');
const path = require('path');

class AutoBrowserLauncher {
    constructor() {
        this.dashboardUrl = 'http://localhost:3001/inspector-visual-dashboard.html';
        this.fallbackUrls = [
            'http://127.0.0.1:3001/inspector-visual-dashboard.html',
            'http://localhost:3002/inspector-visual-dashboard.html'
        ];
    }

    /**
     * ブラウザ起動（クロスプラットフォーム対応）
     */
    async launchBrowser() {
        console.log('🚀 Inspector Dashboard 自動起動中...');
        
        // プラットフォーム検出
        const platform = process.platform;
        let command;
        
        switch (platform) {
            case 'win32':
                // Windows (WSL含む)
                command = `cmd.exe /c start ${this.dashboardUrl}`;
                break;
            case 'darwin':
                // macOS
                command = `open ${this.dashboardUrl}`;
                break;
            case 'linux':
                // Linux (WSL2含む)
                command = `xdg-open ${this.dashboardUrl} || sensible-browser ${this.dashboardUrl}`;
                break;
            default:
                console.log('❌ 未対応のプラットフォーム:', platform);
                return false;
        }

        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log('⚠️ メインURL起動失敗、代替URL試行中...');
                    this.tryFallbackUrls().then(resolve);
                } else {
                    console.log('✅ ブラウザ起動成功:', this.dashboardUrl);
                    resolve(true);
                }
            });
        });
    }

    /**
     * 代替URL試行
     */
    async tryFallbackUrls() {
        for (const url of this.fallbackUrls) {
            console.log(`🔄 代替URL試行: ${url}`);
            
            const success = await new Promise((resolve) => {
                const platform = process.platform;
                let command;
                
                switch (platform) {
                    case 'win32':
                        command = `cmd.exe /c start ${url}`;
                        break;
                    case 'darwin':
                        command = `open ${url}`;
                        break;
                    case 'linux':
                        command = `xdg-open ${url}`;
                        break;
                }
                
                exec(command, (error) => {
                    if (!error) {
                        console.log('✅ 代替URL起動成功:', url);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            });
            
            if (success) return true;
        }
        
        console.log('❌ 全てのURL起動失敗');
        this.showManualInstructions();
        return false;
    }

    /**
     * 手動アクセス方法表示
     */
    showManualInstructions() {
        console.log('\n📋 手動アクセス方法:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 ブラウザで以下のURLを開いてください:');
        console.log('   1. http://localhost:3001/inspector-visual-dashboard.html');
        console.log('   2. http://127.0.0.1:3001/inspector-visual-dashboard.html');
        console.log('   3. file:///mnt/c/Users/user/ai-auto-generator/logs/inspector-visual-dashboard.html');
        console.log('\n🔧 サーバー起動確認:');
        console.log('   cd logs && python3 -m http.server 3001');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    /**
     * ポート確認
     */
    async checkPort(port) {
        return new Promise((resolve) => {
            exec(`lsof -i :${port}`, (error, stdout) => {
                resolve(!error && stdout.trim().length > 0);
            });
        });
    }

    /**
     * メイン実行
     */
    async run() {
        console.log('🔍 Inspector Dashboard Auto Launcher');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // ポート確認
        const port3001 = await this.checkPort(3001);
        const port3002 = await this.checkPort(3002);
        
        console.log(`🌐 ポート状況: 3001=${port3001 ? '✅' : '❌'} | 3002=${port3002 ? '✅' : '❌'}`);
        
        // ブラウザ起動
        const success = await this.launchBrowser();
        
        if (success) {
            console.log('\n🎉 Inspector Dashboard 起動完了');
            console.log('📊 タブ切り替え: 概要 | アプリ一覧 | 詳細分析');
        }
        
        return success;
    }
}

// 実行
if (require.main === module) {
    const launcher = new AutoBrowserLauncher();
    launcher.run();
}

module.exports = AutoBrowserLauncher;