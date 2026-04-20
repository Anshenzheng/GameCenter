/**
 * 数独游戏 - Sudoku Game
 * 深色毛玻璃风格，Q弹动效
 */

// ==========================================
// 数独配色配置
// ==========================================
const SUDOKU_COLORS = {
    DARK_BG: '#0f0f23',
    DARKER_BG: '#070714',
    GLASS_BG: 'rgba(20, 20, 40, 0.7)',
    GLASS_BORDER: 'rgba(255, 255, 255, 0.1)',
    ACCENT_BLUE: '#6366f1',
    ACCENT_PURPLE: '#a855f7',
    ACCENT_PINK: '#ec4899',
    ACCENT_GREEN: '#10b981',
    ACCENT_RED: '#ef4444',
    ACCENT_YELLOW: '#f59e0b',
    TEXT_PRIMARY: '#f1f5f9',
    TEXT_SECONDARY: '#94a3b8',
    TEXT_MUTED: '#64748b',
    CELL_FIXED: '#e2e8f0',
    CELL_USER: '#6366f1',
    CELL_ERROR: '#ef4444',
    CELL_NOTE: '#64748b',
    HIGHLIGHT_ROW_COL: 'rgba(99, 102, 241, 0.15)',
    HIGHLIGHT_BOX: 'rgba(168, 85, 247, 0.12)',
    HIGHLIGHT_SELECTED: 'rgba(99, 102, 241, 0.3)',
    HIGHLIGHT_SAME_NUMBER: 'rgba(16, 185, 129, 0.25)',
};

// 数独难度配置
const SUDOKU_DIFFICULTY = {
    easy: { name: '简单', cellsToRemove: 35, label: '☀️' },
    medium: { name: '中等', cellsToRemove: 45, label: '🌤️' },
    hard: { name: '困难', cellsToRemove: 52, label: '🌙' }
};

// ==========================================
// 数独求解器和生成器
// ==========================================
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
        
        return {
            puzzle: puzzle,
            solution: fullBoard,
            difficulty: difficulty
        };
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

// ==========================================
// 数独游戏主类
// ==========================================
class SudokuGame extends GameInterface {
    static get metadata() {
        return {
            id: 'sudoku',
            name: '数独',
            description: '经典数独游戏，三种难度，支持笔记模式！深色毛玻璃风格，Q弹动效。',
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
        this.selectedNumber = null;
        this.isNoteMode = false;
        this.currentDifficulty = 'medium';
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.isComplete = false;
        this.isPaused = false;
        
        this.gameContainer = null;
        this.boardElement = null;
        this.cells = [];
        this.numberPad = null;
        
        this.audioManager = new AudioManager();
    }

    init() {
        this.createGameUI();
        this.audioManager.init();
        this.startNewGame(this.currentDifficulty);
        console.log('数独游戏已初始化');
    }

    createGameUI() {
        this.canvas.innerHTML = '';
        this.canvas.style.cssText = `
            background: linear-gradient(135deg, ${SUDOKU_COLORS.DARK_BG} 0%, ${SUDOKU_COLORS.DARKER_BG} 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow: auto;
        `;

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'sudoku-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            width: 100%;
            max-width: 500px;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        `;

        this.createHeader();
        this.createControlBar();
        this.createBoard();
        this.createNumberPad();
        this.createDifficultySelector();

        this.canvas.appendChild(this.gameContainer);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'sudoku-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 15px 20px;
            background: ${SUDOKU_COLORS.GLASS_BG};
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
            border-radius: 16px;
        `;

        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'sudoku-timer';
        timerDisplay.id = 'sudoku-timer';
        timerDisplay.style.cssText = `
            font-size: 1.5rem;
            font-weight: 700;
            color: ${SUDOKU_COLORS.TEXT_PRIMARY};
            font-variant-numeric: tabular-nums;
        `;
        timerDisplay.textContent = '00:00';

        const mistakesDisplay = document.createElement('div');
        mistakesDisplay.className = 'sudoku-mistakes';
        mistakesDisplay.id = 'sudoku-mistakes';
        mistakesDisplay.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
        `;
        mistakesDisplay.innerHTML = `
            <span style="color: ${SUDOKU_COLORS.TEXT_SECONDARY}; font-size: 0.9rem;">错误:</span>
            <div class="mistakes-dots" style="display: flex; gap: 6px;">
                ${Array(this.maxMistakes).fill(0).map((_, i) => `
                    <div class="mistake-dot" data-index="${i}" style="
                        width: 14px;
                        height: 14px;
                        border-radius: 50%;
                        background: ${SUDOKU_COLORS.ACCENT_GREEN};
                        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    "></div>
                `).join('')}
            </div>
        `;

        header.appendChild(timerDisplay);
        header.appendChild(mistakesDisplay);
        this.gameContainer.appendChild(header);
    }

    createControlBar() {
        const controlBar = document.createElement('div');
        controlBar.className = 'sudoku-controls';
        controlBar.style.cssText = `
            display: flex;
            gap: 10px;
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
        `;

        const buttons = [
            { id: 'note-mode-btn', text: '✏️ 笔记', action: () => this.toggleNoteMode() },
            { id: 'undo-btn', text: '↩️ 撤销', action: () => this.undo() },
            { id: 'erase-btn', text: '🗑️ 擦除', action: () => this.eraseCell() },
            { id: 'hint-btn', text: '💡 提示', action: () => this.showHint() },
            { id: 'new-game-btn', text: '🔄 新游戏', action: () => this.showNewGameMenu() }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.className = 'sudoku-btn';
            button.textContent = btn.text;
            button.style.cssText = `
                padding: 10px 16px;
                font-size: 0.9rem;
                font-weight: 600;
                background: ${SUDOKU_COLORS.GLASS_BG};
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
                color: ${SUDOKU_COLORS.TEXT_PRIMARY};
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            button.addEventListener('click', btn.action);
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px) scale(1.05)';
                button.style.background = SUDOKU_COLORS.ACCENT_BLUE;
                button.style.boxShadow = `0 8px 25px rgba(99, 102, 241, 0.4)`;
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
                button.style.background = SUDOKU_COLORS.GLASS_BG;
                button.style.boxShadow = 'none';
            });
            button.addEventListener('mousedown', () => {
                button.style.transform = 'translateY(0) scale(0.98)';
            });
            button.addEventListener('mouseup', () => {
                button.style.transform = 'translateY(-2px) scale(1.05)';
            });

            controlBar.appendChild(button);
        });

        this.gameContainer.appendChild(controlBar);
    }

    createBoard() {
        const boardContainer = document.createElement('div');
        boardContainer.className = 'sudoku-board-container';
        boardContainer.style.cssText = `
            position: relative;
            padding: 4px;
            background: ${SUDOKU_COLORS.GLASS_BG};
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 2px solid ${SUDOKU_COLORS.GLASS_BORDER};
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        `;

        this.boardElement = document.createElement('div');
        this.boardElement.className = 'sudoku-board';
        this.boardElement.style.cssText = `
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 1px;
            background: ${SUDOKU_COLORS.TEXT_SECONDARY};
            padding: 2px;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
        `;

        this.cells = [];
        for (let row = 0; row < 9; row++) {
            this.cells[row] = [];
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const isRightBorder = col % 3 === 2 && col !== 8;
                const isBottomBorder = row % 3 === 2 && row !== 8;
                
                cell.style.cssText = `
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: ${SUDOKU_COLORS.DARK_BG};
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    ${isRightBorder ? `border-right: 3px solid ${SUDOKU_COLORS.TEXT_PRIMARY};` : ''}
                    ${isBottomBorder ? `border-bottom: 3px solid ${SUDOKU_COLORS.TEXT_PRIMARY};` : ''}
                `;

                const numberDisplay = document.createElement('span');
                numberDisplay.className = 'cell-number';
                numberDisplay.style.cssText = `
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: ${SUDOKU_COLORS.CELL_FIXED};
                    transition: all 0.3s ease;
                    user-select: none;
                `;
                cell.appendChild(numberDisplay);

                const notesContainer = document.createElement('div');
                notesContainer.className = 'cell-notes';
                notesContainer.style.cssText = `
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    right: 2px;
                    bottom: 2px;
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
                        font-size: 0.55rem;
                        color: ${SUDOKU_COLORS.CELL_NOTE};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 500;
                        opacity: 0;
                        transition: all 0.2s ease;
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

        boardContainer.appendChild(this.boardElement);
        this.gameContainer.appendChild(boardContainer);
    }

    createNumberPad() {
        const padContainer = document.createElement('div');
        padContainer.className = 'sudoku-numpad';
        padContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            width: 100%;
        `;

        this.numberPad = [];
        for (let i = 1; i <= 9; i++) {
            const btn = this.createNumberButton(i);
            padContainer.appendChild(btn);
            this.numberPad.push(btn);
        }

        this.gameContainer.appendChild(padContainer);
    }

    createNumberButton(num) {
        const btn = document.createElement('button');
        btn.className = 'numpad-btn';
        btn.dataset.num = num;
        btn.textContent = num;
        btn.style.cssText = `
            padding: 16px;
            font-size: 1.4rem;
            font-weight: 700;
            background: ${SUDOKU_COLORS.GLASS_BG};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
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
            btn.style.transform = 'translateY(-3px) scale(1.08)';
            btn.style.background = `linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_BLUE}, ${SUDOKU_COLORS.ACCENT_PURPLE})`;
            btn.style.boxShadow = `0 10px 30px rgba(99, 102, 241, 0.4)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0) scale(1)';
            btn.style.background = SUDOKU_COLORS.GLASS_BG;
            btn.style.boxShadow = 'none';
        });

        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'translateY(0) scale(0.95)';
        });

        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'translateY(-3px) scale(1.08)';
        });

        return btn;
    }

    createDifficultySelector() {
        const selector = document.createElement('div');
        selector.className = 'difficulty-selector';
        selector.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 10px;
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
                background: ${key === this.currentDifficulty ? SUDOKU_COLORS.ACCENT_BLUE : SUDOKU_COLORS.GLASS_BG};
                border: 1px solid ${key === this.currentDifficulty ? SUDOKU_COLORS.ACCENT_BLUE : SUDOKU_COLORS.GLASS_BORDER};
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
            btn.style.background = isActive ? SUDOKU_COLORS.ACCENT_BLUE : SUDOKU_COLORS.GLASS_BG;
            btn.style.borderColor = isActive ? SUDOKU_COLORS.ACCENT_BLUE : SUDOKU_COLORS.GLASS_BORDER;
        });
    }

    startNewGame(difficulty) {
        this.isComplete = false;
        this.mistakes = 0;
        this.timer = 0;
        this.selectedCell = null;
        this.selectedNumber = null;
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
        this.selectedNumber = this.board[row][col];
        this.clearHighlights();
        this.applyHighlights(row, col);
        
        const cellData = this.cells[row][col];
        cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_SELECTED;
        cellData.element.style.transform = 'scale(1.05)';
        
        this.audioManager.playSound('hit', { pitch: 0.8, volume: 0.3 });
    }

    clearHighlights() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cellData = this.cells[row][col];
                cellData.element.style.background = SUDOKU_COLORS.DARK_BG;
                cellData.element.style.transform = 'scale(1)';
            }
        }
    }

    applyHighlights(row, col) {
        const selectedValue = this.board[row][col];
        
        for (let c = 0; c < 9; c++) {
            if (c !== col) {
                const cellData = this.cells[row][c];
                cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_ROW_COL;
            }
        }
        
        for (let r = 0; r < 9; r++) {
            if (r !== row) {
                const cellData = this.cells[r][col];
                cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_ROW_COL;
            }
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r !== row && c !== col) {
                    const cellData = this.cells[r][c];
                    if (cellData.element.style.background !== SUDOKU_COLORS.HIGHLIGHT_ROW_COL) {
                        cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_BOX;
                    }
                }
            }
        }
        
        if (selectedValue !== 0) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (this.board[r][c] === selectedValue) {
                        const cellData = this.cells[r][c];
                        cellData.element.style.background = SUDOKU_COLORS.HIGHLIGHT_SAME_NUMBER;
                    }
                }
            }
        }
    }

    inputNumber(num) {
        if (!this.selectedCell || this.isComplete) return;
        
        const { row, col } = this.selectedCell;
        
        if (this.initialBoard[row][col] !== 0) {
            return;
        }

        this.history.push({
            row,
            col,
            previousValue: this.board[row][col],
            previousNotes: new Set(this.notes[row][col])
        });

        if (this.isNoteMode) {
            if (this.board[row][col] === 0) {
                if (this.notes[row][col].has(num)) {
                    this.notes[row][col].delete(num);
                } else {
                    this.notes[row][col].add(num);
                }
                this.removeNoteFromRelated(row, col, num);
                this.updateCellDisplay(row, col);
                this.audioManager.playSound('hit', { pitch: 0.9, volume: 0.3 });
            }
        } else {
            const previousValue = this.board[row][col];
            this.board[row][col] = num;
            this.notes[row][col].clear();
            
            this.removeNoteFromRelated(row, col, num);
            
            if (num === this.solution[row][col]) {
                this.correctInput(row, col, num);
            } else {
                this.wrongInput(row, col, num, previousValue);
            }
            
            this.updateCellDisplay(row, col);
            this.checkCompletion();
        }
        
        if (this.selectedCell) {
            this.applyHighlights(this.selectedCell.row, this.selectedCell.col);
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
        cellData.element.style.animation = 'sudoku-pulse 0.5s ease-out';
        
        this.updateScore(this.score + 10);
        this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
    }

    wrongInput(row, col, num, previousValue) {
        const cellData = this.cells[row][col];
        
        cellData.numberDisplay.style.color = SUDOKU_COLORS.CELL_ERROR;
        
        cellData.element.style.animation = 'none';
        cellData.element.offsetHeight;
        cellData.element.style.animation = 'sudoku-shake 0.5s ease-in-out';
        
        cellData.numberDisplay.style.animation = 'none';
        cellData.numberDisplay.offsetHeight;
        cellData.numberDisplay.style.animation = 'sudoku-flash-red 0.6s ease-in-out';
        
        this.mistakes++;
        this.updateMistakesDisplay();
        
        this.audioManager.playSound('miss', { pitch: 0.7, volume: 0.5 });
        this.triggerShake(15, 200);
        
        setTimeout(() => {
            this.board[row][col] = previousValue;
            this.updateCellDisplay(row, col);
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
        if (btn) {
            if (this.isNoteMode) {
                btn.style.background = `linear-gradient(135deg, ${SUDOKU_COLORS.ACCENT_PURPLE}, ${SUDOKU_COLORS.ACCENT_PINK})`;
                btn.style.boxShadow = `0 8px 25px rgba(168, 85, 247, 0.4)`;
            } else {
                btn.style.background = SUDOKU_COLORS.GLASS_BG;
                btn.style.boxShadow = 'none';
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
        
        this.audioManager.playSound('hit', { pitch: 0.7, volume: 0.3 });
    }

    undo() {
        if (!this.history || this.history.length === 0) return;
        
        const lastMove = this.history.pop();
        const { row, col, previousValue, previousNotes } = lastMove;
        
        this.board[row][col] = previousValue;
        this.notes[row][col] = previousNotes;
        this.updateCellDisplay(row, col);
        
        if (this.selectedCell) {
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
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateMistakesDisplay() {
        const dots = document.querySelectorAll('.mistake-dot');
        dots.forEach((dot, index) => {
            if (index < this.mistakes) {
                dot.style.background = SUDOKU_COLORS.ACCENT_RED;
                dot.style.transform = 'scale(1.3)';
            } else {
                dot.style.background = SUDOKU_COLORS.ACCENT_GREEN;
                dot.style.transform = 'scale(1)';
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
        const timeStr = `${minutes}分${seconds}秒`;
        
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
        `;
        
        const card = document.createElement('div');
        card.className = 'victory-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${SUDOKU_COLORS.DARK_BG}, ${SUDOKU_COLORS.GLASS_BG});
            border: 2px solid ${SUDOKU_COLORS.ACCENT_GREEN};
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            animation: sudoku-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 50px rgba(16, 185, 129, 0.3);
        `;
        
        card.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px; animation: sudoku-bounce 1s ease infinite;">🎉</div>
            <h2 style="font-size: 2rem; font-weight: 800; color: ${SUDOKU_COLORS.ACCENT_GREEN}; margin-bottom: 10px;">恭喜完成！</h2>
            <p style="color: ${SUDOKU_COLORS.TEXT_SECONDARY}; margin-bottom: 30px; font-size: 1.1rem;">
                难度: ${SUDOKU_DIFFICULTY[this.currentDifficulty].name}<br>
                用时: ${timeStr}<br>
                错误: ${this.mistakes}/${this.maxMistakes}
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="victory-btn" style="
                    padding: 15px 30px;
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
                    padding: 15px 30px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${SUDOKU_COLORS.GLASS_BG};
                    border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
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
            -webkit-backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
        `;
        
        const card = document.createElement('div');
        card.className = 'gameover-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${SUDOKU_COLORS.DARK_BG}, ${SUDOKU_COLORS.GLASS_BG});
            border: 2px solid ${SUDOKU_COLORS.ACCENT_RED};
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            animation: sudoku-shake 0.5s ease-in-out;
            box-shadow: 0 25px 50px rgba(239, 68, 68, 0.3);
        `;
        
        card.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 20px;">😔</div>
            <h2 style="font-size: 2rem; font-weight: 800; color: ${SUDOKU_COLORS.ACCENT_RED}; margin-bottom: 10px;">游戏结束</h2>
            <p style="color: ${SUDOKU_COLORS.TEXT_SECONDARY}; margin-bottom: 30px; font-size: 1.1rem;">
                错误次数已达上限<br>
                再接再厉！
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="gameover-btn" style="
                    padding: 15px 30px;
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
                    padding: 15px 30px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${SUDOKU_COLORS.GLASS_BG};
                    border: 1px solid ${SUDOKU_COLORS.GLASS_BORDER};
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
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
                       event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
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

const style = document.createElement('style');
style.textContent = `
    @keyframes sudoku-pop-in {
        0% { transform: scale(0.5); opacity: 0; }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes sudoku-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.08); }
        100% { transform: scale(1); }
    }
    
    @keyframes sudoku-shake {
        0%, 100% { transform: translateX(0); }
        10% { transform: translateX(-8px) rotate(-1deg); }
        20% { transform: translateX(8px) rotate(1deg); }
        30% { transform: translateX(-6px) rotate(-0.5deg); }
        40% { transform: translateX(6px) rotate(0.5deg); }
        50% { transform: translateX(-4px); }
        60% { transform: translateX(4px); }
        70% { transform: translateX(-2px); }
        80% { transform: translateX(2px); }
    }
    
    @keyframes sudoku-flash-red {
        0%, 100% { color: ${SUDOKU_COLORS.CELL_ERROR}; }
        25% { color: ${SUDOKU_COLORS.ACCENT_RED}; background: rgba(239, 68, 68, 0.3); }
        50% { color: ${SUDOKU_COLORS.CELL_ERROR}; }
        75% { color: ${SUDOKU_COLORS.ACCENT_RED}; background: rgba(239, 68, 68, 0.3); }
    }
    
    @keyframes sudoku-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .sudoku-cell:hover {
        background: rgba(99, 102, 241, 0.2) !important;
        transform: scale(1.02);
    }
    
    .numpad-btn:active {
        transform: translateY(0) scale(0.95) !important;
    }
    
    .sudoku-btn:active {
        transform: translateY(0) scale(0.98) !important;
    }
`;
document.head.appendChild(style);
