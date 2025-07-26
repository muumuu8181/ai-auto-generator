# 🔄 フィードバックループシステム完全ガイド

**対象**: Manager AI専用  
**バージョン**: v0.10  
**最終更新**: 2025-01-26

## 🎯 システム概要

フィードバックループシステムは、Worker AI（アプリ生成AI）の成果物を自動分析し、改善ルールを生成してWorker AIに自動適用する**継続的品質向上システム**です。

### 🏗️ アーキテクチャ

```
Worker AI (過去) → published-apps/* → フィードバックループ → 改善ルール → Worker AI (未来)
                      │
                      ├─ reflection.md
                      ├─ work_log.md  
                      ├─ requirements.md
                      ├─ session-log.json
                      └─ gemini-feedback.txt
```

### 📊 処理フロー

1. **データ収集** → AI不使用でファイル収集・構造化
2. **MapReduce分析** → Gemini CLIで個別→統合分析
3. **ルール生成** → Worker AI向け実行可能な改善指示
4. **自動適用** → /wk-st.mdに改善ルール注入

## 🔧 詳細実装解説

### Phase 1: データ収集（feedback-loop-collector.cjs）

#### 🔍 フォルダ検出
```javascript
// app-*-* パターンでフォルダを自動検索
const pattern = path.join(directory, 'app-*-*');
glob(pattern, { onlyDirectories: true }, callback);
```

#### 📂 並列データ収集
```javascript
// Promise.allSettledで並列処理（効率化）
const collectionPromises = folders.map(folder => 
    this.collectFromAppFolder(folder, includeFileTypes)
);
const results = await Promise.allSettled(collectionPromises);
```

#### 📝 収集対象ファイル
- **reflection.md**: Worker AIの振り返り
- **work_log.md**: 作業ログ・エラー記録
- **requirements.md**: 要件定義
- **session-log.json**: 統合ログ
- **gemini-feedback.txt**: Gemini改善提案

#### 🛡️ 安全機能
- **50KB制限**: 大きなファイルは先頭50KBのみ読み込み
- **エラー処理**: 個別ファイル読み込み失敗でも続行
- **技術スタック自動検出**: package.json、拡張子から推定

#### 📊 出力形式
```json
{
  "projectId": "app-00000001-abc123",
  "timestamp": "2025-01-26T10:00:00.000Z",
  "files": {
    "reflection.md": {
      "content": "# プロジェクト振り返り...",
      "size": 2048,
      "modified": "2025-01-26T09:30:00.000Z",
      "truncated": false
    }
  },
  "metadata": {
    "techStack": ["React", "JavaScript"],
    "fileCount": 12,
    "totalSize": 15360
  }
}
```

### Phase 2: MapReduce分析（feedback-loop-analyzer.cjs）

#### 🗺️ Mapフェーズ（個別プロジェクト分析）

**データ準備**:
```javascript
// 3000文字制限対応（Gemini制約）
if (content.length > 3000) {
    content = content.substring(0, 3000) + 
             '\n[... content truncated for analysis ...]';
}
```

**Gemini CLI実行**:
```bash
# 一時ファイル経由でエスケープ問題回避
npx @google/gemini-cli -m gemini-2.5-pro -p "$(cat temp-prompt.txt)"
```

**プロンプト構造**（Few-shot + Chain-of-Thought）:
```
あなたは経験豊富なソフトウェアアーキテクトです。

## 分析指示（Chain-of-Thought）
1. まず、プロジェクトの全体的な品質を評価
2. reflection.mdとwork_log.mdから実際の作業プロセスを理解
3. gemini-feedback.txtがある場合は、過去の改善提案も考慮
4. 技術スタックと実装の適合性を評価
5. 具体的で実行可能な改善案を提案

## 出力形式（構造化JSON）
{
  "projectId": "app-001-abc123",
  "qualityScore": 75,
  "successFactors": ["明確な要件定義があった"],
  "failureReasons": ["エラーハンドリングが不十分"],
  "improvements": [
    {
      "category": "code_quality",
      "priority": "high",
      "suggestion": "エラーハンドリングの強化",
      "implementation": "try-catch文の追加",
      "techStack": ["JavaScript", "React"]
    }
  ]
}
```

#### 🔄 Reduceフェーズ（統合分析）

**データ集約**:
```javascript
// 全Map結果から頻出パターン抽出
const allSuccessFactors = mapResults.flatMap(r => r.successFactors);
const allFailureReasons = mapResults.flatMap(r => r.failureReasons);
```

**統合分析プロンプト**:
```
${totalProjects}個のAI生成プロジェクトの分析結果を統合し、
共通パターンと普遍的な改善ルールを特定してください。

## 思考プロセス
1. 成功要因と失敗原因の頻度を分析
2. 改善提案から実装可能で効果的なものを優先度付け
3. パターンから技術スタック別の傾向を抽出
4. 次回のWorker AIが従うべき普遍的なルールを策定
```

#### 📊 期待される出力
```json
{
  "commonPatterns": [
    {
      "pattern": "React使用時にstate管理が複雑化する",
      "frequency": 15,
      "severity": "medium"
    }
  ],
  "priorityImprovements": [
    {
      "rank": 1,
      "category": "error_handling", 
      "improvement": "try-catch文の統一的な実装",
      "impact": "high",
      "effort": "low"
    }
  ],
  "universalRules": [
    {
      "ruleId": "error-handling-001",
      "title": "必須エラーハンドリング",
      "description": "全ての非同期処理にtry-catch文を実装する",
      "priority": "high"
    }
  ]
}
```

### Phase 3: ルール生成・適用（feedback-loop-manager.cjs）

#### 📝 Worker AI向けMarkdown生成

**構造化ルール形式**:
```markdown
# Worker AI改善ルール（自動生成）

## 🔴 High Priority Rules

### Rule 1: エラーハンドリング必須化
- **適用技術**: JavaScript, TypeScript, Python
- **必須実装**: try-catch文をすべての非同期処理に追加
- **チェックポイント**: 
  - [ ] API呼び出しにtry-catch
  - [ ] ファイル操作にtry-catch
  - [ ] ユーザー入力処理にtry-catch

### Rule 2: レスポンシブデザイン必須
- **適用技術**: CSS, React, Vue
- **必須実装**: モバイルファーストのCSS設計
- **チェックポイント**:
  - [ ] max-width: 768px でテスト
  - [ ] フレックスボックス使用
  - [ ] 画像の適応的サイズ
```

#### ⚙️ /wk-st.mdへの自動適用

**安全な挿入処理**:
```javascript
// 1. 自動バックアップ作成
const backupPath = `${wkstPath}.backup.${Date.now()}`;
fs.copyFileSync(wkstPath, backupPath);

// 2. 挿入ポイント検索
const insertMarker = '## System Overview & Your Role';
const insertIndex = wkstContent.indexOf(insertMarker);

// 3. ルールセクション挿入
const rulesSection = `
## 🔄 最新改善ルール（自動適用）
**重要**: 以下のルールは過去のプロジェクト分析から自動生成されました。

${rulesContent}
---
`;

// 4. ファイル更新
const updatedContent = beforeInsert + rulesSection + afterInsert;
fs.writeFileSync(wkstPath, updatedContent);
```

## 🚀 実行方法

### 💿 基本実行
```bash
# 完全自動実行（手動ルール適用推奨）
node core/feedback-loop-manager.cjs execute ../published-apps ./feedback-analysis 20 false

# パラメータ詳細
# 1. ../published-apps    : Worker AIの成果物ディレクトリ
# 2. ./feedback-analysis  : 分析結果出力ディレクトリ
# 3. 20                   : 最大分析プロジェクト数
# 4. false                : ルール自動適用（true=自動、false=手動）
```

### 🔧 個別実行（開発・デバッグ用）
```bash
# Phase 1のみ: データ収集
node core/feedback-loop-collector.cjs collect ../published-apps feedback.jsonl

# Phase 2のみ: 分析
node core/feedback-loop-analyzer.cjs analyze feedback.jsonl ./analysis 15

# 統計確認
node core/feedback-loop-collector.cjs stats ../published-apps
```

### 📊 使用量確認
```powershell
# Claude Code使用量チェック
wsl npx ccusage@latest daily
wsl npx ccusage@latest monthly
wsl npx ccusage@latest blocks --live
```

## 📁 生成ファイル詳細

### 🗂️ 出力ディレクトリ構造
```
feedback-analysis/
├── collected-feedback.jsonl          # 生データ（JSONL形式）
├── map-results.json                  # Map分析結果
├── reduce-results.json               # Reduce統合結果
├── worker-improvement-rules.md       # Worker AI改善ルール★
├── feedback-loop-report.md           # 詳細レポート
├── feedback-loop-report.json         # JSON形式レポート
└── manager-dashboard.json            # 実行履歴・統計
```

### 📋 重要ファイル解説

#### worker-improvement-rules.md
- **目的**: Worker AIが次回実行時に従うべき具体的ルール
- **形式**: 優先度別・技術スタック別・チェックポイント付き
- **適用**: /wk-st.mdに手動または自動挿入

#### feedback-loop-report.md
- **目的**: Manager AIによる詳細分析レポート
- **内容**: 
  - 分析統計（プロジェクト数、成功率等）
  - フェーズ別実行結果
  - 改善効果予測
  - 次のアクション推奨

#### manager-dashboard.json
- **目的**: フィードバックループ実行履歴・統計管理
- **機能**: 
  - 過去の実行成功率追跡
  - 総分析プロジェクト数
  - 生成ルール数の推移

## ⚡ 期待される効果

### 📈 品質向上サイクル
```
Worker AI → アプリ生成 → フィードバックループ → 改善ルール → Worker AI (改良版)
  ↑                                                                      ↓
  └──────────────── 継続的品質向上 ←─────────────────────────────────┘
```

### 🎯 具体的改善例
1. **エラーハンドリング**: try-catch文の統一実装
2. **レスポンシブ**: モバイルファーストの自動適用
3. **アクセシビリティ**: WCAG準拠の自動チェック
4. **パフォーマンス**: コード分割・遅延読み込みの推奨

### 📊 測定可能な指標
- **品質スコア向上**: 平均75→85点
- **エラー率減少**: 30%→10%
- **開発効率化**: 繰り返し問題の予防
- **標準化**: 技術スタック別ベストプラクティス

## 🚨 注意事項・制限事項

### ⚠️ Gemini CLI制限
- **3500文字制限**: 大きなプロジェクトは自動分割
- **API制限**: 1秒間隔での実行（調整可能）
- **認証**: Googleアカウント認証推奨（無料枠利用）

### 🛡️ 安全機能
- **自動バックアップ**: /wk-st.md変更時に必ず作成
- **エラー継続**: 個別プロジェクト失敗でも全体処理継続
- **手動確認推奨**: 自動ルール適用前の手動レビュー

### 📏 スケーラビリティ
- **推奨プロジェクト数**: 20個以下（性能・品質バランス）
- **ディスク使用量**: 分析1回あたり約10-50MB
- **実行時間**: プロジェクト20個で約10-15分

## 🔄 運用推奨サイクル

### 📅 定期実行スケジュール
1. **週次実行**: 新規アプリ5-10個蓄積時
2. **重要アップデート時**: システム変更後
3. **問題発生時**: 品質低下やエラー増加時

### 🎯 効果測定
1. **実行前後比較**: 品質スコア、エラー率の変化
2. **Worker AI反応**: 改善ルール適用率の確認
3. **長期トレンド**: 月次での改善傾向分析

## 🆘 トラブルシューティング

### ❌ よくある問題

#### Gemini CLI認証エラー
```bash
# 認証状態確認
npx @google/gemini-cli -p "test"

# 設定ファイル確認
cat ~/.gemini/settings.json
# 期待値: {"selectedAuthType": "oauth-personal"}
```

#### データ収集エラー
```bash
# パーミッション確認
ls -la ../published-apps/

# フォルダ存在確認
node core/feedback-loop-collector.cjs stats ../published-apps
```

#### ルール適用失敗
```bash
# wk-st.mdの存在確認
ls -la .claude/commands/wk-st.md

# バックアップから復元
cp .claude/commands/wk-st.md.backup.* .claude/commands/wk-st.md
```

### 🔧 パフォーマンス調整

#### API制限対策
```javascript
// feedback-loop-analyzer.cjs内で調整
await this.delay(2000); // 1秒→2秒に変更
```

#### メモリ使用量削減
```javascript
// feedback-loop-collector.cjs内で調整
maxContentLength: 5000 // 8000→5000に減少
```

---

## 📚 関連ドキュメント

- **MANAGER_COMMANDS.md**: Manager AI専用コマンド一覧
- **MANAGEMENT_AI_RULES.md**: Manager AI運用ルール
- **VERSION.md**: システムバージョン履歴

---

**作成**: Manager AI (Claude)  
**更新**: 2025-01-26  
**システム**: AI Auto Generator v0.10