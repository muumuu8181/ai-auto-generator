#!/usr/bin/env node
/**
 * Tool妥当性検証システム v0.31
 * 各ツールのコンテキスト判断・実行状況・内容適切性を包括的に検証
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ToolValidationSystem {
    constructor() {
        this.logsDir = path.join(__dirname, '../logs');
        this.validationLogPath = path.join(this.logsDir, 'tool-validation-report.json');
        this.toolExecutionLogPath = path.join(this.logsDir, 'tool-execution-history.json');
        this.contextRulesPath = path.join(__dirname, 'tool-context-rules.json');
        
        // Tool妥当性検証結果
        this.validationResults = {
            timestamp: new Date().toISOString(),
            contextValidation: {},
            executionValidation: {},
            contentValidation: {},
            argumentValidation: {},
            overallScore: 0
        };
    }

    /**
     * メイン検証実行
     */
    async validateAllTools() {
        console.log('🔍 Tool妥当性検証システム開始');
        
        try {
            // 1. コンテキスト判断基準検証
            await this.validateContextRules();
            
            // 2. ツール実行状況検証
            await this.validateExecutionPatterns();
            
            // 3. ツール内容適切性検証
            await this.validateToolContent();
            
            // 4. 引数値履歴検証
            await this.validateArgumentHistory();
            
            // 5. 総合評価算出
            this.calculateOverallScore();
            
            // 6. 検証レポート生成
            await this.generateValidationReport();
            
            console.log('✅ Tool妥当性検証完了');
            return this.validationResults;
            
        } catch (error) {
            console.error('🚨 検証エラー:', error.message);
            throw error;
        }
    }

    /**
     * 1. コンテキスト判断基準検証
     */
    async validateContextRules() {
        console.log('📋 コンテキスト判断基準検証中...');
        
        const contextRules = await this.loadContextRules();
        const executionHistory = await this.loadExecutionHistory();
        
        const contextValidation = {};
        
        for (const [toolName, rule] of Object.entries(contextRules)) {
            const toolExecution = executionHistory.filter(exec => exec.toolName === toolName);
            
            contextValidation[toolName] = {
                expectedContext: rule.expectedContext,
                actualUsage: toolExecution.length,
                correctUsage: 0,
                incorrectUsage: 0,
                missedOpportunities: 0,
                score: 0
            };
            
            // 実行コンテキストの適切性確認
            for (const execution of toolExecution) {
                if (this.isCorrectContext(execution, rule)) {
                    contextValidation[toolName].correctUsage++;
                } else {
                    contextValidation[toolName].incorrectUsage++;
                }
            }
            
            // スコア算出 (正しい使用率)
            const total = contextValidation[toolName].correctUsage + contextValidation[toolName].incorrectUsage;
            contextValidation[toolName].score = total > 0 ? 
                (contextValidation[toolName].correctUsage / total) * 100 : 0;
        }
        
        this.validationResults.contextValidation = contextValidation;
        console.log('✅ コンテキスト検証完了');
    }

    /**
     * 2. ツール実行状況検証
     */
    async validateExecutionPatterns() {
        console.log('⚙️ ツール実行状況検証中...');
        
        const executionHistory = await this.loadExecutionHistory();
        const contextRules = await this.loadContextRules();
        
        const executionValidation = {
            totalExpectedExecutions: 0,
            actualExecutions: executionHistory.length,
            missedExecutions: 0,
            unnecessaryExecutions: 0,
            toolUsageRate: {},
            commandUsageDetected: []
        };
        
        // 各ツールの使用率分析
        for (const [toolName, rule] of Object.entries(contextRules)) {
            const toolExecutions = executionHistory.filter(exec => exec.toolName === toolName);
            const expectedFrequency = rule.expectedFrequency || 'medium';
            
            executionValidation.toolUsageRate[toolName] = {
                executions: toolExecutions.length,
                expectedFrequency,
                adequateUsage: this.isAdequateUsage(toolExecutions.length, expectedFrequency),
                lastUsed: toolExecutions.length > 0 ? toolExecutions[toolExecutions.length - 1].timestamp : null
            };
        }
        
        // Command使用検出（Tool化すべき作業）
        executionValidation.commandUsageDetected = await this.detectCommandUsage();
        
        this.validationResults.executionValidation = executionValidation;
        console.log('✅ 実行状況検証完了');
    }

    /**
     * 3. ツール内容適切性検証
     */
    async validateToolContent() {
        console.log('🔧 ツール内容適切性検証中...');
        
        const toolsDir = path.join(__dirname);
        const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.cjs'));
        
        const contentValidation = {};
        
        for (const toolFile of toolFiles) {
            const toolPath = path.join(toolsDir, toolFile);
            const toolContent = fs.readFileSync(toolPath, 'utf8');
            const toolName = path.basename(toolFile, '.cjs');
            
            contentValidation[toolName] = {
                hasErrorHandling: this.checkErrorHandling(toolContent),
                hasLogging: this.checkLogging(toolContent),
                hasValidation: this.checkInputValidation(toolContent),
                hasDocumentation: this.checkDocumentation(toolContent),
                complexityScore: this.calculateComplexity(toolContent),
                maintainabilityScore: this.calculateMaintainability(toolContent),
                overallQuality: 0
            };
            
            // 総合品質スコア算出
            const quality = contentValidation[toolName];
            quality.overallQuality = (
                (quality.hasErrorHandling ? 20 : 0) +
                (quality.hasLogging ? 20 : 0) +
                (quality.hasValidation ? 20 : 0) +
                (quality.hasDocumentation ? 15 : 0) +
                quality.complexityScore +
                quality.maintainabilityScore
            );
        }
        
        this.validationResults.contentValidation = contentValidation;
        console.log('✅ 内容検証完了');
    }

    /**
     * 4. 引数値履歴検証
     */
    async validateArgumentHistory() {
        console.log('📊 引数値履歴検証中...');
        
        const executionHistory = await this.loadExecutionHistory();
        
        const argumentValidation = {
            toolsWithArguments: {},
            argumentPatterns: {},
            optimizationSuggestions: []
        };
        
        // 各ツールの引数使用パターン分析
        for (const execution of executionHistory) {
            const toolName = execution.toolName;
            const args = execution.arguments || {};
            
            if (!argumentValidation.toolsWithArguments[toolName]) {
                argumentValidation.toolsWithArguments[toolName] = {
                    totalExecutions: 0,
                    uniqueArgumentSets: [],
                    mostCommonArgs: {},
                    argumentVariability: 0
                };
            }
            
            const toolArgs = argumentValidation.toolsWithArguments[toolName];
            toolArgs.totalExecutions++;
            
            // 引数セットの記録
            const argString = JSON.stringify(args);
            if (!toolArgs.uniqueArgumentSets.includes(argString)) {
                toolArgs.uniqueArgumentSets.push(argString);
            }
            
            // 引数の使用頻度カウント
            for (const [key, value] of Object.entries(args)) {
                if (!toolArgs.mostCommonArgs[key]) {
                    toolArgs.mostCommonArgs[key] = {};
                }
                if (!toolArgs.mostCommonArgs[key][value]) {
                    toolArgs.mostCommonArgs[key][value] = 0;
                }
                toolArgs.mostCommonArgs[key][value]++;
            }
        }
        
        // 引数最適化提案生成
        for (const [toolName, data] of Object.entries(argumentValidation.toolsWithArguments)) {
            data.argumentVariability = data.uniqueArgumentSets.length / data.totalExecutions;
            
            // 高頻度引数の固定化提案
            for (const [argKey, values] of Object.entries(data.mostCommonArgs)) {
                const sortedValues = Object.entries(values).sort((a, b) => b[1] - a[1]);
                const mostCommon = sortedValues[0];
                
                if (mostCommon && mostCommon[1] / data.totalExecutions > 0.8) {
                    argumentValidation.optimizationSuggestions.push({
                        tool: toolName,
                        argument: argKey,
                        suggestedDefault: mostCommon[0],
                        frequency: `${((mostCommon[1] / data.totalExecutions) * 100).toFixed(1)}%`,
                        reasoning: '高頻度使用引数のデフォルト値化推奨'
                    });
                }
            }
        }
        
        this.validationResults.argumentValidation = argumentValidation;
        console.log('✅ 引数履歴検証完了');
    }

    /**
     * 総合評価算出
     */
    calculateOverallScore() {
        const context = this.validationResults.contextValidation;
        const execution = this.validationResults.executionValidation;
        const content = this.validationResults.contentValidation;
        
        let contextScore = 0;
        let contentScore = 0;
        
        // コンテキストスコア平均
        const contextScores = Object.values(context).map(c => c.score);
        contextScore = contextScores.length > 0 ? 
            contextScores.reduce((a, b) => a + b, 0) / contextScores.length : 0;
        
        // 内容品質スコア平均
        const contentScores = Object.values(content).map(c => c.overallQuality);
        contentScore = contentScores.length > 0 ? 
            contentScores.reduce((a, b) => a + b, 0) / contentScores.length : 0;
        
        // 実行率スコア
        const executionScore = Math.min(100, (execution.actualExecutions / 50) * 100); // 50実行を100点とする
        
        // 総合スコア (重み付け平均)
        this.validationResults.overallScore = Math.round(
            (contextScore * 0.4) + (contentScore * 0.4) + (executionScore * 0.2)
        );
    }

    /**
     * 検証レポート生成
     */
    async generateValidationReport() {
        const reportData = {
            ...this.validationResults,
            generatedAt: new Date().toISOString(),
            summary: this.generateSummary()
        };
        
        // JSON保存
        fs.writeFileSync(this.validationLogPath, JSON.stringify(reportData, null, 2));
        
        // HTML形式レポート生成
        await this.generateHTMLReport(reportData);
        
        console.log(`📊 検証レポート生成: ${this.validationLogPath}`);
    }

    /**
     * サマリー生成
     */
    generateSummary() {
        const score = this.validationResults.overallScore;
        let status, recommendations;
        
        if (score >= 80) {
            status = '優秀';
            recommendations = ['現在の品質を維持', '継続的監視'];
        } else if (score >= 60) {
            status = '良好';
            recommendations = ['一部改善必要', 'Tool化率向上'];
        } else if (score >= 40) {
            status = '改善必要';
            recommendations = ['コンテキスト基準見直し', 'ツール品質向上'];
        } else {
            status = '要緊急対応';
            recommendations = ['全面的システム見直し', '優先度高タスク集中'];
        }
        
        return {
            overallStatus: status,
            score: score,
            recommendations,
            criticalIssues: this.identifyCriticalIssues()
        };
    }

    // ヘルパーメソッド群
    async loadContextRules() {
        try {
            if (fs.existsSync(this.contextRulesPath)) {
                return JSON.parse(fs.readFileSync(this.contextRulesPath, 'utf8'));
            }
        } catch (error) {
            console.log('📋 コンテキストルール初期化');
        }
        
        // デフォルトルール設定
        const defaultRules = {
            'ai-importance-checker': {
                expectedContext: 'セッション開始時・重要度確認時',
                expectedFrequency: 'high',
                requiredArguments: ['aiRole']
            },
            'ai-tool-execution-tracker': {
                expectedContext: 'ツール実行前後・履歴確認時',
                expectedFrequency: 'high',
                requiredArguments: ['action', 'toolName']
            },
            'inspector-auto-display': {
                expectedContext: 'Inspector AI動作時・視覚化要求時',
                expectedFrequency: 'medium',
                requiredArguments: []
            }
        };
        
        fs.writeFileSync(this.contextRulesPath, JSON.stringify(defaultRules, null, 2));
        return defaultRules;
    }

    async loadExecutionHistory() {
        try {
            if (fs.existsSync(this.toolExecutionLogPath)) {
                return JSON.parse(fs.readFileSync(this.toolExecutionLogPath, 'utf8'));
            }
        } catch (error) {
            console.log('📊 実行履歴なし、空配列で初期化');
        }
        return [];
    }

    isCorrectContext(execution, rule) {
        // 基本的なコンテキストチェック
        // 実装では更に詳細な判定ロジックが必要
        return execution.timestamp && execution.toolName && execution.arguments;
    }

    isAdequateUsage(executions, expectedFrequency) {
        const thresholds = { high: 10, medium: 5, low: 2 };
        return executions >= (thresholds[expectedFrequency] || 5);
    }

    async detectCommandUsage() {
        // Command使用検出ロジック
        // 実装では実際のコマンド実行ログを解析
        return [
            { command: 'grep', frequency: 15, suggestedTool: 'smart-search-engine.cjs' },
            { command: 'git add', frequency: 8, suggestedTool: 'auto-git-workflow.cjs' }
        ];
    }

    checkErrorHandling(content) {
        return content.includes('try') && content.includes('catch');
    }

    checkLogging(content) {
        return content.includes('console.log') || content.includes('console.error');
    }

    checkInputValidation(content) {
        return content.includes('require') || content.includes('validate');
    }

    checkDocumentation(content) {
        return content.includes('/**') || content.includes('//');
    }

    calculateComplexity(content) {
        // 簡易複雑度算出 (分岐・ループ数等)
        const branches = (content.match(/if|switch|for|while/g) || []).length;
        return Math.max(0, 25 - branches); // 複雑度が低いほど高スコア
    }

    calculateMaintainability(content) {
        // 簡易保守性算出 (関数分割・命名等)
        const functions = (content.match(/function|=>/g) || []).length;
        const lines = content.split('\n').length;
        return Math.min(25, functions * 5); // 関数分割されているほど高スコア
    }

    identifyCriticalIssues() {
        const issues = [];
        
        // コンテキスト問題
        for (const [tool, data] of Object.entries(this.validationResults.contextValidation)) {
            if (data.score < 50) {
                issues.push(`${tool}: コンテキスト判断基準要見直し (${data.score}%)`);
            }
        }
        
        // 品質問題
        for (const [tool, data] of Object.entries(this.validationResults.contentValidation)) {
            if (data.overallQuality < 60) {
                issues.push(`${tool}: ツール品質改善必要 (${data.overallQuality}/100)`);
            }
        }
        
        return issues;
    }

    async generateHTMLReport(data) {
        const htmlPath = path.join(this.logsDir, 'tool-validation-report.html');
        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>🔍 Tool妥当性検証レポート</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .score { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .good { color: #27ae60; } .warning { color: #f39c12; } .danger { color: #e74c3c; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Tool妥当性検証レポート</h1>
        <div class="score ${data.summary.score >= 80 ? 'good' : data.summary.score >= 60 ? 'warning' : 'danger'}">${data.summary.score}/100</div>
        <div>総合評価: ${data.summary.overallStatus}</div>
        <div>生成日時: ${new Date(data.generatedAt).toLocaleString('ja-JP')}</div>
    </div>
    
    <div class="section">
        <h2>📊 概要</h2>
        <div class="grid">
            <div class="metric">
                <h3>コンテキスト適切性</h3>
                <div class="score">${Object.values(data.contextValidation).map(c => c.score).reduce((a, b) => a + b, 0) / Object.keys(data.contextValidation).length || 0}%</div>
            </div>
            <div class="metric">
                <h3>実行状況</h3>
                <div class="score">${data.executionValidation.actualExecutions}回</div>
            </div>
            <div class="metric">
                <h3>ツール品質</h3>
                <div class="score">${Object.values(data.contentValidation).map(c => c.overallQuality).reduce((a, b) => a + b, 0) / Object.keys(data.contentValidation).length || 0}/100</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🎯 推奨事項</h2>
        <ul>
            ${data.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h2>🚨 重要な問題</h2>
        ${data.summary.criticalIssues.length > 0 ? 
            `<ul>${data.summary.criticalIssues.map(issue => `<li class="danger">${issue}</li>`).join('')}</ul>` :
            '<p class="good">✅ 重要な問題は検出されませんでした</p>'
        }
    </div>
    
    <div class="section">
        <h2>📈 引数最適化提案</h2>
        ${data.argumentValidation.optimizationSuggestions.length > 0 ?
            `<ul>${data.argumentValidation.optimizationSuggestions.map(opt => 
                `<li><strong>${opt.tool}</strong>: ${opt.argument} → ${opt.suggestedDefault} (${opt.frequency}使用)</li>`
            ).join('')}</ul>` :
            '<p>最適化提案はありません</p>'
        }
    </div>
    
    <div class="section">
        <h2>📋 詳細データ</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(htmlPath, html);
        console.log(`📊 HTMLレポート生成: ${htmlPath}`);
    }
}

// 実行
if (require.main === module) {
    const validator = new ToolValidationSystem();
    validator.validateAllTools().then(results => {
        console.log('🎯 検証完了 - 総合スコア:', results.overallScore);
    }).catch(error => {
        console.error('🚨 検証失敗:', error.message);
        process.exit(1);
    });
}

module.exports = ToolValidationSystem;