#!/usr/bin/env node

/**
 * Management AI強制自己チェックシステム v1.0
 * 応答前に必ずルール遵守をチェックする強制システム
 */

const fs = require('fs');
const path = require('path');

class ManagementAISelfChecker {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.rulesFile = path.join(this.projectRoot, 'MANAGEMENT_AI_RULES.md');
        this.checkResults = {
            rule1: false,
            rule2: false,
            rule3: false,
            rule4: false,
            rule5: false,
            allPassed: false
        };
    }

    /**
     * 強制チェック実行（応答前必須）
     */
    async enforcePreResponseCheck() {
        console.log('🔍 Management AI強制自己チェック開始...');
        console.log('⚠️ このチェックに失敗すると応答できません');

        // Rule 1: 管理用ルール読み込み確認
        this.checkResults.rule1 = await this.checkRule1();
        
        // Rule 2: Gemini CLI相談実行確認
        this.checkResults.rule2 = await this.checkRule2();
        
        // Rule 3: 統合ログシステム使用確認
        this.checkResults.rule3 = await this.checkRule3();
        
        // Rule 4: ファイル保護確認
        this.checkResults.rule4 = await this.checkRule4();
        
        // Rule 5: バージョン管理確認
        this.checkResults.rule5 = await this.checkRule5();

        this.checkResults.allPassed = Object.values(this.checkResults).slice(0, 5).every(result => result);

        this.displayCheckResults();
        
        if (!this.checkResults.allPassed) {
            console.log('❌ 自己チェック失敗 - 応答を中断します');
            console.log('📋 必要なアクション:');
            this.suggestRequiredActions();
            process.exit(1);
        }

        console.log('✅ 自己チェック完了 - 応答許可');
        return true;
    }

    /**
     * Rule 1: 管理用ルール読み込み確認
     */
    async checkRule1() {
        try {
            if (!fs.existsSync(this.rulesFile)) {
                console.log('❌ Rule 1: MANAGEMENT_AI_RULES.mdが見つかりません');
                return false;
            }

            const rulesContent = fs.readFileSync(this.rulesFile, 'utf8');
            
            // 重要なルールキーワードの確認
            const requiredKeywords = [
                'Rule 2: Gemini CLI相談必須',
                'ツール作成前',
                'アップロード前',
                'mcp__gemini-cli__chat'
            ];

            const missingKeywords = requiredKeywords.filter(
                keyword => !rulesContent.includes(keyword)
            );

            if (missingKeywords.length > 0) {
                console.log(`❌ Rule 1: ルールファイルに必要なキーワードが不足: ${missingKeywords.join(', ')}`);
                return false;
            }

            console.log('✅ Rule 1: 管理用ルール読み込み完了');
            return true;

        } catch (error) {
            console.log(`❌ Rule 1: ルール読み込みエラー: ${error.message}`);
            return false;
        }
    }

    /**
     * Rule 2: Gemini CLI相談実行確認（最重要）
     */
    async checkRule2() {
        try {
            // 最近のGemini CLI使用履歴確認
            const { execSync } = require('child_process');
            
            // Gemini CLIの実行履歴を確認（概念的）
            // 実際の実装では、統合ログからgemini-cli使用履歴を確認
            const logsDir = path.join(this.projectRoot, 'logs');
            
            if (!fs.existsSync(logsDir)) {
                console.log('❌ Rule 2: ログディレクトリが見つかりません');
                return false;
            }

            // 統合ログファイルからGemini CLI使用を確認
            const logFiles = fs.readdirSync(logsDir).filter(f => 
                f.startsWith('unified-') && f.endsWith('.json')
            );

            let geminiUsageFound = false;
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            for (const logFile of logFiles.slice(-5)) { // 最新5ファイルをチェック
                try {
                    const logPath = path.join(logsDir, logFile);
                    const stats = fs.statSync(logPath);
                    
                    if (stats.mtime < oneDayAgo) continue;

                    const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                    
                    if (logData.logs) {
                        const geminiLogs = logData.logs.filter(log => 
                            log.tool === 'mcp__gemini-cli__chat' || 
                            log.action?.includes('gemini') ||
                            log.description?.includes('gemini')
                        );

                        if (geminiLogs.length > 0) {
                            geminiUsageFound = true;
                            break;
                        }
                    }
                } catch (parseError) {
                    // ログ解析エラーは無視して継続
                }
            }

            if (!geminiUsageFound) {
                console.log('❌ Rule 2: 最近24時間以内にGemini CLI相談の記録が見つかりません');
                console.log('⚠️ 新しいツール作成・アップロード前には必ずGemini CLI相談が必要です');
                return false;
            }

            console.log('✅ Rule 2: Gemini CLI相談記録確認済み');
            return true;

        } catch (error) {
            console.log(`❌ Rule 2: Gemini CLI相談確認エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * Rule 3: 統合ログシステム使用確認
     */
    async checkRule3() {
        try {
            const unifiedLoggerPath = path.join(this.projectRoot, 'core', 'unified-logger.cjs');
            
            if (!fs.existsSync(unifiedLoggerPath)) {
                console.log('❌ Rule 3: unified-logger.cjsが見つかりません');
                return false;
            }

            // 統合ログの最近の活動確認
            const logsDir = path.join(this.projectRoot, 'logs');
            if (!fs.existsSync(logsDir)) {
                console.log('❌ Rule 3: logsディレクトリが見つかりません');
                return false;
            }

            const recentLogs = fs.readdirSync(logsDir)
                .filter(f => f.endsWith('.json'))
                .map(f => ({
                    name: f,
                    path: path.join(logsDir, f),
                    mtime: fs.statSync(path.join(logsDir, f)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime)
                .slice(0, 3);

            if (recentLogs.length === 0) {
                console.log('❌ Rule 3: 統合ログファイルが見つかりません');
                return false;
            }

            console.log(`✅ Rule 3: 統合ログシステム確認済み (最新: ${recentLogs[0].name})`);
            return true;

        } catch (error) {
            console.log(`❌ Rule 3: 統合ログ確認エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * Rule 4: ファイル保護確認
     */
    async checkRule4() {
        try {
            const protectionFiles = [
                'VERSION.md',
                'MANAGEMENT_AI_RULES.md',
                '.claude/commands/wk-st.md'
            ];

            for (const file of protectionFiles) {
                const filePath = path.join(this.projectRoot, file);
                if (!fs.existsSync(filePath)) {
                    console.log(`❌ Rule 4: 重要ファイルが見つかりません: ${file}`);
                    return false;
                }
            }

            console.log('✅ Rule 4: ファイル保護確認済み');
            return true;

        } catch (error) {
            console.log(`❌ Rule 4: ファイル保護確認エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * Rule 5: バージョン管理確認
     */
    async checkRule5() {
        try {
            const versionPath = path.join(this.projectRoot, 'VERSION.md');
            
            if (!fs.existsSync(versionPath)) {
                console.log('❌ Rule 5: VERSION.mdが見つかりません');
                return false;
            }

            const versionContent = fs.readFileSync(versionPath, 'utf8');
            const versionMatch = versionContent.match(/## 現在のバージョン: (v[\d.]+)/);
            
            if (!versionMatch) {
                console.log('❌ Rule 5: 現在のバージョン情報が見つかりません');
                return false;
            }

            console.log(`✅ Rule 5: バージョン管理確認済み (${versionMatch[1]})`);
            return true;

        } catch (error) {
            console.log(`❌ Rule 5: バージョン管理確認エラー: ${error.message}`);
            return false;
        }
    }

    /**
     * チェック結果表示
     */
    displayCheckResults() {
        console.log('\n📊 Management AI自己チェック結果:');
        console.log(`   Rule 1 (ルール読み込み): ${this.checkResults.rule1 ? '✅' : '❌'}`);
        console.log(`   Rule 2 (Gemini CLI相談): ${this.checkResults.rule2 ? '✅' : '❌'}`);
        console.log(`   Rule 3 (統合ログ使用): ${this.checkResults.rule3 ? '✅' : '❌'}`);
        console.log(`   Rule 4 (ファイル保護): ${this.checkResults.rule4 ? '✅' : '❌'}`);
        console.log(`   Rule 5 (バージョン管理): ${this.checkResults.rule5 ? '✅' : '❌'}`);
        console.log(`   総合結果: ${this.checkResults.allPassed ? '✅ 合格' : '❌ 不合格'}`);
    }

    /**
     * 必要なアクション提案
     */
    suggestRequiredActions() {
        if (!this.checkResults.rule1) {
            console.log('📋 Rule 1対応: MANAGEMENT_AI_RULES.mdを読み込んでください');
        }
        
        if (!this.checkResults.rule2) {
            console.log('📋 Rule 2対応: mcp__gemini-cli__chatでGemini CLIに相談してください');
            console.log('   例: mcp__gemini-cli__chat "新しいツール開発について相談..."');
        }
        
        if (!this.checkResults.rule3) {
            console.log('📋 Rule 3対応: unified-logger.cjsで統合ログを記録してください');
        }
        
        if (!this.checkResults.rule4) {
            console.log('📋 Rule 4対応: 重要ファイルの存在を確認してください');
        }
        
        if (!this.checkResults.rule5) {
            console.log('📋 Rule 5対応: VERSION.mdを更新してください');
        }
    }

    /**
     * Gemini CLI相談の強制実行
     */
    async forceGeminiConsultation(topic) {
        console.log('🤖 Gemini CLI相談を強制実行します...');
        
        try {
            const { execSync } = require('child_process');
            
            const geminiCommand = `echo "${topic}" | npx @google/gemini-cli -m gemini-2.5-pro`;
            
            const result = execSync(geminiCommand, { 
                encoding: 'utf8',
                cwd: this.projectRoot,
                timeout: 60000
            });

            console.log('✅ Gemini CLI相談完了');
            return result;

        } catch (error) {
            console.log(`❌ Gemini CLI相談失敗: ${error.message}`);
            throw error;
        }
    }
}

// 自動実行（強制チェック）
if (require.main === module) {
    const checker = new ManagementAISelfChecker();
    
    checker.enforcePreResponseCheck()
        .then(passed => {
            if (passed) {
                console.log('🎉 Management AI応答許可');
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ 自己チェックで致命的エラー:', error.message);
            process.exit(1);
        });
}

module.exports = ManagementAISelfChecker;