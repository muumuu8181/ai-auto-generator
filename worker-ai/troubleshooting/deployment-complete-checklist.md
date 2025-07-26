# 🚀 デプロイ完全チェックリスト

## ⚠️ 重要: 全手順実行後に報告すること

「デプロイできません」と報告する前に、以下の全手順を必ず実行してください。

### Phase 1: 基本チェック ✅
- [ ] ファイルが正しいフォルダ（published-apps/app-XXXXXXX-XXXXXX/）に配置されているか
- [ ] index.html が存在し、構文エラーがないか
- [ ] 必要な画像・CSSファイルがすべて存在するか
- [ ] ファイル名に日本語・特殊文字がないか
- [ ] ファイルサイズが異常に大きくないか（各ファイル10MB以下）

### Phase 2: GitHub設定確認 ⚙️
```bash
# 必須確認コマンド
git config user.name    # "AI Auto Generator" であること
git config user.email   # "ai@muumuu8181.com" であること
git remote -v           # published-apps リポジトリであること
pwd                     # published-apps/app-XXXXXXX-XXXXXX/ にいること
```

### Phase 3: コミット・プッシュ実行 📤
```bash
# 必須実行手順（順番厳守）
cd ../published-apps/app-XXXXXXX-XXXXXX/
git add .
git status              # 追加ファイル確認
git commit -m "Add app-XXXXXXX-XXXXXX: [アプリの説明]"
git push origin main
```

### Phase 4: GitHub Pages確認 🌐
- [ ] GitHubリポジトリ（https://github.com/muumuu8181/published-apps）でファイルがプッシュされているか確認
- [ ] GitHub Pages設定が有効になっているか確認
- [ ] **5-10分待機**（GitHub Pagesビルド時間）
- [ ] URLアクセステスト: https://muumuu8181.github.io/published-apps/app-XXXXXXX-XXXXXX/
- [ ] ブラウザキャッシュクリア（Ctrl+F5）後、再度アクセステスト

### Phase 5: 詳細診断（失敗時のみ） 🔍
```bash
# HTTPステータス確認
curl -I https://muumuu8181.github.io/published-apps/app-XXXXXXX-XXXXXX/

# ファイル存在確認
ls -la published-apps/app-XXXXXXX-XXXXXX/

# Git状況確認
git log --oneline -5
git status
```

## 📋 報告必須フォーマット

**全手順実行後**、以下を `/reports-to-user/alerts/` に報告:

```markdown
# 🚨 デプロイ問題報告

## 基本情報
- **アプリID**: app-XXXXXXX-XXXXXX
- **試行回数**: X回目
- **最終試行日時**: YYYY-MM-DD HH:MM:SS

## ✅ 実行済み確認項目
- [x] Phase 1: 基本チェック完了
- [x] Phase 2: GitHub設定確認完了
- [x] Phase 3: コミット・プッシュ実行完了
- [x] Phase 4: GitHub Pages確認完了
- [x] Phase 5: 詳細診断実行完了

## 📊 各フェーズ結果
### Phase 1結果
[成功/失敗 + 詳細記述]

### Phase 2結果  
```bash
git config user.name: AI Auto Generator
git config user.email: ai@muumuu8181.com
git remote -v: https://github.com/muumuu8181/published-apps.git
pwd: /path/to/published-apps/app-XXXXXXX-XXXXXX
```

### Phase 3結果
```bash
git add . : [成功/失敗]
git status: [表示内容]
git commit: [成功/失敗 + commit hash]
git push: [成功/失敗 + 出力メッセージ]
```

### Phase 4結果
- GitHub確認: [ファイルがプッシュされている/いない]
- 待機時間: X分
- URL確認: [200 OK / 404 Not Found / その他]
- キャッシュクリア後: [成功/失敗]

### Phase 5結果（実施時のみ）
```bash
curl -I結果: [HTTPステータス + 詳細]
ls -la結果: [ファイル一覧]
git log結果: [最新5コミット]
```

## 🚨 現在の問題
[全手順実行後も解決しない問題の詳細説明]

## 📝 エラーメッセージ
```
[実際のエラーメッセージをそのままコピー&ペースト]
```

## 🤔 推測される原因
[Worker AI視点での問題原因推測]

## 🙏 要求するサポート
[具体的にどのようなサポートが必要か]
```

## 🚫 受け付けない報告例

以下のような報告は**受け付けません**:
- ❌ 「デプロイできませんでした」（手順未実行）
- ❌ 「たぶん設定が間違っています」（確認せずに推測）
- ❌ 「前回は成功したのに」（今回の手順未実行）
- ❌ 「GitHub Pagesが動かないみたいです」（詳細確認なし）

## ✅ 正しい報告例

```markdown
Phase 1-5全て実行しましたが、curl -I で404エラーが返されます。
git pushは成功し、GitHubリポジトリにもファイルが存在することを確認しました。
10分待機後もアクセスできません。
具体的なエラーメッセージ: [実際のメッセージ]
```

---

**重要**: このチェックリストは「自分でできることを全て試す」ためのものです。全手順実行後に問題が残る場合のみサポートを要求してください。