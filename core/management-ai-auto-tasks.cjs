#!/usr/bin/env node

/**
 * Management AI自動実行タスクシステム v1.0
 * バージョンアップ時の自動実行タスク管理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ManagementAIAutoTasks {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.logFile = path.join(this.projectRoot, 'logs', 'management-ai-auto-tasks.log');
        this.ensureLogDir();
    }

    ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * バージョンアップ時の自動実行タスク
     */
    async executeVersionUpgradeTasks() {
        console.log('🤖 Management AI: Starting version upgrade auto-tasks...');
        this.log('VERSION_UPGRADE_START', 'Starting automatic tasks for version upgrade');

        const results = {
            timestamp: new Date().toISOString(),
            tasks: []
        };

        try {
            // Task 1: Published Apps監視・フィードバックループ自動実行
            console.log('\n📊 Task 1: Published Apps Monitoring & Feedback Loop');
            const feedbackResult = await this.executePublishedAppsMonitoring();
            results.tasks.push(feedbackResult);

            // Task 2: システム健全性チェック
            console.log('\n🔍 Task 2: System Health Check');
            const healthResult = await this.executeSystemHealthCheck();
            results.tasks.push(healthResult);

            // Task 3: 統計レポート生成
            console.log('\n📈 Task 3: Statistics Report Generation');
            const statsResult = await this.executeStatsGeneration();
            results.tasks.push(statsResult);

            // 結果サマリー表示
            this.displayResults(results);
            
            this.log('VERSION_UPGRADE_COMPLETE', 'All automatic tasks completed', results);

            return results;

        } catch (error) {
            console.error('❌ Auto-tasks execution failed:', error.message);
            this.log('VERSION_UPGRADE_ERROR', 'Auto-tasks execution failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Published Apps監視・フィードバックループ実行
     */
    async executePublishedAppsMonitoring() {
        const task = {
            name: 'Published Apps Monitoring',
            startTime: new Date(),
            success: false,
            message: '',
            details: {}
        };

        try {
            console.log('   🔄 Checking published apps count and triggering feedback loop if needed...');
            
            const monitorScript = path.join(this.projectRoot, 'core', 'published-apps-monitor.cjs');
            const publishedAppsPath = path.join(this.projectRoot, '..', 'published-apps');
            
            // 自動チェック・実行
            const output = execSync(`node "${monitorScript}" auto "${publishedAppsPath}"`, {
                encoding: 'utf8',
                cwd: this.projectRoot,
                maxBuffer: 1024 * 1024 * 5
            });

            const result = JSON.parse(output.trim());
            
            task.success = true;
            task.message = result.feedbackExecuted ? 
                `Feedback loop executed (${result.difference} new apps)` :
                `No feedback loop needed (${result.difference} new apps)`;
            task.details = result;

            console.log(`   ✅ ${task.message}`);

        } catch (error) {
            task.success = false;
            task.message = `Failed: ${error.message}`;
            console.log(`   ❌ ${task.message}`);
        }

        task.duration = new Date() - task.startTime;
        return task;
    }

    /**
     * システム健全性チェック
     */
    async executeSystemHealthCheck() {
        const task = {
            name: 'System Health Check',
            startTime: new Date(),
            success: false,
            message: '',
            details: {}
        };

        try {
            console.log('   🔍 Running system health checks...');
            
            const checks = [];

            // App Type Manager健全性チェック
            try {
                const appTypeScript = path.join(this.projectRoot, 'core', 'app-type-manager.cjs');
                execSync(`node "${appTypeScript}" health`, { encoding: 'utf8', cwd: this.projectRoot });
                checks.push({ component: 'App Type Manager', status: 'healthy' });
            } catch (error) {
                checks.push({ component: 'App Type Manager', status: 'error', error: error.message });
            }

            // Device Manager チェック
            try {
                const deviceScript = path.join(this.projectRoot, 'core', 'device-manager.cjs');
                execSync(`node "${deviceScript}" info`, { encoding: 'utf8', cwd: this.projectRoot });
                checks.push({ component: 'Device Manager', status: 'healthy' });
            } catch (error) {
                checks.push({ component: 'Device Manager', status: 'error', error: error.message });
            }

            // File protection チェック
            const criticalFiles = [
                'VERSION.md',
                '.claude/commands/wk-st.md',
                'MANAGEMENT_AI_RULES.md'
            ];

            const fileChecks = criticalFiles.map(file => {
                const filePath = path.join(this.projectRoot, file);
                return {
                    file,
                    exists: fs.existsSync(filePath),
                    readable: fs.existsSync(filePath) ? fs.accessSync(filePath, fs.constants.R_OK) === undefined : false
                };
            });

            checks.push({ component: 'Critical Files', status: 'checked', files: fileChecks });

            const healthyComponents = checks.filter(c => c.status === 'healthy' || c.status === 'checked').length;
            const totalComponents = checks.length;

            task.success = healthyComponents === totalComponents;
            task.message = `${healthyComponents}/${totalComponents} components healthy`;
            task.details = { checks };

            console.log(`   ${task.success ? '✅' : '⚠️'} ${task.message}`);

        } catch (error) {
            task.success = false;
            task.message = `Failed: ${error.message}`;
            console.log(`   ❌ ${task.message}`);
        }

        task.duration = new Date() - task.startTime;
        return task;
    }

    /**
     * 統計レポート生成
     */
    async executeStatsGeneration() {
        const task = {
            name: 'Statistics Report Generation',
            startTime: new Date(),
            success: false,
            message: '',
            details: {}
        };

        try {
            console.log('   📈 Generating system statistics...');
            
            const stats = {
                timestamp: new Date().toISOString(),
                system: {},
                components: {}
            };

            // App Generation History統計
            try {
                const historyScript = path.join(this.projectRoot, 'core', 'app-generation-history.cjs');
                const historyOutput = execSync(`node "${historyScript}" stats`, { 
                    encoding: 'utf8', 
                    cwd: this.projectRoot 
                });
                stats.components.appHistory = 'available';
            } catch (error) {
                stats.components.appHistory = 'error';
            }

            // Published Apps Monitor統計
            try {
                const monitorScript = path.join(this.projectRoot, 'core', 'published-apps-monitor.cjs');
                const monitorOutput = execSync(`node "${monitorScript}" stats`, { 
                    encoding: 'utf8', 
                    cwd: this.projectRoot 
                });
                stats.components.appsMonitor = 'available';
            } catch (error) {
                stats.components.appsMonitor = 'error';
            }

            // VERSION.md読み取り
            try {
                const versionPath = path.join(this.projectRoot, 'VERSION.md');
                const versionContent = fs.readFileSync(versionPath, 'utf8');
                const versionMatch = versionContent.match(/## 現在のバージョン: (v[\d.]+)/);
                stats.system.currentVersion = versionMatch ? versionMatch[1] : 'unknown';
            } catch (error) {
                stats.system.currentVersion = 'error';
            }

            task.success = true;
            task.message = `Statistics generated (version: ${stats.system.currentVersion})`;
            task.details = stats;

            console.log(`   ✅ ${task.message}`);

        } catch (error) {
            task.success = false;
            task.message = `Failed: ${error.message}`;
            console.log(`   ❌ ${task.message}`);
        }

        task.duration = new Date() - task.startTime;
        return task;
    }

    /**
     * 結果表示
     */
    displayResults(results) {
        console.log('\n📋 Management AI Auto-Tasks Summary:');
        console.log(`   Execution Time: ${results.timestamp}`);
        console.log(`   Total Tasks: ${results.tasks.length}`);
        
        const successful = results.tasks.filter(t => t.success).length;
        console.log(`   Successful: ${successful}/${results.tasks.length}`);

        console.log('\n📊 Task Details:');
        results.tasks.forEach((task, index) => {
            const status = task.success ? '✅' : '❌';
            const duration = Math.round(task.duration / 1000);
            console.log(`   ${index + 1}. ${status} ${task.name} (${duration}s)`);
            console.log(`      ${task.message}`);
        });

        if (successful === results.tasks.length) {
            console.log('\n🎉 All auto-tasks completed successfully!');
        } else {
            console.log('\n⚠️ Some auto-tasks had issues. Check logs for details.');
        }
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

        const logLine = `${logEntry.timestamp} [${action}] ${description}\n`;
        
        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.warn('⚠️ Failed to write log:', error.message);
        }

        console.log(`📝 [AUTO] ${action}: ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const autoTasks = new ManagementAIAutoTasks();
    const command = process.argv[2] || 'version-upgrade';
    
    switch (command) {
        case 'version-upgrade':
            autoTasks.executeVersionUpgradeTasks()
                .then(results => {
                    console.log(JSON.stringify(results, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Auto-tasks failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'feedback-only':
            autoTasks.executePublishedAppsMonitoring()
                .then(result => {
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Feedback monitoring failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'health-only':
            autoTasks.executeSystemHealthCheck()
                .then(result => {
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Health check failed:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('Management AI Auto-Tasks Commands:');
            console.log('  version-upgrade  - Execute all version upgrade tasks');
            console.log('  feedback-only    - Execute feedback loop monitoring only');
            console.log('  health-only      - Execute health check only');
            console.log('\nExample:');
            console.log('  node management-ai-auto-tasks.cjs version-upgrade');
    }
}

module.exports = ManagementAIAutoTasks;