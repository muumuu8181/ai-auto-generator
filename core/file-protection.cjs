#!/usr/bin/env node

/**
 * 重要度別ファイル保護システム v1.0
 * [超重要L10][重要L7]等の表記に基づいてファイルの改変・削除を制御
 */

const fs = require('fs');
const path = require('path');

class FileProtection {
    constructor() {
        this.protectionLevels = {
            10: { name: '超重要', color: '🔴', protection: 'absolute', actions: ['append_only'] },
            9:  { name: '超重要', color: '🔴', protection: 'absolute', actions: ['append_only'] },
            8:  { name: '重要', color: '🟠', protection: 'strict', actions: ['confirm_backup'] },
            7:  { name: '重要', color: '🟠', protection: 'strict', actions: ['confirm_backup'] },
            6:  { name: '中重要', color: '🟡', protection: 'moderate', actions: ['confirm_reason'] },
            5:  { name: '中重要', color: '🟡', protection: 'moderate', actions: ['confirm_reason'] },
            4:  { name: '中重要', color: '🟡', protection: 'moderate', actions: ['confirm_reason'] },
            3:  { name: '低重要', color: '🟢', protection: 'minimal', actions: ['log_change'] },
            2:  { name: '低重要', color: '🟢', protection: 'minimal', actions: ['log_change'] },
            1:  { name: '低重要', color: '🟢', protection: 'minimal', actions: ['log_change'] },
            0:  { name: '無制限', color: '⚪', protection: 'none', actions: [] }
        };
        
        this.patterns = [
            /\[超重要L(\d+)\]/,
            /\[重要L(\d+)\]/,
            /\[中重要L(\d+)\]/,
            /\[低重要L(\d+)\]/,
            /\[L(\d+)\]/,
            /\[重要度(\d+)\]/
        ];
    }
    
    /**
     * ファイル名から重要度を抽出
     */
    extractImportanceLevel(fileName) {
        for (const pattern of this.patterns) {
            const match = fileName.match(pattern);
            if (match) {
                const level = parseInt(match[1]);
                return {
                    level,
                    levelInfo: this.protectionLevels[level] || this.protectionLevels[0],
                    pattern: pattern.source,
                    matchedText: match[0]
                };
            }
        }
        
        // 重要度表記がない場合のデフォルト
        return {
            level: 3,
            levelInfo: this.protectionLevels[3],
            pattern: 'default',
            matchedText: '(no marking)'
        };
    }
    
    /**
     * ファイル操作の許可チェック
     */
    checkOperationPermission(filePath, operation, options = {}) {
        const fileName = path.basename(filePath);
        const importance = this.extractImportanceLevel(fileName);
        const { level, levelInfo } = importance;
        
        console.log(`${levelInfo.color} Checking ${operation} on ${fileName} (L${level}: ${levelInfo.name})`);
        
        const result = {
            allowed: false,
            level,
            importance,
            operation,
            filePath,
            requirements: [],
            warnings: [],
            timestamp: new Date().toISOString()
        };
        
        switch (levelInfo.protection) {
            case 'absolute':
                result.allowed = this.checkAbsoluteProtection(operation, result);
                break;
                
            case 'strict':
                result.allowed = this.checkStrictProtection(operation, options, result);
                break;
                
            case 'moderate':
                result.allowed = this.checkModerateProtection(operation, options, result);
                break;
                
            case 'minimal':
                result.allowed = this.checkMinimalProtection(operation, options, result);
                break;
                
            case 'none':
                result.allowed = true;
                result.requirements.push('No restrictions');
                break;
        }
        
        this.logProtectionCheck(result);
        return result;
    }
    
    /**
     * 絶対保護（L9-10）
     */
    checkAbsoluteProtection(operation, result) {
        switch (operation) {
            case 'delete':
                result.warnings.push('🚫 DELETION ABSOLUTELY FORBIDDEN');
                return false;
                
            case 'modify':
            case 'overwrite':
                result.warnings.push('🚫 MODIFICATION ABSOLUTELY FORBIDDEN');
                result.requirements.push('Use append-only operations');
                return false;
                
            case 'append':
            case 'read':
                result.requirements.push('Append-only operation allowed');
                return true;
                
            default:
                result.warnings.push('🚫 UNKNOWN OPERATION NOT ALLOWED');
                return false;
        }
    }
    
    /**
     * 厳格保護（L7-8）
     */
    checkStrictProtection(operation, options, result) {
        switch (operation) {
            case 'delete':
                if (options.userConfirmed && options.backupCreated) {
                    result.requirements.push('✅ User confirmation + backup required');
                    return true;
                } else {
                    result.warnings.push('⚠️ User confirmation and backup required');
                    result.requirements.push('Require user confirmation');
                    result.requirements.push('Create backup before deletion');
                    return false;
                }
                
            case 'modify':
            case 'overwrite':
                if (options.backupCreated) {
                    result.requirements.push('✅ Backup created before modification');
                    return true;
                } else {
                    result.warnings.push('⚠️ Backup required before modification');
                    result.requirements.push('Create backup before modification');
                    return false;
                }
                
            case 'append':
            case 'read':
                return true;
                
            default:
                result.warnings.push('⚠️ Unknown operation - backup recommended');
                result.requirements.push('Create backup for unknown operation');
                return false;
        }
    }
    
    /**
     * 中程度保護（L4-6）
     */
    checkModerateProtection(operation, options, result) {
        switch (operation) {
            case 'delete':
            case 'modify':
            case 'overwrite':
                if (options.reasonProvided) {
                    result.requirements.push('✅ Reason provided for change');
                    return true;
                } else {
                    result.warnings.push('⚠️ Reason required for change');
                    result.requirements.push('Provide reason for change');
                    return false;
                }
                
            case 'append':
            case 'read':
                return true;
                
            default:
                result.requirements.push('Provide reason for unknown operation');
                return options.reasonProvided || false;
        }
    }
    
    /**
     * 最小保護（L1-3）
     */
    checkMinimalProtection(operation, options, result) {
        result.requirements.push('Log change for audit trail');
        
        // すべての操作を許可するが、ログ記録を要求
        switch (operation) {
            case 'delete':
                result.warnings.push('📝 Deletion will be logged');
                break;
                
            case 'modify':
            case 'overwrite':
                result.warnings.push('📝 Modification will be logged');
                break;
        }
        
        return true;
    }
    
    /**
     * バックアップ作成
     */
    createBackup(filePath, reason = '') {
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found for backup: ${filePath}`);
                return null;
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(path.dirname(filePath), '.backups');
            const backupFileName = `${path.basename(filePath)}.backup.${timestamp}`;
            const backupPath = path.join(backupDir, backupFileName);
            
            // バックアップディレクトリ作成
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            // ファイルコピー
            fs.copyFileSync(filePath, backupPath);
            
            // メタデータ作成
            const metadataPath = backupPath + '.meta.json';
            const metadata = {
                originalPath: filePath,
                backupPath,
                timestamp: new Date().toISOString(),
                reason,
                fileSize: fs.statSync(filePath).size,
                originalModified: fs.statSync(filePath).mtime
            };
            
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            
            console.log(`💾 Backup created: ${backupPath}`);
            return backupPath;
            
        } catch (error) {
            console.error(`❌ Backup creation failed:`, error.message);
            return null;
        }
    }
    
    /**
     * 安全な削除（保護レベルチェック付き）
     */
    safeDelete(filePath, options = {}) {
        const permission = this.checkOperationPermission(filePath, 'delete', options);
        
        if (!permission.allowed) {
            console.error(`🚫 Deletion blocked: ${filePath}`);
            console.error(`Requirements: ${permission.requirements.join(', ')}`);
            return false;
        }
        
        // 高重要度ファイルはバックアップを作成
        if (permission.level >= 7) {
            const backupPath = this.createBackup(filePath, 'Pre-deletion backup');
            if (!backupPath) {
                console.error(`❌ Could not create backup, aborting deletion`);
                return false;
            }
        }
        
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ File safely deleted: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ Deletion failed:`, error.message);
            return false;
        }
    }
    
    /**
     * 安全な修正（保護レベルチェック付き）
     */
    safeModify(filePath, newContent, options = {}) {
        const permission = this.checkOperationPermission(filePath, 'modify', options);
        
        if (!permission.allowed) {
            console.error(`🚫 Modification blocked: ${filePath}`);
            console.error(`Requirements: ${permission.requirements.join(', ')}`);
            return false;
        }
        
        // 中重要度以上はバックアップを作成
        if (permission.level >= 4) {
            const backupPath = this.createBackup(filePath, 'Pre-modification backup');
            if (!backupPath && permission.level >= 7) {
                console.error(`❌ Could not create required backup, aborting modification`);
                return false;
            }
        }
        
        try {
            fs.writeFileSync(filePath, newContent);
            console.log(`✅ File safely modified: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ Modification failed:`, error.message);
            return false;
        }
    }
    
    /**
     * ディレクトリ内のファイル保護状況をスキャン
     */
    scanDirectory(dirPath) {
        const results = {
            scannedAt: new Date().toISOString(),
            directory: dirPath,
            files: [],
            summary: {
                total: 0,
                byLevel: {},
                highlyProtected: 0,
                unprotected: 0
            }
        };
        
        try {
            const files = fs.readdirSync(dirPath, { recursive: true });
            
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isFile()) {
                    const importance = this.extractImportanceLevel(file);
                    const fileInfo = {
                        path: filePath,
                        name: file,
                        level: importance.level,
                        levelInfo: importance.levelInfo,
                        matchedText: importance.matchedText,
                        size: stat.size,
                        modified: stat.mtime
                    };
                    
                    results.files.push(fileInfo);
                    results.summary.total++;
                    
                    if (!results.summary.byLevel[importance.level]) {
                        results.summary.byLevel[importance.level] = 0;
                    }
                    results.summary.byLevel[importance.level]++;
                    
                    if (importance.level >= 7) {
                        results.summary.highlyProtected++;
                    } else if (importance.level <= 3) {
                        results.summary.unprotected++;
                    }
                }
            });
            
        } catch (error) {
            console.error(`❌ Directory scan failed:`, error.message);
        }
        
        return results;
    }
    
    /**
     * 保護チェックのログ記録
     */
    logProtectionCheck(result) {
        const logEntry = {
            timestamp: result.timestamp,
            operation: result.operation,
            file: path.basename(result.filePath),
            level: result.level,
            allowed: result.allowed,
            requirements: result.requirements,
            warnings: result.warnings
        };
        
        // 簡易ログ出力
        const statusIcon = result.allowed ? '✅' : '🚫';
        const levelIcon = result.importance.levelInfo.color;
        console.log(`${statusIcon} ${levelIcon} ${result.operation} ${path.basename(result.filePath)} (L${result.level})`);
        
        if (!result.allowed && result.requirements.length > 0) {
            console.log(`   Requirements: ${result.requirements.join(', ')}`);
        }
    }
    
    /**
     * 保護設定の表示
     */
    showProtectionLevels() {
        console.log('\n📋 File Protection Levels:');
        
        Object.entries(this.protectionLevels).reverse().forEach(([level, info]) => {
            console.log(`${info.color} L${level}: ${info.name} (${info.protection})`);
            if (info.actions.length > 0) {
                console.log(`   Required actions: ${info.actions.join(', ')}`);
            }
        });
        
        console.log('\n📝 Supported patterns:');
        this.patterns.forEach(pattern => {
            console.log(`   ${pattern.source}`);
        });
    }
}

// CLI インターフェース
if (require.main === module) {
    const protection = new FileProtection();
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            const filePath = process.argv[3];
            const operation = process.argv[4] || 'read';
            
            if (!filePath) {
                console.error('Usage: node file-protection.cjs check <file-path> [operation]');
                process.exit(1);
            }
            
            const result = protection.checkOperationPermission(filePath, operation);
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.allowed ? 0 : 1);
            break;
            
        case 'scan':
            const dirPath = process.argv[3] || '.';
            const scanResult = protection.scanDirectory(dirPath);
            console.log(JSON.stringify(scanResult, null, 2));
            break;
            
        case 'backup':
            const backupFilePath = process.argv[3];
            const reason = process.argv[4] || 'Manual backup';
            
            if (!backupFilePath) {
                console.error('Usage: node file-protection.cjs backup <file-path> [reason]');
                process.exit(1);
            }
            
            const backupPath = protection.createBackup(backupFilePath, reason);
            console.log(backupPath || 'Backup failed');
            break;
            
        case 'safe-delete':
            const deleteFilePath = process.argv[3];
            
            if (!deleteFilePath) {
                console.error('Usage: node file-protection.cjs safe-delete <file-path>');
                process.exit(1);
            }
            
            const deleted = protection.safeDelete(deleteFilePath, { 
                userConfirmed: true, 
                backupCreated: true 
            });
            process.exit(deleted ? 0 : 1);
            break;
            
        case 'levels':
            protection.showProtectionLevels();
            break;
            
        default:
            console.log('File Protection System Commands:');
            console.log('  check <file> [operation]  - Check operation permission');
            console.log('  scan [directory]          - Scan directory for protection levels');
            console.log('  backup <file> [reason]    - Create backup with metadata');
            console.log('  safe-delete <file>        - Safely delete with protection checks');
            console.log('  levels                    - Show protection level definitions');
            console.log('\nOperations: read, append, modify, overwrite, delete');
            console.log('\nExample:');
            console.log('  node file-protection.cjs check VERSION.md delete');
            console.log('  node file-protection.cjs scan ./core');
    }
}

module.exports = FileProtection;