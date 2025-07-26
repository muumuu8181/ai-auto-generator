#!/usr/bin/env node

/**
 * 作業完了強制システム v1.0
 * 重要度L8: Worker AIの中断防止・完了報告必須化システム
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class CompletionEnforcer {
    constructor(sessionId = 'default', useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.enforcementFile = path.join(this.configDir, 'completion-enforcement.json');
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
     * 作業開始を記録（Phase 1開始時に呼び出し）
     */
    startWorkSession(appId, appType, requirements) {
        const enforcement = this.loadEnforcement();
        
        const session = {
            sessionId: this.sessionId,
            appId,
            appType,
            requirements: requirements.substring(0, 500), // 最初の500文字のみ
            startTime: new Date().toISOString(),
            currentPhase: 1,
            completedPhases: [],
            mandatoryPhases: [1, 2, 3, 4, 5], // 必須完了フェーズ
            isActive: true,
            completionDeadline: this.calculateDeadline(),
            warningsSent: 0,
            lastActivity: new Date().toISOString()
        };

        enforcement.activeSessions[this.sessionId] = session;
        this.saveEnforcement(enforcement);

        this.log('work_session_started', 'Work session started with completion enforcement', {
            appId,
            appType,
            deadline: session.completionDeadline
        });

        console.log(`🚨 作業完了強制システム開始 (重要度L8)`);
        console.log(`   App ID: ${appId}`);
        console.log(`   完了期限: ${session.completionDeadline}`);
        console.log(`   必須フェーズ: ${session.mandatoryPhases.join(', ')}`);
        console.log(`   ⚠️ 中断は許可されません - 完了まで継続してください`);

        return session;
    }

    /**
     * フェーズ完了を記録
     */
    completePhase(phaseNumber, phaseDescription = '') {
        const enforcement = this.loadEnforcement();
        const session = enforcement.activeSessions[this.sessionId];

        if (!session) {
            console.warn('⚠️ Active session not found for completion enforcement');
            return false;
        }

        session.completedPhases.push({
            phase: phaseNumber,
            description: phaseDescription,
            completedAt: new Date().toISOString()
        });

        session.currentPhase = phaseNumber + 1;
        session.lastActivity = new Date().toISOString();

        this.saveEnforcement(enforcement);

        this.log('phase_completed', `Phase ${phaseNumber} completed`, {
            phase: phaseNumber,
            description: phaseDescription,
            remainingPhases: session.mandatoryPhases.filter(p => p > phaseNumber)
        });

        console.log(`✅ Phase ${phaseNumber} 完了: ${phaseDescription}`);
        
        // 進捗確認
        this.checkProgress(session);

        return true;
    }

    /**
     * 作業完了を記録（最終完了時）
     */
    completeWorkSession(appId, deploymentUrl = '', status = 'success') {
        const enforcement = this.loadEnforcement();
        const session = enforcement.activeSessions[this.sessionId];

        if (!session) {
            console.warn('⚠️ Active session not found for completion');
            return false;
        }

        const completedSession = {
            ...session,
            endTime: new Date().toISOString(),
            finalStatus: status,
            deploymentUrl,
            isActive: false,
            allPhasesCompleted: this.validateAllPhasesCompleted(session),
            totalDuration: this.calculateDuration(session.startTime)
        };

        // アクティブセッションから削除
        delete enforcement.activeSessions[this.sessionId];

        // 完了履歴に追加
        if (!enforcement.completedSessions) {
            enforcement.completedSessions = [];
        }
        enforcement.completedSessions.push(completedSession);

        // 最新100件のみ保持
        if (enforcement.completedSessions.length > 100) {
            enforcement.completedSessions = enforcement.completedSessions.slice(-100);
        }

        this.saveEnforcement(enforcement);

        this.log('work_session_completed', 'Work session completed successfully', {
            appId,
            status,
            duration: completedSession.totalDuration,
            allPhasesCompleted: completedSession.allPhasesCompleted
        });

        if (completedSession.allPhasesCompleted) {
            console.log(`🎉 作業完了！全フェーズ完了 (${Math.round(completedSession.totalDuration / 60)}分)`);
            console.log(`   App ID: ${appId}`);
            console.log(`   デプロイURL: ${deploymentUrl}`);
            console.log(`   ✅ 完了要件を満たしています`);
        } else {
            console.log(`⚠️ 作業完了しましたが、一部フェーズが未完了です`);
            this.generateIncompleteReport(completedSession);
        }

        return completedSession;
    }

    /**
     * 進捗チェックと警告
     */
    checkProgress(session) {
        const remainingPhases = session.mandatoryPhases.filter(
            p => !session.completedPhases.some(cp => cp.phase === p)
        );

        const timeElapsed = new Date() - new Date(session.startTime);
        const timeRemaining = new Date(session.completionDeadline) - new Date();

        if (remainingPhases.length > 0) {
            console.log(`📊 進捗状況:`);
            console.log(`   完了フェーズ: ${session.completedPhases.length}/${session.mandatoryPhases.length}`);
            console.log(`   残りフェーズ: ${remainingPhases.join(', ')}`);
            console.log(`   残り時間: ${Math.round(timeRemaining / (1000 * 60))}分`);

            // 時間切れ警告
            if (timeRemaining < 10 * 60 * 1000 && remainingPhases.length > 1) { // 10分未満
                this.sendUrgentWarning(session, remainingPhases);
            }
        }
    }

    /**
     * 緊急警告発出
     */
    sendUrgentWarning(session, remainingPhases) {
        session.warningsSent++;
        
        console.log(`\n🚨🚨🚨 緊急警告 (重要度L8) 🚨🚨🚨`);
        console.log(`作業時間が不足しています！`);
        console.log(`残りフェーズ: ${remainingPhases.join(', ')}`);
        console.log(`残り時間: ${Math.round((new Date(session.completionDeadline) - new Date()) / (1000 * 60))}分`);
        console.log(`\n必須アクション:`);
        console.log(`1. 現在の作業を中断せずに継続`);
        console.log(`2. 残りフェーズを優先順位順に完了`);
        console.log(`3. 完了報告を必ず実行`);
        console.log(`\n❌ この警告を無視して中断することは許可されません`);

        this.log('urgent_warning_sent', 'Urgent completion warning sent', {
            remainingPhases,
            warningsCount: session.warningsSent
        });
    }

    /**
     * アクティブセッション監視
     */
    monitorActiveSessions() {
        const enforcement = this.loadEnforcement();
        const now = new Date();
        
        Object.values(enforcement.activeSessions || {}).forEach(session => {
            const deadline = new Date(session.completionDeadline);
            const lastActivity = new Date(session.lastActivity);
            const inactiveTime = now - lastActivity;

            // 30分以上非アクティブ
            if (inactiveTime > 30 * 60 * 1000) {
                this.reportAbandonedSession(session);
            }

            // 期限超過
            if (now > deadline && session.isActive) {
                this.reportOverdueSession(session);
            }
        });
    }

    /**
     * 放棄セッション報告
     */
    reportAbandonedSession(session) {
        console.log(`🚨 放棄セッション検知:`);
        console.log(`   Session ID: ${session.sessionId}`);
        console.log(`   App ID: ${session.appId}`);
        console.log(`   最終活動: ${session.lastActivity}`);
        console.log(`   完了フェーズ: ${session.completedPhases.length}/${session.mandatoryPhases.length}`);

        // Management AI通知作成
        this.createManagementAINotification({
            type: 'abandoned_session',
            severity: 'high',
            sessionId: session.sessionId,
            appId: session.appId,
            lastActivity: session.lastActivity,
            completedPhases: session.completedPhases.length
        });

        this.log('abandoned_session_detected', 'Work session abandoned without completion', {
            sessionId: session.sessionId,
            appId: session.appId
        });
    }

    /**
     * 期限超過セッション報告
     */
    reportOverdueSession(session) {
        console.log(`⏰ 期限超過セッション:`);
        console.log(`   Session ID: ${session.sessionId}`);
        console.log(`   App ID: ${session.appId}`);
        console.log(`   期限: ${session.completionDeadline}`);
        console.log(`   現在時刻: ${new Date().toISOString()}`);

        this.createManagementAINotification({
            type: 'overdue_session',
            severity: 'critical',
            sessionId: session.sessionId,
            appId: session.appId,
            deadline: session.completionDeadline
        });

        this.log('overdue_session_detected', 'Work session exceeded deadline', {
            sessionId: session.sessionId,
            appId: session.appId
        });
    }

    /**
     * 複数アプリ連続生成モード
     */
    startContinuousMode(targetCount, appType = '') {
        const enforcement = this.loadEnforcement();
        
        const continuousSession = {
            sessionId: this.sessionId,
            mode: 'continuous',
            targetCount,
            appType,
            startTime: new Date().toISOString(),
            completedApps: [],
            currentAppIndex: 0,
            isActive: true,
            mustComplete: true,
            deadline: this.calculateExtendedDeadline(targetCount)
        };

        enforcement.continuousSessions = enforcement.continuousSessions || {};
        enforcement.continuousSessions[this.sessionId] = continuousSession;
        this.saveEnforcement(enforcement);

        console.log(`🔄 連続生成モード開始 (重要度L8)`);
        console.log(`   目標アプリ数: ${targetCount}`);
        console.log(`   アプリタイプ: ${appType || '任意'}`);
        console.log(`   完了期限: ${continuousSession.deadline}`);
        console.log(`   ⚠️ ${targetCount}個すべて完了するまで中断禁止`);

        return continuousSession;
    }

    /**
     * ユーティリティ関数
     */
    calculateDeadline() {
        const now = new Date();
        now.setHours(now.getHours() + 2); // 2時間後
        return now.toISOString();
    }

    calculateExtendedDeadline(appCount) {
        const now = new Date();
        now.setHours(now.getHours() + (appCount * 1)); // 1時間/アプリ
        return now.toISOString();
    }

    calculateDuration(startTime) {
        return (new Date() - new Date(startTime)) / 1000; // 秒単位
    }

    validateAllPhasesCompleted(session) {
        return session.mandatoryPhases.every(
            phase => session.completedPhases.some(cp => cp.phase === phase)
        );
    }

    /**
     * Management AI通知作成
     */
    createManagementAINotification(notification) {
        try {
            const notificationFile = path.join(this.configDir, 'management-ai-notifications.json');
            
            let notifications = [];
            if (fs.existsSync(notificationFile)) {
                notifications = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
            }

            notifications.push({
                ...notification,
                timestamp: new Date().toISOString(),
                source: 'completion-enforcer'
            });

            fs.writeFileSync(notificationFile, JSON.stringify(notifications, null, 2));

        } catch (error) {
            console.warn('⚠️ Management AI notification failed:', error.message);
        }
    }

    /**
     * データ管理
     */
    loadEnforcement() {
        if (!fs.existsSync(this.enforcementFile)) {
            return {
                version: '1.0.0',
                created: new Date().toISOString(),
                activeSessions: {},
                completedSessions: [],
                continuousSessions: {},
                settings: {
                    defaultDeadlineHours: 2,
                    maxWarnings: 3,
                    enforceCompletion: true
                }
            };
        }

        try {
            return JSON.parse(fs.readFileSync(this.enforcementFile, 'utf8'));
        } catch (error) {
            console.warn('⚠️ Enforcement file corrupted, creating new');
            return this.loadEnforcement();
        }
    }

    saveEnforcement(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.enforcementFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save enforcement data:', error.message);
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
            this.unifiedLogger.log('completion-enforcer', action, description, data);
        }

        console.log(`🚨 [ENFORCER] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const enforcer = new CompletionEnforcer();
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'start':
            const appId = process.argv[3];
            const appType = process.argv[4] || 'unknown';
            const requirements = process.argv[5] || '';
            
            if (!appId) {
                console.error('Usage: node completion-enforcer.cjs start <appId> [appType] [requirements]');
                process.exit(1);
            }
            
            const session = enforcer.startWorkSession(appId, appType, requirements);
            console.log(JSON.stringify(session, null, 2));
            break;
            
        case 'phase':
            const phaseNumber = parseInt(process.argv[3]);
            const phaseDesc = process.argv[4] || '';
            
            if (!phaseNumber) {
                console.error('Usage: node completion-enforcer.cjs phase <phaseNumber> [description]');
                process.exit(1);
            }
            
            const result = enforcer.completePhase(phaseNumber, phaseDesc);
            console.log(`Phase ${phaseNumber} completion: ${result}`);
            break;
            
        case 'complete':
            const completeAppId = process.argv[3];
            const deployUrl = process.argv[4] || '';
            const status = process.argv[5] || 'success';
            
            if (!completeAppId) {
                console.error('Usage: node completion-enforcer.cjs complete <appId> [deployUrl] [status]');
                process.exit(1);
            }
            
            const completed = enforcer.completeWorkSession(completeAppId, deployUrl, status);
            console.log(JSON.stringify(completed, null, 2));
            break;
            
        case 'continuous':
            const count = parseInt(process.argv[3]);
            const contType = process.argv[4] || '';
            
            if (!count || count < 1) {
                console.error('Usage: node completion-enforcer.cjs continuous <count> [appType]');
                process.exit(1);
            }
            
            const contSession = enforcer.startContinuousMode(count, contType);
            console.log(JSON.stringify(contSession, null, 2));
            break;
            
        case 'monitor':
            enforcer.monitorActiveSessions();
            break;
            
        case 'status':
            const enforcement = enforcer.loadEnforcement();
            console.log('Active Sessions:', Object.keys(enforcement.activeSessions).length);
            console.log('Completed Sessions:', enforcement.completedSessions?.length || 0);
            console.log('Continuous Sessions:', Object.keys(enforcement.continuousSessions || {}).length);
            break;
            
        default:
            console.log('Completion Enforcer Commands (重要度L8):');
            console.log('  start <appId> [appType] [requirements]  - Start work session with enforcement');
            console.log('  phase <phaseNumber> [description]       - Mark phase as completed');
            console.log('  complete <appId> [deployUrl] [status]   - Complete work session');
            console.log('  continuous <count> [appType]            - Start continuous generation mode');
            console.log('  monitor                                 - Monitor active sessions');
            console.log('  status                                  - Show system status');
            console.log('\nExamples:');
            console.log('  node completion-enforcer.cjs start app-005-abc123 money "expense tracker"');
            console.log('  node completion-enforcer.cjs phase 3 "AI Generation Complete"');
            console.log('  node completion-enforcer.cjs complete app-005-abc123 "https://..."');
            console.log('  node completion-enforcer.cjs continuous 3 money');
    }
}

module.exports = CompletionEnforcer;