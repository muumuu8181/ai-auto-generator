#!/usr/bin/env node

/**
 * 連続アプリ生成システム v1.0
 * /wk-st 3 形式で複数アプリを連続生成する機能
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ContinuousAppGenerator {
    constructor(sessionId = 'continuous', useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.projectRoot = path.dirname(__dirname);
        
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

    /**
     * 連続生成実行
     */
    async generateContinuous(targetCount, options = {}) {
        const {
            appType = '',
            baseRequirements = '',
            forceGeneration = false,
            skipDuplicateCheck = false,
            delayBetweenApps = 30000 // 30秒間隔
        } = options;

        console.log(`🚀 連続アプリ生成開始:`);
        console.log(`   目標数: ${targetCount}個`);
        console.log(`   アプリタイプ: ${appType || '任意'}`);
        console.log(`   重複チェック: ${skipDuplicateCheck ? 'スキップ' : '実行'}`);
        console.log(`   生成間隔: ${delayBetweenApps / 1000}秒`);

        // 完了強制システム開始
        const CompletionEnforcer = require('./completion-enforcer.cjs');
        const enforcer = new CompletionEnforcer(this.sessionId);
        enforcer.startContinuousMode(targetCount, appType);

        const results = {
            targetCount,
            startTime: new Date().toISOString(),
            completedApps: [],
            failedApps: [],
            skippedApps: [],
            totalDuration: 0,
            successRate: 0
        };

        this.log('continuous_generation_start', 'Continuous app generation started', {
            targetCount,
            appType,
            sessionId: this.sessionId
        });

        try {
            for (let i = 1; i <= targetCount; i++) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`🔄 アプリ ${i}/${targetCount} 生成開始`);
                console.log(`${'='.repeat(60)}`);

                const appResult = await this.generateSingleApp(i, {
                    appType,
                    baseRequirements,
                    skipDuplicateCheck,
                    isPartOfContinuous: true,
                    continuousIndex: i,
                    totalCount: targetCount
                });

                if (appResult.success) {
                    results.completedApps.push(appResult);
                    console.log(`✅ アプリ ${i}/${targetCount} 完了: ${appResult.appId}`);
                    
                    // 完了強制システムに報告
                    enforcer.completePhase(i, `App ${i} generation completed: ${appResult.appId}`);
                } else if (appResult.skipped) {
                    results.skippedApps.push(appResult);
                    console.log(`⏭️ アプリ ${i}/${targetCount} スキップ: ${appResult.reason}`);
                } else {
                    results.failedApps.push(appResult);
                    console.log(`❌ アプリ ${i}/${targetCount} 失敗: ${appResult.error}`);
                    
                    // 失敗時の対応判定
                    if (!forceGeneration && results.failedApps.length >= 2) {
                        console.log(`🚨 連続失敗検知。生成を中止します。`);
                        break;
                    }
                }

                // 次のアプリまでの待機（最後のアプリは除く）
                if (i < targetCount) {
                    console.log(`⏱️ 次のアプリまで ${delayBetweenApps / 1000}秒 待機...`);
                    await this.delay(delayBetweenApps);
                }
            }

            results.endTime = new Date().toISOString();
            results.totalDuration = new Date(results.endTime) - new Date(results.startTime);
            results.successRate = results.completedApps.length / targetCount;

            // 完了強制システム終了
            enforcer.completeWorkSession(`continuous-${targetCount}`, '', 
                results.successRate >= 0.5 ? 'success' : 'partial_failure');

            this.log('continuous_generation_complete', 'Continuous generation completed', {
                completedCount: results.completedApps.length,
                failedCount: results.failedApps.length,
                successRate: results.successRate
            });

            this.displayFinalResults(results);
            return results;

        } catch (error) {
            console.error('❌ 連続生成でエラーが発生:', error.message);
            
            results.endTime = new Date().toISOString();
            results.error = error.message;
            
            this.log('continuous_generation_error', 'Continuous generation failed', {
                error: error.message,
                completedCount: results.completedApps.length
            });

            return results;
        }
    }

    /**
     * 単一アプリ生成
     */
    async generateSingleApp(index, options = {}) {
        const startTime = new Date();
        const appResult = {
            index,
            startTime: startTime.toISOString(),
            success: false,
            skipped: false,
            appId: null,
            appType: options.appType || 'unknown',
            error: null,
            duration: 0
        };

        try {
            console.log(`📋 要件取得中...`);
            
            // 要件に基づくアプリタイプ決定
            const finalAppType = await this.determineAppType(options);
            appResult.appType = finalAppType;

            // 重複チェック（スキップされていない場合）
            if (!options.skipDuplicateCheck) {
                const duplicateCheck = await this.checkForDuplicates(finalAppType);
                if (duplicateCheck.shouldBlock) {
                    appResult.skipped = true;
                    appResult.reason = duplicateCheck.reason;
                    return appResult;
                }
            }

            // /wk-st コマンド実行
            console.log(`⚡ /wk-st 実行開始...`);
            
            const wkstResult = await this.executeWkstCommand();
            
            if (wkstResult.success) {
                appResult.success = true;
                appResult.appId = wkstResult.appId;
                appResult.deploymentUrl = wkstResult.deploymentUrl;
                appResult.sessionId = wkstResult.sessionId;
            } else {
                appResult.error = wkstResult.error;
            }

        } catch (error) {
            appResult.error = error.message;
        }

        appResult.endTime = new Date().toISOString();
        appResult.duration = new Date() - startTime;

        return appResult;
    }

    /**
     * アプリタイプ決定
     */
    async determineAppType(options) {
        if (options.appType) {
            return options.appType;
        }

        try {
            // 要件ファイルから自動検出
            const reqPath = path.join(this.projectRoot, 'temp-req', 'app-requests.md');
            if (fs.existsSync(reqPath)) {
                const reqContent = fs.readFileSync(reqPath, 'utf8');
                const typeResult = execSync(
                    `node core/app-type-manager.cjs detect "${reqContent.substring(0, 200)}"`,
                    { encoding: 'utf8', cwd: this.projectRoot }
                );
                
                const parsed = JSON.parse(typeResult);
                return parsed.typeId || 'unknown';
            }

            return 'unknown';
        } catch (error) {
            console.warn('⚠️ App type detection failed:', error.message);
            return 'unknown';
        }
    }

    /**
     * 重複チェック
     */
    async checkForDuplicates(appType) {
        try {
            const DuplicateAppDetector = require('./duplicate-app-detector.cjs');
            const detector = new DuplicateAppDetector(this.sessionId);
            
            const checkResult = detector.checkBeforeGeneration({
                appType,
                appName: `Continuous App (${new Date().toISOString()})`,
                requirements: 'Auto-generated continuous app'
            });

            return {
                shouldBlock: !checkResult.canProceed,
                reason: checkResult.message,
                severity: checkResult.severity
            };

        } catch (error) {
            console.warn('⚠️ Duplicate check failed:', error.message);
            return { shouldBlock: false, reason: 'Check failed' };
        }
    }

    /**
     * /wk-st コマンド実行
     */
    async executeWkstCommand() {
        try {
            console.log(`📱 /wk-st コマンド実行中...`);
            
            // claude コマンド経由で /wk-st を実行
            // 注意: この部分は実際の環境に応じて調整が必要
            const command = `cd "${this.projectRoot}" && echo "/wk-st" | timeout 1800 claude --non-interactive || true`;
            
            const output = execSync(command, {
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10, // 10MB
                timeout: 1800000 // 30分
            });

            // アプリIDとデプロイURLを抽出
            const appIdMatch = output.match(/app-(\d{3,8})-([a-z0-9]{6})/);
            const urlMatch = output.match(/https:\/\/[^\s]+\/app-\d+-[a-z0-9]+\//);

            if (appIdMatch) {
                return {
                    success: true,
                    appId: appIdMatch[0],
                    deploymentUrl: urlMatch ? urlMatch[0] : '',
                    output: output.substring(0, 1000) // 最初の1000文字のみ
                };
            } else {
                return {
                    success: false,
                    error: 'App ID not found in output',
                    output: output.substring(0, 1000)
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 結果表示
     */
    displayFinalResults(results) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎉 連続アプリ生成完了`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📊 実行サマリー:`);
        console.log(`   目標数: ${results.targetCount}`);
        console.log(`   成功: ${results.completedApps.length}`);
        console.log(`   失敗: ${results.failedApps.length}`);
        console.log(`   スキップ: ${results.skippedApps.length}`);
        console.log(`   成功率: ${(results.successRate * 100).toFixed(1)}%`);
        console.log(`   総実行時間: ${Math.round(results.totalDuration / (1000 * 60))}分`);

        if (results.completedApps.length > 0) {
            console.log(`\n✅ 成功したアプリ:`);
            results.completedApps.forEach((app, index) => {
                console.log(`   ${index + 1}. ${app.appId} (${app.appType}) - ${Math.round(app.duration / 1000)}秒`);
                if (app.deploymentUrl) {
                    console.log(`      URL: ${app.deploymentUrl}`);
                }
            });
        }

        if (results.failedApps.length > 0) {
            console.log(`\n❌ 失敗したアプリ:`);
            results.failedApps.forEach((app, index) => {
                console.log(`   ${index + 1}. Index ${app.index} (${app.appType}) - ${app.error}`);
            });
        }

        if (results.skippedApps.length > 0) {
            console.log(`\n⏭️ スキップしたアプリ:`);
            results.skippedApps.forEach((app, index) => {
                console.log(`   ${index + 1}. Index ${app.index} (${app.appType}) - ${app.reason}`);
            });
        }

        console.log(`\n📈 パフォーマンス分析:`);
        if (results.completedApps.length > 0) {
            const avgDuration = results.completedApps.reduce((sum, app) => sum + app.duration, 0) / results.completedApps.length;
            console.log(`   平均生成時間: ${Math.round(avgDuration / 1000)}秒/アプリ`);
        }
        
        console.log(`${'='.repeat(80)}`);
    }

    /**
     * 待機関数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            this.unifiedLogger.log('continuous-generator', action, description, data);
        }

        console.log(`🔄 [CONTINUOUS] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const generator = new ContinuousAppGenerator();
    const count = parseInt(process.argv[2]) || 1;
    const appType = process.argv[3] || '';
    const forceGeneration = process.argv[4] === 'true';
    const skipDuplicateCheck = process.argv[5] === 'true';

    if (count < 1 || count > 10) {
        console.error('Error: Count must be between 1 and 10');
        console.log('\nUsage: node continuous-app-generator.cjs <count> [appType] [force] [skipDuplicates]');
        console.log('\nExamples:');
        console.log('  node continuous-app-generator.cjs 3');
        console.log('  node continuous-app-generator.cjs 5 money');
        console.log('  node continuous-app-generator.cjs 2 calculator true true');
        process.exit(1);
    }

    console.log(`🚀 Starting continuous generation of ${count} apps...`);
    if (appType) console.log(`   App type: ${appType}`);
    if (forceGeneration) console.log(`   Force generation: enabled`);
    if (skipDuplicateCheck) console.log(`   Skip duplicate check: enabled`);

    generator.generateContinuous(count, {
        appType,
        forceGeneration,
        skipDuplicateCheck
    }).then(results => {
        console.log('\n📊 Final Results:');
        console.log(`Success rate: ${(results.successRate * 100).toFixed(1)}%`);
        console.log(`Completed: ${results.completedApps.length}/${results.targetCount}`);
        
        process.exit(results.successRate >= 0.5 ? 0 : 1);
    }).catch(error => {
        console.error('❌ Continuous generation failed:', error.message);
        process.exit(1);
    });
}

module.exports = ContinuousAppGenerator;