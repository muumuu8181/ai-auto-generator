#!/usr/bin/env node

/**
 * Session Tracking System
 * Records work sessions, timestamps, and detailed logs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class SessionTracker {
    constructor() {
        this.configDir = path.join(os.homedir(), '.ai-generator');
        this.sessionFile = path.join(this.configDir, 'sessions.json');
        this.ensureConfigDir();
    }

    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }

    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    getReadableTimestamp() {
        return new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    loadSessions() {
        if (!fs.existsSync(this.sessionFile)) {
            return {
                version: '1.0.0',
                sessions: [],
                stats: {
                    totalSessions: 0,
                    totalApps: 0,
                    totalTime: 0,
                    successRate: 0
                }
            };
        }

        try {
            return JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
        } catch (error) {
            console.warn('⚠️ Session file corrupted, creating new');
            return this.loadSessions();
        }
    }

    saveSessions(data) {
        try {
            fs.writeFileSync(this.sessionFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save session data:', error.message);
        }
    }

    startSession(deviceId) {
        const data = this.loadSessions();
        const sessionId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        const session = {
            sessionId,
            deviceId,
            startTime: this.getCurrentTimestamp(),
            startTimeReadable: this.getReadableTimestamp(),
            endTime: null,
            duration: null,
            status: 'active',
            appGenerated: null,
            logs: [],
            environment: {
                hostname: os.hostname(),
                platform: os.platform(),
                user: os.userInfo().username
            }
        };

        data.sessions.push(session);
        data.stats.totalSessions++;
        
        this.saveSessions(data);
        
        console.log(`🚀 Session started: ${sessionId}`);
        console.log(`📅 Start time: ${session.startTimeReadable}`);
        
        return sessionId;
    }

    completeSession(sessionId, appId, status = 'success') {
        const data = this.loadSessions();
        const session = data.sessions.find(s => s.sessionId === sessionId);
        
        if (!session) {
            console.warn('⚠️ Session not found:', sessionId);
            return;
        }

        const endTime = this.getCurrentTimestamp();
        const duration = Math.round((new Date(endTime) - new Date(session.startTime)) / 1000);

        session.endTime = endTime;
        session.endTimeReadable = this.getReadableTimestamp();
        session.duration = duration;
        session.status = status;
        session.appGenerated = appId;

        // Update statistics
        data.stats.totalTime += duration;
        if (status === 'success') {
            data.stats.totalApps++;
        }
        
        const completedSessions = data.sessions.filter(s => s.status !== 'active');
        data.stats.successRate = completedSessions.length > 0 ? 
            Math.round((data.stats.totalApps / completedSessions.length) * 100) : 0;

        this.saveSessions(data);
        
        console.log(`✅ Session completed: ${sessionId}`);
        console.log(`📅 End time: ${session.endTimeReadable}`);
        console.log(`⏱️ Duration: ${Math.round(duration / 60)}m ${duration % 60}s`);
        console.log(`📱 App: ${appId}`);
    }

    addLog(sessionId, message, level = 'info') {
        const data = this.loadSessions();
        const session = data.sessions.find(s => s.sessionId === sessionId);
        
        if (!session) {
            console.warn('⚠️ Session not found for logging:', sessionId);
            return;
        }

        const logEntry = {
            timestamp: this.getCurrentTimestamp(),
            timestampReadable: this.getReadableTimestamp(),
            level,
            message
        };

        session.logs.push(logEntry);
        this.saveSessions(data);
    }

    showStats() {
        const data = this.loadSessions();
        const stats = data.stats;
        
        console.log('📊 Generation Statistics:');
        console.log(`   Total Sessions: ${stats.totalSessions}`);
        console.log(`   Apps Generated: ${stats.totalApps}`);
        console.log(`   Total Time: ${Math.round(stats.totalTime / 60)} minutes`);
        console.log(`   Success Rate: ${stats.successRate}%`);
        console.log(`   Avg Time: ${stats.totalApps > 0 ? Math.round(stats.totalTime / stats.totalApps / 60) : 0}m per app`);
    }

    getLatestSession() {
        const data = this.loadSessions();
        if (data.sessions.length === 0) return null;
        
        const activeSession = data.sessions.find(s => s.status === 'active');
        return activeSession ? activeSession.sessionId : data.sessions[data.sessions.length - 1].sessionId;
    }
}

// CLI interface
if (require.main === module) {
    const tracker = new SessionTracker();
    const command = process.argv[2] || 'help';
    
    switch (command) {
        case 'start':
            const deviceId = process.argv[3] || 'unknown';
            const sessionId = tracker.startSession(deviceId);
            console.log(sessionId);
            break;
            
        case 'complete':
            const completeId = process.argv[3];
            const appId = process.argv[4];
            const status = process.argv[5] || 'success';
            if (completeId && appId) {
                tracker.completeSession(completeId, appId, status);
            }
            break;
            
        case 'log':
            const logSessionId = process.argv[3];
            const message = process.argv[4];
            const level = process.argv[5] || 'info';
            if (logSessionId && message) {
                tracker.addLog(logSessionId, message, level);
            }
            break;
            
        case 'stats':
            tracker.showStats();
            break;
            
        case 'latest':
            const latest = tracker.getLatestSession();
            console.log(latest || 'none');
            break;
            
        default:
            console.log('Session Tracker Commands:');
            console.log('  start <deviceId>     - Start new session');
            console.log('  complete <id> <app>  - Complete session');
            console.log('  log <id> <message>   - Add log entry');
            console.log('  stats                - Show statistics');
            console.log('  latest               - Get latest session ID');
    }
}

module.exports = SessionTracker;