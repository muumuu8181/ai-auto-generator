# /wk-st - AI Auto Workflow

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

#### Key Insights:
[AI should add specific insights from this generation process]

#### Challenges Overcome:
[AI should note any issues resolved during generation]

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

**Goal: Complete deployment regardless of minor issues while maintaining ecosystem organization!**