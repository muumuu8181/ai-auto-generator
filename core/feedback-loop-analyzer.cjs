#!/usr/bin/env node

/**
 * フィードバックループ分析システム v1.0  
 * MapReduce方式でGemini CLIを使用してパターン分析・改善ルール生成
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FeedbackLoopAnalyzer {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.mapResults = [];
        this.reduceResults = null;
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger(sessionId);
            } catch (error) {
                console.warn('⚠️ Unified logging not available, falling back to standalone mode');
                this.useUnifiedLogging = false;
            }
        }
        
        this.log('analyzer_start', 'Feedback loop analyzer initialized', { sessionId });
    }
    
    /**
     * MapReduce分析の実行
     */
    async analyzeCollectedData(jsonlFilePath, options = {}) {
        const {
            maxProjects = 20,
            mapBatchSize = 1,
            geminiModel = 'gemini-2.5-pro',
            outputDir = './feedback-analysis'
        } = options;
        
        try {
            this.log('analysis_start', 'Starting MapReduce analysis', {
                jsonlFilePath,
                maxProjects,
                mapBatchSize,
                geminiModel
            });
            
            // 出力ディレクトリ作成
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // 1. データ読み込み
            const projects = this.loadProjectData(jsonlFilePath, maxProjects);
            
            if (projects.length === 0) {
                throw new Error('No project data found');
            }
            
            this.log('data_loaded', `Loaded ${projects.length} projects`, {
                projectIds: projects.map(p => p.projectId)
            });
            
            // 2. Mapフェーズ（個別プロジェクト分析）
            this.mapResults = await this.executeMapPhase(projects, {
                batchSize: mapBatchSize,
                geminiModel,
                outputDir
            });
            
            // 3. Reduceフェーズ（統合分析・ルール生成）
            this.reduceResults = await this.executeReducePhase(this.mapResults, {
                geminiModel,
                outputDir
            });
            
            // 4. Worker AI向け改善ルール生成
            const workerRules = await this.generateWorkerRules(this.reduceResults, {
                geminiModel,
                outputDir
            });
            
            // 5. 結果保存
            const finalResults = {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                inputProjects: projects.length,
                mapResults: this.mapResults.length,
                reduceResults: this.reduceResults,
                workerRules,
                outputFiles: {
                    mapResults: path.join(outputDir, 'map-results.json'),
                    reduceResults: path.join(outputDir, 'reduce-results.json'),
                    workerRules: path.join(outputDir, 'worker-improvement-rules.md'),
                    fullReport: path.join(outputDir, 'analysis-report.json')
                }
            };
            
            await this.saveResults(finalResults, outputDir);
            
            this.log('analysis_complete', 'MapReduce analysis completed', {
                inputProjects: projects.length,
                mapResults: this.mapResults.length,
                rulesGenerated: workerRules.rules?.length || 0,
                outputDir
            });
            
            return finalResults;
            
        } catch (error) {
            this.log('analysis_error', 'Analysis failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * JSONLファイルからプロジェクトデータ読み込み
     */
    loadProjectData(jsonlFilePath, maxProjects) {
        try {
            const content = fs.readFileSync(jsonlFilePath, 'utf8');
            const lines = content.trim().split('\n');
            
            const projects = lines
                .slice(0, maxProjects)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (parseError) {
                        console.warn(`⚠️ Failed to parse line: ${line.substring(0, 100)}...`);
                        return null;
                    }
                })
                .filter(project => project !== null);
            
            return projects;
            
        } catch (error) {
            throw new Error(`Failed to load project data: ${error.message}`);
        }
    }
    
    /**
     * Mapフェーズ：個別プロジェクト分析
     */
    async executeMapPhase(projects, options) {
        const { batchSize, geminiModel, outputDir } = options;
        const mapResults = [];
        
        this.log('map_phase_start', `Starting Map phase for ${projects.length} projects`, {
            batchSize,
            geminiModel
        });
        
        for (let i = 0; i < projects.length; i += batchSize) {
            const batch = projects.slice(i, i + batchSize);
            
            for (const project of batch) {
                try {
                    const mapResult = await this.analyzeProject(project, geminiModel);
                    mapResults.push(mapResult);
                    
                    this.log('project_analyzed', `Project ${project.projectId} analyzed`, {
                        projectId: project.projectId,
                        successFactors: mapResult.successFactors?.length || 0,
                        failureReasons: mapResult.failureReasons?.length || 0,
                        improvements: mapResult.improvements?.length || 0
                    });
                    
                    // API制限対策（1秒待機）
                    await this.delay(1000);
                    
                } catch (projectError) {
                    this.log('project_analysis_error', `Failed to analyze project ${project.projectId}`, {
                        projectId: project.projectId,
                        error: projectError.message
                    });
                    
                    // エラーでも続行（パーシャル分析）
                    mapResults.push({
                        projectId: project.projectId,
                        error: projectError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        
        // Map結果保存
        const mapOutputPath = path.join(outputDir, 'map-results.json');
        fs.writeFileSync(mapOutputPath, JSON.stringify(mapResults, null, 2));
        
        this.log('map_phase_complete', `Map phase completed`, {
            totalResults: mapResults.length,
            successfulAnalyses: mapResults.filter(r => !r.error).length,
            failedAnalyses: mapResults.filter(r => r.error).length
        });
        
        return mapResults;
    }
    
    /**
     * 個別プロジェクト分析
     */
    async analyzeProject(project, geminiModel) {
        // プロジェクトデータを分析用形式に整形
        const analysisInput = this.prepareProjectForAnalysis(project);
        
        // Gemini分析プロンプト作成
        const prompt = this.createProjectAnalysisPrompt(analysisInput);
        
        // Gemini CLI実行
        const geminiResult = await this.callGeminiCli(prompt, geminiModel);
        
        // 結果パース
        return this.parseProjectAnalysisResult(geminiResult, project.projectId);
    }
    
    /**
     * プロジェクトデータ分析用整形
     */
    prepareProjectForAnalysis(project) {
        const analysis = {
            projectId: project.projectId,
            techStack: project.metadata?.techStack || [],
            fileCount: project.metadata?.fileCount || 0,
            projectSize: project.metadata?.totalSize || 0,
            files: {}
        };
        
        // 重要ファイルのみ抽出
        const importantFiles = ['reflection.md', 'work_log.md', 'gemini-feedback.txt'];
        
        importantFiles.forEach(fileType => {
            if (project.files[fileType]?.content) {
                // 内容を3000文字に制限
                let content = project.files[fileType].content;
                if (content.length > 3000) {
                    content = content.substring(0, 3000) + '\n[... content truncated for analysis ...]';
                }
                analysis.files[fileType] = content;
            }
        });
        
        return analysis;
    }
    
    /**
     * プロジェクト分析プロンプト作成
     */
    createProjectAnalysisPrompt(analysisInput) {
        return `あなたは経験豊富なソフトウェアアーキテクトです。以下のAI生成プロジェクトを分析し、成功要因、失敗原因、具体的な改善提案をJSON形式で抽出してください。

## 分析対象プロジェクト
プロジェクトID: ${analysisInput.projectId}
技術スタック: ${analysisInput.techStack.join(', ')}
ファイル数: ${analysisInput.fileCount}
プロジェクトサイズ: ${Math.round(analysisInput.projectSize / 1024)}KB

## プロジェクトファイル
${Object.entries(analysisInput.files).map(([fileType, content]) => 
    `### ${fileType}\n${content}\n`
).join('\n')}

## 分析指示
以下の思考プロセスに従って分析してください：

1. まず、プロジェクトの全体的な品質を評価
2. reflection.mdとwork_log.mdから実際の作業プロセスを理解
3. gemini-feedback.txtがある場合は、過去の改善提案も考慮
4. 技術スタックと実装の適合性を評価
5. 具体的で実行可能な改善案を提案

## 出力形式（必ずJSON形式で出力）
\`\`\`json
{
  "projectId": "${analysisInput.projectId}",
  "qualityScore": 75,
  "successFactors": [
    "明確な要件定義があった",
    "適切な技術スタック選択"
  ],
  "failureReasons": [
    "エラーハンドリングが不十分",
    "テストが不足"
  ],
  "improvements": [
    {
      "category": "code_quality",
      "priority": "high",
      "suggestion": "エラーハンドリングの強化",
      "implementation": "try-catch文の追加とユーザーフレンドリーなエラーメッセージ",
      "techStack": ["JavaScript", "React"]
    }
  ],
  "patterns": [
    "React使用時にstate管理が複雑化する傾向",
    "CSS設計でレスポンシブ対応が後回しになる"
  ]
}
\`\`\``;
    }
    
    /**
     * Gemini CLI呼び出し
     */
    async callGeminiCli(prompt, model) {
        try {
            // プロンプトを一時ファイルに保存（文字エスケープ問題回避）
            const tempPromptFile = path.join(__dirname, `../logs/temp-prompt-${Date.now()}.txt`);
            fs.writeFileSync(tempPromptFile, prompt, 'utf8');
            
            // Gemini CLI実行
            const command = `npx @google/gemini-cli -m ${model} -p "$(cat ${tempPromptFile})"`;
            const result = execSync(command, { 
                encoding: 'utf8',
                timeout: 30000, // 30秒タイムアウト
                maxBuffer: 1024 * 1024 // 1MB バッファ
            });
            
            // 一時ファイル削除
            try {
                fs.unlinkSync(tempPromptFile);
            } catch (cleanupError) {
                console.warn('⚠️ Failed to cleanup temp file:', cleanupError.message);
            }
            
            return result.trim();
            
        } catch (error) {
            throw new Error(`Gemini CLI execution failed: ${error.message}`);
        }
    }
    
    /**
     * プロジェクト分析結果パース
     */
    parseProjectAnalysisResult(geminiResult, projectId) {
        try {
            // JSON部分を抽出
            const jsonMatch = geminiResult.match(/```json\n([\s\S]*?)\n```/);
            
            if (!jsonMatch) {
                // JSONブロックがない場合は全体をJSONとしてパース試行
                return JSON.parse(geminiResult);
            }
            
            const jsonContent = jsonMatch[1];
            const parsed = JSON.parse(jsonContent);
            
            // 必須フィールドの検証
            if (!parsed.projectId) parsed.projectId = projectId;
            if (!parsed.successFactors) parsed.successFactors = [];
            if (!parsed.failureReasons) parsed.failureReasons = [];
            if (!parsed.improvements) parsed.improvements = [];
            if (!parsed.patterns) parsed.patterns = [];
            
            parsed.timestamp = new Date().toISOString();
            
            return parsed;
            
        } catch (parseError) {
            console.warn(`⚠️ Failed to parse Gemini result for ${projectId}:`, parseError.message);
            
            // フォールバック結果
            return {
                projectId,
                error: parseError.message,
                rawResult: geminiResult.substring(0, 500),
                timestamp: new Date().toISOString(),
                successFactors: [],
                failureReasons: [],
                improvements: [],
                patterns: []
            };
        }
    }
    
    /**
     * Reduceフェーズ：統合分析
     */
    async executeReducePhase(mapResults, options) {
        const { geminiModel, outputDir } = options;
        
        this.log('reduce_phase_start', 'Starting Reduce phase', {
            inputMapResults: mapResults.length,
            geminiModel
        });
        
        // 成功したMap結果のみ使用
        const validMapResults = mapResults.filter(result => !result.error);
        
        if (validMapResults.length === 0) {
            throw new Error('No valid map results for reduce phase');
        }
        
        // Reduce分析用データ準備
        const reduceInput = this.prepareReduceInput(validMapResults);
        
        // Reduce分析プロンプト作成
        const prompt = this.createReduceAnalysisPrompt(reduceInput);
        
        // Gemini CLI実行
        const geminiResult = await this.callGeminiCli(prompt, geminiModel);
        
        // 結果パース
        const reduceResults = this.parseReduceAnalysisResult(geminiResult);
        
        // Reduce結果保存
        const reduceOutputPath = path.join(outputDir, 'reduce-results.json');
        fs.writeFileSync(reduceOutputPath, JSON.stringify(reduceResults, null, 2));
        
        this.log('reduce_phase_complete', 'Reduce phase completed', {
            commonPatterns: reduceResults.commonPatterns?.length || 0,
            priorityImprovements: reduceResults.priorityImprovements?.length || 0
        });
        
        return reduceResults;
    }
    
    /**
     * Reduce分析用データ準備
     */
    prepareReduceInput(mapResults) {
        const reduce = {
            totalProjects: mapResults.length,
            allSuccessFactors: [],
            allFailureReasons: [],
            allImprovements: [],
            allPatterns: [],
            techStackDistribution: {},
            qualityScoreDistribution: []
        };
        
        mapResults.forEach(result => {
            reduce.allSuccessFactors.push(...(result.successFactors || []));
            reduce.allFailureReasons.push(...(result.failureReasons || []));
            reduce.allImprovements.push(...(result.improvements || []));
            reduce.allPatterns.push(...(result.patterns || []));
            
            if (result.qualityScore) {
                reduce.qualityScoreDistribution.push(result.qualityScore);
            }
        });
        
        return reduce;
    }
    
    /**
     * Reduce分析プロンプト作成
     */
    createReduceAnalysisPrompt(reduceInput) {
        // データサイズを制限（3000文字以内）
        const limitedData = {
            totalProjects: reduceInput.totalProjects,
            successFactors: reduceInput.allSuccessFactors.slice(0, 30),
            failureReasons: reduceInput.allFailureReasons.slice(0, 30),
            improvements: reduceInput.allImprovements.slice(0, 20),
            patterns: reduceInput.allPatterns.slice(0, 20),
            avgQualityScore: reduceInput.qualityScoreDistribution.length > 0 
                ? Math.round(reduceInput.qualityScoreDistribution.reduce((a, b) => a + b, 0) / reduceInput.qualityScoreDistribution.length)
                : null
        };
        
        return `あなたは上級ソフトウェアアーキテクトです。${limitedData.totalProjects}個のAI生成プロジェクトの分析結果を統合し、共通パターンと普遍的な改善ルールを特定してください。

## 集約されたプロジェクト分析データ
総プロジェクト数: ${limitedData.totalProjects}
平均品質スコア: ${limitedData.avgQualityScore || 'N/A'}

### 成功要因（頻出上位30）
${limitedData.successFactors.map((factor, i) => `${i+1}. ${factor}`).join('\n')}

### 失敗原因（頻出上位30）
${limitedData.failureReasons.map((reason, i) => `${i+1}. ${reason}`).join('\n')}

### 改善提案（上位20）
${limitedData.improvements.map((imp, i) => `${i+1}. [${imp.category}] ${imp.suggestion}`).join('\n')}

### パターン（上位20）
${limitedData.patterns.map((pattern, i) => `${i+1}. ${pattern}`).join('\n')}

## 分析指示
以下の思考プロセスに従って統合分析してください：

1. まず、成功要因と失敗原因の頻度を分析し、最も重要な要素を特定
2. 改善提案から実装可能で効果的なものを優先度付け
3. パターンから技術スタック別の傾向を抽出
4. 次回のWorker AIが従うべき普遍的なルールを策定
5. 具体的で測定可能な品質指標を定義

## 出力形式（必ずJSON形式で出力）
\`\`\`json
{
  "analysisTimestamp": "${new Date().toISOString()}",
  "inputProjects": ${limitedData.totalProjects},
  "commonPatterns": [
    {
      "pattern": "React使用時にstate管理が複雑化する",
      "frequency": 15,
      "severity": "medium",
      "techStack": ["React", "JavaScript"]
    }
  ],
  "priorityImprovements": [
    {
      "rank": 1,
      "category": "error_handling",
      "improvement": "try-catch文の統一的な実装",
      "impact": "high",
      "effort": "low",
      "applicability": ["JavaScript", "TypeScript", "Python"]
    }
  ],
  "qualityMetrics": {
    "averageScore": ${limitedData.avgQualityScore || 0},
    "successRate": 0.85,
    "commonFailurePoints": ["エラーハンドリング", "テスト不足", "ドキュメント不備"]
  },
  "universalRules": [
    {
      "ruleId": "error-handling-001",
      "title": "必須エラーハンドリング",
      "description": "全ての非同期処理にtry-catch文を実装する",
      "priority": "high",
      "checkpoints": ["API呼び出し", "ファイル操作", "ユーザー入力処理"]
    }
  ]
}
\`\`\``;
    }
    
    /**
     * Reduce分析結果パース
     */
    parseReduceAnalysisResult(geminiResult) {
        try {
            const jsonMatch = geminiResult.match(/```json\n([\s\S]*?)\n```/);
            
            if (!jsonMatch) {
                return JSON.parse(geminiResult);
            }
            
            const jsonContent = jsonMatch[1];
            const parsed = JSON.parse(jsonContent);
            
            // 必須フィールドの検証
            if (!parsed.commonPatterns) parsed.commonPatterns = [];
            if (!parsed.priorityImprovements) parsed.priorityImprovements = [];
            if (!parsed.universalRules) parsed.universalRules = [];
            if (!parsed.qualityMetrics) parsed.qualityMetrics = {};
            
            return parsed;
            
        } catch (parseError) {
            console.warn('⚠️ Failed to parse Reduce result:', parseError.message);
            
            return {
                error: parseError.message,
                rawResult: geminiResult.substring(0, 1000),
                timestamp: new Date().toISOString(),
                commonPatterns: [],
                priorityImprovements: [],
                universalRules: [],
                qualityMetrics: {}
            };
        }
    }
    
    /**
     * Worker AI向け改善ルール生成
     */
    async generateWorkerRules(reduceResults, options) {
        const { geminiModel, outputDir } = options;
        
        this.log('rules_generation_start', 'Generating Worker AI improvement rules');
        
        // ルール生成プロンプト作成
        const prompt = this.createRulesGenerationPrompt(reduceResults);
        
        // Gemini CLI実行
        const geminiResult = await this.callGeminiCli(prompt, geminiModel);
        
        // Worker向けMarkdownファイル生成
        const rulesMarkdown = this.generateRulesMarkdown(geminiResult, reduceResults);
        
        // ファイル保存
        const rulesPath = path.join(outputDir, 'worker-improvement-rules.md');
        fs.writeFileSync(rulesPath, rulesMarkdown, 'utf8');
        
        const rulesData = {
            timestamp: new Date().toISOString(),
            source: 'feedback_loop_analysis',
            rules: this.extractRulesFromMarkdown(rulesMarkdown),
            filePath: rulesPath
        };
        
        this.log('rules_generation_complete', 'Worker AI rules generated', {
            rulesCount: rulesData.rules.length,
            filePath: rulesPath
        });
        
        return rulesData;
    }
    
    /**
     * ルール生成プロンプト作成
     */
    createRulesGenerationPrompt(reduceResults) {
        return `あなたはAIワークフロー設計のエキスパートです。プロジェクト分析結果に基づいて、Worker AI（アプリ生成AI）が従うべき具体的で実行可能な改善ルールを作成してください。

## 分析結果サマリー
共通パターン数: ${reduceResults.commonPatterns?.length || 0}
優先改善事項数: ${reduceResults.priorityImprovements?.length || 0}
普遍的ルール数: ${reduceResults.universalRules?.length || 0}

## 主要改善事項
${(reduceResults.priorityImprovements || []).slice(0, 10).map((imp, i) => 
    `${i+1}. [${imp.category}] ${imp.improvement} (影響度: ${imp.impact})`
).join('\n')}

## 普遍的ルール
${(reduceResults.universalRules || []).map((rule, i) => 
    `${i+1}. ${rule.title}: ${rule.description}`
).join('\n')}

## ルール作成指示
以下の要件に従って、Worker AI向けの改善ルールを作成してください：

1. **具体性**: 「コードを綺麗に」ではなく「try-catch文を必ず実装」のような具体的な指示
2. **実行可能性**: Worker AIが実際に従える形の指示
3. **技術スタック対応**: React、Vue、Vanilla JSなど技術別の指示
4. **優先度明示**: High/Medium/Lowの優先度を明記
5. **チェックポイント**: 実装確認用のチェックリスト付き

## 出力形式
Markdown形式で、Worker AIが読みやすい形で出力してください。以下の構造を参考に：

# Worker AI改善ルール（自動生成）

## 🔴 High Priority Rules

### Rule 1: エラーハンドリング必須化
- **適用技術**: JavaScript, TypeScript, Python
- **必須実装**: try-catch文をすべての非同期処理に追加
- **チェックポイント**: 
  - [ ] API呼び出しにtry-catch
  - [ ] ファイル操作にtry-catch
  - [ ] ユーザー入力処理にtry-catch

(続く...)`;
    }
    
    /**
     * ルールMarkdown生成
     */
    generateRulesMarkdown(geminiResult, reduceResults) {
        const header = `# Worker AI改善ルール（自動生成）

**生成日時**: ${new Date().toLocaleString('ja-JP')}  
**分析対象**: ${reduceResults.inputProjects || 0}プロジェクト  
**品質スコア平均**: ${reduceResults.qualityMetrics?.averageScore || 'N/A'}  
**生成元**: フィードバックループ分析システム

---

`;
        
        const footer = `

---

## 📊 分析統計

- **分析プロジェクト数**: ${reduceResults.inputProjects || 0}
- **検出パターン数**: ${reduceResults.commonPatterns?.length || 0}
- **改善提案数**: ${reduceResults.priorityImprovements?.length || 0}
- **生成ルール数**: ${reduceResults.universalRules?.length || 0}

## 🔄 更新履歴

この改善ルールは、Worker AIの実績データから自動生成されています。
新しいプロジェクトの蓄積により定期的に更新されます。

**次回更新予定**: プロジェクト数が20個増加時、または重大なパターン変化検出時

---

*自動生成システム: AI Auto Generator v0.10 - Feedback Loop Analyzer*`;
        
        return header + geminiResult + footer;
    }
    
    /**
     * Markdownからルール抽出
     */
    extractRulesFromMarkdown(markdown) {
        const rules = [];
        
        // ### Rule で始まる行を検索
        const ruleMatches = markdown.match(/### Rule \d+: (.+)/g);
        
        if (ruleMatches) {
            ruleMatches.forEach((match, index) => {
                const title = match.replace(/### Rule \d+: /, '');
                rules.push({
                    id: `rule_${index + 1}`,
                    title,
                    order: index + 1
                });
            });
        }
        
        return rules;
    }
    
    /**
     * 結果保存
     */
    async saveResults(results, outputDir) {
        const reportPath = path.join(outputDir, 'analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        
        // 各種ファイル保存
        Object.entries(results.outputFiles).forEach(([key, filePath]) => {
            if (key === 'mapResults' && this.mapResults) {
                fs.writeFileSync(filePath, JSON.stringify(this.mapResults, null, 2));
            }
        });
        
        this.log('results_saved', 'Analysis results saved', {
            reportPath,
            outputFiles: Object.keys(results.outputFiles).length
        });
    }
    
    /**
     * 待機ユーティリティ
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
        
        // 統合ログに記録
        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('feedback-analyzer', action, description, data);
        }
        
        console.log(`🔍 [ANALYZER] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const analyzer = new FeedbackLoopAnalyzer('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'analyze':
            const jsonlFile = process.argv[3];
            const outputDir = process.argv[4] || './feedback-analysis';
            const maxProjects = parseInt(process.argv[5]) || 20;
            
            if (!jsonlFile) {
                console.error('Usage: node feedback-loop-analyzer.cjs analyze <jsonl-file> [output-dir] [max-projects]');
                process.exit(1);
            }
            
            analyzer.analyzeCollectedData(jsonlFile, {
                maxProjects,
                outputDir
            }).then(results => {
                console.log('✅ Analysis completed successfully');
                console.log(`📊 Analyzed ${results.inputProjects} projects`);
                console.log(`📋 Generated ${results.workerRules.rules?.length || 0} improvement rules`);
                console.log(`💾 Results saved to: ${outputDir}`);
                console.log(`📝 Worker rules: ${results.outputFiles.workerRules}`);
            }).catch(error => {
                console.error('❌ Analysis failed:', error.message);
                process.exit(1);
            });
            break;
            
        default:
            console.log('Feedback Loop Analyzer Commands:');
            console.log('  analyze <jsonl-file> [output-dir] [max-projects]  - Analyze collected feedback data');
            console.log('\nExample:');
            console.log('  node feedback-loop-analyzer.cjs analyze collected_feedback.jsonl ./analysis 15');
            console.log('\nOutput:');
            console.log('  - map-results.json       (individual project analyses)');
            console.log('  - reduce-results.json    (aggregated patterns)');
            console.log('  - worker-improvement-rules.md  (actionable rules for Worker AI)');
            console.log('  - analysis-report.json   (complete analysis report)');
    }
}

module.exports = FeedbackLoopAnalyzer;