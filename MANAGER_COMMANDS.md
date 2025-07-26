# 📋 Manager専用コマンドメモ

## 💰 Claude Code使用量確認
```powershell
# WSL2環境でccusageを実行
wsl npx ccusage@latest daily
wsl npx ccusage@latest monthly
wsl npx ccusage@latest blocks --live
```

## 🔄 フィードバックループ設計

### 役割定義
- **Manager（管理AI）**: システム改良・保守・フィードバック分析
- **Worker（作業AI）**: アプリ生成実行（/wk-st使用）

### フィードバック対象
- **Gemini分析結果**: gemini-feedback.txt
- **Worker報告全体**: 各アプリ配下の全テキストファイル
  - reflection.md
  - requirements.md 
  - work_log.md
  - session-log.json
  - その他生成されたドキュメント

### 処理方針
1. **データ収集**: AI使わずツールのみで自動収集
2. **分析**: gemini-cliにまとめて読んでもらう（トークン節約）
3. **改善ルール生成**: パターン分析→Worker向け改善指示
4. **自動反映**: 次回/wk-st実行時に改善適用

## 🔄 フィードバックループ実行コマンド

### 完全フィードバックループ実行
```bash
# 基本実行（評価+自動バージョンアップ有効）
node core/feedback-loop-manager.cjs execute ../published-apps ./feedback-analysis 20 false

# 全自動実行（ルール適用+バージョンアップ）
node core/feedback-loop-manager.cjs execute ../published-apps ./feedback-analysis 20 true
```

### 個別コンポーネント実行
```bash
# データ収集のみ
node core/feedback-loop-collector.cjs collect ../published-apps feedback.jsonl

# 分析のみ
node core/feedback-loop-analyzer.cjs analyze feedback.jsonl ./analysis 15

# 統計確認
node core/feedback-loop-collector.cjs stats ../published-apps

# Worker AI評価のみ
node core/worker-evaluation-system.cjs evaluate ../published-apps/app-001-abc123

# バージョン管理のみ
node core/auto-version-manager.cjs current
node core/auto-version-manager.cjs next minor
```

### 新機能: 6段階フィードバックループ

#### Phase 1-3: 従来機能
1. **データ収集**: published-appsから全テキスト収集
2. **MapReduce分析**: Gemini CLIで個別→統合分析
3. **ルール適用**: Worker AI向け改善ルール生成

#### Phase 4-6: 新追加機能 ✨
4. **Worker AI評価**: 4段階品質評価（complete/good/insufficient/failure）
5. **自動バージョンアップ**: 成功時のv0.1自動増分
6. **総合レポート**: 評価結果含む詳細レポート

### 生成ファイル
- `worker-improvement-rules.md`: Worker AI向け改善ルール
- `worker-evaluations.jsonl`: Worker AI品質評価結果 ✨
- `feedback-loop-report.md`: 詳細分析レポート（評価結果含む）
- `manager-dashboard.json`: Manager実行履歴（バージョン履歴含む）
- `collected-feedback.jsonl`: 生データ（MapReduce用）

---
**更新日**: 2025-01-26
**Manager**: Claude (Management AI)