#!/usr/bin/env node

/**
 * Management AI監視・報告システム v1.0
 * 重複アプリ・作業中断・システム異常の統合監視・自動報告
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ManagementAIMonitor {
    constructor(useUnifiedLogging = true) {
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.monitorFile = path.join(this.configDir, 'management-ai-monitor.json');
        this.notificationFile = path.join(this.configDir, 'management-ai-notifications.json');
        this.incidentFile = path.join(this.configDir, 'system-incidents.json');
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.ensureConfigDir();
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger('management-monitor');
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

    /**
     * システム全体の監視実行
     */
    async executeSystemMonitoring() {
        console.log('🔍 Management AI Monitor: システム監視開始');
        
        const monitoringResults = {
            timestamp: new Date().toISOString(),
            monitoringSessionId: `monitor-${Date.now()}`,
            checks: [],
            incidents: [],
            notifications: [],
            summary: {
                totalChecks: 0,
                criticalIssues: 0,
                warnings: 0,
                systemHealth: 'unknown'
            }
        };

        try {
            // 1. 重複アプリ監視
            console.log('\n📊 重複アプリ監視...');
            const duplicateCheck = await this.monitorDuplicateApps();
            monitoringResults.checks.push(duplicateCheck);

            // 2. 作業中断監視
            console.log('\n⏰ 作業中断監視...');
            const completionCheck = await this.monitorWorkCompletion();
            monitoringResults.checks.push(completionCheck);

            // 3. 連続生成監視
            console.log('\n🔄 連続生成監視...');
            const continuousCheck = await this.monitorContinuousGeneration();
            monitoringResults.checks.push(continuousCheck);

            // 4. Published Apps変化監視
            console.log('\n📱 Published Apps監視...');
            const publishedAppsCheck = await this.monitorPublishedApps();
            monitoringResults.checks.push(publishedAppsCheck);

            // 5. システムリソース監視
            console.log('\n💾 システムリソース監視...');
            const resourceCheck = await this.monitorSystemResources();
            monitoringResults.checks.push(resourceCheck);

            // 6. 通知・インシデント処理
            console.log('\n📬 インシデント分析・通知処理...');
            await this.processIncidentsAndNotifications(monitoringResults);

            // 結果サマリー生成
            this.generateMonitoringSummary(monitoringResults);

            // 監視履歴保存
            await this.saveMonitoringHistory(monitoringResults);

            this.log('system_monitoring_complete', 'System monitoring completed', {
                totalChecks: monitoringResults.summary.totalChecks,
                criticalIssues: monitoringResults.summary.criticalIssues,
                systemHealth: monitoringResults.summary.systemHealth
            });

            return monitoringResults;

        } catch (error) {
            console.error('❌ システム監視でエラーが発生:', error.message);
            
            monitoringResults.error = error.message;
            monitoringResults.summary.systemHealth = 'error';
            
            this.log('system_monitoring_error', 'System monitoring failed', {
                error: error.message
            });

            return monitoringResults;
        }
    }

    /**
     * 重複アプリ監視
     */
    async monitorDuplicateApps() {
        const check = {
            type: 'duplicate_apps',
            startTime: new Date().toISOString(),
            status: 'running',
            issues: [],
            summary: 'No issues'
        };

        try {
            // 重複インシデント確認
            const duplicateReportFile = path.join(this.configDir, 'duplicate-incidents.json');
            if (fs.existsSync(duplicateReportFile)) {
                const reports = JSON.parse(fs.readFileSync(duplicateReportFile, 'utf8'));
                const recentReports = reports.filter(report => {
                    const reportTime = new Date(report.timestamp);
                    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return reportTime > oneDayAgo && !report.resolved;
                });

                if (recentReports.length > 0) {
                    check.issues.push({
                        severity: 'high',
                        count: recentReports.length,
                        description: `24時間以内に${recentReports.length}件の重複アプリが検知されました`,
                        details: recentReports.map(r => ({
                            incidentId: r.incidentId,
                            appType: r.appInfo.appType,
                            severity: r.severity
                        }))
                    });
                }
            }

            // アプリ生成履歴から重複傾向分析
            const AppGenerationHistory = require('./app-generation-history.cjs');
            const history = new AppGenerationHistory();
            const historyData = history.loadHistory();
            
            const duplicateApps = historyData.history.filter(app => app.isDuplicate);
            if (duplicateApps.length > 0) {
                const duplicateRate = duplicateApps.length / historyData.history.length;
                if (duplicateRate > 0.3) { // 30%以上が重複
                    check.issues.push({
                        severity: 'medium',
                        description: `重複率が高い状態: ${(duplicateRate * 100).toFixed(1)}%`,
                        duplicateCount: duplicateApps.length,
                        totalCount: historyData.history.length
                    });
                }
            }

            check.status = 'completed';
            check.summary = check.issues.length > 0 ? 
                `${check.issues.length}件の重複関連問題を検知` : '重複問題なし';

        } catch (error) {
            check.status = 'error';
            check.error = error.message;
            check.summary = '重複監視でエラー発生';
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 作業中断監視
     */
    async monitorWorkCompletion() {
        const check = {
            type: 'work_completion',
            startTime: new Date().toISOString(),
            status: 'running',
            issues: [],
            summary: 'No issues'
        };

        try {
            // 完了強制システムの状況確認
            const enforcementFile = path.join(this.configDir, 'completion-enforcement.json');
            if (fs.existsSync(enforcementFile)) {
                const enforcement = JSON.parse(fs.readFileSync(enforcementFile, 'utf8'));
                
                // アクティブセッション確認
                const activeSessions = Object.values(enforcement.activeSessions || {});
                activeSessions.forEach(session => {
                    const now = new Date();
                    const deadline = new Date(session.completionDeadline);
                    const lastActivity = new Date(session.lastActivity);
                    
                    // 期限超過
                    if (now > deadline) {
                        check.issues.push({
                            severity: 'critical',
                            type: 'deadline_exceeded',
                            sessionId: session.sessionId,
                            appId: session.appId,
                            deadline: session.completionDeadline,
                            description: '作業期限を超過しています'
                        });
                    }
                    
                    // 非アクティブ
                    const inactiveTime = now - lastActivity;
                    if (inactiveTime > 30 * 60 * 1000) { // 30分以上
                        check.issues.push({
                            severity: 'high',
                            type: 'inactive_session',
                            sessionId: session.sessionId,
                            appId: session.appId,
                            lastActivity: session.lastActivity,
                            inactiveMinutes: Math.round(inactiveTime / (1000 * 60)),
                            description: '長時間非アクティブなセッション'
                        });
                    }
                });

                // 連続セッション確認
                const continuousSessions = Object.values(enforcement.continuousSessions || {});
                continuousSessions.forEach(session => {
                    if (session.isActive) {
                        const progress = session.completedApps.length / session.targetCount;
                        if (progress < 0.5 && new Date() > new Date(session.deadline)) {
                            check.issues.push({
                                severity: 'high',
                                type: 'continuous_behind_schedule',
                                sessionId: session.sessionId,
                                progress: `${session.completedApps.length}/${session.targetCount}`,
                                description: '連続生成が予定より遅れています'
                            });
                        }
                    }
                });
            }

            check.status = 'completed';
            check.summary = check.issues.length > 0 ? 
                `${check.issues.length}件の作業完了問題を検知` : '作業完了問題なし';

        } catch (error) {
            check.status = 'error';
            check.error = error.message;
            check.summary = '作業完了監視でエラー発生';
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 連続生成監視
     */
    async monitorContinuousGeneration() {
        const check = {
            type: 'continuous_generation',
            startTime: new Date().toISOString(),
            status: 'running',
            issues: [],
            summary: 'No issues'
        };

        try {
            // 統合ログから連続生成セッション確認
            const logsDir = path.join(path.dirname(this.configDir), 'ai-auto-generator', 'logs');
            if (fs.existsSync(logsDir)) {
                const logFiles = fs.readdirSync(logsDir).filter(f => 
                    f.startsWith('unified-continuous-') && f.endsWith('.json')
                );

                logFiles.forEach(logFile => {
                    try {
                        const logPath = path.join(logsDir, logFile);
                        const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                        
                        // エラー率チェック
                        const errorLogs = logData.logs?.filter(log => log.level === 'error') || [];
                        const totalLogs = logData.logs?.length || 1;
                        const errorRate = errorLogs.length / totalLogs;
                        
                        if (errorRate > 0.2) { // 20%以上エラー
                            check.issues.push({
                                severity: 'medium',
                                type: 'high_error_rate',
                                sessionId: logData.meta.sessionId,
                                errorRate: `${(errorRate * 100).toFixed(1)}%`,
                                errorCount: errorLogs.length,
                                description: '連続生成でエラー率が高い'
                            });
                        }
                    } catch (parseError) {
                        // ログファイル解析エラーは無視
                    }
                });
            }

            check.status = 'completed';
            check.summary = check.issues.length > 0 ? 
                `${check.issues.length}件の連続生成問題を検知` : '連続生成問題なし';

        } catch (error) {
            check.status = 'error';
            check.error = error.message;
            check.summary = '連続生成監視でエラー発生';
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * Published Apps監視
     */
    async monitorPublishedApps() {
        const check = {
            type: 'published_apps',
            startTime: new Date().toISOString(),
            status: 'running',
            issues: [],
            summary: 'No issues'
        };

        try {
            // Published Apps Monitorの状況確認
            const PublishedAppsMonitor = require('./published-apps-monitor.cjs');
            const monitor = new PublishedAppsMonitor();
            const monitorData = monitor.loadMonitorData();

            // 最近のフィードバックループ失敗確認
            const recentFailures = monitorData.feedbackLoopHistory.filter(exec => {
                const execTime = new Date(exec.timestamp);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return execTime > oneDayAgo && !exec.success;
            });

            if (recentFailures.length > 0) {
                check.issues.push({
                    severity: 'medium',
                    type: 'feedback_loop_failures',
                    failureCount: recentFailures.length,
                    description: '24時間以内にフィードバックループが失敗しています',
                    details: recentFailures.map(f => ({
                        timestamp: f.timestamp,
                        error: f.error
                    }))
                });
            }

            // アプリ数の急激な変化確認
            const recentCounts = monitorData.appCounts.slice(-5);
            if (recentCounts.length >= 2) {
                const lastCount = recentCounts[recentCounts.length - 1].count;
                const prevCount = recentCounts[recentCounts.length - 2].count;
                const change = lastCount - prevCount;
                
                if (Math.abs(change) > 10) { // 10個以上の急激な変化
                    check.issues.push({
                        severity: 'medium',
                        type: 'rapid_app_change',
                        change: change,
                        description: `アプリ数が急激に変化: ${change > 0 ? '+' : ''}${change}個`
                    });
                }
            }

            check.status = 'completed';
            check.summary = check.issues.length > 0 ? 
                `${check.issues.length}件のPublished Apps問題を検知` : 'Published Apps問題なし';

        } catch (error) {
            check.status = 'error';
            check.error = error.message;
            check.summary = 'Published Apps監視でエラー発生';
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * システムリソース監視
     */
    async monitorSystemResources() {
        const check = {
            type: 'system_resources',
            startTime: new Date().toISOString(),
            status: 'running',
            issues: [],
            summary: 'No issues'
        };

        try {
            // ディスク使用量確認
            const { execSync } = require('child_process');
            
            try {
                const dfOutput = execSync('df -h .', { encoding: 'utf8' });
                const lines = dfOutput.split('\n');
                if (lines.length > 1) {
                    const diskInfo = lines[1].split(/\s+/);
                    const usagePercent = parseInt(diskInfo[4]);
                    
                    if (usagePercent > 90) {
                        check.issues.push({
                            severity: 'critical',
                            type: 'disk_space_critical',
                            usage: `${usagePercent}%`,
                            description: 'ディスク使用量が危険レベルです'
                        });
                    } else if (usagePercent > 80) {
                        check.issues.push({
                            severity: 'medium',
                            type: 'disk_space_warning',
                            usage: `${usagePercent}%`,
                            description: 'ディスク使用量が高めです'
                        });
                    }
                }
            } catch (dfError) {
                // ディスク確認エラーは警告として記録
                check.issues.push({
                    severity: 'low',
                    type: 'disk_check_failed',
                    description: 'ディスク使用量の確認ができませんでした'
                });
            }

            // 設定ファイルサイズ確認
            const configFiles = [
                this.monitorFile,
                this.notificationFile,
                this.incidentFile
            ];

            configFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    const sizeInMB = stats.size / (1024 * 1024);
                    
                    if (sizeInMB > 10) { // 10MB以上
                        check.issues.push({
                            severity: 'medium',
                            type: 'large_config_file',
                            file: path.basename(file),
                            size: `${sizeInMB.toFixed(1)}MB`,
                            description: '設定ファイルが大きくなっています'
                        });
                    }
                }
            });

            check.status = 'completed';
            check.summary = check.issues.length > 0 ? 
                `${check.issues.length}件のシステムリソース問題を検知` : 'システムリソース問題なし';

        } catch (error) {
            check.status = 'error';
            check.error = error.message;
            check.summary = 'システムリソース監視でエラー発生';
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * インシデント・通知処理
     */
    async processIncidentsAndNotifications(monitoringResults) {
        try {
            // 通知ファイルから未処理通知を取得
            let notifications = [];
            if (fs.existsSync(this.notificationFile)) {
                notifications = JSON.parse(fs.readFileSync(this.notificationFile, 'utf8'));
            }

            const unprocessedNotifications = notifications.filter(n => !n.processed);
            
            // 監視結果から新しいインシデント生成
            monitoringResults.checks.forEach(check => {
                check.issues?.forEach(issue => {
                    if (issue.severity === 'critical' || issue.severity === 'high') {
                        const incident = {
                            incidentId: `SYS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            timestamp: new Date().toISOString(),
                            type: issue.type,
                            severity: issue.severity,
                            description: issue.description,
                            source: check.type,
                            details: issue,
                            status: 'open',
                            autoGenerated: true
                        };

                        monitoringResults.incidents.push(incident);
                    }
                });
            });

            // 未処理通知を監視結果に追加
            unprocessedNotifications.forEach(notification => {
                monitoringResults.notifications.push({
                    ...notification,
                    processedAt: new Date().toISOString()
                });
            });

            // インシデントファイルに保存
            if (monitoringResults.incidents.length > 0) {
                let existingIncidents = [];
                if (fs.existsSync(this.incidentFile)) {
                    existingIncidents = JSON.parse(fs.readFileSync(this.incidentFile, 'utf8'));
                }

                existingIncidents.push(...monitoringResults.incidents);
                
                // 最新100件のみ保持
                if (existingIncidents.length > 100) {
                    existingIncidents = existingIncidents.slice(-100);
                }

                fs.writeFileSync(this.incidentFile, JSON.stringify(existingIncidents, null, 2));
            }

            // 通知を処理済みとしてマーク
            if (unprocessedNotifications.length > 0) {
                const updatedNotifications = notifications.map(n => ({
                    ...n,
                    processed: unprocessedNotifications.some(un => un.timestamp === n.timestamp) ? true : n.processed
                }));

                fs.writeFileSync(this.notificationFile, JSON.stringify(updatedNotifications, null, 2));
            }

        } catch (error) {
            console.error('⚠️ インシデント処理でエラー:', error.message);
        }
    }

    /**
     * 監視サマリー生成
     */
    generateMonitoringSummary(monitoringResults) {
        let criticalIssues = 0;
        let warnings = 0;

        monitoringResults.checks.forEach(check => {
            check.issues?.forEach(issue => {
                if (issue.severity === 'critical') {
                    criticalIssues++;
                } else if (issue.severity === 'high' || issue.severity === 'medium') {
                    warnings++;
                }
            });
        });

        let systemHealth = 'healthy';
        if (criticalIssues > 0) {
            systemHealth = 'critical';
        } else if (warnings > 0) {
            systemHealth = 'warning';
        }

        monitoringResults.summary = {
            totalChecks: monitoringResults.checks.length,
            criticalIssues,
            warnings,
            systemHealth,
            incidentsGenerated: monitoringResults.incidents.length,
            notificationsProcessed: monitoringResults.notifications.length
        };

        // コンソール表示
        console.log(`\n📊 システム監視サマリー:`);
        console.log(`   実行チェック数: ${monitoringResults.summary.totalChecks}`);
        console.log(`   緊急問題: ${criticalIssues}`);
        console.log(`   警告: ${warnings}`);
        console.log(`   システム健全性: ${systemHealth.toUpperCase()}`);
        console.log(`   生成インシデント: ${monitoringResults.incidents.length}`);
        console.log(`   処理通知: ${monitoringResults.notifications.length}`);

        if (criticalIssues > 0) {
            console.log(`\n🚨 緊急対応が必要な問題があります!`);
        } else if (warnings > 0) {
            console.log(`\n⚠️ 注意が必要な問題があります`);
        } else {
            console.log(`\n✅ システムは正常に動作しています`);
        }
    }

    /**
     * 監視履歴保存
     */
    async saveMonitoringHistory(monitoringResults) {
        try {
            let history = [];
            if (fs.existsSync(this.monitorFile)) {
                const existingData = JSON.parse(fs.readFileSync(this.monitorFile, 'utf8'));
                history = existingData.history || [];
            }

            history.push({
                timestamp: monitoringResults.timestamp,
                sessionId: monitoringResults.monitoringSessionId,
                summary: monitoringResults.summary,
                checkCount: monitoringResults.checks.length,
                incidentCount: monitoringResults.incidents.length
            });

            // 最新50件のみ保持
            if (history.length > 50) {
                history = history.slice(-50);
            }

            const monitorData = {
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                history,
                latestMonitoring: monitoringResults
            };

            fs.writeFileSync(this.monitorFile, JSON.stringify(monitorData, null, 2));

        } catch (error) {
            console.error('⚠️ 監視履歴保存でエラー:', error.message);
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

        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('management-monitor', action, description, data);
        }

        console.log(`🔍 [MONITOR] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const monitor = new ManagementAIMonitor();
    const command = process.argv[2] || 'monitor';
    
    switch (command) {
        case 'monitor':
            monitor.executeSystemMonitoring()
                .then(results => {
                    console.log('\n📊 監視完了');
                    process.exit(results.summary.systemHealth === 'critical' ? 1 : 0);
                })
                .catch(error => {
                    console.error('❌ システム監視失敗:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'status':
            try {
                if (fs.existsSync(monitor.monitorFile)) {
                    const data = JSON.parse(fs.readFileSync(monitor.monitorFile, 'utf8'));
                    console.log('最新監視結果:', data.latestMonitoring?.summary || 'なし');
                    console.log('監視履歴件数:', data.history?.length || 0);
                } else {
                    console.log('監視データなし');
                }
            } catch (error) {
                console.error('ステータス確認エラー:', error.message);
                process.exit(1);
            }
            break;
            
        case 'incidents':
            try {
                if (fs.existsSync(monitor.incidentFile)) {
                    const incidents = JSON.parse(fs.readFileSync(monitor.incidentFile, 'utf8'));
                    console.log(JSON.stringify(incidents, null, 2));
                } else {
                    console.log('[]');
                }
            } catch (error) {
                console.error('インシデント確認エラー:', error.message);
                process.exit(1);
            }
            break;
            
        default:
            console.log('Management AI Monitor Commands:');
            console.log('  monitor    - Execute full system monitoring');
            console.log('  status     - Show monitoring status');
            console.log('  incidents  - Show system incidents');
            console.log('\nExample:');
            console.log('  node management-ai-monitor.cjs monitor');
    }
}

module.exports = ManagementAIMonitor;