#!/usr/bin/env node

/**
 * アプリタイプ別番号管理システム v1.0
 * 同じアプリタイプには同じ番号を割り当て、AI競合を防ぐ
 */

const fs = require('fs');
const path = require('path');

class AppTypeManager {
    constructor() {
        this.registryPath = './app-type-registry.json';
        this.defaultRegistry = this.getDefaultRegistry();
        this.ensureRegistry();
    }
    
    /**
     * デフォルトのアプリタイプレジストリ
     */
    getDefaultRegistry() {
        return {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            appTypes: {
                // ユーティリティ系 (001-020)
                "calculator": { number: "001", description: "計算機・電卓アプリ", keywords: ["計算", "電卓", "calculator", "math"] },
                "timer": { number: "002", description: "タイマー・ストップウォッチ", keywords: ["タイマー", "timer", "ストップウォッチ", "stopwatch"] },
                "notepad": { number: "003", description: "メモ帳・ノート", keywords: ["メモ", "note", "notepad", "text"] },
                "clock": { number: "004", description: "時計・アラーム", keywords: ["時計", "clock", "アラーム", "alarm", "時間"] },
                "money": { number: "005", description: "お金管理・家計簿", keywords: ["お金", "money", "家計簿", "収支", "expense"] },
                
                // エンターテイメント系 (021-040)
                "game": { number: "021", description: "ゲーム・パズル", keywords: ["ゲーム", "game", "パズル", "puzzle"] },
                "music": { number: "022", description: "音楽・オーディオ", keywords: ["音楽", "music", "audio", "sound"] },
                "drawing": { number: "023", description: "お絵描き・ペイント", keywords: ["絵", "drawing", "paint", "canvas", "描画"] },
                "quiz": { number: "024", description: "クイズ・問題集", keywords: ["クイズ", "quiz", "問題", "テスト"] },
                
                // 生産性系 (041-060)
                "todo": { number: "041", description: "TODO・タスク管理", keywords: ["todo", "task", "タスク", "やること"] },
                "calendar": { number: "042", description: "カレンダー・スケジュール", keywords: ["カレンダー", "calendar", "スケジュール", "予定"] },
                "reminder": { number: "043", description: "リマインダー・通知", keywords: ["リマインダー", "reminder", "通知", "alert"] },
                "habit": { number: "044", description: "習慣・ルーチン管理", keywords: ["習慣", "habit", "ルーチン", "routine"] },
                
                // ビジネス系 (061-080)
                "presentation": { number: "061", description: "プレゼンテーション", keywords: ["プレゼン", "presentation", "slide", "発表"] },
                "chart": { number: "062", description: "チャート・グラフ", keywords: ["チャート", "chart", "グラフ", "graph"] },
                "invoice": { number: "063", description: "請求書・見積書", keywords: ["請求", "invoice", "見積", "estimate"] },
                
                // その他・実験系 (081-099)
                "experimental": { number: "081", description: "実験的・その他", keywords: ["実験", "experimental", "test", "その他"] },
                "demo": { number: "082", description: "デモ・サンプル", keywords: ["デモ", "demo", "sample", "example"] },
                "educational": { number: "083", description: "教育・学習", keywords: ["教育", "education", "学習", "learning"] },
                
                // 特殊用途 (100-)
                "unknown": { number: "999", description: "分類不可能", keywords: [] }
            },
            statistics: {
                totalAppsCreated: 0,
                typeDistribution: {},
                lastUsed: null
            }
        };
    }
    
    /**
     * レジストリファイルの確保
     */
    ensureRegistry() {
        if (!fs.existsSync(this.registryPath)) {
            this.saveRegistry(this.defaultRegistry);
            console.log(`📋 Created app type registry: ${this.registryPath}`);
        }
    }
    
    /**
     * レジストリの読み込み
     */
    loadRegistry() {
        try {
            const data = fs.readFileSync(this.registryPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.warn('⚠️ Failed to load registry, using defaults');
            return this.defaultRegistry;
        }
    }
    
    /**
     * レジストリの保存
     */
    saveRegistry(registry) {
        try {
            fs.writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
        } catch (error) {
            console.error('❌ Failed to save registry:', error.message);
        }
    }
    
    /**
     * アプリタイプの判定
     */
    detectAppType(requirements, appName = '') {
        const registry = this.loadRegistry();
        const text = `${requirements} ${appName}`.toLowerCase();
        
        console.log(`🔍 Analyzing text: "${text.substring(0, 100)}..."`);
        
        // キーワードマッチングでアプリタイプを判定
        let bestMatch = 'unknown';
        let maxScore = 0;
        
        for (const [typeId, typeInfo] of Object.entries(registry.appTypes)) {
            if (typeId === 'unknown') continue;
            
            let score = 0;
            for (const keyword of typeInfo.keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    // より具体的なキーワードほど高得点
                    score += keyword.length > 4 ? 3 : 1;
                }
            }
            
            if (score > maxScore) {
                maxScore = score;
                bestMatch = typeId;
            }
        }
        
        // 最低スコアに達しない場合は unknown
        if (maxScore < 1) {
            bestMatch = 'unknown';
        }
        
        const detectedType = registry.appTypes[bestMatch];
        console.log(`🎯 Detected app type: ${bestMatch} (${detectedType.description}) - Score: ${maxScore}`);
        
        return {
            typeId: bestMatch,
            number: detectedType.number,
            description: detectedType.description,
            confidence: Math.min(maxScore * 10, 100) // 0-100のスコア
        };
    }
    
    /**
     * アプリ番号の取得（メイン機能）
     */
    getAppNumber(requirements, appName = '') {
        const detection = this.detectAppType(requirements, appName);
        
        // 統計更新
        this.updateStatistics(detection.typeId);
        
        console.log(`📱 Assigned app number: ${detection.number} (${detection.description})`);
        console.log(`🎯 Confidence: ${detection.confidence}%`);
        
        return {
            number: detection.number,
            typeId: detection.typeId,
            description: detection.description,
            confidence: detection.confidence
        };
    }
    
    /**
     * 統計情報の更新
     */
    updateStatistics(typeId) {
        const registry = this.loadRegistry();
        
        registry.statistics.totalAppsCreated++;
        registry.statistics.lastUsed = new Date().toISOString();
        
        if (!registry.statistics.typeDistribution[typeId]) {
            registry.statistics.typeDistribution[typeId] = 0;
        }
        registry.statistics.typeDistribution[typeId]++;
        
        this.saveRegistry(registry);
    }
    
    /**
     * 手動でアプリタイプを指定
     */
    setAppType(typeId) {
        const registry = this.loadRegistry();
        
        if (!registry.appTypes[typeId]) {
            throw new Error(`Unknown app type: ${typeId}`);
        }
        
        const typeInfo = registry.appTypes[typeId];
        this.updateStatistics(typeId);
        
        console.log(`📱 Manual assignment: ${typeInfo.number} (${typeInfo.description})`);
        
        return {
            number: typeInfo.number,
            typeId: typeId,
            description: typeInfo.description,
            confidence: 100
        };
    }
    
    /**
     * 利用可能なアプリタイプ一覧
     */
    listAppTypes() {
        const registry = this.loadRegistry();
        return registry.appTypes;
    }
    
    /**
     * 統計情報の表示
     */
    showStatistics() {
        const registry = this.loadRegistry();
        const stats = registry.statistics;
        
        console.log('\n📊 App Type Statistics:');
        console.log(`   Total Apps Created: ${stats.totalAppsCreated}`);
        console.log(`   Last Used: ${stats.lastUsed || 'Never'}`);
        console.log('\n📈 Type Distribution:');
        
        const sortedTypes = Object.entries(stats.typeDistribution)
            .sort(([,a], [,b]) => b - a);
            
        for (const [typeId, count] of sortedTypes) {
            const typeInfo = registry.appTypes[typeId];
            const percentage = ((count / stats.totalAppsCreated) * 100).toFixed(1);
            console.log(`   ${typeInfo.number}: ${typeInfo.description} - ${count} apps (${percentage}%)`);
        }
    }
    
    /**
     * システム健全性チェック
     */
    healthCheck() {
        const registry = this.loadRegistry();
        const issues = [];
        
        // 重複番号チェック
        const numbers = new Set();
        for (const [typeId, typeInfo] of Object.entries(registry.appTypes)) {
            if (numbers.has(typeInfo.number)) {
                issues.push(`Duplicate number: ${typeInfo.number} (${typeId})`);
            }
            numbers.add(typeInfo.number);
        }
        
        // レジストリファイルの書き込み権限チェック
        try {
            const testPath = this.registryPath + '.test';
            fs.writeFileSync(testPath, 'test');
            fs.unlinkSync(testPath);
        } catch (error) {
            issues.push(`Registry write permission issue: ${error.message}`);
        }
        
        if (issues.length === 0) {
            console.log('✅ App Type Manager health check passed');
            return true;
        } else {
            console.log('❌ App Type Manager health check failed:');
            issues.forEach(issue => console.log(`   - ${issue}`));
            return false;
        }
    }
    
    /**
     * 外部リポジトリ用のレジストリを生成
     */
    generateExternalRegistry() {
        const registry = this.loadRegistry();
        
        // 簡略版レジストリ（外部公開用）
        const externalRegistry = {
            version: registry.version,
            lastUpdated: new Date().toISOString(),
            appTypes: {},
            next_available_id: "001", // 従来システムとの互換性
            statistics: {
                totalTypes: Object.keys(registry.appTypes).length,
                lastUpdate: new Date().toISOString()
            }
        };
        
        // 番号と説明のみを公開
        for (const [typeId, typeInfo] of Object.entries(registry.appTypes)) {
            externalRegistry.appTypes[typeId] = {
                number: typeInfo.number,
                description: typeInfo.description
            };
        }
        
        return externalRegistry;
    }
}

// CLI インターフェース
if (require.main === module) {
    const manager = new AppTypeManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'detect':
            const requirements = process.argv[3] || '';
            const appName = process.argv[4] || '';
            const result = manager.getAppNumber(requirements, appName);
            console.log(JSON.stringify(result));
            break;
            
        case 'manual':
            const typeId = process.argv[3];
            if (!typeId) {
                console.error('Usage: node app-type-manager.cjs manual <type-id>');
                process.exit(1);
            }
            try {
                const manualResult = manager.setAppType(typeId);
                console.log(JSON.stringify(manualResult));
            } catch (error) {
                console.error(`❌ ${error.message}`);
                process.exit(1);
            }
            break;
            
        case 'list':
            const types = manager.listAppTypes();
            console.log('\n📱 Available App Types:');
            for (const [typeId, typeInfo] of Object.entries(types)) {
                console.log(`   ${typeInfo.number}: ${typeId} - ${typeInfo.description}`);
                if (typeInfo.keywords.length > 0) {
                    console.log(`      Keywords: ${typeInfo.keywords.join(', ')}`);
                }
            }
            break;
            
        case 'stats':
            manager.showStatistics();
            break;
            
        case 'health':
            const healthy = manager.healthCheck();
            process.exit(healthy ? 0 : 1);
            break;
            
        case 'export':
            const external = manager.generateExternalRegistry();
            console.log(JSON.stringify(external, null, 2));
            break;
            
        case 'number':
            // 要件からアプリ番号のみを取得（wk-stコマンド用）
            const req = process.argv[3] || '';
            const name = process.argv[4] || '';
            const numberResult = manager.getAppNumber(req, name);
            console.log(numberResult.number);
            break;
            
        default:
            console.log('App Type Manager Commands:');
            console.log('  detect <requirements> [app-name]  - Detect app type and get number');
            console.log('  manual <type-id>                  - Manually assign app type');
            console.log('  list                             - List all available app types');
            console.log('  stats                            - Show usage statistics');
            console.log('  health                           - Run health check');
            console.log('  export                           - Generate external registry');
            console.log('  number <requirements> [app-name] - Get app number only (for wk-st)');
            console.log('\nExample:');
            console.log('  node app-type-manager.cjs detect "時計アプリを作りたい" "時計"');
            console.log('  node app-type-manager.cjs manual clock');
    }
}

module.exports = AppTypeManager;