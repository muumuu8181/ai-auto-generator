#!/usr/bin/env node

/**
 * 重複アプリ検知・報告システム v1.0
 * Worker AI向け強化された重複検知とManagement AI報告機能
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class DuplicateAppDetector {
    constructor(sessionId = 'default', useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.duplicateReportFile = path.join(this.configDir, 'duplicate-incidents.json');
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.ensureConfigDir();
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger(sessionId);
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
     * 強化された重複検知（複数の判定基準）
     */
    detectDuplicates(newAppInfo) {
        try {
            // App Generation History からデータ取得
            const AppGenerationHistory = require('./app-generation-history.cjs');
            const history = new AppGenerationHistory();
            
            const duplicateResults = {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                newApp: newAppInfo,
                duplicateTypes: [],
                severity: 'none',
                recommendation: 'proceed',
                blockGeneration: false
            };

            // 1. アプリタイプ重複チェック
            const typeCheck = this.checkTypeDuplicate(history, newAppInfo);
            if (typeCheck.isDuplicate) {
                duplicateResults.duplicateTypes.push(typeCheck);
            }

            // 2. 要件内容類似性チェック
            const contentCheck = this.checkContentSimilarity(history, newAppInfo);
            if (contentCheck.isDuplicate) {
                duplicateResults.duplicateTypes.push(contentCheck);
            }

            // 3. 時間的近接性チェック
            const timeCheck = this.checkTemporalProximity(history, newAppInfo);
            if (timeCheck.isDuplicate) {
                duplicateResults.duplicateTypes.push(timeCheck);
            }

            // 総合判定
            this.calculateFinalJudgment(duplicateResults);

            // ログ記録と報告
            this.logDetectionResult(duplicateResults);

            return duplicateResults;

        } catch (error) {
            this.log('detection_error', 'Duplicate detection failed', { error: error.message });
            return {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                error: error.message,
                severity: 'error',
                recommendation: 'proceed_with_caution'
            };
        }
    }

    /**
     * アプリタイプ重複チェック
     */
    checkTypeDuplicate(history, newAppInfo) {
        const existingApps = history.getAppsByType(newAppInfo.appType);
        
        return {
            checkType: 'app_type',
            isDuplicate: existingApps.length > 0,
            severity: existingApps.length > 0 ? 'high' : 'none',
            existingCount: existingApps.length,
            existingApps: existingApps.map(app => ({
                appId: app.appId,
                generatedAt: app.generatedAt,
                appName: app.appName
            })),
            message: existingApps.length > 0 ? 
                `${newAppInfo.appType}タイプのアプリが既に${existingApps.length}個存在` : 
                'アプリタイプ重複なし'
        };
    }

    /**
     * 要件内容類似性チェック
     */
    checkContentSimilarity(history, newAppInfo) {
        const allApps = history.loadHistory().history;
        const newRequirements = (newAppInfo.requirements || '').toLowerCase();
        
        const similarApps = allApps.filter(app => {
            const existingRequirements = (app.requirements || '').toLowerCase();
            return this.calculateSimilarity(newRequirements, existingRequirements) > 0.7;
        });

        return {
            checkType: 'content_similarity',
            isDuplicate: similarApps.length > 0,
            severity: similarApps.length > 0 ? 'medium' : 'none',
            similarApps: similarApps.map(app => ({
                appId: app.appId,
                appType: app.appType,
                similarity: this.calculateSimilarity(newRequirements, (app.requirements || '').toLowerCase())
            })),
            message: similarApps.length > 0 ? 
                `類似要件のアプリが${similarApps.length}個存在` : 
                '要件類似性なし'
        };
    }

    /**
     * 時間的近接性チェック（同日・同時間帯）
     */
    checkTemporalProximity(history, newAppInfo) {
        const allApps = history.loadHistory().history;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const recentApps = allApps.filter(app => {
            const appDate = new Date(app.generatedAt);
            return appDate >= todayStart && app.appType === newAppInfo.appType;
        });

        return {
            checkType: 'temporal_proximity',
            isDuplicate: recentApps.length > 0,
            severity: recentApps.length > 1 ? 'high' : recentApps.length > 0 ? 'medium' : 'none',
            recentApps: recentApps.map(app => ({
                appId: app.appId,
                generatedAt: app.generatedAt,
                timeDiff: Math.round((now - new Date(app.generatedAt)) / (1000 * 60)) // 分単位
            })),
            message: recentApps.length > 0 ? 
                `今日、同タイプアプリを${recentApps.length}個生成済み` : 
                '時間的重複なし'
        };
    }

    /**
     * 総合判定
     */
    calculateFinalJudgment(duplicateResults) {
        const severityMap = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
        let maxSeverity = 0;
        let totalScore = 0;

        duplicateResults.duplicateTypes.forEach(check => {
            const score = severityMap[check.severity] || 0;
            maxSeverity = Math.max(maxSeverity, score);
            totalScore += score;
        });

        // 重要度判定
        if (totalScore >= 5 || maxSeverity >= 3) {
            duplicateResults.severity = 'critical';
            duplicateResults.recommendation = 'block_generation';
            duplicateResults.blockGeneration = true;
        } else if (totalScore >= 3) {
            duplicateResults.severity = 'high';
            duplicateResults.recommendation = 'warn_and_confirm';
            duplicateResults.blockGeneration = false;
        } else if (totalScore >= 1) {
            duplicateResults.severity = 'medium';
            duplicateResults.recommendation = 'warn_only';
            duplicateResults.blockGeneration = false;
        } else {
            duplicateResults.severity = 'none';
            duplicateResults.recommendation = 'proceed';
            duplicateResults.blockGeneration = false;
        }
    }

    /**
     * 検知結果のログ記録と報告
     */
    logDetectionResult(duplicateResults) {
        // 統合ログに記録
        this.log('duplicate_detection', 'Duplicate app detection completed', {
            severity: duplicateResults.severity,
            recommendation: duplicateResults.recommendation,
            duplicateCount: duplicateResults.duplicateTypes.length
        });

        // 重複インシデント報告書作成（重要度 medium 以上）
        if (duplicateResults.severity !== 'none') {
            this.createIncidentReport(duplicateResults);
        }

        // コンソール表示
        this.displayDetectionResult(duplicateResults);
    }

    /**
     * Management AI向けインシデント報告書作成
     */
    createIncidentReport(duplicateResults) {
        try {
            let reports = [];
            if (fs.existsSync(this.duplicateReportFile)) {
                reports = JSON.parse(fs.readFileSync(this.duplicateReportFile, 'utf8'));
            }

            const incident = {
                incidentId: `DUP-${Date.now()}`,
                timestamp: duplicateResults.timestamp,
                sessionId: this.sessionId,
                severity: duplicateResults.severity,
                appInfo: duplicateResults.newApp,
                duplicateTypes: duplicateResults.duplicateTypes,
                recommendation: duplicateResults.recommendation,
                blocked: duplicateResults.blockGeneration,
                resolved: false,
                managerNotified: false
            };

            reports.push(incident);

            // 最新50件のみ保持
            if (reports.length > 50) {
                reports = reports.slice(-50);
            }

            fs.writeFileSync(this.duplicateReportFile, JSON.stringify(reports, null, 2));

            this.log('incident_reported', 'Duplicate incident report created', {
                incidentId: incident.incidentId,
                severity: incident.severity
            });

            // Management AI自動実行タスクに通知
            this.notifyManagementAI(incident);

        } catch (error) {
            console.error('❌ Failed to create incident report:', error.message);
        }
    }

    /**
     * Management AI自動通知
     */
    notifyManagementAI(incident) {
        try {
            // Management AI自動タスクシステムに通知
            const notificationFile = path.join(this.configDir, 'management-ai-notifications.json');
            
            let notifications = [];
            if (fs.existsSync(notificationFile)) {
                notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
            }

            notifications.push({
                type: 'duplicate_incident',
                priority: incident.severity === 'critical' ? 'urgent' : 'normal',
                timestamp: new Date().toISOString(),
                incidentId: incident.incidentId,
                summary: `重複アプリ検知: ${incident.appInfo.appType} (重要度: ${incident.severity})`,
                details: incident
            });

            fs.writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));

            console.log(`📬 Management AI通知作成: ${incident.incidentId}`);

        } catch (error) {
            console.warn('⚠️ Management AI notification failed:', error.message);
        }
    }

    /**
     * 検知結果表示
     */
    displayDetectionResult(duplicateResults) {
        const severityEmojis = {
            'critical': '🚨',
            'high': '⚠️',
            'medium': '⚠️',
            'none': '✅'
        };

        const emoji = severityEmojis[duplicateResults.severity] || '🔍';
        console.log(`\n${emoji} 重複アプリ検知結果:`);
        console.log(`   重要度: ${duplicateResults.severity.toUpperCase()}`);
        console.log(`   推奨: ${duplicateResults.recommendation}`);

        if (duplicateResults.duplicateTypes.length > 0) {
            console.log(`\n🔍 検知詳細:`);
            duplicateResults.duplicateTypes.forEach((check, index) => {
                console.log(`   ${index + 1}. ${check.checkType}: ${check.message}`);
            });
        }

        if (duplicateResults.blockGeneration) {
            console.log(`\n🚫 GENERATION BLOCKED: 重複により生成を中止します`);
            console.log(`   理由: 同タイプのアプリが既に存在します`);
            console.log(`   対策: 既存アプリの改良を検討してください`);
        }
    }

    /**
     * 類似度計算（簡易版）
     */
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        const common = words1.filter(word => words2.includes(word));
        const total = new Set([...words1, ...words2]).size;
        
        return total > 0 ? common.length / total : 0;
    }

    /**
     * Worker AI向け重複チェック（ブロッキング）
     */
    checkBeforeGeneration(appInfo) {
        const result = this.detectDuplicates(appInfo);
        
        return {
            canProceed: !result.blockGeneration,
            severity: result.severity,
            message: this.generateWorkerMessage(result),
            incidentId: result.incidentId || null,
            duplicateDetails: result.duplicateTypes
        };
    }

    /**
     * Worker AI向けメッセージ生成
     */
    generateWorkerMessage(duplicateResults) {
        if (duplicateResults.blockGeneration) {
            return `🚫 アプリ生成を中止しました。同タイプ (${duplicateResults.newApp.appType}) のアプリが既に存在します。既存アプリの改良を検討してください。`;
        } else if (duplicateResults.severity !== 'none') {
            return `⚠️ 注意: 類似アプリが存在します (重要度: ${duplicateResults.severity})。異なる機能や改良版として進めてください。`;
        } else {
            return `✅ 重複なし。アプリ生成を続行してください。`;
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
            this.unifiedLogger.log('duplicate-detector', action, description, data);
        }

        console.log(`🔍 [DUPLICATE] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const detector = new DuplicateAppDetector();
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'check':
            const appType = process.argv[3];
            const appName = process.argv[4] || '';
            const requirements = process.argv[5] || '';
            
            if (!appType) {
                console.error('Usage: node duplicate-app-detector.cjs check <appType> [appName] [requirements]');
                process.exit(1);
            }
            
            const appInfo = { appType, appName, requirements };
            const result = detector.checkBeforeGeneration(appInfo);
            
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.canProceed ? 0 : 1);
            break;
            
        case 'detect':
            const detectType = process.argv[3];
            const detectName = process.argv[4] || '';
            const detectReq = process.argv[5] || '';
            
            if (!detectType) {
                console.error('Usage: node duplicate-app-detector.cjs detect <appType> [appName] [requirements]');
                process.exit(1);
            }
            
            const detectInfo = { appType: detectType, appName: detectName, requirements: detectReq };
            const detectResult = detector.detectDuplicates(detectInfo);
            
            console.log(JSON.stringify(detectResult, null, 2));
            break;
            
        case 'incidents':
            if (fs.existsSync(detector.duplicateReportFile)) {
                const incidents = JSON.parse(fs.readFileSync(detector.duplicateReportFile, 'utf8'));
                console.log(JSON.stringify(incidents, null, 2));
            } else {
                console.log('[]');
            }
            break;
            
        default:
            console.log('Duplicate App Detector Commands:');
            console.log('  check <appType> [appName] [requirements]  - Check before generation (blocking)');
            console.log('  detect <appType> [appName] [requirements] - Detailed duplicate detection');
            console.log('  incidents                                 - Show duplicate incident reports');
            console.log('\nExamples:');
            console.log('  node duplicate-app-detector.cjs check money "Money Manager" "track expenses"');
            console.log('  node duplicate-app-detector.cjs detect calculator');
            console.log('  node duplicate-app-detector.cjs incidents');
    }
}

module.exports = DuplicateAppDetector;