#!/usr/bin/env node

/**
 * Unique ID Generator
 * Generates collision-resistant 6-character identifiers
 */

const crypto = require('crypto');

class IdGenerator {
    constructor() {
        // Avoid confusing characters: 0, O, I, l, 1
        this.chars = 'abcdefghijkmnpqrstuvwxyz23456789';
        this.length = 6;
    }

    generate() {
        let result = '';
        
        for (let i = 0; i < this.length; i++) {
            const randomIndex = crypto.randomInt(0, this.chars.length);
            result += this.chars.charAt(randomIndex);
        }

        return result;
    }

    generateUnique(existingIds = [], maxAttempts = 50) {
        const existing = new Set(existingIds);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const id = this.generate();
            
            if (!existing.has(id)) {
                return id;
            }
        }

        // Fallback with timestamp
        const timestamp = Date.now().toString(36).slice(-6);
        console.warn(`⚠️ Using timestamp fallback: ${timestamp}`);
        return timestamp;
    }

    validate(id) {
        return typeof id === 'string' && 
               id.length === this.length && 
               [...id].every(char => this.chars.includes(char));
    }
}

// CLI interface
if (require.main === module) {
    const generator = new IdGenerator();
    const command = process.argv[2] || 'generate';
    
    switch (command) {
        case 'generate':
            console.log(generator.generate());
            break;
            
        case 'unique':
            const existing = process.argv.slice(3);
            console.log(generator.generateUnique(existing));
            break;
            
        case 'validate':
            const testId = process.argv[3];
            console.log(generator.validate(testId) ? 'valid' : 'invalid');
            break;
            
        default:
            console.log('Usage:');
            console.log('  node id-generator.cjs generate      # Generate ID');
            console.log('  node id-generator.cjs unique [ids]  # Generate unique ID');
            console.log('  node id-generator.cjs validate <id> # Validate ID');
    }
}

module.exports = IdGenerator;