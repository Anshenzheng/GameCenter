/**
 * 军事扫雷游戏 - Military Minesweeper
 * 军事迷彩风格，战术指挥面板风格
 * 经典扫雷玩法，支持左右键操作、标记、难度选择、计时
 */

const MILITARY_COLORS = {
    CAMO_DARK: '#2d3a2a',
    CAMO_MEDIUM: '#4a5d47',
    CAMO_LIGHT: '#6b7d68',
    CAMO_BROWN: '#5c4a3a',
    CAMO_GREEN: '#3d5c3d',
    TACTICAL_BLACK: '#1a1a1a',
    TACTICAL_DARK: '#2a2a2a',
    TACTICAL_GRAY: '#3a3a3a',
    ACCENT_RED: '#c41e3a',
    ACCENT_YELLOW: '#d4a017',
    ACCENT_GREEN: '#4a9c2d',
    ACCENT_BLUE: '#1e5f8f',
    TEXT_PRIMARY: '#e8e8e8',
    TEXT_SECONDARY: '#a0a0a0',
    GRID_LINE: 'rgba(139, 119, 101, 0.3)',
    BORDER_METAL: '#4a4a4a',
};

const MILITARY_DIFFICULTY = {
    recruit: { name: '新兵', rows: 9, cols: 9, mines: 10, label: '🪖' },
    sergeant: { name: '士官', rows: 16, cols: 16, mines: 40, label: '⭐' },
    commander: { name: '指挥官', rows: 16, cols: 30, mines: 99, label: '🎖️' }
};

class MilitaryMinesweeperGame extends GameInterface {
    static get metadata() {
        return {
            id: 'military-minesweeper',
            name: '军事扫雷',
            description: '战术指挥面板风格，经典扫雷玩法，翻开时的扫描特效，震撼的爆炸效果！',
            icon: '💣',
            colors: {
                primary: MILITARY_COLORS.ACCENT_RED,
                secondary: MILITARY_COLORS.CAMO_GREEN
            }
        };
    }

    constructor(context) {
        super(context);
        this.currentDifficulty = 'recruit';
        this.board = [];
        this.rows = 9;
        this.cols = 9;
        this.mines = 10;
        this.minesLeft = 10;
        this.timer = 0;
        this.timerInterval = null;
        this.isGameOver = false;
        this.isWin = false;
        this.firstClick = true;
        this.gameContainer = null;
        this.boardElement = null;
        this.cells = [];
        this.audioManager = new AudioManager();
        this.explosionParticles = [];
        this.scanEffects = [];
        this.isPaused = false;
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        this.startNewGame(this.currentDifficulty);
        console.log('军事扫雷游戏已初始化');
    }

    hidePlatformHeaderInfo() {
        const scoreDisplay = document.getElementById('score-display');
        const comboDisplay = document.getElementById('combo-display');
        if (scoreDisplay) {
            scoreDisplay.style.display = 'none';
        }
        if (comboDisplay) {
            comboDisplay.style.display = 'none';
        }
    }

    restorePlatformHeaderInfo() {
        const scoreDisplay = document.getElementById('score-display');
        const comboDisplay = document.getElementById('combo-display');
        if (scoreDisplay) {
            scoreDisplay.style.display = '';
        }
        if (comboDisplay) {
            comboDisplay.style.display = '';
        }
    }

    createGameUI() {
        this.canvas.innerHTML = '';
        this.canvas.style.cssText = `
            background: linear-gradient(135deg, ${MILITARY_COLORS.TACTICAL_BLACK} 0%, ${MILITARY_COLORS.CAMO_DARK} 50%, ${MILITARY_COLORS.TACTICAL_DARK} 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: hidden;
            position: relative;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes military-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.02); }
            }
            @keyframes military-scan {
                0% { clip-path: inset(0 0 100% 0); opacity: 0; }
                20% { opacity: 1; }
                100% { clip-path: inset(100% 0 0 0); opacity: 0; }
            }
            @keyframes military-explosion-flash {
                0% { background: rgba(255, 100, 0, 0); }
                10% { background: rgba(255, 200, 0, 0.9); }
                30% { background: rgba(255, 150, 0, 0.7); }
                60% { background: rgba(255, 50, 0, 0.4); }
                100% { background: rgba(200, 0, 0, 0); }
            }
            @keyframes military-explosion-shake {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                10% { transform: translate(-15px, -10px) rotate(-2deg); }
                20% { transform: translate(15px, 10px) rotate(2deg); }
                30% { transform: translate(-12px, 8px) rotate(-1.5deg); }
                40% { transform: translate(12px, -8px) rotate(1.5deg); }
                50% { transform: translate(-8px, 12px) rotate(-1deg); }
                60% { transform: translate(8px, -12px) rotate(1deg); }
                70% { transform: translate(-5px, 5px) rotate(-0.5deg); }
                80% { transform: translate(5px, -5px) rotate(0.5deg); }
                90% { transform: translate(-2px, 2px) rotate(0deg); }
            }
            @keyframes military-debris-fly {
                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                100% { transform: translate(var(--debris-x), var(--debris-y)) scale(0); opacity: 0; }
            }
            @keyframes military-fireball {
                0% { transform: scale(0) translate(-50%, -50%); opacity: 1; }
                50% { transform: scale(1.5) translate(-50%, -50%); opacity: 0.8; }
                100% { transform: scale(2) translate(-50%, -50%); opacity: 0; }
            }
            @keyframes military-smoke-rise {
                0% { transform: translateY(0) scale(0.5); opacity: 0.8; }
                100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
            }
            @keyframes military-cell-reveal {
                0% { transform: scale(0.9); opacity: 0.5; }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes military-flag-wave {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(5deg); }
                75% { transform: rotate(-5deg); }
            }
            @keyframes military-number-pop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes military-radar-sweep {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes military-status-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            @keyframes military-victory-glow {
                0%, 100% { box-shadow: 0 0 20px rgba(74, 156, 45, 0.5); }
                50% { box-shadow: 0 0 40px rgba(74, 156, 45, 0.8), 0 0 60px rgba(74, 156, 45, 0.4); }
            }
        `;
        document.head.appendChild(style);

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'military-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
            max-width: 900px;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            position: relative;
            z-index: 10;
        `;

        this.createHeader();
        this.createBoard();
        this.createDifficultySelector();
        this.createStatusPanel();

        this.canvas.appendChild(this.gameContainer);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'military-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 600px;
            padding: 15px 25px;
            background: linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(58, 58, 58, 0.9));
            border: 2px solid ${MILITARY_COLORS.BORDER_METAL};
            border-radius: 8px;
            position: relative;
            overflow: hidden;
        `;

        header.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ${MILITARY_COLORS.ACCENT_GREEN}, ${MILITARY_COLORS.ACCENT_YELLOW}, ${MILITARY_COLORS.ACCENT_RED});"></div>
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ${MILITARY_COLORS.ACCENT_RED}, ${MILITARY_COLORS.ACCENT_YELLOW}, ${MILITARY_COLORS.ACCENT_GREEN});"></div>
        `;

        const mineCounter = document.createElement('div');
        mineCounter.id = 'military-mine-counter';
        mineCounter.className = 'mine-counter';
        mineCounter.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: ${MILITARY_COLORS.TACTICAL_BLACK};
            border: 2px solid ${MILITARY_COLORS.ACCENT_RED};
            border-radius: 6px;
        `;
        mineCounter.innerHTML = `
            <span style="font-size: 1.5rem;">💣</span>
            <span id="mine-count" style="font-size: 1.8rem; font-weight: 800; color: ${MILITARY_COLORS.ACCENT_RED}; font-family: 'Courier New', monospace; font-variant-numeric: tabular-nums;">010</span>
        `;

        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'military-timer';
        timerDisplay.className = 'timer-display';
        timerDisplay.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: ${MILITARY_COLORS.TACTICAL_BLACK};
            border: 2px solid ${MILITARY_COLORS.ACCENT_GREEN};
            border-radius: 6px;
        `;
        timerDisplay.innerHTML = `
            <span style="font-size: 1.5rem;">⏱️</span>
            <span id="timer-value" style="font-size: 1.8rem; font-weight: 800; color: ${MILITARY_COLORS.ACCENT_GREEN}; font-family: 'Courier New', monospace; font-variant-numeric: tabular-nums;">000</span>
        `;

        const resetBtn = document.createElement('button');
        resetBtn.id = 'military-reset-btn';
        resetBtn.className = 'reset-btn';
        resetBtn.innerHTML = '🎯';
        resetBtn.style.cssText = `
            width: 50px;
            height: 50px;
            font-size: 1.8rem;
            background: linear-gradient(135deg, ${MILITARY_COLORS.CAMO_MEDIUM}, ${MILITARY_COLORS.CAMO_DARK});
            border: 3px solid ${MILITARY_COLORS.BORDER_METAL};
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        resetBtn.addEventListener('click', () => {
            this.startNewGame(this.currentDifficulty);
        });
        resetBtn.addEventListener('mouseenter', () => {
            resetBtn.style.transform = 'scale(1.1)';
            resetBtn.style.boxShadow = `0 0 15px ${MILITARY_COLORS.ACCENT_YELLOW}`;
        });
        resetBtn.addEventListener('mouseleave', () => {
            resetBtn.style.transform = 'scale(1)';
            resetBtn.style.boxShadow = 'none';
        });

        header.appendChild(mineCounter);
        header.appendChild(resetBtn);
        header.appendChild(timerDisplay);
        this.gameContainer.appendChild(header);
    }

    createBoard() {
        const boardContainer = document.createElement('div');
        boardContainer.className = 'military-board-container';
        boardContainer.id = 'military-board-container';
        boardContainer.style.cssText = `
            position: relative;
            padding: 8px;
            background: linear-gradient(135deg, ${MILITARY_COLORS.CAMO_BROWN}, ${MILITARY_COLORS.CAMO_DARK});
            border: 3px solid ${MILITARY_COLORS.BORDER_METAL};
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 2px 10px rgba(0, 0, 0, 0.3);
        `;

        this.boardElement = document.createElement('div');
        this.boardElement.className = 'military-board';
        this.boardElement.id = 'military-board';
        this.boardElement.style.cssText = `
            display: grid;
            gap: 1px;
            background: ${MILITARY_COLORS.GRID_LINE};
            padding: 2px;
            border-radius: 4px;
            position: relative;
        `;

        boardContainer.appendChild(this.boardElement);
        this.gameContainer.appendChild(boardContainer);
    }

    createDifficultySelector() {
        const selector = document.createElement('div');
        selector.className = 'difficulty-selector-military';
        selector.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 5px;
            flex-wrap: wrap;
            justify-content: center;
        `;

        Object.entries(MILITARY_DIFFICULTY).forEach(([key, config]) => {
            const btn = document.createElement('button');
            btn.className = 'difficulty-btn-military';
            btn.dataset.difficulty = key;
            btn.innerHTML = `${config.label} ${config.name}`;
            btn.style.cssText = `
                padding: 10px 20px;
                font-size: 0.9rem;
                font-weight: 600;
                background: ${key === this.currentDifficulty ? 
                    `linear-gradient(135deg, ${MILITARY_COLORS.ACCENT_GREEN}, ${MILITARY_COLORS.CAMO_GREEN})` : 
                    `linear-gradient(135deg, ${MILITARY_COLORS.TACTICAL_GRAY}, ${MILITARY_COLORS.TACTICAL_DARK})`};
                border: 2px solid ${key === this.currentDifficulty ? 
                    MILITARY_COLORS.ACCENT_GREEN : MILITARY_COLORS.BORDER_METAL};
                color: ${MILITARY_COLORS.TEXT_PRIMARY};
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            `;
            
            btn.addEventListener('click', () => {
                this.currentDifficulty = key;
                this.updateDifficultyButtons();
                this.startNewGame(key);
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = `0 5px 15px rgba(0, 0, 0, 0.3)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });

            selector.appendChild(btn);
        });

        this.gameContainer.appendChild(selector);
    }

    createStatusPanel() {
        const statusPanel = document.createElement('div');
        statusPanel.className = 'status-panel';
        statusPanel.id = 'military-status-panel';
        statusPanel.style.cssText = `
            display: flex;
            gap: 20px;
            padding: 10px 20px;
            background: rgba(42, 42, 42, 0.8);
            border: 1px solid ${MILITARY_COLORS.BORDER_METAL};
            border-radius: 6px;
            margin-top: 5px;
            font-size: 0.85rem;
            color: ${MILITARY_COLORS.TEXT_SECONDARY};
        `;
        statusPanel.innerHTML = `
            <span>🖱️ 左键: 翻开格子</span>
            <span>🚩 右键: 标记/取消标记</span>
            <span id="game-status-text">状态: 准备就绪</span>
        `;
        this.gameContainer.appendChild(statusPanel);
    }

    updateDifficultyButtons() {
        const buttons = document.querySelectorAll('.difficulty-btn-military');
        buttons.forEach(btn => {
            const isActive = btn.dataset.difficulty === this.currentDifficulty;
            btn.style.background = isActive ? 
                `linear-gradient(135deg, ${MILITARY_COLORS.ACCENT_GREEN}, ${MILITARY_COLORS.CAMO_GREEN})` : 
                `linear-gradient(135deg, ${MILITARY_COLORS.TACTICAL_GRAY}, ${MILITARY_COLORS.TACTICAL_DARK})`;
            btn.style.borderColor = isActive ? MILITARY_COLORS.ACCENT_GREEN : MILITARY_COLORS.BORDER_METAL;
        });
    }

    updateStatusText(text) {
        const statusText = document.getElementById('game-status-text');
        if (statusText) {
            statusText.textContent = `状态: ${text}`;
        }
    }

    startNewGame(difficulty) {
        const config = MILITARY_DIFFICULTY[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;
        this.minesLeft = config.mines;
        this.timer = 0;
        this.isGameOver = false;
        this.isWin = false;
        this.firstClick = true;
        this.isPaused = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = null;

        this.board = Array(this.rows).fill(null).map(() => 
            Array(this.cols).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                isQuestioned: false,
                adjacentMines: 0
            }))
        );

        this.renderBoard();
        this.updateMineCounter();
        this.updateTimerDisplay();
        this.updateStatusText('等待指令');
        this.updateResetButton('🎯');

        const boardContainer = document.getElementById('military-board-container');
        if (boardContainer) {
            boardContainer.style.animation = 'none';
        }

        this.audioManager.playSound('perfect', { pitch: 1.0, volume: 0.4 });
    }

    updateResetButton(emoji) {
        const resetBtn = document.getElementById('military-reset-btn');
        if (resetBtn) {
            resetBtn.innerHTML = emoji;
        }
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.cells = [];
        
        const cellSize = Math.min(
            Math.floor((this.canvas.offsetWidth - 60) / this.cols),
            Math.floor((this.canvas.offsetHeight - 250) / this.rows),
            30
        );

        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize}px)`;

        for (let row = 0; row < this.rows; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'military-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const isEvenRow = row % 2 === 0;
                const isEvenCol = col % 2 === 0;
                const camoPattern = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol) ? 
                    MILITARY_COLORS.CAMO_MEDIUM : MILITARY_COLORS.CAMO_DARK;
                
                cell.style.cssText = `
                    width: ${cellSize}px;
                    height: ${cellSize}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, ${camoPattern}, ${MILITARY_COLORS.CAMO_DARK});
                    cursor: pointer;
                    position: relative;
                    transition: all 0.1s ease;
                    user-select: none;
                    font-weight: 700;
                    font-size: ${Math.max(cellSize * 0.5, 12)}px;
                    border: 1px solid ${MILITARY_COLORS.GRID_LINE};
                    box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.2);
                `;

                cell.addEventListener('mousedown', (e) => {
                    if (this.isGameOver || this.isWin) return;
                    if (e.button === 0) {
                        this.updateResetButton('😮');
                    }
                });

                cell.addEventListener('mouseup', (e) => {
                    if (this.isGameOver || this.isWin) return;
                    this.updateResetButton('🎯');
                });

                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.isGameOver || this.isWin) return;
                    this.handleLeftClick(row, col);
                });

                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (this.isGameOver || this.isWin) return;
                    this.handleRightClick(row, col);
                });

                this.boardElement.appendChild(cell);
                this.cells[row][col] = {
                    element: cell
                };
            }
        }
    }

    handleLeftClick(row, col) {
        const cellData = this.board[row][col];
        
        if (cellData.isFlagged || cellData.isRevealed) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
            this.updateStatusText('任务进行中...');
        }

        if (cellData.isMine) {
            this.revealCell(row, col);
            this.gameOver(false, row, col);
        } else {
            this.revealCell(row, col);
            this.checkWin();
        }
    }

    handleRightClick(row, col) {
        const cellData = this.board[row][col];
        
        if (cellData.isRevealed) return;

        if (cellData.isFlagged) {
            cellData.isFlagged = false;
            cellData.isQuestioned = true;
            this.minesLeft++;
        } else if (cellData.isQuestioned) {
            cellData.isQuestioned = false;
        } else {
            cellData.isFlagged = true;
            this.minesLeft--;
        }

        this.updateCellDisplay(row, col);
        this.updateMineCounter();
        this.audioManager.playSound('hit', { pitch: cellData.isFlagged ? 1.1 : 0.9, volume: 0.3 });
    }

    placeMines(safeRow, safeCol) {
        const safeCells = new Set();
        for (let r = Math.max(0, safeRow - 1); r <= Math.min(this.rows - 1, safeRow + 1); r++) {
            for (let c = Math.max(0, safeCol - 1); c <= Math.min(this.cols - 1, safeCol + 1); c++) {
                safeCells.add(`${r},${c}`);
            }
        }

        let placed = 0;
        while (placed < this.mines) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            
            if (!this.board[r][c].isMine && !safeCells.has(`${r},${c}`)) {
                this.board[r][c].isMine = true;
                placed++;
            }
        }

        this.calculateAdjacentMines();
    }

    calculateAdjacentMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                                if (this.board[nr][nc].isMine) count++;
                            }
                        }
                    }
                    this.board[r][c].adjacentMines = count;
                }
            }
        }
    }

    revealCell(row, col) {
        const cellData = this.board[row][col];
        
        if (cellData.isRevealed || cellData.isFlagged) return;

        cellData.isRevealed = true;
        this.updateCellDisplay(row, col);
        this.playScanEffect(row, col);

        if (cellData.adjacentMines === 0 && !cellData.isMine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        if (!this.board[nr][nc].isRevealed) {
                            setTimeout(() => this.revealCell(nr, nc), 30);
                        }
                    }
                }
            }
        }
    }

    playScanEffect(row, col) {
        const cellElement = this.cells[row][col].element;
        
        const scanOverlay = document.createElement('div');
        scanOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, 
                transparent,
                rgba(74, 156, 45, 0.6),
                rgba(212, 160, 23, 0.4),
                transparent
            );
            pointer-events: none;
            animation: military-scan 0.4s ease-out forwards;
        `;
        
        cellElement.appendChild(scanOverlay);
        setTimeout(() => scanOverlay.remove(), 400);
        
        this.audioManager.playSound('hit', { pitch: 0.8 + Math.random() * 0.3, volume: 0.2, type: 'sine' });
    }

    updateCellDisplay(row, col) {
        const cellData = this.board[row][col];
        const cellElement = this.cells[row][col].element;
        
        cellElement.innerHTML = '';
        
        if (cellData.isRevealed) {
            const isEvenRow = row % 2 === 0;
            const isEvenCol = col % 2 === 0;
            const baseColor = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol) ? 
                MILITARY_COLORS.CAMO_LIGHT : MILITARY_COLORS.CAMO_MEDIUM;
            
            cellElement.style.background = `linear-gradient(135deg, ${baseColor}, ${MILITARY_COLORS.TACTICAL_GRAY})`;
            cellElement.style.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.2)';
            cellElement.style.animation = 'military-cell-reveal 0.2s ease';
            
            if (cellData.isMine) {
                const mineIcon = document.createElement('span');
                mineIcon.innerHTML = '💣';
                mineIcon.style.cssText = `
                    font-size: ${Math.max(cellElement.offsetWidth * 0.7, 16)}px;
                    animation: military-number-pop 0.3s ease;
                `;
                cellElement.appendChild(mineIcon);
                cellElement.style.background = `linear-gradient(135deg, ${MILITARY_COLORS.ACCENT_RED}, #8a1a25)`;
            } else if (cellData.adjacentMines > 0) {
                const numberEl = document.createElement('span');
                numberEl.textContent = cellData.adjacentMines;
                numberEl.style.cssText = `
                    color: ${this.getNumberColor(cellData.adjacentMines)};
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                    animation: military-number-pop 0.2s ease;
                `;
                cellElement.appendChild(numberEl);
            }
        } else {
            const isEvenRow = row % 2 === 0;
            const isEvenCol = col % 2 === 0;
            const camoPattern = (isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol) ? 
                MILITARY_COLORS.CAMO_MEDIUM : MILITARY_COLORS.CAMO_DARK;
            
            cellElement.style.background = `linear-gradient(135deg, ${camoPattern}, ${MILITARY_COLORS.CAMO_DARK})`;
            cellElement.style.boxShadow = 'inset 1px 1px 2px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.2)';
            
            if (cellData.isFlagged) {
                const flagIcon = document.createElement('span');
                flagIcon.innerHTML = '🚩';
                flagIcon.style.cssText = `
                    font-size: ${Math.max(cellElement.offsetWidth * 0.6, 14)}px;
                    animation: military-flag-wave 1s ease-in-out infinite;
                `;
                cellElement.appendChild(flagIcon);
            } else if (cellData.isQuestioned) {
                const questionIcon = document.createElement('span');
                questionIcon.textContent = '?';
                questionIcon.style.cssText = `
                    font-size: ${Math.max(cellElement.offsetWidth * 0.6, 14)}px;
                    color: ${MILITARY_COLORS.ACCENT_YELLOW};
                    font-weight: 800;
                `;
                cellElement.appendChild(questionIcon);
            }
        }
    }

    getNumberColor(count) {
        const colors = [
            '',
            '#4a9c2d',
            '#1e5f8f',
            '#c41e3a',
            '#7c3aed',
            '#854d0e',
            '#0d9488',
            '#1a1a1a',
            '#6b7280'
        ];
        return colors[count] || colors[1];
    }

    updateMineCounter() {
        const mineCountEl = document.getElementById('mine-count');
        if (mineCountEl) {
            const display = Math.max(0, this.minesLeft);
            mineCountEl.textContent = display.toString().padStart(3, '0');
        }
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('timer-value');
        if (timerEl) {
            const display = Math.min(999, this.timer);
            timerEl.textContent = display.toString().padStart(3, '0');
        }
    }

    startTimer() {
        if (this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver && !this.isWin) {
                this.timer++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    checkWin() {
        let unrevealedSafe = 0;
        let flaggedMines = 0;
        let correctlyFlagged = 0;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (!cell.isRevealed && !cell.isMine) {
                    unrevealedSafe++;
                }
                if (cell.isFlagged && cell.isMine) {
                    correctlyFlagged++;
                }
                if (cell.isFlagged) {
                    flaggedMines++;
                }
            }
        }

        if (unrevealedSafe === 0 || correctlyFlagged === this.mines) {
            this.gameOver(true);
        }
    }

    gameOver(isWin, mineRow = -1, mineCol = -1) {
        this.isGameOver = true;
        this.isWin = isWin;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (isWin) {
            this.updateStatusText('任务完成！区域已安全！');
            this.updateResetButton('😎');
            this.showVictoryEffect();
        } else {
            this.updateStatusText('任务失败！触发地雷！');
            this.updateResetButton('💀');
            this.revealAllMines();
            this.showExplosionEffect(mineRow, mineCol);
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c].isMine) {
                    this.board[r][c].isRevealed = true;
                    setTimeout(() => {
                        this.updateCellDisplay(r, c);
                    }, 100 + Math.random() * 200);
                }
            }
        }
    }

    showVictoryEffect() {
        const boardContainer = document.getElementById('military-board-container');
        if (boardContainer) {
            boardContainer.style.animation = 'military-victory-glow 1.5s ease-in-out infinite';
        }

        this.audioManager.playSound('perfect', { pitch: 1.0, volume: 0.6 });
        setTimeout(() => this.audioManager.playSound('combo', { pitch: 1.2, volume: 0.5 }), 200);
        setTimeout(() => this.audioManager.playSound('combo', { pitch: 1.4, volume: 0.4 }), 400);

        this.showVictoryScreen();
    }

    showExplosionEffect(row, col) {
        const boardContainer = document.getElementById('military-board-container');
        const cellElement = this.cells[row][col].element;
        const rect = cellElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        boardContainer.style.animation = 'military-explosion-shake 0.8s ease-in-out';

        const flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 9999;
            animation: military-explosion-flash 0.6s ease-out forwards;
        `;
        document.body.appendChild(flashOverlay);
        setTimeout(() => flashOverlay.remove(), 600);

        const centerX = rect.left - canvasRect.left + rect.width / 2;
        const centerY = rect.top - canvasRect.top + rect.height / 2;

        const fireball = document.createElement('div');
        fireball.style.cssText = `
            position: absolute;
            width: 100px;
            height: 100px;
            left: ${centerX}px;
            top: ${centerY}px;
            background: radial-gradient(circle, #fff 0%, #ff8c00 30%, #ff4500 60%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
            animation: military-fireball 0.5s ease-out forwards;
        `;
        this.canvas.appendChild(fireball);
        setTimeout(() => fireball.remove(), 500);

        this.createDebris(centerX, centerY);
        this.createSmoke(centerX, centerY);

        this.audioManager.playSound('miss', { pitch: 0.5, volume: 0.8, type: 'sawtooth' });
        this.triggerShake(30, 500);

        setTimeout(() => {
            this.showGameOverScreen();
        }, 800);
    }

    createDebris(centerX, centerY) {
        const debrisCount = 25;
        for (let i = 0; i < debrisCount; i++) {
            const debris = document.createElement('div');
            const angle = (Math.PI * 2 * i) / debrisCount + Math.random() * 0.5;
            const distance = 80 + Math.random() * 150;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance - 50;
            
            const size = 4 + Math.random() * 8;
            const colors = ['#5c4a3a', '#8b7355', '#a0522d', '#d2691e', '#8b4513'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            debris.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${centerX}px;
                top: ${centerY}px;
                background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                pointer-events: none;
                z-index: 100;
                --debris-x: ${x}px;
                --debris-y: ${y}px;
                animation: military-debris-fly ${0.5 + Math.random() * 0.5}s ease-out forwards;
            `;
            this.canvas.appendChild(debris);
            setTimeout(() => debris.remove(), 1000);
        }
    }

    createSmoke(centerX, centerY) {
        for (let i = 0; i < 8; i++) {
            const smoke = document.createElement('div');
            const delay = i * 100;
            const offsetX = (Math.random() - 0.5) * 60;
            const size = 30 + Math.random() * 40;
            
            smoke.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${centerX + offsetX - size/2}px;
                top: ${centerY - size/2}px;
                background: radial-gradient(circle, rgba(100, 100, 100, 0.8) 0%, rgba(80, 80, 80, 0.4) 40%, transparent 100%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 99;
                animation: military-smoke-rise ${1.5 + Math.random() * 0.5}s ease-out ${delay}ms forwards;
                opacity: 0;
            `;
            this.canvas.appendChild(smoke);
            setTimeout(() => smoke.remove(), 2500);
        }
    }

    showVictoryScreen() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        
        const overlay = document.createElement('div');
        overlay.className = 'military-victory-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
        `;
        
        const card = document.createElement('div');
        card.className = 'military-victory-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${MILITARY_COLORS.CAMO_DARK}, ${MILITARY_COLORS.TACTICAL_DARK});
            border: 3px solid ${MILITARY_COLORS.ACCENT_GREEN};
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            animation: military-cell-reveal 0.5s ease;
            box-shadow: 0 25px 60px rgba(74, 156, 45, 0.3);
            position: relative;
            overflow: hidden;
        `;
        
        card.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, ${MILITARY_COLORS.ACCENT_GREEN}, ${MILITARY_COLORS.ACCENT_YELLOW});"></div>
            <div style="font-size: 4rem; margin-bottom: 15px;">🏆</div>
            <h2 style="font-size: 1.8rem; font-weight: 800; color: ${MILITARY_COLORS.ACCENT_GREEN}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">任务完成！</h2>
            <p style="color: ${MILITARY_COLORS.TEXT_SECONDARY}; margin-bottom: 25px; font-size: 0.95rem; line-height: 1.6;">
                区域已安全清除所有地雷<br>
                难度: <span style="color: ${MILITARY_COLORS.ACCENT_YELLOW}; font-weight: 700;">${MILITARY_DIFFICULTY[this.currentDifficulty].name}</span><br>
                用时: <span style="color: ${MILITARY_COLORS.ACCENT_GREEN}; font-weight: 700;">${timeStr}</span>
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="military-retry-btn" style="
                    padding: 12px 24px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${MILITARY_COLORS.ACCENT_GREEN}, ${MILITARY_COLORS.CAMO_GREEN});
                    border: 2px solid ${MILITARY_COLORS.ACCENT_GREEN};
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">再来一局</button>
                <button class="military-exit-btn" style="
                    padding: 12px 24px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${MILITARY_COLORS.TACTICAL_GRAY};
                    border: 2px solid ${MILITARY_COLORS.BORDER_METAL};
                    color: ${MILITARY_COLORS.TEXT_PRIMARY};
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">返回主页</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        const retryBtn = card.querySelector('.military-retry-btn');
        const exitBtn = card.querySelector('.military-exit-btn');
        
        retryBtn.addEventListener('click', () => {
            overlay.remove();
            this.startNewGame(this.currentDifficulty);
        });
        
        exitBtn.addEventListener('click', () => {
            overlay.remove();
            this.context.gameManager.exitGame();
        });
    }

    showGameOverScreen() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        
        const overlay = document.createElement('div');
        overlay.className = 'military-gameover-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
        `;
        
        const card = document.createElement('div');
        card.className = 'military-gameover-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${MILITARY_COLORS.TACTICAL_DARK}, #2a1a1a);
            border: 3px solid ${MILITARY_COLORS.ACCENT_RED};
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            animation: military-cell-reveal 0.5s ease;
            box-shadow: 0 25px 60px rgba(196, 30, 58, 0.3);
            position: relative;
            overflow: hidden;
        `;
        
        card.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, ${MILITARY_COLORS.ACCENT_RED}, ${MILITARY_COLORS.ACCENT_YELLOW});"></div>
            <div style="font-size: 4rem; margin-bottom: 15px;">💥</div>
            <h2 style="font-size: 1.8rem; font-weight: 800; color: ${MILITARY_COLORS.ACCENT_RED}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">任务失败！</h2>
            <p style="color: ${MILITARY_COLORS.TEXT_SECONDARY}; margin-bottom: 25px; font-size: 0.95rem; line-height: 1.6;">
                触发地雷，任务终止<br>
                难度: <span style="color: ${MILITARY_COLORS.ACCENT_YELLOW}; font-weight: 700;">${MILITARY_DIFFICULTY[this.currentDifficulty].name}</span><br>
                存活时间: <span style="color: ${MILITARY_COLORS.TEXT_PRIMARY}; font-weight: 700;">${timeStr}</span>
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="military-retry-btn" style="
                    padding: 12px 24px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${MILITARY_COLORS.ACCENT_RED}, #8a1a25);
                    border: 2px solid ${MILITARY_COLORS.ACCENT_RED};
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">重新挑战</button>
                <button class="military-exit-btn" style="
                    padding: 12px 24px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${MILITARY_COLORS.TACTICAL_GRAY};
                    border: 2px solid ${MILITARY_COLORS.BORDER_METAL};
                    color: ${MILITARY_COLORS.TEXT_PRIMARY};
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">返回主页</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        const retryBtn = card.querySelector('.military-retry-btn');
        const exitBtn = card.querySelector('.military-exit-btn');
        
        retryBtn.addEventListener('click', () => {
            overlay.remove();
            this.startNewGame(this.currentDifficulty);
        });
        
        exitBtn.addEventListener('click', () => {
            overlay.remove();
            this.context.gameManager.exitGame();
        });
    }

    start() {
        this.isRunning = true;
        console.log('军事扫雷游戏已启动');
    }

    stop() {
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.restorePlatformHeaderInfo();
        console.log('军事扫雷游戏已停止');
    }

    pause() {
        this.isPaused = true;
        this.updateStatusText('已暂停');
    }

    resume() {
        this.isPaused = false;
        if (!this.isGameOver && !this.isWin && !this.firstClick) {
            this.updateStatusText('任务进行中...');
        }
    }

    render(deltaTime) {
        if (!this.isRunning) return;
    }

    handleInput(eventType, event) {
        if (!this.isRunning) return;
    }
}
