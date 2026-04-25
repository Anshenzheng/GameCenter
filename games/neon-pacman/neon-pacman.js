/**
 * 霓虹赛博复古吃豆子游戏 - Neon Cyber Pacman Game
 * 霓虹赛博复古风格，经典吃豆子玩法，多关卡系统
 */

const NEON_PACMAN_COLORS = {
    DARK_BACKGROUND: '#0a0a1a',
    NEON_PINK: '#ff00ff',
    NEON_CYAN: '#00ffff',
    NEON_GREEN: '#39ff14',
    NEON_YELLOW: '#ffff00',
    NEON_ORANGE: '#ff6600',
    NEON_PURPLE: '#9932cc',
    NEON_BLUE: '#0066ff',
    NEON_RED: '#ff0040',
    PACMAN_YELLOW: '#ffff00',
    GHOST_RED: '#ff0040',
    GHOST_PINK: '#ffb8ff',
    GHOST_CYAN: '#00ffff',
    GHOST_ORANGE: '#ffb852',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a0a0a0',
    GRID_COLOR: 'rgba(255, 255, 255, 0.05)',
    WALL_COLOR: '#1a1a3a'
};

const CELL_SIZE = 24;
const COLS = 21;
const ROWS = 22;

const TILE = {
    EMPTY: 0,
    WALL: 1,
    DOT: 2,
    POWER_PELLET: 3,
    GHOST_HOUSE: 4,
    GHOST_DOOR: 5
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    NONE: { x: 0, y: 0 }
};

const LEVEL_CONFIGS = [
    { level: 1, ghostSpeed: 1.0, dotDensity: 1.0, ghostCount: 4 },
    { level: 2, ghostSpeed: 1.2, dotDensity: 1.0, ghostCount: 4 },
    { level: 3, ghostSpeed: 1.4, dotDensity: 1.1, ghostCount: 4 },
    { level: 4, ghostSpeed: 1.6, dotDensity: 1.1, ghostCount: 4 },
    { level: 5, ghostSpeed: 1.8, dotDensity: 1.2, ghostCount: 4 },
    { level: 6, ghostSpeed: 2.0, dotDensity: 1.2, ghostCount: 4 }
];

const GHOST_COLORS = [
    NEON_PACMAN_COLORS.GHOST_RED,
    NEON_PACMAN_COLORS.GHOST_PINK,
    NEON_PACMAN_COLORS.GHOST_CYAN,
    NEON_PACMAN_COLORS.GHOST_ORANGE
];

function createMaze() {
    const maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
        [1,3,1,1,2,1,1,1,1,2,1,2,1,1,1,1,2,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
        [1,2,2,2,2,1,2,2,2,1,1,1,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,2,1,1,1,0,1,1,1,0,1,1,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,0,1,1,5,1,5,1,1,0,1,2,1,1,1,1],
        [0,0,0,0,2,0,0,1,4,4,4,4,4,1,0,0,2,0,0,0,0],
        [1,1,1,1,2,1,0,1,4,4,4,4,4,1,0,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
        [1,3,2,1,2,2,2,2,2,0,0,0,2,2,2,2,2,1,2,3,1],
        [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
        [1,2,2,2,2,1,2,2,2,1,1,1,2,2,2,1,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    return maze;
}

class NeonPacmanGame extends GameInterface {
    static get metadata() {
        return {
            id: 'neon-pacman',
            name: '霓虹吃豆子',
            description: '经典吃豆子游戏，霓虹赛博复古风格！用方向键控制吃豆子，躲避幽灵，收集能量豆！',
            icon: '🟡',
            colors: {
                primary: NEON_PACMAN_COLORS.NEON_YELLOW,
                secondary: NEON_PACMAN_COLORS.NEON_PINK
            }
        };
    }

    constructor(context) {
        super(context);
        this.canvas = context.canvas;
        this.gameCanvas = null;
        this.ctx = null;
        
        this.gameWidth = COLS * CELL_SIZE;
        this.gameHeight = ROWS * CELL_SIZE;
        
        this.maze = null;
        this.originalMaze = null;
        
        this.pacman = {
            x: 0,
            y: 0,
            tileX: 10,
            tileY: 15,
            direction: DIRECTIONS.RIGHT,
            nextDirection: DIRECTIONS.RIGHT,
            mouthAngle: 0,
            mouthDirection: 1,
            speed: 2.0,
            moving: false
        };
        
        this.ghosts = [];
        this.dots = 0;
        this.totalDots = 0;
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.powerModeDuration = 8000;
        
        this.lives = 3;
        this.level = 1;
        this.score = 0;
        this.highScore = 0;
        
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWaiting = false;
        this.countdownValue = 0;
        this.isLevelComplete = false;
        
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        this.audioManager = new AudioManager();
        this.particles = [];
        this.animationFrameId = null;
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        this.loadHighScore();
        console.log('霓虹吃豆子游戏已初始化');
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
            background: linear-gradient(180deg, ${NEON_PACMAN_COLORS.DARK_BACKGROUND} 0%, #0f0f2a 50%, ${NEON_PACMAN_COLORS.DARK_BACKGROUND} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: hidden;
            gap: 20px;
            position: relative;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes neon-pulse {
                0%, 100% { filter: brightness(1) drop-shadow(0 0 10px currentColor); }
                50% { filter: brightness(1.3) drop-shadow(0 0 20px currentColor); }
            }
            @keyframes powerup-float {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-5px) scale(1.05); }
            }
            @keyframes game-over-fade {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes float-up {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes glow-border {
                0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 0, 0.4), 0 0 40px rgba(255, 0, 255, 0.2); }
                50% { box-shadow: 0 0 30px rgba(255, 255, 0, 0.7), 0 0 60px rgba(255, 0, 255, 0.4); }
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            .scanline {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.1) 0px,
                    rgba(0, 0, 0, 0.1) 1px,
                    transparent 1px,
                    transparent 2px
                );
                pointer-events: none;
                z-index: 10;
            }
        `;
        document.head.appendChild(style);

        this.leftPanel = document.createElement('div');
        this.leftPanel.className = 'left-panel';
        this.leftPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 180px;
            min-width: 180px;
            flex-shrink: 0;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            z-index: 2;
            max-height: 100%;
        `;

        this.createHUD();

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'game-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            z-index: 2;
            flex-shrink: 0;
            position: relative;
        `;

        this.createGameCanvas();

        this.scanline = document.createElement('div');
        this.scanline.className = 'scanline';
        this.gameContainer.appendChild(this.scanline);

        this.rightPanel = document.createElement('div');
        this.rightPanel.className = 'right-panel';
        this.rightPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 180px;
            min-width: 180px;
            flex-shrink: 0;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            z-index: 2;
            max-height: 100%;
        `;

        this.createControls();

        this.canvas.appendChild(this.leftPanel);
        this.canvas.appendChild(this.gameContainer);
        this.canvas.appendChild(this.rightPanel);
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.className = 'neon-hud';
        hud.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px;
            background: linear-gradient(135deg, rgba(255, 255, 0, 0.1), rgba(255, 0, 255, 0.1));
            backdrop-filter: blur(15px);
            border: 2px solid ${NEON_PACMAN_COLORS.NEON_YELLOW};
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(255, 255, 0, 0.3), inset 0 0 20px rgba(255, 0, 255, 0.1);
            flex-shrink: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${NEON_PACMAN_COLORS.NEON_PINK};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${NEON_PACMAN_COLORS.NEON_YELLOW};
            margin-bottom: 2px;
            text-shadow: 0 0 10px ${NEON_PACMAN_COLORS.NEON_PINK};
        `;
        title.innerHTML = '🟡 游戏状态';
        hud.appendChild(title);

        const items = [
            { id: 'pacman-score', label: '当前分数', value: '0', icon: '🎯', color: NEON_PACMAN_COLORS.NEON_CYAN },
            { id: 'pacman-high-score', label: '最高分数', value: '0', icon: '🏆', color: NEON_PACMAN_COLORS.NEON_YELLOW },
            { id: 'pacman-lives', label: '剩余生命', value: '❤️❤️❤️', icon: '💖', color: NEON_PACMAN_COLORS.NEON_RED },
            { id: 'pacman-level', label: '当前关卡', value: '1', icon: '⭐', color: NEON_PACMAN_COLORS.NEON_GREEN },
            { id: 'pacman-dots', label: '剩余豆子', value: '0', icon: '🔵', color: NEON_PACMAN_COLORS.NEON_PINK }
        ];

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 7px 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            `;
            
            itemEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 1rem;">${item.icon}</span>
                    <span style="font-size: 0.75rem; color: ${NEON_PACMAN_COLORS.TEXT_SECONDARY}; font-weight: 600;">${item.label}</span>
                </div>
                <span id="${item.id}" style="font-size: 0.95rem; font-weight: 800; color: ${item.color}; text-shadow: 0 0 5px ${item.color};">${item.value}</span>
            `;
            
            hud.appendChild(itemEl);
        });

        this.powerModeDisplay = document.createElement('div');
        this.powerModeDisplay.id = 'power-mode-display';
        this.powerModeDisplay.style.cssText = `
            margin-top: 8px;
            padding: 8px;
            background: rgba(0, 255, 255, 0.2);
            border: 1px solid ${NEON_PACMAN_COLORS.NEON_CYAN};
            border-radius: 8px;
            display: none;
            text-align: center;
        `;
        this.powerModeDisplay.innerHTML = `
            <div style="font-size: 0.8rem; color: ${NEON_PACMAN_COLORS.NEON_CYAN}; font-weight: bold;">⚡ 能量模式！</div>
            <div id="power-mode-timer" style="font-size: 0.7rem; color: ${NEON_PACMAN_COLORS.TEXT_SECONDARY};">剩余时间: 8s</div>
        `;
        hud.appendChild(this.powerModeDisplay);

        this.leftPanel.appendChild(hud);
    }

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'controls-panel';
        controls.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            backdrop-filter: blur(15px);
            border: 2px solid ${NEON_PACMAN_COLORS.NEON_CYAN};
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(255, 0, 255, 0.1);
            flex-shrink: 0;
            min-height: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${NEON_PACMAN_COLORS.NEON_YELLOW};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${NEON_PACMAN_COLORS.NEON_CYAN};
            margin-bottom: 2px;
            text-shadow: 0 0 10px ${NEON_PACMAN_COLORS.NEON_YELLOW};
        `;
        title.innerHTML = '🎮 操作说明';
        controls.appendChild(title);

        const controlItems = [
            { keys: ['↑', '↓', '←', '→'], desc: '或 W/S/A/D 控制移动' },
            { keys: ['P'], desc: '暂停游戏' },
            { keys: ['ESC'], desc: '返回主页' }
        ];

        controlItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 8px 10px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            `;
            
            const keysDisplay = item.keys.map(k => 
                `<span style="padding: 3px 8px; background: ${NEON_PACMAN_COLORS.NEON_YELLOW}; border-radius: 5px; font-weight: 700; font-size: 0.75rem; color: ${NEON_PACMAN_COLORS.DARK_BACKGROUND}; text-shadow: 0 0 5px ${NEON_PACMAN_COLORS.NEON_YELLOW};">${k}</span>`
            ).join(' ');
            
            itemEl.innerHTML = `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">${keysDisplay}</div>
                <span style="font-size: 0.7rem; color: ${NEON_PACMAN_COLORS.TEXT_SECONDARY};">${item.desc}</span>
            `;
            
            controls.appendChild(itemEl);
        });

        const tip = document.createElement('div');
        tip.style.cssText = `
            margin-top: 8px;
            padding: 8px 10px;
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 8px;
            font-size: 0.68rem;
            color: ${NEON_PACMAN_COLORS.TEXT_SECONDARY};
            line-height: 1.4;
        `;
        tip.innerHTML = '💡 <strong>小提示：</strong>收集闪烁的能量豆可以暂时让幽灵变弱，此时可以吃掉它们获得额外分数！';
        controls.appendChild(tip);

        this.rightPanel.appendChild(controls);
    }

    createGameCanvas() {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'game-canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            padding: 10px;
            background: linear-gradient(135deg, ${NEON_PACMAN_COLORS.NEON_YELLOW}, ${NEON_PACMAN_COLORS.NEON_PINK});
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(255, 255, 0, 0.4), 0 0 60px rgba(255, 0, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.1);
            animation: glow-border 3s ease-in-out infinite;
        `;

        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.id = 'pacman-canvas';
        this.gameCanvas.style.cssText = `
            display: block;
            border-radius: 16px;
            background: ${NEON_PACMAN_COLORS.DARK_BACKGROUND};
        `;

        this.gameCanvas.width = this.gameWidth;
        this.gameCanvas.height = this.gameHeight;

        canvasWrapper.appendChild(this.gameCanvas);
        this.gameContainer.appendChild(canvasWrapper);

        this.ctx = this.gameCanvas.getContext('2d');
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.isLevelComplete = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateScore(0);
        this.updateLivesDisplay();
        this.updateLevelDisplay();
        
        this.keys.up = false;
        this.keys.down = false;
        this.keys.left = false;
        this.keys.right = false;
        
        if (this.canvas) {
            this.canvas.style.transform = '';
        }
        
        this.resetGame();
        this.startCountdown();
        this.gameLoop();
    }

    startCountdown() {
        this.isWaiting = true;
        this.countdownValue = 3;
        this.audioManager.playSound('perfect', { pitch: 0.8, volume: 0.4 });
        
        const countdownInterval = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue > 0) {
                this.audioManager.playSound('hit', { pitch: 0.9 + (3 - this.countdownValue) * 0.1, volume: 0.4 });
            } else {
                clearInterval(countdownInterval);
                this.isWaiting = false;
                this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
            }
        }, 1000);
    }

    resetGame() {
        this.maze = createMaze();
        this.originalMaze = createMaze();
        this.particles = [];
        this.powerMode = false;
        this.powerModeTimer = 0;
        
        this.countDots();
        this.initPacman();
        this.initGhosts();
        
        this.updateDotsDisplay();
        this.updateHighScoreDisplay();
    }

    countDots() {
        this.dots = 0;
        this.totalDots = 0;
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.maze[y][x] === TILE.DOT || this.maze[y][x] === TILE.POWER_PELLET) {
                    this.dots++;
                    this.totalDots++;
                }
            }
        }
    }

    initPacman() {
        this.pacman = {
            x: 10 * CELL_SIZE,
            y: 15 * CELL_SIZE,
            tileX: 10,
            tileY: 15,
            direction: DIRECTIONS.RIGHT,
            nextDirection: DIRECTIONS.RIGHT,
            mouthAngle: 0,
            mouthDirection: 1,
            speed: 2.0,
            moving: false
        };
    }

    initGhosts() {
        this.ghosts = [];
        const config = this.getLevelConfig();
        const positions = [
            { tileX: 9, tileY: 9, color: GHOST_COLORS[0] },
            { tileX: 10, tileY: 9, color: GHOST_COLORS[1] },
            { tileX: 11, tileY: 9, color: GHOST_COLORS[2] },
            { tileX: 10, tileY: 8, color: GHOST_COLORS[3] }
        ];
        
        for (let i = 0; i < Math.min(config.ghostCount, positions.length); i++) {
            const pos = positions[i];
            this.ghosts.push({
                x: pos.tileX * CELL_SIZE,
                y: pos.tileY * CELL_SIZE,
                tileX: pos.tileX,
                tileY: pos.tileY,
                direction: DIRECTIONS.UP,
                color: pos.color,
                speed: config.ghostSpeed,
                vulnerable: false,
                eaten: false,
                homeX: pos.tileX,
                homeY: pos.tileY,
                scatterTimer: 0,
                chaseTimer: 0
            });
        }
    }

    getLevelConfig() {
        const levelIndex = Math.min(this.level - 1, LEVEL_CONFIGS.length - 1);
        return LEVEL_CONFIGS[levelIndex];
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        this.isRunning = false;
        this.restorePlatformHeaderInfo();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        
        if (!this.isPaused && !this.isGameOver && !this.isWaiting && !this.isLevelComplete) {
            this.update(currentTime);
        }
        
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(currentTime) {
        this.updatePacman();
        this.updateGhosts(currentTime);
        this.updatePowerMode(currentTime);
        this.updateParticles();
        this.checkCollisions();
        this.checkLevelComplete();
    }

    updatePacman() {
        this.handleInputDirection();
        
        const pacman = this.pacman;
        const nextTileX = pacman.tileX + pacman.nextDirection.x;
        const nextTileY = pacman.tileY + pacman.nextDirection.y;
        
        if (this.canMoveTo(nextTileX, nextTileY)) {
            pacman.direction = pacman.nextDirection;
        }
        
        const moveTileX = pacman.tileX + pacman.direction.x;
        const moveTileY = pacman.tileY + pacman.direction.y;
        
        const atTileCenter = this.isAtTileCenter(pacman.x, pacman.y, pacman.direction);
        
        if (atTileCenter) {
            if (this.canMoveTo(moveTileX, moveTileY)) {
                pacman.moving = true;
                pacman.tileX = moveTileX;
                pacman.tileY = moveTileY;
                
                this.handleTunnel(pacman);
                
                this.eatDot(pacman.tileX, pacman.tileY);
            } else {
                pacman.moving = false;
            }
        }
        
        if (pacman.moving) {
            pacman.x += pacman.direction.x * pacman.speed;
            pacman.y += pacman.direction.y * pacman.speed;
            
            pacman.mouthAngle += pacman.mouthDirection * 0.15;
            if (pacman.mouthAngle >= 0.3) {
                pacman.mouthDirection = -1;
            } else if (pacman.mouthAngle <= 0) {
                pacman.mouthDirection = 1;
            }
        }
    }

    handleInputDirection() {
        const pacman = this.pacman;
        
        if (this.keys.up) {
            pacman.nextDirection = DIRECTIONS.UP;
        } else if (this.keys.down) {
            pacman.nextDirection = DIRECTIONS.DOWN;
        } else if (this.keys.left) {
            pacman.nextDirection = DIRECTIONS.LEFT;
        } else if (this.keys.right) {
            pacman.nextDirection = DIRECTIONS.RIGHT;
        }
    }

    isAtTileCenter(x, y, direction) {
        const tileCenterX = this.pacman.tileX * CELL_SIZE + CELL_SIZE / 2;
        const tileCenterY = this.pacman.tileY * CELL_SIZE + CELL_SIZE / 2;
        
        const threshold = 2;
        
        if (direction.x !== 0) {
            return Math.abs(y - tileCenterY) < threshold;
        } else {
            return Math.abs(x - tileCenterX) < threshold;
        }
    }

    canMoveTo(tileX, tileY) {
        if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) {
            return false;
        }
        
        const tile = this.maze[tileY][tileX];
        return tile !== TILE.WALL && tile !== TILE.GHOST_HOUSE;
    }

    handleTunnel(pacman) {
        if (pacman.tileX < 0) {
            pacman.tileX = COLS - 1;
            pacman.x = pacman.tileX * CELL_SIZE;
        } else if (pacman.tileX >= COLS) {
            pacman.tileX = 0;
            pacman.x = 0;
        }
    }

    eatDot(tileX, tileY) {
        const tile = this.maze[tileY][tileX];
        
        if (tile === TILE.DOT) {
            this.maze[tileY][tileX] = TILE.EMPTY;
            this.dots--;
            this.score += 10;
            this.updateScore(this.score);
            this.updateDotsDisplay();
            this.createDotParticles(tileX * CELL_SIZE + CELL_SIZE / 2, tileY * CELL_SIZE + CELL_SIZE / 2);
            this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.3 });
        } else if (tile === TILE.POWER_PELLET) {
            this.maze[tileY][tileX] = TILE.EMPTY;
            this.dots--;
            this.score += 50;
            this.updateScore(this.score);
            this.updateDotsDisplay();
            this.activatePowerMode();
            this.createPowerPelletParticles(tileX * CELL_SIZE + CELL_SIZE / 2, tileY * CELL_SIZE + CELL_SIZE / 2);
            this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.5 });
        }
    }

    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTimer = this.powerModeDuration;
        
        this.ghosts.forEach(ghost => {
            if (!ghost.eaten) {
                ghost.vulnerable = true;
            }
        });
        
        this.showPowerModeDisplay();
    }

    updatePowerMode(currentTime) {
        if (this.powerMode) {
            this.powerModeTimer -= 16;
            
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(ghost => {
                    ghost.vulnerable = false;
                });
                this.hidePowerModeDisplay();
            } else {
                this.updatePowerModeTimer();
            }
        }
    }

    showPowerModeDisplay() {
        if (this.powerModeDisplay) {
            this.powerModeDisplay.style.display = 'block';
        }
    }

    hidePowerModeDisplay() {
        if (this.powerModeDisplay) {
            this.powerModeDisplay.style.display = 'none';
        }
    }

    updatePowerModeTimer() {
        const timerEl = document.getElementById('power-mode-timer');
        if (timerEl) {
            const remaining = Math.max(0, Math.ceil(this.powerModeTimer / 1000));
            timerEl.textContent = `剩余时间: ${remaining}s`;
        }
    }

    updateGhosts(currentTime) {
        this.ghosts.forEach(ghost => {
            if (ghost.eaten) {
                this.returnGhostToHome(ghost);
                return;
            }
            
            this.moveGhost(ghost);
        });
    }

    moveGhost(ghost) {
        const atTileCenter = this.isAtTileCenter(ghost.x, ghost.y, ghost.direction);
        
        if (atTileCenter) {
            const newDirection = this.getGhostDirection(ghost);
            ghost.direction = newDirection;
            
            ghost.tileX += ghost.direction.x;
            ghost.tileY += ghost.direction.y;
            
            this.handleTunnel(ghost);
        }
        
        ghost.x += ghost.direction.x * ghost.speed;
        ghost.y += ghost.direction.y * ghost.speed;
    }

    getGhostDirection(ghost) {
        const possibleDirections = this.getPossibleDirections(ghost);
        
        if (possibleDirections.length === 0) {
            return this.getOppositeDirection(ghost.direction);
        }
        
        if (possibleDirections.length === 1) {
            return possibleDirections[0];
        }
        
        const filteredDirections = possibleDirections.filter(dir => 
            !(dir.x === -ghost.direction.x && dir.y === -ghost.direction.y)
        );
        
        if (filteredDirections.length > 0) {
            possibleDirections.length = 0;
            possibleDirections.push(...filteredDirections);
        }
        
        if (ghost.vulnerable) {
            return this.getAwayFromPacmanDirection(ghost, possibleDirections);
        } else {
            return this.getChaseDirection(ghost, possibleDirections);
        }
    }

    getPossibleDirections(ghost) {
        const directions = [];
        const dirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        
        dirs.forEach(dir => {
            const nextX = ghost.tileX + dir.x;
            const nextY = ghost.tileY + dir.y;
            
            if (this.canGhostMoveTo(nextX, nextY)) {
                directions.push(dir);
            }
        });
        
        return directions;
    }

    canGhostMoveTo(tileX, tileY) {
        if (tileX < 0 || tileX >= COLS) {
            return true;
        }
        if (tileY < 0 || tileY >= ROWS) {
            return false;
        }
        
        const tile = this.maze[tileY][tileX];
        return tile !== TILE.WALL;
    }

    getChaseDirection(ghost, possibleDirections) {
        let bestDirection = possibleDirections[0];
        let bestDistance = Infinity;
        
        possibleDirections.forEach(dir => {
            const nextX = ghost.tileX + dir.x;
            const nextY = ghost.tileY + dir.y;
            const distance = this.getDistance(nextX, nextY, this.pacman.tileX, this.pacman.tileY);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestDirection = dir;
            }
        });
        
        return bestDirection;
    }

    getAwayFromPacmanDirection(ghost, possibleDirections) {
        let bestDirection = possibleDirections[0];
        let bestDistance = 0;
        
        possibleDirections.forEach(dir => {
            const nextX = ghost.tileX + dir.x;
            const nextY = ghost.tileY + dir.y;
            const distance = this.getDistance(nextX, nextY, this.pacman.tileX, this.pacman.tileY);
            
            if (distance > bestDistance) {
                bestDistance = distance;
                bestDirection = dir;
            }
        });
        
        return bestDirection;
    }

    getOppositeDirection(direction) {
        return { x: -direction.x, y: -direction.y };
    }

    getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    returnGhostToHome(ghost) {
        const atTileCenter = this.isAtTileCenter(ghost.x, ghost.y, ghost.direction);
        
        if (atTileCenter) {
            if (ghost.tileX === ghost.homeX && ghost.tileY === ghost.homeY) {
                ghost.eaten = false;
                ghost.vulnerable = false;
                return;
            }
            
            const direction = this.getDirectionTo(ghost.tileX, ghost.tileY, ghost.homeX, ghost.homeY);
            ghost.direction = direction;
            
            ghost.tileX += ghost.direction.x;
            ghost.tileY += ghost.direction.y;
        }
        
        ghost.x += ghost.direction.x * ghost.speed * 2;
        ghost.y += ghost.direction.y * ghost.speed * 2;
    }

    getDirectionTo(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else {
            return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
        }
    }

    checkCollisions() {
        const pacman = this.pacman;
        
        this.ghosts.forEach(ghost => {
            if (this.checkCircleCollision(pacman, ghost)) {
                if (ghost.vulnerable && !ghost.eaten) {
                    this.eatGhost(ghost);
                } else if (!ghost.eaten) {
                    this.loseLife();
                }
            }
        });
    }

    checkCircleCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < CELL_SIZE * 0.6;
    }

    eatGhost(ghost) {
        ghost.eaten = true;
        this.score += 200;
        this.updateScore(this.score);
        this.createGhostEatenParticles(ghost.x, ghost.y, ghost.color);
        this.audioManager.playSound('combo', { pitch: 2.0, volume: 0.5 });
    }

    loseLife() {
        this.lives--;
        this.updateLivesDisplay();
        
        this.triggerShake(30, 500);
        this.audioManager.playSound('miss', { pitch: 0.6, volume: 0.6 });
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
            this.isWaiting = true;
            this.countdownValue = 1;
            
            setTimeout(() => {
                this.isWaiting = false;
                this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
            }, 1000);
        }
    }

    resetPositions() {
        this.initPacman();
        this.initGhosts();
        this.powerMode = false;
        this.hidePowerModeDisplay();
    }

    checkLevelComplete() {
        if (this.dots <= 0) {
            this.isLevelComplete = true;
            this.levelComplete();
        }
    }

    levelComplete() {
        this.level++;
        this.updateLevelDisplay();
        
        this.triggerFlash(NEON_PACMAN_COLORS.NEON_GREEN, 500);
        this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.6 });
        
        setTimeout(() => {
            this.resetGame();
            this.resetPositions();
            this.isLevelComplete = false;
            this.isWaiting = true;
            this.countdownValue = 2;
            
            const countdownInterval = setInterval(() => {
                this.countdownValue--;
                if (this.countdownValue > 0) {
                    this.audioManager.playSound('hit', { pitch: 0.9 + (2 - this.countdownValue) * 0.1, volume: 0.4 });
                } else {
                    clearInterval(countdownInterval);
                    this.isWaiting = false;
                    this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
                }
            }, 1000);
        }, 1000);
    }

    gameOver() {
        this.isGameOver = true;
        this.saveHighScore();
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 10, 26, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(15px);
            animation: game-over-fade 0.5s ease;
        `;
        
        const card = document.createElement('div');
        card.className = 'game-over-card';
        card.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 255, 0, 0.2), rgba(255, 0, 255, 0.2));
            border: 3px solid ${NEON_PACMAN_COLORS.NEON_YELLOW};
            border-radius: 24px;
            padding: 50px 60px;
            text-align: center;
            max-width: 420px;
            animation: game-over-fade 0.6s ease 0.2s both;
            box-shadow: 0 20px 60px rgba(255, 255, 0, 0.5), 0 0 80px rgba(255, 0, 255, 0.3);
        `;
        
        const isHighScore = this.score > this.highScore;
        
        if (isHighScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        card.innerHTML = `
            <div style="font-size: 4.5rem; margin-bottom: 20px; animation: float-up 1s ease infinite;">${isHighScore ? '🏆' : '💀'}</div>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: ${isHighScore ? NEON_PACMAN_COLORS.NEON_CYAN : NEON_PACMAN_COLORS.NEON_RED}; margin-bottom: 10px; text-shadow: 0 0 20px ${isHighScore ? NEON_PACMAN_COLORS.NEON_CYAN : NEON_PACMAN_COLORS.NEON_RED};">
                ${isHighScore ? '新纪录！' : '游戏结束'}
            </h2>
            <p style="color: ${NEON_PACMAN_COLORS.TEXT_SECONDARY}; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.8;">
                最终得分: <span style="color: ${NEON_PACMAN_COLORS.NEON_YELLOW}; font-weight: 800; font-size: 1.5rem; text-shadow: 0 0 10px ${NEON_PACMAN_COLORS.NEON_YELLOW};">${this.score}</span><br>
                到达关卡: <span style="color: ${NEON_PACMAN_COLORS.NEON_GREEN}; font-weight: 700;">${this.level}</span>
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="retry-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${NEON_PACMAN_COLORS.NEON_YELLOW}, ${NEON_PACMAN_COLORS.NEON_PINK});
                    border: none;
                    color: ${NEON_PACMAN_COLORS.DARK_BACKGROUND};
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(255, 255, 0, 0.4);
                ">再来一局</button>
                <button id="exit-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: transparent;
                    border: 2px solid ${NEON_PACMAN_COLORS.NEON_CYAN};
                    color: ${NEON_PACMAN_COLORS.TEXT_PRIMARY};
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">返回主页</button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        card.querySelector('#retry-btn').addEventListener('click', () => {
            overlay.remove();
            this.start();
        });
        
        card.querySelector('#exit-btn').addEventListener('click', () => {
            overlay.remove();
            this.context.gameManager.exitGame();
        });
    }

    createDotParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: NEON_PACMAN_COLORS.NEON_YELLOW,
                life: 1,
                decay: 0.03,
                type: 'dot'
            });
        }
    }

    createPowerPelletParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: NEON_PACMAN_COLORS.NEON_CYAN,
                life: 1,
                decay: 0.02,
                type: 'power'
            });
        }
    }

    createGhostEatenParticles(x, y, color) {
        const colors = [
            color,
            NEON_PACMAN_COLORS.NEON_PINK,
            NEON_PACMAN_COLORS.NEON_CYAN,
            NEON_PACMAN_COLORS.NEON_YELLOW,
            NEON_PACMAN_COLORS.NEON_GREEN
        ];
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i + Math.random() * 0.3;
            const speed = 3 + Math.random() * 4;
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 6,
                color: particleColor,
                life: 1,
                decay: 0.015 + Math.random() * 0.01,
                gravity: 0.1,
                type: 'explosion'
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.gravity) {
                p.vy += p.gravity;
            }
            
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('pacman-score');
        if (scoreEl) {
            scoreEl.textContent = this.score.toString();
        }
    }

    updateHighScoreDisplay() {
        const highScoreEl = document.getElementById('pacman-high-score');
        if (highScoreEl) {
            highScoreEl.textContent = this.highScore.toString();
        }
    }

    updateLivesDisplay() {
        const livesEl = document.getElementById('pacman-lives');
        if (livesEl) {
            livesEl.textContent = '❤️'.repeat(this.lives);
        }
    }

    updateLevelDisplay() {
        const levelEl = document.getElementById('pacman-level');
        if (levelEl) {
            levelEl.textContent = this.level.toString();
        }
    }

    updateDotsDisplay() {
        const dotsEl = document.getElementById('pacman-dots');
        if (dotsEl) {
            dotsEl.textContent = this.dots.toString();
        }
    }

    loadHighScore() {
        const saved = localStorage.getItem('neonPacmanHighScore');
        this.highScore = saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('neonPacmanHighScore', this.score.toString());
    }

    render() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        
        ctx.fillStyle = NEON_PACMAN_COLORS.DARK_BACKGROUND;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        this.drawBackground();
        this.drawMaze();
        this.drawDots();
        this.drawGhosts();
        this.drawPacman();
        this.drawParticles();
        
        if (this.isWaiting) {
            this.drawCountdown();
        }
        
        if (this.isPaused && !this.isGameOver) {
            this.drawPauseOverlay();
        }
    }

    drawBackground() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        const gradient = ctx.createRadialGradient(
            this.gameWidth / 2,
            this.gameHeight / 2,
            0,
            this.gameWidth / 2,
            this.gameHeight / 2,
            this.gameWidth / 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.05)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.03)');
        gradient.addColorStop(1, 'rgba(10, 10, 26, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 73 + Math.sin(time * 0.1 + i) * 10) % this.gameWidth;
            const y = (i * 47 + Math.cos(time * 0.08 + i) * 5) % this.gameHeight;
            const size = 1 + Math.sin(time + i) * 0.5;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMaze() {
        const ctx = this.ctx;
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = this.maze[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;
                
                if (tile === TILE.WALL) {
                    this.drawWall(ctx, px, py);
                } else if (tile === TILE.GHOST_HOUSE) {
                    this.drawGhostHouse(ctx, px, py);
                } else if (tile === TILE.GHOST_DOOR) {
                    this.drawGhostDoor(ctx, px, py);
                }
            }
        }
    }

    drawWall(ctx, x, y) {
        ctx.shadowColor = NEON_PACMAN_COLORS.NEON_BLUE;
        ctx.shadowBlur = 5;
        
        ctx.fillStyle = NEON_PACMAN_COLORS.WALL_COLOR;
        ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        
        ctx.strokeStyle = NEON_PACMAN_COLORS.NEON_BLUE;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        
        ctx.shadowBlur = 0;
    }

    drawGhostHouse(ctx, x, y) {
        ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    }

    drawGhostDoor(ctx, x, y) {
        ctx.fillStyle = NEON_PACMAN_COLORS.NEON_PINK;
        ctx.shadowColor = NEON_PACMAN_COLORS.NEON_PINK;
        ctx.shadowBlur = 10;
        
        ctx.fillRect(x, y + CELL_SIZE / 2 - 2, CELL_SIZE, 4);
        
        ctx.shadowBlur = 0;
    }

    drawDots() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tile = this.maze[y][x];
                const px = x * CELL_SIZE + CELL_SIZE / 2;
                const py = y * CELL_SIZE + CELL_SIZE / 2;
                
                if (tile === TILE.DOT) {
                    this.drawDot(ctx, px, py);
                } else if (tile === TILE.POWER_PELLET) {
                    this.drawPowerPellet(ctx, px, py, time);
                }
            }
        }
    }

    drawDot(ctx, x, y) {
        ctx.fillStyle = NEON_PACMAN_COLORS.NEON_YELLOW;
        ctx.shadowColor = NEON_PACMAN_COLORS.NEON_YELLOW;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    drawPowerPellet(ctx, x, y, time) {
        const pulse = Math.sin(time * 5) * 0.3 + 0.7;
        const size = 6 + pulse * 3;
        
        ctx.fillStyle = NEON_PACMAN_COLORS.NEON_CYAN;
        ctx.shadowColor = NEON_PACMAN_COLORS.NEON_CYAN;
        ctx.shadowBlur = 15 * pulse;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    drawPacman() {
        const ctx = this.ctx;
        const pacman = this.pacman;
        const x = pacman.x + CELL_SIZE / 2;
        const y = pacman.y + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;
        
        let startAngle = 0;
        let endAngle = Math.PI * 2;
        
        if (pacman.direction === DIRECTIONS.RIGHT) {
            startAngle = pacman.mouthAngle * Math.PI;
            endAngle = (2 - pacman.mouthAngle) * Math.PI;
        } else if (pacman.direction === DIRECTIONS.LEFT) {
            startAngle = (1 + pacman.mouthAngle) * Math.PI;
            endAngle = (1 - pacman.mouthAngle) * Math.PI;
        } else if (pacman.direction === DIRECTIONS.UP) {
            startAngle = (1.5 + pacman.mouthAngle) * Math.PI;
            endAngle = (1.5 - pacman.mouthAngle) * Math.PI;
        } else if (pacman.direction === DIRECTIONS.DOWN) {
            startAngle = (0.5 + pacman.mouthAngle) * Math.PI;
            endAngle = (0.5 - pacman.mouthAngle) * Math.PI;
        }
        
        ctx.fillStyle = NEON_PACMAN_COLORS.PACMAN_YELLOW;
        ctx.shadowColor = NEON_PACMAN_COLORS.PACMAN_YELLOW;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    drawGhosts() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        this.ghosts.forEach(ghost => {
            const x = ghost.x + CELL_SIZE / 2;
            const y = ghost.y + CELL_SIZE / 2;
            
            if (ghost.eaten) {
                this.drawEyes(ctx, x, y);
            } else if (ghost.vulnerable) {
                const flash = Math.sin(time * 10) > 0;
                const color = flash ? NEON_PACMAN_COLORS.NEON_BLUE : NEON_PACMAN_COLORS.NEON_CYAN;
                this.drawVulnerableGhost(ctx, x, y, color);
            } else {
                this.drawGhost(ctx, x, y, ghost.color);
            }
        });
    }

    drawGhost(ctx, x, y, color) {
        const radius = CELL_SIZE / 2 - 2;
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(x, y - 2, radius, Math.PI, 0);
        ctx.lineTo(x + radius, y + radius - 2);
        ctx.lineTo(x + radius * 0.66, y + radius - 6);
        ctx.lineTo(x + radius * 0.33, y + radius - 2);
        ctx.lineTo(x, y + radius - 6);
        ctx.lineTo(x - radius * 0.33, y + radius - 2);
        ctx.lineTo(x - radius * 0.66, y + radius - 6);
        ctx.lineTo(x - radius, y + radius - 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        this.drawEyes(ctx, x, y);
    }

    drawVulnerableGhost(ctx, x, y, color) {
        const radius = CELL_SIZE / 2 - 2;
        
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(x, y - 2, radius, Math.PI, 0);
        ctx.lineTo(x + radius, y + radius - 2);
        ctx.lineTo(x + radius * 0.66, y + radius - 6);
        ctx.lineTo(x + radius * 0.33, y + radius - 2);
        ctx.lineTo(x, y + radius - 6);
        ctx.lineTo(x - radius * 0.33, y + radius - 2);
        ctx.lineTo(x - radius * 0.66, y + radius - 6);
        ctx.lineTo(x - radius, y + radius - 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 2, 3, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEyes(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 2, 5, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - 5, y - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        });
    }

    drawCountdown() {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        ctx.fillStyle = NEON_PACMAN_COLORS.NEON_YELLOW;
        ctx.shadowColor = NEON_PACMAN_COLORS.NEON_YELLOW;
        ctx.shadowBlur = 30;
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.countdownValue > 0) {
            ctx.fillText(this.countdownValue.toString(), this.gameWidth / 2, this.gameHeight / 2);
        } else {
            ctx.fillText('开始!', this.gameWidth / 2, this.gameHeight / 2);
        }
        
        ctx.shadowBlur = 0;
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        ctx.fillStyle = NEON_PACMAN_COLORS.NEON_CYAN;
        ctx.shadowColor = NEON_PACMAN_COLORS.NEON_CYAN;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暂停', this.gameWidth / 2, this.gameHeight / 2);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = NEON_PACMAN_COLORS.TEXT_SECONDARY;
        ctx.fillText('按 P 继续游戏', this.gameWidth / 2, this.gameHeight / 2 + 50);
        
        ctx.shadowBlur = 0;
    }

    handleInput(eventType, event) {
        if (eventType !== 'keydown') return;
        
        const key = event.key.toLowerCase();
        
        if (key === 'arrowup' || key === 'w') {
            this.keys.up = true;
            event.preventDefault();
        } else if (key === 'arrowdown' || key === 's') {
            this.keys.down = true;
            event.preventDefault();
        } else if (key === 'arrowleft' || key === 'a') {
            this.keys.left = true;
            event.preventDefault();
        } else if (key === 'arrowright' || key === 'd') {
            this.keys.right = true;
            event.preventDefault();
        } else if (key === 'p') {
            if (this.isPaused) {
                this.resume();
            } else {
                this.pause();
            }
        }
    }
}