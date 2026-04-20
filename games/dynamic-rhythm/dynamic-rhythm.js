/**
 * 动态律动 - 音乐小游戏
 * 波普风格，大色块扁平化设计
 * 核心玩法：音符从四周飞向中心节拍器，按空格键或方向键击打
 */

// 游戏配置
const DYNAMIC_RHYTHM_CONFIG = {
    // 音符配置
    noteSpeed: 300, // 音符移动速度（像素/秒）
    hitRadius: 80, // 击中判定半径
    perfectRadius: 40, // 完美击中半径
    noteSize: 50, // 音符大小
    
    // 节拍器配置
    metronomeSize: 100, // 节拍器大小
    pulseSpeed: 0.5, // 脉冲速度（秒）
    
    // 评分配置
    perfectScore: 100, // 完美击中分数
    goodScore: 50, // 良好击中分数
    missPenalty: -10, // 错过惩罚
    
    // 音效配置
    sounds: {
        hit: 'hit',
        perfect: 'perfect',
        miss: 'miss',
        combo: 'combo'
    },
    
    // 颜色配置 - 波普风格
    colors: {
        metronome: '#FF6B9D',
        notes: ['#FFE156', '#4ECDC4', '#A855F7', '#FF8C42', '#26D07C', '#FF4757', '#00D9FF'],
        perfect: '#FFFFFF',
        good: '#FFE156',
        miss: '#FF4757'
    },
    
    // 连击颜色阶梯（根据连击数变化背景色）
    comboColorStages: [
        { minCombo: 0, color: '#1A1A2E' },
        { minCombo: 5, color: '#2D1B4E' },
        { minCombo: 10, color: '#1B4747' },
        { minCombo: 20, color: '#4A1B2E' },
        { minCombo: 30, color: '#2E4A1B' },
        { minCombo: 50, color: '#4A2E1B' },
        { minCombo: 80, color: '#1B1B4A' },
        { minCombo: 100, color: '#4A1B4A' }
    ]
};

/**
 * 音符类
 */
class Note {
    constructor(direction, color, spawnTime, targetTime) {
        this.direction = direction; // 方向: 'up', 'down', 'left', 'right'
        this.color = color;
        this.spawnTime = spawnTime; // 生成时间
        this.targetTime = targetTime; // 目标时间（应到达中心的时间）
        this.id = Math.random().toString(36).substr(2, 9);
        
        // 状态
        this.isActive = true;
        this.isHit = false;
        
        // 位置计算
        this.currentX = 0;
        this.currentY = 0;
        this.angle = 0;
        
        this.calculatePositions();
    }
    
    calculatePositions() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 根据方向计算起始位置和角度
        switch (this.direction) {
            case 'up':
                this.startX = centerX;
                this.startY = -DYNAMIC_RHYTHM_CONFIG.noteSize;
                this.angle = 0;
                this.moveDirX = 0;
                this.moveDirY = 1;
                this.keyCode = 'ArrowUp';
                break;
            case 'down':
                this.startX = centerX;
                this.startY = window.innerHeight + DYNAMIC_RHYTHM_CONFIG.noteSize;
                this.angle = 180;
                this.moveDirX = 0;
                this.moveDirY = -1;
                this.keyCode = 'ArrowDown';
                break;
            case 'left':
                this.startX = -DYNAMIC_RHYTHM_CONFIG.noteSize;
                this.startY = centerY;
                this.angle = 90;
                this.moveDirX = 1;
                this.moveDirY = 0;
                this.keyCode = 'ArrowLeft';
                break;
            case 'right':
                this.startX = window.innerWidth + DYNAMIC_RHYTHM_CONFIG.noteSize;
                this.startY = centerY;
                this.angle = -90;
                this.moveDirX = -1;
                this.moveDirY = 0;
                this.keyCode = 'ArrowRight';
                break;
        }
        
        // 目标位置（中心）
        this.targetX = centerX;
        this.targetY = centerY;
    }
    
    /**
     * 更新音符位置
     * @param {number} currentTime - 当前时间
     */
    update(currentTime) {
        if (!this.isActive) return;
        
        const progress = (currentTime - this.spawnTime) / (this.targetTime - this.spawnTime);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        
        // 使用缓动函数使运动更自然
        const easedProgress = this.easeInOutQuad(clampedProgress);
        
        this.currentX = this.startX + (this.targetX - this.startX) * easedProgress;
        this.currentY = this.startY + (this.targetY - this.startY) * easedProgress;
        
        // 检查是否已经过了目标时间（错过）
        if (currentTime > this.targetTime + 0.3) { // 0.3秒的宽容期
            this.miss();
        }
    }
    
    /**
     * 缓动函数
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    /**
     * 检查击中判定
     * @param {number} currentTime - 当前时间
     * @returns {string|null} 'perfect', 'good', 或 null
     */
    checkHit(currentTime) {
        if (!this.isActive || this.isHit) return null;
        
        const timeDiff = Math.abs(currentTime - this.targetTime);
        
        // 时间判定
        if (timeDiff < 0.1) {
            return 'perfect';
        } else if (timeDiff < 0.25) {
            return 'good';
        }
        
        // 距离判定（备选）
        const distance = Math.sqrt(
            Math.pow(this.currentX - this.targetX, 2) +
            Math.pow(this.currentY - this.targetY, 2)
        );
        
        if (distance < DYNAMIC_RHYTHM_CONFIG.perfectRadius) {
            return 'perfect';
        } else if (distance < DYNAMIC_RHYTHM_CONFIG.hitRadius) {
            return 'good';
        }
        
        return null;
    }
    
    /**
     * 击中音符
     */
    hit() {
        this.isHit = true;
        this.isActive = false;
    }
    
    /**
     * 错过音符
     */
    miss() {
        this.isActive = false;
    }
}

/**
 * 谱面生成器
 * 根据节奏自动生成简单谱面
 */
class ChartGenerator {
    constructor(bpm = 120, timeSignature = { upper: 4, lower: 4 }) {
        this.bpm = bpm;
        this.timeSignature = timeSignature;
        this.beatDuration = 60 / bpm; // 每拍的持续时间（秒）
        this.measureDuration = this.beatDuration * timeSignature.upper; // 每小节持续时间
    }
    
    /**
     * 生成谱面
     * @param {number} duration - 谱面总时长（秒）
     * @param {number} density - 音符密度（0-1，越高越密集）
     * @returns {Array} 音符数据数组
     */
    generate(duration = 60, density = 0.6) {
        const notes = [];
        const directions = ['up', 'down', 'left', 'right'];
        const colors = DYNAMIC_RHYTHM_CONFIG.colors.notes;
        
        // 计算总拍数
        const totalBeats = Math.ceil(duration / this.beatDuration);
        const totalMeasures = Math.ceil(totalBeats / this.timeSignature.upper);
        
        // 为每一拍生成可能的音符
        for (let beat = 0; beat < totalBeats; beat++) {
            const targetTime = beat * this.beatDuration;
            
            // 根据密度决定是否生成音符
            if (Math.random() > density) continue;
            
            // 重拍（每小节第一拍）更可能生成音符
            const isDownbeat = (beat % this.timeSignature.upper) === 0;
            if (isDownbeat && Math.random() < 0.3) {
                // 重拍可以生成多个音符
                const noteCount = Math.random() < 0.3 ? 2 : 1;
                const usedDirections = new Set();
                
                for (let i = 0; i < noteCount; i++) {
                    let direction;
                    do {
                        direction = directions[Math.floor(Math.random() * directions.length)];
                    } while (usedDirections.has(direction) && usedDirections.size < directions.length);
                    
                    usedDirections.add(direction);
                    
                    // 音符需要提前生成，以便有时间飞向中心
                    const travelTime = 1.5; // 音符飞行时间（秒）
                    const spawnTime = targetTime - travelTime;
                    
                    if (spawnTime >= 0) {
                        notes.push({
                            direction,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            spawnTime,
                            targetTime
                        });
                    }
                }
            } else {
                // 普通拍生成单个音符
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const travelTime = 1.5;
                const spawnTime = targetTime - travelTime;
                
                if (spawnTime >= 0) {
                    notes.push({
                        direction,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        spawnTime,
                        targetTime
                    });
                }
            }
        }
        
        // 按目标时间排序
        notes.sort((a, b) => a.targetTime - b.targetTime);
        
        return notes;
    }
    
    /**
     * 从音频文件分析节奏（简化版）
     * 注意：完整的节奏检测需要使用Web Audio API进行音频分析
     * 这里提供一个基础框架，可后续扩展
     */
    async generateFromAudio(audioContext, audioBuffer) {
        // 这是一个简化版本
        // 实际应用中需要：
        // 1. 进行FFT分析
        // 2. 检测节拍（onset detection）
        // 3. 根据能量峰值确定节奏点
        
        // 目前使用固定BPM生成
        return this.generate(60, 0.6);
    }
}

/**
 * 动态律动游戏主类
 */
class DynamicRhythmGame extends GameInterface {
    /**
     * 游戏元数据
     */
    static get metadata() {
        return {
            id: 'dynamic-rhythm',
            name: '动态律动',
            description: '波普风格音乐节奏游戏，按空格键或方向键对准节拍！',
            icon: '🎵',
            colors: {
                primary: '#FF6B9D',
                secondary: '#4ECDC4'
            }
        };
    }
    
    constructor(context) {
        super(context);
        
        // 游戏状态
        this.gameStartTime = 0;
        this.elapsedTime = 0;
        this.maxCombo = 0;
        
        // 音符系统
        this.notes = [];
        this.activeNotes = [];
        this.noteSpawnIndex = 0;
        
        // 谱面
        this.chartData = [];
        
        // 节拍器
        this.metronomeAngle = 0;
        this.metronomePulse = 0;
        this.pulseDirection = 1;
        
        // BPM和节奏
        this.bpm = 120;
        this.beatInterval = 60 / this.bpm;
        this.lastBeatTime = 0;
        
        // 视觉效果
        this.hitEffects = [];
        this.currentBgColor = DYNAMIC_RHYTHM_CONFIG.comboColorStages[0].color;
        this.targetBgColor = this.currentBgColor;
        
        // 音频管理器
        this.audioManager = new AudioManager();
        
        // 按键状态
        this.keysPressed = {};
        
        // Canvas上下文
        this.ctx = null;
        
        // 游戏元素
        this.startScreen = null;
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 创建Canvas
        this.createCanvas();
        
        // 初始化音频
        this.audioManager.init();
        
        // 生成谱面
        this.generateChart();
        
        // 创建开始界面
        this.createStartScreen();
        
        // 重置游戏状态
        this.resetGame();
        
        // 设置背景色过渡
        this.canvas.classList.add('bg-transition');
        
        console.log('动态律动游戏已初始化');
    }
    
    /**
     * 创建Canvas
     */
    createCanvas() {
        // 清空容器
        this.canvas.innerHTML = '';
        
        // 创建Canvas元素
        const canvasElement = document.createElement('canvas');
        canvasElement.id = 'rhythm-canvas';
        canvasElement.style.width = '100%';
        canvasElement.style.height = '100%';
        canvasElement.style.display = 'block';
        
        this.canvas.appendChild(canvasElement);
        
        // 获取上下文
        this.ctx = canvasElement.getContext('2d');
        
        // 设置Canvas尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * 调整Canvas尺寸
     */
    resizeCanvas() {
        const canvasElement = document.getElementById('rhythm-canvas');
        if (!canvasElement) return;
        
        canvasElement.width = this.canvas.clientWidth;
        canvasElement.height = this.canvas.clientHeight;
    }
    
    /**
     * 生成谱面
     */
    generateChart() {
        const generator = new ChartGenerator(this.bpm);
        this.chartData = generator.generate(120, 0.65); // 生成2分钟的谱面
        console.log(`已生成 ${this.chartData.length} 个音符`);
    }
    
    /**
     * 创建开始界面
     */
    createStartScreen() {
        this.startScreen = document.createElement('div');
        this.startScreen.className = 'start-screen';
        this.startScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: rgba(26, 26, 46, 0.95);
            z-index: 100;
        `;
        
        this.startScreen.innerHTML = `
            <h1 style="font-size: 4rem; font-weight: 900; margin-bottom: 20px; background: linear-gradient(45deg, #FF6B9D, #FFE156, #4ECDC4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                🎵 动态律动
            </h1>
            <p style="font-size: 1.5rem; margin-bottom: 40px; color: rgba(255,255,255,0.7);">
                音符从四周飞来，按方向键或空格键击打！
            </p>
            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <div style="text-align: center; padding: 20px; background: #16213E; border: 3px solid #4ECDC4;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">↑↓←→</div>
                    <div style="color: #4ECDC4;">方向键击打</div>
                </div>
                <div style="text-align: center; padding: 20px; background: #16213E; border: 3px solid #FF6B9D;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">SPACE</div>
                    <div style="color: #FF6B9D;">空格键击打</div>
                </div>
            </div>
            <button id="start-btn" style="
                padding: 20px 60px;
                font-size: 1.5rem;
                font-weight: 800;
                background: linear-gradient(45deg, #FF6B9D, #4ECDC4);
                color: #0F0F0F;
                border: none;
                cursor: pointer;
                box-shadow: 8px 8px 0px rgba(0,0,0,0.3);
                transition: all 0.2s ease;
            ">
                点击开始游戏
            </button>
        `;
        
        this.canvas.appendChild(this.startScreen);
        
        // 绑定开始按钮事件
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            this.startActualGame();
        });
        
        // 按任意键开始
        const keyHandler = (e) => {
            if (this.startScreen && this.startScreen.parentNode) {
                this.startActualGame();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    }
    
    /**
     * 实际开始游戏
     */
    startActualGame() {
        // 移除开始界面
        if (this.startScreen) {
            this.startScreen.remove();
            this.startScreen = null;
        }
        
        // 重置并开始
        this.resetGame();
        this.gameStartTime = performance.now();
        this.isRunning = true;
        
        // 播放开始音效
        this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.8 });
    }
    
    /**
     * 重置游戏状态
     */
    resetGame() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.activeNotes = [];
        this.noteSpawnIndex = 0;
        this.hitEffects = [];
        this.currentBgColor = DYNAMIC_RHYTHM_CONFIG.comboColorStages[0].color;
        this.targetBgColor = this.currentBgColor;
        this.updateScore(0);
        this.updateCombo(0);
        
        // 重置背景色
        this.canvas.style.backgroundColor = this.currentBgColor;
    }
    
    /**
     * 启动游戏
     */
    start() {
        this.isRunning = true;
    }
    
    /**
     * 暂停游戏
     */
    pause() {
        this.isRunning = false;
    }
    
    /**
     * 恢复游戏
     */
    resume() {
        this.isRunning = true;
    }
    
    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.audioManager.stopMusic();
    }
    
    /**
     * 渲染游戏帧
     */
    render(deltaTime) {
        if (!this.isRunning || !this.ctx || this.gameStartTime === undefined) return;
        
        const currentTime = (performance.now() - this.gameStartTime) / 1000;
        this.elapsedTime = currentTime;
        
        // 清空Canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // 更新背景色
        this.updateBackgroundColor();
        
        // 生成新音符
        this.spawnNotes(currentTime);
        
        // 更新节拍器
        this.updateMetronome(currentTime, deltaTime);
        
        // 更新和渲染音符
        this.updateAndRenderNotes(currentTime);
        
        // 渲染节拍器
        this.renderMetronome();
        
        // 渲染击中效果
        this.renderHitEffects(deltaTime);
    }
    
    /**
     * 生成音符
     */
    spawnNotes(currentTime) {
        while (this.noteSpawnIndex < this.chartData.length) {
            const noteData = this.chartData[this.noteSpawnIndex];
            
            // 如果音符应该生成了
            if (currentTime >= noteData.spawnTime) {
                const note = new Note(
                    noteData.direction,
                    noteData.color,
                    noteData.spawnTime,
                    noteData.targetTime
                );
                this.activeNotes.push(note);
                this.noteSpawnIndex++;
            } else {
                break;
            }
        }
    }
    
    /**
     * 更新节拍器
     */
    updateMetronome(currentTime, deltaTime) {
        // 脉冲动画
        this.metronomePulse += deltaTime * 0.003 * this.pulseDirection;
        if (this.metronomePulse > 1) {
            this.metronomePulse = 1;
            this.pulseDirection = -1;
        } else if (this.metronomePulse < 0) {
            this.metronomePulse = 0;
            this.pulseDirection = 1;
        }
        
        // 检查节拍
        const beats = Math.floor(currentTime / this.beatInterval);
        const beatTime = beats * this.beatInterval;
        
        if (beatTime !== this.lastBeatTime) {
            this.lastBeatTime = beatTime;
            // 节拍提示
            this.audioManager.playSound('hit', { pitch: 0.8, volume: 0.3 });
        }
    }
    
    /**
     * 更新和渲染音符
     */
    updateAndRenderNotes(currentTime) {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        // 过滤掉不活跃的音符
        this.activeNotes = this.activeNotes.filter(note => {
            note.update(currentTime);
            
            if (note.isActive) {
                // 渲染音符
                this.renderNote(note, centerX, centerY);
                return true;
            } else if (!note.isHit) {
                // 音符错过
                this.handleMiss();
                return false;
            }
            return false;
        });
    }
    
    /**
     * 渲染单个音符
     */
    renderNote(note, centerX, centerY) {
        const ctx = this.ctx;
        const size = DYNAMIC_RHYTHM_CONFIG.noteSize;
        
        ctx.save();
        ctx.translate(note.currentX, note.currentY);
        ctx.rotate((note.angle * Math.PI) / 180);
        
        // 绘制波普风格音符（带有阴影的几何形状）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-size/2 + 6, -size/2 + 6, size, size);
        
        // 主形状
        ctx.fillStyle = note.color;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // 边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // 方向指示
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -size/3);
        ctx.lineTo(-size/5, size/4);
        ctx.lineTo(size/5, size/4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 渲染节拍器
     */
    renderMetronome() {
        const ctx = this.ctx;
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const baseSize = DYNAMIC_RHYTHM_CONFIG.metronomeSize;
        const pulseSize = baseSize + (this.metronomePulse * 30);
        
        // 外圈（完美判定圈）
        ctx.beginPath();
        ctx.arc(centerX, centerY, DYNAMIC_RHYTHM_CONFIG.perfectRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 中圈（普通判定圈）
        ctx.beginPath();
        ctx.arc(centerX, centerY, DYNAMIC_RHYTHM_CONFIG.hitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 中心节拍器 - 波普风格
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // 阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-pulseSize/2 + 8, -pulseSize/2 + 8, pulseSize, pulseSize);
        
        // 主形状（使用圆角矩形）
        const radius = 20;
        ctx.beginPath();
        ctx.moveTo(-pulseSize/2 + radius, -pulseSize/2);
        ctx.lineTo(pulseSize/2 - radius, -pulseSize/2);
        ctx.quadraticCurveTo(pulseSize/2, -pulseSize/2, pulseSize/2, -pulseSize/2 + radius);
        ctx.lineTo(pulseSize/2, pulseSize/2 - radius);
        ctx.quadraticCurveTo(pulseSize/2, pulseSize/2, pulseSize/2 - radius, pulseSize/2);
        ctx.lineTo(-pulseSize/2 + radius, pulseSize/2);
        ctx.quadraticCurveTo(-pulseSize/2, pulseSize/2, -pulseSize/2, pulseSize/2 - radius);
        ctx.lineTo(-pulseSize/2, -pulseSize/2 + radius);
        ctx.quadraticCurveTo(-pulseSize/2, -pulseSize/2, -pulseSize/2 + radius, -pulseSize/2);
        ctx.closePath();
        
        ctx.fillStyle = DYNAMIC_RHYTHM_CONFIG.colors.metronome;
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // 中心装饰
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        ctx.restore();
        
        // 方向指示器
        this.renderDirectionIndicators(centerX, centerY);
    }
    
    /**
     * 渲染方向指示器
     */
    renderDirectionIndicators(centerX, centerY) {
        const ctx = this.ctx;
        const indicatorRadius = DYNAMIC_RHYTHM_CONFIG.hitRadius + 50;
        const size = 30;
        
        const directions = [
            { dir: 'up', x: centerX, y: centerY - indicatorRadius, angle: 0 },
            { dir: 'down', x: centerX, y: centerY + indicatorRadius, angle: 180 },
            { dir: 'left', x: centerX - indicatorRadius, y: centerY, angle: 90 },
            { dir: 'right', x: centerX + indicatorRadius, y: centerY, angle: -90 }
        ];
        
        directions.forEach(({ dir, x, y, angle }) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((angle * Math.PI) / 180);
            
            // 三角形指示器
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(-size * 0.7, size * 0.3);
            ctx.lineTo(size * 0.7, size * 0.3);
            ctx.closePath();
            
            // 检查该方向是否有即将到来的音符
            const hasNote = this.activeNotes.some(note => 
                note.direction === dir && 
                note.isActive &&
                Math.abs(this.elapsedTime - note.targetTime) < 0.5
            );
            
            if (hasNote) {
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#FFE156';
                ctx.lineWidth = 4;
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    /**
     * 渲染击中效果
     */
    renderHitEffects(deltaTime) {
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.life -= deltaTime;
            effect.radius += deltaTime * 0.5;
            effect.alpha = effect.life / effect.maxLife;
            
            if (effect.life > 0) {
                const ctx = this.ctx;
                ctx.save();
                ctx.globalAlpha = effect.alpha;
                
                // 扩散圆圈
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 6;
                ctx.stroke();
                
                // 文字提示
                if (effect.text) {
                    ctx.font = 'bold 36px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = effect.color;
                    ctx.fillText(effect.text, effect.x, effect.y - effect.radius);
                }
                
                ctx.restore();
                return true;
            }
            return false;
        });
    }
    
    /**
     * 更新背景颜色
     */
    updateBackgroundColor() {
        // 根据连击数找到对应颜色
        const stages = DYNAMIC_RHYTHM_CONFIG.comboColorStages;
        let newColor = stages[0].color;
        
        for (let i = stages.length - 1; i >= 0; i--) {
            if (this.combo >= stages[i].minCombo) {
                newColor = stages[i].color;
                break;
            }
        }
        
        // 平滑过渡到新颜色
        if (newColor !== this.targetBgColor) {
            this.targetBgColor = newColor;
        }
        
        // 应用颜色
        this.canvas.style.backgroundColor = this.targetBgColor;
    }
    
    /**
     * 处理输入
     */
    handleInput(eventType, event) {
        if (eventType === 'keydown') {
            // 初始化音频（第一次按键时）
            this.audioManager.init();
            
            const key = event.key;
            const currentTime = this.elapsedTime;
            
            // 支持的按键
            const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
            
            if (validKeys.includes(key) && !this.keysPressed[key]) {
                this.keysPressed[key] = true;
                this.attemptHit(key, currentTime);
            }
        } else if (eventType === 'keyup') {
            this.keysPressed[event.key] = false;
        }
    }
    
    /**
     * 尝试击中音符
     */
    attemptHit(key, currentTime) {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        // 空格键可以击打任何方向的音符
        // 方向键只能击打对应方向的音符
        let hitNote = null;
        let hitQuality = null;
        
        // 按目标时间排序，优先击打最接近的
        const sortedNotes = [...this.activeNotes]
            .filter(note => note.isActive)
            .sort((a, b) => Math.abs(a.targetTime - currentTime) - Math.abs(b.targetTime - currentTime));
        
        for (const note of sortedNotes) {
            // 检查按键方向
            if (key !== ' ' && note.keyCode !== key) continue;
            
            const quality = note.checkHit(currentTime);
            if (quality) {
                hitNote = note;
                hitQuality = quality;
                break;
            }
        }
        
        if (hitNote && hitQuality) {
            // 击中！
            hitNote.hit();
            this.handleHit(hitQuality, hitNote.currentX || centerX, hitNote.currentY || centerY);
        }
    }
    
    /**
     * 处理击中
     */
    handleHit(quality, x, y) {
        let points = 0;
        let color = '';
        let text = '';
        
        switch (quality) {
            case 'perfect':
                points = DYNAMIC_RHYTHM_CONFIG.perfectScore;
                color = DYNAMIC_RHYTHM_CONFIG.colors.perfect;
                text = 'PERFECT!';
                
                // 连击加成
                this.combo++;
                points = Math.floor(points * (1 + this.combo * 0.01));
                
                // 完美击中特效：地震般的震动
                this.triggerShake(30, 400);
                this.triggerFlash('rgba(255, 255, 255, 0.3)', 200);
                
                // 音效
                this.audioManager.playSound('perfect', { pitch: 1.2, volume: 1 });
                
                break;
                
            case 'good':
                points = DYNAMIC_RHYTHM_CONFIG.goodScore;
                color = DYNAMIC_RHYTHM_CONFIG.colors.good;
                text = 'GOOD';
                
                // 连击继续
                this.combo++;
                points = Math.floor(points * (1 + this.combo * 0.005));
                
                // 轻微震动
                this.triggerShake(15, 200);
                
                // 音效
                this.audioManager.playSound('hit', { pitch: 1, volume: 0.8 });
                
                break;
        }
        
        // 更新分数和连击
        this.score += points;
        this.updateScore(this.score);
        this.updateCombo(this.combo);
        
        // 更新最高连击
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // 连击音效
        if (this.combo > 0 && this.combo % 10 === 0) {
            this.audioManager.playSound('combo', { pitch: 1 + this.combo * 0.01, volume: 0.7 });
        }
        
        // 添加视觉效果
        this.hitEffects.push({
            x,
            y,
            radius: 20,
            color,
            text,
            life: 500,
            maxLife: 500,
            alpha: 1
        });
    }
    
    /**
     * 处理错过
     */
    handleMiss() {
        // 重置连击
        this.combo = 0;
        this.updateCombo(this.combo);
        
        // 扣分
        this.score += DYNAMIC_RHYTHM_CONFIG.missPenalty;
        this.score = Math.max(0, this.score);
        this.updateScore(this.score);
        
        // 音效
        this.audioManager.playSound('miss', { volume: 0.5 });
    }
}

// 将游戏类暴露到全局
window.DynamicRhythmGame = DynamicRhythmGame;