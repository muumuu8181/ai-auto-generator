# /wk-st - AI Auto Workflow v0.17

## 使用方法
- `/wk-st` - 単一アプリ生成（従来通り）
- `/wk-st 3` - 3個のアプリを連続生成
- `/wk-st 5` - 5個のアプリを連続生成
- `/wk-st 13` - 13個のアプリを連続生成

## System Overview & Your Role

You are part of an **automated AI application generation ecosystem** where:

### Multi-AI Environment
- **Multiple AI agents** may run this workflow simultaneously from different devices
- **Each AI generates unique apps** with device-specific identifiers (app-001-abc123, app-001-def456)
- **Parallel processing** is encouraged - competition creates variety and innovation
- **No coordination needed** - each AI works independently on the same requirements

### Your Mission
1. **Fetch** app requirements from external repository
2. **Generate** complete web applications using AI capabilities  
3. **Deploy** automatically to GitHub Pages
4. **Document** the process for continuous improvement
5. **Maintain** clean organization for the entire ecosystem

### Critical Success Factors
- **Always complete deployment** - partial work helps no one
- **Organize files properly** - others will build on your work
- **Document lessons learned** - share knowledge with the ecosystem
- **Think systematically** - you're part of a larger automated development system

## Objective
Automatically fetch project requirements and generate complete web applications with GitHub Pages deployment.

## Execution Flow

### Phase 1: Environment Setup
```bash
!echo "🚀 AI Auto Generator Starting..."

# 🔢 引数チェック（連続生成モード判定）
!GENERATION_COUNT=${1:-1}
!echo "📊 生成モード判定: ${GENERATION_COUNT}個のアプリ生成"

# 数値引数の検証
!if ! [[ "$GENERATION_COUNT" =~ ^[0-9]+$ ]] || [ "$GENERATION_COUNT" -lt 1 ] || [ "$GENERATION_COUNT" -gt 50 ]; then
  echo "❌ エラー: 生成数は1-50の数値で指定してください"
  echo "使用例: /wk-st 3, /wk-st 5, /wk-st 13"
  exit 1
fi

# 🔄 連続生成モード（2個以上の場合）
!if [ "$GENERATION_COUNT" -gt 1 ]; then
  echo "🚀 連続生成モード開始: ${GENERATION_COUNT}個のアプリを生成"
  echo "⚠️ 重要度L8: 全アプリ完了まで中断禁止"
  
  # 連続生成システム実行
  node core/continuous-app-generator.cjs $GENERATION_COUNT "" false false
  
  CONTINUOUS_RESULT=$?
  if [ $CONTINUOUS_RESULT -eq 0 ]; then
    echo "✅ 連続生成完了: ${GENERATION_COUNT}個のアプリが正常に生成されました"
  else
    echo "⚠️ 連続生成で一部問題が発生しました（詳細は上記を確認）"
  fi
  
  # 連続生成モードはここで終了
  exit $CONTINUOUS_RESULT
fi

# 📱 単一生成モード（従来通り）
!echo "📱 単一アプリ生成モード"

# Update generator system to latest version
!echo "📥 Updating AI Auto Generator..."
!git fetch origin main && git reset --hard origin/main
!echo "✅ Generator updated to latest version"

# Version verification
!echo "📋 Workflow Version: v0.17"
!echo "📅 Last Updated: $(date)"
!echo "🔍 Current commit: $(git rev-parse --short HEAD)"

# Initialize session tracking
!DEVICE_ID=$(node core/device-manager.cjs get)
!SESSION_ID=$(node core/session-tracker.cjs start $DEVICE_ID)
!echo "📱 Session: $SESSION_ID"

# Initialize unified logging system (統合ログシステム)
!echo "🔗 Initializing unified logging system..."
!node core/unified-logger.cjs init $SESSION_ID
!echo "✅ Unified logging active - all tools integrated"

# Initialize work monitoring (嘘検出システム)
!echo "🔍 Starting work monitoring..."
!node core/work-monitor.cjs monitor-start $SESSION_ID
!echo "✅ Work monitor active - all actions will be logged"

# Fetch latest requirements (強制最新取得でキャッシュ問題解決)
!node core/session-tracker.cjs log $SESSION_ID "Fetching requirements" info
!rm -rf ./temp-req
!git clone https://github.com/muumuu8181/app-request-list ./temp-req

# Verify requirements repository version
!echo "📋 Requirements Repository Status:"
!echo "🔍 Latest commit: $(git -C ./temp-req rev-parse --short HEAD)"
!echo "📅 Commit date: $(git -C ./temp-req log -1 --format=%cd)"
!echo "👤 Last author: $(git -C ./temp-req log -1 --format=%an)"

# Convert markdown to structured data
!node core/md-converter.cjs ./temp-req/app-requests.md ./temp-req/processed.json
!node core/session-tracker.cjs log $SESSION_ID "Requirements processed" info
```

### Phase 2: Project Selection
```bash
# User-Managed App Number Assignment (手作業ナンバリング対応)
!echo "🎯 Extracting app number from user-defined titles..."

# タイトル番号抽出（優先）
!TITLE_EXTRACT_RESULT=$(node core/title-number-extractor.cjs extract ./temp-req/app-requests.md 2>/dev/null || echo '{"success":false,"number":"999","method":"error"}')
!APP_NUM=$(echo $TITLE_EXTRACT_RESULT | jq -r '.number' 2>/dev/null || echo "999")
!EXTRACT_METHOD=$(echo $TITLE_EXTRACT_RESULT | jq -r '.method' 2>/dev/null || echo "fallback")
!APP_TITLE=$(echo $TITLE_EXTRACT_RESULT | jq -r '.title' 2>/dev/null || echo "Unknown App")

!echo "📱 Extracted app number: $APP_NUM (method: $EXTRACT_METHOD)"
!echo "📋 App title: $APP_TITLE"

# タイトル番号抽出が失敗した場合のフォールバック（旧システム）
!if [ "$APP_NUM" == "999" ] || [ "$APP_NUM" == "null" ] || [ -z "$APP_NUM" ]; then
  echo "⚠️ Title number extraction failed, trying type detection fallback..."
  REQUIREMENTS_TEXT=$(cat ./temp-req/app-requests.md | head -20 | tr '\n' ' ' 2>/dev/null || echo "fallback app")
  APP_TYPE_RESULT=$(node core/app-type-manager.cjs detect "$REQUIREMENTS_TEXT" 2>/dev/null || echo '{"number":"999","typeId":"unknown"}')
  APP_NUM=$(echo $APP_TYPE_RESULT | jq -r '.number' 2>/dev/null || echo "999")
  APP_TYPE=$(echo $APP_TYPE_RESULT | jq -r '.typeId' 2>/dev/null || echo "unknown")
  echo "📱 Fallback app number: $APP_NUM (type: $APP_TYPE)"
fi

!UNIQUE_ID=$(node core/id-generator.cjs)
!echo "🆔 Final App ID: app-$APP_NUM-$UNIQUE_ID ($APP_TYPE)"

# 空き容量チェック（新機能）
!echo "💾 Checking disk space..."
!node core/phase-checker.cjs validate --phase=pre-generation --action=git_upload --app-id=app-$APP_NUM-$UNIQUE_ID

# 統合ログにアプリ番号情報を記録
!node core/unified-logger.cjs log $SESSION_ID system app_number_assigned "App number extracted and assigned" "{\"appNumber\":\"$APP_NUM\",\"appTitle\":\"$APP_TITLE\",\"extractMethod\":\"$EXTRACT_METHOD\",\"appId\":\"app-$APP_NUM-$UNIQUE_ID\"}" info

# Check for duplicates on this device
!node core/device-manager.cjs check-completed

# 2.7. アプリタイプ別重複チェック・強制停止（v0.16強化）
!echo "🔍 Checking for duplicate app types..."
!APP_TYPE_FROM_NUM=$(node core/app-type-manager.cjs get-type-by-number $APP_NUM 2>/dev/null || echo "unknown")
!DUPLICATE_CHECK_RESULT=$(node core/app-generation-history.cjs check $APP_TYPE_FROM_NUM)
!echo "📊 Duplicate check result: $DUPLICATE_CHECK_RESULT"

# 2.8. 重複発見時の強制停止・事故報告（v0.16新機能）
!SHOULD_PROCEED=$(echo $DUPLICATE_CHECK_RESULT | jq -r '.shouldProceed // true')
!if [ "$SHOULD_PROCEED" = "false" ]; then
  echo "🚨 CRITICAL: Duplicate app type detected! Generation STOPPED."
  echo "📋 Duplicate Details: $DUPLICATE_CHECK_RESULT"
  
  # 事故報告生成
  node core/incident-reporter.cjs report duplicate_generation "$APP_TYPE_FROM_NUM" "$UNIQUE_ID" "$DUPLICATE_CHECK_RESULT" "$SESSION_ID"
  
  # セッション終了
  node core/session-tracker.cjs complete $SESSION_ID app-$APP_NUM-$UNIQUE_ID failed_duplicate_detected
  
  echo "❌ WORKFLOW TERMINATED: Duplicate app generation prevented"
  echo "📝 Incident report generated for Management AI review"
  exit 1
fi

!echo "✅ No duplicates detected. Safe to proceed with generation."
```

### Phase 3: AI Generation
```bash
!node core/session-tracker.cjs log $SESSION_ID "Starting AI generation" info

# 🚨 重要: 作業監視・エラー記録ツールを使用してください（必須）

# 3.1. アプリコンテキスト分析（Gemini統合開始）
!echo "🔍 Starting Gemini AI analysis..."
!mkdir -p ./temp-deploy/app-$APP_NUM-$UNIQUE_ID
!node core/gemini-analyzer.cjs analyze ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/ initial $SESSION_ID

# 3.2. 要件に基づくアプリ生成実作業
!echo "⚡ Starting app generation with requirements..."
# *** アプリ生成実作業をここで実行 ***
# Select appropriate template, Generate code using Gemini CLI, Apply requirements to template

# 3.3. 中間Gemini分析（生成後改善提案）
!echo "📊 Running mid-generation Gemini analysis..."
!node core/gemini-analyzer.cjs analyze ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/ mid $SESSION_ID

# エラー発生時の記録例（コマンド実行でエラーが出た場合）
# !node core/work-monitor.cjs record-error $SESSION_ID "npm install" "Error: EACCES permission denied" "sudo権限で実行" "medium"

# ハリボテ実装の場合は必ず自己申告
# !echo "⚠️ This implementation uses mockup/simulation data"
# !node core/mockup-detector.cjs mark ./app-$APP_NUM-$UNIQUE_ID mockup "AI generated simulation - not real functionality"

# ファイル作成時の記録
!node core/work-monitor.cjs file-created $SESSION_ID ./app-$APP_NUM-$UNIQUE_ID/index.html

# UI要素追加時の記録
!node core/work-monitor.cjs button-added $SESSION_ID "submitBtn" "送信" ./app-$APP_NUM-$UNIQUE_ID/index.html

# 機能実装時の記録
!node core/work-monitor.cjs feature-implemented $SESSION_ID "Calculator" "四則演算機能" ./app-$APP_NUM-$UNIQUE_ID/index.html ./app-$APP_NUM-$UNIQUE_ID/script.js

# 動作確認時の記録（必須）
!node core/work-monitor.cjs button-tested $SESSION_ID "submitBtn" true ./app-$APP_NUM-$UNIQUE_ID/index.html

!node core/session-tracker.cjs log $SESSION_ID "Generation complete" info
```

### Phase 4: Auto Deploy
```bash
!node core/session-tracker.cjs log $SESSION_ID "Deploying to GitHub Pages" info

# Clone deployment repository
!git clone https://github.com/muumuu8181/published-apps ./temp-deploy

# Create app directory and copy files
!mkdir -p ./temp-deploy/app-$APP_NUM-$UNIQUE_ID

# CRITICAL: Create reflection.md in app folder (NOT in root)
# 重要: REFLECTION_GUIDE.mdを参考に詳細で具体的な振り返りを作成
!echo "## App Generation Reflection - app-$APP_NUM-$UNIQUE_ID

### Generated: $(date)
### Session ID: $SESSION_ID  
### Device ID: $DEVICE_ID

#### Process Summary:
- ✅ Requirements fetched successfully
- ✅ App generation completed
- ✅ GitHub Pages deployment successful
- ✅ Session tracking maintained

#### Version Information:
- 🔧 Workflow Version: v0.14 (Gemini統合版)
- 📋 Requirements Commit: $(git -C ./temp-req rev-parse --short HEAD)
- 🕒 Fetched at: $(date)
- 🤖 Gemini AI分析: 実行済み

#### 🎯 プロジェクト概要:
[作成したアプリの内容と主要機能を3-4行で要約]

#### 🏗️ 技術実装の詳細:
- **使用技術**: [HTML5, CSS3, JavaScript等の具体的なバージョンやライブラリ]
- **アーキテクチャ**: [ファイル構成と役割分担の説明]
- **キー機能の実装方法**: [重要な機能がどのように実装されたか]

#### 🚧 発生した課題と解決策:
[課題がなかった場合は「特につまずいた課題はありませんでした」と明記]
- **課題1**: [具体的な問題]
  - **解決策**: [どのように解決したか]
  - **学習内容**: [この解決から得られた知見]
- **課題2**: [同様に具体的に記述]

#### 💡 重要な発見・学習:
- [実装中に気づいた重要なポイント]
- [予想外の動作や便利な手法]
- [パフォーマンス改善のヒント]

#### 😕 わかりづらかった・改善が必要な箇所:
- [ドキュメントの不明瞭な部分]
- [エラーメッセージの不親切さ]
- [手順の複雑さや曖昧さ]

#### 🎨 ユーザー体験の考察:
- [実際の使いやすさの評価]
- [見た目・デザインの工夫点]
- [モバイル対応やアクセシビリティ]

#### ⚡ パフォーマンス分析:
- [動作速度の体感評価]
- [ファイルサイズの最適化]
- [読み込み時間への配慮]

#### 🔧 次回への改善提案:
- [具体的な技術的改善案]
- [ワークフローの効率化案]
- [ツールや手法の提案]

#### 📊 作業効率の振り返り:
- **開始時刻**: [実際の開始時刻]
- **完了時刻**: $(date)
- **総作業時間**: [概算時間]
- **効率的だった作業**: [スムーズに進んだ部分]
- **時間がかかった作業**: [予想以上に時間を要した部分]

#### 🔍 品質チェック結果（必須確認項目）:

**基本動作確認**:
- [ ] メインページ読み込み（GitHub Pages URL）
- [ ] 全ての主要機能が動作
- [ ] エラーコンソールにクリティカルエラーなし
- [ ] レスポンシブデザイン確認

**ブラウザ互換性**:
- [ ] Chrome最新版で動作
- [ ] Firefox最新版で動作  
- [ ] Safari（可能であれば）で動作
- [ ] Edge（可能であれば）で動作

**モバイル・レスポンシブ**:
- [ ] スマートフォン画面（375px以下）で表示正常
- [ ] タブレット画面（768px〜1024px）で表示正常
- [ ] タッチ操作（該当機能がある場合）正常動作

**パフォーマンス確認**:
- [ ] ページ読み込み時間3秒以内
- [ ] JavaScript実行エラーなし
- [ ] CSS表示崩れなし
- [ ] 画像・リソース読み込み正常

**アクセシビリティ基本確認**:
- [ ] キーボードナビゲーション可能（該当する場合）
- [ ] コントラスト比確認（文字が読みやすい）
- [ ] 基本的なHTMLセマンティクス使用

**Gemini分析結果確認**:
- [ ] gemini-feedback.txtファイル生成確認
- [ ] 改善提案の妥当性確認
- [ ] 高優先度改善項目の認識

**デプロイ確認**:
- [ ] GitHub Pages URL正常アクセス
- [ ] 全ファイル（CSS/JS）正常読み込み
- [ ] session-log.json公開確認

**検出されたバグ・問題**:
- [実際に発見された問題とその対処法を記録]

#### 📝 Technical Notes:
- Generation timestamp: $(date -u)
- Session ID: $SESSION_ID
- App ID: app-$APP_NUM-$UNIQUE_ID
- Files created: [index.html, style.css, script.js等]
- Total file size: [概算サイズ]
- GitHub Pages URL: https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/

---
*Reflection specific to app-$APP_NUM-$UNIQUE_ID - Part of multi-AI generation ecosystem*" > ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/reflection.md

# 4.5. 最終Gemini分析・フィードバック生成（v0.14新機能）
!echo "🎯 Generating final Gemini feedback..."
!node core/gemini-analyzer.cjs analyze ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/ final $SESSION_ID
!node core/gemini-feedback-generator.cjs generate ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/ $SESSION_ID
!echo "✅ Gemini feedback generated: gemini-feedback.txt"

# Export unified session log for GitHub Pages (統合ログ公開)
!echo "📊 Exporting unified session log..."
!node core/unified-logger.cjs export $SESSION_ID ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/
!echo "✅ Session log exported as session-log.json"

# Configure and push
!cd ./temp-deploy && git add . && git commit -m "Deploy: app-$APP_NUM-$UNIQUE_ID with reflection and session log" && git push

!echo "✅ Live at: https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/"
!echo "📊 Session log: https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/session-log.json"

# デプロイ検証（必須）
!sleep 10  # GitHub Pagesの反映待ち
!node core/work-monitor.cjs deployment-verified $SESSION_ID "https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/" 200 1500

!node core/session-tracker.cjs log $SESSION_ID "Deployment successful" info
```

### Phase 5: 詳細記録・完了処理
```bash
# 5.1. 要件・仕様書作成（必須）
!cat > ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/requirements.md << 'EOF'
# 要件・仕様書: [アプリ名]

## 元要求
[ユーザーからの最初の要求をそのまま記録]

## 解釈した仕様
[AIが理解・解釈した具体的仕様]

## 技術的制約・判断
[実装上の制約や技術選択の理由]

## 変更履歴
- $(date): 初回作成
EOF

# 5.2. 作業履歴詳細記録（必須）
!cat > ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/work_log.md << 'EOF'
# 作業履歴: [アプリ名]

## 作業概要
- 開始時刻: [開始時刻]
- 完了時刻: $(date)
- 担当AI: Claude
- 作業内容: [概要]

## 実行コマンド詳細
[実際に実行したコマンドを全て記録]

## エラー・問題と対処
[発生した問題と解決方法]

## 最終確認項目
- [x] GitHub Pages動作確認
- [x] 要件満足度確認
- [x] reflection.md作成完了
- [x] requirements.md作成完了
- [x] work_log.md作成完了
EOF

# 5.3. 3点セット再プッシュ
!cd ./temp-deploy && git add . && git commit -m "Add documentation: requirements.md + work_log.md" && git push

# 5.4. 完了記録
!node core/device-manager.cjs mark-complete app-$APP_NUM-$UNIQUE_ID
!node core/session-tracker.cjs complete $SESSION_ID app-$APP_NUM-$UNIQUE_ID success

# 5.4.5. アプリ生成履歴記録（v0.15新機能）
!echo "📝 Recording app generation history..."
!FINAL_APP_TYPE=$(node core/app-type-manager.cjs get-type-by-number $APP_NUM 2>/dev/null || echo "unknown")
!node core/app-generation-history.cjs record app-$APP_NUM-$UNIQUE_ID $FINAL_APP_TYPE "$APP_TITLE"
!echo "✅ App generation history recorded with duplicate detection"

# 5.5. 一時ファイル削除
!rm -rf ./temp-req ./temp-deploy

# 5.6. 統合ログ最終処理とレポート生成
!echo "📊 Generating unified session report..."
!node core/unified-logger.cjs stats $SESSION_ID
!node core/unified-logger.cjs complete $SESSION_ID app-$APP_NUM-$UNIQUE_ID success

# 5.7. 統計表示
!node core/session-tracker.cjs stats
!echo "🎉 Generation complete! 4点セット配置済み: reflection.md, requirements.md, work_log.md, session-log.json"
!echo "📊 統合ログ公開: https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/session-log.json"
# ワークフローバージョン確認完了
!echo "🔧 Workflow Version: v0.9 確認完了"
!echo "📋 Requirements最新版確認済み: $(git -C ./temp-req rev-parse --short HEAD)"
!echo "🔗 Unified log saved: logs/unified-$SESSION_ID.json"
!echo "次回実行: /wk-st"
```

## Configuration
- `config/repos.json`: External repository URLs
- `config/templates.json`: Available app templates  
- `templates/`: Reusable application templates

## Key Lessons from Previous Generations

### Critical Best Practices (from reflection.md insights):
1. **Directory Discipline**: Always verify current directory with `pwd` before operations
2. **Configuration Backup**: Never rely on git hard reset without backing up configs first  
3. **GitHub Pages Activation**: Use GitHub CLI API to ensure Pages activation
4. **Absolute Path Usage**: Avoid relative paths that can cause navigation errors
5. **Step-by-step Verification**: Check each phase completion before proceeding

### Proven Error Recovery Strategies:
- **Command Issues**: Manually execute workflow steps if automation fails
- **Config Reset**: Re-update settings immediately after any git hard reset
- **Pages Deployment**: Verify GitHub Pages activation through multiple methods
- **Path Problems**: Use absolute paths and constant directory verification

## Error Handling
- Continues on test failures (prioritizes deployment)
- Fallback templates for generation errors
- Detailed error logging in session history
- **Apply lessons learned from previous AI generations**

## Organization Rules
- **reflection.md goes INSIDE each app folder** (app-001-abc123/reflection.md)
- **Never place reflection.md in repository root**
- **Each reflection is specific to its app** - enables proper organization
- **Template structure must be consistent** for multi-AI environment

## 🚨 データ保護 (最優先)
**変更前必須チェック**: [CRITICAL_DATA_PROTECTION.md](../docs/CRITICAL_DATA_PROTECTION.md)を必ず確認

```bash
# すべての変更前に実行必須
!cp ./temp-requests/app-requests.md ./temp-requests/app-requests.md.backup.$(date +%Y%m%d_%H%M%S)
!echo "$(date): [バックアップ] app-requests.md before processing" >> work_history.log
!git -C ./temp-requests tag "backup-$(date +%Y%m%d_%H%M%S)" -m "処理前自動バックアップ"
```

**Goal: Complete deployment regardless of minor issues while maintaining ecosystem organization!**
**絶対ルール**: ユーザーデータの復元不可能な変更は厳禁!