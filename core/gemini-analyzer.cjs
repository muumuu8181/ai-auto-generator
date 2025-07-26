#!/usr/bin/env node

/**
 * Gemini統合分析システム v1.0
 * アプリ生成ワークフローにGemini検索+改善提案を統合
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GeminiAnalyzer {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.analysisHistory = [];
        this.logFile = path.join(__dirname, `../logs/gemini-analysis-${sessionId}.json`);
        
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
        
        // ログディレクトリ作成
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        this.log('analyzer_start', 'Gemini analyzer initialized', { sessionId });
    }
    
    /**
     * アプリコンテキスト分析
     */
    analyzeAppContext(appPath) {
        try {
            const context = {
                appPath,
                techStack: this.detectTechStack(appPath),
                fileStructure: this.analyzeFileStructure(appPath),
                dependencies: this.detectDependencies(appPath),
                codeComplexity: this.analyzeComplexity(appPath),
                timestamp: new Date().toISOString()
            };
            
            this.log('context_analysis', 'App context analyzed', context);
            return context;
            
        } catch (error) {
            this.log('context_analysis_error', 'Failed to analyze app context', { error: error.message });
            return null;
        }
    }
    
    /**
     * 技術スタック検出
     */
    detectTechStack(appPath) {
        const techStack = {
            frontend: [],
            backend: [],
            styling: [],
            testing: [],
            bundling: []
        };
        
        try {
            // HTML解析
            const htmlFiles = this.findFiles(appPath, '.html');
            htmlFiles.forEach(htmlFile => {
                const content = fs.readFileSync(htmlFile, 'utf8');
                
                // フレームワーク検出
                if (content.includes('react') || content.includes('React')) {
                    techStack.frontend.push('React');
                }
                if (content.includes('vue') || content.includes('Vue')) {
                    techStack.frontend.push('Vue.js');
                }
                if (content.includes('angular') || content.includes('Angular')) {
                    techStack.frontend.push('Angular');
                }
                
                // スタイリング検出
                if (content.includes('bootstrap') || content.includes('Bootstrap')) {
                    techStack.styling.push('Bootstrap');
                }
                if (content.includes('tailwind') || content.includes('Tailwind')) {
                    techStack.styling.push('Tailwind CSS');
                }
            });
            
            // JavaScript解析
            const jsFiles = this.findFiles(appPath, '.js');
            jsFiles.forEach(jsFile => {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // Node.js検出
                if (content.includes('require(') || content.includes('module.exports')) {
                    techStack.backend.push('Node.js');
                }
                if (content.includes('express') || content.includes('Express')) {
                    techStack.backend.push('Express.js');
                }
                
                // テスト検出
                if (content.includes('jest') || content.includes('describe(')) {
                    techStack.testing.push('Jest');
                }
                if (content.includes('mocha') || content.includes('chai')) {
                    techStack.testing.push('Mocha/Chai');
                }
            });
            
            // CSS解析
            const cssFiles = this.findFiles(appPath, '.css');
            if (cssFiles.length > 0) {
                techStack.styling.push('Custom CSS');
            }
            
            // package.json解析
            const packageJsonPath = path.join(appPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                // 依存関係から検出
                const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                Object.keys(allDeps).forEach(dep => {
                    if (dep.includes('webpack')) techStack.bundling.push('Webpack');
                    if (dep.includes('vite')) techStack.bundling.push('Vite');
                    if (dep.includes('parcel')) techStack.bundling.push('Parcel');
                });
            }
            
        } catch (error) {
            console.warn('⚠️ Tech stack detection failed:', error.message);
        }
        
        return techStack;
    }
    
    /**
     * 検索クエリ動的生成
     */
    generateSearchQueries(context) {
        const queries = [];
        const year = new Date().getFullYear();
        
        // 技術スタック基準のクエリ
        if (context.techStack.frontend.length > 0) {
            context.techStack.frontend.forEach(tech => {
                queries.push(`${tech} best practices performance optimization ${year}`);
                queries.push(`${tech} security vulnerabilities checklist ${year}`);
            });
        }
        
        if (context.techStack.backend.length > 0) {
            context.techStack.backend.forEach(tech => {
                queries.push(`${tech} production deployment best practices`);
                queries.push(`${tech} memory leak prevention techniques`);
            });
        }
        
        // 汎用的な改善クエリ
        queries.push(`web application accessibility WCAG guidelines ${year}`);
        queries.push(`modern web development code quality standards`);
        queries.push(`progressive web app optimization techniques`);
        
        // アプリの複雑度に応じたクエリ
        if (context.codeComplexity.totalFiles > 5) {
            queries.push(`large scale web application architecture patterns`);
            queries.push(`code splitting and lazy loading best practices`);
        }
        
        return queries.slice(0, 5); // 最大5クエリに制限
    }
    
    /**
     * ログ情報の構造化抽出
     */
    extractStructuredLogs(sessionId) {
        const structuredData = {
            errors: [],
            warnings: [],
            activities: [],
            phaseResults: [],
            fileChanges: [],
            trustScore: null,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Unified Logger データ取得
            const unifiedLogPath = path.join(__dirname, `../logs/unified-${sessionId}.json`);
            if (fs.existsSync(unifiedLogPath)) {
                const unifiedData = JSON.parse(fs.readFileSync(unifiedLogPath, 'utf8'));
                
                structuredData.errors = unifiedData.errors || [];
                structuredData.warnings = unifiedData.warnings || [];
                structuredData.trustScore = unifiedData.workMonitoring?.trustScore || null;
                
                // フェーズ結果抽出
                Object.entries(unifiedData.phases || {}).forEach(([phase, data]) => {
                    structuredData.phaseResults.push({
                        phase,
                        status: data.status,
                        duration: data.endTime && data.startTime ? 
                            Math.round((new Date(data.endTime) - new Date(data.startTime)) / 1000) : null,
                        logs: data.logs?.length || 0
                    });
                });
                
                // 作業活動抽出
                if (unifiedData.workMonitoring?.activities) {
                    structuredData.activities = unifiedData.workMonitoring.activities.map(activity => ({
                        action: activity.action,
                        description: activity.description,
                        timestamp: activity.timestamp,
                        success: activity.data?.verified !== false
                    }));
                }
            }
            
            // Work Monitor データ取得
            const workMonitorPath = path.join(__dirname, `../logs/work-monitor-${sessionId}.json`);
            if (fs.existsSync(workMonitorPath)) {
                const workData = JSON.parse(fs.readFileSync(workMonitorPath, 'utf8'));
                
                if (workData.activities) {
                    workData.activities.forEach(activity => {
                        if (activity.action === 'file_created' || activity.action === 'file_modified') {
                            structuredData.fileChanges.push({
                                action: activity.action,
                                file: activity.data?.path || 'unknown',
                                timestamp: activity.timestamp
                            });
                        }
                    });
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Log extraction failed:', error.message);
        }
        
        return structuredData;
    }
    
    /**
     * Gemini検索+改善提案実行
     */
    async executeAnalysis(appPath, phase = 'initial', previousLogs = null) {
        const analysisId = crypto.randomUUID();
        
        try {
            this.log('analysis_start', `Starting Gemini analysis (${phase})`, { analysisId, appPath, phase });
            
            // 1. アプリコンテキスト分析
            const context = this.analyzeAppContext(appPath);
            if (!context) {
                throw new Error('Failed to analyze app context');
            }
            
            // 2. 検索クエリ生成
            const searchQueries = this.generateSearchQueries(context);
            
            // 3. 構造化ログ取得
            const structuredLogs = previousLogs || this.extractStructuredLogs(this.sessionId);
            
            // 4. Gemini検索実行
            const searchResults = await this.executeSearch(searchQueries);
            
            // 5. 改善提案生成
            const improvements = await this.generateImprovements(context, searchResults, structuredLogs, phase);
            
            // 6. 結果記録
            const analysisResult = {
                analysisId,
                phase,
                timestamp: new Date().toISOString(),
                context,
                searchQueries,
                searchResults,
                improvements,
                structuredLogs: this.sanitizeLogsForStorage(structuredLogs)
            };
            
            this.analysisHistory.push(analysisResult);
            this.saveAnalysisLog();
            
            this.log('analysis_complete', `Gemini analysis completed (${phase})`, { 
                analysisId, 
                improvementsCount: improvements.suggestions?.length || 0,
                searchQueriesExecuted: searchQueries.length
            });
            
            return analysisResult;
            
        } catch (error) {
            this.log('analysis_error', `Gemini analysis failed (${phase})`, { 
                analysisId, 
                error: error.message,
                appPath,
                phase
            });
            
            throw error;
        }
    }
    
    /**
     * Gemini検索実行
     */
    async executeSearch(queries) {
        const searchResults = [];
        
        for (const query of queries) {
            try {
                // mcp__gemini-cli__googleSearchを使用
                console.log(`🔍 Searching: ${query}`);
                
                // 実際の検索は後で実装 - 今はプレースホルダー
                const result = {
                    query,
                    timestamp: new Date().toISOString(),
                    results: `Search results for: ${query}`,
                    summary: `Summary of improvements found for: ${query}`
                };
                
                searchResults.push(result);
                
                // API制限を考慮して待機
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.warn(`⚠️ Search failed for query: ${query}`, error.message);
                searchResults.push({
                    query,
                    timestamp: new Date().toISOString(),
                    error: error.message,
                    results: null
                });
            }
        }
        
        return searchResults;
    }
    
    /**
     * 改善提案生成
     */
    async generateImprovements(context, searchResults, structuredLogs, phase) {
        try {
            // 3500文字制限内でプロンプト作成
            const promptData = this.createOptimizedPrompt(context, searchResults, structuredLogs, phase);
            
            console.log(`💭 Generating improvements for ${phase} phase...`);
            
            // 実際のGemini呼び出しは後で実装 - 今はプレースホルダー
            const improvements = {
                phase,
                timestamp: new Date().toISOString(),
                suggestions: [
                    {
                        category: 'Performance',
                        priority: 'high',
                        suggestion: 'Consider implementing code splitting for better load times',
                        implementation: 'Use dynamic imports for large components',
                        searchBasis: searchResults[0]?.query || 'general research'
                    },
                    {
                        category: 'Security',
                        priority: 'medium', 
                        suggestion: 'Add Content Security Policy headers',
                        implementation: 'Implement CSP meta tags in HTML head',
                        searchBasis: searchResults[1]?.query || 'security research'
                    }
                ],
                confidenceScore: 85,
                basedOnLogs: structuredLogs.errors.length + structuredLogs.warnings.length,
                techStackRelevance: context.techStack
            };
            
            return improvements;
            
        } catch (error) {
            console.error('❌ Improvement generation failed:', error.message);
            return {
                phase,
                timestamp: new Date().toISOString(),
                error: error.message,
                suggestions: []
            };
        }
    }
    
    /**
     * 3500文字制限対応プロンプト作成
     */
    createOptimizedPrompt(context, searchResults, structuredLogs, phase) {
        // 重要情報のみ抽出してプロンプト作成
        const essentialContext = {
            techStack: context.techStack,
            fileCount: context.fileStructure.totalFiles,
            errors: structuredLogs.errors.length,
            warnings: structuredLogs.warnings.length,
            trustScore: structuredLogs.trustScore
        };
        
        const essentialSearch = searchResults.slice(0, 3).map(result => ({
            query: result.query,
            summary: result.summary || result.results?.substring(0, 200) || 'No results'
        }));
        
        const promptData = {
            phase,
            context: essentialContext,
            searchResults: essentialSearch,
            recentErrors: structuredLogs.errors.slice(-3),
            recentWarnings: structuredLogs.warnings.slice(-3)
        };
        
        return promptData;
    }
    
    /**
     * ユーティリティ関数
     */
    findFiles(dirPath, extension) {
        const files = [];
        
        try {
            const items = fs.readdirSync(dirPath, { recursive: true });
            
            items.forEach(item => {
                if (typeof item === 'string' && item.endsWith(extension)) {
                    files.push(path.join(dirPath, item));
                }
            });
            
        } catch (error) {
            console.warn(`⚠️ Could not read directory ${dirPath}:`, error.message);
        }
        
        return files;
    }
    
    analyzeFileStructure(appPath) {
        const structure = {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {},
            directories: []
        };
        
        try {
            const items = fs.readdirSync(appPath, { recursive: true });
            
            items.forEach(item => {
                const fullPath = path.join(appPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isFile()) {
                    structure.totalFiles++;
                    structure.totalSize += stat.size;
                    
                    const ext = path.extname(item);
                    structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
                } else if (stat.isDirectory()) {
                    structure.directories.push(item);
                }
            });
            
        } catch (error) {
            console.warn('⚠️ File structure analysis failed:', error.message);
        }
        
        return structure;
    }
    
    detectDependencies(appPath) {
        const dependencies = {
            runtime: {},
            development: {},
            total: 0
        };
        
        try {
            const packageJsonPath = path.join(appPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                dependencies.runtime = packageJson.dependencies || {};
                dependencies.development = packageJson.devDependencies || {};
                dependencies.total = Object.keys(dependencies.runtime).length + Object.keys(dependencies.development).length;
            }
        } catch (error) {
            console.warn('⚠️ Dependency detection failed:', error.message);
        }
        
        return dependencies;
    }
    
    analyzeComplexity(appPath) {
        const complexity = {
            totalFiles: 0,
            totalLines: 0,
            averageFileSize: 0,
            complexityScore: 'low'
        };
        
        try {
            const jsFiles = this.findFiles(appPath, '.js');
            const htmlFiles = this.findFiles(appPath, '.html');
            const cssFiles = this.findFiles(appPath, '.css');
            
            const allFiles = [...jsFiles, ...htmlFiles, ...cssFiles];
            complexity.totalFiles = allFiles.length;
            
            allFiles.forEach(file => {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').length;
                complexity.totalLines += lines;
            });
            
            if (complexity.totalFiles > 0) {
                complexity.averageFileSize = Math.round(complexity.totalLines / complexity.totalFiles);
                
                if (complexity.totalFiles > 10 || complexity.averageFileSize > 500) {
                    complexity.complexityScore = 'high';
                } else if (complexity.totalFiles > 5 || complexity.averageFileSize > 200) {
                    complexity.complexityScore = 'medium';
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Complexity analysis failed:', error.message);
        }
        
        return complexity;
    }
    
    sanitizeLogsForStorage(logs) {
        // ログサイズを制限して保存用に最適化
        return {
            errors: logs.errors.slice(-5),
            warnings: logs.warnings.slice(-5),
            activities: logs.activities.slice(-10),
            phaseResults: logs.phaseResults,
            trustScore: logs.trustScore,
            timestamp: logs.timestamp
        };
    }
    
    saveAnalysisLog() {
        try {
            const logData = {
                sessionId: this.sessionId,
                analysisHistory: this.analysisHistory,
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
        } catch (error) {
            console.error('❌ Failed to save analysis log:', error.message);
        }
    }
    
    log(action, description, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            description,
            data
        };
        
        // 統合ログに記録
        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('gemini-analyzer', action, description, data);
        }
        
        console.log(`🔍 [GEMINI] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const analyzer = new GeminiAnalyzer('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'analyze':
            const appPath = process.argv[3];
            const phase = process.argv[4] || 'initial';
            
            if (!appPath) {
                console.error('Usage: node gemini-analyzer.cjs analyze <app-path> [phase]');
                process.exit(1);
            }
            
            analyzer.executeAnalysis(appPath, phase).then(result => {
                console.log('✅ Analysis completed');
                console.log(`📊 Suggestions: ${result.improvements.suggestions?.length || 0}`);
                console.log(`🔍 Queries: ${result.searchQueries.length}`);
            }).catch(error => {
                console.error('❌ Analysis failed:', error.message);
                process.exit(1);
            });
            break;
            
        case 'context':
            const contextAppPath = process.argv[3];
            
            if (!contextAppPath) {
                console.error('Usage: node gemini-analyzer.cjs context <app-path>');
                process.exit(1);
            }
            
            const context = analyzer.analyzeAppContext(contextAppPath);
            console.log(JSON.stringify(context, null, 2));
            break;
            
        default:
            console.log('Gemini Analyzer Commands:');
            console.log('  analyze <app-path> [phase]  - Execute full analysis with search and improvements');
            console.log('  context <app-path>          - Analyze app context only');
            console.log('\nPhases: initial, mid, final');
            console.log('\nExample:');
            console.log('  node gemini-analyzer.cjs analyze ./app-001-test123 initial');
    }
}

module.exports = GeminiAnalyzer;