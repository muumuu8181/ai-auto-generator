#!/usr/bin/env node

/**
 * Worker AI評価システム v1.0
 * Worker AIの成果物を多角的に評価し、品質スコア・完成度を算出
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class WorkerEvaluationSystem {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.evaluationResults = [];
        
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
        
        // 評価基準定義
        this.evaluationCriteria = this.initializeEvaluationCriteria();
        
        this.log('evaluation_start', 'Worker evaluation system initialized', { sessionId });
    }
    
    /**
     * 評価基準初期化
     */
    initializeEvaluationCriteria() {
        return {
            // 必須ファイルセット
            mandatoryFiles: {
                // 4点セット + Gemini分析
                core: ['reflection.md', 'requirements.md', 'work_log.md', 'session-log.json', 'gemini-feedback.txt'],
                // アプリファイル（動的に決定）
                app: ['index.html'] // 最低限、他は技術スタック別
            },
            
            // 技術スタック別期待ファイル
            techStackExpectations: {
                'JavaScript': ['script.js', 'index.html'],
                'React': ['src/App.js', 'src/index.js', 'public/index.html'],
                'Vue.js': ['src/App.vue', 'src/main.js', 'public/index.html'],
                'Python': ['main.py', 'requirements.txt'],
                'CSS': ['style.css', 'styles.css'],
                'TypeScript': ['script.ts', 'index.html'],
                'Node.js': ['package.json', 'server.js']
            },
            
            // 品質チェック基準
            qualityChecks: {
                minFileSize: 10, // 10バイト以上
                minContentLength: {
                    'reflection.md': 100,
                    'requirements.md': 50,
                    'work_log.md': 50,
                    'script.js': 50
                },
                errorKeywords: ['ERROR', 'FAILED', 'Exception', 'Traceback', 'SyntaxError', 'TypeError'],
                successKeywords: ['success', 'completed', 'working', 'implemented'],
                requiredElements: {
                    'reflection.md': ['reflection', 'improvement', 'learned', 'challenge'],
                    'requirements.md': ['-', '*', '1.', '2.'], // リスト項目
                    'script.js': ['function', 'const', 'let', 'var'],
                    'index.html': ['<html>', '<head>', '<body>']
                }
            },
            
            // 評価グレード定義
            gradeThresholds: {
                complete: { completeness: 0.95, quality: 0.9, errors: false },
                good: { completeness: 0.8, quality: 0.7, errors: false },
                insufficient: { completeness: 0.5, quality: 0.4, errors: true },
                failure: { completeness: 0.0, quality: 0.0, errors: true }
            }
        };
    }
    
    /**
     * プロジェクト評価実行
     */
    async evaluateProject(projectPath, projectData = null) {
        try {
            this.log('project_evaluation_start', `Evaluating project: ${projectPath}`);
            
            // プロジェクトデータ取得
            const data = projectData || await this.loadProjectData(projectPath);
            
            // 評価実行
            const evaluation = {
                projectId: data.projectId || path.basename(projectPath),
                projectPath,
                timestamp: new Date().toISOString(),
                workerId: this.extractWorkerId(data),
                version: this.extractVersion(data),
                
                // レベル1: 完成度評価
                completeness: await this.evaluateCompleteness(data),
                
                // レベル2: 品質評価
                quality: await this.evaluateQuality(data),
                
                // レベル3: 総合評価
                overall: null, // 後で算出
                
                // メタデータ
                metadata: {
                    techStack: data.metadata?.techStack || [],
                    fileCount: data.metadata?.fileCount || 0,
                    totalSize: data.metadata?.totalSize || 0,
                    processingTime: null
                }
            };
            
            // 総合評価算出
            evaluation.overall = this.calculateOverallEvaluation(evaluation);
            evaluation.metadata.processingTime = Date.now() - new Date(evaluation.timestamp).getTime();
            
            this.evaluationResults.push(evaluation);
            
            this.log('project_evaluation_complete', `Project evaluated: ${evaluation.overall.grade}`, {
                projectId: evaluation.projectId,
                grade: evaluation.overall.grade,
                completenessScore: evaluation.completeness.score,
                qualityScore: evaluation.quality.score
            });
            
            return evaluation;
            
        } catch (error) {
            this.log('project_evaluation_error', `Evaluation failed for ${projectPath}`, {
                error: error.message
            });
            
            return {
                projectId: path.basename(projectPath),
                projectPath,
                timestamp: new Date().toISOString(),
                error: error.message,
                overall: { grade: 'failure', score: 0, confidence: 0 }
            };
        }
    }
    
    /**
     * プロジェクトデータ読み込み
     */
    async loadProjectData(projectPath) {
        const data = {
            projectId: path.basename(projectPath),
            files: {},
            metadata: {}
        };
        
        // ファイル一覧取得
        const allFiles = this.getAllFiles(projectPath);
        
        // 重要ファイル読み込み
        const importantFiles = [...this.evaluationCriteria.mandatoryFiles.core, 'index.html', 'script.js', 'style.css'];
        
        for (const fileName of importantFiles) {
            const filePath = path.join(projectPath, fileName);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const stat = fs.statSync(filePath);
                    
                    data.files[fileName] = {
                        content,
                        size: stat.size,
                        modified: stat.mtime.toISOString(),
                        exists: true
                    };
                } catch (readError) {
                    data.files[fileName] = {
                        exists: false,
                        error: readError.message
                    };
                }
            } else {
                data.files[fileName] = { exists: false };
            }
        }
        
        // メタデータ生成
        data.metadata = {
            fileCount: allFiles.length,
            totalSize: this.calculateTotalSize(allFiles),
            techStack: this.detectTechStack(data.files, allFiles)
        };
        
        return data;
    }
    
    /**
     * レベル1: 完成度評価
     */
    async evaluateCompleteness(data) {
        const completeness = {
            mandatoryFiles: { expected: 0, found: 0, missing: [], extra: [] },
            appFiles: { expected: 0, found: 0, missing: [], extra: [] },
            score: 0,
            details: {}
        };
        
        // 必須ファイル（4点セット + Gemini）チェック
        const mandatory = this.evaluationCriteria.mandatoryFiles.core;
        completeness.mandatoryFiles.expected = mandatory.length;
        
        mandatory.forEach(fileName => {
            if (data.files[fileName]?.exists) {
                completeness.mandatoryFiles.found++;
            } else {
                completeness.mandatoryFiles.missing.push(fileName);
            }
        });
        
        // 技術スタック別期待ファイルチェック
        const techStack = data.metadata?.techStack || [];
        let expectedAppFiles = new Set(['index.html']); // 最低限
        
        techStack.forEach(tech => {
            const expectations = this.evaluationCriteria.techStackExpectations[tech];
            if (expectations) {
                expectations.forEach(file => expectedAppFiles.add(file));
            }
        });
        
        completeness.appFiles.expected = expectedAppFiles.size;
        
        expectedAppFiles.forEach(fileName => {
            // ファイル名のバリエーションをチェック
            const variations = this.getFileNameVariations(fileName);
            const found = variations.some(variant => 
                data.files[variant]?.exists || 
                Object.keys(data.files).some(existingFile => existingFile.includes(variant))
            );
            
            if (found) {
                completeness.appFiles.found++;
            } else {
                completeness.appFiles.missing.push(fileName);
            }
        });
        
        // 完成度スコア算出
        const mandatoryScore = completeness.mandatoryFiles.found / completeness.mandatoryFiles.expected;
        const appScore = completeness.appFiles.expected > 0 
            ? completeness.appFiles.found / completeness.appFiles.expected 
            : 1.0;
        
        // 必須ファイルを重視（70%）、アプリファイルは30%
        completeness.score = (mandatoryScore * 0.7) + (appScore * 0.3);
        
        completeness.details = {
            mandatoryCompleteRate: mandatoryScore,
            appCompleteRate: appScore,
            criticalMissing: completeness.mandatoryFiles.missing,
            techStackDetected: techStack
        };
        
        return completeness;
    }
    
    /**
     * レベル2: 品質評価
     */
    async evaluateQuality(data) {
        const quality = {
            fileHealth: { healthy: 0, total: 0, issues: [] },
            contentQuality: { passed: 0, total: 0, issues: [] },
            errorAnalysis: { errorsFound: false, errorCount: 0, errors: [] },
            score: 0,
            details: {}
        };
        
        const criteria = this.evaluationCriteria.qualityChecks;
        
        // ファイル健全性チェック
        Object.entries(data.files).forEach(([fileName, fileData]) => {
            if (fileData.exists) {
                quality.fileHealth.total++;
                
                // サイズチェック
                if (fileData.size >= criteria.minFileSize) {
                    quality.fileHealth.healthy++;
                } else {
                    quality.fileHealth.issues.push(`${fileName}: too small (${fileData.size} bytes)`);
                }
                
                // JSON妥当性チェック
                if (fileName.endsWith('.json') && fileData.content) {
                    try {
                        JSON.parse(fileData.content);
                        quality.fileHealth.healthy++;
                    } catch (jsonError) {
                        quality.fileHealth.issues.push(`${fileName}: invalid JSON`);
                    }
                }
            }
        });
        
        // 内容品質チェック
        Object.entries(criteria.minContentLength).forEach(([fileName, minLength]) => {
            if (data.files[fileName]?.exists && data.files[fileName].content) {
                quality.contentQuality.total++;
                
                const content = data.files[fileName].content;
                if (content.length >= minLength) {
                    quality.contentQuality.passed++;
                } else {
                    quality.contentQuality.issues.push(`${fileName}: content too short (${content.length}/${minLength} chars)`);
                }
            }
        });
        
        // 必須要素チェック
        Object.entries(criteria.requiredElements).forEach(([fileName, requiredElements]) => {
            if (data.files[fileName]?.exists && data.files[fileName].content) {
                quality.contentQuality.total++;
                
                const content = data.files[fileName].content.toLowerCase();
                const foundElements = requiredElements.filter(element => 
                    content.includes(element.toLowerCase())
                );
                
                if (foundElements.length > 0) {
                    quality.contentQuality.passed++;
                } else {
                    quality.contentQuality.issues.push(`${fileName}: missing required elements`);
                }
            }
        });
        
        // エラー分析
        Object.entries(data.files).forEach(([fileName, fileData]) => {
            if (fileData.exists && fileData.content) {
                const content = fileData.content;
                
                criteria.errorKeywords.forEach(errorKeyword => {
                    if (content.includes(errorKeyword)) {
                        quality.errorAnalysis.errorsFound = true;
                        quality.errorAnalysis.errorCount++;
                        quality.errorAnalysis.errors.push({
                            file: fileName,
                            keyword: errorKeyword,
                            context: this.extractErrorContext(content, errorKeyword)
                        });
                    }
                });
            }
        });
        
        // 品質スコア算出
        const healthScore = quality.fileHealth.total > 0 
            ? quality.fileHealth.healthy / quality.fileHealth.total 
            : 0;
        const contentScore = quality.contentQuality.total > 0 
            ? quality.contentQuality.passed / quality.contentQuality.total 
            : 0;
        const errorPenalty = quality.errorAnalysis.errorsFound ? 0.3 : 0;
        
        quality.score = Math.max(0, ((healthScore + contentScore) / 2) - errorPenalty);
        
        quality.details = {
            healthScore,
            contentScore,
            errorPenalty,
            totalIssues: quality.fileHealth.issues.length + quality.contentQuality.issues.length,
            errorSummary: `${quality.errorAnalysis.errorCount} errors in ${quality.errorAnalysis.errors.length} files`
        };
        
        return quality;
    }
    
    /**
     * レベル3: 総合評価
     */
    calculateOverallEvaluation(evaluation) {
        const completenessScore = evaluation.completeness.score;
        const qualityScore = evaluation.quality.score;
        const hasErrors = evaluation.quality.errorAnalysis.errorsFound;
        
        const thresholds = this.evaluationCriteria.gradeThresholds;
        
        let grade = 'failure';
        let confidence = 0;
        
        // グレード判定
        if (completenessScore >= thresholds.complete.completeness && 
            qualityScore >= thresholds.complete.quality && 
            !hasErrors) {
            grade = 'complete';
            confidence = Math.min(completenessScore, qualityScore);
        } else if (completenessScore >= thresholds.good.completeness && 
                   qualityScore >= thresholds.good.quality && 
                   !hasErrors) {
            grade = 'good';
            confidence = Math.min(completenessScore, qualityScore) * 0.9;
        } else if (completenessScore >= thresholds.insufficient.completeness || 
                   qualityScore >= thresholds.insufficient.quality) {
            grade = 'insufficient';
            confidence = Math.max(completenessScore, qualityScore) * 0.6;
        } else {
            grade = 'failure';
            confidence = Math.max(completenessScore, qualityScore) * 0.3;
        }
        
        // 総合スコア算出（完成度60%、品質40%）
        const overallScore = (completenessScore * 0.6) + (qualityScore * 0.4);
        
        return {
            grade,
            score: overallScore,
            confidence,
            breakdown: {
                completeness: completenessScore,
                quality: qualityScore,
                hasErrors,
                penalty: hasErrors ? 0.2 : 0
            },
            recommendation: this.generateRecommendation(evaluation)
        };
    }
    
    /**
     * 改善推奨生成
     */
    generateRecommendation(evaluation) {
        const recommendations = [];
        
        // 完成度の問題
        if (evaluation.completeness.mandatoryFiles.missing.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'completeness',
                issue: '必須ファイル不足',
                suggestion: `以下のファイルを生成してください: ${evaluation.completeness.mandatoryFiles.missing.join(', ')}`,
                impact: 'critical'
            });
        }
        
        if (evaluation.completeness.appFiles.missing.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'completeness',
                issue: 'アプリファイル不足',
                suggestion: `技術スタックに応じたファイルを追加: ${evaluation.completeness.appFiles.missing.join(', ')}`,
                impact: 'moderate'
            });
        }
        
        // 品質の問題
        if (evaluation.quality.errorAnalysis.errorsFound) {
            recommendations.push({
                priority: 'high',
                category: 'quality',
                issue: 'エラー検出',
                suggestion: `${evaluation.quality.errorAnalysis.errorCount}個のエラーを修正してください`,
                impact: 'critical'
            });
        }
        
        if (evaluation.quality.contentQuality.issues.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'quality',
                issue: 'コンテンツ品質',
                suggestion: 'ファイル内容を充実させてください（最小文字数、必須要素の確認）',
                impact: 'moderate'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Worker統計生成
     */
    generateWorkerStatistics(evaluations = null) {
        const data = evaluations || this.evaluationResults;
        
        if (data.length === 0) {
            return { error: 'No evaluation data available' };
        }
        
        // Worker別集計
        const workerStats = {};
        
        data.forEach(evaluation => {
            const workerId = evaluation.workerId || 'unknown';
            
            if (!workerStats[workerId]) {
                workerStats[workerId] = {
                    workerId,
                    totalProjects: 0,
                    gradeDistribution: { complete: 0, good: 0, insufficient: 0, failure: 0 },
                    averageScores: { completeness: 0, quality: 0, overall: 0 },
                    commonIssues: [],
                    lastActivity: null
                };
            }
            
            const stats = workerStats[workerId];
            stats.totalProjects++;
            
            if (evaluation.overall?.grade) {
                stats.gradeDistribution[evaluation.overall.grade]++;
            }
            
            // スコア累積（後で平均計算）
            stats.averageScores.completeness += evaluation.completeness?.score || 0;
            stats.averageScores.quality += evaluation.quality?.score || 0;
            stats.averageScores.overall += evaluation.overall?.score || 0;
            
            // 最新活動時刻
            if (!stats.lastActivity || evaluation.timestamp > stats.lastActivity) {
                stats.lastActivity = evaluation.timestamp;
            }
        });
        
        // 平均値計算
        Object.values(workerStats).forEach(stats => {
            if (stats.totalProjects > 0) {
                stats.averageScores.completeness /= stats.totalProjects;
                stats.averageScores.quality /= stats.totalProjects;
                stats.averageScores.overall /= stats.totalProjects;
                
                // 成功率計算
                stats.successRate = (stats.gradeDistribution.complete + stats.gradeDistribution.good) / stats.totalProjects;
            }
        });
        
        // 全体統計
        const overallStats = {
            totalEvaluations: data.length,
            uniqueWorkers: Object.keys(workerStats).length,
            gradeDistribution: { complete: 0, good: 0, insufficient: 0, failure: 0 },
            averageSuccessRate: 0,
            lastEvaluation: Math.max(...data.map(e => new Date(e.timestamp).getTime()))
        };
        
        // 全体グレード分布計算
        data.forEach(evaluation => {
            if (evaluation.overall?.grade) {
                overallStats.gradeDistribution[evaluation.overall.grade]++;
            }
        });
        
        overallStats.averageSuccessRate = Object.values(workerStats)
            .reduce((sum, stats) => sum + stats.successRate, 0) / Object.keys(workerStats).length;
        
        return {
            timestamp: new Date().toISOString(),
            overall: overallStats,
            workers: workerStats
        };
    }
    
    /**
     * 評価結果エクスポート
     */
    exportEvaluations(outputPath, options = {}) {
        const { 
            format = 'jsonl',
            includeDetails = true,
            includeStatistics = true 
        } = options;
        
        try {
            let exportData;
            
            if (format === 'jsonl') {
                // JSONL形式（MapReduceフレンドリー）
                const lines = this.evaluationResults.map(evaluation => {
                    const exportItem = {
                        timestamp: evaluation.timestamp,
                        projectId: evaluation.projectId,
                        workerId: evaluation.workerId,
                        version: evaluation.version,
                        evaluation: {
                            grade: evaluation.overall?.grade,
                            overallScore: evaluation.overall?.score,
                            completenessScore: evaluation.completeness?.score,
                            qualityScore: evaluation.quality?.score,
                            hasErrors: evaluation.quality?.errorAnalysis?.errorsFound,
                            confidence: evaluation.overall?.confidence
                        }
                    };
                    
                    if (includeDetails) {
                        exportItem.details = {
                            completeness: evaluation.completeness,
                            quality: evaluation.quality,
                            recommendations: evaluation.overall?.recommendation
                        };
                    }
                    
                    return JSON.stringify(exportItem);
                });
                
                exportData = lines.join('\n');
                
            } else {
                // JSON形式
                exportData = JSON.stringify({
                    metadata: {
                        exportedAt: new Date().toISOString(),
                        totalEvaluations: this.evaluationResults.length,
                        sessionId: this.sessionId
                    },
                    evaluations: this.evaluationResults,
                    statistics: includeStatistics ? this.generateWorkerStatistics() : null
                }, null, 2);
            }
            
            fs.writeFileSync(outputPath, exportData, 'utf8');
            
            this.log('export_complete', 'Evaluations exported', {
                outputPath,
                format,
                count: this.evaluationResults.length
            });
            
            return {
                success: true,
                outputPath,
                format,
                count: this.evaluationResults.length
            };
            
        } catch (error) {
            this.log('export_error', 'Export failed', { error: error.message, outputPath });
            throw error;
        }
    }
    
    /**
     * ユーティリティ関数
     */
    getAllFiles(dirPath) {
        const files = [];
        
        try {
            const items = fs.readdirSync(dirPath, { recursive: true });
            items.forEach(item => {
                const fullPath = path.join(dirPath, item);
                try {
                    if (fs.statSync(fullPath).isFile()) {
                        files.push(fullPath);
                    }
                } catch (statError) {
                    // スキップ
                }
            });
        } catch (error) {
            console.warn(`⚠️ Could not read directory ${dirPath}:`, error.message);
        }
        
        return files;
    }
    
    calculateTotalSize(files) {
        let totalSize = 0;
        files.forEach(file => {
            try {
                totalSize += fs.statSync(file).size;
            } catch (error) {
                // スキップ
            }
        });
        return totalSize;
    }
    
    detectTechStack(files, allFiles) {
        const techStack = new Set();
        
        // ファイル名による検出
        Object.keys(files).forEach(fileName => {
            if (fileName === 'package.json') techStack.add('Node.js');
            if (fileName.endsWith('.js')) techStack.add('JavaScript');
            if (fileName.endsWith('.ts')) techStack.add('TypeScript');
            if (fileName.endsWith('.css')) techStack.add('CSS');
            if (fileName.endsWith('.html')) techStack.add('HTML');
            if (fileName.endsWith('.py')) techStack.add('Python');
        });
        
        // ファイル内容による検出
        Object.entries(files).forEach(([fileName, fileData]) => {
            if (fileData.content) {
                const content = fileData.content.toLowerCase();
                if (content.includes('react')) techStack.add('React');
                if (content.includes('vue')) techStack.add('Vue.js');
                if (content.includes('angular')) techStack.add('Angular');
                if (content.includes('express')) techStack.add('Express.js');
            }
        });
        
        return Array.from(techStack);
    }
    
    getFileNameVariations(fileName) {
        const base = path.parse(fileName).name;
        const ext = path.parse(fileName).ext;
        
        return [
            fileName,
            `${base}s${ext}`, // styles.css
            `main${ext}`, // main.js
            `app${ext}`, // app.js
            `index${ext}` // index.css
        ];
    }
    
    extractErrorContext(content, errorKeyword) {
        const lines = content.split('\n');
        const errorLine = lines.find(line => line.includes(errorKeyword));
        return errorLine ? errorLine.trim().substring(0, 100) : '';
    }
    
    extractWorkerId(data) {
        // session-log.jsonからWorker IDを抽出
        if (data.files && data.files['session-log.json']?.content) {
            try {
                const sessionData = JSON.parse(data.files['session-log.json'].content);
                return sessionData.meta?.environment?.hostname || 
                       sessionData.meta?.environment?.user || 
                       'unknown';
            } catch (parseError) {
                // フォールバック
            }
        }
        
        return 'unknown';
    }
    
    extractVersion(data) {
        // work_log.mdやsession-log.jsonからバージョン情報を抽出
        if (data.files && data.files['work_log.md']?.content) {
            const content = data.files['work_log.md'].content;
            const versionMatch = content.match(/v\d+\.\d+/);
            if (versionMatch) return versionMatch[0];
        }
        
        return 'unknown';
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
            this.unifiedLogger.log('worker-evaluation', action, description, data);
        }
        
        console.log(`📊 [EVALUATION] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const evaluator = new WorkerEvaluationSystem('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'evaluate':
            const projectPath = process.argv[3];
            
            if (!projectPath) {
                console.error('Usage: node worker-evaluation-system.cjs evaluate <project-path>');
                process.exit(1);
            }
            
            evaluator.evaluateProject(projectPath).then(result => {
                console.log('\n📊 Evaluation Result:');
                console.log(`Grade: ${result.overall?.grade || 'unknown'}`);
                console.log(`Overall Score: ${(result.overall?.score || 0).toFixed(2)}`);
                console.log(`Completeness: ${(result.completeness?.score || 0).toFixed(2)}`);
                console.log(`Quality: ${(result.quality?.score || 0).toFixed(2)}`);
                console.log(`Has Errors: ${result.quality?.errorAnalysis?.errorsFound ? 'Yes' : 'No'}`);
                
                if (result.overall?.recommendation?.length > 0) {
                    console.log('\n🔧 Recommendations:');
                    result.overall.recommendation.forEach((rec, i) => {
                        console.log(`${i + 1}. [${rec.priority}] ${rec.suggestion}`);
                    });
                }
            }).catch(error => {
                console.error('❌ Evaluation failed:', error.message);
                process.exit(1);
            });
            break;
            
        case 'batch':
            const directory = process.argv[3];
            const outputFile = process.argv[4] || './evaluations.jsonl';
            
            if (!directory) {
                console.error('Usage: node worker-evaluation-system.cjs batch <directory> [output-file]');
                process.exit(1);
            }
            
            // バッチ評価実装（後で追加）
            console.log('🚧 Batch evaluation not yet implemented');
            break;
            
        case 'stats':
            // 統計表示実装（後で追加）
            console.log('🚧 Statistics display not yet implemented');
            break;
            
        default:
            console.log('Worker Evaluation System Commands:');
            console.log('  evaluate <project-path>        - Evaluate single project');
            console.log('  batch <directory> [output]      - Evaluate all projects in directory');
            console.log('  stats                           - Show worker statistics');
            console.log('\nEvaluation Grades: complete > good > insufficient > failure');
            console.log('\nExample:');
            console.log('  node worker-evaluation-system.cjs evaluate ../published-apps/app-001-abc123');
    }
}

module.exports = WorkerEvaluationSystem;