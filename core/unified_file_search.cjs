#!/usr/bin/env node
/**
 * 統一ファイル検索ツール
 * Glob/Grep/LS/Read を完全統合し、引数・履歴保存機能付き
 * 目標: 検索作業の手動30% → 0%自動化
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class UnifiedFileSearch {
    constructor() {
        this.historyPath = path.join(__dirname, '../logs/unified_search_history.json');
        this.history = this.loadHistory();
        this.searchId = Date.now();
    }

    /**
     * 履歴読み込み
     */
    loadHistory() {
        if (fs.existsSync(this.historyPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
            } catch (error) {
                return { searches: [], statistics: {} };
            }
        }
        return { searches: [], statistics: {} };
    }

    /**
     * 履歴保存（引数含む）
     */
    saveHistory(searchType, args, results) {
        const record = {
            id: this.searchId,
            timestamp: new Date().toISOString(),
            search_type: searchType,
            arguments: args,
            results_count: Array.isArray(results) ? results.length : 0,
            execution_time: Date.now() - this.searchId,
            success: results !== null
        };

        this.history.searches.push(record);
        
        // 統計更新
        if (!this.history.statistics[searchType]) {
            this.history.statistics[searchType] = { count: 0, success_rate: 0 };
        }
        this.history.statistics[searchType].count++;
        
        // 最近100件のみ保持
        if (this.history.searches.length > 100) {
            this.history.searches = this.history.searches.slice(-100);
        }

        fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2));
        console.log(`📊 検索履歴保存: ${searchType} (引数: ${JSON.stringify(args)})`);
    }

    /**
     * 1. ファイル名パターン検索（Glob代替）
     */
    async searchByPattern(pattern, basePath = '.') {
        const args = { pattern, basePath };
        console.log(`🔍 パターン検索: ${pattern} in ${basePath}`);

        try {
            const results = await new Promise((resolve, reject) => {
                // ripgrep によるファイル名検索
                const command = `cd "${basePath}" && find . -name "${pattern}" -type f | head -50`;
                
                exec(command, (error, stdout, stderr) => {
                    if (error && !stdout.trim()) {
                        resolve([]);
                        return;
                    }
                    
                    const files = stdout.trim().split('\n')
                        .filter(file => file.length > 0)
                        .map(file => path.resolve(basePath, file.replace('.//', '')));
                    
                    resolve(files);
                });
            });

            this.saveHistory('pattern_search', args, results);
            return results;

        } catch (error) {
            console.error('❌ パターン検索エラー:', error.message);
            this.saveHistory('pattern_search', args, null);
            return [];
        }
    }

    /**
     * 2. ファイル内容検索（Grep代替）
     */
    async searchByContent(searchTerm, filePattern = '*', basePath = '.') {
        const args = { searchTerm, filePattern, basePath };
        console.log(`🔍 内容検索: "${searchTerm}" in ${filePattern} at ${basePath}`);

        try {
            const results = await new Promise((resolve, reject) => {
                // ripgrep による内容検索（より高速・正確）
                const command = `cd "${basePath}" && rg "${searchTerm}" --type-add 'target:${filePattern}' -t target -l | head -50`;
                
                exec(command, (error, stdout, stderr) => {
                    if (error && !stdout.trim()) {
                        // ripgrep失敗時はgrep fallback
                        const fallbackCommand = `cd "${basePath}" && grep -r "${searchTerm}" --include="${filePattern}" . | cut -d: -f1 | sort -u | head -50`;
                        exec(fallbackCommand, (error2, stdout2) => {
                            const files = stdout2.trim().split('\n')
                                .filter(file => file.length > 0)
                                .map(file => path.resolve(basePath, file.replace('./', '')));
                            resolve(files);
                        });
                        return;
                    }
                    
                    const files = stdout.trim().split('\n')
                        .filter(file => file.length > 0)
                        .map(file => path.resolve(basePath, file));
                    
                    resolve(files);
                });
            });

            this.saveHistory('content_search', args, results);
            return results;

        } catch (error) {
            console.error('❌ 内容検索エラー:', error.message);
            this.saveHistory('content_search', args, null);
            return [];
        }
    }

    /**
     * 3. ディレクトリ一覧取得（LS代替）
     */
    async listDirectory(dirPath = '.', options = {}) {
        const args = { dirPath, options };
        console.log(`📁 ディレクトリ一覧: ${dirPath}`);

        try {
            const fullPath = path.resolve(dirPath);
            
            if (!fs.existsSync(fullPath)) {
                console.log(`❌ ディレクトリが存在しません: ${fullPath}`);
                this.saveHistory('directory_list', args, null);
                return [];
            }

            const items = fs.readdirSync(fullPath, { withFileTypes: true });
            const results = items.map(item => ({
                name: item.name,
                type: item.isDirectory() ? 'directory' : 'file',
                path: path.join(fullPath, item.name),
                isDirectory: item.isDirectory(),
                isFile: item.isFile()
            }));

            // オプション適用
            let filteredResults = results;
            if (options.filesOnly) {
                filteredResults = results.filter(item => item.isFile);
            }
            if (options.dirsOnly) {
                filteredResults = results.filter(item => item.isDirectory);
            }
            if (options.pattern) {
                filteredResults = filteredResults.filter(item => 
                    item.name.includes(options.pattern)
                );
            }

            this.saveHistory('directory_list', args, filteredResults);
            return filteredResults;

        } catch (error) {
            console.error('❌ ディレクトリ一覧エラー:', error.message);
            this.saveHistory('directory_list', args, null);
            return [];
        }
    }

    /**
     * 4. ファイル内容読み込み（Read代替）
     */
    async readFile(filePath, options = {}) {
        const args = { filePath, options };
        console.log(`📄 ファイル読み込み: ${filePath}`);

        try {
            const fullPath = path.resolve(filePath);
            
            if (!fs.existsSync(fullPath)) {
                console.log(`❌ ファイルが存在しません: ${fullPath}`);
                this.saveHistory('file_read', args, null);
                return null;
            }

            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                console.log(`❌ ディレクトリです: ${fullPath}`);
                this.saveHistory('file_read', args, null);
                return null;
            }

            let content = fs.readFileSync(fullPath, 'utf8');
            
            // オプション適用
            if (options.limit) {
                const lines = content.split('\n');
                const startLine = options.offset || 0;
                const endLine = startLine + options.limit;
                content = lines.slice(startLine, endLine).join('\n');
            }

            const result = {
                path: fullPath,
                content: content,
                lines: content.split('\n').length,
                size: stats.size
            };

            this.saveHistory('file_read', args, result);
            return result;

        } catch (error) {
            console.error('❌ ファイル読み込みエラー:', error.message);
            this.saveHistory('file_read', args, null);
            return null;
        }
    }

    /**
     * 5. スマート検索（自動判別）
     */
    async smartSearch(query, basePath = '.') {
        console.log(`🧠 スマート検索: "${query}" in ${basePath}`);
        
        // 検索タイプ自動判別
        if (query.includes('*') || query.includes('?')) {
            console.log('→ パターン検索として実行');
            return await this.searchByPattern(query, basePath);
        }
        
        if (query.includes('/') && !query.includes(' ')) {
            console.log('→ ファイルパス検索として実行');
            const results = await this.searchByPattern(`*${query}*`, basePath);
            return results;
        }
        
        if (query.length > 0) {
            console.log('→ 内容検索として実行');
            return await this.searchByContent(query, '*', basePath);
        }

        return [];
    }

    /**
     * 検索統計表示
     */
    showStatistics() {
        console.log('\n📊 統一検索ツール 利用統計');
        console.log('═══════════════════════════════════════');
        console.log(`📈 総検索回数: ${this.history.searches.length}件`);
        
        Object.entries(this.history.statistics).forEach(([type, stats]) => {
            console.log(`  ${type}: ${stats.count}回`);
        });

        // 最近の検索
        console.log('\n🔍 最近の検索 (直近5件):');
        this.history.searches.slice(-5).forEach((search, index) => {
            console.log(`  ${index + 1}. ${search.search_type}: ${JSON.stringify(search.arguments)}`);
            console.log(`     結果: ${search.results_count}件 | ${search.success ? '✅' : '❌'} | ${search.execution_time}ms`);
        });
    }

    /**
     * CLI インターフェース
     */
    async executeCommand(command, ...args) {
        switch (command) {
            case 'pattern':
            case 'glob':
                return await this.searchByPattern(args[0], args[1]);
                
            case 'content':
            case 'grep':
                return await this.searchByContent(args[0], args[1], args[2]);
                
            case 'list':
            case 'ls':
                const options = {};
                if (args[1] === '--files') options.filesOnly = true;
                if (args[1] === '--dirs') options.dirsOnly = true;
                return await this.listDirectory(args[0], options);
                
            case 'read':
                const readOptions = {};
                if (args[1]) readOptions.limit = parseInt(args[1]);
                if (args[2]) readOptions.offset = parseInt(args[2]);
                return await this.readFile(args[0], readOptions);
                
            case 'smart':
                return await this.smartSearch(args[0], args[1]);
                
            case 'stats':
                this.showStatistics();
                return null;
                
            default:
                console.log('❌ 不明なコマンド:', command);
                console.log('利用可能: pattern, content, list, read, smart, stats');
                return null;
        }
    }
}

// CLI実行
if (require.main === module) {
    const search = new UnifiedFileSearch();
    const [command, ...args] = process.argv.slice(2);
    
    if (!command) {
        console.log('🔍 統一ファイル検索ツール');
        console.log('使用方法:');
        console.log('  node unified_file_search.cjs pattern "*.js" [basePath]');
        console.log('  node unified_file_search.cjs content "function" "*.js" [basePath]');
        console.log('  node unified_file_search.cjs list [dirPath] [--files|--dirs]');
        console.log('  node unified_file_search.cjs read filePath [limit] [offset]');
        console.log('  node unified_file_search.cjs smart "query" [basePath]');
        console.log('  node unified_file_search.cjs stats');
    } else {
        search.executeCommand(command, ...args).then(results => {
            if (results && Array.isArray(results)) {
                console.log(`\n✅ 検索完了: ${results.length}件`);
                results.slice(0, 10).forEach((result, index) => {
                    if (typeof result === 'string') {
                        console.log(`  ${index + 1}. ${result}`);
                    } else if (result.name) {
                        console.log(`  ${index + 1}. ${result.name} (${result.type})`);
                    }
                });
                if (results.length > 10) {
                    console.log(`  ... 他 ${results.length - 10}件`);
                }
            }
        });
    }
}

module.exports = UnifiedFileSearch;