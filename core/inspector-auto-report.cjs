#!/usr/bin/env node

/**
 * Inspector AI Auto Report Generator
 * 会話開始時の自動チェック実行・Webレポート生成
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class InspectorAutoReport {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.executionLog = [];
        this.errors = [];
        this.webServerUrl = null;
    }

    /**
     * 会話開始時の自動チェック実行
     */
    async performAutoChecks() {
        console.log('🚀 Inspector AI Auto Report: 自動チェック開始');
        const startTime = Date.now();

        try {
            // 1. Evidence Tracker セッション開始
            await this.runCommand('inspector-evidence-tracker.cjs', ['start'], 'Evidence Tracker 開始');

            // 2. ルール同期チェック
            await this.runCommand('inspector-rule-sync.cjs', ['sync'], 'ルール同期チェック');

            // 3. アプリスキャン・URL確認
            await this.runCommand('inspector-app-scanner.cjs', ['scan'], 'アプリスキャン・URL確認');

            // 4. Evidence Tracker セッション完了
            await this.runCommand('inspector-evidence-tracker.cjs', ['complete'], 'Evidence Tracker 完了');

            // 5. Webサーバー起動・レポート表示
            const url = await this.startWebServer();

            const duration = Date.now() - startTime;
            console.log(`✅ Inspector Auto Report: 完了 (${duration}ms)`);
            console.log(`🌐 Webレポート: ${url}`);

            return {
                success: true,
                duration,
                url,
                executionLog: this.executionLog,
                errors: this.errors
            };

        } catch (error) {
            console.error('❌ Inspector Auto Report エラー:', error.message);
            this.errors.push(error.message);
            
            return {
                success: false,
                error: error.message,
                executionLog: this.executionLog,
                errors: this.errors
            };
        }
    }

    /**
     * コマンド実行
     */
    async runCommand(script, args, description) {
        return new Promise((resolve, reject) => {
            console.log(`🔧 実行中: ${description}`);
            
            const scriptPath = path.join(__dirname, script);
            const child = spawn('node', [scriptPath, ...args], {
                cwd: this.baseDir,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const logEntry = {
                    script,
                    args,
                    description,
                    code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    timestamp: new Date().toISOString()
                };

                this.executionLog.push(logEntry);

                if (code === 0) {
                    console.log(`✅ ${description}: 完了`);
                    resolve(logEntry);
                } else {
                    const error = `${description}失敗 (code: ${code})\n${stderr}`;
                    console.error(`❌ ${error}`);
                    this.errors.push(error);
                    reject(new Error(error));
                }
            });

            child.on('error', (error) => {
                const errorMsg = `${description}実行エラー: ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                this.errors.push(errorMsg);
                reject(error);
            });

            // タイムアウト設定 (30秒)
            setTimeout(() => {
                child.kill();
                const timeoutError = `${description}: タイムアウト`;
                console.error(`⏰ ${timeoutError}`);
                this.errors.push(timeoutError);
                reject(new Error(timeoutError));
            }, 30000);
        });
    }

    /**
     * Webサーバー起動
     */
    async startWebServer() {
        return new Promise((resolve, reject) => {
            console.log('🌐 Webサーバー起動中...');
            
            const InspectorWebServer = require('./inspector-web-server.cjs');
            const webServer = new InspectorWebServer();
            
            try {
                const url = webServer.startServer();
                
                // ブラウザ起動は別途実行（エラーでも続行）
                setTimeout(() => {
                    try {
                        webServer.openInBrowser(url);
                    } catch (error) {
                        console.log(`🌐 ブラウザ起動失敗、手動で開いてください: ${url}`);
                    }
                }, 1000);

                this.webServerUrl = url;
                resolve(url);
            } catch (error) {
                console.error('❌ Webサーバー起動エラー:', error.message);
                reject(error);
            }
        });
    }

    /**
     * クイック実行（エラー無視）
     */
    async performQuickChecks() {
        console.log('⚡ Inspector AI Quick Checks: 高速チェック開始');
        const startTime = Date.now();

        const results = {
            ruleSync: null,
            appScan: null,
            webUrl: null,
            duration: 0,
            errors: []
        };

        try {
            // ルール同期（必須）
            try {
                await this.runCommand('inspector-rule-sync.cjs', ['sync'], 'クイックルール同期');
                results.ruleSync = 'success';
            } catch (error) {
                results.ruleSync = 'failed';
                results.errors.push(`ルール同期失敗: ${error.message}`);
            }

            // アプリスキャン（必須）
            try {
                await this.runCommand('inspector-app-scanner.cjs', ['scan'], 'クイックアプリスキャン');
                results.appScan = 'success';
            } catch (error) {
                results.appScan = 'failed';
                results.errors.push(`アプリスキャン失敗: ${error.message}`);
            }

            // Webサーバー（オプション）
            try {
                const url = await this.startWebServer();
                results.webUrl = url;
            } catch (error) {
                results.errors.push(`Webサーバー失敗: ${error.message}`);
            }

            results.duration = Date.now() - startTime;
            console.log(`⚡ Quick Checks 完了 (${results.duration}ms)`);
            
            if (results.webUrl) {
                console.log(`🌐 Webレポート: ${results.webUrl}`);
            }

            return results;
        } catch (error) {
            results.duration = Date.now() - startTime;
            results.errors.push(error.message);
            return results;
        }
    }

    /**
     * 実行ログのMarkdown生成
     */
    generateExecutionReport() {
        let report = `# 🔍 Inspector AI Auto Report Execution Log

**実行時刻**: ${new Date().toLocaleString('ja-JP')}
**Webレポート**: ${this.webServerUrl || 'N/A'}

## 📊 実行サマリー

| 項目 | ステータス |
|------|------------|
| 総実行数 | ${this.executionLog.length} |
| 成功 | ${this.executionLog.filter(log => log.code === 0).length} |
| 失敗 | ${this.executionLog.filter(log => log.code !== 0).length} |
| エラー | ${this.errors.length} |

## 📋 実行詳細

`;

        this.executionLog.forEach((log, index) => {
            const status = log.code === 0 ? '✅' : '❌';
            report += `### ${index + 1}. ${status} ${log.description}\n\n`;
            report += `- **コマンド**: ${log.script} ${log.args.join(' ')}\n`;
            report += `- **終了コード**: ${log.code}\n`;
            report += `- **実行時刻**: ${new Date(log.timestamp).toLocaleString('ja-JP')}\n`;
            
            if (log.stdout) {
                report += `- **出力**: \n\`\`\`\n${log.stdout}\n\`\`\`\n`;
            }
            
            if (log.stderr) {
                report += `- **エラー**: \n\`\`\`\n${log.stderr}\n\`\`\`\n`;
            }
            
            report += '\n';
        });

        if (this.errors.length > 0) {
            report += `## 🚨 エラー詳細\n\n`;
            this.errors.forEach((error, index) => {
                report += `${index + 1}. ${error}\n`;
            });
        }

        // ファイル保存
        const reportFile = path.join(this.baseDir, 'logs', `inspector-auto-report-${Date.now()}.md`);
        fs.writeFileSync(reportFile, report);
        console.log(`📄 実行レポート保存: ${path.basename(reportFile)}`);

        return reportFile;
    }
}

// CLI実行部分
if (require.main === module) {
    const autoReport = new InspectorAutoReport();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'full':
            autoReport.performAutoChecks().then(result => {
                if (result.success) {
                    console.log('✅ 全自動チェック完了');
                    console.log(`🌐 ${result.url}`);
                } else {
                    console.log('❌ 自動チェック失敗');
                }
                autoReport.generateExecutionReport();
            });
            break;
        case 'quick':
            autoReport.performQuickChecks().then(result => {
                console.log('⚡ クイックチェック完了');
                if (result.webUrl) {
                    console.log(`🌐 ${result.webUrl}`);
                }
                autoReport.generateExecutionReport();
            });
            break;
        default:
            console.log(`
🚀 Inspector AI Auto Report

使用方法:
  node inspector-auto-report.cjs full     # 完全自動チェック実行
  node inspector-auto-report.cjs quick    # 高速チェック実行
            `);
    }
}

module.exports = InspectorAutoReport;