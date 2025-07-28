document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const canvasContainer = document.getElementById('canvas-container');
    const addNodeBtn = document.getElementById('add-node-btn');
    const toggleConnectModeBtn = document.getElementById('toggle-connect-mode-btn');
    const resetCanvasBtn = document.getElementById('reset-canvas-btn');
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    const connectorSvg = document.getElementById('connector-svg');
    
    // モーダル関連の要素
    const nodeModal = document.getElementById('node-modal');
    const nodeTitleInput = document.getElementById('node-title-input');
    const nodeContentInput = document.getElementById('node-content-input');
    const saveNodeBtn = document.getElementById('save-node-btn');
    const deleteNodeBtn = document.getElementById('delete-node-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const welcomeMessage = document.querySelector('.welcome-message');

    // アプリケーションの状態管理
    let nodes = [];
    let connections = [];
    let isConnectMode = false;
    let selectedNodeForConnection = null;
    let editingNodeId = null;
    let draggedNode = null;
    let offset = { x: 0, y: 0 };

    // --- データ永続化 (LocalStorage) ---

    const saveData = () => {
        localStorage.setItem('conceptWeaverNodes', JSON.stringify(nodes));
        localStorage.setItem('conceptWeaverConnections', JSON.stringify(connections));
    };

    const loadData = () => {
        const savedNodes = localStorage.getItem('conceptWeaverNodes');
        const savedConnections = localStorage.getItem('conceptWeaverConnections');
        if (savedNodes) {
            nodes = JSON.parse(savedNodes);
        }
        if (savedConnections) {
            connections = JSON.parse(savedConnections);
        }
        render();
    };

    // --- レンダリング関連 ---

    const render = () => {
        renderNodes();
        renderConnections();
        updateWelcomeMessage();
    };

    const renderNodes = () => {
        // 既存のノードをクリア
        const existingNodes = canvasContainer.querySelectorAll('.node');
        existingNodes.forEach(node => node.remove());

        nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.classList.add('node');
            nodeEl.dataset.id = node.id;
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
            
            const titleEl = document.createElement('div');
            titleEl.classList.add('node-title');
            titleEl.textContent = node.title;
            nodeEl.appendChild(titleEl);

            nodeEl.addEventListener('mousedown', onNodeMouseDown);
            nodeEl.addEventListener('click', onNodeClick);
            
            canvasContainer.appendChild(nodeEl);
        });
    };

    const renderConnections = () => {
        // 既存の線をクリア
        connectorSvg.innerHTML = '';

        connections.forEach(conn => {
            const fromNode = findNodeById(conn.from);
            const toNode = findNodeById(conn.to);
            const fromEl = canvasContainer.querySelector(`.node[data-id='${conn.from}']`);
            const toEl = canvasContainer.querySelector(`.node[data-id='${conn.to}']`);

            if (fromNode && toNode && fromEl && toEl) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                
                const fromRect = fromEl.getBoundingClientRect();
                const toRect = toEl.getBoundingClientRect();
                const containerRect = canvasContainer.getBoundingClientRect();

                const x1 = fromRect.left - containerRect.left + fromRect.width / 2;
                const y1 = fromRect.top - containerRect.top + fromRect.height / 2;
                const x2 = toRect.left - containerRect.left + toRect.width / 2;
                const y2 = toRect.top - containerRect.top + toRect.height / 2;

                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', 'var(--primary-color)');
                line.setAttribute('stroke-width', '2');
                line.classList.add('connector-line');
                connectorSvg.appendChild(line);
            }
        });
    };
    
    const updateWelcomeMessage = () => {
        if (nodes.length > 0) {
            welcomeMessage.style.display = 'none';
        } else {
            welcomeMessage.style.display = 'block';
        }
    };

    // --- イベントハンドラ ---

    // ノードのドラッグ処理
    function onNodeMouseDown(e) {
        // 接続モード中や右クリックの場合はドラッグしない
        if (isConnectMode || e.button !== 0) return;

        const id = e.currentTarget.dataset.id;
        draggedNode = findNodeById(id);
        const nodeEl = e.currentTarget;
        
        offset.x = e.clientX - nodeEl.getBoundingClientRect().left;
        offset.y = e.clientY - nodeEl.getBoundingClientRect().top;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        e.preventDefault(); // テキスト選択を防ぐ
    }

    function onMouseMove(e) {
        if (!draggedNode) return;
        
        const containerRect = canvasContainer.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - offset.x;
        let newY = e.clientY - containerRect.top - offset.y;

        // キャンバスの境界内に収める
        newX = Math.max(0, Math.min(newX, containerRect.width - 250)); // 250はノードの幅
        newY = Math.max(0, Math.min(newY, containerRect.height - 100)); // 100はノードの高さ

        draggedNode.x = newX;
        draggedNode.y = newY;
        
        // パフォーマンスのため、ノードの位置と線だけを更新
        const nodeEl = canvasContainer.querySelector(`.node[data-id='${draggedNode.id}']`);
        if (nodeEl) {
            nodeEl.style.left = `${newX}px`;
            nodeEl.style.top = `${newY}px`;
        }
        renderConnections();
    }

    function onMouseUp() {
        if (draggedNode) {
            saveData();
        }
        draggedNode = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // ノードクリック時の処理（編集 or 接続）
    function onNodeClick(e) {
        const nodeId = e.currentTarget.dataset.id;

        if (isConnectMode) {
            handleConnection(nodeId);
        } else {
            // ドラッグ操作でない場合のみ編集モーダルを開く
            setTimeout(() => {
                if (!draggedNode) {
                    openEditModal(nodeId);
                }
            }, 100);
        }
    }

    // 新規ノード追加
    addNodeBtn.addEventListener('click', () => {
        const containerRect = canvasContainer.getBoundingClientRect();
        const newNode = {
            id: `node-${Date.now()}`,
            title: '新しい概念',
            content: 'ここに詳細を記入...',
            x: Math.random() * (containerRect.width - 250),
            y: Math.random() * (containerRect.height - 100),
        };
        nodes.push(newNode);
        render();
        saveData();
        openEditModal(newNode.id);
    });

    // 接続モードの切り替え
    toggleConnectModeBtn.addEventListener('click', () => {
        isConnectMode = !isConnectMode;
        toggleConnectModeBtn.classList.toggle('active', isConnectMode);
        canvasContainer.classList.toggle('connect-mode', isConnectMode);
        if (!isConnectMode) {
            clearConnectionSelection();
        }
        
        // UI状態の更新
        if (isConnectMode) {
            toggleConnectModeBtn.style.backgroundColor = 'var(--primary-color)';
            canvasContainer.style.cursor = 'crosshair';
        } else {
            toggleConnectModeBtn.style.backgroundColor = '';
            canvasContainer.style.cursor = '';
        }
    });

    // 接続処理
    const handleConnection = (nodeId) => {
        const nodeEl = canvasContainer.querySelector(`.node[data-id='${nodeId}']`);
        if (!selectedNodeForConnection) {
            // 1つ目のノードを選択
            selectedNodeForConnection = nodeId;
            nodeEl.classList.add('selected');
        } else {
            // 2つ目のノードを選択
            if (selectedNodeForConnection !== nodeId) {
                // 既存の接続かチェック
                const existingConnection = connections.find(
                    conn => (conn.from === selectedNodeForConnection && conn.to === nodeId) ||
                            (conn.from === nodeId && conn.to === selectedNodeForConnection)
                );
                if (!existingConnection) {
                    connections.push({ from: selectedNodeForConnection, to: nodeId });
                }
            }
            clearConnectionSelection();
            render();
            saveData();
        }
    };
    
    const clearConnectionSelection = () => {
        if (selectedNodeForConnection) {
            const prevSelected = canvasContainer.querySelector(`.node[data-id='${selectedNodeForConnection}']`);
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }
        }
        selectedNodeForConnection = null;
    };

    // キャンバスのリセット
    resetCanvasBtn.addEventListener('click', () => {
        if (confirm('すべてのノードと接続を削除しますか？この操作は元に戻せません。')) {
            nodes = [];
            connections = [];
            saveData();
            render();
        }
    });
    
    // テーマ切り替え
    toggleThemeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
        if (isLight) {
            toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('conceptWeaverTheme', 'light');
        } else {
            toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('conceptWeaverTheme', 'dark');
        }
    });
    
    // テーマの読み込み
    const loadTheme = () => {
        const savedTheme = localStorage.getItem('conceptWeaverTheme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    };

    // --- モーダル関連 ---

    const openEditModal = (nodeId) => {
        editingNodeId = nodeId;
        const node = findNodeById(nodeId);
        if (node) {
            nodeTitleInput.value = node.title;
            nodeContentInput.value = node.content || '';
            nodeModal.classList.add('active');
            setTimeout(() => nodeTitleInput.focus(), 100);
        }
    };

    const closeEditModal = () => {
        nodeModal.classList.remove('active');
        editingNodeId = null;
    };

    saveNodeBtn.addEventListener('click', () => {
        if (editingNodeId) {
            const node = findNodeById(editingNodeId);
            if (node) {
                node.title = nodeTitleInput.value || '無題';
                node.content = nodeContentInput.value || '';
                saveData();
                render();
            }
        }
        closeEditModal();
    });

    deleteNodeBtn.addEventListener('click', () => {
        if (editingNodeId && confirm('このノードを削除しますか？接続もすべて削除されます。')) {
            // ノードを削除
            nodes = nodes.filter(n => n.id !== editingNodeId);
            // 関連する接続を削除
            connections = connections.filter(c => c.from !== editingNodeId && c.to !== editingNodeId);
            
            saveData();
            render();
            closeEditModal();
        }
    });

    cancelEditBtn.addEventListener('click', closeEditModal);
    
    // モーダルの外側をクリックで閉じる
    nodeModal.addEventListener('click', (e) => {
        if (e.target === nodeModal) {
            closeEditModal();
        }
    });

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });

    // --- ヘルパー関数 ---
    const findNodeById = (id) => nodes.find(n => n.id === id);

    // --- 初期化処理 ---
    loadTheme();
    loadData();
    
    // ウィンドウリサイズ時にSVGの線も再描画
    window.addEventListener('resize', renderConnections);
});