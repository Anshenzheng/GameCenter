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
    TONGUE_RED: '#ff6b6b',
    TONGUE_DARK: '#c0392b'
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

const GRID_SIZE = 30;
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
        this.grassDecorations = [];
        this.fireflies = [];
        this.fallingLeaves = [];
        this.mushroomDecorations = [];
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
        this.generateDecorations();
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
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            overflow: hidden;
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
            @keyframes grass-sway {
                0%, 100% { transform: rotate(-5deg); }
                50% { transform: rotate(5deg); }
            }
            @keyframes leaf-fall {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
            }
            @keyframes countdown-pop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.3); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes firefly-glow {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes float-up {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'jungle-snake-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
            height: 100%;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        `;

        this.createHUD();
        this.createGameCanvas();
        this.createControls();

        this.canvas.appendChild(this.gameContainer);
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.className = 'snake-hud';
        hud.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 750px;
            padding: 15px 30px;
            background: linear-gradient(135deg, rgba(26, 58, 37, 0.95), rgba(45, 90, 61, 0.95));
            backdrop-filter: blur(15px);
            border: 2px solid ${JUNGLE_COLORS.MOSS_GREEN};
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            min-width: 120px;
        `;
        scoreDisplay.innerHTML = `
            <span style="font-size: 0.8rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">当前分数</span>
            <span id="current-score" style="font-size: 2.2rem; font-weight: 800; color: ${JUNGLE_COLORS.ACCENT_GOLD}; text-shadow: 0 0 15px rgba(249, 202, 36, 0.6);">0</span>
        `;

        const lengthDisplay = document.createElement('div');
        lengthDisplay.className = 'length-display';
        lengthDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            min-width: 120px;
        `;
        lengthDisplay.innerHTML = `
            <span style="font-size: 0.8rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">蛇身长度</span>
            <span id="snake-length" style="font-size: 2.2rem; font-weight: 800; color: ${JUNGLE_COLORS.LIME_GREEN}; text-shadow: 0 0 15px rgba(109, 191, 122, 0.6);">${INITIAL_SNAKE_LENGTH}</span>
        `;

        const highScoreDisplay = document.createElement('div');
        highScoreDisplay.className = 'high-score-display';
        highScoreDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            min-width: 120px;
        `;
        highScoreDisplay.innerHTML = `
            <span style="font-size: 0.8rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">最高纪录</span>
            <span id="high-score" style="font-size: 2.2rem; font-weight: 800; color: ${JUNGLE_COLORS.ACCENT_GOLD}; text-shadow: 0 0 15px rgba(249, 202, 36, 0.6);">${this.highScore}</span>
        `;

        const speedDisplay = document.createElement('div');
        speedDisplay.className = 'speed-display';
        speedDisplay.id = 'speed-display';
        speedDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            min-width: 120px;
            transition: all 0.3s ease;
        `;
        speedDisplay.innerHTML = `
            <span style="font-size: 0.8rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">速度状态</span>
            <span id="speed-indicator" style="font-size: 1.1rem; font-weight: 700; color: ${JUNGLE_COLORS.TEXT_PRIMARY};">🐢 正常</span>
        `;

        hud.appendChild(scoreDisplay);
        hud.appendChild(lengthDisplay);
        hud.appendChild(speedDisplay);
        hud.appendChild(highScoreDisplay);

        this.gameContainer.appendChild(hud);
    }

    createGameCanvas() {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'game-canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            padding: 8px;
            background: linear-gradient(135deg, ${JUNGLE_COLORS.MOSS_GREEN}, ${JUNGLE_COLORS.LIME_GREEN});
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1);
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

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'controls-hint';
        controls.style.cssText = `
            display: flex;
            gap: 25px;
            justify-content: center;
            flex-wrap: wrap;
            padding: 12px 25px;
            background: rgba(26, 58, 37, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid ${JUNGLE_COLORS.MOSS_GREEN};
        `;

        const controlItems = [
            { key: '↑↓←→ / WASD', desc: '控制方向', icon: '🎮' },
            { key: '空格', desc: '按住加速 (双倍得分)', icon: '⚡' },
            { key: 'P键', desc: '暂停游戏', icon: '⏸️' }
        ];

        controlItems.forEach(item => {
            const controlEl = document.createElement('div');
            controlEl.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            controlEl.innerHTML = `
                <span style="font-size: 1.3rem;">${item.icon}</span>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="padding: 3px 10px; background: ${JUNGLE_COLORS.MOSS_GREEN}; border-radius: 6px; font-weight: 700; font-size: 0.8rem; color: ${JUNGLE_COLORS.TEXT_PRIMARY};">${item.key}</span>
                    <span style="font-size: 0.75rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY};">${item.desc}</span>
                </div>
            `;
            controls.appendChild(controlEl);
        });

        this.gameContainer.appendChild(controls);
    }

    setupGrid() {
        const containerWidth = Math.min(this.canvas.clientWidth - 60, 850);
        const containerHeight = this.canvas.clientHeight - 220;
        
        const size = Math.min(containerWidth, containerHeight);
        this.gameCanvas.width = size;
        this.gameCanvas.height = size;
        
        this.cellSize = Math.floor(size / GRID_SIZE);
        this.gridWidth = Math.floor(size / this.cellSize);
        this.gridHeight = this.gridWidth;
    }

    generateDecorations() {
        this.grassDecorations = [];
        for (let i = 0; i < 50; i++) {
            this.grassDecorations.push({
                x: Math.random() * this.gameCanvas.width,
                y: Math.random() * this.gameCanvas.height,
                size: 10 + Math.random() * 15,
                rotation: Math.random() * 360,
                swayOffset: Math.random() * Math.PI * 2,
                opacity: 0.12 + Math.random() * 0.2,
                type: Math.floor(Math.random() * 3)
            });
        }

        this.fireflies = [];
        for (let i = 0; i < 15; i++) {
            this.fireflies.push({
                x: Math.random() * this.gameCanvas.width,
                y: Math.random() * this.gameCanvas.height,
                size: 3 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                phase: Math.random() * Math.PI * 2,
                glowPhase: Math.random() * Math.PI * 2
            });
        }

        this.fallingLeaves = [];
        for (let i = 0; i < 12; i++) {
            this.fallingLeaves.push({
                x: Math.random() * this.gameCanvas.width,
                y: -Math.random() * this.gameCanvas.height,
                size: 8 + Math.random() * 10,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 3,
                fallSpeed: 0.3 + Math.random() * 0.5,
                swayAmplitude: 20 + Math.random() * 30,
                swaySpeed: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                color: ['#4a7c59', '#6dbf7a', '#8bc34a', '#aed581', '#c5e1a5'][Math.floor(Math.random() * 5)]
            });
        }

        this.mushroomDecorations = [];
        for (let i = 0; i < 8; i++) {
            this.mushroomDecorations.push({
                x: Math.random() * this.gameCanvas.width,
                y: Math.random() * this.gameCanvas.height,
                size: 12 + Math.random() * 18,
                color: ['#e74c3c', '#e67e22', '#f39c12'][Math.floor(Math.random() * 3)]
            });
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
            this.updateFireflies();
            this.updateFallingLeaves();
        }
        
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
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

    updateFireflies() {
        const time = performance.now() / 1000;
        
        this.fireflies.forEach(firefly => {
            firefly.x += firefly.vx;
            firefly.y += firefly.vy;
            firefly.phase += 0.02;
            firefly.glowPhase += 0.05;
            
            if (firefly.x < 0 || firefly.x > this.gameCanvas.width) {
                firefly.vx *= -1;
            }
            if (firefly.y < 0 || firefly.y > this.gameCanvas.height) {
                firefly.vy *= -1;
            }
            
            if (Math.random() < 0.01) {
                firefly.vx += (Math.random() - 0.5) * 0.2;
                firefly.vy += (Math.random() - 0.5) * 0.2;
                
                const maxSpeed = 1.5;
                firefly.vx = Math.max(-maxSpeed, Math.min(maxSpeed, firefly.vx));
                firefly.vy = Math.max(-maxSpeed, Math.min(maxSpeed, firefly.vy));
            }
        });
    }

    updateFallingLeaves() {
        const time = performance.now() / 1000;
        
        this.fallingLeaves.forEach(leaf => {
            leaf.y += leaf.fallSpeed;
            leaf.rotation += leaf.rotationSpeed;
            leaf.phase += 0.03;
            
            if (leaf.y > this.gameCanvas.height + 20) {
                leaf.y = -20;
                leaf.x = Math.random() * this.gameCanvas.width;
            }
        });
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
        
        this.drawBackgroundDecorations();
        this.drawGrass();
        this.drawMushroomDecorations();
        this.drawFireflies();
        this.drawFallingLeaves();
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

    drawBackgroundDecorations() {
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
        gradient.addColorStop(0, 'rgba(45, 90, 61, 0.3)');
        gradient.addColorStop(1, 'rgba(13, 31, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        for (let i = 0; i < 5; i++) {
            const x = (i * this.gameCanvas.width / 4) + Math.sin(time * 0.3 + i) * 20;
            const y = (i * this.gameCanvas.height / 4) + Math.cos(time * 0.2 + i * 0.5) * 15;
            
            const vignette = ctx.createRadialGradient(x, y, 0, x, y, 80);
            const alpha = 0.05 + Math.sin(time + i) * 0.02;
            vignette.addColorStop(0, 'rgba(74, 124, 89, ' + alpha + ')');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = vignette;
            ctx.fillRect(x - 80, y - 80, 160, 160);
        }
    }

    drawGrass() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        this.grassDecorations.forEach(grass => {
            ctx.save();
            ctx.translate(grass.x, grass.y);
            ctx.rotate((grass.rotation + Math.sin(time + grass.swayOffset) * 5) * Math.PI / 180);
            ctx.globalAlpha = grass.opacity;
            
            const colors = [JUNGLE_COLORS.GRASS_DARK, JUNGLE_COLORS.GRASS_LIGHT, JUNGLE_COLORS.MOSS_GREEN];
            ctx.fillStyle = colors[grass.type];
            
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 4 - 4, 0);
                ctx.quadraticCurveTo(i * 4 - 4 + grass.size / 4, -grass.size / 2, i * 4 - 4, -grass.size);
                ctx.quadraticCurveTo(i * 4 - 4 - grass.size / 4, -grass.size / 2, i * 4 - 4, 0);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawMushroomDecorations() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        this.mushroomDecorations.forEach(mushroom => {
            ctx.save();
            ctx.globalAlpha = 0.15;
            
            ctx.fillStyle = '#f5deb3';
            ctx.beginPath();
            ctx.roundRect(mushroom.x - mushroom.size * 0.15, mushroom.y, mushroom.size * 0.3, mushroom.size * 0.5, 2);
            ctx.fill();
            
            ctx.fillStyle = mushroom.color;
            ctx.beginPath();
            ctx.arc(mushroom.x, mushroom.y, mushroom.size * 0.4, Math.PI, 0);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(mushroom.x - mushroom.size * 0.15, mushroom.y - mushroom.size * 0.15, mushroom.size * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(mushroom.x + mushroom.size * 0.1, mushroom.y - mushroom.size * 0.25, mushroom.size * 0.06, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawFireflies() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        this.fireflies.forEach(firefly => {
            const glowIntensity = 0.3 + Math.sin(firefly.glowPhase) * 0.7;
            
            ctx.save();
            ctx.globalAlpha = glowIntensity;
            
            const glowSize = firefly.size * (2 + Math.sin(firefly.glowPhase) * 1.5);
            const gradient = ctx.createRadialGradient(
                firefly.x, firefly.y, 0,
                firefly.x, firefly.y, glowSize
            );
            gradient.addColorStop(0, JUNGLE_COLORS.FIREFLY + 'cc');
            gradient.addColorStop(0.5, JUNGLE_COLORS.FIREFLY + '44');
            gradient.addColorStop(1, JUNGLE_COLORS.FIREFLY + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(firefly.x, firefly.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(firefly.x, firefly.y, firefly.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawFallingLeaves() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        this.fallingLeaves.forEach(leaf => {
            ctx.save();
            
            const swayX = Math.sin(leaf.phase) * leaf.swayAmplitude;
            const drawX = leaf.x + swayX;
            
            ctx.translate(drawX, leaf.y);
            ctx.rotate(leaf.rotation * Math.PI / 180);
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = leaf.color;
            
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size / 2);
            ctx.quadraticCurveTo(leaf.size / 2, 0, 0, leaf.size / 2);
            ctx.quadraticCurveTo(-leaf.size / 2, 0, 0, -leaf.size / 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -leaf.size / 3);
            ctx.lineTo(0, leaf.size / 3);
            ctx.stroke();
            
            ctx.restore();
        });
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(74, 124, 89, 0.1)';
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
            const segmentScale = isHead ? 1.0 : 0.85 - (i / this.snake.length) * 0.2;
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
            
            ctx.fillStyle = color;
            ctx.beginPath();
            const radius = isHead ? actualSize / 2.2 : actualSize / 3;
            ctx.roundRect(drawX, drawY, actualSize, actualSize, radius);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (isHead ? 0.25 : 0.15) + ')';
            ctx.beginPath();
            ctx.roundRect(drawX + 2, drawY + 2, actualSize / 2, actualSize / 3, actualSize / 6);
            ctx.fill();
            
            if (isHead) {
                this.drawSnakeHead(drawX, drawY, actualSize);
            }
        }
    }

    drawSnakeHead(x, y, size) {
        const ctx = this.ctx;
        const eyeSize = size / 4.5;
        const eyeOffset = size / 3.5;
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
            eyeX1 + this.direction.x * pupilSize / 1.5,
            eyeY1 + this.direction.y * pupilSize / 1.5,
            pupilSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            eyeX2 + this.direction.x * pupilSize / 1.5,
            eyeY2 + this.direction.y * pupilSize / 1.5,
            pupilSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(eyeX1 - eyeSize / 4, eyeY1 - eyeSize / 4, eyeSize / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2 - eyeSize / 4, eyeY2 - eyeSize / 4, eyeSize / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTongue(baseX, baseY, dirX, dirY, size, time) {
        const ctx = this.ctx;
        const tongueLength = size * 0.6;
        const tongueWidth = size * 0.2;
        const flickAmount = Math.sin(time * 15) * tongueWidth * 0.3;
        
        const midX = baseX + dirX * tongueLength * 0.5;
        const midY = baseY + dirY * tongueLength * 0.5;
        const endX = baseX + dirX * tongueLength;
        const endY = baseY + dirY * tongueLength;
        
        ctx.fillStyle = JUNGLE_COLORS.TONGUE_RED;
        ctx.strokeStyle = JUNGLE_COLORS.TONGUE_DARK;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(baseX - dirY * tongueWidth / 2, baseY - dirX * tongueWidth / 2);
        ctx.lineTo(midX - dirY * tongueWidth / 3 + flickAmount, midY + dirX * tongueWidth / 3);
        ctx.lineTo(endX - dirY * tongueWidth / 2, endY + dirX * tongueWidth / 4);
        
        const forkLength = tongueLength * 0.3;
        const forkWidth = tongueWidth * 0.6;
        
        ctx.lineTo(endX + dirX * forkLength * 0.5 - dirY * forkWidth / 2, endY + dirY * forkLength * 0.5 + dirX * forkWidth / 2);
        ctx.lineTo(endX + dirX * forkLength, endY + dirY * forkLength);
        ctx.lineTo(endX + dirX * forkLength * 0.5 + dirY * forkWidth / 2, endY + dirY * forkLength * 0.5 - dirX * forkWidth / 2);
        ctx.lineTo(endX + dirY * tongueWidth / 2, endY - dirX * tongueWidth / 4);
        ctx.lineTo(midX + dirY * tongueWidth / 3 + flickAmount, midY - dirX * tongueWidth / 3);
        ctx.lineTo(baseX + dirY * tongueWidth / 2, baseY + dirX * tongueWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 150, 150, 0.4)';
        ctx.beginPath();
        ctx.ellipse(
            baseX + dirX * tongueLength * 0.3 - dirY * tongueWidth * 0.1,
            baseY + dirY * tongueLength * 0.3 + dirX * tongueWidth * 0.1,
            tongueWidth * 0.2,
            tongueLength * 0.15,
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
        
        const bounce = Math.sin(time * 3) * 4;
        const rotation = Math.sin(time * 2) * 0.15;
        const scale = 1 + Math.sin(time * 4) * 0.05;
        
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2 + bounce);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        const glowRadius = size / 1.3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, this.foodType.color + '80');
        gradient.addColorStop(0.5, this.foodType.color + '30');
        gradient.addColorStop(1, this.foodType.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        
        ctx.font = size * 0.9 + 'px Arial';
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
        ctx.font = 'bold 28px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('准备开始...', width / 2, height / 2 - 100);
        
        const pulseScale = 1 + Math.sin(time * 6) * 0.1;
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(pulseScale, pulseScale);
        
        ctx.font = 'bold 120px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.ACCENT_GOLD;
        ctx.shadowColor = JUNGLE_COLORS.ACCENT_GOLD;
        ctx.shadowBlur = 30;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayText = this.countdownValue > 0 ? this.countdownValue : '开始！';
        ctx.fillText(displayText, 0, 0);
        
        ctx.restore();
        
        ctx.shadowBlur = 0;
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.TEXT_SECONDARY;
        ctx.textAlign = 'center';
        ctx.fillText('使用方向键控制方向，空格键加速', width / 2, height / 2 + 80);
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        const width = this.gameCanvas.width;
        const height = this.gameCanvas.height;
        const time = performance.now() / 1000;
        
        ctx.fillStyle = 'rgba(13, 31, 20, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = JUNGLE_COLORS.TEXT_PRIMARY;
        ctx.font = 'bold 52px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸️ 游戏暂停', width / 2, height / 2 - 30);
        
        ctx.font = '22px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.TEXT_SECONDARY;
        ctx.textAlign = 'center';
        ctx.fillText('按 P 键继续游戏', width / 2, height / 2 + 30);
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
        const display = document.getElementById('speed-display');
        
        if (indicator && display) {
            if (this.isBoosting) {
                indicator.textContent = '🚀 加速中';
                indicator.style.color = JUNGLE_COLORS.ACCENT_GOLD;
                display.style.background = 'rgba(249, 202, 36, 0.25)';
                display.style.border = '2px solid ' + JUNGLE_COLORS.ACCENT_GOLD;
            } else {
                indicator.textContent = '🐢 正常';
                indicator.style.color = JUNGLE_COLORS.TEXT_PRIMARY;
                display.style.background = 'rgba(0, 0, 0, 0.2)';
                display.style.border = '2px solid transparent';
            }
        }
    }

    lerp(start, end, t) {
        return Math.round(start + (end - start) * t);
    }
}
