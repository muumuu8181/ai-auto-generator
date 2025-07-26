#!/usr/bin/env node

/**
 * Published Apps監視・フィードバックループ自動化システム v1.0
 * アプリ数変化を監視し、自動でフィードバックループを実行
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class PublishedAppsMonitor {
    constructor(useUnifiedLogging = true) {
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.monitorFile = path.join(this.configDir, 'published-apps-monitor.json');
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.ensureConfigDir();
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger('apps-monitor');
            } catch (error) {
                console.warn('⚠️ Unified logging not available');
                this.useUnifiedLogging = false;
            }
        }
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    loadMonitorData() {
        if (!fs.existsSync(this.monitorFile)) {
            return {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastCheck: null,
                appCounts: [],
                feedbackLoopHistory: [],
                settings: {
                    triggerThreshold: 5,  // 5個以上増えたら実行
                    autoExecute: true,
                    maxAnalysisApps: 20
                }
            };
        }

        try {
            return JSON.parse(fs.readFileSync(this.monitorFile, 'utf8'));
        } catch (error) {
            console.warn('⚠️ Monitor file corrupted, creating new');
            return this.loadMonitorData();
        }
    }

    saveMonitorData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.monitorFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save monitor data:', error.message);
        }
    }

    /**
     * published-appsディレクトリのアプリ数カウント
     */
    countPublishedApps(publishedAppsPath = '../published-apps') {
        try {
            const fullPath = path.resolve(__dirname, publishedAppsPath);
            
            if (!fs.existsSync(fullPath)) {
                console.warn(`⚠️ Published apps directory not found: ${fullPath}`);
                return 0;
            }

            const entries = fs.readdirSync(fullPath, { withFileTypes: true });
            const appDirs = entries.filter(entry => 
                entry.isDirectory() && 
                entry.name.match(/^app-\d{3,8}-[a-z0-9]{6}$/)
            );

            this.log('app_count', 'Published apps counted', {
                path: fullPath,
                count: appDirs.length,
                apps: appDirs.map(dir => dir.name)
            });

            return appDirs.length;
        } catch (error) {
            console.error('❌ Failed to count apps:', error.message);
            return 0;
        }
    }

    /**
     * アプリ数変化の監視
     */
    checkForChanges(publishedAppsPath = '../published-apps') {
        const data = this.loadMonitorData();
        const currentCount = this.countPublishedApps(publishedAppsPath);
        const timestamp = new Date().toISOString();

        const record = {
            timestamp,
            count: currentCount,
            checkType: 'manual'
        };

        // 前回との差分計算
        const lastRecord = data.appCounts[data.appCounts.length - 1];
        const difference = lastRecord ? currentCount - lastRecord.count : 0;

        record.difference = difference;
        record.triggerThreshold = data.settings.triggerThreshold;

        // 履歴に追加
        data.appCounts.push(record);
        data.lastCheck = timestamp;

        // 古い履歴は削除（最新50件のみ保持）
        if (data.appCounts.length > 50) {
            data.appCounts = data.appCounts.slice(-50);
        }

        this.saveMonitorData(data);

        const result = {
            currentCount,
            difference,
            shouldTriggerFeedback: difference >= data.settings.triggerThreshold,
            threshold: data.settings.triggerThreshold,
            autoExecute: data.settings.autoExecute,
            lastCount: lastRecord ? lastRecord.count : 0
        };

        this.log('change_check', 'App count change checked', result);

        console.log(`📊 Published Apps Monitor:`);
        console.log(`   Current count: ${currentCount}`);
        console.log(`   Previous count: ${result.lastCount}`);
        console.log(`   Difference: +${difference}`);
        console.log(`   Trigger threshold: ${data.settings.triggerThreshold}`);
        console.log(`   Should trigger feedback: ${result.shouldTriggerFeedback ? '✅ YES' : '❌ NO'}`);

        return result;
    }

    /**
     * フィードバックループ自動実行
     */
    executeFeedbackLoop(publishedAppsPath = '../published-apps', analysisPath = './feedback-analysis') {
        try {
            console.log('🔄 Starting automatic feedback loop execution...');
            
            const data = this.loadMonitorData();
            const startTime = new Date();

            // フィードバックループ実行
            const command = `node core/feedback-loop-manager.cjs execute ${publishedAppsPath} ${analysisPath} ${data.settings.maxAnalysisApps} false`;
            console.log(`📝 Executing: ${command}`);

            const output = execSync(command, { 
                encoding: 'utf8',
                cwd: path.dirname(__dirname), // ai-auto-generator directory
                maxBuffer: 1024 * 1024 * 10  // 10MB buffer
            });

            const endTime = new Date();
            const duration = endTime - startTime;

            // 実行履歴記録
            const execution = {
                timestamp: startTime.toISOString(),
                duration: duration,
                command,
                success: true,
                output: output.substring(0, 5000), // 最初の5000文字のみ保存
                analysisPath
            };

            data.feedbackLoopHistory.push(execution);

            // 古い履歴は削除（最新20件のみ保持）
            if (data.feedbackLoopHistory.length > 20) {
                data.feedbackLoopHistory = data.feedbackLoopHistory.slice(-20);
            }

            this.saveMonitorData(data);

            this.log('feedback_executed', 'Feedback loop executed successfully', {
                duration,
                analysisPath,
                success: true
            });

            console.log(`✅ Feedback loop completed in ${Math.round(duration / 1000)}s`);
            console.log(`📁 Analysis results: ${analysisPath}`);

            return {
                success: true,
                duration,
                analysisPath,
                output
            };

        } catch (error) {
            console.error('❌ Feedback loop execution failed:', error.message);
            
            // エラー履歴記録
            const data = this.loadMonitorData();
            data.feedbackLoopHistory.push({
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message,
                command: 'feedback-loop-manager.cjs'
            });
            this.saveMonitorData(data);

            this.log('feedback_failed', 'Feedback loop execution failed', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 自動監視・実行
     */
    autoCheck(publishedAppsPath = '../published-apps') {
        console.log('🤖 Starting automatic monitoring check...');
        
        const changeResult = this.checkForChanges(publishedAppsPath);
        
        if (changeResult.shouldTriggerFeedback && changeResult.autoExecute) {
            console.log('🚀 Triggering automatic feedback loop execution...');
            const executionResult = this.executeFeedbackLoop(publishedAppsPath);
            
            return {
                ...changeResult,
                feedbackExecuted: true,
                feedbackResult: executionResult
            };
        } else {
            console.log('⏸️ No automatic feedback loop execution needed');
            return {
                ...changeResult,
                feedbackExecuted: false,
                reason: !changeResult.shouldTriggerFeedback ? 
                    'Threshold not met' : 'Auto execution disabled'
            };
        }
    }

    /**
     * 設定更新
     */
    updateSettings(newSettings) {
        const data = this.loadMonitorData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveMonitorData(data);
        
        console.log('✅ Settings updated:', newSettings);
        return data.settings;
    }

    /**
     * 統計表示
     */
    showStats() {
        const data = this.loadMonitorData();
        
        console.log('\n📊 Published Apps Monitor Statistics:');
        console.log(`   Monitor file: ${this.monitorFile}`);
        console.log(`   Last check: ${data.lastCheck || 'Never'}`);
        console.log(`   Total checks: ${data.appCounts.length}`);
        console.log(`   Feedback loops executed: ${data.feedbackLoopHistory.length}`);
        
        console.log('\n⚙️ Current Settings:');
        console.log(`   Trigger threshold: +${data.settings.triggerThreshold} apps`);
        console.log(`   Auto execute: ${data.settings.autoExecute ? 'Enabled' : 'Disabled'}`);
        console.log(`   Max analysis apps: ${data.settings.maxAnalysisApps}`);

        if (data.appCounts.length > 0) {
            const recent = data.appCounts.slice(-5);
            console.log('\n📈 Recent App Counts:');
            recent.forEach(record => {
                const diff = record.difference !== undefined ? ` (+${record.difference})` : '';
                console.log(`   ${record.timestamp.substring(0, 16)}: ${record.count} apps${diff}`);
            });
        }

        if (data.feedbackLoopHistory.length > 0) {
            const recentFeedback = data.feedbackLoopHistory.slice(-3);
            console.log('\n🔄 Recent Feedback Loops:');
            recentFeedback.forEach(exec => {
                const status = exec.success ? '✅' : '❌';
                const duration = exec.duration ? ` (${Math.round(exec.duration / 1000)}s)` : '';
                console.log(`   ${exec.timestamp.substring(0, 16)}: ${status}${duration}`);
            });
        }

        return data;
    }

    /**
     * ログ記録
     */
    log(action, description, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            description,
            data
        };

        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('apps-monitor', action, description, data);
        }

        console.log(`📝 [MONITOR] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const monitor = new PublishedAppsMonitor();
    const command = process.argv[2] || 'check';
    
    switch (command) {
        case 'check':
            const publishedPath = process.argv[3] || '../published-apps';
            const result = monitor.checkForChanges(publishedPath);
            console.log(JSON.stringify(result, null, 2));
            break;
            
        case 'auto':
            const autoPath = process.argv[3] || '../published-apps';
            const autoResult = monitor.autoCheck(autoPath);
            console.log(JSON.stringify(autoResult, null, 2));
            break;
            
        case 'execute':
            const execPath = process.argv[3] || '../published-apps';
            const analysisPath = process.argv[4] || './feedback-analysis';
            const execResult = monitor.executeFeedbackLoop(execPath, analysisPath);
            console.log(JSON.stringify(execResult, null, 2));
            break;
            
        case 'count':
            const countPath = process.argv[3] || '../published-apps';
            const count = monitor.countPublishedApps(countPath);
            console.log(count);
            break;
            
        case 'settings':
            const settingKey = process.argv[3];
            const settingValue = process.argv[4];
            
            if (settingKey && settingValue !== undefined) {
                const newSettings = {};
                newSettings[settingKey] = settingValue === 'true' ? true : 
                                        settingValue === 'false' ? false :
                                        isNaN(settingValue) ? settingValue : parseInt(settingValue);
                const updatedSettings = monitor.updateSettings(newSettings);
                console.log(JSON.stringify(updatedSettings, null, 2));
            } else {
                console.error('Usage: node published-apps-monitor.cjs settings <key> <value>');
                process.exit(1);
            }
            break;
            
        case 'stats':
            monitor.showStats();
            break;
            
        default:
            console.log('Published Apps Monitor Commands:');
            console.log('  check [path]                    - Check for app count changes');
            console.log('  auto [path]                     - Auto check and execute if needed');
            console.log('  execute [path] [analysis-path]  - Force execute feedback loop');
            console.log('  count [path]                    - Count apps only');
            console.log('  settings <key> <value>          - Update settings');
            console.log('  stats                           - Show statistics');
            console.log('\nExamples:');
            console.log('  node published-apps-monitor.cjs check ../published-apps');
            console.log('  node published-apps-monitor.cjs auto ../published-apps');
            console.log('  node published-apps-monitor.cjs settings triggerThreshold 3');
            console.log('  node published-apps-monitor.cjs settings autoExecute false');
    }
}

module.exports = PublishedAppsMonitor;