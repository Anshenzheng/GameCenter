/**
 * 丛林贪吃蛇游戏 - Jungle Snake Game
 * 深绿丛林风格，蛇身为渐变棕绿色
 * 食物：蘑菇、野果子、小昆虫
 */

const JUNGLE_COLORS = {
    DARK_FOREST: '#0d1f14',
    FOREST_GREEN: '#1a3a25',
    LEAF_GREEN: '#2d5a3d',
    MOSS_GREEN: '#4a7c59',
    LIME_GREEN: '#6dbf7a',
    SNAKE_HEAD: '#8b6f47',
    SNAKE_BODY_START: '#6b8f5a',
    SNAKE_BODY_END: '#4a6c3d',
    MUSHROOM_RED: '#c44569',
    MUSHROOM_SPOT: '#f5cd79',
    BERRY_BLUE: '#546de5',
    BERRY_PURPLE: '#9b59b6',
    INSECT_YELLOW: '#f7d794',
    INSECT_ORANGE: '#e17055',
    TEXT_PRIMARY: '#e8f5e9',
    TEXT_SECONDARY: '#a5d6a7',
    ACCENT_GOLD: '#f9ca24',
    GRASS_LIGHT: '#7bed9f',
    GRASS_DARK: '#2ed573',
    FIREFLY: '#fff59d',
    TONGUE_RED: '#ff6b9d',
    TONGUE_DARK: '#c44569',
    TONGUE_PINK: '#ffb3d9'
};

const FOOD_TYPES = {
    MUSHROOM: {
        name: '蘑菇',
        emoji: '🍄',
        points: 10,
        color: JUNGLE_COLORS.MUSHROOM_RED
    },
    BERRY: {
        name: '野果子',
        emoji: '🫐',
        points: 15,
        color: JUNGLE_COLORS.BERRY_BLUE
    },
    INSECT: {
        name: '小昆虫',
        emoji: '🐛',
        points: 20,
        color: JUNGLE_COLORS.INSECT_YELLOW
    },
    ACORN: {
        name: '橡果',
        emoji: '🌰',
        points: 12,
        color: '#d35400'
    },
    FLOWER: {
        name: '花朵',
        emoji: '🌸',
        points: 25,
        color: '#fd79a8'
    }
};

const GRID_SIZE = 25;
const INITIAL_SPEED = 150;
const BOOST_SPEED = 70;
const INITIAL_SNAKE_LENGTH = 5;

class JungleSnakeGame extends GameInterface {
    static get metadata() {
        return {
            id: 'jungle-snake',
            name: '丛林贪吃蛇',
            description: '在神秘丛林中冒险！收集蘑菇、野果和小昆虫，使用方向键控制，空格键加速！',
            icon: '🐍',
            colors: {
                primary: JUNGLE_COLORS.MOSS_GREEN,
                secondary: JUNGLE_COLORS.LIME_GREEN
            }
        };
    }

    constructor(context) {
        super(context);
        this.canvas = context.canvas;
        this.gameCanvas = null;
        this.ctx = null;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.cellSize = 0;
        
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = null;
        this.foodType = null;
        
        this.baseSpeed = INITIAL_SPEED;
        this.currentSpeed = INITIAL_SPEED;
        this.lastMoveTime = 0;
        this.isBoosting = false;
        
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWaiting = false;
        this.countdownValue = 0;
        this.score = 0;
        this.highScore = this.loadHighScore();
        
        this.particles = [];
        this.fireflyElements = [];
        this.backgroundFireflies = [];
        this.audioManager = new AudioManager();
    }

    loadHighScore() {
        const saved = localStorage.getItem('jungleSnakeHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('jungleSnakeHighScore', this.highScore.toString());
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        this.setupGrid();
        this.generateDecorativeElements();
        console.log('丛林贪吃蛇游戏已初始化');
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
            background: linear-gradient(180deg, ${JUNGLE_COLORS.DARK_FOREST} 0%, ${JUNGLE_COLORS.FOREST_GREEN} 50%, ${JUNGLE_COLORS.LEAF_GREEN} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: hidden;
            gap: 15px;
            position: relative;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes snake-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            @keyframes food-bounce {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-5px) rotate(5deg); }
            }
            @keyframes particle-float {
                0% { opacity: 1; transform: translate(0, 0) scale(1); }
                100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0); }
            }
            @keyframes game-over-fade {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes firefly-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            @keyframes firefly-pulse {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.3); }
            }
            @keyframes float-up {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes tongue-wiggle {
                0%, 100% { transform: scaleX(1); }
                50% { transform: scaleX(1.1); }
            }
            @keyframes pulse-border {
                0%, 100% { box-shadow: 0 0 20px rgba(109, 191, 122, 0.4); }
                50% { box-shadow: 0 0 30px rgba(109, 191, 122, 0.7); }
            }
            .jungle-firefly {
                position: absolute;
                pointer-events: none;
                z-index: 1;
            }
            .jungle-firefly-glow {
                position: absolute;
                border-radius: 50%;
                background: radial-gradient(circle, ${JUNGLE_COLORS.FIREFLY}cc 0%, ${JUNGLE_COLORS.FIREFLY}44 50%, transparent 100%);
                pointer-events: none;
            }
            .jungle-firefly-core {
                position: absolute;
                border-radius: 50%;
                background: #ffffff;
                box-shadow: 0 0 10px ${JUNGLE_COLORS.FIREFLY};
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        this.backgroundFirefliesContainer = document.createElement('div');
        this.backgroundFirefliesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        this.canvas.appendChild(this.backgroundFirefliesContainer);

        this.leftPanel = document.createElement('div');
        this.leftPanel.className = 'left-panel';
        this.leftPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 200px;
            min-width: 200px;
            flex-shrink: 0;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            z-index: 2;
            max-height: 100%;
            overflow-y: auto;
        `;

        this.createHUD();
        this.createControls();

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
        `;

        this.createGameCanvas();

        this.canvas.appendChild(this.leftPanel);
        this.canvas.appendChild(this.gameContainer);
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.className = 'snake-hud';
        hud.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px;
            background: linear-gradient(135deg, rgba(26, 58, 37, 0.95), rgba(45, 90, 61, 0.95));
            backdrop-filter: blur(15px);
            border: 2px solid ${JUNGLE_COLORS.MOSS_GREEN};
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            flex-shrink: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${JUNGLE_COLORS.LIME_GREEN};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${JUNGLE_COLORS.MOSS_GREEN};
            margin-bottom: 2px;
        `;
        title.innerHTML = '🐍 游戏状态';
        hud.appendChild(title);

        const items = [
            { id: 'current-score', label: '当前分数', value: '0', icon: '🎯', color: JUNGLE_COLORS.ACCENT_GOLD },
            { id: 'snake-length', label: '蛇身长度', value: INITIAL_SNAKE_LENGTH, icon: '📏', color: JUNGLE_COLORS.LIME_GREEN },
            { id: 'high-score', label: '最高纪录', value: this.highScore, icon: '🏆', color: JUNGLE_COLORS.ACCENT_GOLD },
            { id: 'speed-indicator', label: '速度状态', value: '🐢 正常', icon: '⚡', color: JUNGLE_COLORS.TEXT_PRIMARY }
        ];

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 7px 10px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
            `;
            
            itemEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 1rem;">${item.icon}</span>
                    <span style="font-size: 0.75rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">${item.label}</span>
                </div>
                <span id="${item.id}" style="font-size: 0.95rem; font-weight: 800; color: ${item.color};">${item.value}</span>
            `;
            
            hud.appendChild(itemEl);
        });

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
            background: linear-gradient(135deg, rgba(26, 58, 37, 0.95), rgba(45, 90, 61, 0.95));
            backdrop-filter: blur(15px);
            border: 2px solid ${JUNGLE_COLORS.MOSS_GREEN};
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            flex-shrink: 0;
            min-height: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${JUNGLE_COLORS.LIME_GREEN};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${JUNGLE_COLORS.MOSS_GREEN};
            margin-bottom: 2px;
        `;
        title.innerHTML = '🎮 操作说明';
        controls.appendChild(title);

        const controlItems = [
            { keys: ['↑', '↓', '←', '→'], desc: '或 WASD 控制方向' },
            { keys: ['空格'], desc: '按住加速 (双倍得分)' },
            { keys: ['P'], desc: '暂停游戏' }
        ];

        controlItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 8px 10px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
            `;
            
            const keysDisplay = item.keys.map(k => 
                `<span style="padding: 3px 8px; background: ${JUNGLE_COLORS.MOSS_GREEN}; border-radius: 5px; font-weight: 700; font-size: 0.75rem; color: ${JUNGLE_COLORS.TEXT_PRIMARY};">${k}</span>`
            ).join(' ');
            
            itemEl.innerHTML = `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">${keysDisplay}</div>
                <span style="font-size: 0.7rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY};">${item.desc}</span>
            `;
            
            controls.appendChild(itemEl);
        });

        const tip = document.createElement('div');
        tip.style.cssText = `
            margin-top: 8px;
            padding: 8px 10px;
            background: rgba(249, 202, 36, 0.1);
            border: 1px solid rgba(249, 202, 36, 0.3);
            border-radius: 8px;
            font-size: 0.68rem;
            color: ${JUNGLE_COLORS.TEXT_SECONDARY};
            line-height: 1.4;
        `;
        tip.innerHTML = '💡 <strong>小提示：</strong>按住空格键加速时吃到食物可以获得双倍分数！';
        controls.appendChild(tip);

        this.leftPanel.appendChild(controls);
    }

    createGameCanvas() {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'game-canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            padding: 10px;
            background: linear-gradient(135deg, ${JUNGLE_COLORS.MOSS_GREEN}, ${JUNGLE_COLORS.LIME_GREEN});
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1);
            animation: pulse-border 3s ease-in-out infinite;
        `;

        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.id = 'snake-canvas';
        this.gameCanvas.style.cssText = `
            display: block;
            border-radius: 16px;
            background: linear-gradient(135deg, ${JUNGLE_COLORS.DARK_FOREST}, ${JUNGLE_COLORS.FOREST_GREEN});
            cursor: default;
        `;

        canvasWrapper.appendChild(this.gameCanvas);
        this.gameContainer.appendChild(canvasWrapper);

        this.ctx = this.gameCanvas.getContext('2d');
    }

    setupGrid() {
        const containerWidth = Math.min(this.canvas.clientWidth - 280, 700);
        const containerHeight = Math.min(this.canvas.clientHeight - 60, 650);
        
        const size = Math.min(containerWidth, containerHeight);
        this.gameCanvas.width = size;
        this.gameCanvas.height = size;
        
        this.cellSize = Math.floor(size / GRID_SIZE);
        this.gridWidth = Math.floor(size / this.cellSize);
        this.gridHeight = this.gridWidth;
    }

    generateDecorativeElements() {
        this.backgroundFireflies = [];
        this.fireflyElements = [];
        
        if (!this.backgroundFirefliesContainer) return;
        
        this.backgroundFirefliesContainer.innerHTML = '';
        
        for (let i = 0; i < 25; i++) {
            const firefly = {
                x: Math.random() * this.canvas.clientWidth,
                y: Math.random() * this.canvas.clientHeight,
                size: 4 + Math.random() * 6,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                glowPhase: Math.random() * Math.PI * 2,
                glowSpeed: 0.02 + Math.random() * 0.03
            };
            
            this.backgroundFireflies.push(firefly);
            
            const fireflyEl = document.createElement('div');
            fireflyEl.className = 'jungle-firefly';
            fireflyEl.style.cssText = `
                left: ${firefly.x}px;
                top: ${firefly.y}px;
                width: ${firefly.size * 4}px;
                height: ${firefly.size * 4}px;
            `;
            
            const glowEl = document.createElement('div');
            glowEl.className = 'jungle-firefly-glow';
            glowEl.style.cssText = `
                width: ${firefly.size * 4}px;
                height: ${firefly.size * 4}px;
                left: 0;
                top: 0;
                animation: firefly-pulse ${2 + Math.random() * 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            
            const coreEl = document.createElement('div');
            coreEl.className = 'jungle-firefly-core';
            coreEl.style.cssText = `
                width: ${firefly.size}px;
                height: ${firefly.size}px;
                left: ${firefly.size * 1.5}px;
                top: ${firefly.size * 1.5}px;
            `;
            
            fireflyEl.appendChild(glowEl);
            fireflyEl.appendChild(coreEl);
            this.backgroundFirefliesContainer.appendChild(fireflyEl);
            this.fireflyElements.push(fireflyEl);
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.score = 0;
        this.updateScore(0);
        this.updateLengthDisplay(INITIAL_SNAKE_LENGTH);
        
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
                this.lastMoveTime = performance.now();
                this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
            }
        }, 1000);
    }

    resetGame() {
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        
        this.snake = [];
        for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
            this.snake.push({
                x: startX - i,
                y: startY
            });
        }
        
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.baseSpeed = INITIAL_SPEED;
        this.currentSpeed = this.baseSpeed;
        this.isBoosting = false;
        this.lastMoveTime = 0;
        this.particles = [];
        
        this.spawnFood();
        this.updateSpeedIndicator();
    }

    spawnFood() {
        const foodTypes = Object.values(FOOD_TYPES);
        this.foodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        
        let attempts = 0;
        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            attempts++;
        } while (this.isSnakePosition(this.food.x, this.food.y) && attempts < 100);
    }

    isSnakePosition(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastMoveTime = performance.now();
    }

    stop() {
        this.isRunning = false;
        this.restorePlatformHeaderInfo();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.fireflyElements = [];
        this.backgroundFireflies = [];
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        
        if (!this.isPaused && !this.isGameOver && !this.isWaiting) {
            if (currentTime - this.lastMoveTime >= this.currentSpeed) {
                this.moveSnake();
                this.lastMoveTime = currentTime;
            }
            this.updateParticles();
        }
        
        this.updateDecorativeFireflies();
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    updateDecorativeFireflies() {
        this.backgroundFireflies.forEach((firefly, index) => {
            firefly.x += firefly.vx;
            firefly.y += firefly.vy;
            firefly.glowPhase += firefly.glowSpeed;
            
            if (firefly.x < 0 || firefly.x > this.canvas.clientWidth) {
                firefly.vx *= -1;
                firefly.x = Math.max(0, Math.min(this.canvas.clientWidth, firefly.x));
            }
            if (firefly.y < 0 || firefly.y > this.canvas.clientHeight) {
                firefly.vy *= -1;
                firefly.y = Math.max(0, Math.min(this.canvas.clientHeight, firefly.y));
            }
            
            if (Math.random() < 0.003) {
                firefly.vx += (Math.random() - 0.5) * 0.12;
                firefly.vy += (Math.random() - 0.5) * 0.12;
                
                const maxSpeed = 1.0;
                firefly.vx = Math.max(-maxSpeed, Math.min(maxSpeed, firefly.vx));
                firefly.vy = Math.max(-maxSpeed, Math.min(maxSpeed, firefly.vy));
            }
            
            if (this.fireflyElements[index]) {
                const el = this.fireflyElements[index];
                el.style.left = firefly.x - firefly.size * 2 + 'px';
                el.style.top = firefly.y - firefly.size * 2 + 'px';
                
                const opacity = 0.25 + Math.sin(firefly.glowPhase) * 0.75;
                el.style.opacity = opacity;
            }
        });
    }

    moveSnake() {
        this.direction = { ...this.nextDirection };
        
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };
        
        if (this.checkCollision(newHead)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(newHead);
        
        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }
        
        this.updateLengthDisplay(this.snake.length);
    }

    checkCollision(head) {
        if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
            return true;
        }
        
        for (let i = 1; i < this.snake.length; i++) {
            if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                return true;
            }
        }
        
        return false;
    }

    eatFood() {
        const points = this.foodType.points * (this.isBoosting ? 2 : 1);
        this.score += points;
        this.updateScore(this.score);
        
        this.createEatParticles(this.food.x, this.food.y, this.foodType.color);
        
        this.audioManager.playSound('perfect', { pitch: 1.2 + Math.random() * 0.3, volume: 0.5 });
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
        
        this.spawnFood();
        
        if (this.baseSpeed > 60) {
            this.baseSpeed -= 2;
            if (!this.isBoosting) {
                this.currentSpeed = this.baseSpeed;
            }
        }
    }

    createEatParticles(gridX, gridY, color) {
        const x = gridX * this.cellSize + this.cellSize / 2;
        const y = gridY * this.cellSize + this.cellSize / 2;
        
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 8,
                color: color,
                life: 1,
                decay: 0.015 + Math.random() * 0.015
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.audioManager.playSound('miss', { pitch: 0.6, volume: 0.6 });
        this.triggerShake(20, 400);
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
            background: rgba(13, 31, 20, 0.92);
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
            background: linear-gradient(135deg, ${JUNGLE_COLORS.FOREST_GREEN}, ${JUNGLE_COLORS.LEAF_GREEN});
            border: 3px solid ${JUNGLE_COLORS.MOSS_GREEN};
            border-radius: 24px;
            padding: 50px 60px;
            text-align: center;
            max-width: 420px;
            animation: game-over-fade 0.6s ease 0.2s both;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;
        
        const isNewHighScore = this.score >= this.highScore && this.score > 0;
        
        card.innerHTML = `
            <div style="font-size: 4.5rem; margin-bottom: 20px; animation: float-up 1s ease infinite;">${isNewHighScore ? '🏆' : '💀'}</div>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: ${isNewHighScore ? JUNGLE_COLORS.ACCENT_GOLD : JUNGLE_COLORS.MUSHROOM_RED}; margin-bottom: 10px;">
                ${isNewHighScore ? '新纪录！' : '游戏结束'}
            </h2>
            <p style="color: ${JUNGLE_COLORS.TEXT_SECONDARY}; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.8;">
                最终得分: <span style="color: ${JUNGLE_COLORS.ACCENT_GOLD}; font-weight: 800; font-size: 1.5rem;">${this.score}</span><br>
                蛇身长度: <span style="color: ${JUNGLE_COLORS.LIME_GREEN}; font-weight: 700;">${this.snake.length}</span> 节
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="retry-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${JUNGLE_COLORS.LIME_GREEN}, ${JUNGLE_COLORS.MOSS_GREEN});
                    border: none;
                    color: ${JUNGLE_COLORS.DARK_FOREST};
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(109, 191, 122, 0.4);
                ">再来一局</button>
                <button id="exit-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: transparent;
                    border: 2px solid ${JUNGLE_COLORS.MOSS_GREEN};
                    color: ${JUNGLE_COLORS.TEXT_PRIMARY};
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

    render(deltaTime) {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const width = this.gameCanvas.width;
        const height = this.gameCanvas.height;
        
        ctx.fillStyle = JUNGLE_COLORS.DARK_FOREST;
        ctx.fillRect(0, 0, width, height);
        
        this.drawBackgroundPattern();
        this.drawGrid();
        
        if (this.food) {
            this.drawFood();
        }
        
        this.drawSnake();
        this.drawParticles();
        
        if (this.isWaiting) {
            this.drawCountdown();
        }
        
        if (this.isPaused && !this.isGameOver) {
            this.drawPauseOverlay();
        }
    }

    drawBackgroundPattern() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        const gradient = ctx.createRadialGradient(
            this.gameCanvas.width / 2,
            this.gameCanvas.height / 2,
            0,
            this.gameCanvas.width / 2,
            this.gameCanvas.height / 2,
            this.gameCanvas.width / 1.5
        );
        gradient.addColorStop(0, 'rgba(45, 90, 61, 0.2)');
        gradient.addColorStop(1, 'rgba(13, 31, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        ctx.fillStyle = 'rgba(74, 124, 89, 0.05)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 73 + Math.sin(time * 0.1 + i) * 5) % this.gameCanvas.width;
            const y = (i * 47 + Math.cos(time * 0.08 + i) * 3) % this.gameCanvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 15 + Math.sin(time + i) * 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(74, 124, 89, 0.08)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize, 0);
            ctx.lineTo(x * this.cellSize, this.gameCanvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize);
            ctx.lineTo(this.gameCanvas.width, y * this.cellSize);
            ctx.stroke();
        }
    }

    drawSnake() {
        const ctx = this.ctx;
        const padding = 1;
        
        for (let i = this.snake.length - 1; i >= 0; i--) {
            const segment = this.snake[i];
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            const size = this.cellSize - padding * 2;
            
            const isHead = i === 0;
            const segmentScale = isHead ? 1.0 : 0.92 - (i / this.snake.length) * 0.12;
            const actualSize = size * segmentScale;
            const offset = (size - actualSize) / 2;
            
            const progress = i / this.snake.length;
            const r = this.lerp(
                parseInt(JUNGLE_COLORS.SNAKE_HEAD.slice(1, 3), 16),
                parseInt(JUNGLE_COLORS.SNAKE_BODY_END.slice(1, 3), 16),
                progress
            );
            const g = this.lerp(
                parseInt(JUNGLE_COLORS.SNAKE_HEAD.slice(3, 5), 16),
                parseInt(JUNGLE_COLORS.SNAKE_BODY_END.slice(3, 5), 16),
                progress
            );
            const b = this.lerp(
                parseInt(JUNGLE_COLORS.SNAKE_HEAD.slice(5, 7), 16),
                parseInt(JUNGLE_COLORS.SNAKE_BODY_END.slice(5, 7), 16),
                progress
            );
            
            const color = 'rgb(' + r + ', ' + g + ', ' + b + ')';
            
            const drawX = x + padding + offset;
            const drawY = y + padding + offset;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            const shadowRadius = isHead ? actualSize / 2.2 : actualSize / 3;
            ctx.roundRect(drawX + 2, drawY + 2, actualSize, actualSize, shadowRadius);
            ctx.fill();
            
            ctx.fillStyle = color;
            ctx.beginPath();
            const radius = isHead ? actualSize / 2.2 : actualSize / 3;
            ctx.roundRect(drawX, drawY, actualSize, actualSize, radius);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (isHead ? 0.3 : 0.2) + ')';
            ctx.beginPath();
            ctx.roundRect(drawX + 3, drawY + 3, actualSize / 2.5, actualSize / 3, actualSize / 8);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.roundRect(drawX + actualSize / 2, drawY + actualSize / 2, actualSize / 2.5, actualSize / 2.5, actualSize / 8);
            ctx.fill();
            
            if (isHead) {
                this.drawSnakeHead(drawX, drawY, actualSize);
            }
        }
    }

    drawSnakeHead(x, y, size) {
        const ctx = this.ctx;
        const eyeSize = size / 4;
        const eyeOffset = size / 3.2;
        const pupilSize = eyeSize / 2;
        const time = performance.now() / 1000;
        
        let eyeX1, eyeY1, eyeX2, eyeY2;
        let tongueX, tongueY, tongueDirX, tongueDirY;
        
        if (this.direction.x === 1) {
            eyeX1 = x + size - eyeOffset;
            eyeY1 = y + eyeOffset;
            eyeX2 = x + size - eyeOffset;
            eyeY2 = y + size - eyeOffset;
            tongueX = x + size;
            tongueY = y + size / 2;
            tongueDirX = 1;
            tongueDirY = 0;
        } else if (this.direction.x === -1) {
            eyeX1 = x + eyeOffset;
            eyeY1 = y + eyeOffset;
            eyeX2 = x + eyeOffset;
            eyeY2 = y + size - eyeOffset;
            tongueX = x;
            tongueY = y + size / 2;
            tongueDirX = -1;
            tongueDirY = 0;
        } else if (this.direction.y === 1) {
            eyeX1 = x + eyeOffset;
            eyeY1 = y + size - eyeOffset;
            eyeX2 = x + size - eyeOffset;
            eyeY2 = y + size - eyeOffset;
            tongueX = x + size / 2;
            tongueY = y + size;
            tongueDirX = 0;
            tongueDirY = 1;
        } else {
            eyeX1 = x + eyeOffset;
            eyeY1 = y + eyeOffset;
            eyeX2 = x + size - eyeOffset;
            eyeY2 = y + eyeOffset;
            tongueX = x + size / 2;
            tongueY = y;
            tongueDirX = 0;
            tongueDirY = -1;
        }
        
        this.drawTongue(tongueX, tongueY, tongueDirX, tongueDirY, size, time);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(eyeX1 + 1, eyeY1 + 1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2 + 1, eyeY2 + 1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(
            eyeX1 + this.direction.x * pupilSize / 1.2,
            eyeY1 + this.direction.y * pupilSize / 1.2,
            pupilSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            eyeX2 + this.direction.x * pupilSize / 1.2,
            eyeY2 + this.direction.y * pupilSize / 1.2,
            pupilSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(eyeX1 - eyeSize / 3, eyeY1 - eyeSize / 3, eyeSize / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2 - eyeSize / 3, eyeY2 - eyeSize / 3, eyeSize / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTongue(baseX, baseY, dirX, dirY, size, time) {
        const ctx = this.ctx;
        const tongueLength = size * 0.5;
        const tongueWidth = size * 0.22;
        const wiggle = Math.sin(time * 12) * tongueWidth * 0.25;
        
        const midX = baseX + dirX * tongueLength * 0.5;
        const midY = baseY + dirY * tongueLength * 0.5;
        const endX = baseX + dirX * tongueLength;
        const endY = baseY + dirY * tongueLength;
        
        const forkLength = tongueLength * 0.35;
        const forkSpread = tongueWidth * 0.7;
        
        const leftForkEndX = endX + dirX * forkLength - dirY * forkSpread;
        const leftForkEndY = endY + dirY * forkLength + dirX * forkSpread;
        
        const rightForkEndX = endX + dirX * forkLength + dirY * forkSpread;
        const rightForkEndY = endY + dirY * forkLength - dirX * forkSpread;
        
        ctx.strokeStyle = JUNGLE_COLORS.TONGUE_DARK;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(baseX - dirY * tongueWidth / 2, baseY - dirX * tongueWidth / 2);
        ctx.quadraticCurveTo(
            midX - dirY * tongueWidth / 3 + wiggle,
            midY + dirX * tongueWidth / 3,
            endX - dirY * tongueWidth / 2,
            endY + dirX * tongueWidth / 4
        );
        ctx.quadraticCurveTo(
            endX + dirX * forkLength * 0.3 - dirY * forkSpread * 0.5,
            endY + dirY * forkLength * 0.3 + dirX * forkSpread * 0.5,
            leftForkEndX,
            leftForkEndY
        );
        ctx.quadraticCurveTo(
            endX + dirX * forkLength * 0.5 - dirY * forkSpread * 0.3,
            endY + dirY * forkLength * 0.5 + dirX * forkSpread * 0.3,
            endX,
            endY
        );
        ctx.quadraticCurveTo(
            endX + dirX * forkLength * 0.5 + dirY * forkSpread * 0.3,
            endY + dirY * forkLength * 0.5 - dirX * forkSpread * 0.3,
            rightForkEndX,
            rightForkEndY
        );
        ctx.quadraticCurveTo(
            endX + dirX * forkLength * 0.3 + dirY * forkSpread * 0.5,
            endY + dirY * forkLength * 0.3 - dirX * forkSpread * 0.5,
            endX + dirY * tongueWidth / 2,
            endY - dirX * tongueWidth / 4
        );
        ctx.quadraticCurveTo(
            midX + dirY * tongueWidth / 3 + wiggle,
            midY - dirX * tongueWidth / 3,
            baseX + dirY * tongueWidth / 2,
            baseY + dirX * tongueWidth / 2
        );
        ctx.closePath();
        
        const tongueGradient = ctx.createLinearGradient(
            baseX - dirY * tongueWidth,
            baseY - dirX * tongueWidth,
            baseX + dirX * tongueLength,
            baseY + dirY * tongueLength
        );
        tongueGradient.addColorStop(0, JUNGLE_COLORS.TONGUE_PINK);
        tongueGradient.addColorStop(0.5, JUNGLE_COLORS.TONGUE_RED);
        tongueGradient.addColorStop(1, JUNGLE_COLORS.TONGUE_DARK);
        
        ctx.fillStyle = tongueGradient;
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 200, 220, 0.5)';
        ctx.beginPath();
        ctx.ellipse(
            baseX + dirX * tongueLength * 0.25,
            baseY + dirY * tongueLength * 0.25,
            tongueWidth * 0.25,
            tongueWidth * 0.15,
            Math.atan2(dirY, dirX),
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    drawFood() {
        const ctx = this.ctx;
        const x = this.food.x * this.cellSize;
        const y = this.food.y * this.cellSize;
        const size = this.cellSize;
        const time = performance.now() / 1000;
        
        const bounce = Math.sin(time * 2.5) * 3;
        const rotation = Math.sin(time * 1.5) * 0.1;
        const scale = 1 + Math.sin(time * 3) * 0.03;
        
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2 + bounce);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        const glowRadius = size / 1.2;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, this.foodType.color + '99');
        gradient.addColorStop(0.5, this.foodType.color + '44');
        gradient.addColorStop(1, this.foodType.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        
        ctx.font = size * 0.85 + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.foodType.emoji, 0, 0);
        
        ctx.restore();
    }

    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    drawCountdown() {
        const ctx = this.ctx;
        const width = this.gameCanvas.width;
        const height = this.gameCanvas.height;
        const time = performance.now() / 1000;
        
        ctx.fillStyle = 'rgba(13, 31, 20, 0.6)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = JUNGLE_COLORS.TEXT_PRIMARY;
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('准备开始...', width / 2, height / 2 - 90);
        
        const pulseScale = 1 + Math.sin(time * 6) * 0.08;
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(pulseScale, pulseScale);
        
        ctx.font = 'bold 110px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.ACCENT_GOLD;
        ctx.shadowColor = JUNGLE_COLORS.ACCENT_GOLD;
        ctx.shadowBlur = 25;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayText = this.countdownValue > 0 ? this.countdownValue : '开始！';
        ctx.fillText(displayText, 0, 0);
        
        ctx.restore();
        
        ctx.shadowBlur = 0;
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.TEXT_SECONDARY;
        ctx.textAlign = 'center';
        ctx.fillText('使用方向键控制方向，空格键加速', width / 2, height / 2 + 70);
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        const width = this.gameCanvas.width;
        const height = this.gameCanvas.height;
        
        ctx.fillStyle = 'rgba(13, 31, 20, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = JUNGLE_COLORS.TEXT_PRIMARY;
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸️ 游戏暂停', width / 2, height / 2 - 25);
        
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.TEXT_SECONDARY;
        ctx.textAlign = 'center';
        ctx.fillText('按 P 键继续游戏', width / 2, height / 2 + 25);
    }

    handleInput(eventType, event) {
        if (this.isGameOver) return;
        
        if (eventType === 'keydown') {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y !== 1) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                    event.preventDefault();
                    break;
                    
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y !== -1) {
                        this.nextDirection = { x: 0, y: 1 };
                    }
                    event.preventDefault();
                    break;
                    
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x !== 1) {
                        this.nextDirection = { x: -1, y: 0 };
                    }
                    event.preventDefault();
                    break;
                    
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x !== -1) {
                        this.nextDirection = { x: 1, y: 0 };
                    }
                    event.preventDefault();
                    break;
                    
                case ' ':
                    if (!this.isBoosting && !this.isWaiting) {
                        this.isBoosting = true;
                        this.currentSpeed = BOOST_SPEED;
                        this.updateSpeedIndicator();
                    }
                    event.preventDefault();
                    break;
                    
                case 'p':
                case 'P':
                    if (this.isWaiting) return;
                    if (this.isPaused) {
                        this.resume();
                    } else {
                        this.pause();
                    }
                    break;
            }
        } else if (eventType === 'keyup') {
            if (event.key === ' ') {
                this.isBoosting = false;
                this.currentSpeed = this.baseSpeed;
                this.updateSpeedIndicator();
            }
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        const scoreEl = document.getElementById('current-score');
        if (scoreEl) {
            scoreEl.textContent = this.score;
        }
    }

    updateLengthDisplay(length) {
        const lengthEl = document.getElementById('snake-length');
        if (lengthEl) {
            lengthEl.textContent = length;
        }
    }

    updateHighScoreDisplay() {
        const highScoreEl = document.getElementById('high-score');
        if (highScoreEl) {
            highScoreEl.textContent = this.highScore;
        }
    }

    updateSpeedIndicator() {
        const indicator = document.getElementById('speed-indicator');
        
        if (indicator) {
            if (this.isBoosting) {
                indicator.textContent = '🚀 加速中';
                indicator.style.color = JUNGLE_COLORS.ACCENT_GOLD;
                indicator.parentElement.style.background = 'rgba(249, 202, 36, 0.15)';
                indicator.parentElement.style.border = '1px solid rgba(249, 202, 36, 0.3)';
            } else {
                indicator.textContent = '🐢 正常';
                indicator.style.color = JUNGLE_COLORS.TEXT_PRIMARY;
                indicator.parentElement.style.background = 'rgba(0, 0, 0, 0.2)';
                indicator.parentElement.style.border = 'none';
            }
        }
    }

    lerp(start, end, t) {
        return Math.round(start + (end - start) * t);
    }
}
