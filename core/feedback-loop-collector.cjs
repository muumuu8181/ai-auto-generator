#!/usr/bin/env node

/**
 * フィードバックループ収集システム v1.0
 * Worker AIの成果物からパターン分析用データを収集（AI不使用、ツールのみ）
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class FeedbackLoopCollector {
    constructor(sessionId, useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        this.collectionResults = [];
        
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
        
        this.log('collector_start', 'Feedback loop collector initialized', { sessionId });
    }
    
    /**
     * 指定ディレクトリ内の全アプリフォルダからデータ収集
     */
    async collectFromDirectory(targetDirectory, options = {}) {
        const {
            maxProjects = 50,
            excludePatterns = ['node_modules', '.git', 'temp-*'],
            includeFileTypes = ['reflection.md', 'requirements.md', 'work_log.md', 'session-log.json', 'gemini-feedback.txt']
        } = options;
        
        try {
            this.log('collection_start', `Starting collection from: ${targetDirectory}`, {
                maxProjects,
                excludePatterns,
                includeFileTypes
            });
            
            // 1. アプリフォルダ検出
            const appFolders = await this.findAppFolders(targetDirectory, excludePatterns);
            
            if (appFolders.length === 0) {
                this.log('no_folders_found', 'No app folders found', { targetDirectory });
                return { success: false, reason: 'No app folders found', data: [] };
            }
            
            this.log('folders_detected', `Found ${appFolders.length} app folders`, {
                count: appFolders.length,
                folders: appFolders.slice(0, 10) // 最初の10個のみログ
            });
            
            // 2. 各フォルダからデータ収集（並列処理）
            const limitedFolders = appFolders.slice(0, maxProjects);
            const collectionPromises = limitedFolders.map(folder => 
                this.collectFromAppFolder(folder, includeFileTypes)
            );
            
            const results = await Promise.allSettled(collectionPromises);
            
            // 3. 結果集約
            const successfulCollections = [];
            const failedCollections = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successfulCollections.push(result.value.data);
                } else {
                    failedCollections.push({
                        folder: limitedFolders[index],
                        error: result.reason || result.value?.error || 'Unknown error'
                    });
                }
            });
            
            this.collectionResults = successfulCollections;
            
            // 4. 統計情報生成
            const stats = this.generateCollectionStats(successfulCollections, failedCollections);
            
            this.log('collection_complete', 'Data collection completed', {
                totalFolders: limitedFolders.length,
                successful: successfulCollections.length,
                failed: failedCollections.length,
                stats
            });
            
            return {
                success: true,
                data: successfulCollections,
                stats,
                failures: failedCollections
            };
            
        } catch (error) {
            this.log('collection_error', 'Collection failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * アプリフォルダ検出
     */
    async findAppFolders(directory, excludePatterns) {
        return new Promise((resolve, reject) => {
            try {
                // app-*-* パターンでフォルダを検索
                const pattern = path.join(directory, 'app-*-*');
                
                glob(pattern, { onlyDirectories: true }, (err, matches) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // 除外パターンをフィルタリング
                    const filteredMatches = matches.filter(folder => {
                        const folderName = path.basename(folder);
                        return !excludePatterns.some(pattern => {
                            if (pattern.includes('*')) {
                                // globパターンをRegexに変換
                                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                                return regex.test(folderName);
                            }
                            return folderName.includes(pattern);
                        });
                    });
                    
                    resolve(filteredMatches);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * 単一アプリフォルダからデータ収集
     */
    async collectFromAppFolder(folderPath, includeFileTypes) {
        try {
            const folderName = path.basename(folderPath);
            const collectionData = {
                projectId: folderName,
                folderPath,
                timestamp: new Date().toISOString(),
                files: {},
                metadata: {}
            };
            
            // メタデータ収集
            collectionData.metadata = await this.collectMetadata(folderPath);
            
            // 指定ファイルタイプの収集
            for (const fileType of includeFileTypes) {
                const filePath = path.join(folderPath, fileType);
                
                if (fs.existsSync(filePath)) {
                    try {
                        const content = await this.readFileWithSizeLimit(filePath, 50000); // 50KB制限
                        collectionData.files[fileType] = {
                            content,
                            size: fs.statSync(filePath).size,
                            modified: fs.statSync(filePath).mtime.toISOString(),
                            truncated: content.length >= 50000
                        };
                    } catch (readError) {
                        collectionData.files[fileType] = {
                            error: readError.message,
                            size: 0,
                            content: null
                        };
                    }
                } else {
                    collectionData.files[fileType] = {
                        content: null,
                        exists: false
                    };
                }
            }
            
            return {
                success: true,
                data: collectionData
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                folder: folderPath
            };
        }
    }
    
    /**
     * メタデータ収集
     */
    async collectMetadata(folderPath) {
        const metadata = {
            createdAt: null,
            fileCount: 0,
            totalSize: 0,
            fileTypes: {},
            hasErrors: false,
            techStack: []
        };
        
        try {
            // フォルダ内のファイル一覧取得
            const allFiles = await this.getAllFiles(folderPath);
            metadata.fileCount = allFiles.length;
            
            for (const file of allFiles) {
                try {
                    const stat = fs.statSync(file);
                    metadata.totalSize += stat.size;
                    
                    // 作成日時（最古のファイル）
                    if (!metadata.createdAt || stat.birthtime < new Date(metadata.createdAt)) {
                        metadata.createdAt = stat.birthtime.toISOString();
                    }
                    
                    // ファイルタイプ統計
                    const ext = path.extname(file);
                    metadata.fileTypes[ext] = (metadata.fileTypes[ext] || 0) + 1;
                    
                    // 技術スタック推定
                    this.detectTechStackFromFile(file, metadata.techStack);
                    
                } catch (statError) {
                    metadata.hasErrors = true;
                }
            }
            
            // 重複排除
            metadata.techStack = [...new Set(metadata.techStack)];
            
        } catch (error) {
            metadata.hasErrors = true;
            metadata.error = error.message;
        }
        
        return metadata;
    }
    
    /**
     * フォルダ内の全ファイル取得
     */
    async getAllFiles(folderPath) {
        return new Promise((resolve, reject) => {
            glob(path.join(folderPath, '**/*'), { nodir: true }, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });
    }
    
    /**
     * 技術スタック検出
     */
    detectTechStackFromFile(filePath, techStack) {
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath);
        
        // ファイル名による検出
        if (fileName === 'package.json') techStack.push('Node.js');
        if (fileName === 'requirements.txt') techStack.push('Python');
        if (fileName === 'Cargo.toml') techStack.push('Rust');
        if (fileName === 'go.mod') techStack.push('Go');
        
        // 拡張子による検出
        const extMapping = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React',
            '.tsx': 'React TypeScript',
            '.vue': 'Vue.js',
            '.py': 'Python',
            '.rs': 'Rust',
            '.go': 'Go',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.java': 'Java',
            '.cs': 'C#',
            '.cpp': 'C++',
            '.c': 'C'
        };
        
        if (extMapping[ext]) {
            techStack.push(extMapping[ext]);
        }
    }
    
    /**
     * サイズ制限付きファイル読み込み
     */
    async readFileWithSizeLimit(filePath, maxSize) {
        return new Promise((resolve, reject) => {
            try {
                const stat = fs.statSync(filePath);
                
                if (stat.size > maxSize) {
                    // ファイルが大きい場合は先頭部分のみ読み込み
                    const buffer = Buffer.alloc(maxSize);
                    const fd = fs.openSync(filePath, 'r');
                    fs.readSync(fd, buffer, 0, maxSize, 0);
                    fs.closeSync(fd);
                    
                    resolve(buffer.toString('utf8') + '\n\n[... truncated due to size limit ...]');
                } else {
                    // 通常の読み込み
                    const content = fs.readFileSync(filePath, 'utf8');
                    resolve(content);
                }
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * 収集統計生成
     */
    generateCollectionStats(successful, failed) {
        const stats = {
            totalProjects: successful.length,
            totalFiles: 0,
            totalSize: 0,
            fileTypeDistribution: {},
            techStackDistribution: {},
            avgProjectSize: 0,
            avgFileCount: 0,
            errorRate: failed.length / (successful.length + failed.length),
            timespan: {
                earliest: null,
                latest: null
            }
        };
        
        successful.forEach(project => {
            stats.totalFiles += project.metadata.fileCount || 0;
            stats.totalSize += project.metadata.totalSize || 0;
            
            // ファイルタイプ集計
            Object.entries(project.metadata.fileTypes || {}).forEach(([ext, count]) => {
                stats.fileTypeDistribution[ext] = (stats.fileTypeDistribution[ext] || 0) + count;
            });
            
            // 技術スタック集計
            (project.metadata.techStack || []).forEach(tech => {
                stats.techStackDistribution[tech] = (stats.techStackDistribution[tech] || 0) + 1;
            });
            
            // 時間範囲
            if (project.metadata.createdAt) {
                const created = new Date(project.metadata.createdAt);
                if (!stats.timespan.earliest || created < new Date(stats.timespan.earliest)) {
                    stats.timespan.earliest = project.metadata.createdAt;
                }
                if (!stats.timespan.latest || created > new Date(stats.timespan.latest)) {
                    stats.timespan.latest = project.metadata.createdAt;
                }
            }
        });
        
        // 平均値計算
        if (successful.length > 0) {
            stats.avgProjectSize = Math.round(stats.totalSize / successful.length);
            stats.avgFileCount = Math.round(stats.totalFiles / successful.length);
        }
        
        return stats;
    }
    
    /**
     * 収集データをJSONLファイルに出力
     */
    exportToJsonl(outputPath, options = {}) {
        const { 
            includeMetadata = true,
            compressContent = true,
            maxContentLength = 10000 
        } = options;
        
        try {
            const lines = this.collectionResults.map(project => {
                const exportData = {
                    projectId: project.projectId,
                    timestamp: project.timestamp,
                    files: {}
                };
                
                if (includeMetadata) {
                    exportData.metadata = project.metadata;
                }
                
                // ファイル内容処理
                Object.entries(project.files).forEach(([fileType, fileData]) => {
                    if (fileData.content) {
                        let content = fileData.content;
                        
                        // 内容圧縮
                        if (compressContent && content.length > maxContentLength) {
                            content = content.substring(0, maxContentLength) + '\n[... content truncated for export ...]';
                        }
                        
                        exportData.files[fileType] = {
                            content,
                            size: fileData.size,
                            modified: fileData.modified,
                            truncated: fileData.truncated || content.length < fileData.content.length
                        };
                    } else {
                        exportData.files[fileType] = {
                            exists: fileData.exists || false,
                            error: fileData.error || null
                        };
                    }
                });
                
                return JSON.stringify(exportData);
            });
            
            fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
            
            this.log('export_complete', 'Data exported to JSONL', {
                outputPath,
                lineCount: lines.length,
                fileSize: fs.statSync(outputPath).size
            });
            
            return {
                success: true,
                outputPath,
                lineCount: lines.length,
                fileSize: fs.statSync(outputPath).size
            };
            
        } catch (error) {
            this.log('export_error', 'Export failed', { error: error.message, outputPath });
            throw error;
        }
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
            this.unifiedLogger.log('feedback-collector', action, description, data);
        }
        
        console.log(`📊 [COLLECTOR] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const collector = new FeedbackLoopCollector('default');
    const command = process.argv[2];
    
    switch (command) {
        case 'collect':
            const targetDir = process.argv[3];
            const outputFile = process.argv[4] || './collected_feedback.jsonl';
            
            if (!targetDir) {
                console.error('Usage: node feedback-loop-collector.cjs collect <target-directory> [output-file]');
                process.exit(1);
            }
            
            collector.collectFromDirectory(targetDir).then(result => {
                if (result.success) {
                    console.log(`✅ Collection completed: ${result.data.length} projects`);
                    console.log(`📊 Stats:`, result.stats);
                    
                    return collector.exportToJsonl(outputFile);
                } else {
                    console.error(`❌ Collection failed: ${result.reason}`);
                    process.exit(1);
                }
            }).then(exportResult => {
                console.log(`💾 Exported to: ${exportResult.outputPath}`);
                console.log(`📏 File size: ${(exportResult.fileSize / 1024).toFixed(1)} KB`);
                console.log(`📋 Lines: ${exportResult.lineCount}`);
            }).catch(error => {
                console.error('❌ Process failed:', error.message);
                process.exit(1);
            });
            break;
            
        case 'stats':
            const statsDir = process.argv[3];
            
            if (!statsDir) {
                console.error('Usage: node feedback-loop-collector.cjs stats <target-directory>');
                process.exit(1);
            }
            
            collector.collectFromDirectory(statsDir).then(result => {
                if (result.success) {
                    console.log('\n📊 Feedback Collection Statistics:');
                    console.log(`Projects found: ${result.stats.totalProjects}`);
                    console.log(`Total files: ${result.stats.totalFiles}`);
                    console.log(`Total size: ${(result.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
                    console.log(`Average project size: ${(result.stats.avgProjectSize / 1024).toFixed(1)} KB`);
                    console.log(`Error rate: ${(result.stats.errorRate * 100).toFixed(1)}%`);
                    
                    console.log('\nTech Stack Distribution:');
                    Object.entries(result.stats.techStackDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .forEach(([tech, count]) => {
                            console.log(`  ${tech}: ${count}`);
                        });
                } else {
                    console.error(`❌ Stats failed: ${result.reason}`);
                    process.exit(1);
                }
            }).catch(error => {
                console.error('❌ Stats failed:', error.message);
                process.exit(1);
            });
            break;
            
        default:
            console.log('Feedback Loop Collector Commands:');
            console.log('  collect <directory> [output]  - Collect feedback data from app folders');
            console.log('  stats <directory>             - Show collection statistics');
            console.log('\nExample:');
            console.log('  node feedback-loop-collector.cjs collect /path/to/published-apps feedback.jsonl');
            console.log('  node feedback-loop-collector.cjs stats /path/to/published-apps');
    }
}

module.exports = FeedbackLoopCollector;