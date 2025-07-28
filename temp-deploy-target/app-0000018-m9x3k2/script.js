document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const nodesContainer = document.getElementById('nodes-container');
    const ideaInput = document.getElementById('idea-input');
    const addIdeaBtn = document.getElementById('add-idea-btn');
    const clearCanvasBtn = document.getElementById('clear-canvas-btn');
    const colorPalette = document.querySelector('.color-palette');
    const contextMenu = document.getElementById('context-menu');
    const connectBtn = document.getElementById('connect-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const loadingOverlay = document.getElementById('loading-overlay');

    let nodes = [];
    let connections = [];
    let selectedColor = '#ffdddd';
    let activeNodeId = null;
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    let isConnecting = false;
    let connectionStartNodeId = null;
    let tempLine = null;

    // --- State Management ---
    function saveState() {
        try {
            const state = { nodes, connections };
            localStorage.setItem('ideaCanvasState', JSON.stringify(state));
        } catch (e) {
            console.error("Error saving state to localStorage:", e);
            alert("データの保存に失敗しました。ブラウザのストレージ容量が限界かもしれません。");
        }
    }

    function loadState() {
        loadingOverlay.classList.remove('hidden');
        setTimeout(() => {
            try {
                const savedState = localStorage.getItem('ideaCanvasState');
                if (savedState) {
                    const { nodes: savedNodes, connections: savedConnections } = JSON.parse(savedState);
                    nodes = savedNodes || [];
                    connections = savedConnections || [];
                }
            } catch (e) {
                console.error("Error loading state from localStorage:", e);
                nodes = [];
                connections = [];
                localStorage.removeItem('ideaCanvasState');
            }
            render();
            loadingOverlay.classList.add('hidden');
        }, 500);
    }

    // --- Rendering ---
    function render() {
        nodesContainer.innerHTML = '';
        nodes.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.id = node.id;
            nodeEl.className = 'idea-node';
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
            nodeEl.style.backgroundColor = node.color;
            nodeEl.textContent = node.text;
            
            if (isConnecting && connectionStartNodeId === node.id) {
                nodeEl.classList.add('connecting');
            }

            nodesContainer.appendChild(nodeEl);
        });
        drawConnections();
    }

    function drawConnections() {
        canvas.innerHTML = '';
        connections.forEach(conn => {
            const nodeA = nodes.find(n => n.id === conn.from);
            const nodeB = nodes.find(n => n.id === conn.to);
            if (nodeA && nodeB) {
                const line = createLine(
                    nodeA.x + nodeA.width / 2, nodeA.y + nodeA.height / 2,
                    nodeB.x + nodeB.width / 2, nodeB.y + nodeB.height / 2
                );
                canvas.appendChild(line);
            }
        });
    }
    
    function createLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'var(--line-color)');
        line.setAttribute('stroke-width', '3');
        return line;
    }

    // --- Event Handlers ---
    function handleAddIdea() {
        const text = ideaInput.value.trim();
        if (!text) return;

        const id = `node-${Date.now()}`;
        const newNode = {
            id,
            text,
            x: Math.random() * (nodesContainer.clientWidth - 150) + 20,
            y: Math.random() * (nodesContainer.clientHeight - 100) + 20,
            color: selectedColor,
            width: 120, // Initial width, will be updated after render
            height: 50, // Initial height
        };
        nodes.push(newNode);
        ideaInput.value = '';
        render();
        
        // Update dimensions after rendering
        const nodeEl = document.getElementById(id);
        if (nodeEl) {
            newNode.width = nodeEl.offsetWidth;
            newNode.height = nodeEl.offsetHeight;
        }
        saveState();
    }

    function handleMouseDown(e) {
        if (e.target.classList.contains('idea-node')) {
            e.preventDefault();
            activeNodeId = e.target.id;
            const node = nodes.find(n => n.id === activeNodeId);

            if (isConnecting) {
                if (connectionStartNodeId && connectionStartNodeId !== activeNodeId) {
                    // Complete connection
                    const existingConnection = connections.find(c => 
                        (c.from === connectionStartNodeId && c.to === activeNodeId) ||
                        (c.from === activeNodeId && c.to === connectionStartNodeId)
                    );
                    if (!existingConnection) {
                        connections.push({ from: connectionStartNodeId, to: activeNodeId });
                    }
                    resetConnectionMode();
                    render();
                    saveState();
                }
                return;
            }
            
            isDragging = true;
            e.target.classList.add('dragging');
            dragOffsetX = e.clientX - node.x;
            dragOffsetY = e.clientY - node.y;
        }
    }

    function handleMouseMove(e) {
        if (isDragging && activeNodeId) {
            const node = nodes.find(n => n.id === activeNodeId);
            node.x = e.clientX - dragOffsetX;
            node.y = e.clientY - dragOffsetY;
            
            // Boundary checks
            const nodeEl = document.getElementById(activeNodeId);
            const containerRect = nodesContainer.getBoundingClientRect();
            node.x = Math.max(0, Math.min(node.x, containerRect.width - nodeEl.offsetWidth));
            node.y = Math.max(0, Math.min(node.y, containerRect.height - nodeEl.offsetHeight));

            requestAnimationFrame(() => {
                nodeEl.style.left = `${node.x}px`;
                nodeEl.style.top = `${node.y}px`;
                drawConnections();
            });
        } else if (isConnecting && connectionStartNodeId) {
            const startNode = nodes.find(n => n.id === connectionStartNodeId);
            if (!tempLine) {
                tempLine = createLine(0,0,0,0);
                tempLine.setAttribute('stroke-dasharray', '5,5');
                canvas.appendChild(tempLine);
            }
            const startX = startNode.x + startNode.width / 2;
            const startY = startNode.y + startNode.height / 2;
            const endX = e.clientX - nodesContainer.getBoundingClientRect().left;
            const endY = e.clientY - nodesContainer.getBoundingClientRect().top;
            
            tempLine.setAttribute('x1', startX);
            tempLine.setAttribute('y1', startY);
            tempLine.setAttribute('x2', endX);
            tempLine.setAttribute('y2', endY);
        }
    }

    function handleMouseUp() {
        if (isDragging) {
            const nodeEl = document.getElementById(activeNodeId);
            if(nodeEl) nodeEl.classList.remove('dragging');
            isDragging = false;
            activeNodeId = null;
            saveState();
        }
    }

    function handleContextMenu(e) {
        if (e.target.classList.contains('idea-node')) {
            e.preventDefault();
            activeNodeId = e.target.id;
            contextMenu.style.display = 'flex';
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.top = `${e.clientY}px`;
        } else {
            hideContextMenu();
        }
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
        activeNodeId = null;
    }

    function resetConnectionMode() {
        isConnecting = false;
        if (connectionStartNodeId) {
            const oldStartNode = document.getElementById(connectionStartNodeId);
            if (oldStartNode) oldStartNode.classList.remove('connecting');
        }
        connectionStartNodeId = null;
        if (tempLine) {
            tempLine.remove();
            tempLine = null;
        }
    }

    // --- Event Listeners Setup ---
    addIdeaBtn.addEventListener('click', handleAddIdea);
    ideaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddIdea();
    });

    clearCanvasBtn.addEventListener('click', () => {
        if (confirm('本当にすべてのアイデアと接続を削除しますか？この操作は元に戻せません。')) {
            nodes = [];
            connections = [];
            resetConnectionMode();
            saveState();
            render();
        }
    });

    colorPalette.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-box')) {
            document.querySelector('.color-box.active').classList.remove('active');
            e.target.classList.add('active');
            selectedColor = e.target.dataset.color;
        }
    });

    nodesContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
        if (!e.target.classList.contains('idea-node') && isConnecting) {
            resetConnectionMode();
            render();
        }
    });

    connectBtn.addEventListener('click', () => {
        isConnecting = true;
        connectionStartNodeId = activeNodeId;
        const nodeEl = document.getElementById(activeNodeId);
        if(nodeEl) nodeEl.classList.add('connecting');
        hideContextMenu();
    });

    deleteBtn.addEventListener('click', () => {
        if (activeNodeId) {
            nodes = nodes.filter(n => n.id !== activeNodeId);
            connections = connections.filter(c => c.from !== activeNodeId && c.to !== activeNodeId);
            hideContextMenu();
            render();
            saveState();
        }
    });

    window.addEventListener('resize', render);

    // Initial Load
    loadState();
});