#!/usr/bin/env node

/**
 * App Counter System
 * Manages automatic app numbering for published apps
 */

const { execSync } = require('child_process');
const fs = require('fs');

class AppCounter {
    constructor() {
        this.tempDir = './temp-counter';
    }

    getNextNumber(repoUrl) {
        try {
            this.fetchAppList(repoUrl);
            const readmePath = `${this.tempDir}/README.md`;
            
            if (!fs.existsSync(readmePath)) {
                console.log('📱 First app - starting with 001');
                return '001';
            }

            const content = fs.readFileSync(readmePath, 'utf8');
            const numbers = this.extractAppNumbers(content);
            
            if (numbers.length === 0) {
                return '001';
            }

            const maxNumber = Math.max(...numbers);
            const nextNumber = maxNumber + 1;
            const formatted = String(nextNumber).padStart(3, '0');

            console.log(`📱 Next app number: ${formatted} (max found: ${maxNumber})`);
            return formatted;

        } catch (error) {
            console.error('⚠️ Counter error:', error.message);
            return '001';
        } finally {
            this.cleanup();
        }
    }

    fetchAppList(repoUrl) {
        try {
            if (fs.existsSync(this.tempDir)) {
                execSync(`rm -rf ${this.tempDir}`);
            }

            // Sparse checkout for README.md only
            execSync(`git clone --no-checkout --depth 1 ${repoUrl} ${this.tempDir}`, 
                     { stdio: 'pipe' });
            
            process.chdir(this.tempDir);
            execSync('git sparse-checkout init --cone');
            execSync('git sparse-checkout set README.md');
            execSync('git checkout');
            process.chdir('..');

        } catch (error) {
            console.warn('⚠️ Could not fetch app list, assuming first app');
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
        }
    }

    extractAppNumbers(content) {
        // Extract app-001-abc123 patterns
        const pattern = /app-(\d{3})-[a-z0-9]{6}/g;
        const numbers = [];
        let match;

        while ((match = pattern.exec(content)) !== null) {
            numbers.push(parseInt(match[1], 10));
        }

        return [...new Set(numbers)]; // Remove duplicates
    }

    cleanup() {
        try {
            if (fs.existsSync(this.tempDir)) {
                execSync(`rm -rf ${this.tempDir}`);
            }
        } catch (error) {
            console.warn('⚠️ Cleanup failed');
        }
    }
}

// CLI interface
if (require.main === module) {
    const counter = new AppCounter();
    const repoUrl = process.argv[2];

    if (!repoUrl) {
        console.log('Usage: node app-counter.cjs <repo-url>');
        process.exit(1);
    }

    const nextNumber = counter.getNextNumber(repoUrl);
    console.log(nextNumber);
}

module.exports = AppCounter;