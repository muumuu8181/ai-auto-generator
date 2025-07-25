# 🚨 重要データ保護・復元ガイド

## ❌ 絶対に避けるべき致命的ミス

### 1. バックアップなしでの変更・削除
**例**: ユーザーの「格好良い電卓」要求を復元手順なしで削除

### 2. git reset --hard の乱用
**問題**: 履歴を完全に消去し、復元不可能にする

### 3. 作業履歴の未記録
**問題**: 何をいつ変更したか追跡できない

## ✅ 必須の保護手順

### Phase 1: 変更前の必須確認
```bash
# 1. 現在の状態を必ず記録
git status
git log --oneline -5

# 2. 変更対象ファイルのバックアップ作成
cp ファイル名 ファイル名.backup.$(date +%Y%m%d_%H%M%S)

# 3. git stash で一時保存（重要な変更がある場合）
git stash push -m "変更前バックアップ: $(date)"
```

### Phase 2: 変更内容の記録
```bash
# 4. 作業開始ログ
echo "$(date): [作業開始] 対象ファイル: $ファイル名, 変更内容: $変更内容" >> work_history.log

# 5. 変更実行
# （実際の変更作業）

# 6. 変更完了ログ  
echo "$(date): [作業完了] 結果: 成功/失敗, 詳細: $詳細" >> work_history.log
```

### Phase 3: 復元可能性の確保
```bash
# 7. 変更後の状態記録
git add . && git commit -m "変更: $変更内容 - 復元用タグ: backup-$(date +%Y%m%d_%H%M%S)"

# 8. 復元用タグ作成
git tag "backup-$(date +%Y%m%d_%H%M%S)" -m "復元ポイント: $変更内容"

# 9. リモートに必ずプッシュ
git push origin main --tags
```

## 🔄 復元手順

### 緊急復元（git履歴が残っている場合）
```bash
# 1. 復元ポイント確認
git log --oneline --grep="backup"
git tag -l "backup-*"

# 2. 特定のファイルのみ復元
git checkout [コミットID] -- ファイル名

# 3. 全体復元（最終手段）
git reset --hard [コミットID]
git push --force origin main
```

### 完全消失時の復元
```bash
# 1. バックアップファイル検索
find . -name "*.backup.*" -type f

# 2. 作業履歴から手がかり確認
cat work_history.log | grep "変更内容"

# 3. 手動復元実行
```

## 📋 必須チェックリスト

### 変更前チェック ✅
- [ ] 現在の状態をgit logで確認済み
- [ ] 対象ファイルをバックアップ作成済み
- [ ] 変更内容をwork_history.logに記録済み
- [ ] git stashで現在の変更を保存済み（必要に応じて）

### 変更後チェック ✅
- [ ] 変更結果をwork_history.logに記録済み
- [ ] git commitで変更を記録済み
- [ ] 復元用タグを作成済み
- [ ] リモートリポジトリにプッシュ済み
- [ ] 動作確認完了

## 🚫 絶対禁止事項

### 1. バックアップなしでの git reset --hard
```bash
# ❌ 絶対にダメ
git reset --hard HEAD~1

# ✅ 正しい手順
git stash push -m "緊急バックアップ"
git tag "emergency-backup-$(date +%Y%m%d_%H%M%S)"
git reset --hard HEAD~1
```

### 2. ユーザーデータの無確認削除
```bash
# ❌ 絶対にダメ
rm app-requests.md

# ✅ 正しい手順
cp app-requests.md app-requests.md.backup.$(date +%Y%m%d_%H%M%S)
echo "$(date): [バックアップ] app-requests.md" >> work_history.log
# 削除実行
```

### 3. 作業履歴の未記録
**すべての変更は work_history.log に記録必須**

## 📝 必須記録内容（3つの柱）

### 1. 新要件・仕様の全記録 📋
**すべての新しい要件や仕様変更は必ずドキュメント化**
```bash
# 新要件が発生した場合（例）
echo "## 新要件: 格好良い電卓" >> requirements_history.md
echo "- 発生日時: $(date)" >> requirements_history.md  
echo "- 要求者: ユーザー" >> requirements_history.md
echo "- 内容: [具体的な要件内容]" >> requirements_history.md
echo "- 影響範囲: [システムへの影響]" >> requirements_history.md
echo "" >> requirements_history.md
```

### 2. 作業履歴の詳細記録 🔧
**実行したコマンド・操作内容を具体的に記録**
```bash
# work_history.log 詳細記録形式
echo "$(date '+%Y-%m-%d %H:%M:%S'): [開始] 作業: $作業名" >> work_history.log
echo "$(date '+%Y-%m-%d %H:%M:%S'): [コマンド] 実行: $実際のコマンド" >> work_history.log  
echo "$(date '+%Y-%m-%d %H:%M:%S'): [結果] 出力: $コマンド結果" >> work_history.log
echo "$(date '+%Y-%m-%d %H:%M:%S'): [変更] ファイル: $変更ファイル一覧" >> work_history.log
echo "$(date '+%Y-%m-%d %H:%M:%S'): [完了] 結果: 成功/失敗, 詳細: $詳細" >> work_history.log
echo "---" >> work_history.log
```

**記録すべき具体的内容**:
- 実行したbashコマンド全て
- ファイル編集の before/after
- git操作とコミットメッセージ
- エラーと対処方法
- 判断理由と根拠

### 3. アプリフォルダへの統合記録 📁
**各アプリフォルダに3つのファイルを必ず配置**
```bash
# アプリフォルダ内の必須ファイル構成
app-XXX-XXXXX/
├── index.html              # メインアプリ
├── reflection.md           # 振り返り（既存）
├── requirements.md         # 要件・仕様書（新規）
└── work_log.md            # 作業履歴（新規）
```

### 詳細記録テンプレート

#### requirements.md テンプレート
```markdown
# 要件・仕様書: [アプリ名]

## 元要求
[ユーザーからの最初の要求をそのまま記録]

## 解釈した仕様
[AIが理解・解釈した具体的仕様]

## 技術的制約・判断
[実装上の制約や技術選択の理由]

## 変更履歴
- [日時]: [変更内容と理由]
```

#### work_log.md テンプレート  
```markdown
# 作業履歴: [アプリ名]

## 作業概要
- 開始時刻: [時刻]
- 完了時刻: [時刻] 
- 担当AI: Claude
- 作業内容: [概要]

## 実行コマンド詳細
```bash
# 1. 環境準備
pwd
git status

# 2. ファイル作成
cat > index.html << 'EOF'
[実際のファイル内容]
EOF

# 3. git操作
git add .
git commit -m "実際のコミットメッセージ"
git push origin main
```

## エラー・問題と対処
[発生した問題と解決方法]

## 最終確認項目
- [ ] GitHub Pages動作確認
- [ ] 要件満足度確認
- [ ] reflection.md作成完了
```

## ⚡ 緊急対応プロトコル

### データ消失が発覚した場合
1. **即座に作業停止**
2. **現在の状態をログに記録**
3. **バックアップファイル検索実行**
4. **git reflog で履歴確認**
5. **復元実行**
6. **ユーザーに状況報告**

## 🎯 実装必須ルール

**すべてのAIエージェントは以下を遵守**:

1. ファイル変更前に必ずバックアップ作成
2. すべての作業をwork_history.logに記録
3. git操作前に復元用タグ作成
4. ユーザーデータは神聖不可侵
5. 疑問があれば変更前にユーザー確認
6. **新要件・仕様は必ずドキュメント化**
7. **実行コマンドは具体的に記録**
8. **アプリフォルダに3点セット必須配置**:
   - reflection.md (振り返り)
   - requirements.md (要件・仕様書)
   - work_log.md (作業履歴)

**格言**: "復元できない変更は変更ではなく破壊である"
**追加格言**: "記録されない作業は存在しない作業である"