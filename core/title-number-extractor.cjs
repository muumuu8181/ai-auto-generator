#!/usr/bin/env node

/**
 * タイトル番号抽出システム v1.0
 * app-requests.mdからタイトルの括弧内番号を抽出してアプリIDに使用
 */

const fs = require('fs');

class TitleNumberExtractor {
    constructor() {
        this.patterns = [
            /##\s*\((\d{3,8})\)\s*(.+)/,     // ## (004) or (00000004) 時計アプリ
            /##\s*\[(\d{3,8})\]\s*(.+)/,     // ## [004] or [00000004] 時計アプリ
            /##\s*(\d{3,8})\.\s*(.+)/,       // ## 004. or 00000004. 時計アプリ
            /##\s*(\d{3,8})\s*[:：]\s*(.+)/, // ## 004: or 00000004: 時計アプリ
            /##\s*(\d{3,8})\s*[-－]\s*(.+)/, // ## 004 - or 00000004 - 時計アプリ
        ];
    }
    
    /**
     * マークダウンファイルからアプリリストを抽出
     */
    extractAppsFromMarkdown(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                return [];
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            return this.parseAppsFromContent(content);
            
        } catch (error) {
            console.error(`❌ Failed to read file ${filePath}:`, error.message);
            return [];
        }
    }
    
    /**
     * コンテンツからアプリリストをパース
     */
    parseAppsFromContent(content) {
        const lines = content.split('\n');
        const apps = [];
        
        lines.forEach((line, index) => {
            const app = this.extractAppFromLine(line.trim());
            if (app) {
                app.lineNumber = index + 1;
                apps.push(app);
            }
        });
        
        return apps;
    }
    
    /**
     * 1行からアプリ情報を抽出
     */
    extractAppFromLine(line) {
        for (const pattern of this.patterns) {
            const match = line.match(pattern);
            if (match) {
                return {
                    number: match[1],
                    title: match[2].trim(),
                    fullLine: line,
                    pattern: pattern.source
                };
            }
        }
        return null;
    }
    
    /**
     * 特定の番号のアプリを検索
     */
    findAppByNumber(filePath, targetNumber) {
        const apps = this.extractAppsFromMarkdown(filePath);
        const paddedNumber = targetNumber.toString().padStart(8, '0');
        
        return apps.find(app => app.number === paddedNumber);
    }
    
    /**
     * 最初に見つかったアプリの番号を取得
     */
    getFirstAppNumber(filePath) {
        const apps = this.extractAppsFromMarkdown(filePath);
        
        if (apps.length === 0) {
            console.warn('⚠️ No numbered apps found in file');
            return null;
        }
        
        const firstApp = apps[0];
        console.log(`📱 Found first app: ${firstApp.number} - ${firstApp.title}`);
        return firstApp.number;
    }
    
    /**
     * 最高優先度（最小番号）のアプリを取得
     */
    getHighestPriorityApp(filePath) {
        const apps = this.extractAppsFromMarkdown(filePath);
        
        if (apps.length === 0) {
            console.warn('⚠️ No numbered apps found in file');
            return null;
        }
        
        // 番号でソート（昇順）
        apps.sort((a, b) => parseInt(a.number) - parseInt(b.number));
        
        const highestPriority = apps[0];
        console.log(`🎯 Highest priority app: ${highestPriority.number} - ${highestPriority.title}`);
        
        return {
            number: highestPriority.number,
            title: highestPriority.title,
            fullLine: highestPriority.fullLine,
            totalApps: apps.length
        };
    }
    
    /**
     * アプリリストの統計情報
     */
    getStatistics(filePath) {
        const apps = this.extractAppsFromMarkdown(filePath);
        
        const numbers = apps.map(app => parseInt(app.number));
        const duplicates = this.findDuplicates(numbers);
        const gaps = this.findGaps(numbers);
        
        return {
            totalApps: apps.length,
            numbers: numbers.sort((a, b) => a - b),
            duplicates,
            gaps,
            range: numbers.length > 0 ? {
                min: Math.min(...numbers),
                max: Math.max(...numbers)
            } : null,
            apps: apps.map(app => ({
                number: app.number,
                title: app.title,
                lineNumber: app.lineNumber
            }))
        };
    }
    
    /**
     * 重複番号を検出
     */
    findDuplicates(numbers) {
        const seen = new Set();
        const duplicates = new Set();
        
        numbers.forEach(num => {
            if (seen.has(num)) {
                duplicates.add(num);
            } else {
                seen.add(num);
            }
        });
        
        return Array.from(duplicates);
    }
    
    /**
     * 番号の隙間を検出
     */
    findGaps(numbers) {
        if (numbers.length === 0) return [];
        
        const sorted = [...numbers].sort((a, b) => a - b);
        const gaps = [];
        
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            if (next - current > 1) {
                for (let gap = current + 1; gap < next; gap++) {
                    gaps.push(gap);
                }
            }
        }
        
        return gaps;
    }
    
    /**
     * 番号形式の検証
     */
    validateNumberFormat(number) {
        const num = parseInt(number);
        
        if (isNaN(num)) {
            return { valid: false, reason: 'Not a number' };
        }
        
        if (num < 1 || num > 99999999) {
            return { valid: false, reason: 'Number out of range (1-99999999)' };
        }
        
        const formatted = num.toString().padStart(8, '0');
        
        return {
            valid: true,
            formatted,
            original: number,
            numeric: num
        };
    }
    
    /**
     * フォールバック番号生成
     */
    generateFallbackNumber(filePath) {
        try {
            const stats = this.getStatistics(filePath);
            
            if (stats.totalApps === 0) {
                console.log('📱 No apps found, using 00000001');
                return '00000001';
            }
            
            // 最小の隙間を使用
            if (stats.gaps.length > 0) {
                const firstGap = stats.gaps[0].toString().padStart(8, '0');
                console.log(`📱 Using gap number: ${firstGap}`);
                return firstGap;
            }
            
            // 最大番号+1を使用
            const nextNumber = (stats.range.max + 1).toString().padStart(8, '0');
            console.log(`📱 Using next sequential number: ${nextNumber}`);
            return nextNumber;
            
        } catch (error) {
            console.warn('⚠️ Fallback number generation failed, using 99999999');
            return '99999999';
        }
    }
    
    /**
     * 安全な番号抽出（エラー処理込み）
     */
    safeExtractNumber(filePath, fallbackToFirst = true) {
        try {
            const highestPriority = this.getHighestPriorityApp(filePath);
            
            if (highestPriority) {
                return {
                    success: true,
                    number: highestPriority.number,
                    title: highestPriority.title,
                    method: 'highest_priority'
                };
            }
            
            if (fallbackToFirst) {
                console.warn('⚠️ No priority app found, trying first app...');
                const firstNumber = this.getFirstAppNumber(filePath);
                
                if (firstNumber) {
                    return {
                        success: true,
                        number: firstNumber,
                        title: 'First app found',
                        method: 'first_app'
                    };
                }
            }
            
            // 完全フォールバック
            const fallbackNumber = this.generateFallbackNumber(filePath);
            return {
                success: false,
                number: fallbackNumber,
                title: 'Generated fallback',
                method: 'fallback'
            };
            
        } catch (error) {
            console.error(`❌ Number extraction failed: ${error.message}`);
            return {
                success: false,
                number: '99999999',
                title: 'Error fallback',
                method: 'error_fallback',
                error: error.message
            };
        }
    }
}

// CLI インターフェース
if (require.main === module) {
    const extractor = new TitleNumberExtractor();
    const command = process.argv[2];
    
    switch (command) {
        case 'extract':
            const filePath = process.argv[3];
            if (!filePath) {
                console.error('Usage: node title-number-extractor.cjs extract <file-path>');
                process.exit(1);
            }
            
            const result = extractor.safeExtractNumber(filePath);
            console.log(JSON.stringify(result));
            break;
            
        case 'list':
            const listFilePath = process.argv[3];
            if (!listFilePath) {
                console.error('Usage: node title-number-extractor.cjs list <file-path>');
                process.exit(1);
            }
            
            const apps = extractor.extractAppsFromMarkdown(listFilePath);
            console.log(JSON.stringify(apps, null, 2));
            break;
            
        case 'stats':
            const statsFilePath = process.argv[3];
            if (!statsFilePath) {
                console.error('Usage: node title-number-extractor.cjs stats <file-path>');
                process.exit(1);
            }
            
            const stats = extractor.getStatistics(statsFilePath);
            console.log(JSON.stringify(stats, null, 2));
            break;
            
        case 'number':
            // wk-stコマンド用：番号のみを出力
            const numberFilePath = process.argv[3];
            if (!numberFilePath) {
                console.error('Usage: node title-number-extractor.cjs number <file-path>');
                process.exit(1);
            }
            
            const numberResult = extractor.safeExtractNumber(numberFilePath);
            console.log(numberResult.number);
            break;
            
        case 'validate':
            const number = process.argv[3];
            if (!number) {
                console.error('Usage: node title-number-extractor.cjs validate <number>');
                process.exit(1);
            }
            
            const validation = extractor.validateNumberFormat(number);
            console.log(JSON.stringify(validation, null, 2));
            break;
            
        default:
            console.log('Title Number Extractor Commands:');
            console.log('  extract <file-path>     - Extract highest priority app info');
            console.log('  list <file-path>        - List all numbered apps');
            console.log('  stats <file-path>       - Show statistics and analysis');
            console.log('  number <file-path>      - Get app number only (for wk-st)');
            console.log('  validate <number>       - Validate number format');
            console.log('\nSupported formats:');
            console.log('  ## (00000004) 時計アプリ');
            console.log('  ## [00000004] 時計アプリ');
            console.log('  ## 00000004. 時計アプリ');
            console.log('  ## 00000004: 時計アプリ');
            console.log('  ## 00000004 - 時計アプリ');
    }
}

module.exports = TitleNumberExtractor;