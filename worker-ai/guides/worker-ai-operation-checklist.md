# Worker AI 動作確認チェックリスト

## 🎯 目的
Worker AIとして適切に動作するための確認項目と手順

---

## ✅ 初回セットアップ確認

### 1. 環境確認
- [ ] ai-auto-generatorフォルダが最新版か確認
- [ ] Git設定確認（user.name/email）
- [ ] 必要なツールの動作確認

```bash
# Git設定確認
git config --list | grep user

# Node.js確認
node --version

# Gemini CLI確認
npx @google/gemini-cli --version
```

### 2. 重要ファイル確認
- [ ] WORKER_SETUP[超重要L10].md 読み込み完了
- [ ] REFLECTION_MISTAKE_SAMPLES[超重要L10].md 読み込み完了
- [ ] PROGRESS_DISPLAY_FORMAT[超重要L10].md 読み込み完了
- [ ] VERSION.md 確認（現在バージョン把握）

---

## 📋 毎回作業開始時チェックリスト

### 1. 重要度確認（必須）
```bash
# 重要度8以上ファイル確認
find . -name "*重要L[8-9]*" -o -name "*超重要L10*" | head -10
```

### 2. 返信テンプレート記載（必須）
```
私は毎回、重要度が8以上のテキストを確認してから返事をします

✅ Worker AI チェックリスト確認完了:
- 4点セット作成準備完了（index.html, reflection.md, requirements.md, work_log.md）
- 品質基準理解済み（100%実装、レスポンシブ対応、エラーハンドリング）
- デプロイ5段階チェック準備完了
- バージョン情報記録準備完了
- Git設定確認済み（user.name/email）
```

---

## 🚀 アプリ生成時チェックリスト

### Phase 0: 環境検証
- [ ] Git設定確認
- [ ] 作業ディレクトリ確認
- [ ] 前回作業のreflection.md確認

```bash
# 品質検証ツール実行
node core/worker-quality-validator.cjs
```

### Phase 1: 要件分析
- [ ] app-requests.md確認
- [ ] アプリタイプ決定
- [ ] 重複チェック実行

```bash
# 重複検知
node core/duplicate-app-detector.cjs
```

### Phase 2: 設計・実装
- [ ] 4点セット作成開始
- [ ] レスポンシブ対応確認
- [ ] エラーハンドリング実装

### Phase 3: 品質検証
- [ ] 統合検証実行
- [ ] reflection.md詳細記録
- [ ] バージョン情報記載

### Phase 4: デプロイ
- [ ] Git add/commit/push実行
- [ ] GitHub Pages確認
- [ ] URL動作確認

```bash
# デプロイ確認
curl -I https://muumuu8181.github.io/published-apps/app-XXXXXXX-XXXXXX/
```

---

## 📝 reflection.md必須記載事項

### 1. バージョン・実行情報
- [ ] Workflowバージョン記載
- [ ] Requirementsリポジトリcommit情報
- [ ] 実行コマンド記載
- [ ] バッチ内位置記載（連続生成時）

### 2. 作業プロセス記録
- [ ] Phase別作業内容
- [ ] 所要時間記録
- [ ] 使用技術・ライブラリ記載

### 3. 問題・解決記録（最重要）
- [ ] 発生した問題の詳細記載
- [ ] エラーメッセージ記録
- [ ] 解決方法の具体的記載
- [ ] 再発防止策の提案

### 4. 学習・改善点
- [ ] 今回学んだこと
- [ ] 次回改善したいこと
- [ ] 他Worker AIへのアドバイス

---

## 🔧 トラブルシューティング

### Git関連
- [ ] リモートURL確認: `git remote -v`
- [ ] Author情報確認: `git log --oneline -5`
- [ ] プッシュ前確認: リポジトリ名確認

### デプロイ関連
- [ ] ファイル配置確認
- [ ] GitHub Pages設定確認
- [ ] ビルド状況確認
- [ ] HTTPステータス確認

### 品質関連
- [ ] DOCTYPE宣言確認
- [ ] titleタグ確認
- [ ] レスポンシブ対応確認
- [ ] エラーハンドリング確認

---

## 💡 効率化Tips

### Gemini CLI活用
```bash
# コードレビュー依頼
npx @google/gemini-cli -p "このコードをレビューしてください: $(cat index.html)"

# エラー解決相談
npx @google/gemini-cli -p "このエラーの解決方法を教えてください: [エラー内容]"
```

### 連続生成時
- 進捗表示フォーマット使用
- バッチ内位置を明確に記録
- 問題発生時は即座に記録

---

## 📊 成果報告

### 完了時報告内容
- [ ] アプリURL提供
- [ ] reflection.md記録完了報告
- [ ] 発見した問題・改善提案
- [ ] 次回への申し送り事項

---

**最終更新**: 2025-07-28
**作成者**: Worker AI