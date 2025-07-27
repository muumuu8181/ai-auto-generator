# AI Auto Generator セットアップガイド（メイン）

## 🎯 最初に確認: あなたの役割は？

**Userから伝えられた役割に応じて、該当セットアップへ進んでください**

### 👑 Manager AI の場合
→ **MANAGER_SETUP.md** を熟読してください

### 🔧 Worker AI の場合  
→ **WORKER_SETUP.md** を熟読してください

### 👁️ Inspector AI の場合
→ **INSPECTOR_SETUP.md** を熟読してください

⚠️ **重要**: 役割別セットアップを読まずに作業開始しないでください

---

## 📚 全AI共通の基礎知識

### システム全体目標
**「他のAIでは1ヶ月かかるものを一発指示で作れる」システムの実現**

### 基本構成
- **User**: システム所有者・最終決定者
- **Manager AI**: システム管理・戦略立案・環境提供
- **Worker AI**: 高品質Webアプリ生成・品質確保
- **Inspector AI**: 客観的第三者評価・品質監査

### 3者相互監視システム
- **階層なし平等**: 上下関係なし・相互チェック
- **専門分業**: 各AIが得意領域に集中
- **継続改善**: 全員参加型システム改善

### 重要度システム
- **[超重要L10]**: 最優先読み込み必須
- **[重要L7]**: 高優先度
- **重要度6以上**: User事前承認必須（Manager AI）
- **重要度5以下**: 独自判断可（後付け報告OK）

---

## 📁 フォルダ構成概要

```
ai-auto-generator/
├── manager-ai/          # Manager AI専用
├── inspector-ai/        # Inspector AI専用  
├── worker-ai/          # Worker AI専用
├── shared/             # 全AI共有
├── reports-to-user/    # User報告専用
├── core/              # システムファイル（共通）
└── [役割別セットアップファイル]
```

### アクセス権限
- **読み取り**: 全AI・全フォルダ読み取り可能
- **書き込み**: 専用フォルダ + shared/ のみ
- **User報告**: reports-to-user/ 活用

---

## 🔄 基本ワークフロー

### Worker AI
1. `/wk-st` または `/ws` コマンドでアプリ生成
2. 4点セット作成（index.html, reflection.md, requirements.md, work_log.md）
3. GitHub Pages自動デプロイ

### Inspector AI  
1. `/ins-st` コマンドで品質監査
2. アプリスキャン・URL確認・品質評価
3. 視覚ダッシュボード生成

### Manager AI
1. MANAGEMENT_AI_RULES[超重要L10].md遵守
2. 環境提供・システム改善・問題解決
3. Gemini CLI相談・統合ログ記録

---

## ⚡ 重要な注意事項

### バージョン管理
- **現在バージョン**: VERSION.mdで確認
- **自動アップデート**: 各実行時に最新版取得
- **変更記録**: 全変更をVERSION.mdに記録

### 品質保証
- **相互監視**: 他AIの作業も評価・フィードバック
- **学習記録**: reflection.md詳細記録必須
- **継続改善**: 問題発見時は積極的改善提案

### User報告
- **定期報告**: reports-to-user/での効率的報告
- **緊急報告**: reports-to-user/alerts/での即座報告
- **URL一覧**: reports-to-user/url-lists/でアプリ管理

---

## 🚀 今すぐ次のステップ

**あなたの役割に応じて、該当セットアップファイルに進んでください**

- **Manager AI** → **MANAGER_SETUP.md**
- **Worker AI** → **WORKER_SETUP.md**  
- **Inspector AI** → **INSPECTOR_SETUP.md**

各役割別セットアップで、具体的な実行手順・必須ファイル・注意事項を確認してください。

---

**最終更新**: 2025-07-27  
**適用バージョン**: v0.23以降