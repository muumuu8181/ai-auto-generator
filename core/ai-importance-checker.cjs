#!/usr/bin/env node

/**
 * AI Importance Checker
 * 全AI統一重要度確認ツール（推測回答防止・実行履歴記録）
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AIToolExecutionTracker = require('./ai-tool-execution-tracker.cjs');

class AIImportanceChecker {
    constructor(aiRole = 'unknown') {
        this.aiRole = aiRole;
        this.tracker = new AIToolExecutionTracker();
        this.baseDir = '/mnt/c/Users/user/ai-auto-generator';
    }

    /**
     * メイン実行: 重要度8以上ファイル確認
     */
    async checkImportantFiles() {
        console.log(`🔍 ${this.aiRole} AI: 重要度確認開始`);
        
        return new Promise((resolve, reject) => {
            const command = `find ${this.baseDir} -name "*重要L[8-9]*" -o -name "*超重要L10*"`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    const errorMsg = `❌ 重要度確認エラー: ${error.message}`;
                    console.error(errorMsg);
                    
                    // エラーも記録
                    this.tracker.recordToolExecution(
                        'importance-checker',
                        command,
                        errorMsg,
                        this.aiRole
                    );
                    
                    reject(error);
                    return;
                }

                const files = stdout.trim().split('\n').filter(f => f.length > 0);
                const relativeFiles = files.map(f => f.replace(this.baseDir + '/', './'));
                
                // 実行履歴記録
                const executionId = this.tracker.recordImportanceCheck(this.aiRole, relativeFiles);
                
                // 結果表示
                this.displayResults(relativeFiles, executionId);
                
                // 検証
                const validation = this.validateResults(relativeFiles);
                
                resolve({
                    executionId: executionId,
                    files: relativeFiles,
                    count: relativeFiles.length,
                    validation: validation,
                    mustRead: relativeFiles.filter(f => f.includes('超重要L10')),
                    shouldRead: relativeFiles.filter(f => f.includes('重要L8') || f.includes('重要L9'))
                });
            });
        });
    }

    /**
     * 結果表示
     */
    displayResults(files, executionId) {
        console.log(`\n📋 ${this.aiRole} AI 重要度確認結果 [実行ID: ${executionId}]`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 検出ファイル数: ${files.length}件`);
        
        if (files.length === 0) {
            console.log('❌ 重要度ファイルが見つかりません');
            return;
        }

        // 重要度別分類
        const level10 = files.filter(f => f.includes('超重要L10'));
        const level9 = files.filter(f => f.includes('重要L9'));
        const level8 = files.filter(f => f.includes('重要L8'));

        if (level10.length > 0) {
            console.log(`\n🚨 超重要L10 (${level10.length}件) - 最優先必読:`);
            level10.forEach((file, i) => {
                console.log(`  ${i + 1}. ${file}`);
            });
        }

        if (level9.length > 0) {
            console.log(`\n⚠️ 重要L9 (${level9.length}件) - 高優先読込:`);
            level9.forEach((file, i) => {
                console.log(`  ${i + 1}. ${file}`);
            });
        }

        if (level8.length > 0) {
            console.log(`\n📋 重要L8 (${level8.length}件) - 確認推奨:`);
            level8.forEach((file, i) => {
                console.log(`  ${i + 1}. ${file}`);
            });
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    /**
     * 結果検証
     */
    validateResults(files) {
        const validation = {
            isValid: true,
            warnings: [],
            recommendations: []
        };

        // 必須ファイル確認
        const mustHaveFiles = [
            'SETUP[超重要L10].md',
            'MANAGEMENT_AI_RULES[超重要L10].md'
        ];

        mustHaveFiles.forEach(required => {
            const found = files.some(f => f.includes(required));
            if (!found) {
                validation.isValid = false;
                validation.warnings.push(`必須ファイル未検出: ${required}`);
            }
        });

        // 役割別ファイル確認
        const roleFiles = {
            'manager': 'MANAGER_SETUP[超重要L10].md',
            'worker': 'WORKER_SETUP[超重要L10].md',
            'inspector': 'INSPECTOR_SETUP[超重要L10].md'
        };

        if (roleFiles[this.aiRole.toLowerCase()]) {
            const roleFile = roleFiles[this.aiRole.toLowerCase()];
            const found = files.some(f => f.includes(roleFile));
            if (!found) {
                validation.warnings.push(`役割別ファイル未検出: ${roleFile}`);
            } else {
                validation.recommendations.push(`必読: ${roleFile}`);
            }
        }

        // ファイル数チェック
        if (files.length < 5) {
            validation.warnings.push('重要度ファイル数が少なすぎます（5件未満）');
        }

        return validation;
    }

    /**
     * 確認完了報告生成
     */
    generateCompletionReport() {
        const timestamp = new Date().toISOString();
        return {
            aiRole: this.aiRole,
            timestamp: timestamp,
            confirmationMessage: `私は毎回、重要度が8以上のテキストを確認してから返事をします`,
            toolExecuted: true,
            nextStep: '役割別チェックリスト確認・実際の作業開始'
        };
    }

    /**
     * 事前回答チェック
     */
    async validatePreResponse() {
        const validation = this.tracker.validatePreResponseCheck(this.aiRole);
        
        if (!validation.isValid) {
            console.log(`❌ ${this.aiRole} AI回答前チェック失敗:`);
            console.log(`   ${validation.error}`);
            console.log(`   推奨: ${validation.recommendation}`);
            return false;
        }

        console.log(`✅ ${this.aiRole} AI回答前チェック合格: ${validation.message}`);
        return true;
    }

    /**
     * CLIメイン実行
     */
    static async main() {
        const aiRole = process.argv[2] || 'unknown';
        const command = process.argv[3] || 'check';
        
        const checker = new AIImportanceChecker(aiRole);
        
        try {
            switch (command) {
                case 'check':
                    const result = await checker.checkImportantFiles();
                    const report = checker.generateCompletionReport();
                    
                    console.log(`\n✅ ${aiRole} AI確認完了報告:`);
                    console.log(`   ${report.confirmationMessage}`);
                    console.log(`   次のステップ: ${report.nextStep}\n`);
                    
                    return result;
                    
                case 'validate':
                    const isValid = await checker.validatePreResponse();
                    process.exit(isValid ? 0 : 1);
                    
                default:
                    console.log('AI Importance Checker');
                    console.log('使用法:');
                    console.log('  node ai-importance-checker.cjs <ai-role> check');
                    console.log('  node ai-importance-checker.cjs <ai-role> validate');
                    console.log('');
                    console.log('AI Role: manager, worker, inspector');
            }
        } catch (error) {
            console.error(`❌ ${aiRole} AI重要度確認エラー:`, error.message);
            process.exit(1);
        }
    }
}

// CLI実行
if (require.main === module) {
    AIImportanceChecker.main().catch(console.error);
}

module.exports = AIImportanceChecker;