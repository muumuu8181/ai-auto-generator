# /wk-st - AI Auto Workflow v0.3

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

# Update generator system to latest version
!echo "📥 Updating AI Auto Generator..."
!git fetch origin main && git reset --hard origin/main
!echo "✅ Generator updated to latest version"

# Version verification
!echo "📋 Workflow Version: v0.3"
!echo "📅 Last Updated: $(date)"
!echo "🔍 Current commit: $(git rev-parse --short HEAD)"

# Initialize session tracking
!DEVICE_ID=$(node core/device-manager.cjs get)
!SESSION_ID=$(node core/session-tracker.cjs start $DEVICE_ID)
!echo "📱 Session: $SESSION_ID"

# Initialize work monitoring (嘘検出システム)
!echo "🔍 Starting work monitoring..."
!node core/work-monitor.cjs monitor-start $SESSION_ID
!echo "✅ Work monitor active - all actions will be logged"

# Fetch latest requirements
!node core/session-tracker.cjs log $SESSION_ID "Fetching requirements" info
!git clone https://github.com/muumuu8181/app-request-list ./temp-req 2>/dev/null || git -C ./temp-req pull

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
# Get next app number
!APP_NUM=$(node core/app-counter.cjs https://github.com/muumuu8181/published-apps)
!UNIQUE_ID=$(node core/id-generator.cjs)
!echo "🆔 App ID: app-$APP_NUM-$UNIQUE_ID"

# Check for duplicates on this device
!node core/device-manager.cjs check-completed
```

### Phase 3: AI Generation
```bash
!node core/session-tracker.cjs log $SESSION_ID "Starting AI generation" info

# Select appropriate template
# Generate code using Gemini CLI
# Apply requirements to template

# 🚨 重要: 作業監視ツールを使用してください（必須）
# ファイル作成時
!node core/work-monitor.cjs file-created $SESSION_ID ./app-$APP_NUM-$UNIQUE_ID/index.html

# UI要素追加時
!node core/work-monitor.cjs button-added $SESSION_ID "submitBtn" "送信" ./app-$APP_NUM-$UNIQUE_ID/index.html

# 機能実装時
!node core/work-monitor.cjs feature-implemented $SESSION_ID "Calculator" "四則演算機能" ./app-$APP_NUM-$UNIQUE_ID/index.html ./app-$APP_NUM-$UNIQUE_ID/script.js

# 動作確認時（必須）
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
- 🔧 Workflow Version: v0.3
- 📋 Requirements Commit: $(git -C ./temp-req rev-parse --short HEAD)
- 🕒 Fetched at: $(date)

#### Key Insights:
[AI should add specific insights from this generation process]

#### Challenges Overcome:
[AI should note any issues resolved during generation]

#### わかりづらかったこと:
[AI should note what was confusing, unclear, or needed better documentation]

#### Recommendations for Future:
[AI should suggest improvements based on experience]

#### Technical Notes:
- Generation timestamp: $(date -u)
- App structure: [describe the app created]
- Technologies used: [list technologies]

---
*Reflection specific to app-$APP_NUM-$UNIQUE_ID - Part of multi-AI generation ecosystem*" > ./temp-deploy/app-$APP_NUM-$UNIQUE_ID/reflection.md

# Configure and push
!cd ./temp-deploy && git add . && git commit -m "Deploy: app-$APP_NUM-$UNIQUE_ID with reflection" && git push

!echo "✅ Live at: https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/"

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

# 5.5. 一時ファイル削除
!rm -rf ./temp-req ./temp-deploy

# 5.6. 作業監視レポート生成（必須）
!echo "🔍 Generating work monitoring report..."
!node core/work-monitor.cjs report $SESSION_ID

# 5.7. 統計表示
!node core/session-tracker.cjs stats
!echo "🎉 Generation complete! 3点セット配置済み: reflection.md, requirements.md, work_log.md"
!echo "🔧 Workflow Version: v0.3 確認完了"
!echo "📋 Requirements最新版確認済み: $(git -C ./temp-req rev-parse --short HEAD)"
!echo "🔍 Work monitoring log saved: logs/work-monitor-$SESSION_ID.json"
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