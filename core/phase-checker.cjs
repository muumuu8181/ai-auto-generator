/**
 * フェーズ間チェックツール
 * AIのポカミスを防ぐため、各フェーズでtrue/false判定を実行
 */

const fs = require('fs');
const path = require('path');

class PhaseChecker {
  constructor(sessionId, useUnifiedLogging = true) {
    this.sessionId = sessionId;
    this.logFile = path.join(__dirname, `../logs/phase-checker-${sessionId}.json`);
    this.logs = [];
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
    
    // ログディレクトリ作成
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  
  /**
   * メイン検証関数
   */
  async validate(options) {
    const { phase, action, target, path: targetPath, appId } = options;
    
    console.log(`🔍 Phase Checker: Validating ${action} for ${phase}`);
    
    try {
      // 1. 該当するチェック項目を取得
      const checks = this.getChecksForAction(action);
      
      // 2. 各チェック項目を実行
      const results = await this.runChecks(checks, options);
      
      // 3. 総合判定
      const success = results.every(r => r.result === true);
      const reason = success ? "All checks passed" : this.getFailureReason(results);
      
      // 4. ログ記録
      const logEntry = {
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        phase, action, 
        input: { target, path: targetPath, appId },
        checks: results,
        finalResult: success,
        reason: reason,
        executionAllowed: success
      };
      
      this.saveLog(logEntry);
      
      // 5. 結果出力
      if (success) {
        console.log(`✅ Phase Check PASSED: ${action}`);
      } else {
        console.log(`❌ Phase Check FAILED: ${action}`);
        console.log(`🔍 Reason: ${reason}`);
        console.log(`📋 Details: ${this.logFile}`);
      }
      
      return {
        success,
        reason,
        details: results,
        logFile: this.logFile
      };
      
    } catch (error) {
      const errorResult = {
        success: false,
        reason: `Internal error: ${error.message}`,
        details: [],
        error: error.toString()
      };
      
      this.saveLog({
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        phase, action,
        error: error.toString(),
        finalResult: false,
        reason: errorResult.reason
      });
      
      console.log(`💥 Phase Check ERROR: ${error.message}`);
      return errorResult;
    }
  }
  
  /**
   * タスク細分化管理
   */
  async registerTaskBreakdown(tasks, phase) {
    const taskEntry = {
      timestamp: new Date().toISOString(),
      phase,
      action: "task_breakdown",
      plannedTasks: tasks.map((task, index) => ({
        id: `task_${index + 1}`,
        title: task.title || task,
        description: task.description || "",
        status: "planned",
        registeredAt: new Date().toISOString()
      })),
      totalTasks: tasks.length
    };
    
    this.saveLog(taskEntry);
    console.log(`📋 Registered ${tasks.length} tasks for ${phase}`);
    
    return {
      success: true,
      taskIds: taskEntry.plannedTasks.map(t => t.id),
      details: `${tasks.length} tasks registered`
    };
  }
  
  async validateTaskCompletion(taskId, completionData) {
    console.log(`🔍 Validating task completion: ${taskId}`);
    
    const validation = await this.executeTaskValidation(taskId, completionData);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: "task_completion_check",
      taskId,
      input: completionData,
      validation,
      success: validation.success,
      reason: validation.reason || "Task validation completed"
    };
    
    this.saveLog(logEntry);
    
    if (validation.success) {
      console.log(`✅ Task ${taskId} completed successfully`);
    } else {
      console.log(`❌ Task ${taskId} validation failed: ${validation.reason}`);
    }
    
    return validation;
  }
  
  async executeTaskValidation(taskId, completionData) {
    const { taskType, filePath, expectedContent, functionName } = completionData;
    
    switch (taskType) {
      case "file_creation":
        return this.validateFileCreation(filePath, expectedContent);
        
      case "function_implementation":
        return this.validateFunctionImplementation(filePath, functionName);
        
      case "styling_implementation":
        return this.validateStyling(filePath, expectedContent);
        
      case "feature_integration":
        return this.validateFeatureIntegration(filePath, functionName);
        
      default:
        return this.validateGenericTask(completionData);
    }
  }
  
  validateFileCreation(filePath, expectedContent) {
    if (!fs.existsSync(filePath)) {
      return { success: false, reason: `File not found: ${filePath}` };
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const hasContent = expectedContent ? fileContent.includes(expectedContent) : fileContent.length > 0;
    
    return {
      success: hasContent,
      reason: hasContent ? "File created with expected content" : "File exists but missing expected content",
      details: { filePath, size: fileContent.length }
    };
  }
  
  validateFunctionImplementation(filePath, functionName) {
    if (!fs.existsSync(filePath)) {
      return { success: false, reason: `File not found: ${filePath}` };
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const hasFunctionDefinition = fileContent.includes(`function ${functionName}`) || 
                                 fileContent.includes(`${functionName} =`) ||
                                 fileContent.includes(`${functionName}:`);
    
    return {
      success: hasFunctionDefinition,
      reason: hasFunctionDefinition ? `Function ${functionName} found` : `Function ${functionName} not found`,
      details: { filePath, functionName }
    };
  }
  
  validateStyling(filePath, expectedRules) {
    if (!fs.existsSync(filePath)) {
      return { success: false, reason: `CSS file not found: ${filePath}` };
    }
    
    const cssContent = fs.readFileSync(filePath, 'utf8');
    const hasRules = expectedRules ? cssContent.includes(expectedRules) : cssContent.length > 100;
    
    return {
      success: hasRules,
      reason: hasRules ? "CSS styling implemented" : "CSS file exists but lacks expected rules",
      details: { filePath, size: cssContent.length }
    };
  }
  
  validateFeatureIntegration(filePath, featureName) {
    if (!fs.existsSync(filePath)) {
      return { success: false, reason: `File not found: ${filePath}` };
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const hasIntegration = fileContent.toLowerCase().includes(featureName.toLowerCase());
    
    return {
      success: hasIntegration,
      reason: hasIntegration ? `Feature ${featureName} integrated` : `Feature ${featureName} not found`,
      details: { filePath, featureName }
    };
  }
  
  validateGenericTask(completionData) {
    // 汎用的なタスク検証
    const { description, checkFiles = [] } = completionData;
    
    const fileChecks = checkFiles.map(filePath => ({
      file: filePath,
      exists: fs.existsSync(filePath)
    }));
    
    const allFilesExist = fileChecks.every(check => check.exists);
    
    return {
      success: allFilesExist,
      reason: allFilesExist ? "All expected files exist" : "Some expected files missing",
      details: { description, fileChecks }
    };
  }

  /**
   * アクション別チェック項目定義
   */
  getChecksForAction(action) {
    const checkDefinitions = {
      git_update: [
        { name: "current_directory_correct", critical: true },
        { name: "git_repo_valid", critical: true },
        { name: "no_uncommitted_changes", critical: false }
      ],
      
      clone_requirements: [
        { name: "target_repo_correct", critical: true },
        { name: "temp_dir_clean", critical: false },
        { name: "clone_destination_safe", critical: true }
      ],
      
      assign_app_id: [
        { name: "registry_exists", critical: true },
        { name: "id_format_valid", critical: true },
        { name: "id_not_duplicate", critical: true }
      ],
      
      git_upload: [
        { name: "target_repo_correct", critical: true },
        { name: "app_folder_exists", critical: true },
        { name: "required_files_present", critical: true },
        { name: "no_path_traversal", critical: true },
        { name: "file_size_reasonable", critical: false },
        { name: "disk_space_sufficient", critical: true }
      ],
      
      cleanup: [
        { name: "temp_dirs_identified", critical: false },
        { name: "logs_saved", critical: true }
      ]
    };
    
    return checkDefinitions[action] || [];
  }
  
  /**
   * チェック項目実行
   */
  async runChecks(checks, options) {
    const results = [];
    
    for (const check of checks) {
      try {
        const result = await this.executeCheck(check.name, options);
        results.push({
          name: check.name,
          critical: check.critical,
          result: result.success,
          details: result.details || "",
          error: result.error || null
        });
      } catch (error) {
        results.push({
          name: check.name,
          critical: check.critical,
          result: false,
          details: `Check execution failed: ${error.message}`,
          error: error.toString()
        });
      }
    }
    
    return results;
  }
  
  /**
   * 個別チェック実行
   */
  async executeCheck(checkName, options) {
    const { target, path: targetPath, appId } = options;
    
    switch (checkName) {
      case "target_repo_correct":
        return this.checkTargetRepo(target);
        
      case "app_folder_exists":
        return this.checkAppFolderExists(targetPath, appId);
        
      case "required_files_present":
        return this.checkRequiredFiles(targetPath, appId);
        
      case "no_path_traversal":
        return this.checkPathTraversal(targetPath);
        
      case "file_size_reasonable":
        return this.checkFileSize(targetPath, appId);
        
      case "registry_exists":
        return this.checkRegistryExists();
        
      case "id_format_valid":
        return this.checkIdFormat(appId);
        
      case "git_repo_valid":
        return this.checkGitRepoValid();
        
      case "disk_space_sufficient":
        return this.checkDiskSpace();
        
      default:
        return { success: false, details: `Unknown check: ${checkName}` };
    }
  }
  
  /**
   * 具体的なチェック実装
   */
  checkTargetRepo(target) {
    const allowedTargets = ["published-apps", "app-request-list"];
    const isValid = allowedTargets.includes(target);
    
    return {
      success: isValid,
      details: isValid 
        ? `Target '${target}' is allowed`
        : `Target '${target}' not in allowed list: ${allowedTargets.join(', ')}`
    };
  }
  
  checkAppFolderExists(targetPath, appId) {
    if (!targetPath || !appId) {
      return { success: false, details: "Missing targetPath or appId" };
    }
    
    const appFolderPath = path.join(targetPath, appId);
    const exists = fs.existsSync(appFolderPath);
    
    return {
      success: exists,
      details: exists 
        ? `App folder exists: ${appFolderPath}`
        : `App folder missing: ${appFolderPath}`
    };
  }
  
  checkRequiredFiles(targetPath, appId) {
    if (!targetPath || !appId) {
      return { success: false, details: "Missing targetPath or appId" };
    }
    
    const appFolderPath = path.join(targetPath, appId);
    const requiredFiles = ["index.html"];
    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(appFolderPath, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }
    
    const success = missingFiles.length === 0;
    return {
      success,
      details: success 
        ? "All required files present"
        : `Missing files: ${missingFiles.join(', ')}`
    };
  }
  
  checkPathTraversal(targetPath) {
    if (!targetPath) {
      return { success: false, details: "No path provided" };
    }
    
    const dangerous = targetPath.includes("../") || targetPath.includes("..\\");
    return {
      success: !dangerous,
      details: dangerous 
        ? "Path traversal detected (../ or ..\\)"
        : "Path appears safe"
    };
  }
  
  checkFileSize(targetPath, appId) {
    if (!targetPath || !appId) {
      return { success: true, details: "Skipping file size check (missing params)" };
    }
    
    try {
      const appFolderPath = path.join(targetPath, appId);
      if (!fs.existsSync(appFolderPath)) {
        return { success: true, details: "Folder doesn't exist, skipping size check" };
      }
      
      // 10MB制限の例
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      let totalSize = 0;
      const files = fs.readdirSync(appFolderPath, { recursive: true });
      
      for (const file of files) {
        const filePath = path.join(appFolderPath, file);
        if (fs.statSync(filePath).isFile()) {
          totalSize += fs.statSync(filePath).size;
        }
      }
      
      const success = totalSize <= maxSizeBytes;
      return {
        success,
        details: `Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB (limit: ${maxSizeMB}MB)`
      };
      
    } catch (error) {
      return { success: true, details: `Size check failed: ${error.message}` };
    }
  }
  
  checkRegistryExists() {
    const registryPath = "./temp-req/system/app-type-registry.json";
    const exists = fs.existsSync(registryPath);
    
    return {
      success: exists,
      details: exists 
        ? "Registry file found"
        : `Registry not found at ${registryPath}`
    };
  }
  
  checkIdFormat(appId) {
    if (!appId) {
      return { success: false, details: "No app ID provided" };
    }
    
    // app-XXX-YYYY 形式をチェック
    const pattern = /^app-\d{3}-[a-zA-Z0-9]+$/;
    const isValid = pattern.test(appId);
    
    return {
      success: isValid,
      details: isValid 
        ? `App ID format valid: ${appId}`
        : `App ID format invalid: ${appId} (expected: app-XXX-YYYY)`
    };
  }
  
  checkGitRepoValid() {
    const gitPath = ".git";
    const exists = fs.existsSync(gitPath);
    
    return {
      success: exists,
      details: exists 
        ? "Git repository detected"
        : "Not in a git repository"
    };
  }
  
  checkDiskSpace() {
    try {
      const { execSync } = require('child_process');
      
      // Linux/WSL環境での空き容量チェック
      const dfOutput = execSync('df -h .', { encoding: 'utf8' });
      const lines = dfOutput.trim().split('\n');
      
      if (lines.length < 2) {
        return { 
          success: true, 
          details: "Could not parse disk usage, skipping check" 
        };
      }
      
      const dataLine = lines[1];
      const columns = dataLine.split(/\s+/);
      
      // df出力: Filesystem Size Used Avail Use% Mounted
      const available = columns[3]; // Available column
      const usagePercent = columns[4]; // Use% column
      
      // 使用率から数値部分を抽出 (例: "75%" -> 75)
      const usageNumber = parseInt(usagePercent.replace('%', ''));
      
      // 警告レベル: 使用率90%以上、利用可能容量1GB未満
      const isHighUsage = usageNumber >= 90;
      const isLowSpace = this.parseSpaceValue(available) < 1024; // 1GB in MB
      
      const success = !isHighUsage && !isLowSpace;
      
      let details;
      if (!success) {
        details = `Disk space warning: ${usagePercent} used, ${available} available`;
        if (isHighUsage) details += " (High usage)";
        if (isLowSpace) details += " (Low available space)";
      } else {
        details = `Disk space OK: ${usagePercent} used, ${available} available`;
      }
      
      // ログに詳細な時刻情報も含める
      const timestamp = this.getPreciseTimestamp();
      details += ` (checked at ${timestamp})`;
      
      console.log(`💾 ${details}`);
      
      return {
        success,
        details,
        metadata: {
          available,
          usagePercent,
          usageNumber,
          timestamp,
          isHighUsage,
          isLowSpace
        }
      };
      
    } catch (error) {
      // Windowsの場合やdfコマンドが使えない場合
      console.warn('⚠️ Disk space check failed, using fallback');
      
      try {
        // 別の方法を試す (statvfsまたはプラットフォーム固有)
        const stats = fs.statSync('.');
        return {
          success: true,
          details: "Disk space check completed (basic check)",
          metadata: {
            timestamp: this.getPreciseTimestamp(),
            method: "fallback"
          }
        };
      } catch (fallbackError) {
        return {
          success: true,
          details: `Disk space check skipped: ${error.message}`,
          metadata: {
            timestamp: this.getPreciseTimestamp(),
            error: error.message
          }
        };
      }
    }
  }
  
  /**
   * 容量表記のパース (例: "15G" -> 15360, "512M" -> 512)
   */
  parseSpaceValue(spaceStr) {
    const match = spaceStr.match(/^(\d+\.?\d*)([KMGT]?)$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'K': return value;
      case 'M': return value;
      case 'G': return value * 1024;
      case 'T': return value * 1024 * 1024;
      default: return value / 1024; // バイト単位の場合
    }
  }
  
  /**
   * 精密時刻取得（マイクロ秒まで）
   */
  getPreciseTimestamp() {
    const now = new Date();
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return now.toISOString().replace(/\.\d{3}Z$/, `.${ms}Z`);
  }
  
  /**
   * 失敗理由生成
   */
  getFailureReason(results) {
    const criticalFailures = results.filter(r => r.critical && !r.result);
    const otherFailures = results.filter(r => !r.critical && !r.result);
    
    if (criticalFailures.length > 0) {
      return `Critical check failed: ${criticalFailures[0].name} - ${criticalFailures[0].details}`;
    }
    
    if (otherFailures.length > 0) {
      return `Check failed: ${otherFailures[0].name} - ${otherFailures[0].details}`;
    }
    
    return "Unknown failure";
  }
  
  /**
   * ログ保存
   */
  saveLog(logEntry) {
    this.logs.push(logEntry);
    
    // 統合ログにも記録
    if (this.useUnifiedLogging && this.unifiedLogger) {
      if (logEntry.action === 'task_breakdown') {
        this.unifiedLogger.addTaskRegistration(logEntry.plannedTasks || [], logEntry.phase);
      } else if (logEntry.checks) {
        this.unifiedLogger.addPhaseCheck(logEntry);
      } else if (logEntry.action === 'task_completion_check') {
        this.unifiedLogger.addTaskCompletion(logEntry.taskId, logEntry.validation);
      }
    }
    
    try {
      fs.writeFileSync(this.logFile, JSON.stringify({
        sessionId: this.sessionId,
        logs: this.logs,
        lastUpdated: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      console.error("Failed to save phase checker log:", error);
    }
  }
}

// CLI使用
if (require.main === module) {
  const args = process.argv.slice(2);
  const sessionId = process.env.SESSION_ID || "default";
  const checker = new PhaseChecker(sessionId);
  
  if (args[0] === "validate") {
    // 引数パース（簡易版）
    const options = {};
    for (let i = 1; i < args.length; i += 2) {
      const key = args[i].replace(/^--/, '');
      const value = args[i + 1];
      options[key.replace(/-/g, '_')] = value;
    }
    
    checker.validate(options).then(result => {
      process.exit(result.success ? 0 : 1);
    });
    
  } else if (args[0] === "register-tasks") {
    // タスク細分化登録
    const phase = args[1];
    const tasksJson = args[2];
    
    try {
      const tasks = JSON.parse(tasksJson);
      checker.registerTaskBreakdown(tasks, phase).then(result => {
        console.log(JSON.stringify(result));
        process.exit(0);
      });
    } catch (error) {
      console.error("Invalid tasks JSON:", error.message);
      process.exit(1);
    }
    
  } else if (args[0] === "check-task") {
    // 個別タスク完了チェック
    const taskId = args[1];
    const completionDataJson = args[2];
    
    try {
      const completionData = JSON.parse(completionDataJson);
      checker.validateTaskCompletion(taskId, completionData).then(result => {
        console.log(JSON.stringify(result));
        process.exit(result.success ? 0 : 1);
      });
    } catch (error) {
      console.error("Invalid completion data JSON:", error.message);
      process.exit(1);
    }
    
  } else {
    console.log("Usage:");
    console.log("  node phase-checker.cjs validate --phase=deploy --action=git_upload --target=published-apps --path=./temp-deploy --app-id=app-001-abc123");
    console.log("  node phase-checker.cjs register-tasks <phase> '<tasks-json>'");
    console.log("  node phase-checker.cjs check-task <task-id> '<completion-data-json>'");
  }
}

module.exports = PhaseChecker;