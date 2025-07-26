#!/usr/bin/env node

/**
 * Management AI自動スケジューラー v1.0
 * 10分間隔での自動改善ループ実行
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoScheduler {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.configDir = path.join(require('os').homedir(), '.ai-generator');
        this.schedulerFile = path.join(this.configDir, 'auto-scheduler.json');
        this.isRunning = false;
        this.intervalId = null;
        this.ensureConfigDir();
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    /**
     * 10分間隔でManagement AI実行
     */
    startAutoLoop() {
        console.log('🔄 Management AI自動スケジューラー開始');
        console.log('⏰ 10分間隔でManagement AI改善ループを実行します');
        
        this.isRunning = true;
        this.saveSchedulerState();

        // 即座に1回実行
        this.executeManagementAILoop();

        // 10分間隔で実行
        this.intervalId = setInterval(() => {
            this.executeManagementAILoop();
        }, 10 * 60 * 1000); // 10分 = 600,000ms

        console.log('✅ 自動スケジューラー開始完了');
        console.log('🔄 次回実行: 10分後');
    }

    /**
     * Management AI改善ループ実行
     */
    async executeManagementAILoop() {
        const timestamp = new Date().toISOString();
        console.log(`\n🤖 Management AI自動実行開始: ${timestamp}`);

        try {
            // 1. システム監視
            console.log('📊 システム監視実行...');
            execSync('node core/management-ai-monitor.cjs monitor', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            // 2. 自動改善ループ
            console.log('🔄 自動改善ループ実行...');
            execSync('node core/auto-improvement-loop.cjs execute', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            // 3. Published Apps監視
            console.log('📱 Published Apps監視...');
            execSync('node core/published-apps-monitor.cjs auto ../published-apps', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            // 4. 自動タスク実行
            console.log('⚙️ 自動タスク実行...');
            execSync('node core/management-ai-auto-tasks.cjs version-upgrade', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            console.log(`✅ Management AI自動実行完了: ${new Date().toISOString()}`);
            console.log('⏰ 次回実行: 10分後');

            this.logExecution(timestamp, 'success');

        } catch (error) {
            console.error(`❌ Management AI自動実行エラー: ${error.message}`);
            this.logExecution(timestamp, 'error', error.message);
        }
    }

    /**
     * スケジューラー停止
     */
    stopAutoLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        this.saveSchedulerState();
        console.log('⏹️ Management AI自動スケジューラー停止');
    }

    /**
     * スケジューラー状態保存
     */
    saveSchedulerState() {
        const state = {
            isRunning: this.isRunning,
            lastUpdated: new Date().toISOString(),
            intervalMinutes: 10,
            pid: process.pid
        };

        try {
            fs.writeFileSync(this.schedulerFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.warn('⚠️ スケジューラー状態保存失敗:', error.message);
        }
    }

    /**
     * 実行ログ記録
     */
    logExecution(timestamp, status, error = null) {
        const logEntry = {
            timestamp,
            status,
            error
        };

        try {
            let history = [];
            if (fs.existsSync(this.schedulerFile)) {
                const data = JSON.parse(fs.readFileSync(this.schedulerFile, 'utf8'));
                history = data.executionHistory || [];
            }

            history.push(logEntry);
            
            // 最新50件のみ保持
            if (history.length > 50) {
                history = history.slice(-50);
            }

            const data = {
                isRunning: this.isRunning,
                lastUpdated: new Date().toISOString(),
                intervalMinutes: 10,
                pid: process.pid,
                executionHistory: history
            };

            fs.writeFileSync(this.schedulerFile, JSON.stringify(data, null, 2));

        } catch (error) {
            console.warn('⚠️ 実行ログ記録失敗:', error.message);
        }
    }

    /**
     * スケジューラー状態確認
     */
    getStatus() {
        try {
            if (fs.existsSync(this.schedulerFile)) {
                const data = JSON.parse(fs.readFileSync(this.schedulerFile, 'utf8'));
                return data;
            }
        } catch (error) {
            console.warn('⚠️ 状態確認失敗:', error.message);
        }

        return {
            isRunning: false,
            lastUpdated: null,
            executionHistory: []
        };
    }
}

// CLI インターフェース
if (require.main === module) {
    const scheduler = new AutoScheduler();
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'start':
            scheduler.startAutoLoop();
            
            // SIGINT/SIGTERM対応
            process.on('SIGINT', () => {
                console.log('\n🛑 停止シグナル受信');
                scheduler.stopAutoLoop();
                process.exit(0);
            });

            process.on('SIGTERM', () => {
                console.log('\n🛑 終了シグナル受信');
                scheduler.stopAutoLoop();
                process.exit(0);
            });

            // プロセスを継続
            break;
            
        case 'stop':
            scheduler.stopAutoLoop();
            break;
            
        case 'status':
            const status = scheduler.getStatus();
            console.log('📊 Auto Scheduler Status:');
            console.log(`   Running: ${status.isRunning ? '✅ YES' : '❌ NO'}`);
            console.log(`   Interval: ${status.intervalMinutes || 10} minutes`);
            console.log(`   Last Updated: ${status.lastUpdated || 'Never'}`);
            console.log(`   Execution History: ${status.executionHistory?.length || 0} records`);
            
            if (status.executionHistory && status.executionHistory.length > 0) {
                const recent = status.executionHistory.slice(-3);
                console.log('\n📈 Recent Executions:');
                recent.forEach(exec => {
                    const emoji = exec.status === 'success' ? '✅' : '❌';
                    console.log(`   ${exec.timestamp.substring(0, 16)}: ${emoji} ${exec.status}`);
                });
            }
            break;
            
        case 'execute':
            scheduler.executeManagementAILoop()
                .then(() => {
                    console.log('✅ Manual execution completed');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Manual execution failed:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('Auto Scheduler Commands:');
            console.log('  start    - Start 10-minute interval Management AI loop');
            console.log('  stop     - Stop the auto scheduler');
            console.log('  status   - Show scheduler status');
            console.log('  execute  - Manual execution (one-time)');
            console.log('\nExamples:');
            console.log('  node auto-scheduler.cjs start');
            console.log('  node auto-scheduler.cjs status');
            console.log('\nNote: Use Ctrl+C to stop the running scheduler');
    }
}

module.exports = AutoScheduler;