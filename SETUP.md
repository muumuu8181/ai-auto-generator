# Setup Guide

## Initial Setup (One-time only)

### 1. Clone Repository
```bash
git clone https://github.com/muumuu8181/ai-auto-generator.git
cd ai-auto-generator
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
# Start Claude Code
claude

# Test the command
/generate
```

## Daily Usage

Just run:
```bash
claude
/generate
```

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

## Features

✅ **Auto-Update**: Generator updates itself every run  
✅ **Session Tracking**: Detailed logs with timestamps  
✅ **Device Management**: Prevents duplicate generation  
✅ **Error Recovery**: Continues on failures  
✅ **Statistics**: Track generation success rate  

**Ready to generate unlimited apps with `/generate`!**