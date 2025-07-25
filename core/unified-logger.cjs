#!/usr/bin/env node

/**
 * 統合ログマネージャー v1.0
 * 全ツールのログを一元管理し、GitHub Pages公開用の統合ログを生成
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class UnifiedLogger {
    constructor(sessionId, appId = null) {
        this.sessionId = sessionId;
        this.appId = appId;
        this.logFile = path.join(__dirname, `../logs/unified-${sessionId}.json`);
        this.data = this.initializeLogStructure();
        
        // ログディレクトリ作成
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        this.log('system', 'unified_logger_start', 'Unified logger initialized', {
            sessionId,
            appId,
            workflowVersion: 'v0.6'
        });
    }
    
    /**
     * ログ構造初期化
     */
    initializeLogStructure() {
        return {
            meta: {
                sessionId: this.sessionId,
                appId: this.appId,
                workflowVersion: 'v0.6',
                startTime: new Date().toISOString(),
                endTime: null,
                status: 'active',
                environment: {
                    hostname: require('os').hostname(),
                    platform: require('os').platform(),
                    user: require('os').userInfo().username
                }
            },
            phases: {
                environment_setup: { status: 'pending', logs: [], startTime: null, endTime: null },
                project_selection: { status: 'pending', logs: [], startTime: null, endTime: null },
                ai_generation: { status: 'pending', logs: [], startTime: null, endTime: null },
                deployment: { status: 'pending', logs: [], startTime: null, endTime: null },
                completion: { status: 'pending', logs: [], startTime: null, endTime: null }
            },
            workMonitoring: {
                activities: [],
                trustScore: 100,
                liesDetected: 0,
                summary: {
                    filesCreated: 0,
                    filesModified: 0,
                    buttonsAdded: 0,
                    buttonsTested: 0,
                    featuresImplemented: 0,
                    featuresTested: 0,
                    deploymentsAttempted: 0,
                    deploymentsVerified: 0
                }
            },
            phaseChecks: {
                validations: [],
                tasksRegistered: [],
                tasksCompleted: [],
                criticalFailures: 0,
                totalChecks: 0
            },
            sessionTracking: {
                duration: null,
                statistics: null
            },
            artifacts: {
                files: [],
                urls: [],
                documents: []
            },
            errors: [],
            warnings: []
        };
    }
    
    /**
     * メインログ記録関数
     */
    log(source, action, description, data = {}, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            source,       // 'work-monitor', 'phase-checker', 'session-tracker', 'system'
            action,
            description,
            level,        // 'info', 'warn', 'error', 'success'
            data,
            hash: this.generateHash(source, action, description, timestamp)
        };
        
        // フェーズ判定とログ格納
        const currentPhase = this.detectCurrentPhase(action);
        if (currentPhase && this.data.phases[currentPhase]) {
            this.data.phases[currentPhase].logs.push(logEntry);
            
            // フェーズ開始時刻記録
            if (!this.data.phases[currentPhase].startTime) {
                this.data.phases[currentPhase].startTime = timestamp;
                this.data.phases[currentPhase].status = 'active';
            }
        }
        
        // エラー・警告の特別処理
        if (level === 'error') {
            this.data.errors.push(logEntry);
        } else if (level === 'warn') {
            this.data.warnings.push(logEntry);
        }
        
        this.saveToFile();
        console.log(`📝 [UNIFIED] ${timestamp}: ${source}/${action} - ${description}`);
        
        return logEntry;
    }
    
    /**
     * フェーズ判定
     */
    detectCurrentPhase(action) {
        const phaseMapping = {
            'git_update': 'environment_setup',
            'version_check': 'environment_setup',
            'session_start': 'environment_setup',
            'requirements_fetch': 'project_selection',
            'app_id_assign': 'project_selection',
            'file_created': 'ai_generation',
            'button_added': 'ai_generation',
            'feature_implemented': 'ai_generation',
            'deployment_attempted': 'deployment',
            'deployment_verified': 'deployment',
            'git_upload': 'deployment',
            'session_complete': 'completion',
            'cleanup': 'completion'
        };
        
        return phaseMapping[action] || null;
    }
    
    /**
     * フェーズ完了記録
     */
    completePhase(phaseName, status = 'completed') {
        if (this.data.phases[phaseName]) {
            this.data.phases[phaseName].endTime = new Date().toISOString();
            this.data.phases[phaseName].status = status;
            
            this.log('system', 'phase_completed', `Phase ${phaseName} completed`, {
                phase: phaseName,
                status,
                duration: this.calculatePhaseDuration(phaseName)
            }, 'success');
        }
    }
    
    /**
     * Work Monitor統合
     */
    addWorkMonitoringActivity(activity) {
        this.data.workMonitoring.activities.push({
            ...activity,
            timestamp: activity.timestamp || new Date().toISOString()
        });
        
        // サマリー更新
        this.updateWorkMonitoringSummary(activity);
        
        this.log('work-monitor', activity.action, activity.description, activity.data);
        this.saveToFile();
    }
    
    updateWorkMonitoringSummary(activity) {
        const summary = this.data.workMonitoring.summary;
        
        switch (activity.action) {
            case 'file_created':
                summary.filesCreated++;
                break;
            case 'file_modified':
                summary.filesModified++;
                break;
            case 'ui_button_added':
                summary.buttonsAdded++;
                break;
            case 'ui_button_tested':
                summary.buttonsTested++;
                break;
            case 'feature_implemented':
                summary.featuresImplemented++;
                break;
            case 'feature_tested':
                summary.featuresTested++;
                break;
            case 'deployment_attempted':
                summary.deploymentsAttempted++;
                break;
            case 'deployment_verified':
                summary.deploymentsVerified++;
                break;
        }
    }
    
    /**
     * Phase Checker統合
     */
    addPhaseCheck(validation) {
        this.data.phaseChecks.validations.push({
            ...validation,
            timestamp: validation.timestamp || new Date().toISOString()
        });
        
        this.data.phaseChecks.totalChecks++;
        if (!validation.finalResult) {
            this.data.phaseChecks.criticalFailures++;
        }
        
        this.log('phase-checker', validation.action, 
                 validation.finalResult ? 'Phase check passed' : 'Phase check failed',
                 validation, validation.finalResult ? 'success' : 'error');
        
        this.saveToFile();
    }
    
    addTaskRegistration(tasks, phase) {
        const taskEntry = {
            timestamp: new Date().toISOString(),
            phase,
            tasks: tasks.map((task, index) => ({
                id: `task_${index + 1}`,
                title: task.title || task,
                description: task.description || "",
                status: "planned"
            })),
            totalTasks: tasks.length
        };
        
        this.data.phaseChecks.tasksRegistered.push(taskEntry);
        this.log('phase-checker', 'task_breakdown', `Registered ${tasks.length} tasks for ${phase}`, taskEntry);
        this.saveToFile();
    }
    
    addTaskCompletion(taskId, validationResult) {
        const completionEntry = {
            timestamp: new Date().toISOString(),
            taskId,
            validation: validationResult,
            success: validationResult.success
        };
        
        this.data.phaseChecks.tasksCompleted.push(completionEntry);
        this.log('phase-checker', 'task_completion', 
                 `Task ${taskId} ${validationResult.success ? 'completed' : 'failed'}`,
                 completionEntry, validationResult.success ? 'success' : 'error');
        
        this.saveToFile();
    }
    
    /**
     * Session Tracker統合
     */
    updateSessionTracking(sessionData) {
        this.data.sessionTracking = {
            ...sessionData,
            lastUpdated: new Date().toISOString()
        };
        
        this.log('session-tracker', 'session_update', 'Session tracking updated', sessionData);
        this.saveToFile();
    }
    
    /**
     * アーティファクト記録
     */
    addArtifact(type, item) {
        const artifact = {
            timestamp: new Date().toISOString(),
            type, // 'file', 'url', 'document'
            ...item
        };
        
        this.data.artifacts[type + 's'].push(artifact);
        this.log('system', 'artifact_added', `${type} artifact added: ${item.name || item.path || item.url}`, artifact);
        this.saveToFile();
    }
    
    /**
     * Trust Score計算
     */
    calculateTrustScore() {
        const activities = this.data.workMonitoring.activities;
        let lies = 0;
        
        activities.forEach(activity => {
            if (activity.action === 'ui_button_added' && activity.data && !activity.data.verified) {
                lies++;
            }
            if (activity.action === 'feature_implemented' && activity.data && activity.data.verification) {
                const hasImplementation = Object.values(activity.data.verification).some(v => v.hasFeatureCode);
                if (!hasImplementation) {
                    lies++;
                }
            }
            if (activity.action === 'deployment_verified' && activity.data && !activity.data.success) {
                lies++;
            }
        });
        
        this.data.workMonitoring.liesDetected = lies;
        this.data.workMonitoring.trustScore = Math.max(0, 100 - (lies * 10));
        
        return this.data.workMonitoring.trustScore;
    }
    
    /**
     * セッション完了処理
     */
    completeSession(appId, status = 'success') {
        this.data.meta.appId = appId;
        this.data.meta.endTime = new Date().toISOString();
        this.data.meta.status = status;
        
        // Trust Score最終計算
        this.calculateTrustScore();
        
        // 全フェーズの完了チェック
        Object.keys(this.data.phases).forEach(phase => {
            if (this.data.phases[phase].status === 'active') {
                this.completePhase(phase, 'completed');
            }
        });
        
        this.log('system', 'session_complete', `Session completed with status: ${status}`, {
            appId,
            status,
            trustScore: this.data.workMonitoring.trustScore,
            totalDuration: this.calculateTotalDuration()
        }, 'success');
        
        this.saveToFile();
    }
    
    /**
     * GitHub Pages用エクスポート
     */
    exportForGitHubPages(appPath) {
        const exportData = {
            meta: this.data.meta,
            summary: {
                trustScore: this.data.workMonitoring.trustScore,
                liesDetected: this.data.workMonitoring.liesDetected,
                totalPhases: Object.keys(this.data.phases).length,
                completedPhases: Object.values(this.data.phases).filter(p => p.status === 'completed').length,
                totalChecks: this.data.phaseChecks.totalChecks,
                criticalFailures: this.data.phaseChecks.criticalFailures,
                filesCreated: this.data.workMonitoring.summary.filesCreated,
                featuresImplemented: this.data.workMonitoring.summary.featuresImplemented,
                totalDuration: this.calculateTotalDuration(),
                errorsCount: this.data.errors.length,
                warningsCount: this.data.warnings.length
            },
            phases: this.data.phases,
            workMonitoring: this.data.workMonitoring,
            phaseChecks: this.data.phaseChecks,
            artifacts: this.data.artifacts,
            errors: this.data.errors,
            warnings: this.data.warnings,
            exportedAt: new Date().toISOString()
        };
        
        const exportPath = path.join(appPath, 'session-log.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
        
        console.log(`📊 Session log exported to: ${exportPath}`);
        console.log(`🎯 Trust Score: ${exportData.summary.trustScore}%`);
        console.log(`🔍 Lies Detected: ${exportData.summary.liesDetected}`);
        console.log(`📋 Total Checks: ${exportData.summary.totalChecks}`);
        
        return exportPath;
    }
    
    /**
     * ユーティリティ関数
     */
    calculatePhaseDuration(phaseName) {
        const phase = this.data.phases[phaseName];
        if (!phase.startTime || !phase.endTime) return null;
        
        return Math.round((new Date(phase.endTime) - new Date(phase.startTime)) / 1000);
    }
    
    calculateTotalDuration() {
        if (!this.data.meta.startTime || !this.data.meta.endTime) return null;
        
        return Math.round((new Date(this.data.meta.endTime) - new Date(this.data.meta.startTime)) / 1000);
    }
    
    generateHash(source, action, description, timestamp) {
        return crypto.createHash('md5')
            .update(`${source}:${action}:${description}:${timestamp}`)
            .digest('hex');
    }
    
    saveToFile() {
        try {
            fs.writeFileSync(this.logFile, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save unified log:', error.message);
        }
    }
    
    /**
     * 既存ログファイルからのインポート
     */
    importFromExistingLogs() {
        try {
            // Work Monitor ログ
            const workMonitorPath = path.join(__dirname, `../logs/work-monitor-${this.sessionId}.json`);
            if (fs.existsSync(workMonitorPath)) {
                const workData = JSON.parse(fs.readFileSync(workMonitorPath, 'utf8'));
                if (workData.activities) {
                    workData.activities.forEach(activity => {
                        this.addWorkMonitoringActivity(activity);
                    });
                }
                console.log(`📥 Imported work monitor data: ${workData.activities?.length || 0} activities`);
            }
            
            // Phase Checker ログ
            const phaseCheckerPath = path.join(__dirname, `../logs/phase-checker-${this.sessionId}.json`);
            if (fs.existsSync(phaseCheckerPath)) {
                const phaseData = JSON.parse(fs.readFileSync(phaseCheckerPath, 'utf8'));
                if (phaseData.logs) {
                    phaseData.logs.forEach(logEntry => {
                        if (logEntry.action === 'task_breakdown') {
                            this.addTaskRegistration(logEntry.plannedTasks || [], logEntry.phase);
                        } else if (logEntry.checks) {
                            this.addPhaseCheck(logEntry);
                        } else if (logEntry.action === 'task_completion_check') {
                            this.addTaskCompletion(logEntry.taskId, logEntry.validation);
                        }
                    });
                }
                console.log(`📥 Imported phase checker data: ${phaseData.logs?.length || 0} entries`);
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to import existing logs:', error.message);
        }
    }
    
    /**
     * 統計情報生成
     */
    generateStats() {
        const stats = {
            sessionId: this.sessionId,
            appId: this.data.meta.appId,
            trustScore: this.data.workMonitoring.trustScore,
            totalDuration: this.calculateTotalDuration(),
            phasesCompleted: Object.values(this.data.phases).filter(p => p.status === 'completed').length,
            totalPhases: Object.keys(this.data.phases).length,
            checksPerformed: this.data.phaseChecks.totalChecks,
            criticalFailures: this.data.phaseChecks.criticalFailures,
            activitiesLogged: this.data.workMonitoring.activities.length,
            errorsEncountered: this.data.errors.length,
            warningsIssued: this.data.warnings.length,
            artifactsCreated: this.data.artifacts.files.length + this.data.artifacts.documents.length,
            urlsGenerated: this.data.artifacts.urls.length
        };
        
        return stats;
    }
}

// CLI インターフェース
if (require.main === module) {
    const command = process.argv[2];
    const sessionId = process.argv[3] || 'default';
    const appId = process.argv[4] || null;
    
    const logger = new UnifiedLogger(sessionId, appId);
    
    switch (command) {
        case 'init':
            logger.importFromExistingLogs();
            console.log(`✅ Unified logger initialized for session: ${sessionId}`);
            break;
            
        case 'log':
            const source = process.argv[4];
            const action = process.argv[5];
            const description = process.argv[6];
            const dataJson = process.argv[7];
            const level = process.argv[8] || 'info';
            
            const data = dataJson ? JSON.parse(dataJson) : {};
            logger.log(source, action, description, data, level);
            break;
            
        case 'complete':
            const completionAppId = process.argv[4];
            const status = process.argv[5] || 'success';
            logger.completeSession(completionAppId, status);
            break;
            
        case 'export':
            const appPath = process.argv[4];
            if (!appPath) {
                console.error('Usage: node unified-logger.cjs export <session-id> <app-path>');
                process.exit(1);
            }
            logger.exportForGitHubPages(appPath);
            break;
            
        case 'stats':
            const stats = logger.generateStats();
            console.log('\n📊 Session Statistics:');
            Object.entries(stats).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });
            break;
            
        default:
            console.log('Unified Logger Commands:');
            console.log('  init <session-id>                    - Initialize and import existing logs');
            console.log('  log <session-id> <source> <action> <description> [data-json] [level]');
            console.log('  complete <session-id> <app-id> [status] - Complete session');
            console.log('  export <session-id> <app-path>      - Export for GitHub Pages');
            console.log('  stats <session-id>                  - Show statistics');
    }
}

module.exports = UnifiedLogger;