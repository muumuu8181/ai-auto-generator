# 📋 ログ統合・GitHub Pages公開設計

## 🎯 現在の問題

### 現状のログ構造
```
logs/
├── work-monitor-{SESSION_ID}.json     # AI作業監視（嘘検出）
├── phase-checker-{SESSION_ID}.json   # フェーズ間チェック  
└── session-tracker-{SESSION_ID}.json # セッション追跡
```

### 問題点
- **ログ分散**: 3つのツールが別々のファイル
- **統合困難**: セッション全体像が見えない
- **アップロード複雑**: 複数ファイルの個別アップロード

## 🔧 改善設計

### 統合ログ構造（案1：統合ファイル）
```
logs/
├── integrated-session-{SESSION_ID}.json  # 全ツール統合ログ
└── components/                            # 個別ツールログ（デバッグ用）
    ├── work-monitor-{SESSION_ID}.json
    ├── phase-checker-{SESSION_ID}.json
    └── session-tracker-{SESSION_ID}.json
```

### 統合ログ形式
```json
{
  "sessionId": "abc123",
  "startTime": "2025-01-25T20:00:00.000Z",
  "endTime": "2025-01-25T20:45:00.000Z",
  "workflowVersion": "v0.6",
  "appGenerated": "app-004-xyz789",
  "finalStatus": "success",
  
  "phaseChecks": [
    {
      "phase": "deploy",
      "action": "git_upload",
      "timestamp": "2025-01-25T20:30:00.000Z",
      "result": true,
      "checks": [...]
    }
  ],
  
  "workMonitoring": [
    {
      "action": "file_created", 
      "timestamp": "2025-01-25T20:25:00.000Z",
      "verified": true,
      "details": {...}
    }
  ],
  
  "sessionEvents": [
    {
      "event": "requirements_fetched",
      "timestamp": "2025-01-25T20:05:00.000Z",
      "data": {...}
    }
  ],
  
  "summary": {
    "totalPhaseChecks": 5,
    "passedChecks": 5,
    "failedChecks": 0,
    "workActivities": 12,
    "liesDetected": 0,
    "trustScore": 100
  }
}
```

## 📁 GitHub Pages公開方式

### 方式1: アプリフォルダ内配置
```
app-004-xyz789/
├── index.html
├── style.css
├── script.js
├── reflection.md
├── requirements.md
├── work_log.md
└── logs/
    ├── integrated-session-abc123.json
    └── phase-checker-abc123.json
```

### 方式2: 専用ログディレクトリ
```
published-apps/
├── app-004-xyz789/
│   ├── index.html
│   └── ...
├── app-005-def456/
│   └── ...
└── session-logs/
    ├── abc123-integrated.json
    ├── def456-integrated.json
    └── index.html  # ログ一覧表示HTML
```

### 方式3: ハイブリッド（推奨）
```
app-004-xyz789/
├── index.html
├── reflection.md
├── session-log.json          # 統合ログ（簡易版）
└── logs/
    └── detailed-abc123.json  # 詳細ログ
```

## 🔧 実装方法

### core/log-integrator.cjs（新規作成）
```javascript
class LogIntegrator {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.integratedLog = {
      sessionId,
      startTime: null,
      endTime: null,
      phaseChecks: [],
      workMonitoring: [],
      sessionEvents: []
    };
  }
  
  // フェーズチェック結果を追加
  addPhaseCheck(phaseResult) {
    this.integratedLog.phaseChecks.push({
      timestamp: new Date().toISOString(),
      ...phaseResult
    });
    this.save();
  }
  
  // 作業監視結果を追加
  addWorkActivity(activity) {
    this.integratedLog.workMonitoring.push({
      timestamp: new Date().toISOString(),
      ...activity
    });
    this.save();
  }
  
  // 統合ログ保存
  save() {
    const logPath = `logs/integrated-session-${this.sessionId}.json`;
    fs.writeFileSync(logPath, JSON.stringify(this.integratedLog, null, 2));
  }
  
  // GitHub Pages用ログ準備
  prepareForPublish(appId) {
    const publishLog = {
      sessionId: this.sessionId,
      appId,
      workflowVersion: "v0.6",
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      phaseChecks: this.integratedLog.phaseChecks,
      workMonitoring: this.integratedLog.workMonitoring.slice(-10), // 最新10件
      trustScore: this.calculateTrustScore()
    };
    
    return publishLog;
  }
}
```

### ワークフロー統合
```bash
# Phase 4: Auto Deploy（ログ統合版）

# デプロイ前チェック
!node core/phase-checker.cjs validate \
  --phase="deploy" \
  --action="git_upload" \
  --target="published-apps" \
  --path="./temp-deploy" \
  --app-id="app-$APP_NUM-$UNIQUE_ID" \
  --session="$SESSION_ID"

!if [ $? -eq 0 ]; then
  echo "✅ Phase check passed"
  
  # デプロイ実行
  git clone https://github.com/muumuu8181/published-apps ./temp-deploy
  mkdir -p ./temp-deploy/app-$APP_NUM-$UNIQUE_ID
  
  # アプリファイルコピー
  cp index.html ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/
  
  # 統合ログをアプリフォルダにコピー
  !echo "📋 Preparing session logs for publish..."
  !node core/log-integrator.cjs prepare-publish \
    --session="$SESSION_ID" \
    --app-id="app-$APP_NUM-$UNIQUE_ID" \
    --output="./temp-deploy/app-$APP_NUM-$UNIQUE_ID/session-log.json"
  
  # コミット・プッシュ
  cd ./temp-deploy && git add . && git commit -m "Deploy: app-$APP_NUM-$UNIQUE_ID with logs" && git push
  
else
  echo "❌ Phase check failed, aborting deployment"
  exit 1
fi
```

## 🎯 GitHub Pages公開後の効果

### ユーザーが確認できる内容
1. **アプリ動作**: https://muumuu8181.github.io/published-apps/app-004-xyz789/
2. **セッションログ**: https://muumuu8181.github.io/published-apps/app-004-xyz789/session-log.json
3. **詳細履歴**: https://muumuu8181.github.io/published-apps/app-004-xyz789/logs/

### 確認可能な情報
- **全フェーズチェック結果**: どこで何をチェックしたか
- **AI作業監視結果**: 本当に作業を実行したか
- **信頼スコア**: AIの作業品質評価
- **エラー・問題**: 発生した問題と対処法

### デバッグ・改善に活用
- **失敗パターン分析**: どこでよく失敗するか
- **時間分析**: どの作業に時間がかかるか
- **品質評価**: AIの作業精度向上

---

## 📝 実装優先度

### Phase 1（v0.7）: 基本統合
- [ ] core/log-integrator.cjs 作成
- [ ] phase-checker と work-monitor の統合
- [ ] ワークフローへの統合ログ出力追加

### Phase 2（v0.8）: GitHub Pages連携
- [ ] session-log.json のアプリフォルダ配置
- [ ] ログ一覧表示HTML作成
- [ ] 自動アップロード機能

### Phase 3（v0.9）: 分析・改善
- [ ] ログ分析ダッシュボード
- [ ] 失敗パターン自動検出
- [ ] 改善提案自動生成

**「透明性の高い開発プロセス＋事後検証可能な完全ログ」**