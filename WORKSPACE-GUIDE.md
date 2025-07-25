# Workspace & Directory Guide

## Current Implementation

The `/wk-st` command is available **only within the ai-auto-generator directory**.

## Working Directory Options

### Option 1: Project-Specific (Current/Recommended)
```bash
# Navigate to project directory each time
cd ai-auto-generator
claude
/wk-st
```

**Pros:**
- ✅ Clean separation from existing Claude Code setup
- ✅ No conflicts with existing commands
- ✅ All project files in one place
- ✅ Easy to manage and update

**Cons:**
- ❌ Must cd into directory each time

### Option 2: Global Command Installation
```bash
# One-time setup: Copy command globally
cp .claude/commands/wk-st.md ~/.claude/commands/

# Then use anywhere
cd ~/any-directory
claude
/wk-st
```

**Pros:**
- ✅ Available from any directory
- ✅ Convenient for frequent use

**Cons:**
- ❌ Path issues (core/ scripts won't be found)
- ❌ Potential conflicts with existing setup
- ❌ Harder to update/maintain

### Option 3: Home Directory Integration
```bash
# Move entire project to home directory
mv ai-auto-generator/* ~/
mv ai-auto-generator/.claude/commands/* ~/.claude/commands/
```

**Pros:**
- ✅ Work from familiar home directory
- ✅ Global command access

**Cons:**
- ❌ Clutters home directory
- ❌ Mixes project files with personal files
- ❌ Update process becomes complex

## Recommendation: Option 1 (Project-Specific)

**Why Project-Specific is Better:**

1. **Clean Environment**: No interference with existing Claude Code setup
2. **Easy Updates**: `git pull` updates everything automatically  
3. **Portable**: Easy to share or move to different machines
4. **Organized**: All project files contained in one directory

## Claude Code Settings Impact

### What is NOT affected by working directory:
- ✅ **Global settings**: `~/.claude/config.json`
- ✅ **Authentication**: API keys, OAuth tokens
- ✅ **User preferences**: Theme, default model, etc.
- ✅ **Global commands**: Any commands in `~/.claude/commands/`

### What IS directory-specific:
- 📁 **Local commands**: `./.claude/commands/` (like our `/wk-st`)
- 📁 **Project settings**: `./CLAUDE.md`, `./.claude/config.json`
- 📁 **Local context**: Files and git repository in current directory

## Recommended Workflow

### Setup (One-time):
```bash
cd ~
git clone https://github.com/muumuu8181/ai-auto-generator.git
cd ai-auto-generator
# Follow SETUP.md
```

### Daily Usage:
```bash
cd ~/ai-auto-generator  # Navigate to project
claude                  # Start Claude Code (inherits global settings)
/wk-st                  # Use project-specific command
```

### Alternative: Create Alias
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias wk-st-work='cd ~/ai-auto-generator && claude'
```

Then just run:
```bash
wk-st-work
/wk-st
```

## Summary

- **Existing Claude Code settings remain intact**
- **Project isolation prevents conflicts**  
- **Simple navigation with cd command**
- **Automatic updates with git pull**
- **Clean and maintainable setup**

The project-specific approach is the most reliable and maintainable option.