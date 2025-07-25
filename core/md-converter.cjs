#!/usr/bin/env node

/**
 * Markdown to JSON Converter
 * Converts natural language app requirements to structured data
 */

const fs = require('fs');

class MarkdownConverter {
    constructor() {
        this.priorityKeywords = ['最優先', 'urgent', '高優先度', 'ASAP', 'high priority'];
    }

    convert(mdFile, outputFile) {
        if (!fs.existsSync(mdFile)) {
            console.error(`❌ File not found: ${mdFile}`);
            process.exit(1);
        }

        const content = fs.readFileSync(mdFile, 'utf8');
        const structured = this.parseMarkdown(content);
        
        fs.writeFileSync(outputFile, JSON.stringify(structured, null, 2));
        console.log(`✅ Converted ${structured.apps.length} apps to ${outputFile}`);
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const apps = [];
        let currentApp = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            // App title (## App Name)
            if (trimmed.startsWith('## ') && !trimmed.includes('Example')) {
                if (currentApp) {
                    apps.push(this.finalizeApp(currentApp));
                }
                currentApp = this.parseAppTitle(trimmed);
            }
            // Requirements (- requirement)
            else if (trimmed.startsWith('- ') && currentApp) {
                const requirement = trimmed.substring(2).trim();
                if (requirement && !requirement.startsWith('[')) {
                    currentApp.requirements.push(requirement);
                }
            }
        }

        // Add last app
        if (currentApp) {
            apps.push(this.finalizeApp(currentApp));
        }

        return {
            apps,
            converted: new Date().toISOString(),
            total: apps.length
        };
    }

    parseAppTitle(titleLine) {
        const fullTitle = titleLine.substring(3).trim();
        const priority = this.extractPriority(fullTitle);
        const cleanTitle = this.cleanTitle(fullTitle);

        return {
            id: this.generateId(cleanTitle),
            title: cleanTitle,
            priority: priority || 'normal',
            requirements: [],
            complexity: 'medium'
        };
    }

    extractPriority(title) {
        for (const keyword of this.priorityKeywords) {
            if (title.includes(`[${keyword}]`)) {
                return keyword.toLowerCase().replace('最優先', 'urgent');
            }
        }
        return null;
    }

    cleanTitle(title) {
        return title.replace(/\[.*?\]/g, '').trim();
    }

    generateId(title) {
        return title.toLowerCase()
                   .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
                   .replace(/-+/g, '-')
                   .replace(/^-|-$/g, '');
    }

    finalizeApp(app) {
        // Set complexity based on requirements
        if (app.requirements.length <= 2) {
            app.complexity = 'simple';
        } else if (app.requirements.length >= 4) {
            app.complexity = 'complex';
        }

        return app;
    }
}

// CLI interface
if (require.main === module) {
    const converter = new MarkdownConverter();
    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    if (!inputFile || !outputFile) {
        console.log('Usage: node md-converter.cjs <input.md> <output.json>');
        process.exit(1);
    }

    converter.convert(inputFile, outputFile);
}

module.exports = MarkdownConverter;