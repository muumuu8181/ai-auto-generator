# AI役割別ドキュメント更新義務一覧 [重要L8]

## 🎯 機械的チェック基準: 毎回会話での更新義務

### 📊 現在の実態 vs あるべき姿

---

## 👑 Manager AI (統括・判断AI)

### 📋 現在の更新実態
```
実際に更新されるもの:
❌ なし - Manager AI専用ログ・記録は未実装

期待されるもの:
❌ なし - 具体的義務未定義
```

### ✅ あるべき姿 (機械的チェック対象)
```
必須更新ドキュメント (毎回会話):
1. logs/manager-decisions.json        - 判断記録
2. logs/manager-instructions.json    - 指示記録  
3. logs/ai-coordination.json         - AI間調整記録
4. logs/session-summary.json         - セッション要約

チェック基準:
- ファイル存在確認 (fs.existsSync)
- 最新タイムスタンプ確認 (本日更新)
- 記録項目数カウント (0件は失格)
```

---

## 🔍 Analyzer AI (分析専門AI) - NEW

### 📋 現在の更新実態
```
実際に更新されるもの:
❌ まだ存在しない (新設AI)

期待されるもの:
❌ 義務未定義
```

### ✅ あるべき姿 (機械的チェック対象)
```
必須更新ドキュメント (毎回分析実行時):
1. logs/analysis-results.json        - 分析結果
2. logs/data-collection.json         - 収集データ
3. logs/fact-findings.json           - 発見事実
4. logs/analysis-evidence.json       - 分析証跡

チェック基準:
- 全分析実行でファイル更新確認
- 客観的事実のみ記録 (判断・提案禁止)
- データ収集コマンド実行履歴記録
```

---

## 🔧 Worker AI (開発・実装専門AI)

### 📋 現在の更新実態
```
実際に更新されるもの:
✅ published-apps/*/reflection.md    - 複数存在確認
❌ temp-deploy/*/reflection.md       - 1件のみ (不安定)
❌ logs/worker-session.json          - 未実装

期待されるもの:
✅ reflection.md作成ルール存在
❌ 機械的チェック基準なし
```

### ✅ あるべき姿 (機械的チェック対象)
```
必須更新ドキュメント (毎回実装作業):
1. temp-deploy/[APP-ID]/reflection.md     - 作業振り返り
2. temp-deploy/[APP-ID]/work_log.md       - 作業ログ
3. logs/worker-implementation.json        - 実装記録
4. logs/worker-errors.json                - エラー・回復記録

チェック基準:
- 新規アプリフォルダ作成時、reflection.md必須存在
- work_log.mdに実際の作業時間・手順記録
- エラー発生時はerrors.jsonに記録必須
- 全てファイル存在 + 内容空でない
```

---

## 👁️ Inspector AI (監視・検証専門AI)

### 📋 現在の更新実態
```
実際に更新されるもの:
✅ logs/inspector-visual-dashboard.html  - 自動更新
✅ logs/inspector-rule-sync.json        - データ存在
❌ logs/inspection-details.json         - 未実装

期待されるもの:
✅ 視覚化システム動作中
❌ 詳細検証記録なし
```

### ✅ あるべき姿 (機械的チェック対象)
```
必須更新ドキュメント (毎回検証実行時):
1. logs/quality-inspection.json      - 品質検証結果
2. logs/url-validation.json          - URL動作確認結果
3. logs/performance-metrics.json     - パフォーマンス測定
4. logs/inspection-evidence.json     - 検証証跡

チェック基準:
- 検証実行毎にファイル更新
- URL確認結果の数値記録
- 品質スコア算出根拠記録
- 検証失敗時の詳細記録
```

---

## 🔎 Expectation Validator AI (期待値検証AI) - NEW

### 📋 現在の更新実態
```
実際に更新されるもの:
❌ まだ存在しない (新設AI)

期待されるもの:
❌ 義務未定義
```

### ✅ あるべき姿 (機械的チェック対象)
```
必須更新ドキュメント (毎回検証実行時):
1. logs/expectation-gaps.json        - 期待値vs実際のギャップ
2. logs/compliance-check.json        - 義務遵守チェック結果
3. logs/validation-evidence.json     - 検証証跡
4. logs/improvement-needs.json       - 改善必要箇所

チェック基準:
- 全AI作業後の義務チェック実行
- ギャップ検出時の詳細記録
- 数値ベース評価結果記録
- 改善提案の具体性確認
```

---

## 🔄 全AI共通義務

### 📋 共通更新ドキュメント
```
必須更新 (全AI):
1. logs/ai-tool-execution-history.json   - ツール実行履歴
2. logs/importance-checks.json           - 重要度確認記録
3. logs/session-activity.json           - セッション活動記録

チェック基準:
- 毎回のツール実行記録
- 重要度ファイル確認記録
- セッション開始・終了記録
```

---

## 📊 機械的チェック実装案

### 自動義務チェック
```javascript
// document-obligation-checker.cjs
class DocumentObligationChecker {
    checkManagerAI() {
        // logs/manager-decisions.json 存在・更新確認
        // 本日のタイムスタンプ確認
        // 記録件数カウント
    }
    
    checkWorkerAI() {
        // temp-deploy/*/reflection.md 必須存在確認
        // work_log.md 作業時間記録確認
        // 空ファイル検出・失格判定
    }
    
    checkInspectorAI() {
        // 検証結果ファイル更新確認
        // 数値データ記録確認
        // URL確認実行証跡確認
    }
}
```

### 義務遵守スコア
```
Manager AI: 0/4 = 0%    - 義務未実装
Analyzer AI: 0/4 = 0%   - 新設AI
Worker AI: 1/4 = 25%    - reflection.mdのみ不安定
Inspector AI: 2/4 = 50% - 基本機能のみ
Expectation Validator: 0/4 = 0% - 新設AI

全体義務遵守率: 15% (3/20)
```

---

## 🚨 改善優先度

### 🔥 最優先 (義務遵守0%)
1. **Manager AI**: 判断・指示記録システム実装
2. **Analyzer AI**: 分析結果記録システム実装
3. **Expectation Validator**: 検証記録システム実装

### ⚙️ 高優先 (義務遵守25-50%)
1. **Worker AI**: reflection.md生成安定化
2. **Inspector AI**: 詳細検証記録追加

**機械的チェックにより、主観排除・正確な義務遵守測定を実現します**