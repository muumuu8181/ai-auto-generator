# Setup Guide

## Initial Setup (One-time only)

### 1. Clone Repository
```bash
git clone https://github.com/muumuu8181/ai-auto-generator.git
cd ai-auto-generator  # Important: Navigate into the project directory
```

### 2. Required External Repositories
Create these repositories on GitHub:

**A. App Request Repository**
```bash
# Create: https://github.com/[YOUR_USERNAME]/app-request-list
# Add file: app-requests.md with format:

## Money Management App
- Input income and expenses
- Edit entries after creation
- Download data as CSV

## Todo App
- Add/remove tasks
- Mark as complete
- Priority levels
```

**B. Published Apps Repository**
```bash
# Create: https://github.com/[YOUR_USERNAME]/published-apps (PUBLIC)
# Enable GitHub Pages: Settings → Pages → Deploy from branch → main
```

### 3. Update Configuration
Edit these files with your GitHub username:

**config/repos.json**
```json
{
  "appRequests": "https://github.com/[YOUR_USERNAME]/app-request-list",
  "publishedApps": "https://github.com/[YOUR_USERNAME]/published-apps"
}
```

### 4. Gemini CLI Setup
```bash
# Install Gemini CLI
npm install -g @google/gemini-cli

# Setup OAuth (recommended - free)
mkdir -p ~/.gemini
echo '{"selectedAuthType": "oauth-personal", "theme": "Default"}' > ~/.gemini/settings.json

# Test authentication
npx @google/gemini-cli -p "Hello, test"
```

### 5. Claude Code Setup
```bash
# Make sure you're in the ai-auto-generator directory
cd ai-auto-generator

# Start Claude Code
claude

# Test the command
/wk-st
```

## Daily Usage

**Important**: Always navigate to the project directory first:
```bash
cd ai-auto-generator  # Navigate to project directory
claude                # Start Claude Code
/wk-st               # Use the command
```

The `/wk-st` command only works within the ai-auto-generator directory.

The system will:
1. **Auto-update** to latest generator version
2. **Fetch** latest app requirements  
3. **Generate** next priority app
4. **Deploy** to GitHub Pages automatically
5. **Track** session history and statistics

## File Structure After Setup

```
ai-auto-generator/
├── core/                  # Core generation scripts
├── templates/             # App templates  
├── config/               # Your configuration
│   └── repos.json        # Repository URLs
├── .claude/
│   └── commands/
│       └── generate.md   # Main command
└── README.md
```

## Troubleshooting

### GitHub Authentication
```bash
# Check GitHub CLI auth
gh auth status

# Login if needed
gh auth login
```

### Gemini CLI Issues
```bash
# Check authentication
npx @google/gemini-cli -p "test"

# Reset if needed
rm -rf ~/.gemini
# Then redo step 4
```

### Repository Access
- Ensure `app-request-list` exists and has `app-requests.md`
- Ensure `published-apps` is PUBLIC with GitHub Pages enabled
- Check repository URLs in `config/repos.json`

## Quick Reference

### Every time you want to use /wk-st:
```bash
cd ai-auto-generator  # Navigate to project directory
claude                # Start Claude Code  
/wk-st               # Generate apps
```

## Important Notes from Real AI Experience

### Configuration Management (Learned from reflection.md)
- **Backup configs before updates**: git hard reset can reset your settings
- **Verify working directory**: Always check with `pwd` before operations  
- **Use absolute paths**: Avoid relative path navigation errors

### GitHub Pages Deployment
- **Enable Pages immediately**: Use GitHub CLI API for reliable activation
- **Verify deployment**: Check both repository settings and live URL
- **Allow processing time**: Pages may take 5-10 minutes to activate

### File Organization Rules
- **Stay in project directory**: /wk-st only works in ai-auto-generator folder
- **Maintain structure**: Each app gets its own organized folder
- **Reflection placement**: reflection.md goes INSIDE each app folder, not root

## Features

✅ **Auto-Update**: Generator updates itself every run  
✅ **Session Tracking**: Detailed logs with timestamps  
✅ **Device Management**: Prevents duplicate generation  
✅ **Error Recovery**: Proven strategies from real AI generations
✅ **Statistics**: Track generation success rate  
✅ **Knowledge Base**: Incorporates lessons from successful deployments

**Ready to generate unlimited apps with `/wk-st` - Enhanced with real-world insights!**