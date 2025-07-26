#!/usr/bin/env node

/**
 * Gemini フィードバックファイル生成システム v1.0
 * 各回のGemini改善提案をgemini-feedback.txtに記録
 */

const fs = require('fs');
const path = require('path');

class GeminiFeedbackGenerator {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        
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
        
        this.log('feedback_generator_start', 'Gemini feedback generator initialized', { sessionId });
    }
    
    /**
     * フィードバックファイル生成
     */
    generateFeedbackFile(appPath, analysisResults, workflowDetails) {
        try {
            const feedbackPath = path.join(appPath, 'gemini-feedback.txt');
            const content = this.createFeedbackContent(analysisResults, workflowDetails);
            
            fs.writeFileSync(feedbackPath, content, 'utf8');
            
            this.log('feedback_generated', 'Gemini feedback file created', {
                appPath,
                feedbackPath,
                analysisCount: analysisResults.length,
                contentLength: content.length
            });
            
            console.log(`📝 Gemini feedback saved: ${feedbackPath}`);
            console.log(`📊 Analysis sessions: ${analysisResults.length}`);
            console.log(`📏 Content length: ${content.length} characters`);
            
            return feedbackPath;
            
        } catch (error) {
            this.log('feedback_generation_error', 'Failed to generate feedback file', {
                error: error.message,
                appPath
            });
            
            console.error('❌ Feedback generation failed:', error.message);
            return null;
        }
    }
    
    /**
     * フィードバック内容作成
     */
    createFeedbackContent(analysisResults, workflowDetails) {
        const timestamp = new Date().toISOString();
        const readableTime = new Date().toLocaleString('ja-JP');
        
        let content = '';
        
        // ヘッダー
        content += `# Gemini AI改善提案レポート\n\n`;
        content += `**生成日時**: ${readableTime}\n`;
        content += `**セッションID**: ${this.sessionId}\n`;
        content += `**分析回数**: ${analysisResults.length}\n`;
        content += `**アプリパス**: ${workflowDetails.appPath || 'N/A'}\n\n`;
        
        // ワークフロー概要
        content += `## 🚀 ワークフロー概要\n\n`;
        if (workflowDetails.summary) {
            content += `${workflowDetails.summary}\n\n`;
        }
        
        if (workflowDetails.techStack) {
            content += `**検出された技術スタック**:\n`;
            Object.entries(workflowDetails.techStack).forEach(([category, technologies]) => {
                if (technologies.length > 0) {
                    content += `- ${category}: ${technologies.join(', ')}\n`;
                }
            });
            content += `\n`;
        }
        
        if (workflowDetails.worklog && workflowDetails.worklog.length > 0) {
            content += `**主要な作業内容**:\n`;
            workflowDetails.worklog.forEach((item, index) => {
                content += `${index + 1}. ${item}\n`;
            });
            content += `\n`;
        }
        
        // 各分析セッションの結果
        content += `## 📊 Gemini分析結果\n\n`;
        
        analysisResults.forEach((analysis, index) => {
            const sessionNum = index + 1;
            const phaseLabel = this.getPhaseLabel(analysis.phase);
            
            content += `### ${sessionNum}. ${phaseLabel} (${analysis.phase})\n\n`;
            content += `**実行時刻**: ${new Date(analysis.timestamp).toLocaleString('ja-JP')}\n`;
            content += `**分析ID**: ${analysis.analysisId}\n\n`;
            
            // 検索クエリ
            if (analysis.searchQueries && analysis.searchQueries.length > 0) {
                content += `**実行された検索クエリ**:\n`;
                analysis.searchQueries.forEach((query, qIndex) => {
                    content += `${qIndex + 1}. "${query}"\n`;
                });
                content += `\n`;
            }
            
            // 改善提案
            if (analysis.improvements && analysis.improvements.suggestions) {
                content += `**改善提案**:\n\n`;
                
                analysis.improvements.suggestions.forEach((suggestion, sIndex) => {
                    const priority = this.getPriorityIcon(suggestion.priority);
                    content += `#### ${priority} ${suggestion.category || 'General'}\n\n`;
                    content += `**提案**: ${suggestion.suggestion}\n\n`;
                    content += `**実装方法**: ${suggestion.implementation || 'N/A'}\n\n`;
                    content += `**根拠**: ${suggestion.searchBasis || 'General research'}\n\n`;
                    
                    if (suggestion.codeExample) {
                        content += `**コード例**:\n\`\`\`\n${suggestion.codeExample}\n\`\`\`\n\n`;
                    }
                    
                    content += `---\n\n`;
                });
                
                if (analysis.improvements.confidenceScore) {
                    content += `**信頼度スコア**: ${analysis.improvements.confidenceScore}%\n\n`;
                }
            }
            
            // コンテキスト情報
            if (analysis.context) {
                content += `**分析時のコンテキスト**:\n`;
                content += `- ファイル数: ${analysis.context.fileStructure?.totalFiles || 'N/A'}\n`;
                content += `- 総サイズ: ${this.formatFileSize(analysis.context.fileStructure?.totalSize || 0)}\n`;
                content += `- 複雑度: ${analysis.context.codeComplexity?.complexityScore || 'N/A'}\n\n`;
            }
            
            // ログ情報（簡潔版）
            if (analysis.structuredLogs) {
                const logs = analysis.structuredLogs;
                if (logs.errors.length > 0 || logs.warnings.length > 0) {
                    content += `**検出された問題**:\n`;
                    content += `- エラー: ${logs.errors.length}件\n`;
                    content += `- 警告: ${logs.warnings.length}件\n`;
                    if (logs.trustScore !== null) {
                        content += `- Trust Score: ${logs.trustScore}%\n`;
                    }
                    content += `\n`;
                }
            }
            
            content += `\n`;
        });
        
        // 総合評価
        content += `## 🎯 総合評価と推奨事項\n\n`;
        content += this.generateOverallAssessment(analysisResults, workflowDetails);
        
        // フッター
        content += `\n---\n\n`;
        content += `**レポート生成時刻**: ${timestamp}\n`;
        content += `**AI Auto Generator**: v0.9 with Gemini Integration\n`;
        content += `**品質保証**: 統合ログ記録、Trust Score評価済み\n`;
        
        return content;
    }
    
    /**
     * 総合評価生成
     */
    generateOverallAssessment(analysisResults, workflowDetails) {
        let assessment = '';
        
        // 改善提案の統計
        const allSuggestions = [];
        const categories = {};
        const priorities = { high: 0, medium: 0, low: 0 };
        
        analysisResults.forEach(analysis => {
            if (analysis.improvements?.suggestions) {
                analysis.improvements.suggestions.forEach(suggestion => {
                    allSuggestions.push(suggestion);
                    
                    const category = suggestion.category || 'General';
                    categories[category] = (categories[category] || 0) + 1;
                    
                    const priority = suggestion.priority || 'medium';
                    priorities[priority] = (priorities[priority] || 0) + 1;
                });
            }
        });
        
        assessment += `**改善提案統計**:\n`;
        assessment += `- 総提案数: ${allSuggestions.length}件\n`;
        assessment += `- 高優先度: ${priorities.high}件\n`;
        assessment += `- 中優先度: ${priorities.medium}件\n`;
        assessment += `- 低優先度: ${priorities.low}件\n\n`;
        
        if (Object.keys(categories).length > 0) {
            assessment += `**改善分野別内訳**:\n`;
            Object.entries(categories).forEach(([category, count]) => {
                assessment += `- ${category}: ${count}件\n`;
            });
            assessment += `\n`;
        }
        
        // 重要な推奨事項
        const highPrioritySuggestions = allSuggestions.filter(s => s.priority === 'high');
        if (highPrioritySuggestions.length > 0) {
            assessment += `**🔴 優先実装推奨**:\n`;
            highPrioritySuggestions.forEach((suggestion, index) => {
                assessment += `${index + 1}. ${suggestion.suggestion}\n`;
            });
            assessment += `\n`;
        }
        
        // 品質評価
        const finalAnalysis = analysisResults[analysisResults.length - 1];
        if (finalAnalysis?.structuredLogs) {
            const logs = finalAnalysis.structuredLogs;
            assessment += `**品質指標**:\n`;
            
            if (logs.trustScore !== null) {
                const trustLevel = logs.trustScore >= 90 ? '優秀' : logs.trustScore >= 70 ? '良好' : '要改善';
                assessment += `- Trust Score: ${logs.trustScore}% (${trustLevel})\n`;
            }
            
            if (logs.errors.length === 0) {
                assessment += `- エラー: なし ✅\n`;
            } else {
                assessment += `- エラー: ${logs.errors.length}件 ⚠️\n`;
            }
            
            assessment += `\n`;
        }
        
        // 次のステップ推奨
        assessment += `**🔧 次のステップ推奨**:\n`;
        assessment += `1. 高優先度の改善提案から順次実装\n`;
        assessment += `2. パフォーマンステストの実行\n`;
        assessment += `3. セキュリティ監査の実施\n`;
        assessment += `4. アクセシビリティ検証\n`;
        assessment += `5. 継続的な品質監視の設定\n\n`;
        
        return assessment;
    }
    
    /**
     * ユーティリティ関数
     */
    getPhaseLabel(phase) {
        const labels = {
            'initial': '初期分析',
            'mid': '中間レビュー',
            'final': '最終評価',
            'post': 'ポスト分析'
        };
        
        return labels[phase] || `カスタム分析 (${phase})`;
    }
    
    getPriorityIcon(priority) {
        const icons = {
            'high': '🔴 高優先度',
            'medium': '🟡 中優先度',
            'low': '🟢 低優先度'
        };
        
        return icons[priority] || '⚪ 優先度未設定';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }
    
    /**
     * 既存フィードバックファイルに追記
     */
    appendToFeedbackFile(appPath, newAnalysis, workflowUpdate = null) {
        try {
            const feedbackPath = path.join(appPath, 'gemini-feedback.txt');
            
            if (!fs.existsSync(feedbackPath)) {
                console.warn('⚠️ Feedback file does not exist, creating new one');
                return this.generateFeedbackFile(appPath, [newAnalysis], workflowUpdate || {});
            }
            
            let existingContent = fs.readFileSync(feedbackPath, 'utf8');
            
            // 新しい分析結果を追記
            const appendContent = this.createAppendContent(newAnalysis);
            
            // "総合評価と推奨事項" セクションより前に挿入
            const insertPoint = existingContent.indexOf('## 🎯 総合評価と推奨事項');
            
            if (insertPoint !== -1) {
                const beforeSection = existingContent.substring(0, insertPoint);
                const afterSection = existingContent.substring(insertPoint);
                
                existingContent = beforeSection + appendContent + '\n' + afterSection;
            } else {
                // セクションが見つからない場合は末尾に追記
                existingContent += '\n' + appendContent;
            }
            
            fs.writeFileSync(feedbackPath, existingContent, 'utf8');
            
            this.log('feedback_appended', 'New analysis appended to feedback file', {
                appPath,
                feedbackPath,
                analysisId: newAnalysis.analysisId
            });
            
            console.log(`📝 Feedback updated: ${feedbackPath}`);
            return feedbackPath;
            
        } catch (error) {
            this.log('feedback_append_error', 'Failed to append to feedback file', {
                error: error.message,
                appPath
            });
            
            console.error('❌ Feedback append failed:', error.message);
            return null;
        }
    }
    
    /**
     * 追記用コンテンツ作成
     */
    createAppendContent(analysis) {
        const sessionNum = '追加分析';
        const phaseLabel = this.getPhaseLabel(analysis.phase);
        
        let content = `### ${sessionNum} - ${phaseLabel} (${analysis.phase})\n\n`;
        content += `**実行時刻**: ${new Date(analysis.timestamp).toLocaleString('ja-JP')}\n`;
        content += `**分析ID**: ${analysis.analysisId}\n\n`;
        
        // 検索クエリ
        if (analysis.searchQueries && analysis.searchQueries.length > 0) {
            content += `**実行された検索クエリ**:\n`;
            analysis.searchQueries.forEach((query, qIndex) => {
                content += `${qIndex + 1}. "${query}"\n`;
            });
            content += `\n`;
        }
        
        // 改善提案
        if (analysis.improvements && analysis.improvements.suggestions) {
            content += `**改善提案**:\n\n`;
            
            analysis.improvements.suggestions.forEach((suggestion, sIndex) => {
                const priority = this.getPriorityIcon(suggestion.priority);
                content += `#### ${priority} ${suggestion.category || 'General'}\n\n`;
                content += `**提案**: ${suggestion.suggestion}\n\n`;
                content += `**実装方法**: ${suggestion.implementation || 'N/A'}\n\n`;
                content += `**根拠**: ${suggestion.searchBasis || 'General research'}\n\n`;
                content += `---\n\n`;
            });
        }
        
        return content;
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
            this.unifiedLogger.log('gemini-feedback', action, description, data);
        }
        
        console.log(`📝 [FEEDBACK] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const generator = new GeminiFeedbackGenerator('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'generate':
            const appPath = process.argv[3];
            const analysisFile = process.argv[4];
            
            if (!appPath || !analysisFile) {
                console.error('Usage: node gemini-feedback-generator.cjs generate <app-path> <analysis-results-json>');
                process.exit(1);
            }
            
            try {
                const analysisResults = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
                const feedbackPath = generator.generateFeedbackFile(appPath, analysisResults, {});
                console.log(feedbackPath || 'Generation failed');
            } catch (error) {
                console.error('❌ Failed to read analysis file:', error.message);
                process.exit(1);
            }
            break;
            
        case 'append':
            const appendAppPath = process.argv[3];
            const newAnalysisFile = process.argv[4];
            
            if (!appendAppPath || !newAnalysisFile) {
                console.error('Usage: node gemini-feedback-generator.cjs append <app-path> <new-analysis-json>');
                process.exit(1);
            }
            
            try {
                const newAnalysis = JSON.parse(fs.readFileSync(newAnalysisFile, 'utf8'));
                const feedbackPath = generator.appendToFeedbackFile(appendAppPath, newAnalysis);
                console.log(feedbackPath || 'Append failed');
            } catch (error) {
                console.error('❌ Failed to read new analysis file:', error.message);
                process.exit(1);
            }
            break;
            
        default:
            console.log('Gemini Feedback Generator Commands:');
            console.log('  generate <app-path> <analysis-results-json>  - Generate complete feedback file');
            console.log('  append <app-path> <new-analysis-json>        - Append new analysis to existing file');
            console.log('\nExample:');
            console.log('  node gemini-feedback-generator.cjs generate ./app-001-test123 ./analysis-results.json');
            console.log('  node gemini-feedback-generator.cjs append ./app-001-test123 ./new-analysis.json');
    }
}

module.exports = GeminiFeedbackGenerator;