#!/usr/bin/env node

/**
 * アプリ生成履歴管理システム v1.0
 * Worker AIの重複アプリ生成検知・記録システム
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class AppGenerationHistory {
    constructor(useUnifiedLogging = true) {
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.historyFile = path.join(this.configDir, 'app-generation-history.json');
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.ensureConfigDir();
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger('app-history');
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

    loadHistory() {
        if (!fs.existsSync(this.historyFile)) {
            return {
                version: '1.0.0',
                created: new Date().toISOString(),
                totalApps: 0,
                history: [],
                deviceStats: {},
                typeStats: {}
            };
        }

        try {
            return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        } catch (error) {
            console.warn('⚠️ History file corrupted, creating new');
            return this.loadHistory();
        }
    }

    saveHistory(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save history:', error.message);
        }
    }

    /**
     * アプリ生成記録
     */
    recordAppGeneration(appInfo) {
        const history = this.loadHistory();
        const deviceId = this.getDeviceId();
        
        const record = {
            appId: appInfo.appId,
            appName: appInfo.appName || 'Unknown App',
            appType: appInfo.appType || 'unknown',
            appNumber: appInfo.appNumber || '999',
            deviceId: deviceId,
            generatedAt: new Date().toISOString(),
            requirements: appInfo.requirements || '',
            sessionId: appInfo.sessionId || 'unknown',
            ...appInfo
        };

        // 重複チェック
        const duplicates = this.findDuplicates(history.history, record);
        if (duplicates.length > 0) {
            record.isDuplicate = true;
            record.duplicateOf = duplicates.map(d => d.appId);
            
            this.log('duplicate_detected', 'Duplicate app generation detected', {
                newApp: record.appId,
                duplicateOf: record.duplicateOf,
                appType: record.appType
            });
            
            console.log(`⚠️ DUPLICATE DETECTED: ${record.appType} app already exists!`);
            duplicates.forEach(dup => {
                console.log(`   Previous: ${dup.appId} (${dup.generatedAt})`);
            });
        }

        // 履歴に追加
        history.history.push(record);
        history.totalApps++;

        // 統計更新
        history.deviceStats[deviceId] = (history.deviceStats[deviceId] || 0) + 1;
        history.typeStats[record.appType] = (history.typeStats[record.appType] || 0) + 1;

        this.saveHistory(history);
        
        this.log('app_recorded', 'App generation recorded', {
            appId: record.appId,
            appType: record.appType,
            isDuplicate: record.isDuplicate || false
        });

        console.log(`📝 App recorded: ${record.appId} (${record.appType})`);
        if (record.isDuplicate) {
            console.log(`🔴 Marked as DUPLICATE of: ${record.duplicateOf.join(', ')}`);
        }

        return record;
    }

    /**
     * 重複検出
     */
    findDuplicates(history, newRecord) {
        return history.filter(existing => {
            // 同じデバイス && 同じアプリタイプ
            return existing.deviceId === newRecord.deviceId && 
                   existing.appType === newRecord.appType &&
                   existing.appId !== newRecord.appId;
        });
    }

    /**
     * アプリタイプ別履歴取得
     */
    getAppsByType(appType, deviceId = null) {
        const history = this.loadHistory();
        const currentDeviceId = deviceId || this.getDeviceId();
        
        return history.history.filter(record => 
            record.appType === appType && 
            record.deviceId === currentDeviceId
        );
    }

    /**
     * 重複チェック
     */
    checkForDuplicates(appType, deviceId = null) {
        const existing = this.getAppsByType(appType, deviceId);
        
        const result = {
            hasDuplicates: existing.length > 0,
            count: existing.length,
            existing: existing,
            recommendation: existing.length > 0 ? 
                'SKIP_DUPLICATE' : 'PROCEED_GENERATION'
        };

        this.log('duplicate_check', 'Duplicate check performed', {
            appType,
            hasDuplicates: result.hasDuplicates,
            existingCount: result.count
        });

        return result;
    }

    /**
     * 統計表示
     */
    showStats() {
        const history = this.loadHistory();
        const deviceId = this.getDeviceId();

        console.log('\n📊 App Generation History Statistics:');
        console.log(`   Total Apps Generated: ${history.totalApps}`);
        console.log(`   Current Device Apps: ${history.deviceStats[deviceId] || 0}`);
        console.log(`   History File: ${this.historyFile}`);
        
        console.log('\n📱 Device Statistics:');
        Object.entries(history.deviceStats).forEach(([device, count]) => {
            const indicator = device === deviceId ? ' (current)' : '';
            console.log(`   ${device}: ${count} apps${indicator}`);
        });

        console.log('\n🎯 App Type Statistics:');
        Object.entries(history.typeStats).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} apps`);
        });

        // 重複検出結果
        const duplicates = history.history.filter(record => record.isDuplicate);
        if (duplicates.length > 0) {
            console.log(`\n⚠️ Duplicate Apps Detected: ${duplicates.length}`);
            duplicates.forEach(dup => {
                console.log(`   ${dup.appId} (${dup.appType}) - duplicate of: ${dup.duplicateOf.join(', ')}`);
            });
        }

        return history;
    }

    /**
     * Worker AI向け重複チェック
     */
    preGenerationCheck(appType, appName = '') {
        const duplicateCheck = this.checkForDuplicates(appType);
        
        const result = {
            shouldProceed: !duplicateCheck.hasDuplicates,
            message: '',
            existingApps: duplicateCheck.existing,
            recommendation: duplicateCheck.recommendation
        };

        if (duplicateCheck.hasDuplicates) {
            result.message = `⚠️ WARNING: ${appType} app already exists on this device!`;
            result.message += `\nExisting: ${duplicateCheck.existing.map(app => app.appId).join(', ')}`;
            result.message += `\nRecommendation: Consider enhancing existing app instead of creating duplicate.`;
        } else {
            result.message = `✅ No duplicates found. Safe to proceed with ${appType} app generation.`;
        }

        console.log(result.message);
        return result;
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
            this.unifiedLogger.log('app-history', action, description, data);
        }

        console.log(`📝 [HISTORY] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const history = new AppGenerationHistory();
    const command = process.argv[2] || 'stats';
    
    switch (command) {
        case 'record':
            const appId = process.argv[3];
            const appType = process.argv[4];
            const appName = process.argv[5] || '';
            
            if (!appId || !appType) {
                console.error('Usage: node app-generation-history.cjs record <appId> <appType> [appName]');
                process.exit(1);
            }
            
            const record = history.recordAppGeneration({
                appId,
                appType,
                appName,
                sessionId: process.env.SESSION_ID || 'manual'
            });
            
            console.log(JSON.stringify(record, null, 2));
            break;
            
        case 'check':
            const checkType = process.argv[3];
            
            if (!checkType) {
                console.error('Usage: node app-generation-history.cjs check <appType>');
                process.exit(1);
            }
            
            const checkResult = history.preGenerationCheck(checkType);
            console.log(JSON.stringify(checkResult, null, 2));
            break;
            
        case 'stats':
            history.showStats();
            break;
            
        case 'list':
            const listType = process.argv[3];
            const apps = listType ? 
                history.getAppsByType(listType) : 
                history.loadHistory().history;
                
            console.log(JSON.stringify(apps, null, 2));
            break;
            
        default:
            console.log('App Generation History Commands:');
            console.log('  record <appId> <appType> [appName]  - Record app generation');
            console.log('  check <appType>                     - Check for duplicates before generation');
            console.log('  stats                               - Show statistics');
            console.log('  list [appType]                      - List apps (optionally by type)');
            console.log('\nExamples:');
            console.log('  node app-generation-history.cjs record app-005-abc123 money "Money Manager"');
            console.log('  node app-generation-history.cjs check money');
    }
}

module.exports = AppGenerationHistory;