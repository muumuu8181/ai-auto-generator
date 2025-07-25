/**
 * AI作業監視ツール
 * AIの自己申告と実際の作業履歴を照合して嘘を検出
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class WorkMonitor {
  constructor(sessionId, useUnifiedLogging = true) {
    this.sessionId = sessionId;
    this.logFile = path.join(__dirname, `../logs/work-monitor-${sessionId}.json`);
    this.activities = [];
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
    
    this.log('monitor_start', 'Work monitoring initiated', { sessionId });
  }
  
  /**
   * 作業ログ記録
   */
  log(action, description, data = {}) {
    const timestamp = new Date().toISOString();
    const activity = {
      timestamp,
      action,
      description,
      data,
      hash: this.generateHash(action, description, timestamp)
    };
    
    this.activities.push(activity);
    
    // 統合ログにも記録
    if (this.useUnifiedLogging && this.unifiedLogger) {
      this.unifiedLogger.addWorkMonitoringActivity(activity);
    }
    
    this.saveToFile();
    console.log(`📝 [MONITOR] ${timestamp}: ${action} - ${description}`);
  }
  
  /**
   * ファイル操作監視
   */
  fileCreated(filePath, content = '') {
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    this.log('file_created', `File created: ${filePath}`, {
      path: filePath,
      size: stats ? stats.size : 0,
      exists: !!stats,
      contentHash: content ? crypto.createHash('md5').update(content).digest('hex') : null
    });
  }
  
  fileModified(filePath, before = '', after = '') {
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    this.log('file_modified', `File modified: ${filePath}`, {
      path: filePath,
      size: stats ? stats.size : 0,
      beforeHash: before ? crypto.createHash('md5').update(before).digest('hex') : null,
      afterHash: after ? crypto.createHash('md5').update(after).digest('hex') : null
    });
  }
  
  /**
   * UI要素監視
   */
  buttonAdded(buttonId, buttonText, filePath) {
    this.log('ui_button_added', `Button added: ${buttonId}`, {
      buttonId,
      buttonText,
      filePath,
      verified: this.verifyButtonExists(filePath, buttonId)
    });
  }
  
  buttonTested(buttonId, testResult, filePath) {
    this.log('ui_button_tested', `Button tested: ${buttonId}`, {
      buttonId,
      testResult,
      filePath,
      buttonExists: this.verifyButtonExists(filePath, buttonId),
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 機能実装監視
   */
  featureImplemented(featureName, description, filePaths = []) {
    const verification = this.verifyFeatureImplementation(featureName, filePaths);
    this.log('feature_implemented', `Feature implemented: ${featureName}`, {
      featureName,
      description,
      filePaths,
      verification
    });
  }
  
  featureTested(featureName, testType, testResult) {
    this.log('feature_tested', `Feature tested: ${featureName}`, {
      featureName,
      testType,
      testResult,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * デプロイ監視
   */
  deploymentAttempted(repoUrl, targetPath) {
    this.log('deployment_attempted', `Deployment attempted to: ${repoUrl}`, {
      repoUrl,
      targetPath,
      timestamp: new Date().toISOString()
    });
  }
  
  deploymentVerified(url, statusCode, responseTime) {
    this.log('deployment_verified', `Deployment verified: ${url}`, {
      url,
      statusCode,
      responseTime,
      success: statusCode >= 200 && statusCode < 300,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * 検証メソッド
   */
  verifyButtonExists(filePath, buttonId) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes(`id="${buttonId}"`) || content.includes(`id='${buttonId}'`);
    } catch (error) {
      return false;
    }
  }
  
  verifyFeatureImplementation(featureName, filePaths) {
    const results = {};
    filePaths.forEach(filePath => {
      results[filePath] = {
        exists: fs.existsSync(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        hasFeatureCode: this.hasFeatureCode(filePath, featureName)
      };
    });
    return results;
  }
  
  hasFeatureCode(filePath, featureName) {
    try {
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      const featureKeywords = featureName.toLowerCase().split(' ');
      return featureKeywords.some(keyword => content.includes(keyword));
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 嘘検出機能
   */
  detectLies() {
    const lies = [];
    
    this.activities.forEach((activity, index) => {
      switch (activity.action) {
        case 'ui_button_added':
          if (!activity.data.verified) {
            lies.push({
              type: 'button_not_found',
              activity,
              message: `Button ${activity.data.buttonId} was claimed to be added but not found in ${activity.data.filePath}`
            });
          }
          break;
          
        case 'feature_implemented':
          const hasImplementation = Object.values(activity.data.verification).some(v => v.hasFeatureCode);
          if (!hasImplementation) {
            lies.push({
              type: 'feature_not_implemented',
              activity,
              message: `Feature ${activity.data.featureName} was claimed to be implemented but no related code found`
            });
          }
          break;
          
        case 'deployment_verified':
          if (!activity.data.success) {
            lies.push({
              type: 'deployment_failed',
              activity,
              message: `Deployment was claimed successful but verification failed (status: ${activity.data.statusCode})`
            });
          }
          break;
      }
    });
    
    return lies;
  }
  
  /**
   * 作業完了報告書生成
   */
  generateReport() {
    const lies = this.detectLies();
    const report = {
      sessionId: this.sessionId,
      startTime: this.activities[0]?.timestamp,
      endTime: new Date().toISOString(),
      totalActivities: this.activities.length,
      liesDetected: lies.length,
      trustScore: Math.max(0, 100 - (lies.length * 10)),
      activities: this.activities,
      lies: lies,
      summary: {
        filesCreated: this.activities.filter(a => a.action === 'file_created').length,
        filesModified: this.activities.filter(a => a.action === 'file_modified').length,
        buttonsAdded: this.activities.filter(a => a.action === 'ui_button_added').length,
        buttonsTested: this.activities.filter(a => a.action === 'ui_button_tested').length,
        featuresImplemented: this.activities.filter(a => a.action === 'feature_implemented').length,
        featuresTested: this.activities.filter(a => a.action === 'feature_tested').length,
        deploymentsAttempted: this.activities.filter(a => a.action === 'deployment_attempted').length,
        deploymentsVerified: this.activities.filter(a => a.action === 'deployment_verified').length
      }
    };
    
    return report;
  }
  
  /**
   * ハッシュ生成
   */
  generateHash(action, description, timestamp) {
    return crypto.createHash('md5')
      .update(`${action}:${description}:${timestamp}`)
      .digest('hex');
  }
  
  /**
   * ファイル保存
   */
  saveToFile() {
    fs.writeFileSync(this.logFile, JSON.stringify({
      sessionId: this.sessionId,
      activities: this.activities,
      lastUpdated: new Date().toISOString()
    }, null, 2));
  }
}

// CLI使用
if (require.main === module) {
  const command = process.argv[2];
  const sessionId = process.argv[3] || 'default';
  
  const monitor = new WorkMonitor(sessionId);
  
  switch (command) {
    case 'file-created':
      const filePath = process.argv[4];
      monitor.fileCreated(filePath);
      break;
      
    case 'button-added':
      const buttonId = process.argv[4];
      const buttonText = process.argv[5];
      const file = process.argv[6];
      monitor.buttonAdded(buttonId, buttonText, file);
      break;
      
    case 'button-tested':
      const testButtonId = process.argv[4];
      const testResult = process.argv[5] === 'true';
      const testFile = process.argv[6];
      monitor.buttonTested(testButtonId, testResult, testFile);
      break;
      
    case 'feature-implemented':
      const featureName = process.argv[4];
      const description = process.argv[5];
      const files = process.argv.slice(6);
      monitor.featureImplemented(featureName, description, files);
      break;
      
    case 'deployment-verified':
      const url = process.argv[4];
      const statusCode = parseInt(process.argv[5]);
      const responseTime = parseInt(process.argv[6]);
      monitor.deploymentVerified(url, statusCode, responseTime);
      break;
      
    case 'report':
      const report = monitor.generateReport();
      console.log('\n📊 AI Work Monitor Report:');
      console.log(`🎯 Trust Score: ${report.trustScore}%`);
      console.log(`🔍 Lies Detected: ${report.liesDetected}`);
      console.log(`📝 Total Activities: ${report.totalActivities}`);
      
      if (report.lies.length > 0) {
        console.log('\n⚠️  Detected Issues:');
        report.lies.forEach((lie, index) => {
          console.log(`${index + 1}. ${lie.message}`);
        });
      }
      
      console.log('\n📈 Activity Summary:');
      Object.entries(report.summary).forEach(([key, value]) => {
        console.log(`- ${key}: ${value}`);
      });
      break;
      
    default:
      console.log('Usage: node work-monitor.cjs <command> <sessionId> [args...]');
      console.log('Commands:');
      console.log('  file-created <sessionId> <filePath>');
      console.log('  button-added <sessionId> <buttonId> <buttonText> <filePath>');
      console.log('  button-tested <sessionId> <buttonId> <true/false> <filePath>');
      console.log('  feature-implemented <sessionId> <featureName> <description> <filePath1> [filePath2...]');
      console.log('  deployment-verified <sessionId> <url> <statusCode> <responseTime>');
      console.log('  report <sessionId>');
  }
}

module.exports = WorkMonitor;