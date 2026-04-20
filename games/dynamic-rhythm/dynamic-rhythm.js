/**
 * 动态律动 - 音乐小游戏
 * 波普风格：高饱和对比色、粗黑边框、波点底纹、几何形状
 * 核心玩法：音符从四周飞向中心节拍器，按空格键或方向键击打
 */

// ==========================================
// 波普风格配色配置
// ==========================================
const POP_COLORS = {
    // 高饱和主色调 - 波普风格核心
    ELECTRIC_PINK: '#FF1493',      // 电粉
    NEON_YELLOW: '#FFD700',         // 霓虹黄
    CYAN_BLUE: '#00FFFF',           // 青蓝
    LIME_GREEN: '#39FF14',          // 酸橙绿
    HOT_PINK: '#FF69B4',            // 亮粉
    ORANGE_RED: '#FF4500',          // 橙红
    PURPLE: '#9400D3',              // 深紫
    TURQUOISE: '#40E0D0',           // 绿松石
    MAGENTA: '#FF00FF',             // 品红
    YELLOW_GREEN: '#9ACD32',        // 黄绿
    
    // 黑色和白色（用于边框和文字）
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    
    // 波点底纹颜色
    DOT_COLOR: 'rgba(0, 0, 0, 0.15)',
    DOT_COLOR_LIGHT: 'rgba(255, 255, 255, 0.15)'
};

// 游戏配置
const DYNAMIC_RHYTHM_CONFIG = {
    // 音符配置
    noteSpeed: 300,
    hitRadius: 90,
    perfectRadius: 50,
    noteSize: 60,
    
    // 节拍器配置
    metronomeSize: 120,
    pulseSpeed: 0.4,
    
    // 评分配置
    perfectScore: 100,
    goodScore: 50,
    missPenalty: -10,
    
    // 音效配置
    sounds: {
        hit: 'hit',
        perfect: 'perfect',
        miss: 'miss',
        combo: 'combo'
    },
    
    // 颜色配置 - 波普风格
    colors: {
        metronome: POP_COLORS.ELECTRIC_PINK,
        notes: [
            POP_COLORS.NEON_YELLOW,
            POP_COLORS.CYAN_BLUE,
            POP_COLORS.LIME_GREEN,
            POP_COLORS.HOT_PINK,
            POP_COLORS.ORANGE_RED,
            POP_COLORS.MAGENTA,
            POP_COLORS.TURQUOISE
        ],
        perfect: POP_COLORS.WHITE,
        good: POP_COLORS.NEON_YELLOW,
        miss: POP_COLORS.ORANGE_RED
    },
    
    // 连击颜色阶梯（根据连击数变化背景色 - 波普风格高饱和色）
    comboColorStages: [
        { minCombo: 0, color: POP_COLORS.ELECTRIC_PINK, dots: true },
        { minCombo: 5, color: POP_COLORS.NEON_YELLOW, dots: true },
        { minCombo: 10, color: POP_COLORS.CYAN_BLUE, dots: true },
        { minCombo: 20, color: POP_COLORS.LIME_GREEN, dots: true },
        { minCombo: 30, color: POP_COLORS.HOT_PINK, dots: true },
        { minCombo: 50, color: POP_COLORS.ORANGE_RED, dots: true },
        { minCombo: 80, color: POP_COLORS.MAGENTA, dots: true },
        { minCombo: 100, color: POP_COLORS.TURQUOISE, dots: true, invert: true }
    ]
};

// ==========================================
// 粒子系统类
// ==========================================
class Particle {
    constructor(x, y, color, type = 'explosion') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        
        // 随机速度和方向
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 300;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // 大小和旋转
        this.size = 5 + Math.random() * 15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        
        // 生命周期
        this.life = 0.5 + Math.random() * 0.5;
        this.maxLife = this.life;
        this.alpha = 1;
        
        // 重力
        this.gravity = 200;
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000;
        
        // 更新位置
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // 应用重力
        this.vy += this.gravity * dt;
        
        // 更新旋转
        this.rotation += this.rotationSpeed * dt;
        
        // 更新生命周期
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        
        // 缩小
        this.size *= 0.98;
        
        return this.life > 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        // 波普风格粒子 - 几何形状
        ctx.fillStyle = this.color;
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 2;
        
        // 随机选择形状
        const shapeType = Math.floor(Math.random() * 3);
        
        if (shapeType === 0) {
            // 方形
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        } else if (shapeType === 1) {
            // 圆形
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // 三角形
            ctx.beginPath();
            ctx.moveTo(0, -this.size/2);
            ctx.lineTo(-this.size/2, this.size/2);
            ctx.lineTo(this.size/2, this.size/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ==========================================
// 音符类 - 波普风格
// ==========================================
class Note {
    constructor(direction, color, spawnTime, targetTime) {
        this.direction = direction;
        this.color = color;
        this.spawnTime = spawnTime;
        this.targetTime = targetTime;
        this.id = Math.random().toString(36).substr(2, 9);
        
        // 状态
        this.isActive = true;
        this.isHit = false;
        
        // 消失动画状态
        this.isDisappearing = false;
        this.disappearProgress = 0;
        this.disappearType = null; // 'explode', 'shrink', 'spin'
        
        // 位置计算
        this.currentX = 0;
        this.currentY = 0;
        this.angle = 0;
        
        // 动画参数
        this.bounceOffset = 0;
        this.bouncePhase = Math.random() * Math.PI * 2;
        this.rotationAngle = 0;
        
        this.calculatePositions();
    }
    
    calculatePositions() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 根据方向计算起始位置和角度
        switch (this.direction) {
            case 'up':
                this.startX = centerX;
                this.startY = -DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.angle = 0;
                this.moveDirX = 0;
                this.moveDirY = 1;
                this.keyCode = 'ArrowUp';
                break;
            case 'down':
                this.startX = centerX;
                this.startY = window.innerHeight + DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.angle = 180;
                this.moveDirX = 0;
                this.moveDirY = -1;
                this.keyCode = 'ArrowDown';
                break;
            case 'left':
                this.startX = -DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.startY = centerY;
                this.angle = 90;
                this.moveDirX = 1;
                this.moveDirY = 0;
                this.keyCode = 'ArrowLeft';
                break;
            case 'right':
                this.startX = window.innerWidth + DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
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
     */
    update(currentTime) {
        if (!this.isActive) return;
        
        if (this.isDisappearing) {
            // 消失动画
            this.disappearProgress += 0.05;
            if (this.disappearProgress >= 1) {
                this.isActive = false;
            }
            return;
        }
        
        const progress = (currentTime - this.spawnTime) / (this.targetTime - this.spawnTime);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        
        // 使用缓动函数使运动更自然
        const easedProgress = this.easeInOutQuad(clampedProgress);
        
        this.currentX = this.startX + (this.targetX - this.startX) * easedProgress;
        this.currentY = this.startY + (this.targetY - this.startY) * easedProgress;
        
        // 弹跳动画
        this.bouncePhase += 0.1;
        this.bounceOffset = Math.sin(this.bouncePhase) * 5;
        
        // 轻微旋转
        this.rotationAngle = Math.sin(this.bouncePhase * 0.5) * 10;
        
        // 检查是否已经过了目标时间（错过）
        if (currentTime > this.targetTime + 0.3) {
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
     */
    checkHit(currentTime) {
        if (!this.isActive || this.isHit || this.isDisappearing) return null;
        
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
     * 击中音符 - 开始消失动画
     */
    hit(type = 'perfect') {
        this.isHit = true;
        this.isDisappearing = true;
        this.disappearProgress = 0;
        this.disappearType = type === 'perfect' ? 'explode' : 'shrink';
    }
    
    /**
     * 错过音符
     */
    miss() {
        this.isDisappearing = true;
        this.disappearProgress = 0;
        this.disappearType = 'spin';
    }
    
    /**
     * 渲染音符（波普风格）
     */
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isActive) return;
        
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        ctx.save();
        
        if (this.isDisappearing) {
            // 消失动画
            const scale = 1 - this.disappearProgress;
            const alpha = 1 - this.disappearProgress;
            
            if (this.disappearType === 'explode') {
                // 爆炸式消失：缩放 + 旋转 + 淡出
                ctx.translate(this.currentX, this.currentY);
                ctx.scale(1 + this.disappearProgress * 2, 1 + this.disappearProgress * 2);
                ctx.rotate(this.disappearProgress * Math.PI);
                ctx.globalAlpha = alpha;
                this.drawNoteShape(ctx, 1);
            } else if (this.disappearType === 'shrink') {
                // 收缩式消失
                ctx.translate(this.currentX, this.currentY);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                this.drawNoteShape(ctx, 1);
            } else if (this.disappearType === 'spin') {
                // 旋转消失
                ctx.translate(this.currentX, this.currentY);
                ctx.scale(scale, scale);
                ctx.rotate(this.disappearProgress * Math.PI * 4);
                ctx.globalAlpha = alpha;
                this.drawNoteShape(ctx, 1);
            }
        } else {
            // 正常渲染
            ctx.translate(this.currentX, this.currentY + this.bounceOffset);
            ctx.rotate((this.rotationAngle * Math.PI) / 180);
            this.drawNoteShape(ctx, 1);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制音符形状（波普风格 - 音符图标）
     */
    drawNoteShape(ctx, scale = 1) {
        const size = DYNAMIC_RHYTHM_CONFIG.noteSize * scale;
        
        // 1. 粗黑边框阴影（波普风格特征）
        ctx.fillStyle = POP_COLORS.BLACK;
        this.drawMusicalNote(ctx, size + 8, 4, 4);
        
        // 2. 主形状
        ctx.fillStyle = this.color;
        this.drawMusicalNote(ctx, size, 0, 0);
        
        // 3. 黑色边框
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 4;
        this.drawMusicalNote(ctx, size, 0, 0, true);
        
        // 4. 高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-size/4, -size/4, size/6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 绘制音符图标（♪ 符号）
     */
    drawMusicalNote(ctx, size, offsetX, offsetY, isStroke = false) {
        ctx.beginPath();
        
        // 音符头部（椭圆形）
        const headWidth = size * 0.8;
        const headHeight = size * 0.5;
        const headX = offsetX;
        const headY = offsetY;
        
        ctx.ellipse(headX, headY, headWidth/2, headHeight/2, -Math.PI/6, 0, Math.PI * 2);
        
        if (isStroke) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
        
        // 符干
        ctx.beginPath();
        ctx.moveTo(headX + headWidth/3, headY - headHeight/2);
        ctx.lineTo(headX + headWidth/3, headY - size * 1.2);
        ctx.lineWidth = size * 0.1;
        
        if (isStroke) {
            ctx.strokeStyle = POP_COLORS.BLACK;
            ctx.lineCap = 'round';
            ctx.stroke();
        } else {
            ctx.stroke();
        }
        
        // 符尾（装饰性）
        if (!isStroke) {
            ctx.beginPath();
            ctx.moveTo(headX + headWidth/3, headY - size * 1.2);
            ctx.quadraticCurveTo(
                headX + size * 0.8, headY - size * 1.0,
                headX + headWidth/3, headY - size * 0.8
            );
            ctx.lineWidth = size * 0.08;
            ctx.stroke();
        }
    }
}

// ==========================================
// 谱面生成器
// ==========================================
class ChartGenerator {
    constructor(bpm = 120, timeSignature = { upper: 4, lower: 4 }) {
        this.bpm = bpm;
        this.timeSignature = timeSignature;
        this.beatDuration = 60 / bpm;
        this.measureDuration = this.beatDuration * timeSignature.upper;
    }
    
    generate(duration = 60, density = 0.6) {
        const notes = [];
        const directions = ['up', 'down', 'left', 'right'];
        const colors = DYNAMIC_RHYTHM_CONFIG.colors.notes;
        
        const totalBeats = Math.ceil(duration / this.beatDuration);
        
        for (let beat = 0; beat < totalBeats; beat++) {
            const targetTime = beat * this.beatDuration;
            
            if (Math.random() > density) continue;
            
            const isDownbeat = (beat % this.timeSignature.upper) === 0;
            
            if (isDownbeat && Math.random() < 0.4) {
                // 重拍可以生成多个音符
                const noteCount = Math.random() < 0.3 ? 2 : 1;
                const usedDirections = new Set();
                
                for (let i = 0; i < noteCount; i++) {
                    let direction;
                    do {
                        direction = directions[Math.floor(Math.random() * directions.length)];
                    } while (usedDirections.has(direction) && usedDirections.size < directions.length);
                    
                    usedDirections.add(direction);
                    
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
            } else {
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
        
        notes.sort((a, b) => a.targetTime - b.targetTime);
        return notes;
    }
}

// ==========================================
// 动态律动游戏主类 - 波普风格
// ==========================================
class DynamicRhythmGame extends GameInterface {
    static get metadata() {
        return {
            id: 'dynamic-rhythm',
            name: '动态律动',
            description: '波普风格音乐节奏游戏，按空格键或方向键对准节拍！',
            icon: '🎵',
            colors: {
                primary: POP_COLORS.ELECTRIC_PINK,
                secondary: POP_COLORS.CYAN_BLUE
            }
        };
    }
    
    constructor(context) {
        super(context);
        
        this.gameStartTime = undefined;
        this.elapsedTime = 0;
        this.maxCombo = 0;
        
        this.notes = [];
        this.activeNotes = [];
        this.noteSpawnIndex = 0;
        this.chartData = [];
        
        this.metronomeAngle = 0;
        this.metronomePulse = 0;
        this.pulseDirection = 1;
        
        this.bpm = 120;
        this.beatInterval = 60 / this.bpm;
        this.lastBeatTime = 0;
        
        // 视觉效果
        this.hitEffects = [];
        this.particles = [];
        this.currentBgColor = DYNAMIC_RHYTHM_CONFIG.comboColorStages[0].color;
        this.targetBgColor = this.currentBgColor;
        this.isInverted = false;
        
        // Combo显示动画
        this.comboScale = 1;
        this.comboTargetScale = 1;
        this.comboRotation = 0;
        this.comboColor = POP_COLORS.WHITE;
        this.lastCombo = 0;
        
        // 按键反馈
        this.keyFeedback = {
            up: { pressed: false, scale: 1 },
            down: { pressed: false, scale: 1 },
            left: { pressed: false, scale: 1 },
            right: { pressed: false, scale: 1 },
            space: { pressed: false, scale: 1 }
        };
        
        // 波点纹理缓存
        this.dotPattern = null;
        
        // 音频管理器
        this.audioManager = new AudioManager();
        this.keysPressed = {};
        this.ctx = null;
        this.startScreen = null;
    }
    
    init() {
        this.createCanvas();
        this.audioManager.init();
        this.generateChart();
        this.createStartScreen();
        this.resetGame();
        this.canvas.classList.add('bg-transition');
        
        console.log('动态律动游戏已初始化（波普风格）');
    }
    
    createCanvas() {
        this.canvas.innerHTML = '';
        
        const canvasElement = document.createElement('canvas');
        canvasElement.id = 'rhythm-canvas';
        canvasElement.style.width = '100%';
        canvasElement.style.height = '100%';
        canvasElement.style.display = 'block';
        
        this.canvas.appendChild(canvasElement);
        this.ctx = canvasElement.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 创建波点纹理
        this.createDotPattern();
    }
    
    /**
     * 创建波点纹理（波普风格核心元素）
     */
    createDotPattern() {
        const patternCanvas = document.createElement('canvas');
        const pctx = patternCanvas.getContext('2d');
        const dotSize = 30;
        const spacing = 60;
        
        patternCanvas.width = spacing;
        patternCanvas.height = spacing;
        
        pctx.fillStyle = POP_COLORS.DOT_COLOR;
        pctx.beginPath();
        pctx.arc(spacing/2, spacing/2, dotSize/2, 0, Math.PI * 2);
        pctx.fill();
        
        this.dotPattern = this.ctx.createPattern(patternCanvas, 'repeat');
    }
    
    resizeCanvas() {
        const canvasElement = document.getElementById('rhythm-canvas');
        if (!canvasElement) return;
        
        canvasElement.width = this.canvas.clientWidth;
        canvasElement.height = this.canvas.clientHeight;
        
        // 重新创建波点纹理
        if (this.ctx) {
            this.createDotPattern();
        }
    }
    
    generateChart() {
        const generator = new ChartGenerator(this.bpm);
        this.chartData = generator.generate(120, 0.65);
        console.log(`已生成 ${this.chartData.length} 个音符`);
    }
    
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
            background: linear-gradient(135deg, ${POP_COLORS.ELECTRIC_PINK} 0%, ${POP_COLORS.CYAN_BLUE} 100%);
            z-index: 100;
        `;
        
        this.startScreen.innerHTML = `
            <div style="text-align: center; padding: 40px; background: ${POP_COLORS.BLACK}; border: 8px solid ${POP_COLORS.NEON_YELLOW}; box-shadow: 12px 12px 0px rgba(0,0,0,0.5);">
                <h1 style="font-size: 5rem; font-weight: 900; margin-bottom: 20px; color: ${POP_COLORS.ELECTRIC_PINK}; text-shadow: 6px 6px 0px ${POP_COLORS.BLACK};">
                    🎵 动态律动
                </h1>
                <p style="font-size: 1.8rem; margin-bottom: 40px; color: ${POP_COLORS.WHITE}; font-weight: 700;">
                    波普风格音乐节奏游戏
                </p>
                <div style="display: flex; gap: 30px; margin-bottom: 40px; justify-content: center; flex-wrap: wrap;">
                    <div style="text-align: center; padding: 25px; background: ${POP_COLORS.NEON_YELLOW}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 3rem; margin-bottom: 15px;">♪ ♫ ♬</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1.2rem;">音符图标</div>
                    </div>
                    <div style="text-align: center; padding: 25px; background: ${POP_COLORS.CYAN_BLUE}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2.5rem; margin-bottom: 15px;">↑↓←→</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1.2rem;">方向键击打</div>
                    </div>
                    <div style="text-align: center; padding: 25px; background: ${POP_COLORS.LIME_GREEN}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2.5rem; margin-bottom: 15px;">SPACE</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1.2rem;">空格键击打</div>
                    </div>
                </div>
                <button id="start-btn" style="
                    padding: 25px 80px;
                    font-size: 2rem;
                    font-weight: 900;
                    background: ${POP_COLORS.NEON_YELLOW};
                    color: ${POP_COLORS.BLACK};
                    border: 8px solid ${POP_COLORS.BLACK};
                    cursor: pointer;
                    box-shadow: 10px 10px 0px rgba(0,0,0,0.5);
                    transition: all 0.1s ease;
                    text-transform: uppercase;
                ">
                    ▶ 点击开始游戏
                </button>
                <p style="margin-top: 30px; color: ${POP_COLORS.WHITE}; font-size: 1.2rem;">
                    或按任意键开始
                </p>
            </div>
        `;
        
        this.canvas.appendChild(this.startScreen);
        
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            this.startActualGame();
        });
        
        startBtn.addEventListener('mouseover', () => {
            startBtn.style.transform = 'translate(-4px, -4px)';
            startBtn.style.boxShadow = '14px 14px 0px rgba(0,0,0,0.5)';
        });
        
        startBtn.addEventListener('mouseout', () => {
            startBtn.style.transform = 'translate(0, 0)';
            startBtn.style.boxShadow = '10px 10px 0px rgba(0,0,0,0.5)';
        });
        
        const keyHandler = (e) => {
            if (this.startScreen && this.startScreen.parentNode) {
                this.startActualGame();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
    }
    
    startActualGame() {
        if (this.startScreen) {
            this.startScreen.remove();
            this.startScreen = null;
        }
        
        this.resetGame();
        this.gameStartTime = performance.now();
        this.isRunning = true;
        
        this.audioManager.playSound('combo', { pitch: 1.5, volume: 0.8 });
    }
    
    resetGame() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.notes = [];
        this.activeNotes = [];
        this.noteSpawnIndex = 0;
        this.hitEffects = [];
        this.particles = [];
        this.currentBgColor = DYNAMIC_RHYTHM_CONFIG.comboColorStages[0].color;
        this.targetBgColor = this.currentBgColor;
        this.isInverted = false;
        this.gameStartTime = undefined;
        this.comboScale = 1;
        this.comboTargetScale = 1;
        this.lastCombo = 0;
        
        this.updateScore(0);
        this.updateCombo(0);
        
        this.canvas.style.backgroundColor = this.currentBgColor;
    }
    
    start() {
        this.isRunning = true;
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        this.isRunning = true;
    }
    
    stop() {
        this.isRunning = false;
        this.audioManager.stopMusic();
    }
    
    /**
     * 渲染游戏帧（波普风格）
     */
    render(deltaTime) {
        if (!this.isRunning || !this.ctx || this.gameStartTime === undefined) return;
        
        const currentTime = (performance.now() - this.gameStartTime) / 1000;
        this.elapsedTime = currentTime;
        
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        
        // 1. 绘制背景（波普风格 - 高饱和色 + 波点底纹）
        this.renderBackground(width, height);
        
        // 2. 生成新音符
        this.spawnNotes(currentTime);
        
        // 3. 更新节拍器
        this.updateMetronome(currentTime, deltaTime);
        
        // 4. 更新和渲染音符
        this.updateAndRenderNotes(currentTime, width, height);
        
        // 5. 渲染节拍器
        this.renderMetronome(width, height);
        
        // 6. 渲染方向指示器（音符图标）
        this.renderDirectionIndicators(width, height, deltaTime);
        
        // 7. 渲染Combo数字（中心巨大显示）
        this.renderComboDisplay(width, height, deltaTime);
        
        // 8. 渲染粒子效果
        this.renderParticles(deltaTime);
        
        // 9. 渲染击中效果
        this.renderHitEffects(deltaTime);
        
        // 10. 更新按键反馈动画
        this.updateKeyFeedback(deltaTime);
    }
    
    /**
     * 渲染背景（波普风格 - 高饱和色 + 波点底纹）
     */
    renderBackground(width, height) {
        // 平滑过渡背景色
        if (this.currentBgColor !== this.targetBgColor) {
            this.currentBgColor = this.lerpColor(this.currentBgColor, this.targetBgColor, 0.05);
        }
        
        // 填充背景色
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, width, height);
        
        // 波点底纹（波普风格核心）
        if (this.dotPattern) {
            this.ctx.save();
            this.ctx.globalAlpha = this.isInverted ? 0.2 : 0.15;
            this.ctx.fillStyle = this.isInverted ? POP_COLORS.DOT_COLOR_LIGHT : POP_COLORS.DOT_COLOR;
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.restore();
        }
        
        // 色彩反转效果（高连击时）
        if (this.isInverted) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'difference';
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.restore();
        }
    }
    
    /**
     * 颜色插值
     */
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        if (!c1 || !c2) return color2;
        
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hexToRgb(hex) {
        if (hex.startsWith('rgb')) return null;
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    spawnNotes(currentTime) {
        while (this.noteSpawnIndex < this.chartData.length) {
            const noteData = this.chartData[this.noteSpawnIndex];
            
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
            this.audioManager.playSound('hit', { pitch: 0.8, volume: 0.3 });
        }
    }
    
    updateAndRenderNotes(currentTime, width, height) {
        this.activeNotes = this.activeNotes.filter(note => {
            note.update(currentTime);
            
            if (note.isActive) {
                note.render(this.ctx, width, height);
                return true;
            } else if (!note.isHit && !note.isDisappearing) {
                this.handleMiss();
                return false;
            }
            return note.isActive;
        });
    }
    
    /**
     * 渲染节拍器（波普风格）
     */
    renderMetronome(width, height) {
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        const baseSize = DYNAMIC_RHYTHM_CONFIG.metronomeSize;
        const pulseSize = baseSize + (this.metronomePulse * 40);
        
        // 外圈（完美判定圈 - 波普风格粗边框）
        ctx.beginPath();
        ctx.arc(centerX, centerY, DYNAMIC_RHYTHM_CONFIG.perfectRadius, 0, Math.PI * 2);
        ctx.strokeStyle = POP_COLORS.WHITE;
        ctx.lineWidth = 6;
        ctx.setLineDash([15, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 中圈（普通判定圈）
        ctx.beginPath();
        ctx.arc(centerX, centerY, DYNAMIC_RHYTHM_CONFIG.hitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 中心节拍器 - 波普风格
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // 1. 粗黑阴影（波普风格特征）
        ctx.fillStyle = POP_COLORS.BLACK;
        this.drawPopMetronome(ctx, pulseSize + 12, 8, 8);
        
        // 2. 主形状
        ctx.fillStyle = DYNAMIC_RHYTHM_CONFIG.colors.metronome;
        this.drawPopMetronome(ctx, pulseSize, 0, 0);
        
        // 3. 粗黑边框
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 8;
        this.drawPopMetronome(ctx, pulseSize, 0, 0, true);
        
        // 4. 内部装饰（几何图案）
        ctx.fillStyle = POP_COLORS.WHITE;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // 5. 音符图标装饰
        ctx.fillStyle = POP_COLORS.BLACK;
        ctx.font = `bold ${pulseSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', 0, 0);
        
        ctx.restore();
    }
    
    /**
     * 绘制波普风格节拍器（方形带圆角）
     */
    drawPopMetronome(ctx, size, offsetX, offsetY, isStroke = false) {
        const radius = size * 0.2;
        const halfSize = size / 2;
        
        ctx.beginPath();
        ctx.moveTo(-halfSize + radius + offsetX, -halfSize + offsetY);
        ctx.lineTo(halfSize - radius + offsetX, -halfSize + offsetY);
        ctx.quadraticCurveTo(halfSize + offsetX, -halfSize + offsetY, halfSize + offsetX, -halfSize + radius + offsetY);
        ctx.lineTo(halfSize + offsetX, halfSize - radius + offsetY);
        ctx.quadraticCurveTo(halfSize + offsetX, halfSize + offsetY, halfSize - radius + offsetX, halfSize + offsetY);
        ctx.lineTo(-halfSize + radius + offsetX, halfSize + offsetY);
        ctx.quadraticCurveTo(-halfSize + offsetX, halfSize + offsetY, -halfSize + offsetX, halfSize - radius + offsetY);
        ctx.lineTo(-halfSize + offsetX, -halfSize + radius + offsetY);
        ctx.quadraticCurveTo(-halfSize + offsetX, -halfSize + offsetY, -halfSize + radius + offsetX, -halfSize + offsetY);
        ctx.closePath();
        
        if (isStroke) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
    }
    
    /**
     * 渲染方向指示器（音符图标替代箭头）
     */
    renderDirectionIndicators(width, height, deltaTime) {
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        const indicatorRadius = DYNAMIC_RHYTHM_CONFIG.hitRadius + 80;
        const size = 50;
        
        const directions = [
            { dir: 'up', key: 'ArrowUp', x: centerX, y: centerY - indicatorRadius, angle: 0 },
            { dir: 'down', key: 'ArrowDown', x: centerX, y: centerY + indicatorRadius, angle: 180 },
            { dir: 'left', key: 'ArrowLeft', x: centerX - indicatorRadius, y: centerY, angle: 90 },
            { dir: 'right', key: 'ArrowRight', x: centerX + indicatorRadius, y: centerY, angle: -90 }
        ];
        
        directions.forEach(({ dir, key, x, y, angle }) => {
            // 检查该方向是否有即将到来的音符
            const hasNote = this.activeNotes.some(note => 
                note.direction === dir && 
                note.isActive &&
                Math.abs(this.elapsedTime - note.targetTime) < 0.5
            );
            
            // 检查按键状态
            const isPressed = this.keysPressed[key] || this.keysPressed[' '];
            const feedback = this.keyFeedback[dir];
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((angle * Math.PI) / 180);
            
            // 缩放效果（按键时）
            const scale = isPressed ? 1.3 : 1;
            ctx.scale(scale, scale);
            
            // 发光效果
            if (isPressed || hasNote) {
                ctx.shadowColor = hasNote ? POP_COLORS.NEON_YELLOW : POP_COLORS.LIME_GREEN;
                ctx.shadowBlur = isPressed ? 30 : 15;
            }
            
            // 绘制音符图标
            const noteSize = size;
            
            // 阴影
            ctx.fillStyle = POP_COLORS.BLACK;
            this.drawIndicatorNote(ctx, noteSize + 6, 3, 3);
            
            // 主形状
            ctx.fillStyle = hasNote ? POP_COLORS.NEON_YELLOW : (isPressed ? POP_COLORS.LIME_GREEN : 'rgba(255, 255, 255, 0.6)');
            this.drawIndicatorNote(ctx, noteSize, 0, 0);
            
            // 边框
            ctx.strokeStyle = POP_COLORS.BLACK;
            ctx.lineWidth = 4;
            this.drawIndicatorNote(ctx, noteSize, 0, 0, true);
            
            ctx.restore();
        });
    }
    
    /**
     * 绘制指示器音符图标
     */
    drawIndicatorNote(ctx, size, offsetX, offsetY, isStroke = false) {
        ctx.beginPath();
        
        // 音符头部
        const headWidth = size * 0.8;
        const headHeight = size * 0.5;
        
        ctx.ellipse(offsetX, offsetY, headWidth/2, headHeight/2, -Math.PI/6, 0, Math.PI * 2);
        
        if (isStroke) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
        
        // 符干
        if (!isStroke) {
            ctx.beginPath();
            ctx.moveTo(offsetX + headWidth/3, offsetY - headHeight/2);
            ctx.lineTo(offsetX + headWidth/3, offsetY - size * 1.0);
            ctx.lineWidth = size * 0.12;
            ctx.strokeStyle = isStroke ? POP_COLORS.BLACK : ctx.fillStyle;
            ctx.stroke();
        }
    }
    
    /**
     * 渲染中心巨大Combo数字
     */
    renderComboDisplay(width, height, deltaTime) {
        if (this.combo <= 0) return;
        
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Combo增加时的动画
        if (this.combo > this.lastCombo) {
            this.comboTargetScale = 1.5;
            this.comboRotation = (Math.random() - 0.5) * 20;
        }
        this.lastCombo = this.combo;
        
        // 平滑缩放
        this.comboScale += (this.comboTargetScale - this.comboScale) * 0.15;
        if (Math.abs(this.comboTargetScale - this.comboScale) < 0.01) {
            this.comboTargetScale = 1;
        }
        
        // 旋转衰减
        this.comboRotation *= 0.9;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.comboRotation * Math.PI) / 180);
        ctx.scale(this.comboScale, this.comboScale);
        
        // 根据连击数选择颜色
        let comboColor = POP_COLORS.WHITE;
        if (this.combo >= 100) comboColor = POP_COLORS.MAGENTA;
        else if (this.combo >= 50) comboColor = POP_COLORS.ORANGE_RED;
        else if (this.combo >= 30) comboColor = POP_COLORS.HOT_PINK;
        else if (this.combo >= 20) comboColor = POP_COLORS.LIME_GREEN;
        else if (this.combo >= 10) comboColor = POP_COLORS.CYAN_BLUE;
        else if (this.combo >= 5) comboColor = POP_COLORS.NEON_YELLOW;
        
        // 发光效果
        ctx.shadowColor = comboColor;
        ctx.shadowBlur = 30;
        
        // Combo文字大小
        const fontSize = Math.min(200, 100 + this.combo * 2);
        
        // 1. 粗黑阴影（波普风格）
        ctx.fillStyle = POP_COLORS.BLACK;
        ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.combo.toString(), 8, 8);
        
        // 2. 主文字
        ctx.fillStyle = comboColor;
        ctx.fillText(this.combo.toString(), 0, 0);
        
        // 3. 描边
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 6;
        ctx.strokeText(this.combo.toString(), 0, 0);
        
        // "COMBO"文字
        ctx.shadowBlur = 15;
        ctx.font = `bold ${fontSize * 0.3}px Arial`;
        ctx.fillStyle = POP_COLORS.WHITE;
        ctx.fillText('COMBO', 0, -fontSize * 0.8);
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 3;
        ctx.strokeText('COMBO', 0, -fontSize * 0.8);
        
        ctx.restore();
    }
    
    /**
     * 渲染粒子效果
     */
    renderParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            const isAlive = particle.update(deltaTime);
            if (isAlive) {
                particle.render(this.ctx);
            }
            return isAlive;
        });
    }
    
    /**
     * 创建粒子爆炸效果
     */
    createParticleExplosion(x, y, color, count = 30) {
        const colors = [
            color,
            POP_COLORS.WHITE,
            POP_COLORS.NEON_YELLOW,
            POP_COLORS.CYAN_BLUE,
            POP_COLORS.LIME_GREEN
        ];
        
        for (let i = 0; i < count; i++) {
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, particleColor, 'explosion'));
        }
    }
    
    renderHitEffects(deltaTime) {
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.life -= deltaTime;
            effect.radius += deltaTime * 0.8;
            effect.alpha = effect.life / effect.maxLife;
            
            if (effect.life > 0) {
                const ctx = this.ctx;
                ctx.save();
                ctx.globalAlpha = effect.alpha;
                
                // 扩散圆圈（波普风格粗边框）
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 10;
                ctx.stroke();
                
                // 内部填充
                ctx.globalAlpha = effect.alpha * 0.3;
                ctx.fillStyle = effect.color;
                ctx.fill();
                
                // 文字提示
                if (effect.text) {
                    ctx.globalAlpha = effect.alpha;
                    ctx.font = 'bold 72px Arial Black, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // 阴影
                    ctx.fillStyle = POP_COLORS.BLACK;
                    ctx.fillText(effect.text, effect.x + 5, effect.y - effect.radius + 5);
                    
                    // 主文字
                    ctx.fillStyle = effect.color;
                    ctx.fillText(effect.text, effect.x, effect.y - effect.radius);
                    
                    // 描边
                    ctx.strokeStyle = POP_COLORS.BLACK;
                    ctx.lineWidth = 4;
                    ctx.strokeText(effect.text, effect.x, effect.y - effect.radius);
                }
                
                ctx.restore();
                return true;
            }
            return false;
        });
    }
    
    /**
     * 更新按键反馈动画
     */
    updateKeyFeedback(deltaTime) {
        Object.keys(this.keyFeedback).forEach(key => {
            const feedback = this.keyFeedback[key];
            if (feedback.pressed) {
                feedback.scale = Math.max(1, feedback.scale - 0.05);
                if (feedback.scale <= 1) {
                    feedback.pressed = false;
                }
            }
        });
    }
    
    updateBackgroundColor() {
        const stages = DYNAMIC_RHYTHM_CONFIG.comboColorStages;
        let newColor = stages[0].color;
        let newInverted = false;
        
        for (let i = stages.length - 1; i >= 0; i--) {
            if (this.combo >= stages[i].minCombo) {
                newColor = stages[i].color;
                newInverted = stages[i].invert || false;
                break;
            }
        }
        
        if (newColor !== this.targetBgColor) {
            this.targetBgColor = newColor;
            this.isInverted = newInverted;
        }
    }
    
    handleInput(eventType, event) {
        if (eventType === 'keydown') {
            this.audioManager.init();
            
            const key = event.key;
            const currentTime = this.elapsedTime;
            
            const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
            
            if (validKeys.includes(key) && !this.keysPressed[key]) {
                this.keysPressed[key] = true;
                
                // 记录按键反馈
                if (key === 'ArrowUp') this.keyFeedback.up.pressed = true;
                if (key === 'ArrowDown') this.keyFeedback.down.pressed = true;
                if (key === 'ArrowLeft') this.keyFeedback.left.pressed = true;
                if (key === 'ArrowRight') this.keyFeedback.right.pressed = true;
                if (key === ' ') this.keyFeedback.space.pressed = true;
                
                this.attemptHit(key, currentTime);
            }
        } else if (eventType === 'keyup') {
            this.keysPressed[event.key] = false;
        }
    }
    
    attemptHit(key, currentTime) {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        let hitNote = null;
        let hitQuality = null;
        
        const sortedNotes = [...this.activeNotes]
            .filter(note => note.isActive && !note.isDisappearing)
            .sort((a, b) => Math.abs(a.targetTime - currentTime) - Math.abs(b.targetTime - currentTime));
        
        for (const note of sortedNotes) {
            if (key !== ' ' && note.keyCode !== key) continue;
            
            const quality = note.checkHit(currentTime);
            if (quality) {
                hitNote = note;
                hitQuality = quality;
                break;
            }
        }
        
        if (hitNote && hitQuality) {
            hitNote.hit(hitQuality);
            this.handleHit(hitQuality, hitNote.currentX || centerX, hitNote.currentY || centerY);
        }
    }
    
    handleHit(quality, x, y) {
        let points = 0;
        let color = '';
        let text = '';
        
        switch (quality) {
            case 'perfect':
                points = DYNAMIC_RHYTHM_CONFIG.perfectScore;
                color = POP_COLORS.WHITE;
                text = 'PERFECT!';
                
                this.combo++;
                points = Math.floor(points * (1 + this.combo * 0.01));
                
                // 增强版：全屏地震晃动
                this.triggerShake(50, 600);
                this.triggerFlash('rgba(255, 255, 255, 0.5)', 300);
                
                // 粒子爆炸效果
                this.createParticleExplosion(x, y, POP_COLORS.ELECTRIC_PINK, 50);
                
                this.audioManager.playSound('perfect', { pitch: 1.2, volume: 1 });
                
                break;
                
            case 'good':
                points = DYNAMIC_RHYTHM_CONFIG.goodScore;
                color = POP_COLORS.NEON_YELLOW;
                text = 'GOOD';
                
                this.combo++;
                points = Math.floor(points * (1 + this.combo * 0.005));
                
                this.triggerShake(20, 300);
                
                // 少量粒子
                this.createParticleExplosion(x, y, POP_COLORS.NEON_YELLOW, 20);
                
                this.audioManager.playSound('hit', { pitch: 1, volume: 0.8 });
                
                break;
        }
        
        this.score += points;
        this.updateScore(this.score);
        this.updateCombo(this.combo);
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        if (this.combo > 0 && this.combo % 10 === 0) {
            this.audioManager.playSound('combo', { pitch: 1 + this.combo * 0.01, volume: 0.7 });
        }
        
        this.hitEffects.push({
            x,
            y,
            radius: 30,
            color,
            text,
            life: 800,
            maxLife: 800,
            alpha: 1
        });
    }
    
    handleMiss() {
        this.combo = 0;
        this.updateCombo(this.combo);
        
        this.score += DYNAMIC_RHYTHM_CONFIG.missPenalty;
        this.score = Math.max(0, this.score);
        this.updateScore(this.score);
        
        this.audioManager.playSound('miss', { volume: 0.5 });
    }
}

window.DynamicRhythmGame = DynamicRhythmGame;