# AI Auto Generator

AI-powered automatic app generation and deployment template.

## Overview
An automated system where AI autonomously creates applications and deploys them to GitHub Pages.

## Quick Start

```bash
git clone https://github.com/muumuu8181/ai-auto-generator.git
cd ai-auto-generator
claude
/generate
```

## Features

- 🤖 **AI-Powered Generation**: Google Gemini CLI integration
- 🚀 **Auto Deployment**: Direct GitHub Pages publishing  
- 📝 **Natural Language Input**: Simple Markdown requirements
- 🔄 **Multi-Device Support**: Terminal ID management
- 📊 **Work History Tracking**: Detailed session logs
- 🎯 **Template System**: Reusable app templates

## System Architecture

```
ai-auto-generator/
├── core/              # Core generation scripts
├── templates/         # App templates
├── docs/             # Documentation
├── config/           # Configuration files
└── .claude/          # Claude Code commands
```

## Workflow

1. **Input**: Add requirements to external repository
2. **Process**: AI analyzes and selects highest priority item
3. **Generate**: Creates complete web application
4. **Deploy**: Automatically publishes to GitHub Pages
5. **Track**: Records session history and statistics

## AI Implementation

- **Engine**: Google Gemini CLI (OAuth authentication)
- **Models**: gemini-2.5-pro, gemini-2.5-flash
- **Reference**: claude-ai-toolkit integration patterns
- **Security**: Prompt injection protection, input sanitization