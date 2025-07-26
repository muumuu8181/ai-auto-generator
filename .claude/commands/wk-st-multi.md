# /wk-st-multi - 複数アプリ連続生成コマンド

## 概要
`/wk-st 3` のような形式で複数アプリを連続生成するコマンドです。

## 使用方法

### 基本形式
```
/wk-st-multi [数量] [アプリタイプ] [オプション]
```

### 例
- `/wk-st-multi 3` - 3個のアプリを連続生成
- `/wk-st-multi 5 money` - お金管理アプリを5個連続生成
- `/wk-st-multi 2 calculator force` - 電卓アプリを2個強制生成

## 実行

### Phase 1: 連続生成システム初期化
```bash
!echo "🔄 複数アプリ連続生成システム開始"

# パラメータ解析
!GENERATION_COUNT=${1:-1}
!APP_TYPE=${2:-""}
!FORCE_MODE=${3:-"false"}
!SKIP_DUPLICATES=${4:-"false"}

!echo "📊 生成設定:"
!echo "   生成数: $GENERATION_COUNT"
!echo "   アプリタイプ: ${APP_TYPE:-任意}"
!echo "   強制モード: $FORCE_MODE"
!echo "   重複スキップ: $SKIP_DUPLICATES"

# 入力値検証
!if [ "$GENERATION_COUNT" -lt 1 ] || [ "$GENERATION_COUNT" -gt 10 ]; then
  echo "❌ エラー: 生成数は1-10の範囲で指定してください"
  exit 1
fi

# セッションID生成
!SESSION_ID="continuous-$(date +%s)-$(shuf -i 1000-9999 -n 1)"
!echo "🆔 連続生成セッション: $SESSION_ID"
```

### Phase 2: 重複アプリ検知システム統合
```bash
!echo "🔍 重複検知システム初期化..."

# 重複アプリ検知システムの有効化
!node core/duplicate-app-detector.cjs detect ${APP_TYPE:-unknown} "連続生成アプリ" "自動生成された連続アプリ"

# 生成前の重複チェック
!if [ "$SKIP_DUPLICATES" != "true" ] && [ -n "$APP_TYPE" ]; then
  echo "📋 事前重複チェック実行..."
  DUPLICATE_RESULT=$(node core/duplicate-app-detector.cjs check $APP_TYPE "Continuous App" "Auto-generated app")
  CAN_PROCEED=$(echo $DUPLICATE_RESULT | jq -r '.canProceed // true')
  
  if [ "$CAN_PROCEED" = "false" ] && [ "$FORCE_MODE" != "true" ]; then
    echo "🚨 重複アプリ検知: 同タイプのアプリが既に存在します"
    echo "対策: 1) 既存アプリの改良 2) 異なるタイプの指定 3) force オプション使用"
    exit 1
  fi
fi
```

### Phase 3: 作業完了強制システム（重要度L8）
```bash
!echo "🚨 作業完了強制システム開始 (重要度L8)"

# 完了強制システム初期化
!node core/completion-enforcer.cjs continuous $GENERATION_COUNT ${APP_TYPE:-unknown}

!echo "⚠️ 重要度L8ルール:"
!echo "   - ${GENERATION_COUNT}個すべて完了するまで中断禁止"
!echo "   - 各アプリは完全デプロイまで必須"
!echo "   - エラー発生時も継続して残りを完了"
!echo "   - 完了報告を必ず実行"

# 開始時刻記録
!START_TIME=$(date +%s)
!echo "⏰ 開始時刻: $(date)"
!echo "⏰ 予想完了時刻: $(date -d "+$((GENERATION_COUNT * 60)) minutes")"
```

### Phase 4: 連続生成実行
```bash
!echo "🚀 連続アプリ生成開始..."

# 連続生成システム実行
!node core/continuous-app-generator.cjs $GENERATION_COUNT "$APP_TYPE" $FORCE_MODE $SKIP_DUPLICATES

# 実行結果の確認
!GENERATION_RESULT=$?
!END_TIME=$(date +%s)
!TOTAL_DURATION=$((END_TIME - START_TIME))

!echo "📊 連続生成実行結果:"
!echo "   実行時間: $((TOTAL_DURATION / 60))分$((TOTAL_DURATION % 60))秒"
!echo "   終了コード: $GENERATION_RESULT"

!if [ $GENERATION_RESULT -eq 0 ]; then
  echo "✅ 連続生成が正常に完了しました"
else
  echo "⚠️ 連続生成で一部問題が発生しました（詳細は上記を確認）"
fi
```

### Phase 5: 完了報告・統計生成
```bash
!echo "📊 完了報告・統計生成..."

# 完了強制システムに最終報告
!if [ $GENERATION_RESULT -eq 0 ]; then
  node core/completion-enforcer.cjs complete "continuous-$GENERATION_COUNT" "" "success"
else
  node core/completion-enforcer.cjs complete "continuous-$GENERATION_COUNT" "" "partial_success"
fi

# 生成統計表示
!echo "📈 連続生成統計:"
!node core/app-generation-history.cjs stats

# Published Apps監視システムに通知
!echo "📬 Published Apps監視システム更新..."
!node core/published-apps-monitor.cjs check ../published-apps

# Management AI自動タスク実行
!echo "🤖 Management AI自動タスク実行..."
!node core/management-ai-auto-tasks.cjs feedback-only

!echo "🎉 複数アプリ連続生成完了！"
!echo "📋 生成数: $GENERATION_COUNT"
!echo "⏰ 総実行時間: $((TOTAL_DURATION / 60))分"
!echo "📊 詳細は published-apps フォルダを確認してください"
```

## 🚨 重要度L8ルール（作業中断防止）

### 必須遵守事項
1. **連続生成中の中断は禁止**
   - 指定された数のアプリをすべて完了するまで継続
   - エラーや問題が発生しても可能な限り継続
   - 完了報告まで実行必須

2. **各アプリの完全完了**
   - 生成→デプロイ→ドキュメント作成まで必須
   - 部分的な完了は認められない
   - reflection.md等のドキュメント作成も必須

3. **エラー時の対応**
   - 1個のアプリが失敗しても残りを継続
   - 連続失敗（2個以上）でも可能な限り継続
   - 各エラーを詳細記録

4. **完了報告の必須化**
   - 最後のメッセージに全アプリの完了状況を報告
   - 成功・失敗・スキップの詳細を明記
   - デプロイURLの一覧表示

### 警告システム
- 30分以上非アクティブで警告
- 予定時間超過で緊急警告
- Management AIへの自動通知

## 重複検知・報告システム

### 自動検知機能
- アプリタイプ重複検知
- 要件内容類似性チェック
- 時間的近接性チェック（同日同タイプ）

### 報告機能
- 重複検知時の詳細レポート生成
- Management AI自動通知
- インシデント履歴記録

### 対処方針
- **重要度 Critical**: 生成を自動ブロック
- **重要度 High**: 警告表示・確認要求
- **重要度 Medium**: 警告のみ・継続可能

## エラーハンドリング

### 一般的なエラー
- 要件取得失敗 → 前回のキャッシュ使用
- GitHub Pages デプロイ失敗 → リトライ実行
- アプリ生成失敗 → スキップして次へ

### 致命的エラー
- 設定ファイル破損 → 緊急停止・Management AI通知
- Git リポジトリアクセス失敗 → 緊急停止
- 完了強制システム異常 → 緊急停止

## パフォーマンス最適化

### 生成間隔
- デフォルト: 30秒間隔
- GitHub Pages反映時間を考慮
- システム負荷分散

### リソース管理
- 一時ファイル定期削除
- メモリ使用量監視
- ディスク容量チェック

## ログ・監視

### 統合ログ
- 各アプリの生成ログ個別記録
- 連続生成セッション全体のログ
- エラー・警告の詳細記録

### 監視項目
- 生成成功率
- 平均生成時間
- エラー発生頻度
- 重複検知件数

---

**重要**: このコマンドは重要度L8の作業完了強制ルールが適用されます。開始後は必ず完了まで継続してください。