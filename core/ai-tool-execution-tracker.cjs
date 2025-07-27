#!/usr/bin/env node

/**
 * AI Tool Execution Tracker
 * 全AIのツール実行を記録・追跡し、推測回答を防止するシステム
 */

const fs = require('fs');
const path = require('path');

class AIToolExecutionTracker {
    constructor() {
        this.logFile = '/mnt/c/Users/user/ai-auto-generator/logs/ai-tool-execution-history.json';
        this.sessionFile = '/mnt/c/Users/user/ai-auto-generator/logs/current-session-tools.json';
        this.workHistoryFile = '/mnt/c/Users/user/ai-auto-generator/logs/ai-work-history.json';
    }

    /**
     * ツール実行記録
     */
    recordToolExecution(toolName, command, result, aiRole = 'unknown') {
        const timestamp = new Date().toISOString();
        const executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const execution = {
            id: executionId,
            timestamp: timestamp,
            aiRole: aiRole,
            toolName: toolName,
            command: command,
            result: result,
            resultLength: result.length,
            isSuccess: !result.includes('error') && !result.includes('Error'),
            sessionContext: this.getCurrentSessionContext()
        };

        // 全履歴に記録
        this.appendToHistory(execution);
        
        // セッション履歴に記録
        this.appendToSession(execution);
        
        // ワーク履歴に記録
        this.appendToWorkHistory(execution);

        console.log(`📝 ツール実行記録: ${toolName} by ${aiRole} [ID: ${executionId}]`);
        
        return executionId;
    }

    /**
     * 重要度確認ツール専用記録
     */
    recordImportanceCheck(aiRole, filesList) {
        const result = filesList.join('\n');
        const executionId = this.recordToolExecution(
            'importance-checker',
            'find . -name "*重要L[8-9]*" -o -name "*超重要L10*"',
            result,
            aiRole
        );

        // 重要度確認専用ログ
        const checkLog = {
            executionId: executionId,
            timestamp: new Date().toISOString(),
            aiRole: aiRole,
            filesCount: filesList.length,
            filesList: filesList,
            mustRead: filesList.filter(f => f.includes('超重要L10')),
            sessionCheck: true
        };

        this.saveImportanceCheckLog(checkLog);
        
        console.log(`🔍 重要度確認記録: ${aiRole} → ${filesList.length}件確認 [ID: ${executionId}]`);
        
        return executionId;
    }

    /**
     * AI回答前確認チェック
     */
    validatePreResponseCheck(aiRole) {
        const recentChecks = this.getRecentImportanceChecks(aiRole, 5); // 直近5分以内
        
        if (recentChecks.length === 0) {
            return {
                isValid: false,
                error: '重要度確認ツール未実行',
                recommendation: 'find . -name "*重要L[8-9]*" -o -name "*超重要L10*" を実行してください'
            };
        }

        const latestCheck = recentChecks[0];
        if (latestCheck.filesCount === 0) {
            return {
                isValid: false,
                error: '重要度ファイル未検出',
                recommendation: 'ファイル存在確認とパス確認を行ってください'
            };
        }

        return {
            isValid: true,
            latestCheck: latestCheck,
            message: `✅ 重要度確認済み: ${latestCheck.filesCount}件確認`
        };
    }

    /**
     * セッション中のツール実行サマリー
     */
    getSessionSummary(aiRole = null) {
        const sessionData = this.loadSessionData();
        const filtered = aiRole ? 
            sessionData.filter(exec => exec.aiRole === aiRole) : 
            sessionData;

        const summary = {
            totalExecutions: filtered.length,
            toolTypes: [...new Set(filtered.map(exec => exec.toolName))],
            successRate: filtered.filter(exec => exec.isSuccess).length / filtered.length * 100,
            lastExecution: filtered[filtered.length - 1],
            importanceChecks: filtered.filter(exec => exec.toolName === 'importance-checker').length
        };

        return summary;
    }

    /**
     * ワーク履歴レポート生成
     */
    generateWorkHistoryReport(aiRole) {
        const workHistory = this.loadWorkHistory();
        const roleHistory = workHistory.filter(exec => exec.aiRole === aiRole);
        
        const report = {
            aiRole: aiRole,
            totalSessions: [...new Set(roleHistory.map(exec => exec.sessionContext.sessionId))].length,
            totalTools: roleHistory.length,
            toolBreakdown: this.groupBy(roleHistory, 'toolName'),
            successRate: roleHistory.filter(exec => exec.isSuccess).length / roleHistory.length * 100,
            recentActivity: roleHistory.slice(-10),
            complianceScore: this.calculateComplianceScore(roleHistory)
        };

        return report;
    }

    /**
     * コンプライアンススコア計算
     */
    calculateComplianceScore(executions) {
        const sessions = this.groupBy(executions, 'sessionContext.sessionId');
        let compliantSessions = 0;

        Object.values(sessions).forEach(sessionExecs => {
            const hasImportanceCheck = sessionExecs.some(exec => exec.toolName === 'importance-checker');
            if (hasImportanceCheck) compliantSessions++;
        });

        return {
            score: (compliantSessions / Object.keys(sessions).length * 100) || 0,
            compliantSessions: compliantSessions,
            totalSessions: Object.keys(sessions).length
        };
    }

    /**
     * 推測回答検出・警告
     */
    detectSpeculativeResponse(response, aiRole) {
        const speculativePatterns = [
            '思います', '考えます', 'はずです', 'でしょう',
            '推測', '想定', 'おそらく', 'たぶん', '確認していませんが'
        ];

        const detectedPatterns = speculativePatterns.filter(pattern => 
            response.includes(pattern)
        );

        if (detectedPatterns.length > 0) {
            const warning = {
                timestamp: new Date().toISOString(),
                aiRole: aiRole,
                detectedPatterns: detectedPatterns,
                responseExcerpt: response.substring(0, 200),
                severity: 'HIGH',
                recommendation: '確認ツール実行結果に基づく回答に修正してください'
            };

            this.saveSpeculationWarning(warning);
            
            console.log(`⚠️ 推測回答検出: ${aiRole} → [${detectedPatterns.join(', ')}]`);
            
            return warning;
        }

        return null;
    }

    // ユーティリティメソッド
    getCurrentSessionContext() {
        return {
            sessionId: process.env.SESSION_ID || 'default',
            timestamp: new Date().toISOString(),
            pid: process.pid
        };
    }

    appendToHistory(execution) {
        const history = this.loadHistory();
        history.push(execution);
        
        // 最新1000件のみ保持
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
        
        fs.writeFileSync(this.logFile, JSON.stringify(history, null, 2));
    }

    appendToSession(execution) {
        const session = this.loadSessionData();
        session.push(execution);
        fs.writeFileSync(this.sessionFile, JSON.stringify(session, null, 2));
    }

    appendToWorkHistory(execution) {
        const workHistory = this.loadWorkHistory();
        workHistory.push(execution);
        
        // 最新5000件のみ保持
        if (workHistory.length > 5000) {
            workHistory.splice(0, workHistory.length - 5000);
        }
        
        fs.writeFileSync(this.workHistoryFile, JSON.stringify(workHistory, null, 2));
    }

    saveImportanceCheckLog(checkLog) {
        const checkLogFile = '/mnt/c/Users/user/ai-auto-generator/logs/importance-checks.json';
        const logs = this.loadJSONFile(checkLogFile);
        logs.push(checkLog);
        
        // 最新100件のみ保持
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        fs.writeFileSync(checkLogFile, JSON.stringify(logs, null, 2));
    }

    saveSpeculationWarning(warning) {
        const warningFile = '/mnt/c/Users/user/ai-auto-generator/logs/speculation-warnings.json';
        const warnings = this.loadJSONFile(warningFile);
        warnings.push(warning);
        fs.writeFileSync(warningFile, JSON.stringify(warnings, null, 2));
    }

    getRecentImportanceChecks(aiRole, minutesBack = 5) {
        const checkLogFile = '/mnt/c/Users/user/ai-auto-generator/logs/importance-checks.json';
        const logs = this.loadJSONFile(checkLogFile);
        const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
        
        return logs
            .filter(log => log.aiRole === aiRole)
            .filter(log => new Date(log.timestamp) > cutoff)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    loadHistory() {
        return this.loadJSONFile(this.logFile);
    }

    loadSessionData() {
        return this.loadJSONFile(this.sessionFile);
    }

    loadWorkHistory() {
        return this.loadJSONFile(this.workHistoryFile);
    }

    loadJSONFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.warn(`⚠️ JSONファイル読み込みエラー: ${filePath}`);
        }
        return [];
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const groupKey = key.split('.').reduce((obj, k) => obj && obj[k], item);
            (groups[groupKey] = groups[groupKey] || []).push(item);
            return groups;
        }, {});
    }

    /**
     * CLIメイン実行
     */
    static async main() {
        const tracker = new AIToolExecutionTracker();
        const command = process.argv[2];
        
        switch (command) {
            case 'record':
                const [, , , toolName, aiRole] = process.argv;
                const result = process.argv.slice(5).join(' ');
                tracker.recordToolExecution(toolName, 'CLI', result, aiRole);
                break;
                
            case 'check-importance':
                const [, , , role] = process.argv;
                const files = process.argv.slice(4);
                tracker.recordImportanceCheck(role, files);
                break;
                
            case 'validate':
                const [, , , validateRole] = process.argv;
                const validation = tracker.validatePreResponseCheck(validateRole);
                console.log(JSON.stringify(validation, null, 2));
                break;
                
            case 'summary':
                const [, , , summaryRole] = process.argv;
                const summary = tracker.getSessionSummary(summaryRole);
                console.log(JSON.stringify(summary, null, 2));
                break;
                
            case 'report':
                const [, , , reportRole] = process.argv;
                const report = tracker.generateWorkHistoryReport(reportRole);
                console.log(JSON.stringify(report, null, 2));
                break;
                
            default:
                console.log('AI Tool Execution Tracker');
                console.log('使用法:');
                console.log('  node ai-tool-execution-tracker.cjs record <tool> <ai-role> <result>');
                console.log('  node ai-tool-execution-tracker.cjs check-importance <ai-role> <file1> <file2>...');
                console.log('  node ai-tool-execution-tracker.cjs validate <ai-role>');
                console.log('  node ai-tool-execution-tracker.cjs summary [ai-role]');
                console.log('  node ai-tool-execution-tracker.cjs report <ai-role>');
        }
    }
}

// CLI実行
if (require.main === module) {
    AIToolExecutionTracker.main().catch(console.error);
}

module.exports = AIToolExecutionTracker;