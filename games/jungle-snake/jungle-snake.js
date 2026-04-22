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
    GRASS_DARK: '#2ed573'
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
        this.score = 0;
        this.highScore = this.loadHighScore();
        
        this.particles = [];
        this.grassDecorations = [];
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
        this.createGameUI();
        this.audioManager.init();
        this.setupGrid();
        this.generateGrassDecorations();
        console.log('丛林贪吃蛇游戏已初始化');
    }

    createGameUI() {
        this.canvas.innerHTML = '';
        this.canvas.style.cssText = `
            background: linear-gradient(180deg, ${JUNGLE_COLORS.DARK_FOREST} 0%, ${JUNGLE_COLORS.FOREST_GREEN} 50%, ${JUNGLE_COLORS.LEAF_GREEN} 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
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
        `;
        document.head.appendChild(style);

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'jungle-snake-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            width: 100%;
            max-width: 700px;
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
            max-width: 600px;
            padding: 12px 24px;
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
            gap: 2px;
        `;
        scoreDisplay.innerHTML = `
            <span style="font-size: 0.85rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">当前分数</span>
            <span id="current-score" style="font-size: 1.8rem; font-weight: 800; color: ${JUNGLE_COLORS.ACCENT_GOLD}; text-shadow: 0 0 10px rgba(249, 202, 36, 0.5);">0</span>
        `;

        const highScoreDisplay = document.createElement('div');
        highScoreDisplay.className = 'high-score-display';
        highScoreDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        `;
        highScoreDisplay.innerHTML = `
            <span style="font-size: 0.85rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">最高纪录</span>
            <span id="high-score" style="font-size: 1.8rem; font-weight: 800; color: ${JUNGLE_COLORS.LIME_GREEN}; text-shadow: 0 0 10px rgba(109, 191, 122, 0.5);">${this.highScore}</span>
        `;

        const speedDisplay = document.createElement('div');
        speedDisplay.className = 'speed-display';
        speedDisplay.id = 'speed-display';
        speedDisplay.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            transition: all 0.3s ease;
        `;
        speedDisplay.innerHTML = `
            <span style="font-size: 0.85rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY}; font-weight: 600;">速度</span>
            <span id="speed-indicator" style="font-size: 1rem; font-weight: 700; color: ${JUNGLE_COLORS.TEXT_PRIMARY};">🐢 正常</span>
        `;

        hud.appendChild(scoreDisplay);
        hud.appendChild(speedDisplay);
        hud.appendChild(highScoreDisplay);

        this.gameContainer.appendChild(hud);
    }

    createGameCanvas() {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'game-canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            padding: 6px;
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
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
            padding: 10px 20px;
            background: rgba(26, 58, 37, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid ${JUNGLE_COLORS.MOSS_GREEN};
        `;

        const controlItems = [
            { key: '↑↓←→', desc: '方向键移动' },
            { key: '空格', desc: '按住加速' },
            { key: 'P/ESC', desc: '暂停/返回' }
        ];

        controlItems.forEach(item => {
            const controlEl = document.createElement('div');
            controlEl.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            controlEl.innerHTML = `
                <span style="padding: 4px 10px; background: ${JUNGLE_COLORS.MOSS_GREEN}; border-radius: 6px; font-weight: 700; font-size: 0.85rem; color: ${JUNGLE_COLORS.TEXT_PRIMARY};">${item.key}</span>
                <span style="font-size: 0.85rem; color: ${JUNGLE_COLORS.TEXT_SECONDARY};">${item.desc}</span>
            `;
            controls.appendChild(controlEl);
        });

        this.gameContainer.appendChild(controls);
    }

    setupGrid() {
        const containerWidth = Math.min(this.canvas.clientWidth - 40, 600);
        const containerHeight = Math.min(this.canvas.clientHeight - 200, 500);
        
        const size = Math.min(containerWidth, containerHeight);
        this.gameCanvas.width = size;
        this.gameCanvas.height = size;
        
        this.cellSize = Math.floor(size / GRID_SIZE);
        this.gridWidth = Math.floor(size / this.cellSize);
        this.gridHeight = this.gridWidth;
    }

    generateGrassDecorations() {
        this.grassDecorations = [];
        for (let i = 0; i < 30; i++) {
            this.grassDecorations.push({
                x: Math.random() * this.gameCanvas.width,
                y: Math.random() * this.gameCanvas.height,
                size: 8 + Math.random() * 12,
                rotation: Math.random() * 360,
                swayOffset: Math.random() * Math.PI * 2,
                opacity: 0.15 + Math.random() * 0.25
            });
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;
        this.score = 0;
        this.updateScore(0);
        
        this.resetGame();
        this.gameLoop();
        this.audioManager.playSound('perfect', { pitch: 1.0, volume: 0.4 });
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
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        
        if (!this.isPaused && !this.isGameOver) {
            if (currentTime - this.lastMoveTime >= this.currentSpeed) {
                this.moveSnake();
                this.lastMoveTime = currentTime;
            }
            this.updateParticles();
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
        
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 6,
                color: color,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
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
            <div style="font-size: 4.5rem; margin-bottom: 20px;">${isNewHighScore ? '🏆' : '💀'}</div>
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
        
        this.drawGrass();
        this.drawGrid();
        
        if (this.food) {
            this.drawFood();
        }
        
        this.drawSnake();
        this.drawParticles();
        
        if (this.isPaused && !this.isGameOver) {
            this.drawPauseOverlay();
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
            
            ctx.fillStyle = JUNGLE_COLORS.GRASS_DARK;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(grass.size / 3, -grass.size / 2, 0, -grass.size);
            ctx.quadraticCurveTo(-grass.size / 3, -grass.size / 2, 0, 0);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(74, 124, 89, 0.15)';
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
        const padding = 2;
        
        for (let i = this.snake.length - 1; i >= 0; i--) {
            const segment = this.snake[i];
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            const size = this.cellSize - padding * 2;
            
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
            
            const color = `rgb(${r}, ${g}, ${b})`;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            const radius = i === 0 ? size / 2.5 : size / 3.5;
            ctx.roundRect(x + padding, y + padding, size, size, radius);
            ctx.fill();
            
            ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
            ctx.beginPath();
            ctx.roundRect(x + padding + 2, y + padding + 2, size / 2, size / 3, size / 6);
            ctx.fill();
            
            if (i === 0) {
                this.drawSnakeEyes(x + padding, y + padding, size);
            }
        }
    }

    drawSnakeEyes(x, y, size) {
        const ctx = this.ctx;
        const eyeSize = size / 5;
        const eyeOffset = size / 4;
        
        ctx.fillStyle = '#ffffff';
        
        let eyeX1, eyeY1, eyeX2, eyeY2;
        
        if (this.direction.x === 1) {
            eyeX1 = x + size - eyeOffset;
            eyeY1 = y + eyeOffset;
            eyeX2 = x + size - eyeOffset;
            eyeY2 = y + size - eyeOffset;
        } else if (this.direction.x === -1) {
            eyeX1 = x + eyeOffset;
            eyeY1 = y + eyeOffset;
            eyeX2 = x + eyeOffset;
            eyeY2 = y + size - eyeOffset;
        } else if (this.direction.y === 1) {
            eyeX1 = x + eyeOffset;
            eyeY1 = y + size - eyeOffset;
            eyeX2 = x + size - eyeOffset;
            eyeY2 = y + size - eyeOffset;
        } else {
            eyeX1 = x + eyeOffset;
            eyeY1 = y + eyeOffset;
            eyeX2 = x + size - eyeOffset;
            eyeY2 = y + eyeOffset;
        }
        
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a1a';
        const pupilSize = eyeSize / 2;
        ctx.beginPath();
        ctx.arc(eyeX1 + this.direction.x * pupilSize / 2, eyeY1 + this.direction.y * pupilSize / 2, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX2 + this.direction.x * pupilSize / 2, eyeY2 + this.direction.y * pupilSize / 2, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFood() {
        const ctx = this.ctx;
        const x = this.food.x * this.cellSize;
        const y = this.food.y * this.cellSize;
        const size = this.cellSize;
        const time = performance.now() / 1000;
        
        const bounce = Math.sin(time * 3) * 3;
        const rotation = Math.sin(time * 2) * 0.1;
        
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2 + bounce);
        ctx.rotate(rotation);
        
        const glowRadius = size / 1.5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, this.foodType.color + '60');
        gradient.addColorStop(1, this.foodType.color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
        
        ctx.font = `${size * 0.8}px Arial`;
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
        ctx.fillText('⏸️ 暂停', width / 2, height / 2 - 20);
        
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillStyle = JUNGLE_COLORS.TEXT_SECONDARY;
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
                    if (!this.isBoosting) {
                        this.isBoosting = true;
                        this.currentSpeed = BOOST_SPEED;
                        this.updateSpeedIndicator();
                    }
                    event.preventDefault();
                    break;
                    
                case 'p':
                case 'P':
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
                display.style.background = 'rgba(249, 202, 36, 0.2)';
                display.style.borderColor = JUNGLE_COLORS.ACCENT_GOLD;
            } else {
                indicator.textContent = '🐢 正常';
                indicator.style.color = JUNGLE_COLORS.TEXT_PRIMARY;
                display.style.background = 'rgba(0, 0, 0, 0.2)';
                display.style.borderColor = 'transparent';
            }
        }
    }

    lerp(start, end, t) {
        return Math.round(start + (end - start) * t);
    }
}
