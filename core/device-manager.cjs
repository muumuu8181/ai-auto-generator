#!/usr/bin/env node

/**
 * Device Management System
 * Handles unique device identification and prevents duplicate app generation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class DeviceManager {
    constructor() {
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.deviceFile = path.join(this.configDir, 'device.json');
        this.completedFile = path.join(this.configDir, 'completed.json');
        this.ensureConfigDir();
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    generateDeviceId() {
        const hostname = os.hostname().toLowerCase().replace(/[^a-z0-9]/g, '');
        const username = os.userInfo().username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(3).toString('hex');
        
        return `${hostname}-${username}-${timestamp}-${random}`;
    }

    getOrCreateDeviceId() {
        if (fs.existsSync(this.deviceFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.deviceFile, 'utf8'));
                if (config.deviceId) {
                    console.log(`📱 Device: ${config.deviceId}`);
                    return config.deviceId;
                }
            } catch (error) {
                console.warn('⚠️ Device config corrupted, regenerating');
            }
        }

        const deviceId = this.generateDeviceId();
        const config = {
            deviceId,
            created: new Date().toISOString(),
            hostname: os.hostname(),
            username: os.userInfo().username,
            platform: os.platform()
        };

        fs.writeFileSync(this.deviceFile, JSON.stringify(config, null, 2));
        console.log(`🆕 New device: ${deviceId}`);
        return deviceId;
    }

    markCompleted(appId) {
        const deviceId = this.getOrCreateDeviceId();
        let completed = [];

        if (fs.existsSync(this.completedFile)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.completedFile, 'utf8'));
                completed = data.completed || [];
            } catch (error) {
                console.warn('⚠️ Completed file corrupted');
            }
        }

        const record = {
            appId,
            deviceId,
            completedAt: new Date().toISOString()
        };

        completed.push(record);

        const data = {
            deviceId,
            completed,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(this.completedFile, JSON.stringify(data, null, 2));
        console.log(`✅ Marked completed: ${appId}`);
    }

    getCompletedApps() {
        const deviceId = this.getOrCreateDeviceId();

        if (!fs.existsSync(this.completedFile)) {
            return [];
        }

        try {
            const data = JSON.parse(fs.readFileSync(this.completedFile, 'utf8'));
            if (data.deviceId !== deviceId) {
                return [];
            }
            return (data.completed || []).map(record => record.appId);
        } catch (error) {
            console.warn('⚠️ Error reading completed apps');
            return [];
        }
    }

    isCompleted(appId) {
        return this.getCompletedApps().includes(appId);
    }

    showInfo() {
        const deviceId = this.getOrCreateDeviceId();
        const completed = this.getCompletedApps();

        console.log('📱 Device Information:');
        console.log(`   Device ID: ${deviceId}`);
        console.log(`   Hostname: ${os.hostname()}`);
        console.log(`   User: ${os.userInfo().username}`);
        console.log(`   Platform: ${os.platform()}`);
        console.log(`   Completed Apps: ${completed.length}`);
        
        if (completed.length > 0) {
            console.log('   Recent:');
            completed.slice(-5).forEach((id, index) => {
                console.log(`     ${index + 1}. ${id}`);
            });
        }
    }
}

// CLI interface
if (require.main === module) {
    const manager = new DeviceManager();
    const command = process.argv[2] || 'get';
    
    switch (command) {
        case 'get':
            console.log(manager.getOrCreateDeviceId());
            break;
            
        case 'info':
            manager.showInfo();
            break;
            
        case 'mark-complete':
            const appId = process.argv[3];
            if (appId) {
                manager.markCompleted(appId);
            } else {
                console.error('Usage: device-manager.cjs mark-complete <appId>');
            }
            break;
            
        case 'check-completed':
            const checkId = process.argv[3];
            if (checkId) {
                console.log(manager.isCompleted(checkId) ? 'completed' : 'not-completed');
            } else {
                manager.showInfo();
            }
            break;
            
        default:
            console.log('Device Manager Commands:');
            console.log('  get                  - Get device ID');
            console.log('  info                 - Show device info');
            console.log('  mark-complete <id>   - Mark app completed');
            console.log('  check-completed <id> - Check if completed');
    }
}

module.exports = DeviceManager;