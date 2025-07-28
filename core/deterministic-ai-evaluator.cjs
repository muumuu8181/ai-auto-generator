#!/usr/bin/env node
/**
 * 決定的AI評価ツール v1.0
 * 毎回必ず同じ結果を出力する完全決定的評価システム
 */

const fs = require('fs');
const path = require('path');

class DeterministicAIEvaluator {
    constructor() {
        this.baseDir = process.cwd();
        this.results = {
            timestamp: new Date().toISOString(),
            managerAI: { passed: 0, total: 0, items: [] },
            workerAI: { passed: 0, total: 0, items: [] },
            inspectorAI: { passed: 0, total: 0, items: [] },
            overallSystem: { passed: 0, total: 0, items: [] }
        };
    }

    /**
     * メイン実行: 全AI決定的評価
     */
    async evaluate() {
        console.log('🔍 決定的AI評価開始');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Manager AI評価
        await this.evaluateManagerAI();
        
        // Worker AI評価
        await this.evaluateWorkerAI();
        
        // Inspector AI評価
        await this.evaluateInspectorAI();
        
        // Overall System評価
        await this.evaluateOverallSystem();
        
        // 結果表示・保存
        this.displayResults();
        this.saveResults();
        
        console.log('✅ 決定的AI評価完了');
        return this.results;
    }

    /**
     * Manager AI評価 (決定的チェックリスト)
     */
    async evaluateManagerAI() {
        console.log('👑 Manager AI評価中...');
        
        const checks = [
            // TODO管理系
            {
                id: 'M001',
                name: 'MANAGER_AI_PERSISTENT_TODO.md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'MANAGER_AI_PERSISTENT_TODO.md'))
            },
            {
                id: 'M002', 
                name: 'VERSION.md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'VERSION.md'))
            },
            {
                id: 'M003',
                name: 'CONTINUOUS_IMPROVEMENT_SYSTEM[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'CONTINUOUS_IMPROVEMENT_SYSTEM[超重要L10].md'))
            },
            
            // 重要度確認系
            {
                id: 'M004',
                name: 'importance-checks.jsonにデータ存在',
                check: () => {
                    const logPath = path.join(this.baseDir, 'logs/importance-checks.json');
                    if (!fs.existsSync(logPath)) return false;
                    try {
                        const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                        return Array.isArray(data) && data.length > 0;
                    } catch { return false; }
                }
            },
            {
                id: 'M005',
                name: 'ai-importance-checker.cjs実行可能',
                check: () => fs.existsSync(path.join(this.baseDir, 'core/ai-importance-checker.cjs'))
            },
            
            // Tool使用系
            {
                id: 'M006',
                name: 'ai-tool-execution-history.jsonにデータ存在',
                check: () => {
                    const logPath = path.join(this.baseDir, 'logs/ai-tool-execution-history.json');
                    if (!fs.existsSync(logPath)) return false;
                    try {
                        const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                        return Array.isArray(data) && data.length > 0;
                    } catch { return false; }
                }
            },
            {
                id: 'M007',
                name: 'ai-tool-execution-tracker.cjs存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'core/ai-tool-execution-tracker.cjs'))
            },
            
            // 戦略・計画系
            {
                id: 'M008',
                name: 'COMMAND_TO_TOOL_CONVERSION_PLAN.md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'COMMAND_TO_TOOL_CONVERSION_PLAN.md'))
            },
            {
                id: 'M009',
                name: 'AI_ROLE_SEPARATION_PRINCIPLES[重要L8].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'AI_ROLE_SEPARATION_PRINCIPLES[重要L8].md'))
            },
            {
                id: 'M010',
                name: 'SETUP[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'SETUP[超重要L10].md'))
            }
        ];

        this.results.managerAI = this.executeChecks('Manager AI', checks);
    }

    /**
     * Worker AI評価 (決定的チェックリスト)
     */
    async evaluateWorkerAI() {
        console.log('🔧 Worker AI評価中...');
        
        const checks = [
            // アプリ開発系
            {
                id: 'W001',
                name: 'temp-deployディレクトリ存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'temp-deploy'))
            },
            {
                id: 'W002',
                name: 'temp-deploy内にアプリが1つ以上存在',
                check: () => {
                    const deployDir = path.join(this.baseDir, 'temp-deploy');
                    if (!fs.existsSync(deployDir)) return false;
                    const apps = fs.readdirSync(deployDir).filter(item => 
                        fs.statSync(path.join(deployDir, item)).isDirectory()
                    );
                    return apps.length > 0;
                }
            },
            {
                id: 'W003',
                name: 'temp-deploy内にアプリが5つ以上存在',
                check: () => {
                    const deployDir = path.join(this.baseDir, 'temp-deploy');
                    if (!fs.existsSync(deployDir)) return false;
                    const apps = fs.readdirSync(deployDir).filter(item => 
                        fs.statSync(path.join(deployDir, item)).isDirectory()
                    );
                    return apps.length >= 5;
                }
            },
            {
                id: 'W004',
                name: 'temp-deploy内にアプリが10つ以上存在',
                check: () => {
                    const deployDir = path.join(this.baseDir, 'temp-deploy');
                    if (!fs.existsSync(deployDir)) return false;
                    const apps = fs.readdirSync(deployDir).filter(item => 
                        fs.statSync(path.join(deployDir, item)).isDirectory()
                    );
                    return apps.length >= 10;
                }
            },
            
            // 品質・学習系
            {
                id: 'W005',
                name: 'WORKER_SETUP[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'WORKER_SETUP[超重要L10].md'))
            },
            {
                id: 'W006',
                name: 'REFLECTION_MISTAKE_SAMPLES[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'REFLECTION_MISTAKE_SAMPLES[超重要L10].md'))
            },
            
            // 作業履歴系
            {
                id: 'W007',
                name: 'ai-work-history.jsonにデータ存在',
                check: () => {
                    const logPath = path.join(this.baseDir, 'logs/ai-work-history.json');
                    if (!fs.existsSync(logPath)) return false;
                    try {
                        const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                        return Array.isArray(data) && data.length > 0;
                    } catch { return false; }
                }
            },
            
            // コマンド・ツール系
            {
                id: 'W008',
                name: '.claude/commands/ディレクトリ存在',
                check: () => fs.existsSync(path.join(this.baseDir, '.claude/commands'))
            }
        ];

        this.results.workerAI = this.executeChecks('Worker AI', checks);
    }

    /**
     * Inspector AI評価 (決定的チェックリスト)
     */
    async evaluateInspectorAI() {
        console.log('👁️ Inspector AI評価中...');
        
        const checks = [
            // 監視・可視化系
            {
                id: 'I001',
                name: 'inspector-visual-dashboard.html存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'logs/inspector-visual-dashboard.html'))
            },
            {
                id: 'I002',
                name: 'inspector-auto-display.cjs存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'core/inspector-auto-display.cjs'))
            },
            {
                id: 'I003',
                name: 'auto-browser-launcher.cjs存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'core/auto-browser-launcher.cjs'))
            },
            
            // 分析・レポート系
            {
                id: 'I004',
                name: 'inspector-rule-sync.json存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'logs/inspector-rule-sync.json'))
            },
            {
                id: 'I005',
                name: 'app-scan-results.json存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'logs/app-scan-results.json'))
            },
            
            // セットアップ系
            {
                id: 'I006',
                name: 'INSPECTOR_SETUP[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'INSPECTOR_SETUP[超重要L10].md'))
            }
        ];

        this.results.inspectorAI = this.executeChecks('Inspector AI', checks);
    }

    /**
     * Overall System評価 (決定的チェックリスト)
     */
    async evaluateOverallSystem() {
        console.log('🤝 Overall System評価中...');
        
        const checks = [
            // 相互監視系
            {
                id: 'O001',
                name: 'AI_MUTUAL_MONITORING_SYSTEM[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'AI_MUTUAL_MONITORING_SYSTEM[超重要L10].md'))
            },
            {
                id: 'O002',
                name: 'MANAGEMENT_AI_RULES[超重要L10].md存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'MANAGEMENT_AI_RULES[超重要L10].md'))
            },
            
            // 統合システム系
            {
                id: 'O003',
                name: 'ai-performance-monitor.cjs存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'core/ai-performance-monitor.cjs'))
            },
            {
                id: 'O004',
                name: 'deterministic-ai-evaluator.cjs存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'core/deterministic-ai-evaluator.cjs'))
            },
            
            // ログ・記録系
            {
                id: 'O005',
                name: 'logsディレクトリ存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'logs'))
            },
            {
                id: 'O006',
                name: 'coreディレクトリ存在',
                check: () => fs.existsSync(path.join(this.baseDir, 'core'))
            }
        ];

        this.results.overallSystem = this.executeChecks('Overall System', checks);
    }

    /**
     * チェック実行（決定的処理）
     */
    executeChecks(aiName, checks) {
        let passed = 0;
        const items = [];

        for (const check of checks) {
            let result = false;
            try {
                result = check.check();
            } catch (error) {
                result = false; // エラー時は必ずfalse
            }

            items.push({
                id: check.id,
                name: check.name,
                result: result,
                status: result ? '✅' : '❌'
            });

            if (result) passed++;
        }

        const total = checks.length;
        const score = total > 0 ? Math.round((passed / total) * 100) : 0;

        console.log(`${aiName}: ${passed}/${total} = ${score}%`);

        return { passed, total, score, items };
    }

    /**
     * 結果表示
     */
    displayResults() {
        console.log('\n📊 決定的AI評価結果');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👑 Manager AI:    ${this.results.managerAI.score}% (${this.results.managerAI.passed}/${this.results.managerAI.total})`);
        console.log(`🔧 Worker AI:     ${this.results.workerAI.score}% (${this.results.workerAI.passed}/${this.results.workerAI.total})`);
        console.log(`👁️  Inspector AI:  ${this.results.inspectorAI.score}% (${this.results.inspectorAI.passed}/${this.results.inspectorAI.total})`);
        console.log(`🤝 Overall System: ${this.results.overallSystem.score}% (${this.results.overallSystem.passed}/${this.results.overallSystem.total})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 詳細結果
        console.log('\n📋 詳細チェック結果:');
        this.displayDetailedResults('👑 Manager AI', this.results.managerAI.items);
        this.displayDetailedResults('🔧 Worker AI', this.results.workerAI.items);
        this.displayDetailedResults('👁️ Inspector AI', this.results.inspectorAI.items);
        this.displayDetailedResults('🤝 Overall System', this.results.overallSystem.items);
    }

    /**
     * 詳細結果表示
     */
    displayDetailedResults(aiName, items) {
        console.log(`\n${aiName}:`);
        for (const item of items) {
            console.log(`  ${item.status} ${item.id}: ${item.name}`);
        }
    }

    /**
     * 結果保存
     */
    saveResults() {
        const logsDir = path.join(this.baseDir, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const resultPath = path.join(logsDir, 'deterministic-ai-evaluation.json');
        fs.writeFileSync(resultPath, JSON.stringify(this.results, null, 2));
        
        console.log(`\n📄 結果保存: ${resultPath}`);
    }
}

// 実行
if (require.main === module) {
    const evaluator = new DeterministicAIEvaluator();
    evaluator.evaluate().then(results => {
        console.log('\n🎯 決定的評価完了');
        console.log('このツールは毎回同じ条件で同じ結果を出力します');
    }).catch(error => {
        console.error('🚨 評価エラー:', error.message);
        process.exit(1);
    });
}

module.exports = DeterministicAIEvaluator;