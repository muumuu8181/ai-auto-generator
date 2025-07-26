# 📱 パブリッシュ済みアプリURL一覧

**更新日時**: 2025-02-XX XX:XX:XX  
**総アプリ数**: 自動カウント中...

## 🚀 最新アプリ（最新5個）

1. **app-0000018-m9x3k2**: https://muumuu8181.github.io/published-apps/app-0000018-m9x3k2/
2. **app-0000017-k7x9m2**: https://muumuu8181.github.io/published-apps/app-0000017-k7x9m2/
3. **app-0000016-r9dth7**: https://muumuu8181.github.io/published-apps/app-0000016-r9dth7/
4. **app-0000004-wssf74**: https://muumuu8181.github.io/published-apps/app-0000004-wssf74/
5. **[次のアプリを待機中]**: [URL自動更新]

## 📋 チェック推奨順序

### 1. 最新アプリから順次チェック ⭐
- ブラウザで動作確認
- モバイル対応確認（Chrome DevTools）
- 基本機能テスト

### 2. 品質チェックポイント
```markdown
- [ ] ページが正常に表示される
- [ ] 基本機能が動作する
- [ ] モバイルで表示が崩れない  
- [ ] JavaScriptエラーがない（DevTools確認）
- [ ] レスポンシブデザインが適用されている
```

### 3. チェック効率化
- **新しいタブで複数開く**: 一度に複数アプリをチェック
- **キーボードナビゲーション**: ←→でアプリ切り替え（app-review-tool使用）
- **問題発見時**: すぐに対応する担当AI（Manager/Inspector）に報告

## ⚠️ 問題報告先

### 品質問題・バグ発見時
**reports-to-user/alerts/quality-issue-YYYYMMDD-HHMM.md** に報告:
```markdown
# 🚨 品質問題報告

- **アプリID**: app-XXXXXXX-XXXXXX
- **URL**: https://muumuu8181.github.io/published-apps/app-XXXXXXX-XXXXXX/
- **問題**: [具体的な問題の説明]
- **再現手順**: [問題を再現する手順]
- **環境**: [ブラウザ・デバイス情報]
- **緊急度**: [High/Medium/Low]
```

### デプロイ問題・404エラー
**reports-to-user/alerts/deploy-issue-YYYYMMDD-HHMM.md** に報告:
```markdown
# 🚨 デプロイ問題報告

- **アプリID**: app-XXXXXXX-XXXXXX
- **問題**: [404エラー/表示されない/その他]
- **確認した内容**: [GitHubリポジトリ確認結果]
- **エラーメッセージ**: [具体的なエラー]
```

## 🔧 app-review-tool の活用

### URL: [ai-auto-generator/tools/app-review-tool/index.html]

#### 機能
- **ワンクリックURL切り替え**: 複数アプリを効率的にレビュー
- **キーボードナビゲーション**: ←→キーでアプリ切り替え
- **フィードバック保存**: localStorage自動保存
- **音声入力対応**: Web Speech API

#### 使い方
1. app-review-tool を開く
2. アプリリストから確認したいアプリをクリック
3. iframe内でアプリの動作確認
4. ←→キーで次のアプリに移動
5. 問題発見時はフィードバック記録

## 📊 統計情報（自動更新予定）

```markdown
## アプリ品質統計
- **正常動作**: XX個 (XX%)
- **軽微な問題**: XX個 (XX%)  
- **重大な問題**: XX個 (XX%)
- **デプロイ失敗**: XX個 (XX%)

## 最近の傾向
- **品質向上**: [前月比]
- **デプロイ成功率**: [前月比]
- **ユーザビリティ**: [評価動向]
```

---

**自動更新**: Manager AIが新アプリ作成時に自動更新  
**手動確認**: Userが定期的にチェック・フィードバック  
**問題対応**: Inspector AI→Manager AI→Worker AIの連携で解決