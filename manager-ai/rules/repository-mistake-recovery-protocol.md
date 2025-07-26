# リポジトリ間違い修復プロトコル[超重要L10]

## 🚨 問題認識
- Worker AIが間違ったリポジトリにアップロード
- 間違い判明後もreflection.mdに記録しない
- 修正作業を行わない
- 同じミスが繰り返される

## 📋 必須修復ルール

### **Rule 1: ミス発見時の即座対応**
```markdown
間違ったリポジトリにアップロードした場合:

1. **作業停止**: 他の作業を中断
2. **状況確認**: どこに何をアップロードしたか記録
3. **reflection.md更新**: ミス内容を詳細記録
4. **修正実行**: 正しいリポジトリに再アップロード
5. **最終確認**: 正しい場所での動作確認
```

### **Rule 2: reflection.md必須記録内容**
```markdown
## 🚨 リポジトリ間違いミス発生

### ミス詳細
- **間違ったアップロード先**: [具体的なリポジトリURL/パス]
- **正しいアップロード先**: [正しいリポジトリURL/パス]
- **アップロードしたファイル**: [ファイル一覧]
- **発覚タイミング**: [いつ、どうやって気づいたか]

### 原因分析
- **なぜ間違えたのか**: [具体的な原因]
- **確認不足の内容**: [何を確認し忘れたか]
- **判断ミスの理由**: [思い込み・勘違いの内容]

### 修正作業
- **間違ったファイルの削除**: [実施した削除作業]
- **正しい場所への再配置**: [実施した修正作業]
- **動作確認**: [修正後の確認結果]

### 再発防止策
- **チェックポイント追加**: [今後確認する項目]
- **作業手順見直し**: [改善する手順]
- **自己ルール**: [個人的な注意事項]

### 学習内容
- **正しいリポジトリ構造理解**: [改めて理解した内容]
- **確認手順の重要性**: [学んだこと]
- **他のWorker AIへのアドバイス**: [伝えたい注意事項]
```

### **Rule 3: 修正完了までの必須手順**
```bash
# Step 1: 間違ったリポジトリから削除
cd [間違ったリポジトリ]
git rm -r app-XXXXXXX-XXXXXX/
git commit -m "Remove incorrectly placed app-XXXXXXX-XXXXXX"
git push origin main

# Step 2: 正しいリポジトリに配置
cd ../published-apps/
cp -r ../[間違った場所]/app-XXXXXXX-XXXXXX/ ./
git add app-XXXXXXX-XXXXXX/
git commit -m "Add app-XXXXXXX-XXXXXX to correct repository"
git push origin main

# Step 3: 動作確認
curl -I https://muumuu8181.github.io/published-apps/app-XXXXXXX-XXXXXX/

# Step 4: reflection.md更新
cd app-XXXXXXX-XXXXXX/
[reflection.mdに上記内容を追記]
git add reflection.md
git commit -m "Update reflection.md with repository mistake details"
git push origin main
```

## 🚫 禁止事項

### **絶対にやってはいけないこと**
- ❌ **ミスを隠す**: 間違いを報告せずに放置
- ❌ **reflection.md未更新**: ミス内容を記録しない
- ❌ **修正作業放棄**: 間違ったまま放置
- ❌ **曖昧な報告**: 「なんとなく間違えました」
- ❌ **同じミス繰り返し**: 学習せずに同じ間違いを再発

### **受け付けない言い訳**
- ❌ 「忙しかったので後回しにしました」
- ❌ 「どこが間違いかよくわからない」
- ❌ 「前回は成功したのに今回だけ」
- ❌ 「reflection.mdの書き方がわからない」

## 📊 Manager AI監視項目

### **自動検知システム**
```javascript
// repository-mistake-detector.cjs
async function detectRepositoryMistakes() {
    const mistakes = [];
    
    // ai-auto-generator内のapp-*検索
    const wrongPlaceApps = findAppsInWrongLocation();
    
    // 各アプリのreflection.md確認
    wrongPlaceApps.forEach(app => {
        const hasReflectionUpdate = checkReflectionUpdate(app);
        if (!hasReflectionUpdate) {
            mistakes.push({
                appId: app.id,
                issue: 'repository_mistake_not_recorded',
                severity: 'high',
                action: 'force_reflection_update'
            });
        }
    });
    
    return mistakes;
}
```

### **強制修正システム**
```bash
#!/bin/bash
# force-repository-correction.sh

APP_ID="$1"
WRONG_LOCATION="$2"
CORRECT_LOCATION="../published-apps"

echo "🚨 リポジトリ間違い強制修正: $APP_ID"

# 1. Worker AIに修正指示
cat > repository-mistake-notice.md << EOF
# 🚨 緊急修正指示

## 対象アプリ
- **アプリID**: $APP_ID
- **間違った配置**: $WRONG_LOCATION
- **正しい配置**: $CORRECT_LOCATION

## 必須作業（順番厳守）
1. reflection.md にミス内容詳細記録
2. 間違った場所からファイル削除
3. 正しい場所に再配置
4. 動作確認実行
5. 修正完了報告

## 期限
**即座実行**（他の作業より優先）
EOF

echo "📝 Worker AIに修正指示を送信"
echo "⏰ 修正完了まで他の作業は停止"
```

## 👁️ Inspector AI監査項目

### **リポジトリ間違い監査チェックリスト**
```markdown
# Inspector AI: リポジトリ間違い監査

## 📋 定期チェック項目
- [ ] ai-auto-generator内に不正なapp-*フォルダがないか
- [ ] 間違い発見時にreflection.mdが更新されているか
- [ ] 修正作業が完了しているか
- [ ] 同じWorker AIが同様のミスを繰り返していないか

## 📊 学習効果測定
- [ ] ミス発生頻度の推移
- [ ] reflection.md記録品質の向上
- [ ] 修正完了までの時間短縮
- [ ] 同種ミスの再発防止効果

## 🚨 エスカレーション条件
- reflection.md未更新が24時間継続
- 同じWorker AIが3回以上同種ミス
- 修正作業完了まで48時間超過
```

## 📋 Worker AI用完全チェックリスト

### **デプロイ前必須確認**
```markdown
# 🔍 デプロイ前リポジトリ確認チェックリスト

## Step 1: 現在位置確認
- [ ] `pwd` コマンドで現在のディレクトリ確認
- [ ] `published-apps/app-XXXXXXX-XXXXXX` にいることを確認
- [ ] `ai-auto-generator` 直下にいないことを確認

## Step 2: リモートリポジトリ確認  
- [ ] `git remote -v` で published-apps リポジトリを確認
- [ ] URL が `muumuu8181/published-apps.git` を含むことを確認
- [ ] `muumuu8181/ai-auto-generator.git` でないことを確認

## Step 3: ファイル配置確認
- [ ] `ls -la` で4点セットファイル存在確認
- [ ] index.html, reflection.md, requirements.md, work_log.md
- [ ] 不要なファイル（temp-*, .tmp等）がないことを確認

## Step 4: プッシュ前最終確認
- [ ] `git status` で追加ファイル確認
- [ ] 間違ったリポジトリにプッシュしようとしていないか再確認
- [ ] コミットメッセージにアプリIDが正しく含まれているか確認
```

### **間違い発覚時の即座対応**
```markdown
# 🚨 リポジトリ間違い発覚時の対応

## 即座実行（5分以内）
1. **作業停止**: 現在の作業を中断
2. **状況記録**: 何をどこにアップロードしたか記録
3. **reflection.md更新開始**: ミス内容の詳細記録を開始

## 30分以内実行
1. **間違ったファイル削除**: 誤った場所からファイル削除
2. **正しい場所に再配置**: published-appsに正しく配置
3. **動作確認**: 正しいURLでの動作確認

## 1時間以内実行
1. **reflection.md完了**: 詳細なミス分析・学習内容記録
2. **修正完了報告**: reports-to-user/alerts/ に報告
3. **再発防止策実施**: 個人チェックリスト更新
```

---

**重要**: リポジトリ間違いは「うっかりミス」では済まされません。**学習機会**として活用し、**必ずreflection.mdに詳細記録**してください。