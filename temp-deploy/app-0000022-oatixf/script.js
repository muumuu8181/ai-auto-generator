class BlockchainExplorer {
    constructor() {
        this.networkCanvas = document.getElementById('networkCanvas');
        this.ctx = this.networkCanvas.getContext('2d');
        this.priceCanvas = document.getElementById('priceChart');
        this.priceCtx = this.priceCanvas.getContext('2d');
        
        this.currentNetwork = 'ethereum';
        this.transactions = [];
        this.blocks = [];
        this.nodes = [];
        this.currentBlock = 18547892;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.generateMockData();
        this.startLiveFeed();
        this.startRenderLoop();
        
        console.log('⛓️ Blockchain Explorer initialized');
    }
    
    initializeElements() {
        this.blockHeightElement = document.getElementById('blockHeight');
        this.tpsValueElement = document.getElementById('tpsValue');
        this.gasPriceElement = document.getElementById('gasPrice');
        this.transactionFeedElement = document.getElementById('transactionFeed');
        this.networkSelect = document.getElementById('networkSelect');
        this.searchInput = document.getElementById('searchInput');
    }
    
    initializeEventListeners() {
        // Network selection
        this.networkSelect.addEventListener('change', (e) => {
            this.switchNetwork(e.target.value);
        });
        
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch(this.searchInput.value);
        });
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(this.searchInput.value);
            }
        });
        
        // Visualization controls
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchVisualization(btn.dataset.view));
        });
        
        // Block navigation
        document.getElementById('prevBlock').addEventListener('click', () => this.navigateBlock(-1));
        document.getElementById('nextBlock').addEventListener('click', () => this.navigateBlock(1));
        document.getElementById('latestBlock').addEventListener('click', () => this.goToLatestBlock());
        
        // Feed controls
        document.getElementById('pauseFeed').addEventListener('click', () => this.toggleFeed());
        document.getElementById('clearFeed').addEventListener('click', () => this.clearTransactionFeed());
        
        // Tools
        document.getElementById('gasTracker').addEventListener('click', () => this.openGasTracker());
        document.getElementById('tokenAnalyzer').addEventListener('click', () => this.openTokenAnalyzer());
        document.getElementById('whaleTracker').addEventListener('click', () => this.openWhaleTracker());
        document.getElementById('defiTracker').addEventListener('click', () => this.openDefiTracker());
        document.getElementById('nftExplorer').addEventListener('click', () => this.openNftExplorer());
        document.getElementById('contractVerifier').addEventListener('click', () => this.openContractVerifier());
    }
    
    generateMockData() {
        // Generate mock transactions
        for (let i = 0; i < 50; i++) {
            this.transactions.push({
                hash: '0x' + Math.random().toString(16).substr(2, 40),
                from: '0x' + Math.random().toString(16).substr(2, 40),
                to: '0x' + Math.random().toString(16).substr(2, 40),
                value: (Math.random() * 10).toFixed(4) + ' ETH',
                gasPrice: Math.floor(Math.random() * 50 + 10) + ' Gwei',
                timestamp: Date.now() - Math.random() * 3600000,
                status: Math.random() > 0.1 ? 'success' : 'failed'
            });
        }
        
        // Generate network nodes
        for (let i = 0; i < 100; i++) {
            this.nodes.push({
                x: Math.random() * this.networkCanvas.width,
                y: Math.random() * this.networkCanvas.height,
                type: ['wallet', 'exchange', 'contract', 'defi'][Math.floor(Math.random() * 4)],
                connections: Math.floor(Math.random() * 10),
                activity: Math.random()
            });
        }
        
        this.updateTransactionFeed();
        this.updateBlockInfo();
        this.updateMarketData();
    }
    
    startLiveFeed() {
        setInterval(() => {
            // Add new transaction
            if (Math.random() > 0.3) {
                this.addNewTransaction();
            }
            
            // Update network stats
            this.updateNetworkStats();
            
            // Update market data
            if (Math.random() > 0.8) {
                this.updateMarketData();
            }
        }, 2000);
    }
    
    addNewTransaction() {
        const newTx = {
            hash: '0x' + Math.random().toString(16).substr(2, 40),
            from: '0x' + Math.random().toString(16).substr(2, 40),
            to: '0x' + Math.random().toString(16).substr(2, 40),
            value: (Math.random() * 10).toFixed(4) + ' ETH',
            gasPrice: Math.floor(Math.random() * 50 + 10) + ' Gwei',
            timestamp: Date.now(),
            status: Math.random() > 0.1 ? 'success' : 'failed',
            isNew: true
        };
        
        this.transactions.unshift(newTx);
        
        if (this.transactions.length > 100) {
            this.transactions = this.transactions.slice(0, 100);
        }
        
        this.updateTransactionFeed();
        
        // Check for high-value transactions
        const value = parseFloat(newTx.value);
        if (value > 5) {
            this.triggerSecurityAlert('high-value', newTx);
        }
    }
    
    updateTransactionFeed() {
        const feedElement = this.transactionFeedElement;
        feedElement.innerHTML = '';
        
        this.transactions.slice(0, 20).forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = `transaction-item ${tx.status} ${tx.isNew ? 'new' : ''}`;
            
            const timeAgo = this.getTimeAgo(tx.timestamp);
            
            txElement.innerHTML = `
                <div class="tx-header">
                    <span class="tx-hash">${tx.hash.substr(0, 20)}...</span>
                    <span class="tx-time">${timeAgo}</span>
                </div>
                <div class="tx-details">
                    <div class="tx-addresses">
                        <span class="tx-from">From: ${tx.from.substr(0, 10)}...</span>
                        <span class="tx-to">To: ${tx.to.substr(0, 10)}...</span>
                    </div>
                    <div class="tx-value-gas">
                        <span class="tx-value">${tx.value}</span>
                        <span class="tx-gas">${tx.gasPrice}</span>
                    </div>
                </div>
            `;
            
            txElement.addEventListener('click', () => {
                this.showTransactionDetails(tx);
            });
            
            feedElement.appendChild(txElement);
            
            // Remove new flag after animation
            if (tx.isNew) {
                setTimeout(() => {
                    tx.isNew = false;
                    txElement.classList.remove('new');
                }, 1000);
            }
        });
    }
    
    updateNetworkStats() {
        // Simulate network statistics
        const tps = (12 + Math.random() * 8).toFixed(1);
        const gasPrice = Math.floor(Math.random() * 30 + 15);
        
        this.tpsValueElement.textContent = tps;
        this.gasPriceElement.textContent = gasPrice + ' Gwei';
        
        // Update other stats
        document.getElementById('dailyVolume').textContent = '$' + (2.2 + Math.random() * 0.4).toFixed(1) + 'B';
        document.getElementById('activeAddresses').textContent = Math.floor(800 + Math.random() * 100) + 'K';
        document.getElementById('avgGasFee').textContent = gasPrice + ' Gwei';
    }
    
    updateBlockInfo() {
        const currentBlockElement = document.getElementById('currentBlockNumber');
        const timestampElement = document.getElementById('blockTimestamp');
        const hashElement = document.getElementById('blockHash');
        const minerElement = document.getElementById('blockMiner');
        const txCountElement = document.getElementById('txCount');
        const gasUsedElement = document.getElementById('gasUsed');
        
        currentBlockElement.textContent = this.currentBlock.toLocaleString();
        timestampElement.textContent = new Date().toLocaleString('ja-JP');
        hashElement.textContent = '0x' + Math.random().toString(16).substr(2, 20) + '...';
        minerElement.textContent = '0x' + Math.random().toString(16).substr(2, 10) + '...';
        txCountElement.textContent = Math.floor(Math.random() * 200 + 100);
        gasUsedElement.textContent = (Math.random() * 20000000 + 5000000).toLocaleString();
    }
    
    updateMarketData() {
        // Update ETH price
        const ethPrice = 2800 + (Math.random() - 0.5) * 200;
        const ethChange = (Math.random() - 0.5) * 10;
        
        document.getElementById('ethPrice').textContent = '$' + ethPrice.toFixed(2);
        document.getElementById('ethChange').textContent = (ethChange > 0 ? '+' : '') + ethChange.toFixed(2) + '%';
        document.getElementById('ethChange').className = 'crypto-change ' + (ethChange > 0 ? 'positive' : 'negative');
        
        // Update BTC price
        const btcPrice = 67000 + (Math.random() - 0.5) * 5000;
        const btcChange = (Math.random() - 0.5) * 8;
        
        document.getElementById('btcPrice').textContent = '$' + btcPrice.toFixed(2);
        document.getElementById('btcChange').textContent = (btcChange > 0 ? '+' : '') + btcChange.toFixed(2) + '%';
        document.getElementById('btcChange').className = 'crypto-change ' + (btcChange > 0 ? 'positive' : 'negative');
        
        this.renderPriceChart();
    }
    
    renderPriceChart() {
        this.priceCtx.clearRect(0, 0, this.priceCanvas.width, this.priceCanvas.height);
        
        // Simple price chart
        this.priceCtx.strokeStyle = '#3b82f6';
        this.priceCtx.lineWidth = 2;
        this.priceCtx.beginPath();
        
        for (let i = 0; i < 50; i++) {
            const x = (i / 49) * this.priceCanvas.width;
            const y = this.priceCanvas.height / 2 + Math.sin(i * 0.2) * 30 + (Math.random() - 0.5) * 20;
            
            if (i === 0) {
                this.priceCtx.moveTo(x, y);
            } else {
                this.priceCtx.lineTo(x, y);
            }
        }
        
        this.priceCtx.stroke();
    }
    
    switchNetwork(network) {
        this.currentNetwork = network;
        console.log(`Switched to ${network} network`);
        
        // Update network-specific data
        switch (network) {
            case 'ethereum':
                this.blockHeightElement.textContent = '18,547,892';
                break;
            case 'bitcoin':
                this.blockHeightElement.textContent = '820,145';
                break;
            case 'polygon':
                this.blockHeightElement.textContent = '52,847,123';
                break;
        }
    }
    
    switchVisualization(viewType) {
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewType);
        });
        
        console.log(`Switched to ${viewType} visualization`);
    }
    
    performSearch(query) {
        if (!query.trim()) return;
        
        console.log(`Searching for: ${query}`);
        
        // Mock search result
        if (query.startsWith('0x')) {
            if (query.length === 42) {
                this.showAddressDetails(query);
            } else if (query.length === 66) {
                this.showTransactionDetails({ hash: query });
            }
        } else if (/^\d+$/.test(query)) {
            this.navigateToBlock(parseInt(query));
        }
    }
    
    showTransactionDetails(tx) {
        const modal = document.getElementById('transactionModal');
        
        document.getElementById('txHashDisplay').textContent = tx.hash;
        document.getElementById('txFrom').textContent = tx.from;
        document.getElementById('txTo').textContent = tx.to;
        document.getElementById('txValue').textContent = tx.value;
        document.getElementById('txGasFee').textContent = tx.gasPrice;
        document.getElementById('txBlockNumber').textContent = this.currentBlock.toLocaleString();
        document.getElementById('txStatus').textContent = tx.status === 'success' ? '成功' : '失敗';
        document.getElementById('txStatus').className = 'tx-status ' + tx.status;
        
        modal.classList.add('show');
    }
    
    showAddressDetails(address) {
        console.log(`Showing details for address: ${address}`);
    }
    
    navigateBlock(direction) {
        this.currentBlock += direction;
        this.updateBlockInfo();
    }
    
    navigateToBlock(blockNumber) {
        this.currentBlock = blockNumber;
        this.updateBlockInfo();
    }
    
    goToLatestBlock() {
        this.currentBlock = 18547892 + Math.floor(Math.random() * 100);
        this.updateBlockInfo();
    }
    
    toggleFeed() {
        const btn = document.getElementById('pauseFeed');
        if (btn.textContent.includes('停止')) {
            btn.innerHTML = '▶️ 再開';
            btn.classList.remove('active');
        } else {
            btn.innerHTML = '⏸️ 停止';
            btn.classList.add('active');
        }
    }
    
    clearTransactionFeed() {
        this.transactions = [];
        this.updateTransactionFeed();
    }
    
    triggerSecurityAlert(type, data) {
        // Create security alert notification
        const alertDiv = document.createElement('div');
        alertDiv.className = 'security-alert-toast';
        alertDiv.innerHTML = `
            <div class="alert-icon">⚠️</div>
            <div class="alert-content">
                <div class="alert-title">高額取引検出</div>
                <div class="alert-desc">${data.value}の大規模な取引を検出しました</div>
            </div>
        `;
        
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 2px solid #fca5a5;
            border-radius: 8px;
            padding: 1rem;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    // Tool functions
    openGasTracker() { this.showToolModal('Gas Tracker', 'ガス料金の追跡と予測を行います'); }
    openTokenAnalyzer() { this.showToolModal('Token Analyzer', 'トークンの詳細分析を実行します'); }
    openWhaleTracker() { this.showToolModal('Whale Tracker', '大口投資家の動向を監視します'); }
    openDefiTracker() { this.showToolModal('DeFi Tracker', 'DeFiプロトコルの状況を追跡します'); }
    openNftExplorer() { this.showToolModal('NFT Explorer', 'NFTコレクションを探索します'); }
    openContractVerifier() { this.showToolModal('Contract Verifier', 'スマートコントラクトを検証します'); }
    
    showToolModal(title, description) {
        const modal = document.createElement('div');
        modal.className = 'tool-modal-overlay';
        modal.innerHTML = `
            <div class="tool-modal">
                <h3>${title}</h3>
                <p>${description}</p>
                <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
            </div>
        `;
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;
        modal.querySelector('.tool-modal').style.cssText = `
            background: white; padding: 2rem; border-radius: 8px;
            max-width: 400px; text-align: center;
        `;
        
        document.body.appendChild(modal);
    }
    
    getTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}時間前`;
        if (minutes > 0) return `${minutes}分前`;
        return `${seconds}秒前`;
    }
    
    render() {
        this.renderNetworkVisualization();
    }
    
    renderNetworkVisualization() {
        this.ctx.clearRect(0, 0, this.networkCanvas.width, this.networkCanvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.networkCanvas.width, this.networkCanvas.height);
        
        // Draw connections
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.nodes.length; i += 5) {
            const node1 = this.nodes[i];
            const node2 = this.nodes[i + 1];
            
            if (node2) {
                this.ctx.beginPath();
                this.ctx.moveTo(node1.x, node1.y);
                this.ctx.lineTo(node2.x, node2.y);
                this.ctx.stroke();
            }
        }
        
        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
        
        // Draw transaction flows
        this.drawTransactionFlows();
    }
    
    drawNode(node) {
        const colors = {
            wallet: '#3b82f6',
            exchange: '#ef4444',
            contract: '#10b981',
            defi: '#f59e0b'
        };
        
        this.ctx.fillStyle = colors[node.type] || '#6b7280';
        this.ctx.globalAlpha = 0.8;
        
        const radius = 3 + node.activity * 5;
        
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Activity pulse
        if (node.activity > 0.7) {
            this.ctx.strokeStyle = colors[node.type];
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.4;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawTransactionFlows() {
        // Animate transaction flows
        const time = Date.now() * 0.001;
        
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < 10; i++) {
            const progress = (time + i) % 1;
            const startNode = this.nodes[i * 10];
            const endNode = this.nodes[i * 10 + 5];
            
            if (startNode && endNode) {
                const x = startNode.x + (endNode.x - startNode.x) * progress;
                const y = startNode.y + (endNode.y - startNode.y) * progress;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    startRenderLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

// Close modal handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blockchainExplorer = new BlockchainExplorer();
});