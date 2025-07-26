#!/usr/bin/env node

/**
 * Worker AI品質検証システム v1.0
 * Gemini CLI提案による3段階検証アーキテクチャ実装
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WorkerQualityValidator {
    constructor(sessionId = 'quality-validator', useUnifiedLogging = true) {
        this.sessionId = sessionId;
        this.projectRoot = path.dirname(__dirname);
        this.useUnifiedLogging = useUnifiedLogging;
        this.unifiedLogger = null;
        
        // 統合ログ機能初期化
        if (this.useUnifiedLogging) {
            try {
                const UnifiedLogger = require('./unified-logger.cjs');
                this.unifiedLogger = new UnifiedLogger(sessionId);
            } catch (error) {
                console.warn('⚠️ Unified logging not available');
                this.useUnifiedLogging = false;
            }
        }
    }

    /**
     * Phase 0: 環境検証フェーズ（作業開始前の前提条件チェック）
     */
    async validateEnvironment() {
        console.log('🔍 Phase 0: 環境検証フェーズ開始');
        
        const validation = {
            phase: 'environment',
            startTime: new Date().toISOString(),
            checks: [],
            issues: [],
            criticalFailures: [],
            recommendations: [],
            canProceed: true
        };

        try {
            // 1. Git設定検証
            const gitCheck = await this.validateGitConfiguration();
            validation.checks.push(gitCheck);
            if (!gitCheck.passed) validation.issues.push(...gitCheck.issues);

            // 2. リポジトリURL検証
            const repoCheck = await this.validateRepositoryUrl();
            validation.checks.push(repoCheck);
            if (!repoCheck.passed) validation.issues.push(...repoCheck.issues);

            // 3. 必須ツール存在確認
            const toolsCheck = await this.validateRequiredTools();
            validation.checks.push(toolsCheck);
            if (!toolsCheck.passed) validation.issues.push(...toolsCheck.issues);

            // 4. ワーキングディレクトリ整合性
            const workdirCheck = await this.validateWorkingDirectory();
            validation.checks.push(workdirCheck);
            if (!workdirCheck.passed) validation.issues.push(...workdirCheck.issues);

            // Critical failures判定
            validation.criticalFailures = validation.issues.filter(issue => issue.severity === 'critical');
            validation.canProceed = validation.criticalFailures.length === 0;

            this.log('environment_validation', 'Environment validation completed', {
                totalChecks: validation.checks.length,
                issues: validation.issues.length,
                criticalFailures: validation.criticalFailures.length,
                canProceed: validation.canProceed
            });

            this.displayValidationResults(validation, 'Environment');
            return validation;

        } catch (error) {
            validation.error = error.message;
            validation.canProceed = false;
            
            this.log('environment_validation_error', 'Environment validation failed', {
                error: error.message
            });

            return validation;
        }
    }

    /**
     * Git設定検証・自動修正
     */
    async validateGitConfiguration() {
        const check = {
            name: 'Git Configuration',
            startTime: new Date().toISOString(),
            passed: false,
            issues: [],
            autoFixed: false
        };

        try {
            const correctName = 'AI Auto Generator';
            const correctEmail = 'ai@muumuu8181.com';

            let currentName = '';
            let currentEmail = '';

            try {
                currentName = execSync('git config user.name', { encoding: 'utf8', cwd: this.projectRoot }).trim();
            } catch (error) {
                currentName = '';
            }

            try {
                currentEmail = execSync('git config user.email', { encoding: 'utf8', cwd: this.projectRoot }).trim();
            } catch (error) {
                currentEmail = '';
            }

            const nameIncorrect = currentName !== correctName;
            const emailIncorrect = currentEmail !== correctEmail;

            if (nameIncorrect || emailIncorrect) {
                // 自動修正実行
                try {
                    execSync(`git config user.name "${correctName}"`, { cwd: this.projectRoot });
                    execSync(`git config user.email "${correctEmail}"`, { cwd: this.projectRoot });
                    
                    check.autoFixed = true;
                    check.passed = true;
                    
                    check.issues.push({
                        type: 'git_config_corrected',
                        severity: 'medium',
                        description: 'Git設定を自動修正しました',
                        details: {
                            previous: { name: currentName, email: currentEmail },
                            corrected: { name: correctName, email: correctEmail }
                        }
                    });

                    console.log(`⚠️ Git設定自動修正: ${currentName} <${currentEmail}> → ${correctName} <${correctEmail}>`);

                } catch (fixError) {
                    check.issues.push({
                        type: 'git_config_fix_failed',
                        severity: 'critical',
                        description: 'Git設定の自動修正に失敗',
                        error: fixError.message
                    });
                }
            } else {
                check.passed = true;
                console.log(`✅ Git設定正常: ${currentName} <${currentEmail}>`);
            }

        } catch (error) {
            check.issues.push({
                type: 'git_config_check_failed',
                severity: 'critical',
                description: 'Git設定の確認に失敗',
                error: error.message
            });
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * リポジトリURL検証
     */
    async validateRepositoryUrl() {
        const check = {
            name: 'Repository URL',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        try {
            const currentRepoUrl = execSync('git remote get-url origin', { 
                encoding: 'utf8', 
                cwd: this.projectRoot 
            }).trim();

            // ai-auto-generatorリポジトリであることを確認
            if (currentRepoUrl.includes('ai-auto-generator')) {
                check.passed = true;
                console.log(`✅ リポジトリURL正常: ${currentRepoUrl}`);
            } else {
                check.issues.push({
                    type: 'incorrect_repository',
                    severity: 'critical',
                    description: '間違ったリポジトリで作業しています',
                    currentUrl: currentRepoUrl,
                    expectedPattern: '*ai-auto-generator*'
                });
                console.log(`❌ 間違ったリポジトリ: ${currentRepoUrl}`);
            }

        } catch (error) {
            check.issues.push({
                type: 'repo_url_check_failed',
                severity: 'high',
                description: 'リポジトリURL確認に失敗',
                error: error.message
            });
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 必須ツール存在確認
     */
    async validateRequiredTools() {
        const check = {
            name: 'Required Tools',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        const requiredCommands = ['node', 'git', 'jq'];
        let allToolsPresent = true;

        requiredCommands.forEach(command => {
            try {
                execSync(`which ${command}`, { encoding: 'utf8' });
                console.log(`✅ ${command}: 利用可能`);
            } catch (error) {
                allToolsPresent = false;
                check.issues.push({
                    type: 'missing_tool',
                    severity: 'critical',
                    description: `必須コマンドが見つかりません: ${command}`,
                    command
                });
                console.log(`❌ ${command}: 見つかりません`);
            }
        });

        check.passed = allToolsPresent;
        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * ワーキングディレクトリ整合性確認
     */
    async validateWorkingDirectory() {
        const check = {
            name: 'Working Directory',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        try {
            const currentDir = process.cwd();
            const expectedPattern = 'ai-auto-generator';

            if (currentDir.includes(expectedPattern)) {
                check.passed = true;
                console.log(`✅ ワーキングディレクトリ正常: ${currentDir}`);
            } else {
                check.issues.push({
                    type: 'incorrect_working_directory',
                    severity: 'high',
                    description: 'ai-auto-generatorディレクトリ外で実行されています',
                    currentDir,
                    expectedPattern
                });
                console.log(`⚠️ ワーキングディレクトリ注意: ${currentDir}`);
            }

            // 不要な一時ファイル確認
            const tempDirs = ['temp-deploy', 'temp-req'];
            tempDirs.forEach(tempDir => {
                const tempPath = path.join(this.projectRoot, tempDir);
                if (fs.existsSync(tempPath)) {
                    check.issues.push({
                        type: 'temp_files_remaining',
                        severity: 'medium',
                        description: `一時ディレクトリが残存: ${tempDir}`,
                        path: tempPath,
                        recommendation: `rm -rf ${tempPath}`
                    });
                    console.log(`⚠️ 一時ファイル残存: ${tempDir}`);
                }
            });

        } catch (error) {
            check.issues.push({
                type: 'workdir_check_failed',
                severity: 'medium',
                description: 'ワーキングディレクトリ確認に失敗',
                error: error.message
            });
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 各Phase完了後の自己診断チェック
     */
    async validatePhaseCompletion(phaseNumber, phaseDescription, expectedOutcomes = []) {
        console.log(`🔍 Phase ${phaseNumber}完了後検証: ${phaseDescription}`);
        
        const validation = {
            phase: `phase_${phaseNumber}`,
            phaseDescription,
            startTime: new Date().toISOString(),
            checks: [],
            issues: [],
            canProceed: true
        };

        try {
            // 期待される成果物の確認
            for (const outcome of expectedOutcomes) {
                const outcomeCheck = await this.validateExpectedOutcome(outcome);
                validation.checks.push(outcomeCheck);
                if (!outcomeCheck.passed) validation.issues.push(...outcomeCheck.issues);
            }

            // Phase固有のチェック
            switch (phaseNumber) {
                case 1:
                    const envSetupCheck = await this.validateEnvironmentSetupOutcome();
                    validation.checks.push(envSetupCheck);
                    if (!envSetupCheck.passed) validation.issues.push(...envSetupCheck.issues);
                    break;
                case 2:
                    const projectSelectionCheck = await this.validateProjectSelectionOutcome();
                    validation.checks.push(projectSelectionCheck);
                    if (!projectSelectionCheck.passed) validation.issues.push(...projectSelectionCheck.issues);
                    break;
                case 3:
                    const generationCheck = await this.validateGenerationOutcome();
                    validation.checks.push(generationCheck);
                    if (!generationCheck.passed) validation.issues.push(...generationCheck.issues);
                    break;
            }

            validation.canProceed = validation.issues.filter(i => i.severity === 'critical').length === 0;

            this.log('phase_validation', `Phase ${phaseNumber} validation completed`, {
                phase: phaseNumber,
                totalChecks: validation.checks.length,
                issues: validation.issues.length,
                canProceed: validation.canProceed
            });

            this.displayValidationResults(validation, `Phase ${phaseNumber}`);
            return validation;

        } catch (error) {
            validation.error = error.message;
            validation.canProceed = false;
            
            this.log('phase_validation_error', `Phase ${phaseNumber} validation failed`, {
                phase: phaseNumber,
                error: error.message
            });

            return validation;
        }
    }

    /**
     * Phase 3.5: 生成物統合検証フェーズ（デプロイ前の最終チェック）
     */
    async validateGeneratedArtifacts(appId, deploymentDir) {
        console.log('🔍 Phase 3.5: 生成物統合検証フェーズ開始');
        
        const validation = {
            phase: 'artifacts',
            appId,
            deploymentDir,
            startTime: new Date().toISOString(),
            checks: [],
            issues: [],
            criticalFailures: [],
            canDeploy: true
        };

        try {
            // 1. ファイル構造検証（Gemini推奨: 処理中断型）
            const structureCheck = await this.validateFileStructure(deploymentDir);
            validation.checks.push(structureCheck);
            if (!structureCheck.passed) validation.issues.push(...structureCheck.issues);

            // 2. 必須ファイル存在確認
            const requiredFilesCheck = await this.validateRequiredFiles(deploymentDir, appId);
            validation.checks.push(requiredFilesCheck);
            if (!requiredFilesCheck.passed) validation.issues.push(...requiredFilesCheck.issues);

            // 3. コード品質基本チェック
            const codeQualityCheck = await this.validateCodeQuality(deploymentDir);
            validation.checks.push(codeQualityCheck);
            if (!codeQualityCheck.passed) validation.issues.push(...codeQualityCheck.issues);

            // 4. 一時ファイル残存チェック
            const cleanupCheck = await this.validateCleanupStatus();
            validation.checks.push(cleanupCheck);
            if (!cleanupCheck.passed) validation.issues.push(...cleanupCheck.issues);

            // Critical failures判定
            validation.criticalFailures = validation.issues.filter(issue => issue.severity === 'critical');
            validation.canDeploy = validation.criticalFailures.length === 0;

            this.log('artifacts_validation', 'Artifacts validation completed', {
                appId,
                totalChecks: validation.checks.length,
                issues: validation.issues.length,
                criticalFailures: validation.criticalFailures.length,
                canDeploy: validation.canDeploy
            });

            this.displayValidationResults(validation, 'Generated Artifacts');
            return validation;

        } catch (error) {
            validation.error = error.message;
            validation.canDeploy = false;
            
            this.log('artifacts_validation_error', 'Artifacts validation failed', {
                appId,
                error: error.message
            });

            return validation;
        }
    }

    /**
     * ファイル構造検証（Gemini推奨: 安全性重視の中断型）
     */
    async validateFileStructure(deploymentDir) {
        const check = {
            name: 'File Structure',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        try {
            // 不正なネスト構造検知（temp-deploy/temp-deploy等）
            const deployDirName = path.basename(deploymentDir);
            const nestedPath = path.join(deploymentDir, deployDirName);
            
            if (fs.existsSync(nestedPath)) {
                check.issues.push({
                    type: 'invalid_nested_structure',
                    severity: 'critical',
                    description: `不正なネスト構造を検知: ${nestedPath}`,
                    path: nestedPath,
                    recommendation: `手動確認が必要です: ls -la "${nestedPath}"`
                });
                console.log(`❌ 不正なネスト構造: ${nestedPath}`);
            }

            // その他の不正パターン検知
            const invalidPatterns = ['temp-', 'tmp-', '.tmp'];
            const entries = fs.readdirSync(deploymentDir);
            
            entries.forEach(entry => {
                invalidPatterns.forEach(pattern => {
                    if (entry.startsWith(pattern)) {
                        check.issues.push({
                            type: 'invalid_file_pattern',
                            severity: 'high',
                            description: `不正なファイル名パターン: ${entry}`,
                            pattern,
                            recommendation: `手動確認が必要です: rm -rf "${path.join(deploymentDir, entry)}"`
                        });
                        console.log(`⚠️ 不正ファイル名: ${entry}`);
                    }
                });
            });

            check.passed = check.issues.length === 0;
            if (check.passed) {
                console.log(`✅ ファイル構造正常: ${deploymentDir}`);
            }

        } catch (error) {
            check.issues.push({
                type: 'structure_check_failed',
                severity: 'high',
                description: 'ファイル構造確認に失敗',
                error: error.message
            });
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 期待される成果物の確認
     */
    async validateExpectedOutcome(outcome) {
        const check = {
            name: `Expected Outcome: ${outcome.name}`,
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        try {
            switch (outcome.type) {
                case 'file_exists':
                    if (fs.existsSync(outcome.path)) {
                        check.passed = true;
                        console.log(`✅ ファイル存在確認: ${outcome.path}`);
                    } else {
                        check.issues.push({
                            type: 'missing_expected_file',
                            severity: outcome.severity || 'high',
                            description: `期待されるファイルが見つかりません: ${outcome.path}`,
                            path: outcome.path
                        });
                        console.log(`❌ ファイル未発見: ${outcome.path}`);
                    }
                    break;
                    
                case 'directory_exists':
                    if (fs.existsSync(outcome.path) && fs.statSync(outcome.path).isDirectory()) {
                        check.passed = true;
                        console.log(`✅ ディレクトリ存在確認: ${outcome.path}`);
                    } else {
                        check.issues.push({
                            type: 'missing_expected_directory',
                            severity: outcome.severity || 'high',
                            description: `期待されるディレクトリが見つかりません: ${outcome.path}`,
                            path: outcome.path
                        });
                        console.log(`❌ ディレクトリ未発見: ${outcome.path}`);
                    }
                    break;
            }

        } catch (error) {
            check.issues.push({
                type: 'outcome_validation_failed',
                severity: 'medium',
                description: '成果物確認に失敗',
                error: error.message
            });
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 必須ファイル存在確認
     */
    async validateRequiredFiles(deploymentDir, appId) {
        const check = {
            name: 'Required Files',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        const requiredFiles = [
            { name: 'index.html', critical: true },
            { name: 'reflection.md', critical: false },
            { name: 'requirements.md', critical: false },
            { name: 'work_log.md', critical: false }
        ];

        let criticalFilesMissing = 0;

        requiredFiles.forEach(file => {
            const filePath = path.join(deploymentDir, file.name);
            if (!fs.existsSync(filePath)) {
                const severity = file.critical ? 'critical' : 'medium';
                if (file.critical) criticalFilesMissing++;

                check.issues.push({
                    type: 'missing_required_file',
                    severity,
                    description: `必須ファイルが見つかりません: ${file.name}`,
                    file: file.name,
                    path: filePath,
                    critical: file.critical
                });
                console.log(`${file.critical ? '❌' : '⚠️'} 未発見: ${file.name}`);
            } else {
                console.log(`✅ 確認: ${file.name}`);
            }
        });

        check.passed = criticalFilesMissing === 0;
        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * コード品質基本チェック
     */
    async validateCodeQuality(deploymentDir) {
        const check = {
            name: 'Code Quality',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        try {
            const indexPath = path.join(deploymentDir, 'index.html');
            
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath, 'utf8');
                
                // 基本的なHTML構造チェック
                if (!content.includes('<!DOCTYPE html>')) {
                    check.issues.push({
                        type: 'missing_doctype',
                        severity: 'medium',
                        description: 'HTML DOCTYPE宣言が見つかりません'
                    });
                }

                if (!content.includes('<title>')) {
                    check.issues.push({
                        type: 'missing_title',
                        severity: 'medium',
                        description: 'HTMLタイトルタグが見つかりません'
                    });
                }

                // 最小限のサイズチェック
                if (content.length < 100) {
                    check.issues.push({
                        type: 'suspiciously_small_file',
                        severity: 'high',
                        description: 'HTMLファイルが異常に小さいです',
                        size: content.length
                    });
                }

                check.passed = check.issues.length === 0;
                if (check.passed) {
                    console.log(`✅ コード品質基本チェック通過`);
                }
            }

        } catch (error) {
            check.issues.push({
                type: 'code_quality_check_failed',
                severity: 'medium',
                description: 'コード品質チェックに失敗',
                error: error.message
            });
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * 一時ファイル残存チェック
     */
    async validateCleanupStatus() {
        const check = {
            name: 'Cleanup Status',
            startTime: new Date().toISOString(),
            passed: false,
            issues: []
        };

        const tempPatterns = ['temp-deploy', 'temp-req', '.tmp'];
        let tempFilesFound = 0;

        tempPatterns.forEach(pattern => {
            const tempPath = path.join(this.projectRoot, pattern);
            if (fs.existsSync(tempPath)) {
                tempFilesFound++;
                check.issues.push({
                    type: 'temp_files_remaining',
                    severity: 'medium',
                    description: `一時ファイルが残存: ${pattern}`,
                    path: tempPath,
                    recommendation: `rm -rf "${tempPath}"`
                });
                console.log(`⚠️ 一時ファイル残存: ${pattern}`);
            }
        });

        check.passed = tempFilesFound === 0;
        if (check.passed) {
            console.log(`✅ 一時ファイル削除完了`);
        }

        check.endTime = new Date().toISOString();
        return check;
    }

    /**
     * Phase固有の検証メソッド
     */
    async validateEnvironmentSetupOutcome() {
        const check = {
            name: 'Environment Setup Outcome',
            passed: true,
            issues: []
        };
        // 環境設定後の特定チェックを実装
        return check;
    }

    async validateProjectSelectionOutcome() {
        const check = {
            name: 'Project Selection Outcome',
            passed: true,
            issues: []
        };
        // プロジェクト選択後の特定チェックを実装
        return check;
    }

    async validateGenerationOutcome() {
        const check = {
            name: 'Generation Outcome',
            passed: true,
            issues: []
        };
        // AI生成後の特定チェックを実装
        return check;
    }

    /**
     * 検証結果表示
     */
    displayValidationResults(validation, phaseName) {
        console.log(`\n📊 ${phaseName} 検証結果:`);
        console.log(`   実行チェック数: ${validation.checks.length}`);
        console.log(`   検知問題数: ${validation.issues.length}`);
        
        if (validation.criticalFailures) {
            console.log(`   緊急問題数: ${validation.criticalFailures.length}`);
        }
        
        console.log(`   継続可能: ${validation.canProceed || validation.canDeploy ? '✅ YES' : '❌ NO'}`);

        if (validation.issues.length > 0) {
            console.log(`\n⚠️ 検知された問題:`);
            validation.issues.forEach((issue, index) => {
                const emoji = issue.severity === 'critical' ? '🚨' : 
                             issue.severity === 'high' ? '⚠️' : 'ℹ️';
                console.log(`   ${index + 1}. ${emoji} ${issue.description}`);
                if (issue.recommendation) {
                    console.log(`      推奨対処: ${issue.recommendation}`);
                }
            });
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

        if (this.useUnifiedLogging && this.unifiedLogger) {
            this.unifiedLogger.log('quality-validator', action, description, data);
        }

        console.log(`🔍 [VALIDATOR] ${logEntry.timestamp}: ${action} - ${description}`);
    }
}

// CLI インターフェース
if (require.main === module) {
    const validator = new WorkerQualityValidator();
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'environment':
            validator.validateEnvironment()
                .then(result => {
                    console.log('\n📊 環境検証完了');
                    process.exit(result.canProceed ? 0 : 1);
                })
                .catch(error => {
                    console.error('❌ 環境検証失敗:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'phase':
            const phaseNumber = parseInt(process.argv[3]);
            const phaseDescription = process.argv[4] || `Phase ${phaseNumber}`;
            
            if (!phaseNumber) {
                console.error('Usage: node worker-quality-validator.cjs phase <number> [description]');
                process.exit(1);
            }
            
            validator.validatePhaseCompletion(phaseNumber, phaseDescription)
                .then(result => {
                    console.log(`\n📊 Phase ${phaseNumber} 検証完了`);
                    process.exit(result.canProceed ? 0 : 1);
                })
                .catch(error => {
                    console.error(`❌ Phase ${phaseNumber} 検証失敗:`, error.message);
                    process.exit(1);
                });
            break;
            
        case 'artifacts':
            const appId = process.argv[3];
            const deploymentDir = process.argv[4];
            
            if (!appId || !deploymentDir) {
                console.error('Usage: node worker-quality-validator.cjs artifacts <appId> <deploymentDir>');
                process.exit(1);
            }
            
            validator.validateGeneratedArtifacts(appId, deploymentDir)
                .then(result => {
                    console.log('\n📊 生成物検証完了');
                    process.exit(result.canDeploy ? 0 : 1);
                })
                .catch(error => {
                    console.error('❌ 生成物検証失敗:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('Worker Quality Validator Commands:');
            console.log('  environment                        - Phase 0: Environment validation');
            console.log('  phase <number> [description]       - Phase completion validation');
            console.log('  artifacts <appId> <deploymentDir>  - Phase 3.5: Generated artifacts validation');
            console.log('\nExamples:');
            console.log('  node worker-quality-validator.cjs environment');
            console.log('  node worker-quality-validator.cjs phase 1 "Environment Setup"');
            console.log('  node worker-quality-validator.cjs artifacts app-001-abc123 ./temp-deploy/app-001-abc123');
    }
}

module.exports = WorkerQualityValidator;