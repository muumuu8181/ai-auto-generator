#!/usr/bin/env node

/**
 * 事故報告システム v1.0
 * Worker AI重複生成・ルール違反の事故報告とManagement AI通知
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class IncidentReporter {
    constructor(useUnifiedLogging = true) {
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.incidentFile = path.join(this.configDir, 'incident-reports.json');
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.ensureConfigDir();
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger('incident-reporter');
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

    loadIncidents() {
        if (!fs.existsSync(this.incidentFile)) {
            return {
                version: '1.0.0',
                created: new Date().toISOString(),
                totalIncidents: 0,
                incidents: [],
                stats: {
                    duplicateGeneration: 0,
                    ruleViolation: 0,
                    systemError: 0,
                    other: 0
                }
            };
        }

        try {
            return JSON.parse(fs.readFileSync(this.incidentFile, 'utf8'));
        } catch (error) {
            console.warn('⚠️ Incident file corrupted, creating new');
            return this.loadIncidents();
        }
    }

    saveIncidents(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.incidentFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save incident data:', error.message);
        }
    }

    /**
     * 事故報告記録
     */
    reportIncident(incidentType, details = {}) {
        const data = this.loadIncidents();
        const deviceId = this.getDeviceId();
        
        const incident = {
            id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            type: incidentType,
            timestamp: new Date().toISOString(),
            deviceId: deviceId,
            severity: this.getSeverity(incidentType),
            status: 'reported',
            details: details,
            reportedBy: 'Worker AI',
            managementAINotified: false
        };

        // 重要度に応じた追加処理
        if (incident.severity === 'critical') {
            incident.requiresImmediateAction = true;
            incident.escalatedToManagement = true;
        }

        // 統計更新
        data.stats[incidentType] = (data.stats[incidentType] || 0) + 1;
        data.totalIncidents++;

        // 事故履歴に追加
        data.incidents.push(incident);

        // 古い事故は削除（最新100件のみ保持）
        if (data.incidents.length > 100) {
            data.incidents = data.incidents.slice(-100);
        }

        this.saveIncidents(data);

        this.log('incident_reported', `${incidentType} incident reported`, {
            incidentId: incident.id,
            severity: incident.severity,
            deviceId: deviceId
        });

        // Management AI通知
        if (incident.severity === 'critical') {
            this.notifyManagementAI(incident);
        }

        console.log(`🚨 INCIDENT REPORTED: ${incident.id}`);
        console.log(`   Type: ${incidentType}`);
        console.log(`   Severity: ${incident.severity}`);
        console.log(`   Timestamp: ${incident.timestamp}`);
        console.log(`   Device: ${deviceId}`);

        return incident;
    }

    /**
     * 重複生成事故の詳細報告
     */
    reportDuplicateGeneration(appType, uniqueId, duplicateCheckResult, sessionId) {
        const details = {
            appType: appType,
            attemptedUniqueId: uniqueId,
            sessionId: sessionId,
            duplicateCheckResult: duplicateCheckResult,
            workflowPhase: 'Phase 2: Project Selection',
            preventionAction: 'Workflow terminated with exit 1',
            existingApps: duplicateCheckResult.existingApps || [],
            recommendation: duplicateCheckResult.recommendation || 'UNKNOWN'
        };

        return this.reportIncident('duplicateGeneration', details);
    }

    /**
     * 重要度判定
     */
    getSeverity(incidentType) {
        const severityMap = {
            'duplicateGeneration': 'critical',
            'ruleViolation': 'high',
            'systemError': 'medium',
            'dataCorruption': 'critical',
            'unauthorizedAccess': 'critical',
            'configurationError': 'medium',
            'performanceIssue': 'low'
        };

        return severityMap[incidentType] || 'medium';
    }

    /**
     * Management AI通知
     */
    notifyManagementAI(incident) {
        try {
            // Management AI通知ファイル作成
            const notificationDir = path.join(this.configDir, 'management-notifications');
            if (!fs.existsSync(notificationDir)) {
                fs.mkdirSync(notificationDir, { recursive: true });
            }

            const notificationFile = path.join(notificationDir, `${incident.id}.json`);
            const notification = {
                incidentId: incident.id,
                type: incident.type,
                severity: incident.severity,
                timestamp: incident.timestamp,
                deviceId: incident.deviceId,
                summary: this.generateIncidentSummary(incident),
                details: incident.details,
                requiresAction: incident.severity === 'critical',
                status: 'pending_management_review'
            };

            fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));

            this.log('management_notified', 'Management AI notified of critical incident', {
                incidentId: incident.id,
                notificationFile: notificationFile
            });

            console.log(`📢 Management AI notified: ${notificationFile}`);

            // incident記録を更新
            const data = this.loadIncidents();
            const incidentIndex = data.incidents.findIndex(i => i.id === incident.id);
            if (incidentIndex !== -1) {
                data.incidents[incidentIndex].managementAINotified = true;
                data.incidents[incidentIndex].notificationFile = notificationFile;
                this.saveIncidents(data);
            }

            return notification;

        } catch (error) {
            console.error('❌ Failed to notify Management AI:', error.message);
            this.log('notification_failed', 'Failed to notify Management AI', {
                incidentId: incident.id,
                error: error.message
            });
        }
    }

    /**
     * 事故サマリー生成
     */
    generateIncidentSummary(incident) {
        switch (incident.type) {
            case 'duplicateGeneration':
                const appType = incident.details.appType || 'unknown';
                const existingCount = (incident.details.existingApps || []).length;
                return `Worker AI attempted to generate duplicate ${appType} app (${existingCount} existing apps found). Generation was prevented.`;
                
            case 'ruleViolation':
                return `Worker AI violated system rules: ${incident.details.rule || 'unknown rule'}`;
                
            case 'systemError':
                return `System error occurred: ${incident.details.error || 'unknown error'}`;
                
            default:
                return `${incident.type} incident occurred on device ${incident.deviceId}`;
        }
    }

    /**
     * 事故統計表示
     */
    showStats() {
        const data = this.loadIncidents();
        
        console.log('\n🚨 Incident Report Statistics:');
        console.log(`   Total Incidents: ${data.totalIncidents}`);
        console.log(`   Incident File: ${this.incidentFile}`);
        console.log(`   Last Updated: ${data.lastUpdated || 'Never'}`);
        
        console.log('\n📊 Incident Types:');
        Object.entries(data.stats).forEach(([type, count]) => {
            if (count > 0) {
                const severity = this.getSeverity(type);
                const severityIcon = severity === 'critical' ? '🔴' : 
                                   severity === 'high' ? '🟠' : 
                                   severity === 'medium' ? '🟡' : '🟢';
                console.log(`   ${severityIcon} ${type}: ${count} incidents`);
            }
        });

        if (data.incidents.length > 0) {
            const recent = data.incidents.slice(-5);
            console.log('\n📋 Recent Incidents:');
            recent.forEach(incident => {
                const time = incident.timestamp.substring(0, 16);
                const severityIcon = incident.severity === 'critical' ? '🔴' : 
                                   incident.severity === 'high' ? '🟠' : 
                                   incident.severity === 'medium' ? '🟡' : '🟢';
                console.log(`   ${time}: ${severityIcon} ${incident.type} (${incident.id.substring(0, 12)}...)`);
            });
        }

        // Management AI未通知の重要事故確認
        const criticalUnnotified = data.incidents.filter(i => 
            i.severity === 'critical' && !i.managementAINotified
        );
        
        if (criticalUnnotified.length > 0) {
            console.log(`\n⚠️ Critical incidents pending Management AI review: ${criticalUnnotified.length}`);
        }

        return data;
    }

    /**
     * デバイスID取得
     */
    getDeviceId() {
        try {
            const DeviceManager = require('./device-manager.cjs');
            const deviceManager = new DeviceManager();
            return deviceManager.getOrCreateDeviceId();
        } catch (error) {
            return 'unknown-device';
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
            this.unifiedLogger.log('incident-reporter', action, description, data);
        }

        console.log(`📝 [INCIDENT] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const reporter = new IncidentReporter();
    const command = process.argv[2] || 'stats';
    
    switch (command) {
        case 'report':
            const type = process.argv[3];
            const appType = process.argv[4];
            const uniqueId = process.argv[5];
            const duplicateResult = process.argv[6];
            const sessionId = process.argv[7];
            
            if (!type) {
                console.error('Usage: node incident-reporter.cjs report <type> [args...]');
                console.error('Types: duplicate_generation, rule_violation, system_error');
                process.exit(1);
            }
            
            let incident;
            if (type === 'duplicate_generation') {
                if (!appType || !uniqueId || !duplicateResult || !sessionId) {
                    console.error('Usage: node incident-reporter.cjs report duplicate_generation <appType> <uniqueId> <duplicateResult> <sessionId>');
                    process.exit(1);
                }
                
                let parsedResult;
                try {
                    parsedResult = JSON.parse(duplicateResult);
                } catch (error) {
                    parsedResult = { error: 'Failed to parse duplicate result' };
                }
                
                incident = reporter.reportDuplicateGeneration(appType, uniqueId, parsedResult, sessionId);
            } else {
                incident = reporter.reportIncident(type, {
                    appType,
                    uniqueId,
                    sessionId
                });
            }
            
            console.log(JSON.stringify(incident, null, 2));
            break;
            
        case 'stats':
            reporter.showStats();
            break;
            
        case 'list':
            const data = reporter.loadIncidents();
            console.log(JSON.stringify(data.incidents, null, 2));
            break;
            
        default:
            console.log('Incident Reporter Commands:');
            console.log('  report <type> [args...]              - Report an incident');
            console.log('  stats                               - Show incident statistics');
            console.log('  list                                - List all incidents');
            console.log('\nExample:');
            console.log('  node incident-reporter.cjs report duplicate_generation money abc123 \'{"shouldProceed":false}\' session-123');
    }
}

module.exports = IncidentReporter;