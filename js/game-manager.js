/**
 * 游戏管理器 - 负责游戏的注册、加载、切换和生命周期管理
 */
class GameManager {
    constructor() {
        // 已注册的游戏类
        this.registeredGames = new Map();
        // 当前运行的游戏实例
        this.currentGame = null;
        // 当前游戏类
        this.currentGameClass = null;
        // 游戏循环定时器
        this.gameLoopId = null;
        // 上一帧时间
        this.lastFrameTime = 0;
        // 游戏状态
        this.gameState = 'idle'; // idle, playing, paused
        
        // DOM元素引用
        this.gameSelectionScreen = document.getElementById('game-selection');
        this.gameContainerScreen = document.getElementById('game-container');
        this.gamesContainer = document.getElementById('games-container');
        this.gameCanvas = document.getElementById('game-canvas');
        this.scoreDisplay = document.getElementById('score-display');
        this.comboDisplay = document.getElementById('combo-display');
        this.currentGameTitle = document.getElementById('current-game-title');
        
        // 绑定事件
        this.bindEvents();
    }

    /**
     * 注册游戏
     * @param {Class} GameClass - 游戏类（必须继承GameInterface）
     */
    registerGame(GameClass) {
        // 验证游戏类是否实现了必要的元数据
        if (!GameClass.metadata) {
            console.error('Game class must have static metadata property');
            return false;
        }
        
        const { id, name, description, icon } = GameClass.metadata;
        
        if (!id || !name) {
            console.error('Game metadata must include id and name');
            return false;
        }
        
        // 注册游戏
        this.registeredGames.set(id, GameClass);
        console.log(`游戏已注册: ${name} (${id})`);
        return true;
    }

    /**
     * 渲染游戏列表到UI
     */
    renderGameList() {
        if (!this.gamesContainer) return;
        
        this.gamesContainer.innerHTML = '';
        
        this.registeredGames.forEach((GameClass, gameId) => {
            const metadata = GameClass.metadata;
            const gameCard = this.createGameCard(metadata);
            this.gamesContainer.appendChild(gameCard);
        });
    }

    /**
     * 创建游戏卡片
     * @param {Object} metadata - 游戏元数据
     * @returns {HTMLElement}
     */
    createGameCard(metadata) {
        const { id, name, description, icon, colors } = metadata;
        
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.gameId = id;
        
        // 设置主题色
        if (colors) {
            card.style.setProperty('--primary-color', colors.primary || '#FF6B6B');
            card.style.setProperty('--secondary-color', colors.secondary || '#4ECDC4');
        }
        
        card.innerHTML = `
            <div class="game-icon">${icon || '🎮'}</div>
            <h3 class="game-name">${name}</h3>
            <p class="game-description">${description || ''}</p>
            <button class="play-btn">开始游戏</button>
        `;
        
        // 点击卡片或按钮开始游戏
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('play-btn') || !e.target.closest('.play-btn')) {
                this.startGame(id);
            }
        });
        
        return card;
    }

    /**
     * 启动游戏
     * @param {string} gameId - 游戏ID
     */
    startGame(gameId) {
        const GameClass = this.registeredGames.get(gameId);
        
        if (!GameClass) {
            console.error(`Game not found: ${gameId}`);
            return;
        }
        
        // 停止当前游戏（如果有）
        if (this.currentGame) {
            this.currentGame.stop();
            this.stopGameLoop();
        }
        
        // 切换UI
        this.showGameScreen();
        
        // 创建游戏上下文
        const context = {
            canvas: this.gameCanvas,
            scoreDisplay: this.scoreDisplay,
            comboDisplay: this.comboDisplay,
            gameManager: this
        };
        
        // 创建游戏实例
        try {
            this.currentGameClass = GameClass;
            this.currentGame = new GameClass(context);
            this.currentGameTitle.textContent = GameClass.metadata.name;
            
            // 初始化并启动游戏
            this.currentGame.init();
            this.currentGame.start();
            this.gameState = 'playing';
            
            // 启动游戏循环
            this.startGameLoop();
            
            console.log(`游戏已启动: ${GameClass.metadata.name}`);
        } catch (e) {
            console.error('Failed to start game:', e);
            this.showGameSelection();
        }
    }

    /**
     * 退出游戏，返回游戏选择界面
     */
    exitGame() {
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }
        
        this.stopGameLoop();
        this.gameState = 'idle';
        this.showGameSelection();
        
        console.log('已退出游戏，返回选择界面');
    }

    /**
     * 暂停当前游戏
     */
    pauseGame() {
        if (this.currentGame && this.gameState === 'playing') {
            this.currentGame.pause();
            this.gameState = 'paused';
        }
    }

    /**
     * 恢复当前游戏
     */
    resumeGame() {
        if (this.currentGame && this.gameState === 'paused') {
            this.currentGame.resume();
            this.gameState = 'playing';
        }
    }

    /**
     * 显示游戏选择界面
     */
    showGameSelection() {
        if (this.gameSelectionScreen) {
            this.gameSelectionScreen.classList.add('active');
        }
        if (this.gameContainerScreen) {
            this.gameContainerScreen.classList.remove('active');
        }
    }

    /**
     * 显示游戏界面
     */
    showGameScreen() {
        if (this.gameSelectionScreen) {
            this.gameSelectionScreen.classList.remove('active');
        }
        if (this.gameContainerScreen) {
            this.gameContainerScreen.classList.add('active');
        }
    }

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        this.lastFrameTime = performance.now();
        
        const loop = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            // 渲染游戏帧
            if (this.currentGame && this.gameState === 'playing') {
                this.currentGame.render(deltaTime);
            }
            
            this.gameLoopId = requestAnimationFrame(loop);
        };
        
        this.gameLoopId = requestAnimationFrame(loop);
    }

    /**
     * 停止游戏循环
     */
    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.currentGame && this.gameState === 'playing') {
                this.currentGame.handleInput('keydown', e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.currentGame && this.gameState === 'playing') {
                this.currentGame.handleInput('keyup', e);
            }
        });
        
        // ESC键退出游戏
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameState !== 'idle') {
                this.exitGame();
            }
        });
        
        // 游戏画布点击事件
        if (this.gameCanvas) {
            this.gameCanvas.addEventListener('click', (e) => {
                if (this.currentGame && this.gameState === 'playing') {
                    this.currentGame.handleInput('click', e);
                }
            });
            
            this.gameCanvas.addEventListener('mousemove', (e) => {
                if (this.currentGame && this.gameState === 'playing') {
                    this.currentGame.handleInput('mousemove', e);
                }
            });
        }
    }

    /**
     * 获取已注册游戏列表
     * @returns {Array} 游戏元数据数组
     */
    getRegisteredGames() {
        const games = [];
        this.registeredGames.forEach((GameClass, id) => {
            games.push({
                id,
                ...GameClass.metadata
            });
        });
        return games;
    }

    /**
     * 检查游戏是否已注册
     * @param {string} gameId - 游戏ID
     * @returns {boolean}
     */
    isGameRegistered(gameId) {
        return this.registeredGames.has(gameId);
    }
}