class CyberSecurityDashboard {
    constructor() {
        this.canvas = document.getElementById('attackMap');
        this.ctx = this.canvas.getContext('2d');
        this.trafficCanvas = document.getElementById('trafficChart');
        this.trafficCtx = this.trafficCanvas.getContext('2d');
        
        this.attacks = [];
        this.trafficData = [];
        this.events = [];
        this.threatLevel = 'low';
        this.activeConnections = 1247;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.generateMockData();
        this.startRealTimeUpdates();
        this.startRenderLoop();
        
        console.log('🛡️ Cyber Security Dashboard initialized');
    }
    
    initializeElements() {
        this.threatLevelElement = document.getElementById('threatLevel');
        this.activeConnectionsElement = document.getElementById('activeConnections');
        this.systemTimeElement = document.getElementById('systemTime');
        this.eventsListElement = document.getElementById('eventsList');
        this.attacksTodayElement = document.getElementById('attacksToday');
        this.blockedAttacksElement = document.getElementById('blockedAttacks');
    }
    
    initializeEventListeners() {
        // Map controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomMap(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomMap(0.8));
        document.getElementById('filterAttacks').addEventListener('click', () => this.toggleAttackFilter());
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
        // Time range selector
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTimeRange(e.target.dataset.range));
        });
        
        // Security tools
        document.getElementById('portScan').addEventListener('click', () => this.runPortScan());
        document.getElementById('vulnScan').addEventListener('click', () => this.runVulnerabilityScan());
        document.getElementById('trafficAnalysis').addEventListener('click', () => this.runTrafficAnalysis());
        document.getElementById('incidentResponse').addEventListener('click', () => this.triggerIncidentResponse());
        document.getElementById('forensics').addEventListener('click', () => this.runForensics());
        document.getElementById('threatHunting').addEventListener('click', () => this.startThreatHunting());
        
        // Quick actions
        document.getElementById('emergencyShutdown').addEventListener('click', () => this.emergencyShutdown());
        document.getElementById('isolateNetwork').addEventListener('click', () => this.isolateNetwork());
        document.getElementById('backupData').addEventListener('click', () => this.backupData());
        document.getElementById('updateSignatures').addEventListener('click', () => this.updateSignatures());
        
        // Log controls
        document.getElementById('severityFilter').addEventListener('change', (e) => this.filterEventsBySeverity(e.target.value));
        document.getElementById('exportLogs').addEventListener('click', () => this.exportLogs());
        document.getElementById('clearLogs').addEventListener('click', () => this.clearLogs());
    }
    
    generateMockData() {
        // Generate attack data
        for (let i = 0; i < 100; i++) {
            this.attacks.push({
                id: i,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                type: ['malware', 'ddos', 'intrusion', 'phishing'][Math.floor(Math.random() * 4)],
                intensity: Math.random(),
                timestamp: Date.now() - Math.random() * 3600000,
                sourceIP: this.generateRandomIP(),
                targetIP: this.generateRandomIP(),
                blocked: Math.random() > 0.3
            });
        }
        
        // Generate traffic data
        for (let i = 0; i < 100; i++) {
            this.trafficData.push({
                timestamp: Date.now() - (100 - i) * 60000,
                inbound: 500 + Math.random() * 500,
                outbound: 300 + Math.random() * 400,
                suspicious: Math.random() * 50
            });
        }
        
        // Generate security events
        this.generateSecurityEvents();
    }
    
    generateSecurityEvents() {
        const eventTypes = [
            { type: 'Malware Detection', severity: 'critical', description: 'ランサムウェア検出' },
            { type: 'DDoS Attack', severity: 'high', description: 'DDoS攻撃を検知' },
            { type: 'Unauthorized Access', severity: 'high', description: '不正アクセス試行' },
            { type: 'Phishing Email', severity: 'medium', description: 'フィッシングメール検出' },
            { type: 'Suspicious Traffic', severity: 'medium', description: '疑わしいトラフィック' },
            { type: 'Failed Login', severity: 'low', description: 'ログイン失敗' }
        ];
        
        for (let i = 0; i < 20; i++) {
            const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            this.events.push({
                id: i,
                type: eventTemplate.type,
                severity: eventTemplate.severity,
                description: eventTemplate.description,
                timestamp: Date.now() - Math.random() * 7200000,
                sourceIP: this.generateRandomIP(),
                resolved: Math.random() > 0.7
            });
        }
        
        this.updateEventsList();
    }
    
    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
    
    startRealTimeUpdates() {
        setInterval(() => {
            // Update system time
            const now = new Date();
            this.systemTimeElement.textContent = now.toLocaleString('ja-JP');
            
            // Add new attacks
            if (Math.random() > 0.7) {
                this.addNewAttack();
            }
            
            // Add new traffic data
            this.addNewTrafficData();
            
            // Update threat level
            this.updateThreatLevel();
            
            // Update statistics
            this.updateStatistics();
            
        }, 5000);
        
        // Update display more frequently
        setInterval(() => {
            this.activeConnections += Math.floor((Math.random() - 0.5) * 20);
            this.activeConnections = Math.max(1000, Math.min(2000, this.activeConnections));
            this.activeConnectionsElement.textContent = this.activeConnections.toLocaleString();
        }, 1000);
    }
    
    addNewAttack() {
        const newAttack = {
            id: this.attacks.length,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            type: ['malware', 'ddos', 'intrusion', 'phishing'][Math.floor(Math.random() * 4)],
            intensity: Math.random(),
            timestamp: Date.now(),
            sourceIP: this.generateRandomIP(),
            targetIP: this.generateRandomIP(),
            blocked: Math.random() > 0.3,
            isNew: true
        };
        
        this.attacks.push(newAttack);
        
        // Remove old attacks
        if (this.attacks.length > 200) {
            this.attacks = this.attacks.slice(-200);
        }
        
        // Show alert for critical attacks
        if (newAttack.type === 'malware' && Math.random() > 0.8) {
            this.showSecurityAlert(newAttack);
        }
    }
    
    addNewTrafficData() {
        const lastData = this.trafficData[this.trafficData.length - 1];
        const newData = {
            timestamp: Date.now(),
            inbound: Math.max(0, lastData.inbound + (Math.random() - 0.5) * 100),
            outbound: Math.max(0, lastData.outbound + (Math.random() - 0.5) * 80),
            suspicious: Math.max(0, lastData.suspicious + (Math.random() - 0.5) * 10)
        };
        
        this.trafficData.push(newData);
        
        if (this.trafficData.length > 100) {
            this.trafficData = this.trafficData.slice(-100);
        }
    }
    
    updateThreatLevel() {
        const recentAttacks = this.attacks.filter(attack => 
            Date.now() - attack.timestamp < 300000 && !attack.blocked
        );
        
        if (recentAttacks.length > 10) {
            this.threatLevel = 'critical';
        } else if (recentAttacks.length > 5) {
            this.threatLevel = 'high';
        } else if (recentAttacks.length > 2) {
            this.threatLevel = 'medium';
        } else {
            this.threatLevel = 'low';
        }
        
        const indicator = this.threatLevelElement.querySelector('.threat-indicator');
        const text = this.threatLevelElement.querySelector('.threat-text');
        
        indicator.className = `threat-indicator ${this.threatLevel}`;
        text.textContent = `脅威レベル: ${this.getThreatLevelText()}`;
    }
    
    getThreatLevelText() {
        const levels = {
            low: '低',
            medium: '中',
            high: '高',
            critical: '危険'
        };
        return levels[this.threatLevel] || '不明';
    }
    
    updateStatistics() {
        const attacksToday = this.attacks.filter(attack => 
            Date.now() - attack.timestamp < 86400000
        ).length;
        
        const blockedAttacks = this.attacks.filter(attack => 
            attack.blocked && Date.now() - attack.timestamp < 86400000
        ).length;
        
        this.attacksTodayElement.textContent = attacksToday.toLocaleString();
        this.blockedAttacksElement.textContent = blockedAttacks.toLocaleString();
        
        // Update traffic metrics
        const latest = this.trafficData[this.trafficData.length - 1];
        if (latest) {
            document.getElementById('inboundTraffic').textContent = `${latest.inbound.toFixed(1)} MB/s`;
            document.getElementById('outboundTraffic').textContent = `${latest.outbound.toFixed(1)} MB/s`;
            document.getElementById('suspiciousTraffic').textContent = `${latest.suspicious.toFixed(1)} MB/s`;
        }
    }
    
    updateEventsList() {
        this.eventsListElement.innerHTML = '';
        
        const sortedEvents = this.events
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        sortedEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = `event-item ${event.severity}`;
            
            const timeAgo = this.getTimeAgo(event.timestamp);
            
            eventDiv.innerHTML = `
                <div class="event-header">
                    <span class="event-type">${event.type}</span>
                    <span class="event-time">${timeAgo}</span>
                </div>
                <div class="event-description">${event.description}</div>
                <div class="event-details">
                    <span>送信元: ${event.sourceIP}</span>
                    <span class="event-status ${event.resolved ? 'resolved' : 'active'}">
                        ${event.resolved ? '解決済み' : 'アクティブ'}
                    </span>
                </div>
            `;
            
            this.eventsListElement.appendChild(eventDiv);
        });
    }
    
    getTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}時間前`;
        } else if (minutes > 0) {
            return `${minutes}分前`;
        } else {
            return '今';
        }
    }
    
    showSecurityAlert(attack) {
        const modal = document.getElementById('alertModal');
        const title = document.getElementById('alertTitle');
        const severity = document.getElementById('alertSeverity');
        const message = document.getElementById('alertMessage');
        const time = document.getElementById('alertTime');
        const ip = document.getElementById('alertIP');
        const type = document.getElementById('alertType');
        
        title.textContent = '🚨 セキュリティアラート';
        severity.textContent = '危険';
        severity.className = `alert-severity ${attack.type}`;
        message.textContent = `${attack.type}攻撃が検出されました。即座の対応が必要です。`;
        time.textContent = new Date(attack.timestamp).toLocaleString('ja-JP');
        ip.textContent = attack.sourceIP;
        type.textContent = attack.type;
        
        modal.classList.add('show');
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            modal.classList.remove('show');
        }, 10000);
    }
    
    // Security tool methods
    runPortScan() {
        this.showToolResult('ポートスキャン', 'ポートスキャンを実行中...', 3000);
    }
    
    runVulnerabilityScan() {
        this.showToolResult('脆弱性スキャン', '脆弱性スキャンを実行中...', 5000);
    }
    
    runTrafficAnalysis() {
        this.showToolResult('トラフィック解析', 'ネットワークトラフィックを解析中...', 4000);
    }
    
    triggerIncidentResponse() {
        this.showToolResult('インシデント対応', 'インシデント対応プロトコルを開始...', 2000);
    }
    
    runForensics() {
        this.showToolResult('フォレンジック', 'デジタルフォレンジックを実行中...', 6000);
    }
    
    startThreatHunting() {
        this.showToolResult('脅威ハンティング', '高度な脅威を検索中...', 7000);
    }
    
    showToolResult(toolName, message, duration) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'tool-notification';
        notification.innerHTML = `
            <strong>${toolName}</strong><br>
            ${message}
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1f2937;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
    
    // Quick action methods
    emergencyShutdown() {
        if (confirm('緊急停止を実行しますか？この操作は取り消せません。')) {
            this.showToolResult('緊急停止', 'システムを安全にシャットダウン中...', 3000);
        }
    }
    
    isolateNetwork() {
        this.showToolResult('ネットワーク隔離', 'ネットワークセグメントを隔離中...', 2000);
    }
    
    backupData() {
        this.showToolResult('データバックアップ', '重要データのバックアップを開始...', 4000);
    }
    
    updateSignatures() {
        this.showToolResult('シグネチャ更新', '最新の脅威シグネチャを更新中...', 3000);
    }
    
    // Filter and export methods
    filterEventsBySeverity(severity) {
        // Implementation for filtering events
        console.log(`Filtering events by severity: ${severity}`);
    }
    
    exportLogs() {
        // Implementation for exporting logs
        const logs = this.events.map(event => ({
            timestamp: new Date(event.timestamp).toISOString(),
            type: event.type,
            severity: event.severity,
            description: event.description,
            sourceIP: event.sourceIP
        }));
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security_logs_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    clearLogs() {
        if (confirm('すべてのログをクリアしますか？')) {
            this.events = [];
            this.updateEventsList();
        }
    }
    
    // Map controls
    zoomMap(factor) {
        console.log(`Zooming map by factor: ${factor}`);
    }
    
    toggleAttackFilter() {
        console.log('Toggling attack filter');
    }
    
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            this.canvas.requestFullscreen();
        }
    }
    
    selectTimeRange(range) {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');
        console.log(`Selected time range: ${range}`);
    }
    
    render() {
        this.renderAttackMap();
        this.renderTrafficChart();
    }
    
    renderAttackMap() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw world map background (simplified)
        this.ctx.fillStyle = '#1f2937';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw attacks
        this.attacks.forEach(attack => {
            this.drawAttack(attack);
        });
        
        // Draw attack paths
        this.drawAttackPaths();
    }
    
    drawAttack(attack) {
        const colors = {
            malware: '#ef4444',
            ddos: '#f97316',
            intrusion: '#eab308',
            phishing: '#8b5cf6'
        };
        
        this.ctx.fillStyle = colors[attack.type] || '#6b7280';
        this.ctx.globalAlpha = attack.blocked ? 0.3 : 0.8;
        
        // Pulse effect for new attacks
        const radius = attack.isNew ? 8 + Math.sin(Date.now() * 0.01) * 2 : 5;
        
        this.ctx.beginPath();
        this.ctx.arc(attack.x, attack.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw intensity ring
        this.ctx.strokeStyle = colors[attack.type];
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = attack.intensity * 0.5;
        this.ctx.beginPath();
        this.ctx.arc(attack.x, attack.y, radius + 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    drawAttackPaths() {
        // Draw connection lines between attacks
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.2;
        
        for (let i = 0; i < this.attacks.length; i += 10) {
            const attack1 = this.attacks[i];
            const attack2 = this.attacks[i + 5];
            
            if (attack2) {
                this.ctx.beginPath();
                this.ctx.moveTo(attack1.x, attack1.y);
                this.ctx.lineTo(attack2.x, attack2.y);
                this.ctx.stroke();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    renderTrafficChart() {
        this.trafficCtx.clearRect(0, 0, this.trafficCanvas.width, this.trafficCanvas.height);
        
        if (this.trafficData.length < 2) return;
        
        const width = this.trafficCanvas.width;
        const height = this.trafficCanvas.height;
        const padding = 40;
        
        // Find max value for scaling
        const maxValue = Math.max(...this.trafficData.map(d => 
            Math.max(d.inbound, d.outbound, d.suspicious)
        ));
        
        // Draw axes
        this.trafficCtx.strokeStyle = '#374151';
        this.trafficCtx.lineWidth = 2;
        this.trafficCtx.beginPath();
        this.trafficCtx.moveTo(padding, padding);
        this.trafficCtx.lineTo(padding, height - padding);
        this.trafficCtx.lineTo(width - padding, height - padding);
        this.trafficCtx.stroke();
        
        // Draw traffic lines
        this.drawTrafficLine(this.trafficData.map(d => d.inbound), '#3b82f6', maxValue);
        this.drawTrafficLine(this.trafficData.map(d => d.outbound), '#10b981', maxValue);
        this.drawTrafficLine(this.trafficData.map(d => d.suspicious), '#ef4444', maxValue);
    }
    
    drawTrafficLine(data, color, maxValue) {
        this.trafficCtx.strokeStyle = color;
        this.trafficCtx.lineWidth = 2;
        this.trafficCtx.beginPath();
        
        const width = this.trafficCanvas.width;
        const height = this.trafficCanvas.height;
        const padding = 40;
        
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
            const y = height - padding - (data[i] / maxValue) * (height - 2 * padding);
            
            if (i === 0) {
                this.trafficCtx.moveTo(x, y);
            } else {
                this.trafficCtx.lineTo(x, y);
            }
        }
        
        this.trafficCtx.stroke();
    }
    
    startRenderLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.securityDashboard = new CyberSecurityDashboard();
});