/**
 * 动态律动 - 音乐小游戏
 * 波普风格：高饱和对比色、粗黑边框、波点底纹、几何形状
 * 核心玩法：音符从四周飞向中心节拍器，按空格键或方向键击打
 * 新增功能：长按模式、双击模式、能量槽、游戏结束、评价系统、战绩卡片
 */

// ==========================================
// 波普风格配色配置
// ==========================================
const POP_COLORS = {
    ELECTRIC_PINK: '#FF1493',
    NEON_YELLOW: '#FFD700',
    CYAN_BLUE: '#00FFFF',
    LIME_GREEN: '#39FF14',
    HOT_PINK: '#FF69B4',
    ORANGE_RED: '#FF4500',
    PURPLE: '#9400D3',
    TURQUOISE: '#40E0D0',
    MAGENTA: '#FF00FF',
    YELLOW_GREEN: '#9ACD32',
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    DOT_COLOR: 'rgba(0, 0, 0, 0.15)',
    DOT_COLOR_LIGHT: 'rgba(255, 255, 255, 0.15)'
};

// 游戏配置
const DYNAMIC_RHYTHM_CONFIG = {
    noteSpeed: 300,
    hitRadius: 90,
    perfectRadius: 50,
    noteSize: 60,
    metronomeSize: 120,
    pulseSpeed: 0.4,
    perfectScore: 100,
    goodScore: 50,
    missPenalty: -10,
    
    // 能量槽配置
    maxEnergy: 100,
    perfectEnergyGain: 8,
    goodEnergyGain: 5,
    missEnergyLoss: 20,
    initialEnergy: 80,
    
    // 长按模式配置
    holdNoteDuration: 1.0,
    
    sounds: {
        hit: 'hit',
        perfect: 'perfect',
        miss: 'miss',
        combo: 'combo'
    },
    
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
        miss: POP_COLORS.ORANGE_RED,
        hold: POP_COLORS.LIME_GREEN,
        double: POP_COLORS.CYAN_BLUE
    },
    
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

// 音符类型枚举
const NOTE_TYPES = {
    NORMAL: 'normal',
    HOLD: 'hold',
    DOUBLE: 'double'
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
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 300;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.size = 5 + Math.random() * 15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        
        this.life = 0.5 + Math.random() * 0.5;
        this.maxLife = this.life;
        this.alpha = 1;
        
        this.gravity = 200;
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.vy += this.gravity * dt;
        this.rotation += this.rotationSpeed * dt;
        
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        
        this.size *= 0.98;
        
        return this.life > 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 2;
        
        const shapeType = Math.floor(Math.random() * 3);
        
        if (shapeType === 0) {
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        } else if (shapeType === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
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
// 音符类 - 支持普通、长按、双击
// ==========================================
class Note {
    constructor(direction, color, spawnTime, targetTime, type = NOTE_TYPES.NORMAL, options = {}) {
        this.direction = direction;
        this.color = color;
        this.spawnTime = spawnTime;
        this.targetTime = targetTime;
        this.type = type;
        this.id = Math.random().toString(36).substr(2, 9);
        
        // 状态
        this.isActive = true;
        this.isHit = false;
        this.isDisappearing = false;
        this.disappearProgress = 0;
        this.disappearType = null;
        
        // 长按模式
        this.isHold = type === NOTE_TYPES.HOLD;
        this.holdDuration = options.holdDuration || DYNAMIC_RHYTHM_CONFIG.holdNoteDuration;
        this.holdEndTime = targetTime + this.holdDuration;
        this.isHolding = false;
        this.holdProgress = 0;
        
        // 双击模式
        this.isDouble = type === NOTE_TYPES.DOUBLE;
        this.partnerDirection = options.partnerDirection || null;
        this.partnerNote = null;
        this.isDoubleHit = false;
        
        // 位置计算
        this.currentX = 0;
        this.currentY = 0;
        this.angle = 0;
        
        // 动画参数
        this.bounceOffset = 0;
        this.bouncePhase = Math.random() * Math.PI * 2;
        
        this.calculatePositions();
    }
    
    calculatePositions() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // 音符图标默认是符干向上（符头在下方）
        // 我们需要让音符朝向中心（朝向它们飞来的方向的反方向）
        // 从上方飞来的音符应该指向下（符干向下）
        // 从下方飞来的音符应该指向上（符干向上）
        // 从左边飞来的音符应该指向右（符干向右）
        // 从右边飞来的音符应该指向左（符干向左）
        
        switch (this.direction) {
            case 'up':
                this.startX = centerX;
                this.startY = -DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.angle = 180;
                this.moveDirX = 0;
                this.moveDirY = 1;
                this.keyCode = 'ArrowUp';
                break;
            case 'down':
                this.startX = centerX;
                this.startY = window.innerHeight + DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.angle = 0;
                this.moveDirX = 0;
                this.moveDirY = -1;
                this.keyCode = 'ArrowDown';
                break;
            case 'left':
                this.startX = -DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.startY = centerY;
                this.angle = -90;
                this.moveDirX = 1;
                this.moveDirY = 0;
                this.keyCode = 'ArrowLeft';
                break;
            case 'right':
                this.startX = window.innerWidth + DYNAMIC_RHYTHM_CONFIG.noteSize * 2;
                this.startY = centerY;
                this.angle = 90;
                this.moveDirX = -1;
                this.moveDirY = 0;
                this.keyCode = 'ArrowRight';
                break;
        }
        
        this.targetX = centerX;
        this.targetY = centerY;
    }
    
    update(currentTime) {
        if (!this.isActive) return;
        
        if (this.isDisappearing) {
            this.disappearProgress += 0.05;
            if (this.disappearProgress >= 1) {
                this.isActive = false;
            }
            return;
        }
        
        // 长按模式：如果已经开始长按，更新进度
        if (this.isHold && this.isHolding) {
            this.holdProgress = Math.min(1, (currentTime - this.targetTime) / this.holdDuration);
            if (this.holdProgress >= 1) {
                this.hit('perfect');
            }
            return;
        }
        
        const progress = (currentTime - this.spawnTime) / (this.targetTime - this.spawnTime);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        
        const easedProgress = this.easeInOutQuad(clampedProgress);
        
        this.currentX = this.startX + (this.targetX - this.startX) * easedProgress;
        this.currentY = this.startY + (this.targetY - this.startY) * easedProgress;
        
        this.bouncePhase += 0.1;
        this.bounceOffset = Math.sin(this.bouncePhase) * 5;
        
        if (currentTime > this.targetTime + 0.3 && !this.isHold) {
            this.miss();
        }
        
        if (this.isHold && currentTime > this.holdEndTime && !this.isHolding) {
            this.miss();
        }
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    checkHit(currentTime) {
        if (!this.isActive || this.isHit || this.isDisappearing) return null;
        
        // 双击模式：需要两个音符都被击中
        if (this.isDouble && this.partnerNote && !this.partnerNote.isHit) {
            return null;
        }
        
        const timeDiff = Math.abs(currentTime - this.targetTime);
        
        if (this.isHold) {
            if (timeDiff < 0.2) {
                return 'hold-start';
            }
            return null;
        }
        
        if (timeDiff < 0.1) {
            return 'perfect';
        } else if (timeDiff < 0.25) {
            return 'good';
        }
        
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
    
    startHold() {
        if (this.isHold) {
            this.isHolding = true;
        }
    }
    
    endHold() {
        if (this.isHold && this.isHolding) {
            this.isHolding = false;
            if (this.holdProgress >= 0.9) {
                this.hit('perfect');
            } else if (this.holdProgress >= 0.5) {
                this.hit('good');
            } else {
                this.miss();
            }
        }
    }
    
    hit(type = 'perfect') {
        this.isHit = true;
        this.isDisappearing = true;
        this.disappearProgress = 0;
        this.disappearType = type === 'perfect' ? 'explode' : 'shrink';
    }
    
    miss() {
        this.isDisappearing = true;
        this.disappearProgress = 0;
        this.disappearType = 'spin';
    }
    
    render(ctx, canvasWidth, canvasHeight) {
        if (!this.isActive) return;
        
        ctx.save();
        
        if (this.isDisappearing) {
            const scale = 1 - this.disappearProgress;
            const alpha = 1 - this.disappearProgress;
            
            if (this.disappearType === 'explode') {
                ctx.translate(this.currentX, this.currentY);
                ctx.scale(1 + this.disappearProgress * 2, 1 + this.disappearProgress * 2);
                ctx.rotate(this.disappearProgress * Math.PI);
                ctx.globalAlpha = alpha;
                this.drawNoteShape(ctx, 1);
            } else if (this.disappearType === 'shrink') {
                ctx.translate(this.currentX, this.currentY);
                ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;
                this.drawNoteShape(ctx, 1);
            } else if (this.disappearType === 'spin') {
                ctx.translate(this.currentX, this.currentY);
                ctx.scale(scale, scale);
                ctx.rotate(this.disappearProgress * Math.PI * 4);
                ctx.globalAlpha = alpha;
                this.drawNoteShape(ctx, 1);
            }
        } else {
            ctx.translate(this.currentX, this.currentY + this.bounceOffset);
            ctx.rotate((this.angle * Math.PI) / 180);
            
            // 长按音符：绘制尾巴
            if (this.isHold) {
                this.drawHoldTail(ctx);
            }
            
            this.drawNoteShape(ctx, 1);
            
            // 双击音符：绘制标记
            if (this.isDouble) {
                this.drawDoubleMarker(ctx);
            }
        }
        
        ctx.restore();
    }
    
    drawHoldTail(ctx) {
        const size = DYNAMIC_RHYTHM_CONFIG.noteSize;
        const tailLength = size * 3 * (this.isHolding ? (1 - this.holdProgress) : 1);
        
        ctx.save();
        
        // 尾巴主体
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        
        // 尾巴是一条粗线，符干方向
        ctx.beginPath();
        ctx.rect(-size * 0.3, -tailLength, size * 0.6, tailLength);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 长按进度指示
        if (this.isHolding) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = POP_COLORS.LIME_GREEN;
            const progressHeight = tailLength * this.holdProgress;
            ctx.fillRect(-size * 0.3, -progressHeight, size * 0.6, progressHeight);
        }
        
        ctx.restore();
    }
    
    drawDoubleMarker(ctx) {
        const size = DYNAMIC_RHYTHM_CONFIG.noteSize;
        
        ctx.save();
        ctx.fillStyle = POP_COLORS.CYAN_BLUE;
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 3;
        
        // 双音符标记：两个小圆点
        ctx.beginPath();
        ctx.arc(-size * 0.3, size * 0.4, size * 0.1, 0, Math.PI * 2);
        ctx.arc(size * 0.3, size * 0.4, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawNoteShape(ctx, scale = 1) {
        const size = DYNAMIC_RHYTHM_CONFIG.noteSize * scale;
        
        ctx.fillStyle = POP_COLORS.BLACK;
        this.drawMusicalNote(ctx, size + 8, 4, 4);
        
        ctx.fillStyle = this.color;
        this.drawMusicalNote(ctx, size, 0, 0);
        
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 4;
        this.drawMusicalNote(ctx, size, 0, 0, true);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-size/4, -size/4, size/6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMusicalNote(ctx, size, offsetX, offsetY, isStroke = false) {
        ctx.beginPath();
        
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
// 谱面生成器 - 支持长按和双击
// ==========================================
class ChartGenerator {
    constructor(bpm = 120, timeSignature = { upper: 4, lower: 4 }) {
        this.bpm = bpm;
        this.timeSignature = timeSignature;
        this.beatDuration = 60 / bpm;
        this.measureDuration = this.beatDuration * timeSignature.upper;
    }
    
    generate(duration = 120, density = 0.65) {
        const notes = [];
        const directions = ['up', 'down', 'left', 'right'];
        const colors = DYNAMIC_RHYTHM_CONFIG.colors.notes;
        
        const totalBeats = Math.ceil(duration / this.beatDuration);
        
        for (let beat = 0; beat < totalBeats; beat++) {
            const targetTime = beat * this.beatDuration;
            
            if (Math.random() > density) continue;
            
            const isDownbeat = (beat % this.timeSignature.upper) === 0;
            
            // 随机决定音符类型
            const noteTypeRoll = Math.random();
            let noteType = NOTE_TYPES.NORMAL;
            
            // 游戏后期（超过30秒后）开始出现长按和双击
            if (targetTime > 30) {
                if (noteTypeRoll < 0.15) {
                    noteType = NOTE_TYPES.HOLD;
                } else if (noteTypeRoll < 0.3 && isDownbeat) {
                    noteType = NOTE_TYPES.DOUBLE;
                }
            }
            
            if (noteType === NOTE_TYPES.DOUBLE) {
                // 双击模式：生成两个不同方向的音符
                const dir1 = directions[Math.floor(Math.random() * directions.length)];
                let dir2;
                do {
                    dir2 = directions[Math.floor(Math.random() * directions.length)];
                } while (dir2 === dir1);
                
                const travelTime = 1.5;
                const spawnTime = targetTime - travelTime;
                
                if (spawnTime >= 0) {
                    const note1 = {
                        direction: dir1,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        spawnTime,
                        targetTime,
                        type: NOTE_TYPES.DOUBLE,
                        partnerDirection: dir2
                    };
                    
                    const note2 = {
                        direction: dir2,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        spawnTime,
                        targetTime,
                        type: NOTE_TYPES.DOUBLE,
                        partnerDirection: dir1
                    };
                    
                    notes.push(note1, note2);
                }
            } else if (noteType === NOTE_TYPES.HOLD) {
                // 长按模式
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const travelTime = 1.5;
                const spawnTime = targetTime - travelTime;
                
                if (spawnTime >= 0) {
                    notes.push({
                        direction,
                        color: DYNAMIC_RHYTHM_CONFIG.colors.hold,
                        spawnTime,
                        targetTime,
                        type: NOTE_TYPES.HOLD,
                        holdDuration: 0.8 + Math.random() * 0.8
                    });
                }
            } else {
                // 普通音符
                if (isDownbeat && Math.random() < 0.4) {
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
                                targetTime,
                                type: NOTE_TYPES.NORMAL
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
                            targetTime,
                            type: NOTE_TYPES.NORMAL
                        });
                    }
                }
            }
        }
        
        notes.sort((a, b) => a.targetTime - b.targetTime);
        return notes;
    }
}

// ==========================================
// 动态律动游戏主类 - 完整版本
// ==========================================
class DynamicRhythmGame extends GameInterface {
    static get metadata() {
        return {
            id: 'dynamic-rhythm',
            name: '动态律动',
            description: '波普风格音乐节奏游戏，支持普通、长按、双击模式！',
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
        
        // 统计数据
        this.totalNotes = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        
        // 能量槽
        this.energy = DYNAMIC_RHYTHM_CONFIG.initialEnergy;
        this.isGameOver = false;
        
        // 游戏结束界面
        this.gameOverScreen = null;
        
        // 视觉效果
        this.hitEffects = [];
        this.particles = [];
        this.currentBgColor = DYNAMIC_RHYTHM_CONFIG.comboColorStages[0].color;
        this.targetBgColor = this.currentBgColor;
        this.isInverted = false;
        
        // Combo显示 - 只在连击增加时显示
        this.comboScale = 1;
        this.comboTargetScale = 1;
        this.comboRotation = 0;
        this.comboColor = POP_COLORS.WHITE;
        this.lastCombo = 0;
        this.comboDisplayTimer = 0;
        this.showCombo = false;
        
        // 长按中的音符
        this.holdingNote = null;
        
        // 按键反馈
        this.keyFeedback = {
            up: { pressed: false, scale: 1 },
            down: { pressed: false, scale: 1 },
            left: { pressed: false, scale: 1 },
            right: { pressed: false, scale: 1 },
            space: { pressed: false, scale: 1 }
        };
        
        this.dotPattern = null;
        
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
        
        console.log('动态律动游戏已初始化（完整版）');
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
        
        this.createDotPattern();
    }
    
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
        
        if (this.ctx) {
            this.createDotPattern();
        }
    }
    
    generateChart() {
        const generator = new ChartGenerator(this.bpm);
        this.chartData = generator.generate(120, 0.65);
        this.totalNotes = this.chartData.length;
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
                <h1 style="font-size: 4rem; font-weight: 900; margin-bottom: 15px; color: ${POP_COLORS.ELECTRIC_PINK}; text-shadow: 6px 6px 0px ${POP_COLORS.BLACK};">
                    🎵 动态律动
                </h1>
                <p style="font-size: 1.5rem; margin-bottom: 30px; color: ${POP_COLORS.WHITE}; font-weight: 700;">
                    波普风格音乐节奏游戏
                </p>
                <div style="display: flex; gap: 20px; margin-bottom: 30px; justify-content: center; flex-wrap: wrap;">
                    <div style="text-align: center; padding: 20px; background: ${POP_COLORS.NEON_YELLOW}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;">♪</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1rem;">普通音符</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: ${POP_COLORS.LIME_GREEN}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;">♪══</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1rem;">长按音符</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: ${POP_COLORS.CYAN_BLUE}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;">♪ ♪</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1rem;">双击音符</div>
                    </div>
                </div>
                <div style="display: flex; gap: 20px; margin-bottom: 30px; justify-content: center; flex-wrap: wrap;">
                    <div style="text-align: center; padding: 20px; background: ${POP_COLORS.WHITE}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2rem; margin-bottom: 10px;">↑↓←→</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1rem;">方向键</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: ${POP_COLORS.WHITE}; border: 6px solid ${POP_COLORS.BLACK}; box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
                        <div style="font-size: 2rem; margin-bottom: 10px;">SPACE</div>
                        <div style="color: ${POP_COLORS.BLACK}; font-weight: 800; font-size: 1rem;">空格键</div>
                    </div>
                </div>
                <button id="start-btn" style="
                    padding: 20px 60px;
                    font-size: 1.8rem;
                    font-weight: 900;
                    background: ${POP_COLORS.NEON_YELLOW};
                    color: ${POP_COLORS.BLACK};
                    border: 8px solid ${POP_COLORS.BLACK};
                    cursor: pointer;
                    box-shadow: 10px 10px 0px rgba(0,0,0,0.5);
                    transition: all 0.1s ease;
                    text-transform: uppercase;
                ">
                    ▶ 开始游戏
                </button>
                <p style="margin-top: 20px; color: ${POP_COLORS.WHITE}; font-size: 1rem;">
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
        this.showCombo = false;
        this.comboDisplayTimer = 0;
        this.holdingNote = null;
        this.isGameOver = false;
        this.gameOverScreen = null;
        
        // 重置统计
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        
        // 重置能量槽
        this.energy = DYNAMIC_RHYTHM_CONFIG.initialEnergy;
        
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
    
    // 游戏结束
    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        
        // 停止长按
        if (this.holdingNote) {
            this.holdingNote.endHold();
            this.holdingNote = null;
        }
        
        this.createGameOverScreen();
    }
    
    // 创建游戏结束界面
    createGameOverScreen() {
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.className = 'game-over-screen';
        this.gameOverScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.8);
            z-index: 200;
        `;
        
        // 计算评价
        const rating = this.calculateRating();
        
        // 战绩卡片
        this.gameOverScreen.innerHTML = `
            <div style="
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, ${POP_COLORS.ELECTRIC_PINK} 0%, ${POP_COLORS.CYAN_BLUE} 100%);
                border: 12px solid ${POP_COLORS.BLACK};
                box-shadow: 16px 16px 0px rgba(0,0,0,0.6);
                min-width: 400px;
            ">
                <h2 style="
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 30px;
                    color: ${POP_COLORS.WHITE};
                    text-shadow: 6px 6px 0px ${POP_COLORS.BLACK};
                ">
                    GAME OVER
                </h2>
                
                <div style="
                    font-size: 8rem;
                    font-weight: 900;
                    margin-bottom: 30px;
                    color: ${rating.color};
                    text-shadow: 8px 8px 0px ${POP_COLORS.BLACK};
                ">
                    ${rating.grade}
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="
                        padding: 15px;
                        background: ${POP_COLORS.NEON_YELLOW};
                        border: 4px solid ${POP_COLORS.BLACK};
                        box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                    ">
                        <div style="font-size: 1rem; color: ${POP_COLORS.BLACK}; font-weight: 700;">得分</div>
                        <div style="font-size: 2rem; color: ${POP_COLORS.BLACK}; font-weight: 900;">${this.score}</div>
                    </div>
                    <div style="
                        padding: 15px;
                        background: ${POP_COLORS.LIME_GREEN};
                        border: 4px solid ${POP_COLORS.BLACK};
                        box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                    ">
                        <div style="font-size: 1rem; color: ${POP_COLORS.BLACK}; font-weight: 700;">最高连击</div>
                        <div style="font-size: 2rem; color: ${POP_COLORS.BLACK}; font-weight: 900;">${this.maxCombo}</div>
                    </div>
                    <div style="
                        padding: 15px;
                        background: ${POP_COLORS.CYAN_BLUE};
                        border: 4px solid ${POP_COLORS.BLACK};
                        box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                    ">
                        <div style="font-size: 1rem; color: ${POP_COLORS.BLACK}; font-weight: 700;">PERFECT</div>
                        <div style="font-size: 2rem; color: ${POP_COLORS.BLACK}; font-weight: 900;">${this.perfectCount}</div>
                    </div>
                    <div style="
                        padding: 15px;
                        background: ${POP_COLORS.HOT_PINK};
                        border: 4px solid ${POP_COLORS.BLACK};
                        box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                    ">
                        <div style="font-size: 1rem; color: ${POP_COLORS.BLACK}; font-weight: 700;">GOOD</div>
                        <div style="font-size: 2rem; color: ${POP_COLORS.BLACK}; font-weight: 900;">${this.goodCount}</div>
                    </div>
                </div>
                
                <div style="
                    margin-bottom: 30px;
                    padding: 15px;
                    background: ${POP_COLORS.ORANGE_RED};
                    border: 4px solid ${POP_COLORS.BLACK};
                    box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                ">
                    <div style="font-size: 1rem; color: ${POP_COLORS.WHITE}; font-weight: 700;">MISS</div>
                    <div style="font-size: 2rem; color: ${POP_COLORS.WHITE}; font-weight: 900;">${this.missCount}</div>
                </div>
                
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button id="retry-btn" style="
                        padding: 15px 40px;
                        font-size: 1.5rem;
                        font-weight: 900;
                        background: ${POP_COLORS.NEON_YELLOW};
                        color: ${POP_COLORS.BLACK};
                        border: 6px solid ${POP_COLORS.BLACK};
                        cursor: pointer;
                        box-shadow: 6px 6px 0px rgba(0,0,0,0.5);
                        transition: all 0.1s ease;
                    ">
                        🔄 再来一局
                    </button>
                    <button id="exit-btn" style="
                        padding: 15px 40px;
                        font-size: 1.5rem;
                        font-weight: 900;
                        background: ${POP_COLORS.WHITE};
                        color: ${POP_COLORS.BLACK};
                        border: 6px solid ${POP_COLORS.BLACK};
                        cursor: pointer;
                        box-shadow: 6px 6px 0px rgba(0,0,0,0.5);
                        transition: all 0.1s ease;
                    ">
                        🚪 返回主页
                    </button>
                </div>
            </div>
        `;
        
        this.canvas.appendChild(this.gameOverScreen);
        
        const retryBtn = document.getElementById('retry-btn');
        const exitBtn = document.getElementById('exit-btn');
        
        retryBtn.addEventListener('click', () => {
            this.gameOverScreen.remove();
            this.gameOverScreen = null;
            this.startActualGame();
        });
        
        exitBtn.addEventListener('click', () => {
            this.context.gameManager.exitGame();
        });
        
        [retryBtn, exitBtn].forEach(btn => {
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'translate(-2px, -2px)';
                btn.style.boxShadow = '8px 8px 0px rgba(0,0,0,0.5)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'translate(0, 0)';
                btn.style.boxShadow = '6px 6px 0px rgba(0,0,0,0.5)';
            });
        });
    }
    
    // 计算评价
    calculateRating() {
        const totalHits = this.perfectCount + this.goodCount + this.missCount;
        const accuracy = totalHits > 0 ? (this.perfectCount * 100 + this.goodCount * 50) / (totalHits * 100) : 0;
        
        if (accuracy >= 0.95 && this.maxCombo >= 50) {
            return { grade: 'S', color: POP_COLORS.NEON_YELLOW };
        } else if (accuracy >= 0.85) {
            return { grade: 'A', color: POP_COLORS.LIME_GREEN };
        } else if (accuracy >= 0.70) {
            return { grade: 'B', color: POP_COLORS.CYAN_BLUE };
        } else {
            return { grade: 'C', color: POP_COLORS.ORANGE_RED };
        }
    }
    
    render(deltaTime) {
        if (!this.isRunning || !this.ctx || this.gameStartTime === undefined) return;
        
        const currentTime = (performance.now() - this.gameStartTime) / 1000;
        this.elapsedTime = currentTime;
        
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        
        this.ctx.clearRect(0, 0, width, height);
        
        this.renderBackground(width, height);
        
        this.spawnNotes(currentTime);
        
        this.updateMetronome(currentTime, deltaTime);
        
        this.updateAndRenderNotes(currentTime, width, height);
        
        this.renderMetronome(width, height);
        
        this.renderDirectionIndicators(width, height, deltaTime);
        
        this.renderEnergyBar(width, height);
        
        this.renderComboDisplay(width, height, deltaTime);
        
        this.renderParticles(deltaTime);
        
        this.renderHitEffects(deltaTime);
        
        this.updateKeyFeedback(deltaTime);
    }
    
    renderBackground(width, height) {
        if (this.currentBgColor !== this.targetBgColor) {
            this.currentBgColor = this.lerpColor(this.currentBgColor, this.targetBgColor, 0.05);
        }
        
        this.ctx.fillStyle = this.currentBgColor;
        this.ctx.fillRect(0, 0, width, height);
        
        if (this.dotPattern) {
            this.ctx.save();
            this.ctx.globalAlpha = this.isInverted ? 0.2 : 0.15;
            this.ctx.fillStyle = this.isInverted ? POP_COLORS.DOT_COLOR_LIGHT : POP_COLORS.DOT_COLOR;
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.restore();
        }
        
        if (this.isInverted) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'difference';
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.restore();
        }
    }
    
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
                    noteData.targetTime,
                    noteData.type || NOTE_TYPES.NORMAL,
                    {
                        holdDuration: noteData.holdDuration,
                        partnerDirection: noteData.partnerDirection
                    }
                );
                this.activeNotes.push(note);
                this.noteSpawnIndex++;
            } else {
                break;
            }
        }
    }
    
    updateMetronome(currentTime, deltaTime) {
        this.metronomePulse += deltaTime * 0.003 * this.pulseDirection;
        if (this.metronomePulse > 1) {
            this.metronomePulse = 1;
            this.pulseDirection = -1;
        } else if (this.metronomePulse < 0) {
            this.metronomePulse = 0;
            this.pulseDirection = 1;
        }
        
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
    
    renderMetronome(width, height) {
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        const baseSize = DYNAMIC_RHYTHM_CONFIG.metronomeSize;
        const pulseSize = baseSize + (this.metronomePulse * 40);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, DYNAMIC_RHYTHM_CONFIG.perfectRadius, 0, Math.PI * 2);
        ctx.strokeStyle = POP_COLORS.WHITE;
        ctx.lineWidth = 6;
        ctx.setLineDash([15, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, DYNAMIC_RHYTHM_CONFIG.hitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        ctx.fillStyle = POP_COLORS.BLACK;
        this.drawPopMetronome(ctx, pulseSize + 12, 8, 8);
        
        ctx.fillStyle = DYNAMIC_RHYTHM_CONFIG.colors.metronome;
        this.drawPopMetronome(ctx, pulseSize, 0, 0);
        
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 8;
        this.drawPopMetronome(ctx, pulseSize, 0, 0, true);
        
        ctx.fillStyle = POP_COLORS.WHITE;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = POP_COLORS.BLACK;
        ctx.font = `bold ${pulseSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', 0, 0);
        
        ctx.restore();
    }
    
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
    
    renderDirectionIndicators(width, height, deltaTime) {
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        const indicatorRadius = DYNAMIC_RHYTHM_CONFIG.hitRadius + 80;
        const size = 50;
        
        const directions = [
            { dir: 'up', key: 'ArrowUp', x: centerX, y: centerY - indicatorRadius, angle: 180 },
            { dir: 'down', key: 'ArrowDown', x: centerX, y: centerY + indicatorRadius, angle: 0 },
            { dir: 'left', key: 'ArrowLeft', x: centerX - indicatorRadius, y: centerY, angle: -90 },
            { dir: 'right', key: 'ArrowRight', x: centerX + indicatorRadius, y: centerY, angle: 90 }
        ];
        
        directions.forEach(({ dir, key, x, y, angle }) => {
            const hasNote = this.activeNotes.some(note => 
                note.direction === dir && 
                note.isActive &&
                Math.abs(this.elapsedTime - note.targetTime) < 0.5
            );
            
            const isPressed = this.keysPressed[key] || this.keysPressed[' '];
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((angle * Math.PI) / 180);
            
            const scale = isPressed ? 1.3 : 1;
            ctx.scale(scale, scale);
            
            if (isPressed || hasNote) {
                ctx.shadowColor = hasNote ? POP_COLORS.NEON_YELLOW : POP_COLORS.LIME_GREEN;
                ctx.shadowBlur = isPressed ? 30 : 15;
            }
            
            const noteSize = size;
            
            ctx.fillStyle = POP_COLORS.BLACK;
            this.drawIndicatorNote(ctx, noteSize + 6, 3, 3);
            
            ctx.fillStyle = hasNote ? POP_COLORS.NEON_YELLOW : (isPressed ? POP_COLORS.LIME_GREEN : 'rgba(255, 255, 255, 0.6)');
            this.drawIndicatorNote(ctx, noteSize, 0, 0);
            
            ctx.strokeStyle = POP_COLORS.BLACK;
            ctx.lineWidth = 4;
            this.drawIndicatorNote(ctx, noteSize, 0, 0, true);
            
            ctx.restore();
        });
    }
    
    drawIndicatorNote(ctx, size, offsetX, offsetY, isStroke = false) {
        ctx.beginPath();
        
        const headWidth = size * 0.8;
        const headHeight = size * 0.5;
        
        ctx.ellipse(offsetX, offsetY, headWidth/2, headHeight/2, -Math.PI/6, 0, Math.PI * 2);
        
        if (isStroke) {
            ctx.stroke();
        } else {
            ctx.fill();
        }
        
        if (!isStroke) {
            ctx.beginPath();
            ctx.moveTo(offsetX + headWidth/3, offsetY - headHeight/2);
            ctx.lineTo(offsetX + headWidth/3, offsetY - size * 1.0);
            ctx.lineWidth = size * 0.12;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
        }
    }
    
    // 渲染能量槽
    renderEnergyBar(width, height) {
        const ctx = this.ctx;
        const barWidth = Math.min(400, width * 0.4);
        const barHeight = 30;
        const x = (width - barWidth) / 2;
        const y = 20;
        
        ctx.save();
        
        // 背景槽
        ctx.fillStyle = POP_COLORS.BLACK;
        ctx.fillRect(x - 4, y - 4, barWidth + 8, barHeight + 8);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 能量条
        const energyPercent = this.energy / DYNAMIC_RHYTHM_CONFIG.maxEnergy;
        const fillWidth = barWidth * energyPercent;
        
        // 颜色变化：绿色(高) -> 黄色(中) -> 红色(低)
        let barColor;
        if (energyPercent > 0.6) {
            barColor = POP_COLORS.LIME_GREEN;
        } else if (energyPercent > 0.3) {
            barColor = POP_COLORS.NEON_YELLOW;
        } else {
            barColor = POP_COLORS.ORANGE_RED;
        }
        
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, fillWidth, barHeight);
        
        // 边框
        ctx.strokeStyle = POP_COLORS.WHITE;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // 文字
        ctx.fillStyle = POP_COLORS.WHITE;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`ENERGY: ${Math.floor(this.energy)}%`, x + barWidth/2, y + barHeight + 8);
        
        ctx.restore();
    }
    
    renderComboDisplay(width, height, deltaTime) {
        if (this.combo <= 0) {
            this.showCombo = false;
            return;
        }
        
        // 连击增加时显示
        if (this.combo > this.lastCombo) {
            this.showCombo = true;
            this.comboDisplayTimer = 60;
            this.comboTargetScale = 1.5;
            this.comboRotation = (Math.random() - 0.5) * 20;
        }
        this.lastCombo = this.combo;
        
        // 计时器递减
        if (this.showCombo) {
            this.comboDisplayTimer--;
            if (this.comboDisplayTimer <= 0) {
                this.showCombo = false;
            }
        }
        
        if (!this.showCombo) return;
        
        const ctx = this.ctx;
        const centerX = width / 2;
        const centerY = height / 2;
        
        this.comboScale += (this.comboTargetScale - this.comboScale) * 0.15;
        if (Math.abs(this.comboTargetScale - this.comboScale) < 0.01) {
            this.comboTargetScale = 1;
        }
        
        this.comboRotation *= 0.9;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.comboRotation * Math.PI) / 180);
        ctx.scale(this.comboScale, this.comboScale);
        
        // 渐隐效果
        const alpha = Math.min(1, this.comboDisplayTimer / 30);
        ctx.globalAlpha = alpha;
        
        let comboColor = POP_COLORS.WHITE;
        if (this.combo >= 100) comboColor = POP_COLORS.MAGENTA;
        else if (this.combo >= 50) comboColor = POP_COLORS.ORANGE_RED;
        else if (this.combo >= 30) comboColor = POP_COLORS.HOT_PINK;
        else if (this.combo >= 20) comboColor = POP_COLORS.LIME_GREEN;
        else if (this.combo >= 10) comboColor = POP_COLORS.CYAN_BLUE;
        else if (this.combo >= 5) comboColor = POP_COLORS.NEON_YELLOW;
        
        ctx.shadowColor = comboColor;
        ctx.shadowBlur = 30;
        
        const fontSize = Math.min(200, 100 + this.combo * 2);
        
        ctx.fillStyle = POP_COLORS.BLACK;
        ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.combo.toString(), 8, 8);
        
        ctx.fillStyle = comboColor;
        ctx.fillText(this.combo.toString(), 0, 0);
        
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 6;
        ctx.strokeText(this.combo.toString(), 0, 0);
        
        ctx.shadowBlur = 15;
        ctx.font = `bold ${fontSize * 0.3}px Arial`;
        ctx.fillStyle = POP_COLORS.WHITE;
        ctx.fillText('COMBO', 0, -fontSize * 0.8);
        ctx.strokeStyle = POP_COLORS.BLACK;
        ctx.lineWidth = 3;
        ctx.strokeText('COMBO', 0, -fontSize * 0.8);
        
        ctx.restore();
    }
    
    renderParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            const isAlive = particle.update(deltaTime);
            if (isAlive) {
                particle.render(this.ctx);
            }
            return isAlive;
        });
    }
    
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
                
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 10;
                ctx.stroke();
                
                ctx.globalAlpha = effect.alpha * 0.3;
                ctx.fillStyle = effect.color;
                ctx.fill();
                
                ctx.restore();
                return true;
            }
            return false;
        });
    }
    
    addHitEffect(x, y, color, type = 'normal') {
        this.hitEffects.push({
            x,
            y,
            color,
            type,
            radius: 20,
            maxRadius: type === 'perfect' ? 150 : 100,
            life: 500,
            maxLife: 500,
            alpha: 1
        });
    }
    
    updateKeyFeedback(deltaTime) {
        const directions = ['up', 'down', 'left', 'right', 'space'];
        directions.forEach(dir => {
            if (this.keyFeedback[dir].pressed) {
                this.keyFeedback[dir].scale = Math.min(1.5, this.keyFeedback[dir].scale + deltaTime * 0.01);
            } else {
                this.keyFeedback[dir].scale = Math.max(1, this.keyFeedback[dir].scale - deltaTime * 0.005);
            }
        });
    }
    
    handleInput(eventType, event) {
        if (this.isGameOver) return;
        
        const key = event.key;
        const isKeyDown = eventType === 'keydown';
        const isKeyUp = eventType === 'keyup';
        
        if (isKeyDown && this.keysPressed[key]) return;
        
        this.keysPressed[key] = isKeyDown;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
            if (isKeyDown) {
                this.processKeyPress(key);
            } else {
                this.processKeyRelease(key);
            }
        }
    }
    
    processKeyPress(key) {
        if (this.holdingNote) {
            return;
        }
        
        const direction = this.keyToDirection(key);
        if (!direction) return;
        
        const currentTime = (performance.now() - this.gameStartTime) / 1000;
        
        const directionNotes = this.activeNotes.filter(note => 
            note.isActive && 
            !note.isHit && 
            !note.isDisappearing &&
            note.direction === direction
        );
        
        if (directionNotes.length === 0) return;
        
        directionNotes.sort((a, b) => 
            Math.abs(a.targetTime - currentTime) - Math.abs(b.targetTime - currentTime)
        );
        
        const targetNote = directionNotes[0];
        
        if (targetNote.isDouble) {
            const partnerNote = this.activeNotes.find(note => 
                note.id !== targetNote.id &&
                note.isDouble &&
                note.targetTime === targetNote.targetTime
            );
            
            if (partnerNote && !partnerNote.isHit) {
                targetNote.isHit = true;
                return;
            }
            
            if (partnerNote && partnerNote.isHit) {
                this.handleDoubleHit(targetNote, partnerNote, currentTime);
                return;
            }
        }
        
        if (targetNote.isHold) {
            const checkResult = targetNote.checkHit(currentTime);
            if (checkResult === 'hold-start') {
                targetNote.startHold();
                this.holdingNote = targetNote;
                this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.6 });
            }
            return;
        }
        
        const checkResult = targetNote.checkHit(currentTime);
        if (checkResult) {
            this.handleHit(targetNote, checkResult);
        }
    }
    
    processKeyRelease(key) {
        if (this.holdingNote) {
            const direction = this.keyToDirection(key);
            if (direction === this.holdingNote.direction || key === ' ') {
                this.holdingNote.endHold();
                if (this.holdingNote.isHit) {
                    const holdProgress = this.holdingNote.holdProgress;
                    if (holdProgress >= 0.9) {
                        this.handleHit(this.holdingNote, 'perfect');
                    } else if (holdProgress >= 0.5) {
                        this.handleHit(this.holdingNote, 'good');
                    } else {
                        this.handleMiss(this.holdingNote);
                    }
                }
                this.holdingNote = null;
            }
        }
    }
    
    keyToDirection(key) {
        switch (key) {
            case 'ArrowUp': return 'up';
            case 'ArrowDown': return 'down';
            case 'ArrowLeft': return 'left';
            case 'ArrowRight': return 'right';
            case ' ': return 'any';
            default: return null;
        }
    }
    
    handleDoubleHit(note1, note2, currentTime) {
        const timeDiff = Math.abs(currentTime - note1.targetTime);
        let hitType = 'good';
        if (timeDiff < 0.1) hitType = 'perfect';
        
        note1.hit(hitType);
        note2.hit(hitType);
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.addHitEffect(centerX, centerY, POP_COLORS.CYAN_BLUE, hitType);
        this.createParticleExplosion(centerX, centerY, POP_COLORS.CYAN_BLUE, 40);
        
        const score = hitType === 'perfect' ? 
            DYNAMIC_RHYTHM_CONFIG.perfectScore * 1.5 : 
            DYNAMIC_RHYTHM_CONFIG.goodScore * 1.5;
        this.updateScore(this.score + Math.floor(score * (1 + this.combo * 0.01)));
        this.updateCombo(this.combo + 1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        if (hitType === 'perfect') {
            this.perfectCount += 2;
            this.energy = Math.min(DYNAMIC_RHYTHM_CONFIG.maxEnergy, 
                this.energy + DYNAMIC_RHYTHM_CONFIG.perfectEnergyGain * 1.5);
            this.audioManager.playSound('perfect', { pitch: 1.3, volume: 0.9 });
            this.triggerShake(15, 200);
            this.updateBgColorByCombo();
        } else {
            this.goodCount += 2;
            this.energy = Math.min(DYNAMIC_RHYTHM_CONFIG.maxEnergy, 
                this.energy + DYNAMIC_RHYTHM_CONFIG.goodEnergyGain * 1.5);
            this.audioManager.playSound('hit', { pitch: 1.1, volume: 0.7 });
        }
    }
    
    handleHit(note, type) {
        note.hit(type);
        
        this.addHitEffect(note.currentX, note.currentY, 
            type === 'perfect' ? DYNAMIC_RHYTHM_CONFIG.colors.perfect : DYNAMIC_RHYTHM_CONFIG.colors.good, 
            type);
        this.createParticleExplosion(note.currentX, note.currentY, note.color, type === 'perfect' ? 35 : 20);
        
        const score = type === 'perfect' ? DYNAMIC_RHYTHM_CONFIG.perfectScore : DYNAMIC_RHYTHM_CONFIG.goodScore;
        this.updateScore(this.score + Math.floor(score * (1 + this.combo * 0.01)));
        this.updateCombo(this.combo + 1);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        if (type === 'perfect') {
            this.perfectCount++;
            this.energy = Math.min(DYNAMIC_RHYTHM_CONFIG.maxEnergy, 
                this.energy + DYNAMIC_RHYTHM_CONFIG.perfectEnergyGain);
            this.audioManager.playSound('perfect', { pitch: 1.2, volume: 0.8 });
            this.triggerShake(10, 150);
            this.triggerFlash('rgba(255, 255, 255, 0.3)', 100);
            this.updateBgColorByCombo();
        } else {
            this.goodCount++;
            this.energy = Math.min(DYNAMIC_RHYTHM_CONFIG.maxEnergy, 
                this.energy + DYNAMIC_RHYTHM_CONFIG.goodEnergyGain);
            this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.6 });
        }
        
        if (this.combo >= 5 && this.combo % 5 === 0) {
            this.audioManager.playSound('combo', { pitch: 1 + (this.combo / 50), volume: 0.7 });
        }
    }
    
    handleMiss(note = null) {
        this.missCount++;
        this.updateCombo(0);
        
        this.energy = Math.max(0, this.energy - DYNAMIC_RHYTHM_CONFIG.missEnergyLoss);
        
        this.audioManager.playSound('miss', { pitch: 0.8, volume: 0.6 });
        this.triggerFlash('rgba(255, 0, 0, 0.2)', 150);
        
        if (this.energy <= 0) {
            this.gameOver();
        }
    }
    
    updateBgColorByCombo() {
        const stages = DYNAMIC_RHYTHM_CONFIG.comboColorStages;
        let targetStage = stages[0];
        
        for (let i = stages.length - 1; i >= 0; i--) {
            if (this.combo >= stages[i].minCombo) {
                targetStage = stages[i];
                break;
            }
        }
        
        this.targetBgColor = targetStage.color;
        this.isInverted = targetStage.invert || false;
        
        this.canvas.style.backgroundColor = this.targetBgColor;
    }
}

console.log('动态律动游戏模块已加载（完整版）');