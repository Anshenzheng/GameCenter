/**
 * 单词打字游戏 - Word Typer Game
 * 复古街机风格，激光射击，爆炸粒子效果
 */

const WORD_TYPER_COLORS = {
    DARK_BACKGROUND: '#0a0e27',
    NEON_BLUE: '#00d4ff',
    NEON_PINK: '#ff00aa',
    NEON_GREEN: '#00ff88',
    NEON_YELLOW: '#ffff00',
    NEON_ORANGE: '#ff6600',
    NEON_RED: '#ff0040',
    NEON_PURPLE: '#9932cc',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a0a0a0',
    GRID_COLOR: 'rgba(0, 212, 255, 0.1)'
};

const WORD_LISTS = {
    easy: [
        'cat', 'dog', 'sun', 'run', 'fun', 'top', 'map', 'cup', 'red', 'blue',
        'jump', 'play', 'game', 'code', 'home', 'star', 'tree', 'fish', 'bird', 'book',
        'happy', 'water', 'music', 'dance', 'light', 'right', 'night', 'fight', 'might', 'sight',
        'apple', 'table', 'chair', 'mouse', 'keyboard', 'window', 'flower', 'garden', 'school', 'friend'
    ],
    medium: [
        'computer', 'program', 'developer', 'algorithm', 'database', 'network', 'software', 'hardware',
        'function', 'variable', 'constant', 'interface', 'template', 'instance', 'abstract', 'concrete',
        'adventure', 'mystery', 'fantasy', 'thriller', 'romance', 'science', 'history', 'geography',
        'elephant', 'giraffe', 'dolphin', 'penguin', 'butterfly', 'squirrel', 'kangaroo', 'octopus',
        'mountain', 'valley', 'desert', 'forest', 'jungle', 'island', 'volcano', 'glacier'
    ],
    hard: [
        'javascript', 'typescript', 'python', 'java', 'kotlin', 'swift', 'rust', 'golang',
        'asynchronous', 'synchronous', 'recursive', 'iterative', 'parallel', 'sequential',
        'cryptography', 'authentication', 'authorization', 'encryption', 'decryption',
        'architecture', 'framework', 'library', 'module', 'component', 'dependency',
        'philosophy', 'psychology', 'sociology', 'anthropology', 'archaeology',
        'unbelievable', 'incredible', 'magnificent', 'spectacular', 'extraordinary',
        'complicated', 'sophisticated', 'intricate', 'complex', 'elaborate'
    ]
};

class WordTyperGame extends GameInterface {
    static get metadata() {
        return {
            id: 'word-typer',
            name: '单词打字机',
            description: '复古街机风格打字游戏！屏幕里不断涌出怪物，每个怪物头顶顶着一个单词。看着单词打字，打对一个，角色就发出一道激光把怪物打死！',
            icon: '⌨️',
            colors: {
                primary: WORD_TYPER_COLORS.NEON_BLUE,
                secondary: WORD_TYPER_COLORS.NEON_PINK
            }
        };
    }

    constructor(context) {
        super(context);
        this.canvas = context.canvas;
        this.gameCanvas = null;
        this.ctx = null;

        this.gameWidth = 900;
        this.gameHeight = 700;

        this.player = {
            x: 0,
            y: 0,
            width: 60,
            height: 80,
            color: WORD_TYPER_COLORS.NEON_BLUE,
            glowColor: WORD_TYPER_COLORS.NEON_BLUE
        };

        this.monsters = [];
        this.lasers = [];
        this.particles = [];
        this.explosions = [];
        this.floatingTexts = [];

        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.combo = 0;
        this.maxCombo = 0;
        this.level = 1;

        this.typedWord = '';
        this.targetMonster = null;
        this.gameStartTime = 0;
        this.lastSpawnTime = 0;
        this.spawnInterval = 3000;

        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.isWaiting = false;
        this.countdownValue = 0;

        this.keys = {};
        this.audioManager = new AudioManager();
        this.screenShake = { intensity: 0, duration: 0 };
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        this.highScore = this.loadHighScore();
        console.log('单词打字机游戏已初始化');
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
            background: linear-gradient(180deg, ${WORD_TYPER_COLORS.DARK_BACKGROUND} 0%, #0f1a3a 50%, ${WORD_TYPER_COLORS.DARK_BACKGROUND} 100%);
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
            @keyframes game-over-fade {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes float-up {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes glow-border {
                0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(255, 0, 170, 0.2); }
                50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.7), 0 0 60px rgba(255, 0, 170, 0.4); }
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
            @keyframes laser-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            @keyframes explode {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        this.leftPanel = document.createElement('div');
        this.leftPanel.className = 'left-panel';
        this.leftPanel.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 200px;
            min-width: 200px;
            flex-shrink: 0;
            font-family: 'Courier New', 'Segoe UI', monospace;
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
            font-family: 'Courier New', 'Segoe UI', monospace;
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
            width: 200px;
            min-width: 200px;
            flex-shrink: 0;
            font-family: 'Courier New', 'Segoe UI', monospace;
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
        hud.className = 'word-typer-hud';
        hud.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px;
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 170, 0.1));
            backdrop-filter: blur(15px);
            border: 2px solid ${WORD_TYPER_COLORS.NEON_BLUE};
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(255, 0, 170, 0.1);
            flex-shrink: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${WORD_TYPER_COLORS.NEON_PINK};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${WORD_TYPER_COLORS.NEON_BLUE};
            margin-bottom: 2px;
            text-shadow: 0 0 10px ${WORD_TYPER_COLORS.NEON_PINK};
        `;
        title.innerHTML = '⌨️ 游戏状态';
        hud.appendChild(title);

        const items = [
            { id: 'wt-score', label: '当前分数', value: '0', icon: '🎯', color: WORD_TYPER_COLORS.NEON_YELLOW },
            { id: 'wt-high-score', label: '最高记录', value: this.highScore.toString(), icon: '🏆', color: WORD_TYPER_COLORS.NEON_GREEN },
            { id: 'wt-lives', label: '剩余生命', value: '❤️❤️❤️', icon: '💖', color: WORD_TYPER_COLORS.NEON_RED },
            { id: 'wt-combo', label: '当前连击', value: '0', icon: '🔥', color: WORD_TYPER_COLORS.NEON_ORANGE },
            { id: 'wt-max-combo', label: '最大连击', value: '0', icon: '💎', color: WORD_TYPER_COLORS.NEON_PURPLE },
            { id: 'wt-level', label: '难度等级', value: '1', icon: '📈', color: WORD_TYPER_COLORS.NEON_CYAN }
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
                    <span style="font-size: 0.75rem; color: ${WORD_TYPER_COLORS.TEXT_SECONDARY}; font-weight: 600;">${item.label}</span>
                </div>
                <span id="${item.id}" style="font-size: 0.95rem; font-weight: 800; color: ${item.color}; text-shadow: 0 0 5px ${item.color};">${item.value}</span>
            `;
            
            hud.appendChild(itemEl);
        });

        this.currentWordDisplay = document.createElement('div');
        this.currentWordDisplay.id = 'current-word-display';
        this.currentWordDisplay.style.cssText = `
            margin-top: 8px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px dashed ${WORD_TYPER_COLORS.NEON_GREEN};
            border-radius: 8px;
            text-align: center;
            min-height: 50px;
        `;
        this.currentWordDisplay.innerHTML = `<div style="font-size: 0.7rem; color: ${WORD_TYPER_COLORS.TEXT_SECONDARY};">等待开始...</div>`;
        hud.appendChild(this.currentWordDisplay);

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
            background: linear-gradient(135deg, rgba(255, 0, 170, 0.1), rgba(0, 212, 255, 0.1));
            backdrop-filter: blur(15px);
            border: 2px solid ${WORD_TYPER_COLORS.NEON_PINK};
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(255, 0, 170, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1);
            flex-shrink: 0;
            min-height: 0;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 1.1rem;
            font-weight: 800;
            color: ${WORD_TYPER_COLORS.NEON_BLUE};
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 1px solid ${WORD_TYPER_COLORS.NEON_PINK};
            margin-bottom: 2px;
            text-shadow: 0 0 10px ${WORD_TYPER_COLORS.NEON_BLUE};
        `;
        title.innerHTML = '🎮 操作说明';
        controls.appendChild(title);

        const controlItems = [
            { keys: ['A-Z'], desc: '输入字母攻击怪物，完成后自动发射激光' },
            { keys: ['退格'], desc: '删除输入的字母' },
            { keys: ['ESC'], desc: '退出游戏' }
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
                `<span style="padding: 3px 8px; background: ${WORD_TYPER_COLORS.NEON_BLUE}; border-radius: 5px; font-weight: 700; font-size: 0.75rem; color: ${WORD_TYPER_COLORS.TEXT_PRIMARY}; text-shadow: 0 0 5px ${WORD_TYPER_COLORS.NEON_BLUE};">${k}</span>`
            ).join(' ');
            
            itemEl.innerHTML = `
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">${keysDisplay}</div>
                <span style="font-size: 0.7rem; color: ${WORD_TYPER_COLORS.TEXT_SECONDARY};">${item.desc}</span>
            `;
            
            controls.appendChild(itemEl);
        });

        const tip = document.createElement('div');
        tip.style.cssText = `
            margin-top: 8px;
            padding: 8px 10px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 8px;
            font-size: 0.68rem;
            color: ${WORD_TYPER_COLORS.TEXT_SECONDARY};
            line-height: 1.4;
        `;
        tip.innerHTML = '💡 <strong>小提示：</strong>连续正确输入可积累连击获得更高分数！怪物会越来越快，保持专注！';
        controls.appendChild(tip);

        this.rightPanel.appendChild(controls);
    }

    createGameCanvas() {
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'game-canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            padding: 10px;
            background: linear-gradient(135deg, ${WORD_TYPER_COLORS.NEON_BLUE}, ${WORD_TYPER_COLORS.NEON_PINK});
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0, 212, 255, 0.4), 0 0 60px rgba(255, 0, 170, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.1);
            animation: glow-border 3s ease-in-out infinite;
        `;

        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.id = 'word-typer-canvas';
        this.gameCanvas.style.cssText = `
            display: block;
            border-radius: 16px;
            background: ${WORD_TYPER_COLORS.DARK_BACKGROUND};
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
        this.combo = 0;
        this.maxCombo = 0;
        this.level = 1;
        this.typedWord = '';
        this.targetMonster = null;
        this.monsters = [];
        this.lasers = [];
        this.particles = [];
        this.explosions = [];
        this.floatingTexts = [];
        this.spawnInterval = 3000;

        this.updateScoreDisplay();
        this.updateLivesDisplay();
        this.updateComboDisplay();
        this.updateLevelDisplay();

        this.player.x = this.gameWidth / 2;
        this.player.y = this.gameHeight - 100;

        if (this.canvas) {
            this.canvas.style.transform = '';
        }

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
                this.lastSpawnTime = this.gameStartTime;
                this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.5 });
            }
        }, 1000);
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
        this.updateDifficulty(currentTime);
        this.spawnMonsters(currentTime);
        this.updateMonsters();
        this.updateLasers();
        this.updateParticles();
        this.updateExplosions();
        this.updateFloatingTexts();
        this.updateScreenShake();
        this.checkGameOver();
    }

    updateDifficulty(currentTime) {
        const elapsed = currentTime - this.gameStartTime;
        const newLevel = Math.floor(elapsed / 30000) + 1;

        if (newLevel !== this.level) {
            this.level = Math.min(newLevel, 10);
            this.updateLevelDisplay();
            this.spawnInterval = Math.max(800, 3000 - (this.level - 1) * 250);
        }
    }

    spawnMonsters(currentTime) {
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            this.spawnMonster();
            this.lastSpawnTime = currentTime;
        }
    }

    spawnMonster() {
        const difficulty = this.getWordDifficulty();
        const words = WORD_LISTS[difficulty];
        const word = words[Math.floor(Math.random() * words.length)];

        const x = 80 + Math.random() * (this.gameWidth - 160);
        const monsterColors = [
            WORD_TYPER_COLORS.NEON_RED,
            WORD_TYPER_COLORS.NEON_ORANGE,
            WORD_TYPER_COLORS.NEON_PINK,
            WORD_TYPER_COLORS.NEON_PURPLE,
            WORD_TYPER_COLORS.NEON_GREEN
        ];

        const baseSpeed = 0.5 + (this.level - 1) * 0.15;
        const speed = baseSpeed + Math.random() * 0.3;

        const monster = {
            x: x,
            y: -60,
            width: 80,
            height: 70,
            word: word,
            typedProgress: 0,
            speed: speed,
            color: monsterColors[Math.floor(Math.random() * monsterColors.length)],
            glowColor: monsterColors[Math.floor(Math.random() * monsterColors.length)],
            isTargeted: false,
            hitFlash: 0,
            size: 1,
            wobble: Math.random() * Math.PI * 2
        };

        this.monsters.push(monster);
    }

    getWordDifficulty() {
        if (this.level <= 2) return 'easy';
        if (this.level <= 5) return 'medium';
        return 'hard';
    }

    updateMonsters() {
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const monster = this.monsters[i];
            monster.y += monster.speed;
            monster.wobble += 0.03;
            monster.x += Math.sin(monster.wobble) * 0.5;

            if (monster.hitFlash > 0) {
                monster.hitFlash -= 0.1;
            }

            if (monster.y > this.gameHeight - 80) {
                this.monsters.splice(i, 1);
                this.lives--;
                this.combo = 0;
                this.updateLivesDisplay();
                this.updateComboDisplay();
                this.triggerShake(20, 300);
                this.audioManager.playSound('miss', { pitch: 0.6, volume: 0.6 });
            }
        }
    }

    updateLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            laser.x += laser.vx;
            laser.y += laser.vy;
            laser.intensity *= 0.98;
            laser.width += 0.3;
            laser.length += laser.speed;

            if (laser.targetMonster && this.monsters.includes(laser.targetMonster)) {
                const dx = laser.targetMonster.x - laser.x;
                const dy = (laser.targetMonster.y + laser.targetMonster.height / 2) - laser.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 30) {
                    const monsterIndex = this.monsters.indexOf(laser.targetMonster);
                    if (monsterIndex !== -1) {
                        this.destroyMonster(monsterIndex);
                    }
                    this.lasers.splice(i, 1);
                    continue;
                }
            }

            if (laser.y < -50 || laser.y > this.gameHeight + 50 || 
                laser.x < -50 || laser.x > this.gameWidth + 50 ||
                laser.intensity < 0.1) {
                this.lasers.splice(i, 1);
            }
        }
    }

    checkLaserCollision(laser, monster) {
        const laserX = laser.x;
        const laserTop = laser.y;
        const laserBottom = laser.y + laser.length;
        const laserWidth = laser.width;

        const monsterLeft = monster.x - monster.width / 2;
        const monsterRight = monster.x + monster.width / 2;
        const monsterTop = monster.y;
        const monsterBottom = monster.y + monster.height;

        return laserX >= monsterLeft - laserWidth &&
               laserX <= monsterRight + laserWidth &&
               laserTop <= monsterBottom &&
               laserBottom >= monsterTop;
    }

    destroyMonster(index) {
        const monster = this.monsters[index];

        this.createExplosion(monster.x, monster.y + monster.height / 2, monster.color);

        for (let i = 0; i < 20; i++) {
            this.createParticle(
                monster.x,
                monster.y + monster.height / 2,
                monster.color
            );
        }

        const basePoints = monster.word.length * 10;
        const comboMultiplier = 1 + this.combo * 0.1;
        const points = Math.floor(basePoints * comboMultiplier);
        this.score += points;
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        this.createFloatingText(
            monster.x,
            monster.y,
            `+${points}`,
            WORD_TYPER_COLORS.NEON_YELLOW
        );

        if (this.combo >= 3) {
            this.createFloatingText(
                monster.x,
                monster.y - 30,
                `${this.combo}x COMBO!`,
                WORD_TYPER_COLORS.NEON_ORANGE
            );
        }

        this.updateScoreDisplay();
        this.updateComboDisplay();
        this.triggerShake(10, 150);
        this.audioManager.playSound('perfect', { pitch: 1.3 + Math.random() * 0.2, volume: 0.5 });

        if (this.targetMonster === monster) {
            this.targetMonster = null;
            this.typedWord = '';
            this.updateCurrentWordDisplay();
        }

        this.monsters.splice(index, 1);
    }

    createExplosion(x, y, color) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 80,
            color: color,
            life: 1,
            decay: 0.03
        });
    }

    createParticle(x, y, color) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 6,
            color: color,
            life: 1,
            decay: 0.015 + Math.random() * 0.01,
            gravity: 0.1
        });
    }

    createFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1,
            decay: 0.015,
            vy: -2
        });
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

    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            e.radius += (e.maxRadius - e.radius) * 0.15;
            e.life -= e.decay;

            if (e.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }

    updateFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.life -= t.decay;

            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    updateScreenShake() {
        if (this.screenShake.intensity > 0) {
            this.screenShake.intensity *= 0.9;
            this.screenShake.duration -= 16;
            if (this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
            }
        }
    }

    checkGameOver() {
        if (this.lives <= 0 && !this.isGameOver) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isGameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
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
            background: rgba(10, 14, 39, 0.95);
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
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(255, 0, 170, 0.2));
            border: 3px solid ${WORD_TYPER_COLORS.NEON_BLUE};
            border-radius: 24px;
            padding: 50px 60px;
            text-align: center;
            max-width: 420px;
            animation: game-over-fade 0.6s ease 0.2s both;
            box-shadow: 0 20px 60px rgba(0, 212, 255, 0.5), 0 0 80px rgba(255, 0, 170, 0.3);
        `;

        const isHighScore = this.score >= this.highScore && this.score > 0;

        card.innerHTML = `
            <div style="font-size: 4.5rem; margin-bottom: 20px; animation: float-up 1s ease infinite;">${isHighScore ? '🏆' : '💀'}</div>
            <h2 style="font-size: 2.2rem; font-weight: 800; color: ${isHighScore ? WORD_TYPER_COLORS.NEON_YELLOW : WORD_TYPER_COLORS.NEON_RED}; margin-bottom: 10px; text-shadow: 0 0 20px ${isHighScore ? WORD_TYPER_COLORS.NEON_YELLOW : WORD_TYPER_COLORS.NEON_RED};">
                ${isHighScore ? '新纪录！' : '游戏结束'}
            </h2>
            <p style="color: ${WORD_TYPER_COLORS.TEXT_SECONDARY}; margin-bottom: 30px; font-size: 1.1rem; line-height: 1.8;">
                最终得分: <span style="color: ${WORD_TYPER_COLORS.NEON_CYAN}; font-weight: 800; font-size: 1.5rem; text-shadow: 0 0 10px ${WORD_TYPER_COLORS.NEON_CYAN};">${this.score}</span><br>
                最大连击: <span style="color: ${WORD_TYPER_COLORS.NEON_ORANGE}; font-weight: 700;">${this.maxCombo}x</span><br>
                达到等级: <span style="color: ${WORD_TYPER_COLORS.NEON_GREEN}; font-weight: 700;">${this.level}</span>
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="retry-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, ${WORD_TYPER_COLORS.NEON_BLUE}, ${WORD_TYPER_COLORS.NEON_PINK});
                    border: none;
                    color: ${WORD_TYPER_COLORS.DARK_BACKGROUND};
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
                ">再来一局</button>
                <button id="exit-btn" style="
                    padding: 16px 36px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: transparent;
                    border: 2px solid ${WORD_TYPER_COLORS.NEON_PINK};
                    color: ${WORD_TYPER_COLORS.TEXT_PRIMARY};
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
        const saved = localStorage.getItem('wordTyperHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('wordTyperHighScore', this.score.toString());
    }

    updateScoreDisplay() {
        const el = document.getElementById('wt-score');
        if (el) el.textContent = this.score.toString();

        const highScoreEl = document.getElementById('wt-high-score');
        if (highScoreEl) highScoreEl.textContent = Math.max(this.score, this.highScore).toString();
    }

    updateLivesDisplay() {
        const el = document.getElementById('wt-lives');
        if (el) {
            let hearts = '';
            for (let i = 0; i < this.lives; i++) {
                hearts += '❤️';
            }
            for (let i = this.lives; i < 3; i++) {
                hearts += '🖤';
            }
            el.textContent = hearts;
        }
    }

    updateComboDisplay() {
        const el = document.getElementById('wt-combo');
        if (el) el.textContent = this.combo.toString();

        const maxEl = document.getElementById('wt-max-combo');
        if (maxEl) maxEl.textContent = this.maxCombo.toString();
    }

    updateLevelDisplay() {
        const el = document.getElementById('wt-level');
        if (el) el.textContent = this.level.toString();
    }

    updateCurrentWordDisplay() {
        if (!this.currentWordDisplay) return;

        if (this.targetMonster && this.typedWord.length > 0) {
            const word = this.targetMonster.word;
            const typed = this.typedWord;
            let html = '';

            for (let i = 0; i < word.length; i++) {
                if (i < typed.length) {
                    if (typed[i] === word[i]) {
                        html += `<span style="color: ${WORD_TYPER_COLORS.NEON_GREEN}; text-shadow: 0 0 10px ${WORD_TYPER_COLORS.NEON_GREEN}; font-weight: bold;">${word[i]}</span>`;
                    } else {
                        html += `<span style="color: ${WORD_TYPER_COLORS.NEON_RED}; text-shadow: 0 0 10px ${WORD_TYPER_COLORS.NEON_RED}; font-weight: bold;">${word[i]}</span>`;
                    }
                } else {
                    html += `<span style="color: ${WORD_TYPER_COLORS.TEXT_SECONDARY};">${word[i]}</span>`;
                }
            }

            this.currentWordDisplay.innerHTML = `<div style="font-size: 1.5rem; font-family: 'Courier New', monospace; letter-spacing: 3px;">${html}</div>`;
        } else {
            this.currentWordDisplay.innerHTML = `<div style="font-size: 0.7rem; color: ${WORD_TYPER_COLORS.TEXT_SECONDARY};">输入字母攻击怪物...</div>`;
        }
    }

    triggerShake(intensity = 20, duration = 300) {
        this.screenShake = { intensity, duration };
        super.triggerShake(intensity, duration);
    }

    handleInput(eventType, event) {
        if (eventType !== 'keydown') return;
        if (this.isPaused || this.isGameOver || this.isWaiting) return;

        const key = event.key.toLowerCase();

        if (key === 'backspace') {
            event.preventDefault();
            if (this.typedWord.length > 0) {
                this.typedWord = this.typedWord.slice(0, -1);
                if (this.targetMonster) {
                    this.targetMonster.typedProgress = this.typedWord.length;
                }
                this.updateCurrentWordDisplay();
            }
            return;
        }

        if (key === ' ') {
            event.preventDefault();
            return;
        }

        if (/^[a-z]$/.test(key)) {
            this.handleLetterInput(key);
        }
    }

    handleLetterInput(letter) {
        if (!this.targetMonster) {
            const monster = this.findMonsterWithStartingLetter(letter);
            if (monster) {
                this.targetMonster = monster;
                monster.isTargeted = true;
                this.typedWord = letter;
                monster.typedProgress = 1;
                this.updateCurrentWordDisplay();
                this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.3 });
            }
        } else {
            const word = this.targetMonster.word;
            const nextCharIndex = this.typedWord.length;

            if (nextCharIndex < word.length) {
                const expectedChar = word[nextCharIndex].toLowerCase();

                if (letter === expectedChar) {
                    this.typedWord += letter;
                    this.targetMonster.typedProgress = this.typedWord.length;
                    this.targetMonster.hitFlash = 1;
                    this.createParticle(
                        this.targetMonster.x + (Math.random() - 0.5) * 40,
                        this.targetMonster.y + 20,
                        WORD_TYPER_COLORS.NEON_GREEN
                    );
                    this.updateCurrentWordDisplay();
                    this.audioManager.playSound('hit', { pitch: 1.1 + nextCharIndex * 0.05, volume: 0.35 });

                    if (this.typedWord === word.toLowerCase()) {
                        this.fireAndDestroy(this.targetMonster);
                    }
                } else {
                    this.typedWord = '';
                    this.targetMonster.typedProgress = 0;
                    this.targetMonster.isTargeted = false;
                    this.targetMonster = null;
                    this.combo = 0;
                    this.updateComboDisplay();
                    this.updateCurrentWordDisplay();
                    this.triggerShake(10, 100);
                    this.audioManager.playSound('miss', { pitch: 0.8, volume: 0.4 });
                }
            }
        }
    }

    fireAndDestroy(monster) {
        this.fireLaser(monster);
        
        const monsterIndex = this.monsters.indexOf(monster);
        if (monsterIndex !== -1) {
            setTimeout(() => {
                if (this.monsters.includes(monster)) {
                    const idx = this.monsters.indexOf(monster);
                    if (idx !== -1) {
                        this.destroyMonster(idx);
                    }
                }
            }, 100);
        }
    }

    findMonsterWithStartingLetter(letter) {
        for (const monster of this.monsters) {
            if (monster.word.length > 0 && monster.word[0].toLowerCase() === letter) {
                return monster;
            }
        }
        return null;
    }

    tryFireLaser() {
        if (!this.targetMonster || this.typedWord !== this.targetMonster.word.toLowerCase()) {
            return;
        }

        this.fireLaser(this.targetMonster);
    }

    fireLaser(target) {
        const startX = this.player.x;
        const startY = this.player.y - 40;
        const endX = target.x;
        const endY = target.y + target.height / 2;

        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const vx = (dx / distance) * 25;
        const vy = (dy / distance) * 25;

        const angle = Math.atan2(dy, dx);

        this.lasers.push({
            x: startX,
            y: startY,
            targetX: endX,
            targetY: endY,
            vx: vx,
            vy: vy,
            angle: angle,
            length: 60,
            width: 6,
            speed: 25,
            intensity: 1,
            color: WORD_TYPER_COLORS.NEON_BLUE,
            glowColor: WORD_TYPER_COLORS.NEON_CYAN,
            targetMonster: target
        });

        this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.4 });
        this.triggerFlash(WORD_TYPER_COLORS.NEON_BLUE, 100);
    }

    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;

        ctx.save();
        if (this.screenShake.intensity > 0) {
            const x = (Math.random() - 0.5) * this.screenShake.intensity;
            const y = (Math.random() - 0.5) * this.screenShake.intensity;
            ctx.translate(x, y);
        }

        ctx.fillStyle = WORD_TYPER_COLORS.DARK_BACKGROUND;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        this.drawBackground();
        this.drawGrid();
        this.drawGround();
        this.drawMonsters();
        this.drawLasers();
        this.drawPlayer();
        this.drawExplosions();
        this.drawParticles();
        this.drawFloatingTexts();

        if (this.isWaiting) {
            this.drawCountdown();
        }

        if (this.isPaused && !this.isGameOver) {
            this.drawPauseOverlay();
        }

        ctx.restore();
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
            this.gameWidth / 1.2
        );
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.05)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 170, 0.03)');
        gradient.addColorStop(1, 'rgba(10, 14, 39, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 30; i++) {
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
        ctx.strokeStyle = WORD_TYPER_COLORS.GRID_COLOR;
        ctx.lineWidth = 1;

        const gridSize = 50;

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

    drawGround() {
        const ctx = this.ctx;
        const groundY = this.gameHeight - 60;

        const gradient = ctx.createLinearGradient(0, groundY, 0, this.gameHeight);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, groundY, this.gameWidth, this.gameHeight - groundY);

        ctx.strokeStyle = WORD_TYPER_COLORS.NEON_BLUE;
        ctx.lineWidth = 3;
        ctx.shadowColor = WORD_TYPER_COLORS.NEON_BLUE;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(this.gameWidth, groundY);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawPlayer() {
        const ctx = this.ctx;
        const { x, y, width, height, color, glowColor } = this.player;

        ctx.save();
        ctx.translate(x, y);

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 25;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(width / 2, -height / 2);
        ctx.lineTo(width / 2, 0);
        ctx.lineTo(-width / 2, 0);
        ctx.lineTo(-width / 2, -height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = WORD_TYPER_COLORS.NEON_CYAN;
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(-width / 4, -height / 2);
        ctx.lineTo(width / 4, -height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = WORD_TYPER_COLORS.NEON_YELLOW;
        ctx.shadowBlur = 15;
        ctx.fillStyle = WORD_TYPER_COLORS.NEON_YELLOW;
        ctx.beginPath();
        ctx.arc(0, -height, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawMonsters() {
        const ctx = this.ctx;

        this.monsters.forEach(monster => {
            ctx.save();
            ctx.translate(monster.x, monster.y);

            if (monster.isTargeted) {
                ctx.shadowColor = WORD_TYPER_COLORS.NEON_YELLOW;
                ctx.shadowBlur = 40;
            } else {
                ctx.shadowColor = monster.color;
                ctx.shadowBlur = 20;
            }

            if (monster.hitFlash > 0) {
                ctx.globalAlpha = 0.5 + monster.hitFlash * 0.5;
            }

            const bodyColor = monster.hitFlash > 0 ?
                `rgba(255, 255, 255, ${0.5 + monster.hitFlash * 0.5})` :
                monster.color;

            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(0, monster.height / 2, monster.width / 2, monster.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = WORD_TYPER_COLORS.TEXT_PRIMARY;
            const eyeSize = 12;
            const eyeY = monster.height / 2 - 8;
            ctx.beginPath();
            ctx.arc(-15, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(15, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = WORD_TYPER_COLORS.DARK_BACKGROUND;
            ctx.beginPath();
            ctx.arc(-15, eyeY + 2, 5, 0, Math.PI * 2);
            ctx.arc(15, eyeY + 2, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const word = monster.word;
            const wordY = -15;
            const charWidth = 14;
            const startX = -((word.length - 1) * charWidth) / 2;

            for (let i = 0; i < word.length; i++) {
                const charX = startX + i * charWidth;
                const isTyped = i < monster.typedProgress;
                const isCurrent = i === monster.typedProgress;

                if (isTyped) {
                    ctx.fillStyle = WORD_TYPER_COLORS.NEON_GREEN;
                    ctx.shadowColor = WORD_TYPER_COLORS.NEON_GREEN;
                    ctx.shadowBlur = 10;
                } else if (isCurrent && monster.isTargeted) {
                    ctx.fillStyle = WORD_TYPER_COLORS.NEON_YELLOW;
                    ctx.shadowColor = WORD_TYPER_COLORS.NEON_YELLOW;
                    ctx.shadowBlur = 15;
                } else {
                    ctx.fillStyle = WORD_TYPER_COLORS.TEXT_PRIMARY;
                    ctx.shadowBlur = 0;
                }

                ctx.fillText(word[i], charX, wordY);
            }

            if (monster.isTargeted) {
                ctx.shadowBlur = 0;
                ctx.strokeStyle = WORD_TYPER_COLORS.NEON_YELLOW;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.ellipse(0, monster.height / 2, monster.width / 2 + 10, monster.height / 2 + 10, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.restore();
        });
    }

    drawLasers() {
        const ctx = this.ctx;

        this.lasers.forEach(laser => {
            ctx.save();

            ctx.translate(laser.x, laser.y);
            ctx.rotate(laser.angle);

            ctx.shadowColor = laser.glowColor;
            ctx.shadowBlur = 30 * laser.intensity;

            const gradient = ctx.createLinearGradient(0, 0, laser.length, 0);
            gradient.addColorStop(0, laser.color);
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(1, laser.glowColor);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = laser.width;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(laser.length, 0);
            ctx.stroke();

            ctx.fillStyle = laser.glowColor;
            ctx.beginPath();
            ctx.arc(laser.length, 0, laser.width + 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(laser.length, 0, laser.width, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawExplosions() {
        const ctx = this.ctx;

        this.explosions.forEach(exp => {
            ctx.save();
            ctx.globalAlpha = exp.life;

            const gradient = ctx.createRadialGradient(
                exp.x, exp.y, 0,
                exp.x, exp.y, exp.radius
            );
            gradient.addColorStop(0, exp.color);
            gradient.addColorStop(0.5, exp.color + '80');
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;

        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawFloatingTexts() {
        const ctx = this.ctx;

        this.floatingTexts.forEach(t => {
            ctx.save();
            ctx.globalAlpha = t.life;
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 15;

            ctx.fillText(t.text, t.x, t.y);

            ctx.restore();
        });
    }

    drawCountdown() {
        const ctx = this.ctx;
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        ctx.font = 'bold 120px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = WORD_TYPER_COLORS.NEON_YELLOW;
        ctx.shadowColor = WORD_TYPER_COLORS.NEON_YELLOW;
        ctx.shadowBlur = 30;

        const displayText = this.countdownValue > 0 ? this.countdownValue.toString() : 'GO!';
        ctx.fillText(displayText, centerX, centerY);

        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = WORD_TYPER_COLORS.TEXT_SECONDARY;
        ctx.shadowBlur = 0;
        ctx.fillText('准备打字消灭怪物！', centerX, centerY + 100);

        ctx.restore();
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        ctx.font = 'bold 60px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = WORD_TYPER_COLORS.NEON_BLUE;
        ctx.shadowColor = WORD_TYPER_COLORS.NEON_BLUE;
        ctx.shadowBlur = 20;

        ctx.fillText('暂停', centerX, centerY);

        ctx.restore();
    }
}
