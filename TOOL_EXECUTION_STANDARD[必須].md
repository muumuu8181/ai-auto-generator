# 全ツール共通実行履歴標準
*作成日: 2025-07-28*
*適用対象: 全52個のCJSツール*

## 🎯 **必須要件: 実行履歴**

### 📋 **全ツール必須実装事項**

#### 1. **実行開始ログ**
```javascript
console.log(`🔧 [${new Date().toISOString()}] ${ツール名} 実行開始`);
```

#### 2. **実行完了ログ**  
```javascript
console.log(`✅ [${new Date().toISOString()}] ${ツール名} 実行完了 - 所要時間: ${実行時間}ms`);
```

#### 3. **履歴ファイル保存**
```javascript
const executionRecord = {
    timestamp: new Date().toISOString(),
    tool_name: '${ツール名}',
    execution_time_ms: ${実行時間},
    success: true/false,
    input_parameters: ${入力パラメータ},
    output_summary: ${出力要約},
    session_id: ${セッションID}
};

// /logs/tool_execution_history.json に追記
```

#### 4. **エラー時ログ**
```javascript
console.error(`❌ [${new Date().toISOString()}] ${ツール名} 実行失敗: ${エラー内容}`);
```

---

## 📚 **全ツール使用ルールブック**

### 🎯 **各ツールの使用場面定義**

#### 🔍 **Inspector AI専用ツール**
```
published-apps-inventory.cjs
├── 使用タイミング: 毎回会話開始時 (必須)
├── 実行コマンド: node core/published-apps-inventory.cjs
├── 期待結果: 145件アプリの最新ステータス
└── 失敗時対応: GitHub clone再実行

inspector-auto-display.cjs  
├── 使用タイミング: インベントリ実行後 (必須)
├── 実行コマンド: node core/inspector-auto-display.cjs
├── 期待結果: 5グラフダッシュボード表示
└── 失敗時対応: 手動ダッシュボード確認

stable_metric_extractor.cjs
├── 使用タイミング: データ整合性確認時
├── 実行コマンド: node core/stable_metric_extractor.cjs
├── 期待結果: 客観的整合性スコア
└── 失敗時対応: ファイル存在確認
```

#### 🤖 **AI共通ツール**
```
ai_system_monitor.cjs
├── 使用タイミング: 3AI性能測定時
├── 実行コマンド: node core/ai_system_monitor.cjs
├── 期待結果: Manager/Inspector/Worker性能%
└── 失敗時対応: 個別AI測定実行

unified_file_search.cjs
├── 使用タイミング: ファイル検索時 (Glob/Grep/LS/Read代替)
├── 実行コマンド: node core/unified_file_search.cjs [command] [args]
├── 期待結果: 統一された検索結果
└── 失敗時対応: 従来ツール併用

navigation-todo-system.cjs
├── 使用タイミング: 作業迷子防止時
├── 実行コマンド: node core/navigation-todo-system.cjs
├── 期待結果: 現在地・次タスク明確化
└── 失敗時対応: 手動状況整理
```

#### 🔧 **ユーティリティツール**
```
auto-browser-launcher.cjs
├── 使用タイミング: ダッシュボード表示時
├── 実行コマンド: node core/auto-browser-launcher.cjs
├── 期待結果: ブラウザ自動起動
└── 失敗時対応: 手動URL案内
```

---

## ⚠️ **実行履歴未実装ツールの対応**

### 📊 **現状**
- **実装済み: 約10個**
- **未実装: 約42個** ← 緊急対応必要

### 🚀 **対応方針**
1. **重要ツール優先** - Inspector基盤ツールから実装
2. **段階的実装** - 使用頻度順に履歴機能追加
3. **統一テンプレート** - 全ツール共通履歴形式

---

## 📋 **実装チェックリスト**

### ✅ **履歴機能実装済み**
- [ ] ai-tool-execution-tracker.cjs
- [ ] stable_metric_extractor.cjs  
- [ ] unified_file_search.cjs
- [ ] ai_system_monitor.cjs

### ❌ **実装必要 (優先順)**
- [ ] published-apps-inventory.cjs ⚠️ 最重要
- [ ] inspector-auto-display.cjs ⚠️ 重要
- [ ] auto-browser-launcher.cjs
- [ ] navigation-todo-system.cjs
- [ ] automation-level-analyzer.cjs

### 🔧 **実装作業**
- [ ] 各ツールに履歴機能追加
- [ ] 統一ログ形式適用
- [ ] 実行テスト・動作確認
- [ ] ルールブック更新

---

## 🎯 **次のアクション**

1. **最重要ツールから履歴機能実装**
2. **全ツール使用ルール明文化**
3. **実行履歴の可視化システム構築**

*この標準に基づいて全52個のツールを段階的に更新予定*