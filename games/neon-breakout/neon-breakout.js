/**
 * 霓虹复古打砖块游戏 - Neon Breakout Game
 * 霓虹复古风格，发光特效，爆炸粒子，道具系统
 */

const NEON_COLORS = {
    DARK_BACKGROUND: '#0a0a1a',
    NEON_PINK: '#ff00ff',
    NEON_CYAN: '#00ffff',
    NEON_GREEN: '#39ff14',
    NEON_YELLOW: '#ffff00',
    NEON_ORANGE: '#ff6600',
    NEON_PURPLE: '#9932cc',
    NEON_BLUE: '#0066ff',
    NEON_RED: '#ff0040',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a0a0a0',
    GRID_COLOR: 'rgba(255, 255, 255, 0.05)'
};

const POWERUP_TYPES = {
    TRIPLE_SCORE: {
        id: 'triple-score',
        name: '三倍得分',
        color: NEON_COLORS.NEON_YELLOW,
        emoji: '⭐',
        duration: 5000
    },
    SUPER_HIT: {
        id: 'super-hit',
        name: '超强击球',
        color: NEON_COLORS.NEON_RED,
        emoji: '💥',
        duration: 5000
    },
    WIDE_PADDLE: {
        id: 'wide-paddle',
        name: '宽挡板',
        color: NEON_COLORS.NEON_CYAN,
        emoji: '⬛',
        duration: 5000
    },
    EXTRA_LIFE: {
        id: 'extra-life',
        name: '额外生命',
        color: NEON_COLORS.NEON_GREEN,
        emoji: '❤️',
        duration: 0
    }
};

const BRICK_TYPES = [
    { color: NEON_COLORS.NEON_PINK, points: 10, hits: 1 },
    { color: NEON_COLORS.NEON_CYAN, points: 20, hits: 1 },
    { color: NEON_COLORS.NEON_GREEN, points: 15, hits: 1 },
    { color: NEON_COLORS.NEON_YELLOW, points: 25, hits: 1 },
    { color: NEON_COLORS.NEON_ORANGE, points: 30, hits: 2 },
    { color: NEON_COLORS.NEON_PURPLE, points: 50, hits: 3 }
];

class NeonBreakoutGame extends GameInterface {
    static get metadata() {
        return {
            id: 'neon-breakout',
            name: '霓虹打砖块',
            description: '经典打砖块游戏，霓虹复古风格！用鼠标或方向键控制挡板，接住弹球消灭所有砖块！',
            icon: '🏓',
            colors: {
                primary: NEON_COLORS.NEON_PINK,
                secondary: NEON_COLORS.NEON_CYAN
            }
        };
    }

    constructor(context) {
        super(context);
        this.canvas = context.canvas;
        this.gameCanvas = null;
        this.ctx = null;
        
        this.gameWidth = 800;
        this.gameHeight = 600;
        
        this.paddle = {
            width: 120,
            height: 20,
            x: 0,
            y: 0,
            speed: 8,
            scale: 1,
            targetScale: 1,
            color: NEON_COLORS.NEON_CYAN
        };
        
        this.ball = {
            x: 0,
            y: 0,
            radius: 10,
            dx: 4,
            dy: -4,
            baseSpeed: 4,
            currentSpeed: 4,
            speedMultiplier: 1,
            color: NEON_COLORS.NEON_PINK
        };
        
        this.bricks = [];
        this.brickRows = 6;
        this.brickCols = 10;
        this.brickWidth = 70;
        this.brickHeight = 25;
        this.brickPadding = 5;
        this.brickOffsetTop = 50;
        this.brickOffsetLeft = 35;
        
        this.particles = [];
        this.powerups = [];
        this.activePowerups = new Map();
        
        this.lives = 3;
        this.level = 1;
        this.gameStartTime = 0;
        this.lastSpeedIncrease = 0;
        this.speedIncreaseInterval = 10000;
        
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWaiting = false;
        this.countdownValue = 0;
        this.ballAttached = true;
        
        this.keys = {
            left: false,
            right: false
        };
        
        this.mouseX = 0;
        this.useMouseControl = true;
        
        this.audioManager = new AudioManager();
        this.scoreMultiplier = 1;
        this.superHitActive = false;
        this.widePaddleActive = false;
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        console.log('霓虹打砖块游戏已初始化');
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
            background: linear-gradient(180deg, ${NEON_COLORS.DARK_BACKGROUND} 0%, #0f0f2a 50%, ${NEON_COLORS.DARK_BACKGROUND} 100%);
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
                0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.2); }
                50% { box-shadow: 0 0 30px rgba(255, 0, 255, 0.7), 0 0 60px rgba(0, 255, 255, 0.4); }
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
            background: linear-gradient(135deg, rgba(255, 0, 255, 0.1), rgba(0, 255, 255, 0.1));
            backdrop-filter: blur(15px);
            border: 2px solid ${NEON_COLORS.NEON_PINK};
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1);
            flex-shrink: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${NEON_COLORS.NEON_CYAN};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${NEON_COLORS.NEON_PINK};
            margin-bottom: 2px;
            text-shadow: 0 0 10px ${NEON_COLORS.NEON_CYAN};
        `;
        title.innerHTML = '🏓 游戏状态';
        hud.appendChild(title);

        const items = [
            { id: 'breakout-score', label: '当前分数', value: '0', icon: '🎯', color: NEON_COLORS.NEON_YELLOW },
            { id: 'breakout-lives', label: '剩余生命', value: '❤️❤️❤️', icon: '💖', color: NEON_COLORS.NEON_RED },
            { id: 'breakout-level', label: '当前关卡', value: '1', icon: '🏆', color: NEON_COLORS.NEON_GREEN },
            { id: 'breakout-ball-speed', label: '球速状态', value: '正常', icon: '⚡', color: NEON_COLORS.NEON_CYAN }
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
                    <span style="font-size: 0.75rem; color: ${NEON_COLORS.TEXT_SECONDARY}; font-weight: 600;">${item.label}</span>
                </div>
                <span id="${item.id}" style="font-size: 0.95rem; font-weight: 800; color: ${item.color}; text-shadow: 0 0 5px ${item.color};">${item.value}</span>
            `;
            
            hud.appendChild(itemEl);
        });

        this.powerupsDisplay = document.createElement('div');
        this.powerupsDisplay.id = 'active-powerups';
        this.powerupsDisplay.style.cssText = `
            margin-top: 8px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            min-height: 40px;
        `;
        this.powerupsDisplay.innerHTML = `<div style="font-size: 0.7rem; color: ${NEON_COLORS.TEXT_SECONDARY}; text-align: center;">激活道具将显示在这里</div>`;
        hud.appendChild(this.powerupsDisplay);

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
            border: 2px solid ${NEON_COLORS.NEON_CYAN};
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(255, 0, 255, 0.1);
            flex-shrink: 0;
            min-height: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${NEON_COLORS.NEON_PINK};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${NEON_COLORS.NEON_CYAN};
            margin-bottom: 2px;
            text-shadow: 0 0 10px ${NEON_COLORS.NEON_PINK};
        `;
        title.innerHTML = '🎮 操作说明';
        controls.appendChild(title);

        const controlItems = [
            { keys: ['←', '→'], desc: '或 A/D 控制挡板' },
            { keys: ['鼠标'], desc: '移动控制挡板' },
            { keys: ['空格'], desc: '发射弹球' },
            { keys: ['P'], desc: '暂停游戏' }
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
                `<span style="padding: 3px 8px; background: ${NEON_COLORS.NEON_PINK}; border-radius: 5px; font-weight: 700; font-size: 0.75rem; color: ${NEON_COLORS.TEXT_PRIMARY}; text-shadow: 0 0 5px ${NEON_COLORS.NEON_PINK};">${k}</span>`
            ).join(' ');
            
            itemEl.innerHTML = `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">${keysDisplay}</div>
                <span style="font-size: 0.7rem; color: ${NEON_COLORS.TEXT_SECONDARY};">${item.desc}</span>
            `;
            
            controls.appendChild(itemEl);
        });

        const tip = document.createElement('div');
        tip.style.cssText = `
            margin-top: 8px;
            padding: 8px 10px;
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid rgba(255, 255, 0, 0.3);
            border-radius: 8px;
            font-size: 0.68rem;
            color: ${NEON_COLORS.TEXT_SECONDARY};
            line-height: 1.4;
        `;
        tip.innerHTML = '💡 <strong>小提示：</strong>收集掉落的道具获得特殊能力！球速会随时间增加，保持专注！';
        controls.appendChild(tip);

        this.rightPanel.appendChild(controls);
    }

    createGameCanvas() {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'game-canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            padding: 10px;
            background: linear-gradient(135deg, ${NEON_COLORS.NEON_PINK}, ${NEON_COLORS.NEON_CYAN});
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(255, 0, 255, 0.4), 0 0 60px rgba(0, 255, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.1);
            animation: glow-border 3s ease-in-out infinite;
        `;

        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.id = 'breakout-canvas';
        this.gameCanvas.style.cssText = `
            display: block;
            border-radius: 16px;
            background: ${NEON_COLORS.DARK_BACKGROUND};
            cursor: none;
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
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateScore(0);
        this.updateLivesDisplay();
        this.updateLevelDisplay();
        
        this.keys.left = false;
        this.keys.right = false;
        
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
                this.gameStartTime = performance.now();
                this.lastSpeedIncrease = this.gameStartTime;
                this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
            }
        }, 1000);
    }

    resetGame() {
        this.bricks = [];
        this.particles = [];
        this.powerups = [];
        this.activePowerups.clear();
        this.scoreMultiplier = 1;
        this.superHitActive = false;
        this.widePaddleActive = false;
        
        this.ball.currentSpeed = this.ball.baseSpeed;
        this.ball.speedMultiplier = 1;
        
        this.initBricks();
        this.resetBallAndPaddle();
        this.updatePowerupsDisplay();
    }

    initBricks() {
        for (let row = 0; row < this.brickRows; row++) {
            for (let col = 0; col < this.brickCols; col++) {
                const brickType = BRICK_TYPES[row % BRICK_TYPES.length];
                this.bricks.push({
                    x: col * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
                    y: row * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
                    width: this.brickWidth,
                    height: this.brickHeight,
                    color: brickType.color,
                    points: brickType.points,
                    hits: brickType.hits,
                    maxHits: brickType.hits,
                    row: row,
                    col: col
                });
            }
        }
    }

    resetBallAndPaddle() {
        this.paddle.width = this.widePaddleActive ? 180 : 120;
        this.paddle.x = this.gameWidth / 2 - this.paddle.width / 2;
        this.paddle.y = this.gameHeight - 50;
        this.paddle.scale = 1;
        this.paddle.targetScale = 1;
        
        this.ball.x = this.gameWidth / 2;
        this.ball.y = this.paddle.y - this.ball.radius;
        this.ball.dx = this.ball.currentSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -this.ball.currentSpeed;
        this.ballAttached = true;
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
        
        if (!this.isPaused && !this.isGameOver && !this.isWaiting) {
            this.update(currentTime);
        }
        
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    update(currentTime) {
        this.updatePaddle();
        
        if (this.ballAttached) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius;
        } else {
            this.updateBall();
            this.checkCollisions();
        }
        
        this.updateParticles();
        this.updatePowerups();
        this.updateActivePowerups(currentTime);
        this.updateBallSpeed(currentTime);
        this.updatePaddleAnimation();
    }

    updatePaddle() {
        let moveDir = 0;
        
        if (this.useMouseControl) {
            const canvasRect = this.gameCanvas.getBoundingClientRect();
            const targetX = this.mouseX - canvasRect.left;
            const diff = targetX - (this.paddle.x + this.paddle.width / 2);
            
            if (Math.abs(diff) > 2) {
                moveDir = diff > 0 ? 1 : -1;
                const moveSpeed = Math.min(Math.abs(diff), this.paddle.speed * 2);
                this.paddle.x += moveDir * moveSpeed;
            }
        }
        
        if (this.keys.left) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys.right) {
            this.paddle.x += this.paddle.speed;
        }
        
        this.paddle.x = Math.max(0, Math.min(this.gameWidth - this.paddle.width, this.paddle.x));
    }

    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        if (this.ball.x - this.ball.radius <= 0) {
            this.ball.x = this.ball.radius;
            this.ball.dx = Math.abs(this.ball.dx);
            this.onWallBounce();
        }
        if (this.ball.x + this.ball.radius >= this.gameWidth) {
            this.ball.x = this.gameWidth - this.ball.radius;
            this.ball.dx = -Math.abs(this.ball.dx);
            this.onWallBounce();
        }
        if (this.ball.y - this.ball.radius <= 0) {
            this.ball.y = this.ball.radius;
            this.ball.dy = Math.abs(this.ball.dy);
            this.onWallBounce();
        }
        
        if (this.ball.y + this.ball.radius >= this.gameHeight) {
            this.loseLife();
        }
    }

    checkCollisions() {
        this.checkPaddleCollision();
        this.checkBrickCollision();
        this.checkPowerupCollision();
    }

    checkPaddleCollision() {
        if (this.ball.dy > 0 &&
            this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.width) {
            
            this.ball.y = this.paddle.y - this.ball.radius;
            
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPos - 0.5) * Math.PI * 0.7;
            
            const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            this.ball.dx = Math.sin(angle) * speed;
            this.ball.dy = -Math.abs(Math.cos(angle) * speed);
            
            this.onPaddleHit();
        }
    }

    checkBrickCollision() {
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            
            if (this.ball.x + this.ball.radius > brick.x &&
                this.ball.x - this.ball.radius < brick.x + brick.width &&
                this.ball.y + this.ball.radius > brick.y &&
                this.ball.y - this.ball.radius < brick.y + brick.height) {
                
                const overlapLeft = (this.ball.x + this.ball.radius) - brick.x;
                const overlapRight = (brick.x + brick.width) - (this.ball.x - this.ball.radius);
                const overlapTop = (this.ball.y + this.ball.radius) - brick.y;
                const overlapBottom = (brick.y + brick.height) - (this.ball.y - this.ball.radius);
                
                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);
                
                if (minOverlapX < minOverlapY) {
                    this.ball.dx = -this.ball.dx;
                } else {
                    this.ball.dy = -this.ball.dy;
                }
                
                const damage = this.superHitActive ? 2 : 1;
                brick.hits -= damage;
                
                if (brick.hits <= 0) {
                    this.onBrickDestroy(brick, i);
                } else {
                    this.onBrickHit(brick);
                }
                
                this.onBallBounce();
                break;
            }
        }
    }

    checkPowerupCollision() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            if (powerup.y + powerup.size > this.paddle.y &&
                powerup.y < this.paddle.y + this.paddle.height &&
                powerup.x + powerup.size > this.paddle.x &&
                powerup.x < this.paddle.x + this.paddle.width) {
                
                this.collectPowerup(powerup);
                this.powerups.splice(i, 1);
            }
        }
    }

    onWallBounce() {
        this.triggerShake(5, 150);
        this.createBounceParticles(this.ball.x, this.ball.y, NEON_COLORS.NEON_CYAN);
        this.audioManager.playSound('hit', { pitch: 0.8, volume: 0.3 });
    }

    onBallBounce() {
        this.triggerShake(10, 200);
        this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.4 });
    }

    onPaddleHit() {
        this.paddle.targetScale = 0.85;
        this.createBounceParticles(this.ball.x, this.ball.y, this.paddle.color);
        this.triggerShake(8, 200);
        this.audioManager.playSound('perfect', { pitch: 1.2, volume: 0.5 });
    }

    onBrickHit(brick) {
        this.createHitParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
        this.audioManager.playSound('hit', { pitch: 1.1, volume: 0.4 });
    }

    onBrickDestroy(brick, index) {
        const points = brick.points * this.scoreMultiplier;
        this.score += points;
        this.updateScore(this.score);
        
        this.createExplosionParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
        this.bricks.splice(index, 1);
        
        if (Math.random() < 0.15) {
            this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
        
        this.audioManager.playSound('perfect', { pitch: 1.3 + Math.random() * 0.2, volume: 0.5 });
        
        if (this.bricks.length === 0) {
            this.levelComplete();
        }
    }

    createBounceParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: color,
                life: 1,
                decay: 0.03,
                type: 'bounce'
            });
        }
    }

    createHitParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: color,
                life: 1,
                decay: 0.025,
                type: 'hit'
            });
        }
    }

    createExplosionParticles(x, y, color) {
        const colors = [
            color,
            NEON_COLORS.NEON_PINK,
            NEON_COLORS.NEON_CYAN,
            NEON_COLORS.NEON_YELLOW,
            NEON_COLORS.NEON_GREEN,
            NEON_COLORS.NEON_ORANGE
        ];
        
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i + Math.random() * 0.3;
            const speed = 3 + Math.random() * 5;
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
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

    spawnPowerup(x, y) {
        const powerupTypes = Object.values(POWERUP_TYPES);
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        this.powerups.push({
            x: x - 15,
            y: y,
            size: 30,
            type: type,
            speed: 2,
            rotation: 0
        });
    }

    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.y += powerup.speed;
            powerup.rotation += 0.02;
            
            if (powerup.y > this.gameHeight) {
                this.powerups.splice(i, 1);
            }
        }
    }

    collectPowerup(powerup) {
        const type = powerup.type;
        
        if (type.id === 'extra-life') {
            this.lives++;
            this.updateLivesDisplay();
        } else {
            this.activePowerups.set(type.id, {
                type: type,
                startTime: performance.now(),
                duration: type.duration
            });
            
            switch (type.id) {
                case 'triple-score':
                    this.scoreMultiplier = 3;
                    break;
                case 'super-hit':
                    this.superHitActive = true;
                    break;
                case 'wide-paddle':
                    this.widePaddleActive = true;
                    this.paddle.width = 180;
                    this.paddle.x = Math.max(0, Math.min(this.gameWidth - this.paddle.width, this.paddle.x));
                    break;
            }
        }
        
        this.createExplosionParticles(powerup.x + powerup.size / 2, powerup.y + powerup.size / 2, type.color);
        this.updatePowerupsDisplay();
        this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.5 });
    }

    updateActivePowerups(currentTime) {
        for (const [id, powerup] of this.activePowerups.entries()) {
            if (currentTime - powerup.startTime >= powerup.duration) {
                this.activePowerups.delete(id);
                
                switch (id) {
                    case 'triple-score':
                        this.scoreMultiplier = 1;
                        break;
                    case 'super-hit':
                        this.superHitActive = false;
                        break;
                    case 'wide-paddle':
                        this.widePaddleActive = false;
                        this.paddle.width = 120;
                        this.paddle.x = Math.max(0, Math.min(this.gameWidth - this.paddle.width, this.paddle.x));
                        break;
                }
                
                this.updatePowerupsDisplay();
            }
        }
    }

    updatePowerupsDisplay() {
        if (!this.powerupsDisplay) return;
        
        if (this.activePowerups.size === 0) {
            this.powerupsDisplay.innerHTML = `<div style="font-size: 0.7rem; color: ${NEON_COLORS.TEXT_SECONDARY}; text-align: center;">激活道具将显示在这里</div>`;
            return;
        }
        
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">';
        const currentTime = performance.now();
        
        for (const [id, powerup] of this.activePowerups.entries()) {
            const remaining = Math.max(0, Math.ceil((powerup.duration - (currentTime - powerup.startTime)) / 1000));
            const progress = (currentTime - powerup.startTime) / powerup.duration;
            
            html += `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 4px 8px;
                    background: ${powerup.type.color}33;
                    border: 1px solid ${powerup.type.color};
                    border-radius: 6px;
                    font-size: 0.65rem;
                ">
                    <span>${powerup.type.emoji}</span>
                    <span style="color: ${powerup.type.color}; font-weight: bold;">${remaining}s</span>
                    <div style="
                        width: 40px;
                        height: 3px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 2px;
                        margin-top: 2px;
                    ">
                        <div style="
                            width: ${(1 - progress) * 100}%;
                            height: 100%;
                            background: ${powerup.type.color};
                            border-radius: 2px;
                            transition: width 0.1s;
                        "></div>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        this.powerupsDisplay.innerHTML = html;
    }

    updateBallSpeed(currentTime) {
        if (currentTime - this.lastSpeedIncrease >= this.speedIncreaseInterval) {
            this.ball.speedMultiplier += 0.1;
            
            const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            const newSpeed = this.ball.baseSpeed * this.ball.speedMultiplier;
            const scaleFactor = newSpeed / currentSpeed;
            
            this.ball.dx *= scaleFactor;
            this.ball.dy *= scaleFactor;
            this.ball.currentSpeed = newSpeed;
            
            this.lastSpeedIncrease = currentTime;
            this.updateSpeedDisplay();
            
            this.audioManager.playSound('combo', { pitch: 0.7, volume: 0.3 });
        }
    }

    updatePaddleAnimation() {
        const scaleDiff = this.paddle.targetScale - this.paddle.scale;
        if (Math.abs(scaleDiff) > 0.01) {
            this.paddle.scale += scaleDiff * 0.3;
        } else {
            this.paddle.scale = 1;
            this.paddle.targetScale = 1;
        }
    }

    loseLife() {
        this.lives--;
        this.updateLivesDisplay();
        
        this.triggerShake(30, 500);
        this.audioManager.playSound('miss', { pitch: 0.6, volume: 0.6 });
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.ball.speedMultiplier = 1;
            this.ball.currentSpeed = this.ball.baseSpeed;
            this.lastSpeedIncrease = performance.now();
            this.updateSpeedDisplay();
            
            this.resetBallAndPaddle();
            this.ballAttached = true;
            this.isWaiting = true;
            this.countdownValue = 1;
            
            setTimeout(() => {
                this.isWaiting = false;
                this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
            }, 1000);
        }
    }

    levelComplete() {
        this.level++;
        this.updateLevelDisplay();
        
        this.triggerFlash(NEON_COLORS.NEON_GREEN, 500);
        this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.6 });
        
        this.ball.speedMultiplier = 1 + (this.level - 1) * 0.15;
        this.brickRows = Math.min(8, 6 + Math.floor(this.level / 2));
        
        setTimeout(() => {
            this.initBricks();
            this.resetBallAndPaddle();
            this.ballAttached = true;
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
            background: linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(0, 255, 255, 0.2));
            border: 3px solid ${NEON_COLORS.NEON_PINK};
            border-radius: 24px;
            padding: 50px 60px;
            text-align: center;
            max-width: 420px;
            animation: game-over-fade 0.6s ease 0.2s both;
            box-shadow: 0 20px 60px rgba(255, 0, 255, 0.5), 0 0 80px rgba(0, 255, 255, 0.3);
        `;
        
        const isHighScore = this.score > this.loadHighScore();
        
        if (isHighScore) {
            this.saveHighScore();
        }
        
        card.innerHTML = `
            <div style="font-size: 4.5rem; margin-bottom: 20px; animation: float-up 1s ease infinite;">${isHighScore ? '🏆' : '💀'}</div>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: ${isHighScore ? NEON_COLORS.NEON_YELLOW : NEON_COLORS.NEON_RED}; margin-bottom: 10px; text-shadow: 0 0 20px ${isHighScore ? NEON_COLORS.NEON_YELLOW : NEON_COLORS.NEON_RED};">
                ${isHighScore ? '新纪录！' : '游戏结束'}
            </h2>
            <p style="color: ${NEON_COLORS.TEXT_SECONDARY}; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.8;">
                最终得分: <span style="color: ${NEON_COLORS.NEON_CYAN}; font-weight: 800; font-size: 1.5rem; text-shadow: 0 0 10px ${NEON_COLORS.NEON_CYAN};">${this.score}</span><br>
                到达关卡: <span style="color: ${NEON_COLORS.NEON_GREEN}; font-weight: 700;">${this.level}</span>
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="retry-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${NEON_COLORS.NEON_PINK}, ${NEON_COLORS.NEON_CYAN});
                    border: none;
                    color: ${NEON_COLORS.DARK_BACKGROUND};
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(255, 0, 255, 0.4);
                ">再来一局</button>
                <button id="exit-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: transparent;
                    border: 2px solid ${NEON_COLORS.NEON_CYAN};
                    color: ${NEON_COLORS.TEXT_PRIMARY};
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

    loadHighScore() {
        const saved = localStorage.getItem('neonBreakoutHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('neonBreakoutHighScore', this.score.toString());
    }

    render() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        
        ctx.fillStyle = NEON_COLORS.DARK_BACKGROUND;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        this.drawBackground();
        this.drawGrid();
        this.drawBricks();
        this.drawPaddle();
        this.drawBall();
        this.drawPowerups();
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
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.05)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.03)');
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

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = NEON_COLORS.GRID_COLOR;
        ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        for (let x = 0; x <= this.gameWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.gameHeight);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.gameHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.gameWidth, y);
            ctx.stroke();
        }
    }

    drawBricks() {
        const ctx = this.ctx;
        
        this.bricks.forEach(brick => {
            const damageProgress = 1 - (brick.hits / brick.maxHits);
            
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = 15 - damageProgress * 10;
            
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 3);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            
            if (brick.hits > 1) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
            
            if (damageProgress > 0) {
                this.drawCrackPattern(ctx, brick, damageProgress);
            }
            
            ctx.shadowBlur = 0;
        });
    }

    drawCrackPattern(ctx, brick, damageProgress) {
        const crackIntensity = Math.min(damageProgress * 3, 1);
        const centerX = brick.x + brick.width / 2;
        const centerY = brick.y + brick.height / 2;
        
        ctx.save();
        
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 + crackIntensity * 0.4})`;
        ctx.lineWidth = 1 + crackIntensity * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const seed = brick.row * 100 + brick.col;
        const cracks = [];
        
        const numCracks = Math.floor(3 + crackIntensity * 5);
        
        for (let i = 0; i < numCracks; i++) {
            const angle = (Math.PI * 2 / numCracks) * i + this.pseudoRandom(seed + i) * 0.5;
            const startX = centerX + Math.cos(angle) * brick.width * 0.1;
            const startY = centerY + Math.sin(angle) * brick.height * 0.1;
            
            const crack = [];
            let currentX = startX;
            let currentY = startY;
            let currentAngle = angle;
            
            crack.push({ x: currentX, y: currentY });
            
            const segments = Math.floor(2 + crackIntensity * 3);
            for (let j = 0; j < segments; j++) {
                const segmentLength = (brick.width * 0.3 + this.pseudoRandom(seed + i * 10 + j) * brick.width * 0.2) * crackIntensity;
                currentAngle += (this.pseudoRandom(seed + i * 20 + j) - 0.5) * 0.8;
                
                currentX += Math.cos(currentAngle) * segmentLength;
                currentY += Math.sin(currentAngle) * segmentLength;
                
                currentX = Math.max(brick.x, Math.min(brick.x + brick.width, currentX));
                currentY = Math.max(brick.y, Math.min(brick.y + brick.height, currentY));
                
                crack.push({ x: currentX, y: currentY });
                
                if (currentX <= brick.x || currentX >= brick.x + brick.width ||
                    currentY <= brick.y || currentY >= brick.y + brick.height) {
                    break;
                }
            }
            
            cracks.push(crack);
        }
        
        cracks.forEach((crack, crackIndex) => {
            if (crack.length < 2) return;
            
            ctx.beginPath();
            ctx.moveTo(crack[0].x, crack[0].y);
            
            for (let i = 1; i < crack.length; i++) {
                ctx.lineTo(crack[i].x, crack[i].y);
            }
            ctx.stroke();
            
            if (crackIntensity > 0.5) {
                for (let i = 1; i < crack.length - 1; i++) {
                    if (this.pseudoRandom(seed + crackIndex * 50 + i) > 0.6) {
                        const branchAngle = this.pseudoRandom(seed + crackIndex * 100 + i) * Math.PI * 2;
                        const branchLength = brick.width * 0.15 * crackIntensity;
                        
                        ctx.beginPath();
                        ctx.moveTo(crack[i].x, crack[i].y);
                        ctx.lineTo(
                            crack[i].x + Math.cos(branchAngle) * branchLength,
                            crack[i].y + Math.sin(branchAngle) * branchLength
                        );
                        ctx.stroke();
                    }
                }
            }
        });
        
        if (crackIntensity > 0.7) {
            ctx.fillStyle = `rgba(0, 0, 0, ${crackIntensity * 0.15})`;
            
            for (let i = 0; i < 3; i++) {
                const chipX = centerX + (this.pseudoRandom(seed + 1000 + i) - 0.5) * brick.width * 0.6;
                const chipY = centerY + (this.pseudoRandom(seed + 2000 + i) - 0.5) * brick.height * 0.6;
                const chipSize = (3 + this.pseudoRandom(seed + 3000 + i) * 5) * crackIntensity;
                
                ctx.beginPath();
                ctx.arc(chipX, chipY, chipSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    pseudoRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    drawPaddle() {
        const ctx = this.ctx;
        const scale = this.paddle.scale;
        const centerX = this.paddle.x + this.paddle.width / 2;
        const centerY = this.paddle.y + this.paddle.height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, scale);
        ctx.translate(-centerX, -centerY);
        
        const glowColor = this.widePaddleActive ? NEON_COLORS.NEON_CYAN : this.paddle.color;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;
        
        const gradient = ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(0.5, this.paddle.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        ctx.fillStyle = gradient;
        
        const radius = 10;
        ctx.beginPath();
        ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, radius);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.roundRect(this.paddle.x + 5, this.paddle.y + 2, this.paddle.width - 10, this.paddle.height / 3, radius / 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawBall() {
        const ctx = this.ctx;
        
        ctx.shadowColor = this.ball.color;
        ctx.shadowBlur = 30;
        
        const gradient = ctx.createRadialGradient(
            this.ball.x, this.ball.y, 0,
            this.ball.x, this.ball.y, this.ball.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.ball.color);
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.ball.x - 3, this.ball.y - 3, this.ball.radius / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    drawPowerups() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        this.powerups.forEach(powerup => {
            const bounce = Math.sin(time * 3 + powerup.x) * 3;
            const rotation = powerup.rotation;
            
            ctx.save();
            ctx.translate(powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + bounce);
            ctx.rotate(rotation);
            
            ctx.shadowColor = powerup.type.color;
            ctx.shadowBlur = 20;
            
            ctx.fillStyle = powerup.type.color + '44';
            ctx.beginPath();
            ctx.arc(0, 0, powerup.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = powerup.type.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerup.type.emoji, 0, 0);
            
            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10 * p.life;
            
            ctx.fillStyle = p.color;
            ctx.fillRect(
                p.x - p.size / 2,
                p.y - p.size / 2,
                p.size * p.life,
                p.size * p.life
            );
            
            ctx.shadowBlur = 0;
            ctx.restore();
        });
    }

    drawCountdown() {
        const ctx = this.ctx;
        const time = performance.now() / 1000;
        
        ctx.fillStyle = 'rgba(10, 10, 26, 0.6)';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        ctx.fillStyle = NEON_COLORS.TEXT_PRIMARY;
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('准备开始...', this.gameWidth / 2, this.gameHeight / 2 - 90);
        
        const pulseScale = 1 + Math.sin(time * 6) * 0.08;
        ctx.save();
        ctx.translate(this.gameWidth / 2, this.gameHeight / 2);
        ctx.scale(pulseScale, pulseScale);
        
        ctx.font = 'bold 110px "Segoe UI", sans-serif';
        ctx.fillStyle = NEON_COLORS.NEON_PINK;
        ctx.shadowColor = NEON_COLORS.NEON_PINK;
        ctx.shadowBlur = 25;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayText = this.countdownValue > 0 ? this.countdownValue : '开始！';
        ctx.fillText(displayText, 0, 0);
        
        ctx.restore();
        
        ctx.shadowBlur = 0;
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = NEON_COLORS.TEXT_SECONDARY;
        ctx.textAlign = 'center';
        ctx.fillText('按空格键发射弹球', this.gameWidth / 2, this.gameHeight / 2 + 70);
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(10, 10, 26, 0.7)';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        ctx.fillStyle = NEON_COLORS.TEXT_PRIMARY;
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸️ 游戏暂停', this.gameWidth / 2, this.gameHeight / 2 - 25);
        
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillStyle = NEON_COLORS.TEXT_SECONDARY;
        ctx.textAlign = 'center';
        ctx.fillText('按 P 键继续游戏', this.gameWidth / 2, this.gameHeight / 2 + 25);
    }

    handleInput(eventType, event) {
        if (this.isGameOver) return;
        
        if (eventType === 'mousemove') {
            this.mouseX = event.clientX;
        }
        
        if (eventType === 'keydown') {
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    this.useMouseControl = false;
                    event.preventDefault();
                    break;
                    
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    this.useMouseControl = false;
                    event.preventDefault();
                    break;
                    
                case ' ':
                    if (this.ballAttached && !this.isWaiting) {
                        this.ballAttached = false;
                        this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.4 });
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
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    break;
                    
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    break;
            }
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        const scoreEl = document.getElementById('breakout-score');
        if (scoreEl) {
            scoreEl.textContent = this.score.toLocaleString();
        }
    }

    updateLivesDisplay() {
        const livesEl = document.getElementById('breakout-lives');
        if (livesEl) {
            let hearts = '';
            for (let i = 0; i < this.lives; i++) {
                hearts += '❤️';
            }
            for (let i = this.lives; i < 3; i++) {
                hearts += '🖤';
            }
            livesEl.textContent = hearts;
        }
    }

    updateLevelDisplay() {
        const levelEl = document.getElementById('breakout-level');
        if (levelEl) {
            levelEl.textContent = this.level;
        }
    }

    updateSpeedDisplay() {
        const speedEl = document.getElementById('breakout-ball-speed');
        if (speedEl) {
            const multiplier = Math.round(this.ball.speedMultiplier * 10) / 10;
            if (multiplier <= 1) {
                speedEl.textContent = '正常';
                speedEl.style.color = NEON_COLORS.NEON_GREEN;
            } else if (multiplier <= 1.5) {
                speedEl.textContent = '加速';
                speedEl.style.color = NEON_COLORS.NEON_YELLOW;
            } else if (multiplier <= 2) {
                speedEl.textContent = '高速';
                speedEl.style.color = NEON_COLORS.NEON_ORANGE;
            } else {
                speedEl.textContent = '极速';
                speedEl.style.color = NEON_COLORS.NEON_RED;
            }
        }
    }
}
