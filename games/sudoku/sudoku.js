/**
 * 数独游戏 - Sudoku Game
 * 深色毛玻璃风格，Q弹动效
 * 优化布局：操作区在棋盘两侧
 */

const SUDOKU_COLORS = {
    DARK_BG: '#0a0a1a',
    DARKER_BG: '#050510',
    GLASS_BG: 'rgba(25, 25, 50, 0.9)',
    GLASS_BORDER: 'rgba(255, 255, 255, 0.15)',
    ACCENT_BLUE: '#818cf8',
    ACCENT_PURPLE: '#c084fc',
    ACCENT_PINK: '#f472b6',
    ACCENT_GREEN: '#4ade80',
    ACCENT_RED: '#f87171',
    ACCENT_YELLOW: '#fbbf24',
    TEXT_PRIMARY: '#f8fafc',
    TEXT_SECONDARY: '#94a3b8',
    TEXT_MUTED: '#475569',
    CELL_FIXED: '#e2e8f0',
    CELL_USER: '#818cf8',
    CELL_ERROR: '#f87171',
    CELL_NOTE: '#94a3b8',
    BOX_EVEN: 'rgba(30, 30, 60)',
    BOX_ODD: 'rgba(20, 20, 50)',
    HIGHLIGHT_ROW_COL: 'rgba(129, 140, 248, 0.12)',
    HIGHLIGHT_BOX: 'rgba(192, 132, 252, 0.08)',
    HIGHLIGHT_SELECTED: 'rgba(129, 140, 248, 0.4)',
    HIGHLIGHT_SAME_NUMBER: 'rgba(74, 222, 128, 0.3)',
    HIGHLIGHT_CONFLICT: 'rgba(248, 113, 113, 0.4)',
    BOX_BORDER: '#6366f1',
};

const SUDOKU_DIFFICULTY = {
    easy: { name: '简单', cellsToRemove: 35, label: '☀️' },
    medium: { name: '中等', cellsToRemove: 45, label: '🌤️' },
    hard: { name: '困难', cellsToRemove: 52, label: '🌙' }
};

class SudokuSolver {
    constructor() {
        this.solutions = 0;
        this.maxSolutions = 2;
    }

    isValid(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (let num of nums) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solve(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    countSolutions(board) {
        this.solutions = 0;
        this._countSolutionsHelper(this.copyBoard(board));
        return this.solutions;
    }

    _countSolutionsHelper(board) {
        if (this.solutions >= this.maxSolutions) return;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            this._countSolutionsHelper(board);
                            board[row][col] = 0;
                        }
                    }
                    return;
                }
            }
        }
        this.solutions++;
    }

    generateFullBoard() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solve(board);
        return board;
    }

    generatePuzzle(difficulty) {
        const fullBoard = this.generateFullBoard();
        const puzzle = this.copyBoard(fullBoard);
        const cellsToRemove = SUDOKU_DIFFICULTY[difficulty].cellsToRemove;
        
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        this.shuffle(positions);
        
        let removed = 0;
        for (let [row, col] of positions) {
            if (removed >= cellsToRemove) break;
            const temp = puzzle[row][col];
            puzzle[row][col] = 0;
            if (this.countSolutions(puzzle) === 1) {
                removed++;
            } else {
                puzzle[row][col] = temp;
            }
        }
        
        return { puzzle, solution: fullBoard, difficulty };
    }

    copyBoard(board) {
        return board.map(row => [...row]);
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

class SudokuGame extends GameInterface {
    static get metadata() {
        return {
            id: 'sudoku',
            name: '数独',
            description: '经典数独游戏，三种难度，支持笔记模式！',
            icon: '🧩',
            colors: {
                primary: SUDOKU_COLORS.ACCENT_BLUE,
                secondary: SUDOKU_COLORS.ACCENT_PURPLE
            }
        };
    }

    constructor(context) {
        super(context);
        this.solver = new SudokuSolver();
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
        this.selectedCell = null;
        this.isNoteMode = false;
        this.currentDifficulty = 'medium';
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.isComplete = false;
        this.isPaused = false;
        this.history = [];
        this.numberCounts = {};
        this.gameContainer = null;
        this.boardElement = null;
        this.cells = [];
        this.numberPadButtons = [];
        this.audioManager = new AudioManager();
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        this.startNewGame(this.currentDifficulty);
        console.log('数独游戏已初始化');
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
            background: linear-gradient(135deg, ${SUDOKU_COLORS.DARK_BG} 0%, #1a1a2e 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: hidden;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes sudoku-pop-in {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes sudoku-shake {
                0%, 100% { transform: translateX(0); }
                10% { transform: translateX(-8px) rotate(-0.5deg); }
                20% { transform: translateX(8px) rotate(0.5deg); }
                30% { transform: translateX(-6px); }
                40% { transform: translateX(6px); }
                50% { transform: translateX(-4px); }
                60% { transform: translateX(4px); }
                70% { transform: translateX(-2px); }
                80% { transform: translateX(2px); }
            }
            @keyframes sudoku-error-flash {
                0%, 100% { background: transparent; }
                25% { background: rgba(248, 113, 113, 0.4); }
                50% { background: transparent; }
                75% { background: rgba(248, 113, 113, 0.4); }
            }
            @keyframes sudoku-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes note-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes note-toggle {
                0% { transform: scale(1); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'sudoku-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
            max-width: 700px;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        `;

        this.createHeader();
        
        this.createMainContent();
        
        this.createNumberPad();
        
        this.createDifficultySelector();

        this.canvas.appendChild(this.gameContainer);
    }

    createNumberPad() {
        const padContainer = document.createElement('div');
        padContainer.className = 'sudoku-numpad';
        padContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            width: 100%;
            max-width: 500px;
            margin-top: 8px;
        `;

        this.numberPadButtons = [];
        for (let i = 1; i <= 9; i++) {
            const btn = this.createNumberButton(i);
            padContainer.appendChild(btn);
            this.numberPadButtons.push(btn);
        }

        this.gameContainer.appendChild(padContainer);
    }

    createNumberButton(num) {
        const btn = document.createElement('button');
        btn.className = 'numpad-btn';
        btn.dataset.num = num;
        btn.textContent = num;
        btn.style.cssText = `
            padding: 14px;
            font-size: 1.4rem;
            font-weight: 700;
            background: linear-gradient(135deg, rgba(40, 40, 80, 0.9), rgba(30, 30, 60, 0.9));
            backdrop-filter: blur(10px);
            border: 2px solid ${SUDOKU_COLORS.GLASS_BORDER};
            color: ${SUDOKU_COLORS.TEXT_PRIMARY};
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
        `;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.inputNumber(num);
        });

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-3px) scale(1.05)';
            btn.style.background = `linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_BLUE}, ${SUDOKU_COLORS.ACCENT_PURPLE})`;
            btn.style.boxShadow = `0 10px 30px rgba(129, 140, 248, 0.4)`;
            btn.style.borderColor = SUDOKU_COLORS.ACCENT_BLUE;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.background = 'linear-gradient(135deg, rgba(40, 40, 80, 0.9), rgba(30, 30, 60, 0.9))';
            btn.style.boxShadow = 'none';
            btn.style.borderColor = SUDOKU_COLORS.GLASS_BORDER;
        });

        return btn;
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'sudoku-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 550px;
            padding: 12px 20px;
            background: ${SUDOKU_COLORS.GLASS_BG};
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
            border-radius: 12px;
            margin-bottom: 8px;
        `;

        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'sudoku-timer';
        timerDisplay.id = 'sudoku-timer';
        timerDisplay.style.cssText = `
            font-size: 1.4rem;
            font-weight: 700;
            color: ${SUDOKU_COLORS.TEXT_PRIMARY};
            font-variant-numeric: tabular-nums;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        timerDisplay.innerHTML = `<span style="color: ${SUDOKU_COLORS.ACCENT_BLUE};">⏱️</span> 00:00`;

        const mistakesDisplay = document.createElement('div');
        mistakesDisplay.className = 'sudoku-mistakes';
        mistakesDisplay.id = 'sudoku-mistakes';
        mistakesDisplay.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;
        mistakesDisplay.innerHTML = `
            <span style="color: ${SUDOKU_COLORS.TEXT_SECONDARY}; font-size: 0.85rem; font-weight: 600;">错误:</span>
            <div class="mistakes-dots" style="display: flex; gap: 5px;">
                ${Array(this.maxMistakes).fill(0).map((_, i) => `
                    <div class="mistake-dot" data-index="${i}" style="
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        background: ${SUDOKU_COLORS.ACCENT_GREEN};
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                        border: 2px solid ${SUDOKU_COLORS.TEXT_MUTED};
                    "></div>
                `).join('')}
            </div>
        `;

        header.appendChild(timerDisplay);
        header.appendChild(mistakesDisplay);
        this.gameContainer.appendChild(header);
    }

    createMainContent() {
        const mainRow = document.createElement('div');
        mainRow.className = 'sudoku-main-row';
        mainRow.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            width: 100%;
        `;

        this.createLeftPanel();
        this.createBoard();
        this.createRightPanel();

        mainRow.appendChild(this.leftPanel);
        mainRow.appendChild(this.boardContainer);
        mainRow.appendChild(this.rightPanel);

        this.gameContainer.appendChild(mainRow);
    }

    createLeftPanel() {
        this.leftPanel = document.createElement('div');
        this.leftPanel.className = 'sudoku-left-panel';
        this.leftPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 90px;
            align-items: center;
        `;

        const numberCountPanel = document.createElement('div');
        numberCountPanel.className = 'number-count-panel';
        numberCountPanel.id = 'number-count-panel';
        numberCountPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
            padding: 10px 8px;
            background: ${SUDOKU_COLORS.GLASS_BG};
            backdrop-filter: blur(10px);
            border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
            border-radius: 10px;
        `;

        for (let num = 1; num <= 9; num++) {
            const countEl = document.createElement('div');
            countEl.className = 'number-count';
            countEl.dataset.num = num;
            countEl.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 8px;
                border-radius: 6px;
                transition: all 0.3s ease;
            `;
            countEl.innerHTML = `
                <span class="count-number" style="
                    font-size: 1rem;
                    font-weight: 700;
                    color: ${SUDOKU_COLORS.TEXT_PRIMARY};
                ">${num}</span>
                <span class="count-value" style="
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: ${SUDOKU_COLORS.ACCENT_GREEN};
                ">9</span>
            `;
            numberCountPanel.appendChild(countEl);
        }

        this.leftPanel.appendChild(numberCountPanel);
    }

    createRightPanel() {
        this.rightPanel = document.createElement('div');
        this.rightPanel.className = 'sudoku-right-panel';
        this.rightPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100px;
            align-items: center;
        `;

        const noteBtn = document.createElement('button');
        noteBtn.id = 'note-mode-btn';
        noteBtn.className = 'sudoku-btn note-btn';
        noteBtn.innerHTML = '✏️<br><span style="font-size:0.75rem;">笔记</span><br><span class="note-status" style="font-size:0.65rem;opacity:0.6;">OFF</span>';
        noteBtn.style.cssText = `
            padding: 12px 10px;
            font-size: 1rem;
            font-weight: 600;
            background: ${SUDOKU_COLORS.GLASS_BG};
            backdrop-filter: blur(10px);
            border: 2px solid ${SUDOKU_COLORS.GLASS_BORDER};
            color: ${SUDOKU_COLORS.TEXT_PRIMARY};
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            width: 100%;
        `;
        noteBtn.addEventListener('click', () => this.toggleNoteMode());

        const buttons = [
            { id: 'undo-btn', icon: '↩️', text: '撤销', action: () => this.undo() },
            { id: 'erase-btn', icon: '🗑️', text: '擦除', action: () => this.eraseCell() },
            { id: 'hint-btn', icon: '💡', text: '提示', action: () => this.showHint() },
            { id: 'new-game-btn', icon: '🔄', text: '新游戏', action: () => this.showNewGameMenu() }
        ];

        this.rightPanel.appendChild(noteBtn);

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.className = 'sudoku-btn';
            button.innerHTML = `${btn.icon}<br><span style="font-size:0.75rem;">${btn.text}</span>`;
            button.style.cssText = `
                padding: 10px 8px;
                font-size: 1rem;
                font-weight: 600;
                background: ${SUDOKU_COLORS.GLASS_BG};
                backdrop-filter: blur(10px);
                border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
                color: ${SUDOKU_COLORS.TEXT_PRIMARY};
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                width: 100%;
            `;
            button.addEventListener('click', btn.action);
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.background = SUDOKU_COLORS.ACCENT_BLUE;
                button.style.boxShadow = `0 6px 20px rgba(129, 140, 248, 0.4)`;
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.background = SUDOKU_COLORS.GLASS_BG;
                button.style.boxShadow = 'none';
            });

            this.rightPanel.appendChild(button);
        });
    }

    createBoard() {
        this.boardContainer = document.createElement('div');
        this.boardContainer.className = 'sudoku-board-container';
        this.boardContainer.style.cssText = `
            position: relative;
            padding: 4px;
            background: linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_BLUE}, ${SUDOKU_COLORS.ACCENT_PURPLE});
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        `;

        this.boardElement = document.createElement('div');
        this.boardElement.className = 'sudoku-board';
        this.boardElement.style.cssText = `
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            background: ${SUDOKU_COLORS.BOX_BORDER};
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            gap: 3px;
            padding: 3px;
        `;

        this.cells = [];
        for (let row = 0; row < 9; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const isEvenBox = (Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0;
                
                cell.style.cssText = `
                    width: 46px;
                    height: 46px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${isEvenBox ? SUDOKU_COLORS.BOX_EVEN : SUDOKU_COLORS.BOX_ODD};
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s ease;
                    user-select: none;
                `;

                const rightBorder = col % 3 === 2 && col !== 8;
                const bottomBorder = row % 3 === 2 && row !== 8;
                const leftBorder = col % 3 === 0 && col !== 0;
                const topBorder = row % 3 === 0 && row !== 0;

                if (rightBorder) cell.style.borderRight = `3px solid ${SUDOKU_COLORS.BOX_BORDER}`;
                if (bottomBorder) cell.style.borderBottom = `3px solid ${SUDOKU_COLORS.BOX_BORDER}`;
                if (leftBorder) cell.style.borderLeft = `3px solid ${SUDOKU_COLORS.BOX_BORDER}`;
                if (topBorder) cell.style.borderTop = `3px solid ${SUDOKU_COLORS.BOX_BORDER}`;

                const numberDisplay = document.createElement('span');
                numberDisplay.className = 'cell-number';
                numberDisplay.style.cssText = `
                    font-size: 1.7rem;
                    font-weight: 700;
                    color: ${SUDOKU_COLORS.CELL_FIXED};
                    transition: all 0.2s ease;
                    user-select: none;
                `;
                cell.appendChild(numberDisplay);

                const notesContainer = document.createElement('div');
                notesContainer.className = 'cell-notes';
                notesContainer.style.cssText = `
                    position: absolute;
                    top: 1px;
                    left: 1px;
                    right: 1px;
                    bottom: 1px;
                    display: none;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                    pointer-events: none;
                `;
                for (let n = 1; n <= 9; n++) {
                    const noteNum = document.createElement('span');
                    noteNum.className = 'note-num';
                    noteNum.dataset.num = n;
                    noteNum.style.cssText = `
                        font-size: 0.5rem;
                        color: ${SUDOKU_COLORS.CELL_NOTE};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 500;
                        opacity: 0;
                        transition: all 0.15s ease;
                    `;
                    noteNum.textContent = n;
                    notesContainer.appendChild(noteNum);
                }
                cell.appendChild(notesContainer);

                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectCell(row, col);
                });

                this.boardElement.appendChild(cell);
                this.cells[row][col] = {
                    element: cell,
                    numberDisplay: numberDisplay,
                    notesContainer: notesContainer
                };
            }
        }

        this.boardContainer.appendChild(this.boardElement);
    }

    createDifficultySelector() {
        const selector = document.createElement('div');
        selector.className = 'difficulty-selector';
        selector.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 5px;
            flex-wrap: wrap;
            justify-content: center;
        `;
        selector.id = 'difficulty-selector';

        Object.entries(SUDOKU_DIFFICULTY).forEach(([key, config]) => {
            const btn = document.createElement('button');
            btn.className = 'difficulty-btn';
            btn.dataset.difficulty = key;
            btn.innerHTML = `${config.label} ${config.name}`;
            btn.style.cssText = `
                padding: 8px 16px;
                font-size: 0.85rem;
                font-weight: 600;
                background: ${key === this.currentDifficulty ? 
                    `linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_BLUE}, ${SUDOKU_COLORS.ACCENT_PURPLE})` : 
                    SUDOKU_COLORS.GLASS_BG};
                border: 2px solid ${key === this.currentDifficulty ? 
                    SUDOKU_COLORS.ACCENT_BLUE : SUDOKU_COLORS.GLASS_BORDER};
                color: ${SUDOKU_COLORS.TEXT_PRIMARY};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            btn.addEventListener('click', () => {
                this.currentDifficulty = key;
                this.updateDifficultyButtons();
                this.startNewGame(key);
            });

            selector.appendChild(btn);
        });

        this.gameContainer.appendChild(selector);
    }

    updateDifficultyButtons() {
        const buttons = document.querySelectorAll('.difficulty-btn');
        buttons.forEach(btn => {
            const isActive = btn.dataset.difficulty === this.currentDifficulty;
            btn.style.background = isActive ? 
                `linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_BLUE}, ${SUDOKU_COLORS.ACCENT_PURPLE})` : 
                SUDOKU_COLORS.GLASS_BG;
            btn.style.borderColor = isActive ? SUDOKU_COLORS.ACCENT_BLUE : SUDOKU_COLORS.GLASS_BORDER;
        });
    }

    startNewGame(difficulty) {
        this.isComplete = false;
        this.mistakes = 0;
        this.timer = 0;
        this.selectedCell = null;
        this.isNoteMode = false;
        this.history = [];
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && !this.isComplete) {
                this.timer++;
                this.updateTimerDisplay();
            }
        }, 1000);

        const puzzleData = this.solver.generatePuzzle(difficulty);
        this.board = this.solver.copyBoard(puzzleData.puzzle);
        this.initialBoard = this.solver.copyBoard(puzzleData.puzzle);
        this.solution = puzzleData.solution;
        
        this.notes = Array(9).fill(null).map(() => 
            Array(9).fill(null).map(() => new Set())
        );

        this.renderBoard();
        this.updateNumberCounts();
        this.updateMistakesDisplay();
        this.updateTimerDisplay();
        this.updateNoteModeButton();

        this.audioManager.playSound('perfect', { pitch: 1.2, volume: 0.5 });
    }

    renderBoard() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                this.updateCellDisplay(row, col);
            }
        }
        this.clearHighlights();
    }

    updateCellDisplay(row, col) {
        const cellData = this.cells[row][col];
        const value = this.board[row][col];
        const isInitial = this.initialBoard[row][col] !== 0;
        
        if (value !== 0) {
            cellData.numberDisplay.textContent = value;
            cellData.numberDisplay.style.display = 'flex';
            cellData.numberDisplay.style.color = isInitial ? 
                SUDOKU_COLORS.CELL_FIXED : SUDOKU_COLORS.CELL_USER;
            cellData.numberDisplay.style.fontWeight = isInitial ? '800' : '700';
            cellData.notesContainer.style.display = 'none';
        } else {
            cellData.numberDisplay.textContent = '';
            cellData.numberDisplay.style.display = 'none';
            
            const notes = this.notes[row][col];
            if (notes.size > 0) {
                cellData.notesContainer.style.display = 'grid';
                cellData.notesContainer.querySelectorAll('.note-num').forEach(noteEl => {
                    const num = parseInt(noteEl.dataset.num);
                    if (notes.has(num)) {
                        noteEl.style.opacity = '1';
                    } else {
                        noteEl.style.opacity = '0';
                    }
                });
            } else {
                cellData.notesContainer.style.display = 'none';
            }
        }
    }

    selectCell(row, col) {
        if (this.isComplete) return;
        
        this.selectedCell = { row, col };
        this.clearHighlights();
        this.applyHighlights(row, col);
        
        const cellData = this.cells[row][col];
        cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_SELECTED;
        cellData.element.style.transform = 'scale(1.05)';
        cellData.element.style.boxShadow = `0 0 15px ${SUDOKU_COLORS.ACCENT_BLUE}`;
        cellData.element.style.zIndex = '10';
        
        this.audioManager.playSound('hit', { pitch: 0.8, volume: 0.3 });
    }

    clearHighlights() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellData = this.cells[row][col];
                const isEvenBox = (Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0;
                cellData.element.style.background = isEvenBox ? 
                    SUDOKU_COLORS.BOX_EVEN : SUDOKU_COLORS.BOX_ODD;
                cellData.element.style.transform = 'scale(1)';
                cellData.element.style.boxShadow = 'none';
                cellData.element.style.zIndex = '1';
                cellData.numberDisplay.style.color = 
                    (this.initialBoard[row][col] !== 0) ? SUDOKU_COLORS.CELL_FIXED : SUDOKU_COLORS.CELL_USER;
            }
        }
    }

    applyHighlights(row, col) {
        const selectedValue = this.board[row][col];
        const conflicts = this.findConflicts(row, col, selectedValue);

        for (let c = 0; c < 9; c++) {
            if (c !== col) {
                const cellData = this.cells[row][c];
                const isConflict = conflicts.some(conf => conf.row === row && conf.col === c);
                cellData.element.style.background = isConflict ? 
                    SUDOKU_COLORS.HIGHLIGHT_CONFLICT : SUDOKU_COLORS.HIGHLIGHT_ROW_COL;
                if (isConflict) {
                    cellData.numberDisplay.style.color = SUDOKU_COLORS.CELL_ERROR;
                }
            }
        }

        for (let r = 0; r < 9; r++) {
            if (r !== row) {
                const cellData = this.cells[r][col];
                const isConflict = conflicts.some(conf => conf.row === r && conf.col === col);
                if (cellData.element.style.background !== SUDOKU_COLORS.HIGHLIGHT_CONFLICT) {
                    cellData.element.style.background = isConflict ? 
                        SUDOKU_COLORS.HIGHLIGHT_CONFLICT : SUDOKU_COLORS.HIGHLIGHT_ROW_COL;
                }
                if (isConflict) {
                    cellData.numberDisplay.style.color = SUDOKU_COLORS.CELL_ERROR;
                }
            }
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r !== row || c !== col) {
                    const cellData = this.cells[r][c];
                    const isConflict = conflicts.some(conf => conf.row === r && conf.col === c);
                    if (cellData.element.style.background !== SUDOKU_COLORS.HIGHLIGHT_ROW_COL &&
                        cellData.element.style.background !== SUDOKU_COLORS.HIGHLIGHT_CONFLICT) {
                        cellData.element.style.background = isConflict ? 
                            SUDOKU_COLORS.HIGHLIGHT_CONFLICT : SUDOKU_COLORS.HIGHLIGHT_BOX;
                    }
                    if (isConflict) {
                        cellData.numberDisplay.style.color = SUDOKU_COLORS.CELL_ERROR;
                    }
                }
            }
        }

        if (selectedValue !== 0) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (this.board[r][c] === selectedValue) {
                        const cellData = this.cells[r][c];
                        if (r !== row || c !== col) {
                            cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_SAME_NUMBER;
                        }
                    }
                }
            }
        }
    }

    findConflicts(row, col, value) {
        const conflicts = [];
        if (value === 0) return conflicts;

        for (let c = 0; c < 9; c++) {
            if (c !== col && this.board[row][c] === value) {
                conflicts.push({ row, col: c });
            }
        }

        for (let r = 0; r < 9; r++) {
            if (r !== row && this.board[r][col] === value) {
                conflicts.push({ row: r, col });
            }
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && this.board[r][c] === value) {
                    if (!conflicts.some(conf => conf.row === r && conf.col === c)) {
                        conflicts.push({ row: r, col: c });
                    }
                }
            }
        }

        return conflicts;
    }

    inputNumber(num) {
        if (!this.selectedCell || this.isComplete) return;
        
        const { row, col } = this.selectedCell;
        
        if (this.initialBoard[row][col] !== 0) {
            return;
        }

        if (this.isNoteMode) {
            this.history.push({
                row,
                col,
                previousValue: this.board[row][col],
                previousNotes: new Set(this.notes[row][col]),
                isNoteChange: true
            });

            if (this.notes[row][col].has(num)) {
                this.notes[row][col].delete(num);
            } else {
                this.notes[row][col].add(num);
            }
            this.updateCellDisplay(row, col);
            this.audioManager.playSound('hit', { pitch: 0.9, volume: 0.3 });
        } else {
            const previousValue = this.board[row][col];
            
            this.history.push({
                row,
                col,
                previousValue: previousValue,
                previousNotes: new Set(this.notes[row][col])
            });

            this.board[row][col] = num;
            this.notes[row][col].clear();
            
            this.removeNoteFromRelated(row, col, num);
            
            if (num === this.solution[row][col]) {
                this.correctInput(row, col, num);
            } else {
                this.wrongInput(row, col, num, previousValue);
            }
            
            this.updateCellDisplay(row, col);
            this.updateNumberCounts();
            this.checkCompletion();
        }
        
        if (this.selectedCell) {
            this.clearHighlights();
            this.applyHighlights(this.selectedCell.row, this.selectedCell.col);
            const cellData = this.cells[this.selectedCell.row][this.selectedCell.col];
            cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_SELECTED;
            cellData.element.style.transform = 'scale(1.05)';
            cellData.element.style.boxShadow = `0 0 15px ${SUDOKU_COLORS.ACCENT_BLUE}`;
            cellData.element.style.zIndex = '10';
        }
    }

    removeNoteFromRelated(row, col, num) {
        for (let c = 0; c < 9; c++) {
            if (this.notes[row][c].has(num)) {
                this.notes[row][c].delete(num);
                this.updateCellDisplay(row, c);
            }
        }
        
        for (let r = 0; r < 9; r++) {
            if (this.notes[r][col].has(num)) {
                this.notes[r][col].delete(num);
                this.updateCellDisplay(r, col);
            }
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.notes[r][c].has(num)) {
                    this.notes[r][c].delete(num);
                    this.updateCellDisplay(r, c);
                }
            }
        }
    }

    correctInput(row, col, num) {
        const cellData = this.cells[row][col];
        
        cellData.numberDisplay.style.animation = 'none';
        cellData.numberDisplay.offsetHeight;
        cellData.numberDisplay.style.animation = 'sudoku-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        cellData.element.style.animation = 'none';
        cellData.element.offsetHeight;
        cellData.element.style.animation = 'note-pulse 0.5s ease-out';
        
        this.updateScore(this.score + 10);
        this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
    }

    wrongInput(row, col, num, previousValue) {
        const cellData = this.cells[row][col];
        
        cellData.element.style.animation = 'none';
        cellData.element.offsetHeight;
        cellData.element.style.animation = 'sudoku-shake 0.5s ease-in-out, sudoku-error-flash 0.6s ease-in-out';
        
        cellData.numberDisplay.style.color = SUDOKU_COLORS.CELL_ERROR;
        
        this.mistakes++;
        this.updateMistakesDisplay();
        
        this.audioManager.playSound('miss', { pitch: 0.7, volume: 0.5 });
        this.triggerShake(15, 200);
        
        setTimeout(() => {
            this.board[row][col] = previousValue;
            this.updateCellDisplay(row, col);
            if (this.selectedCell) {
                this.clearHighlights();
                this.applyHighlights(this.selectedCell.row, this.selectedCell.col);
            }
        }, 600);
        
        if (this.mistakes >= this.maxMistakes) {
            this.gameOver();
        }
    }

    toggleNoteMode() {
        this.isNoteMode = !this.isNoteMode;
        this.updateNoteModeButton();
        this.audioManager.playSound('hit', { pitch: this.isNoteMode ? 1.1 : 0.9, volume: 0.3 });
    }

    updateNoteModeButton() {
        const btn = document.getElementById('note-mode-btn');
        const statusEl = btn.querySelector('.note-status');
        if (btn) {
            if (this.isNoteMode) {
                btn.style.background = `linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_PURPLE}, ${SUDOKU_COLORS.ACCENT_PINK})`;
                btn.style.boxShadow = `0 6px 20px rgba(192, 132, 252, 0.4)`;
                btn.style.borderColor = SUDOKU_COLORS.ACCENT_PURPLE;
                if (statusEl) {
                    statusEl.textContent = 'ON';
                    statusEl.style.color = SUDOKU_COLORS.ACCENT_GREEN;
                    statusEl.style.opacity = '1';
                    statusEl.style.animation = 'note-pulse 1s ease infinite';
                }
                btn.style.animation = 'none';
                btn.offsetHeight;
                btn.style.animation = 'note-toggle 0.3s ease';
            } else {
                btn.style.background = SUDOKU_COLORS.GLASS_BG;
                btn.style.boxShadow = 'none';
                btn.style.borderColor = SUDOKU_COLORS.GLASS_BORDER;
                if (statusEl) {
                    statusEl.textContent = 'OFF';
                    statusEl.style.color = SUDOKU_COLORS.TEXT_MUTED;
                    statusEl.style.opacity = '0.6';
                    statusEl.style.animation = 'none';
                }
            }
        }
    }

    eraseCell() {
        if (!this.selectedCell || this.isComplete) return;
        
        const { row, col } = this.selectedCell;
        
        if (this.initialBoard[row][col] !== 0) return;
        
        this.history.push({
            row,
            col,
            previousValue: this.board[row][col],
            previousNotes: new Set(this.notes[row][col])
        });
        
        this.board[row][col] = 0;
        this.notes[row][col].clear();
        this.updateCellDisplay(row, col);
        this.updateNumberCounts();
        
        this.audioManager.playSound('hit', { pitch: 0.7, volume: 0.3 });
    }

    undo() {
        if (!this.history || this.history.length === 0) return;
        
        const lastMove = this.history.pop();
        const { row, col, previousValue, previousNotes } = lastMove;
        
        this.board[row][col] = previousValue;
        this.notes[row][col] = previousNotes;
        this.updateCellDisplay(row, col);
        this.updateNumberCounts();
        
        if (this.selectedCell) {
            this.clearHighlights();
            this.applyHighlights(this.selectedCell.row, this.selectedCell.col);
        }
        
        this.audioManager.playSound('hit', { pitch: 0.6, volume: 0.3 });
    }

    showHint() {
        if (this.isComplete) return;
        
        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0 && this.initialBoard[r][c] === 0) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }
        
        if (emptyCells.length === 0) return;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const correctValue = this.solution[randomCell.row][randomCell.col];
        
        this.history.push({
            row: randomCell.row,
            col: randomCell.col,
            previousValue: this.board[randomCell.row][randomCell.col],
            previousNotes: new Set(this.notes[randomCell.row][randomCell.col])
        });
        
        this.board[randomCell.row][randomCell.col] = correctValue;
        this.notes[randomCell.row][randomCell.col].clear();
        
        this.removeNoteFromRelated(randomCell.row, randomCell.col, correctValue);
        
        this.selectCell(randomCell.row, randomCell.col);
        this.correctInput(randomCell.row, randomCell.col, correctValue);
        this.updateCellDisplay(randomCell.row, randomCell.col);
        this.updateNumberCounts();
        this.checkCompletion();
    }

    showNewGameMenu() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startNewGame(this.currentDifficulty);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('sudoku-timer');
        if (timerEl) {
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            timerEl.innerHTML = `<span style="color: ${SUDOKU_COLORS.ACCENT_BLUE};">⏱️</span> ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateNumberCounts() {
        this.numberCounts = {};
        for (let num = 1; num <= 9; num++) {
            this.numberCounts[num] = 0;
        }
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = this.board[r][c];
                if (val > 0) {
                    this.numberCounts[val]++;
                }
            }
        }

        const countElements = document.querySelectorAll('.number-count');
        countElements.forEach(el => {
            const num = parseInt(el.dataset.num);
            const remaining = 9 - this.numberCounts[num];
            const countValue = el.querySelector('.count-value');
            const countNumber = el.querySelector('.count-number');
            
            countValue.textContent = remaining;
            
            if (remaining === 0) {
                el.style.background = 'rgba(74, 222, 128, 0.15)';
                el.style.border = '1px solid rgba(74, 222, 128, 0.5)';
                countValue.style.color = SUDOKU_COLORS.ACCENT_GREEN;
                countNumber.style.opacity = '0.5';
            } else if (remaining < 3) {
                el.style.background = 'rgba(251, 191, 36, 0.15)';
                el.style.border = '1px solid rgba(251, 191, 36, 0.5)';
                countValue.style.color = SUDOKU_COLORS.ACCENT_YELLOW;
                countNumber.style.opacity = '1';
            } else {
                el.style.background = 'transparent';
                el.style.border = '1px solid transparent';
                countValue.style.color = SUDOKU_COLORS.TEXT_SECONDARY;
                countNumber.style.opacity = '1';
            }
        });
    }

    updateMistakesDisplay() {
        const dots = document.querySelectorAll('.mistake-dot');
        dots.forEach((dot, index) => {
            if (index < this.mistakes) {
                dot.style.background = SUDOKU_COLORS.ACCENT_RED;
                dot.style.transform = 'scale(1.3)';
                dot.style.borderColor = SUDOKU_COLORS.ACCENT_RED;
                dot.style.boxShadow = `0 0 10px ${SUDOKU_COLORS.ACCENT_RED}`;
            } else {
                dot.style.background = SUDOKU_COLORS.ACCENT_GREEN;
                dot.style.transform = 'scale(1)';
                dot.style.borderColor = SUDOKU_COLORS.TEXT_MUTED;
                dot.style.boxShadow = 'none';
            }
        });
    }

    checkCompletion() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] !== this.solution[r][c]) {
                    return;
                }
            }
        }
        
        this.isComplete = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.showVictoryScreen();
    }

    showVictoryScreen() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
        
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
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
        card.className = 'victory-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${SUDOKU_COLORS.DARK_BG}, rgba(30, 30, 60, 0.95));
            border: 3px solid ${SUDOKU_COLORS.ACCENT_GREEN};
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            animation: sudoku-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 60px rgba(74, 222, 128, 0.3);
        `;
        
        card.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 15px; animation: sudoku-bounce 1s ease infinite;">🎉</div>
            <h2 style="font-size: 2rem; font-weight: 800; color: ${SUDOKU_COLORS.ACCENT_GREEN}; margin-bottom: 8px;">恭喜完成！</h2>
            <p style="color: ${SUDOKU_COLORS.TEXT_SECONDARY}; margin-bottom: 25px; font-size: 1rem; line-height: 1.6;">
                难度: <span style="color: ${SUDOKU_COLORS.ACCENT_BLUE}; font-weight: 700;">${SUDOKU_DIFFICULTY[this.currentDifficulty].name}</span><br>
                用时: <span style="color: ${SUDOKU_COLORS.ACCENT_PURPLE}; font-weight: 700;">${timeStr}</span><br>
                错误: <span style="color: ${SUDOKU_COLORS.TEXT_PRIMARY}; font-weight: 700;">${this.mistakes}/${this.maxMistakes}</span>
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="victory-btn" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_GREEN}, ${SUDOKU_COLORS.ACCENT_BLUE});
                    border: none;
                    color: white;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">再来一局</button>
                <button class="victory-btn exit" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${SUDOKU_COLORS.GLASS_BG};
                    border: 2px solid ${SUDOKU_COLORS.GLASS_BORDER};
                    color: ${SUDOKU_COLORS.TEXT_PRIMARY};
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">返回主页</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        const buttons = card.querySelectorAll('.victory-btn');
        buttons[0].addEventListener('click', () => {
            overlay.remove();
            this.startNewGame(this.currentDifficulty);
        });
        
        buttons[1].addEventListener('click', () => {
            overlay.remove();
            this.context.gameManager.exitGame();
        });
        
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-3px) scale(1.05)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.audioManager.playSound('combo', { pitch: 1 + i * 0.2, volume: 0.5 });
            }, i * 150);
        }
    }

    gameOver() {
        this.isComplete = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'gameover-overlay';
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
        card.className = 'gameover-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${SUDOKU_COLORS.DARK_BG}, rgba(30, 30, 60, 0.95));
            border: 3px solid ${SUDOKU_COLORS.ACCENT_RED};
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            animation: sudoku-shake 0.5s ease-in-out;
            box-shadow: 0 25px 60px rgba(248, 113, 113, 0.3);
        `;
        
        card.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 15px;">😔</div>
            <h2 style="font-size: 2rem; font-weight: 800; color: ${SUDOKU_COLORS.ACCENT_RED}; margin-bottom: 8px;">游戏结束</h2>
            <p style="color: ${SUDOKU_COLORS.TEXT_SECONDARY}; margin-bottom: 25px; font-size: 1rem; line-height: 1.6;">
                错误次数已达上限<br>
                再接再厉！
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="gameover-btn" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_BLUE}, ${SUDOKU_COLORS.ACCENT_PURPLE});
                    border: none;
                    color: white;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">重新开始</button>
                <button class="gameover-btn exit" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${SUDOKU_COLORS.GLASS_BG};
                    border: 2px solid ${SUDOKU_COLORS.GLASS_BORDER};
                    color: ${SUDOKU_COLORS.TEXT_PRIMARY};
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">返回主页</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        const buttons = card.querySelectorAll('.gameover-btn');
        buttons[0].addEventListener('click', () => {
            overlay.remove();
            this.startNewGame(this.currentDifficulty);
        });
        
        buttons[1].addEventListener('click', () => {
            overlay.remove();
            this.context.gameManager.exitGame();
        });
        
        this.audioManager.playSound('miss', { pitch: 0.5, volume: 0.6 });
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.restorePlatformHeaderInfo();
    }

    render(deltaTime) {
    }

    handleInput(eventType, event) {
        if (eventType === 'keydown') {
            const num = parseInt(event.key);
            if (num >= 1 && num <= 9) {
                event.preventDefault();
                this.inputNumber(num);
            } else if (event.key === 'Backspace' || event.key === 'Delete') {
                event.preventDefault();
                this.eraseCell();
            } else if (event.key === 'n' || event.key === 'N') {
                this.toggleNoteMode();
            } else if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                this.undo();
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                this.navigateWithKeyboard(event.key);
            }
        }
    }

    navigateWithKeyboard(key) {
        if (!this.selectedCell) {
            this.selectCell(4, 4);
            return;
        }
        
        let { row, col } = this.selectedCell;
        
        switch (key) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(8, col + 1);
                break;
        }
        
        this.selectCell(row, col);
    }
}
