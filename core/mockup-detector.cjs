#!/usr/bin/env node

/**
 * ハリボテ（疑似実装）検出・警告システム v1.0
 * AIの自己申告に基づいてハリボテ警告を表示
 */

const fs = require('fs');
const path = require('path');

class MockupDetector {
    constructor() {
        this.mockupKeywords = [
            'mockup', 'mock', 'dummy', 'fake', 'pseudo', 'simulation',
            'ハリボテ', '疑似', 'デモ', 'サンプル', '偽', 'フェイク'
        ];
    }
    
    /**
     * ハリボテ警告HTMLを生成
     */
    generateWarningBanner(type = 'mockup', customMessage = '') {
        const warnings = {
            mockup: '⚠️ これは疑似実装です - This is a Mockup Implementation',
            demo: '🎭 これはデモ版です - This is a Demo Version',
            simulation: '🔬 これはシミュレーションです - This is a Simulation',
            sample: '📝 これはサンプルです - This is a Sample',
            fake: '🚫 これは偽物です - This is a Fake Implementation'
        };
        
        const message = customMessage || warnings[type] || warnings.mockup;
        
        return `<!-- MOCKUP WARNING BANNER -->
<div id="mockup-warning-banner" style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(135deg, #ff6b6b, #ffa500);
    color: white;
    text-align: center;
    padding: 12px 20px;
    font-family: 'Arial', sans-serif;
    font-weight: bold;
    font-size: 16px;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    border-bottom: 3px solid #d63031;
    animation: pulse 2s infinite;
">
    ${message}
    <button onclick="this.parentElement.style.display='none'" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid white;
        color: white;
        padding: 4px 8px;
        margin-left: 15px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
    ">×</button>
</div>
<style>
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
}
body {
    margin-top: 60px !important;
}
</style>
<!-- END MOCKUP WARNING BANNER -->

`;
    }
    
    /**
     * HTMLファイルにハリボテ警告を挿入
     */
    addWarningToHtml(filePath, warningType = 'mockup', customMessage = '') {
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                return false;
            }
            
            let content = fs.readFileSync(filePath, 'utf8');
            
            // 既に警告が挿入されているかチェック
            if (content.includes('mockup-warning-banner')) {
                console.log('✅ Warning banner already exists in HTML');
                return true;
            }
            
            const warningHtml = this.generateWarningBanner(warningType, customMessage);
            
            // <body> タグの直後に挿入
            if (content.includes('<body>')) {
                content = content.replace('<body>', '<body>' + warningHtml);
            } else if (content.includes('<body ')) {
                // <body class="..."> などの場合
                content = content.replace(/(<body[^>]*>)/, '$1' + warningHtml);
            } else {
                // bodyタグがない場合、HTMLの先頭に挿入
                console.warn('⚠️ No <body> tag found, adding to HTML start');
                content = warningHtml + content;
            }
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ Warning banner added to: ${filePath}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to add warning to ${filePath}:`, error.message);
            return false;
        }
    }
    
    /**
     * アプリケーション全体にハリボテ警告を適用
     */
    markAsMockup(appPath, warningType = 'mockup', customMessage = '') {
        try {
            console.log(`🚨 Marking app as ${warningType}: ${appPath}`);
            
            // HTMLファイルを検索
            const htmlFiles = this.findHtmlFiles(appPath);
            
            if (htmlFiles.length === 0) {
                console.warn('⚠️ No HTML files found in app directory');
                return false;
            }
            
            let success = true;
            htmlFiles.forEach(htmlFile => {
                const added = this.addWarningToHtml(htmlFile, warningType, customMessage);
                if (!added) success = false;
            });
            
            // メタデータファイルを作成
            this.createMockupMetadata(appPath, warningType, customMessage, htmlFiles);
            
            return success;
            
        } catch (error) {
            console.error(`❌ Failed to mark app as mockup:`, error.message);
            return false;
        }
    }
    
    /**
     * HTMLファイルを再帰的に検索
     */
    findHtmlFiles(dirPath) {
        const htmlFiles = [];
        
        try {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                const fullPath = path.join(dirPath, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // 再帰的に検索
                    htmlFiles.push(...this.findHtmlFiles(fullPath));
                } else if (file.endsWith('.html') || file.endsWith('.htm')) {
                    htmlFiles.push(fullPath);
                }
            });
            
        } catch (error) {
            console.warn(`⚠️ Could not read directory ${dirPath}:`, error.message);
        }
        
        return htmlFiles;
    }
    
    /**
     * ハリボテメタデータファイルを作成
     */
    createMockupMetadata(appPath, warningType, customMessage, htmlFiles) {
        const metadata = {
            isMockup: true,
            warningType,
            customMessage,
            markedAt: new Date().toISOString(),
            modifiedFiles: htmlFiles,
            warningDetails: {
                reason: "AI self-declared mockup implementation",
                displayWarning: true,
                allowRemoval: true
            }
        };
        
        const metadataPath = path.join(appPath, '.mockup-info.json');
        
        try {
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            console.log(`✅ Mockup metadata saved: ${metadataPath}`);
        } catch (error) {
            console.error(`❌ Failed to save metadata:`, error.message);
        }
    }
    
    /**
     * ハリボテ判定（自動検出）
     */
    detectMockupFromContent(content) {
        const lowerContent = content.toLowerCase();
        const detected = [];
        
        this.mockupKeywords.forEach(keyword => {
            if (lowerContent.includes(keyword)) {
                detected.push(keyword);
            }
        });
        
        return {
            isMockup: detected.length > 0,
            keywords: detected,
            confidence: Math.min(detected.length * 20, 100)
        };
    }
    
    /**
     * アプリからハリボテ警告を削除
     */
    removeWarnings(appPath) {
        try {
            const htmlFiles = this.findHtmlFiles(appPath);
            
            htmlFiles.forEach(htmlFile => {
                let content = fs.readFileSync(htmlFile, 'utf8');
                
                // 警告バナーを削除
                content = content.replace(/<!-- MOCKUP WARNING BANNER -->[\s\S]*?<!-- END MOCKUP WARNING BANNER -->/g, '');
                
                // body margin調整のCSSを削除
                content = content.replace(/body\s*{\s*margin-top:\s*60px\s*!important;\s*}/g, '');
                
                fs.writeFileSync(htmlFile, content);
                console.log(`✅ Warning removed from: ${htmlFile}`);
            });
            
            // メタデータファイルを削除
            const metadataPath = path.join(appPath, '.mockup-info.json');
            if (fs.existsSync(metadataPath)) {
                fs.unlinkSync(metadataPath);
                console.log(`✅ Mockup metadata removed: ${metadataPath}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to remove warnings:`, error.message);
            return false;
        }
    }
    
    /**
     * アプリのハリボテ状態をチェック
     */
    checkMockupStatus(appPath) {
        const metadataPath = path.join(appPath, '.mockup-info.json');
        
        if (fs.existsSync(metadataPath)) {
            try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                return {
                    isMockup: true,
                    metadata
                };
            } catch (error) {
                console.warn('⚠️ Could not read mockup metadata');
            }
        }
        
        return { isMockup: false, metadata: null };
    }
}

// CLI インターフェース
if (require.main === module) {
    const detector = new MockupDetector();
    const command = process.argv[2];
    
    switch (command) {
        case 'mark':
            const appPath = process.argv[3];
            const warningType = process.argv[4] || 'mockup';
            const customMessage = process.argv[5] || '';
            
            if (!appPath) {
                console.error('Usage: node mockup-detector.cjs mark <app-path> [warning-type] [custom-message]');
                process.exit(1);
            }
            
            const success = detector.markAsMockup(appPath, warningType, customMessage);
            process.exit(success ? 0 : 1);
            break;
            
        case 'remove':
            const removeAppPath = process.argv[3];
            
            if (!removeAppPath) {
                console.error('Usage: node mockup-detector.cjs remove <app-path>');
                process.exit(1);
            }
            
            const removed = detector.removeWarnings(removeAppPath);
            process.exit(removed ? 0 : 1);
            break;
            
        case 'check':
            const checkAppPath = process.argv[3];
            
            if (!checkAppPath) {
                console.error('Usage: node mockup-detector.cjs check <app-path>');
                process.exit(1);
            }
            
            const status = detector.checkMockupStatus(checkAppPath);
            console.log(JSON.stringify(status, null, 2));
            break;
            
        case 'detect':
            const content = process.argv[3] || '';
            const detection = detector.detectMockupFromContent(content);
            console.log(JSON.stringify(detection, null, 2));
            break;
            
        case 'banner':
            const bannerType = process.argv[3] || 'mockup';
            const bannerMessage = process.argv[4] || '';
            console.log(detector.generateWarningBanner(bannerType, bannerMessage));
            break;
            
        default:
            console.log('Mockup Detector Commands:');
            console.log('  mark <app-path> [type] [message]  - Mark app as mockup with warning');
            console.log('  remove <app-path>                - Remove mockup warnings');
            console.log('  check <app-path>                 - Check mockup status');
            console.log('  detect <content>                 - Detect mockup from content');
            console.log('  banner [type] [message]          - Generate warning banner HTML');
            console.log('\nWarning Types: mockup, demo, simulation, sample, fake');
            console.log('\nExample:');
            console.log('  node mockup-detector.cjs mark ./app-004-abc123 mockup');
            console.log('  node mockup-detector.cjs check ./app-004-abc123');
    }
}

module.exports = MockupDetector;