# 🔍 フェーズ間チェックツール設計

## 🎯 目的
AIのポカミスを防ぐため、各フェーズ間で自動チェックを実行し、true/falseで実行可否を判定

## 🚨 解決する問題

### 現在の問題
- AIがパスを間違えてアップロード
- チェックリストの見落とし・誤解釈
- 事後の原因調査が困難
- 人的（AI的）ミスの頻発

### 期待する改善
- **自動判定**: ツールが客観的にtrue/false判定
- **履歴記録**: AI入力と判定結果をログ保存
- **事後検証**: 問題発生時の原因特定が容易
- **ミス防止**: 実行前にブロックして被害を防ぐ

## 🔧 ツール仕様

### 基本構造
```javascript
// 使用例
const result = await phaseChecker.validate({
  phase: "deploy",
  action: "git_upload", 
  target: "published-apps",
  path: "./temp-deploy",
  sessionId: SESSION_ID
});

if (result.success) {
  // 実行許可
  executeGitUpload();
} else {
  // エラー詳細を表示、処理停止
  console.error("❌ 検証失敗:", result.reason);
  exit(1);
}
```

### チェック項目設計

#### Phase 1: Environment Setup
```javascript
{
  action: "git_update",
  checks: [
    "current_directory_correct",    // /ai-auto-generator にいるか
    "git_repo_valid",              // .git フォルダ存在
    "no_uncommitted_changes"       // 未コミット変更なし
  ]
}
```

#### Phase 2: Requirements Fetch  
```javascript
{
  action: "clone_requirements",
  target: "app-request-list",
  checks: [
    "target_repo_correct",         // 正しいリポジトリURL
    "temp_dir_clean",              // ./temp-req が古くない
    "clone_success"                // クローン成功確認
  ]
}
```

#### Phase 3: Project Selection
```javascript
{
  action: "assign_app_id", 
  checks: [
    "registry_exists",             // app-type-registry.json 存在
    "id_not_duplicate",            // IDが重複していない
    "unique_id_valid"              // UNIQUE_ID が適切
  ]
}
```

#### Phase 4: Deployment
```javascript
{
  action: "git_upload",
  target: "published-apps", 
  path: "./temp-deploy",
  checks: [
    "target_repo_correct",         // published-apps への投稿か
    "app_folder_exists",           // app-XXX-YYY フォルダ存在
    "required_files_present",      // index.html等必須ファイル
    "no_path_traversal",           // ../../../ 等の危険パス検出
    "file_size_reasonable"         // ファイルサイズが常識的
  ]
}
```

#### Phase 5: Completion
```javascript
{
  action: "cleanup",
  checks: [
    "temp_dirs_removed",           // 一時ディレクトリ削除確認
    "logs_saved",                  // ログ保存完了
    "session_closed"               // セッション適切に終了
  ]
}
```

## 📊 ログ・履歴管理

### 実行ログ形式
```json
{
  "timestamp": "2025-01-25T20:30:00.000Z",
  "sessionId": "abc123",
  "phase": "deploy",
  "action": "git_upload",
  "input": {
    "target": "published-apps",
    "path": "./temp-deploy",
    "appId": "app-004-xyz789"
  },
  "checks": [
    {
      "name": "target_repo_correct",
      "result": true,
      "details": "Repository URL matches published-apps"
    },
    {
      "name": "app_folder_exists", 
      "result": false,
      "details": "Folder ./temp-deploy/app-004-xyz789 not found",
      "error": "Missing app folder"
    }
  ],
  "finalResult": false,
  "reason": "App folder validation failed",
  "executionAllowed": false
}
```

### 履歴分析機能
```javascript
// 失敗パターン分析
const failures = phaseChecker.getFailureHistory();
console.log("頻発する問題:", failures.getMostCommonErrors());

// 特定セッションの検証
const session = phaseChecker.getSessionLog("abc123");
console.log("Phase 4で何が起きたか:", session.getPhaseDetails(4));
```

## 🔧 実装方法

### core/phase-checker.cjs（新規作成）
```javascript
class PhaseChecker {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.logFile = `logs/phase-checker-${sessionId}.json`;
  }
  
  async validate(options) {
    const { phase, action, target, path } = options;
    
    // 1. 該当するチェック項目を取得
    const checks = this.getChecksForAction(action);
    
    // 2. 各チェック項目を実行
    const results = await this.runChecks(checks, options);
    
    // 3. 総合判定
    const success = results.every(r => r.result === true);
    
    // 4. ログ記録
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      phase, action, input: options,
      checks: results,
      finalResult: success,
      reason: success ? "All checks passed" : this.getFailureReason(results)
    };
    
    this.saveLog(logEntry);
    
    return {
      success,
      reason: logEntry.reason,
      details: results
    };
  }
}
```

### ワークフロー統合例
```bash
# Phase 4: Auto Deploy（修正版）

# デプロイ前チェック（必須）
!echo "🔍 Pre-deployment validation..."
!node core/phase-checker.cjs validate \
  --phase="deploy" \
  --action="git_upload" \
  --target="published-apps" \
  --path="./temp-deploy" \
  --app-id="app-$APP_NUM-$UNIQUE_ID" \
  --session="$SESSION_ID"

# チェック結果に基づく分岐
!if [ $? -eq 0 ]; then
  echo "✅ Validation passed, proceeding with deployment"
  
  # 通常のデプロイ処理
  git clone https://github.com/muumuu8181/published-apps ./temp-deploy
  # ... デプロイ続行
  
else
  echo "❌ Validation failed, stopping deployment"
  echo "🔍 Check logs: logs/phase-checker-$SESSION_ID.json"
  exit 1
fi
```

## 🎯 期待効果

### 即座の効果
- **パスミス防止**: 99%の単純ミスをブロック
- **事前検出**: 実行前に問題を発見
- **自動停止**: 危険な操作を未然に防ぐ

### 中長期効果  
- **パターン分析**: よくある問題の特定
- **ワークフロー改善**: 頻発問題の根本解決
- **品質向上**: 全体的なミス削減

### 検証・デバッグ支援
- **詳細ログ**: 何が起きたかの完全記録
- **原因特定**: 問題箇所の即座特定
- **改善データ**: 次回の対策に活用

---

## 📝 実装優先度

### Phase 1（v0.7）: 基本機能
- [ ] core/phase-checker.cjs 作成
- [ ] git_upload チェックの実装
- [ ] ワークフローへの統合

### Phase 2（v0.8）: 拡張機能  
- [ ] 全フェーズのチェック項目実装
- [ ] 履歴分析・レポート機能
- [ ] 自動修復提案機能

### Phase 3（v0.9）: 最適化
- [ ] パフォーマンス改善
- [ ] より詳細なエラー分析
- [ ] 予測的問題回避

**「ツールによる客観的判定でAIのポカミスを撲滅」**