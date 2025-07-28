# 現在存在する全ツール一覧
*調査日時: 2025-07-28*
*総数: 52個のCJSツール*

## 📂 カテゴリ別ツール分類

### 🔍 **Inspector AI関連** (9個)
1. `inspector-app-scanner.cjs` - アプリスキャン
2. `inspector-auto-display.cjs` - 自動表示システム
3. `inspector-auto-report.cjs` - 自動レポート生成
4. `inspector-evidence-tracker.cjs` - 証拠追跡
5. `inspector-rule-sync.cjs` - ルール同期
6. `inspector-url-checker.cjs` - URL確認
7. `inspector-visual-dashboard.cjs` - ビジュアルダッシュボード
8. `inspector-web-server.cjs` - Webサーバー
9. `published-apps-inventory.cjs` - アプリインベントリ

### 👔 **Management AI関連** (4個)
1. `management-ai-auto-tasks.cjs` - 自動タスク管理
2. `management-ai-incident-monitor.cjs` - インシデント監視
3. `management-ai-monitor.cjs` - Management AI監視
4. `management-ai-self-checker.cjs` - 自己チェック

### 🔨 **Worker AI関連** (2個)
1. `worker-evaluation-system.cjs` - Worker評価システム
2. `worker-quality-validator.cjs` - Worker品質検証

### 🤖 **AI全般・連携** (7個)
1. `ai-importance-checker.cjs` - 重要度チェック
2. `ai-performance-monitor.cjs` - AI性能監視
3. `ai-tool-execution-tracker.cjs` - ツール実行追跡
4. `ai_system_monitor.cjs` - **3AI総合監視** ⭐
5. `automation-level-analyzer.cjs` - **自動化レベル分析** ⭐
6. `deterministic-ai-evaluator.cjs` - 決定的AI評価
7. `navigation-todo-system.cjs` - **ナビゲーションTodo** ⭐

### 📱 **アプリ関連** (8個)
1. `app-counter.cjs` - アプリカウント
2. `app-generation-history.cjs` - 生成履歴
3. `app-type-manager.cjs` - アプリタイプ管理
4. `continuous-app-generator.cjs` - 継続生成
5. `duplicate-app-detector.cjs` - 重複検出
6. `external-app-detector.cjs` - 外部アプリ検出
7. `github-pages-app-detector.cjs` - GitHub Pages検出
8. `published-apps-monitor.cjs` - 公開アプリ監視

### 🔧 **ユーティリティ・基盤** (11個)
1. `auto-browser-launcher.cjs` - **ブラウザ自動起動** ⭐
2. `auto-improvement-loop.cjs` - 自動改善ループ
3. `auto-scheduler.cjs` - 自動スケジュール
4. `auto-version-manager.cjs` - バージョン管理
5. `device-manager.cjs` - デバイス管理
6. `file-protection.cjs` - ファイル保護
7. `id-generator.cjs` - ID生成
8. `session-tracker.cjs` - セッション追跡
9. `title-number-extractor.cjs` - タイトル番号抽出
10. `unified-logger.cjs` - 統合ログ
11. `unified_file_search.cjs` - **統合ファイル検索** ⭐

### 📊 **分析・評価** (6個)
1. `completion-enforcer.cjs` - 完了強制
2. `feedback-loop-analyzer.cjs` - フィードバック分析
3. `feedback-loop-collector.cjs` - フィードバック収集
4. `feedback-loop-manager.cjs` - フィードバック管理
5. `phase-checker.cjs` - フェーズチェック
6. `quality-challenge-analyzer.cjs` - 品質課題分析

### 🔬 **測定・検証** (4個)
1. `incident-reporter.cjs` - インシデント報告
2. `mockup-detector.cjs` - モックアップ検出
3. `stable_metric_extractor.cjs` - **安定メトリクス抽出** ⭐
4. `tool-validation-system.cjs` - ツール検証

### 🌐 **外部連携** (2個)
1. `gemini-analyzer.cjs` - Gemini分析
2. `gemini-feedback-generator.cjs` - Geminiフィードバック
3. `md-converter.cjs` - Markdown変換
4. `work-monitor.cjs` - 作業監視

### 📁 **その他** (1個)
1. `tools/app-review-tool/generate-urls.cjs` - URL生成ツール

---

## ⭐ **重要ツール (最近実装・高機能)**

### 🎯 **今日実装した重要ツール**
1. **`ai_system_monitor.cjs`** - 3AI総合性能測定
2. **`stable_metric_extractor.cjs`** - 安定メトリクス抽出
3. **`unified_file_search.cjs`** - 統合ファイル検索
4. **`navigation-todo-system.cjs`** - 迷子防止システム
5. **`automation-level-analyzer.cjs`** - 自動化レベル分析

### 🔍 **Inspector AI基盤ツール**
1. **`published-apps-inventory.cjs`** - 145件アプリ監視の主力
2. **`inspector-auto-display.cjs`** - ダッシュボード自動表示
3. **`auto-browser-launcher.cjs`** - ブラウザ自動起動

---

## 📊 **ツール重複・統合の可能性**

### 🔄 **類似機能ツール**
- アプリ検出系: `external-app-detector.cjs` + `github-pages-app-detector.cjs` + `published-apps-inventory.cjs`
- 監視系: `ai-performance-monitor.cjs` + `ai_system_monitor.cjs` + `published-apps-monitor.cjs`
- フィードバック系: `feedback-loop-*` 3個

### 💡 **統合検討対象**
- 重複するアプリ検出機能の統一
- 監視機能の集約
- フィードバック処理の一本化

---

## 🎯 **現在のツール成熟度**

### ✅ **安定稼働中**
- `published-apps-inventory.cjs` (145件監視)
- `unified_file_search.cjs` (検索統合)
- `stable_metric_extractor.cjs` (客観測定)

### 🔧 **開発・調整中**
- `ai_system_monitor.cjs` (測定基準調整中)
- `navigation-todo-system.cjs` (Todo管理)

### ❓ **用途不明・古いツール**
- 多数の実験的ツール
- 重複機能ツール
- 使用頻度不明ツール

---

**合計52個のツールが存在し、重要ツール約10個、重複・統合対象約15個**