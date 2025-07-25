# /generate - AI Auto App Generator

## Objective
Automatically fetch project requirements and generate complete web applications with GitHub Pages deployment.

## Execution Flow

### Phase 1: Environment Setup
```bash
!echo "🚀 AI Auto Generator Starting..."

# Initialize session tracking
!DEVICE_ID=$(node core/device-manager.cjs get)
!SESSION_ID=$(node core/session-tracker.cjs start $DEVICE_ID)
!echo "📱 Session: $SESSION_ID"

# Fetch latest requirements
!node core/session-tracker.cjs log $SESSION_ID "Fetching requirements" info
!git clone https://github.com/muumuu8181/app-request-list ./temp-req 2>/dev/null || git -C ./temp-req pull

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
# Validate basic functionality

!node core/session-tracker.cjs log $SESSION_ID "Generation complete" info
```

### Phase 4: Auto Deploy
```bash
!node core/session-tracker.cjs log $SESSION_ID "Deploying to GitHub Pages" info

# Clone deployment repository
!git clone https://github.com/muumuu8181/published-apps ./temp-deploy

# Create app directory and copy files
!mkdir -p ./temp-deploy/app-$APP_NUM-$UNIQUE_ID

# Configure and push
!cd ./temp-deploy && git add . && git commit -m "Deploy: app-$APP_NUM-$UNIQUE_ID" && git push

!echo "✅ Live at: https://muumuu8181.github.io/published-apps/app-$APP_NUM-$UNIQUE_ID/"
!node core/session-tracker.cjs log $SESSION_ID "Deployment successful" info
```

### Phase 5: Cleanup & Stats
```bash
# Record completion
!node core/device-manager.cjs mark-complete app-$APP_NUM-$UNIQUE_ID
!node core/session-tracker.cjs complete $SESSION_ID app-$APP_NUM-$UNIQUE_ID success

# Cleanup temporary files
!rm -rf ./temp-req ./temp-deploy

# Show statistics
!node core/session-tracker.cjs stats
!echo "🎉 Generation complete! Run /generate for next app"
```

## Configuration
- `config/repos.json`: External repository URLs
- `config/templates.json`: Available app templates  
- `templates/`: Reusable application templates

## Error Handling
- Continues on test failures (prioritizes deployment)
- Fallback templates for generation errors
- Detailed error logging in session history

**Goal: Complete deployment regardless of minor issues!**