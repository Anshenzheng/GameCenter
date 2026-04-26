/**
 * 流体颜色分类游戏 - Fluid Color Sort Game
 * 精致的玻璃试管质感，带高光和折射
 * 流体动效、晃动感、水面波荡
 * 多巴胺配色
 */

const FLUID_COLORS = {
    bg: '#1a1a2e',
    bgGradientStart: '#16213e',
    bgGradientEnd: '#0f0f23',
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    fluidColors: [
        '#FF6B9D',
        '#4ECDC4',
        '#FFE66D',
        '#A8E6CF',
        '#DDA0DD',
        '#87CEEB',
        '#FFB347',
        '#98D8C8',
    ],
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#818cf8',
};

class LiquidParticle {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.02 + Math.random() * 0.03;
        this.wobbleAmplitude = 0.5 + Math.random() * 1.5;
    }

    update(deltaTime) {
        this.wobblePhase += this.wobbleSpeed * (deltaTime / 16);
    }

    getWobbleX() {
        return Math.sin(this.wobblePhase) * this.wobbleAmplitude;
    }

    getWobbleY() {
        return Math.cos(this.wobblePhase * 0.7) * this.wobbleAmplitude * 0.5;
    }
}

class Tube {
    constructor(x, y, width, height, index) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.index = index;
        this.liquids = [];
        this.maxLiquids = 4;
        this.liquidHeight = height * 0.2;
        this.isSelected = false;
        this.isHovered = false;
        this.shakeOffset = 0;
        this.shakeSpeed = 0.15;
        this.shakeDecay = 0.95;
        this.wobbleTime = Math.random() * 1000;
        this.splashParticles = [];
        this.pouringFrom = null;
        this.pouringTo = null;
        this.pourProgress = 0;
        this.pourSpeed = 0.03;
        this.recentlyAdded = null;
        this.addAnimationTime = 0;
        this.glassHighlight = Math.random() * 0.3 + 0.7;
    }

    addLiquid(color, animate = true) {
        if (this.liquids.length < this.maxLiquids) {
            this.liquids.push(color);
            if (animate) {
                this.recentlyAdded = color;
                this.addAnimationTime = 0;
                this.triggerSplash();
            }
            return true;
        }
        return false;
    }

    removeLiquid() {
        if (this.liquids.length > 0) {
            return this.liquids.pop();
        }
        return null;
    }

    getTopLiquid() {
        if (this.liquids.length > 0) {
            return this.liquids[this.liquids.length - 1];
        }
        return null;
    }

    canReceive(color) {
        if (this.liquids.length === 0) return true;
        if (this.liquids.length >= this.maxLiquids) return false;
        return this.getTopLiquid() === color;
    }

    isEmpty() {
        return this.liquids.length === 0;
    }

    isComplete() {
        if (this.liquids.length === 0) return true;
        if (this.liquids.length < this.maxLiquids) return false;
        const color = this.liquids[0];
        return this.liquids.every(l => l === color);
    }

    triggerSplash() {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI;
            const speed = 2 + Math.random() * 4;
            this.splashParticles.push({
                x: this.width / 2,
                y: this.height - (this.liquids.length * this.liquidHeight),
                vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                vy: -Math.sin(angle) * speed - 2,
                size: 2 + Math.random() * 4,
                color: this.getTopLiquid(),
                life: 1,
                gravity: 0.15
            });
        }
    }

    triggerShake() {
        this.shakeOffset = 8;
    }

    update(deltaTime) {
        const dt = deltaTime / 16;
        this.wobbleTime += deltaTime * 0.002;

        if (this.shakeOffset !== 0) {
            this.shakeOffset *= this.shakeDecay;
            if (Math.abs(this.shakeOffset) < 0.01) {
                this.shakeOffset = 0;
            }
        }

        if (this.addAnimationTime < 1) {
            this.addAnimationTime += 0.05 * dt;
        }

        this.splashParticles = this.splashParticles.filter(p => {
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= 0.02 * dt;
            return p.life > 0 && p.y < this.height + 20;
        });
    }

    draw(ctx) {
        ctx.save();

        const actualX = this.x + this.shakeOffset;

        ctx.beginPath();
        this.drawTubeShape(ctx, actualX, this.y);
        ctx.clip();

        this.drawLiquids(ctx, actualX, this.y);
        this.drawSplashParticles(ctx, actualX, this.y);

        ctx.restore();

        this.drawTubeGlass(ctx, actualX, this.y);

        if (this.isSelected) {
            this.drawSelectionGlow(ctx, actualX, this.y);
        }

        if (this.isHovered && !this.isSelected) {
            this.drawHoverEffect(ctx, actualX, this.y);
        }
    }

    drawTubeShape(ctx, x, y) {
        const cornerRadius = 15;
        const topInset = 5;

        ctx.moveTo(x + topInset, y);
        ctx.lineTo(x + this.width - topInset, y);
        ctx.lineTo(x + this.width, y + 10);
        ctx.lineTo(x + this.width, y + this.height - cornerRadius);
        ctx.quadraticCurveTo(
            x + this.width, y + this.height,
            x + this.width - cornerRadius, y + this.height
        );
        ctx.lineTo(x + cornerRadius, y + this.height);
        ctx.quadraticCurveTo(
            x, y + this.height,
            x, y + this.height - cornerRadius
        );
        ctx.lineTo(x, y + 10);
        ctx.closePath();
    }

    drawTubeGlass(ctx, x, y) {
        ctx.save();

        ctx.beginPath();
        this.drawTubeShape(ctx, x, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const gradient = ctx.createLinearGradient(x, y, x + this.width, y);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 * this.glassHighlight})`);
        gradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.05 * this.glassHighlight})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 255, 0.02)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${0.08 * this.glassHighlight})`);

        ctx.beginPath();
        this.drawTubeShape(ctx, x, y);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 12, y + 5);
        ctx.lineTo(x + 8, y + 15);
        ctx.lineTo(x + 8, y + this.height * 0.4);
        ctx.quadraticCurveTo(x + 12, y + this.height * 0.45, x + 14, y + this.height * 0.4);
        ctx.lineTo(x + 14, y + 12);
        ctx.closePath();

        const highlightGradient = ctx.createLinearGradient(x + 8, y, x + 14, y);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

        ctx.fillStyle = highlightGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + this.width - 10, y + 10);
        ctx.lineTo(x + this.width - 6, y + 8);
        ctx.lineTo(x + this.width - 6, y + this.height * 0.3);
        ctx.lineTo(x + this.width - 10, y + this.height * 0.32);
        ctx.closePath();

        const darkGradient = ctx.createLinearGradient(x + this.width - 10, y, x + this.width - 6, y);
        darkGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        darkGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = darkGradient;
        ctx.fill();

        ctx.restore();
    }

    drawLiquids(ctx, x, y) {
        if (this.liquids.length === 0) return;

        for (let i = 0; i < this.liquids.length; i++) {
            const color = this.liquids[i];
            const isTop = i === this.liquids.length - 1;
            const isRecentlyAdded = isTop && this.recentlyAdded && this.addAnimationTime < 1;

            const baseY = y + this.height - (i + 1) * this.liquidHeight;
            const layerHeight = this.liquidHeight;

            const wobbleOffset = Math.sin(this.wobbleTime * 2 + i) * 2;
            const layerWobble = isTop ? wobbleOffset * 1.5 : wobbleOffset * 0.5;

            let actualY = baseY + layerWobble;
            let actualHeight = layerHeight;

            if (isRecentlyAdded) {
                const bounceEase = 1 - Math.pow(1 - this.addAnimationTime, 3);
                actualY = baseY + (1 - bounceEase) * 30;
            }

            this.drawLiquidLayer(ctx, x, actualY, actualHeight, color, isTop, i);
        }
    }

    drawLiquidLayer(ctx, x, y, height, color, isTop, layerIndex) {
        ctx.save();

        const topWobble = isTop ? Math.sin(this.wobbleTime * 3) * 3 : 0;
        const bottomWobble = Math.sin(this.wobbleTime * 2.5 + 1) * 2;

        ctx.beginPath();
        
        const points = [];
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = x + t * this.width;
            const waveOffset = Math.sin(t * Math.PI * 2 + this.wobbleTime * 2) * (isTop ? 2 : 1);
            const py = y + waveOffset + (t === 0 || t === 1 ? 0 : topWobble);
            points.push({ x: px, y: py });
        }

        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            const cpy = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        ctx.lineTo(points[points.length - 1].x, y + height + bottomWobble);
        ctx.lineTo(x, y + height + bottomWobble);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, this.lightenColor(color, 20));
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, this.darkenColor(color, 30));

        ctx.fillStyle = gradient;
        ctx.fill();

        if (isTop) {
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 5);
            ctx.quadraticCurveTo(x + this.width / 2, y - 2, x + this.width - 10, y + 5);
            ctx.lineTo(x + this.width - 5, y + 12);
            ctx.quadraticCurveTo(x + this.width / 2, y + 8, x + 5, y + 12);
            ctx.closePath();

            const surfaceGradient = ctx.createLinearGradient(x, y, x, y + 15);
            surfaceGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            surfaceGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = surfaceGradient;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.3 + Math.sin(this.wobbleTime + layerIndex) * 5,
            y + height * 0.4,
            8,
            5,
            Math.sin(this.wobbleTime * 0.5) * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
            x + this.width * 0.7 + Math.cos(this.wobbleTime * 0.8 + layerIndex) * 5,
            y + height * 0.6,
            5,
            3,
            Math.cos(this.wobbleTime * 0.3) * 0.2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();

        ctx.restore();
    }

    drawSplashParticles(ctx, x, y) {
        this.splashParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(x + p.x, y + p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        });
    }

    drawSelectionGlow(ctx, x, y) {
        ctx.save();
        ctx.shadowColor = FLUID_COLORS.accent;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        this.drawTubeShape(ctx, x, y);
        ctx.strokeStyle = FLUID_COLORS.accent;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }

    drawHoverEffect(ctx, x, y) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        this.drawTubeShape(ctx, x, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    containsPoint(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }
}

class PourAnimation {
    constructor(fromTube, toTube, color) {
        this.fromTube = fromTube;
        this.toTube = toTube;
        this.color = color;
        this.progress = 0;
        this.isComplete = false;
        this.liquidRemoved = false;
        this.liquidAdded = false;
        this.streamParticles = [];
        this.droplets = [];
    }

    update(deltaTime) {
        const dt = deltaTime / 16;
        this.progress += 0.015 * dt;

        if (this.progress >= 1) {
            this.progress = 1;
            if (!this.liquidAdded && this.toTube.canReceive(this.color)) {
                this.toTube.addLiquid(this.color);
                this.liquidAdded = true;
            }
            this.isComplete = true;
        }

        if (this.progress > 0.2 && !this.liquidRemoved) {
            this.fromTube.removeLiquid();
            this.liquidRemoved = true;
            this.fromTube.triggerShake();
        }

        if (this.progress > 0.1 && this.progress < 0.9) {
            this.updateStream(dt);
        }

        this.updateDroplets(dt);
    }

    updateStream(dt) {
        if (Math.random() < 0.8) {
            const startX = this.fromTube.x + this.fromTube.width / 2;
            const startY = this.fromTube.y + this.fromTube.height;
            
            const endX = this.toTube.x + this.toTube.width / 2;
            const endY = this.toTube.y;

            const progress = Math.random();
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;

            this.streamParticles.push({
                x: x,
                y: y,
                size: 3 + Math.random() * 4,
                life: 0.5,
                speed: 0.5 + Math.random() * 0.5
            });
        }

        this.streamParticles = this.streamParticles.filter(p => {
            p.life -= 0.03 * dt;
            p.y += p.speed * dt;
            return p.life > 0;
        });

        if (Math.random() < 0.2) {
            this.droplets.push({
                x: this.toTube.x + this.toTube.width / 2 + (Math.random() - 0.5) * 20,
                y: this.toTube.y + 5,
                vy: 1 + Math.random() * 2,
                size: 2 + Math.random() * 3,
                life: 1
            });
        }
    }

    updateDroplets(dt) {
        this.droplets = this.droplets.filter(d => {
            d.vy += 0.3 * dt;
            d.y += d.vy * dt;
            d.life -= 0.02 * dt;
            return d.life > 0 && d.y < this.toTube.y + this.toTube.height;
        });
    }

    draw(ctx) {
        if (this.progress <= 0) return;

        const startX = this.fromTube.x + this.fromTube.width / 2;
        const startY = this.fromTube.y + this.fromTube.height;
        
        const endX = this.toTube.x + this.toTube.width / 2;
        const endY = this.toTube.y;

        const streamProgress = Math.min(this.progress * 1.5, 1);
        const streamEndY = startY + (endY - startY) * streamProgress;

        ctx.save();

        const streamWidth = 6 + Math.sin(this.progress * Math.PI) * 4;

        ctx.beginPath();
        ctx.moveTo(startX - streamWidth / 2, startY);
        
        const controlX1 = startX + (endX - startX) * 0.3;
        const controlY1 = startY + (streamEndY - startY) * 0.5;
        const controlX2 = startX + (endX - startX) * 0.7;
        const controlY2 = startY + (streamEndY - startY) * 0.7;

        ctx.bezierCurveTo(
            controlX1 + Math.sin(this.progress * 5) * 2,
            controlY1,
            controlX2 + Math.cos(this.progress * 5) * 3,
            controlY2,
            endX - streamWidth / 2,
            streamEndY
        );

        ctx.lineTo(endX + streamWidth / 2, streamEndY);

        ctx.bezierCurveTo(
            controlX2 + Math.cos(this.progress * 5) * 3 + streamWidth / 2,
            controlY2,
            controlX1 + Math.sin(this.progress * 5) * 2 + streamWidth / 2,
            controlY1,
            startX + streamWidth / 2,
            startY
        );

        ctx.closePath();

        const gradient = ctx.createLinearGradient(startX, startY, endX, streamEndY);
        gradient.addColorStop(0, this.lightenColor(this.color, 30));
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 20));

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(startX - streamWidth / 4, startY);
        ctx.quadraticCurveTo(
            (startX + endX) / 2,
            (startY + streamEndY) / 2,
            endX - streamWidth / 4,
            streamEndY
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        this.streamParticles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        });

        this.droplets.forEach(d => {
            ctx.globalAlpha = d.life;
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, d.size, d.size * 1.2, 0, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        });

        ctx.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
}

class FluidColorSortGame extends GameInterface {
    static get metadata() {
        return {
            id: 'fluid-color-sort',
            name: '流体颜色分类',
            description: '精美的流体颜色分类游戏，玻璃试管质感，流畅的流体动效！',
            icon: '🧪',
            colors: {
                primary: '#FF6B9D',
                secondary: '#4ECDC4'
            }
        };
    }

    constructor(context) {
        super(context);
        this.canvas = context.canvas;
        this.gameCanvas = null;
        this.ctx = null;
        this.tubes = [];
        this.selectedTube = null;
        this.level = 1;
        this.moves = 0;
        this.pourAnimations = [];
        this.isPaused = false;
        this.isComplete = false;
        this.audioManager = new AudioManager();
        this.backgroundParticles = [];
        this.hoveredTube = null;
    }

    init() {
        this.hidePlatformHeaderInfo();
        this.createGameUI();
        this.audioManager.init();
        this.initBackgroundParticles();
        this.startNewLevel();
        console.log('流体颜色分类游戏已初始化');
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
            background: linear-gradient(135deg, ${FLUID_COLORS.bgGradientStart} 0%, ${FLUID_COLORS.bgGradientEnd} 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            overflow: hidden;
            position: relative;
        `;

        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'fluid-sort-container';
        this.gameContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            width: 100%;
            max-width: 800px;
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            position: relative;
            z-index: 10;
        `;

        this.createHeader();
        this.createGameCanvas();
        this.createControls();

        this.canvas.appendChild(this.gameContainer);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'fluid-sort-header';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 600px;
            padding: 12px 20px;
            background: ${FLUID_COLORS.glassBg};
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid ${FLUID_COLORS.glassBorder};
            border-radius: 12px;
            margin-bottom: 5px;
        `;

        const levelDisplay = document.createElement('div');
        levelDisplay.id = 'fluid-sort-level';
        levelDisplay.style.cssText = `
            font-size: 1.2rem;
            font-weight: 700;
            color: ${FLUID_COLORS.textPrimary};
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        levelDisplay.innerHTML = `<span style="color: #FF6B9D;">🧪</span> 第 ${this.level} 关`;

        const movesDisplay = document.createElement('div');
        movesDisplay.id = 'fluid-sort-moves';
        movesDisplay.style.cssText = `
            font-size: 1rem;
            font-weight: 600;
            color: ${FLUID_COLORS.textSecondary};
        `;
        movesDisplay.innerHTML = `移动: <span style="color: #4ECDC4; font-weight: 700;">${this.moves}</span>`;

        header.appendChild(levelDisplay);
        header.appendChild(movesDisplay);
        this.gameContainer.appendChild(header);
    }

    createGameCanvas() {
        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.id = 'fluid-sort-canvas';
        this.gameCanvas.style.cssText = `
            border-radius: 16px;
            background: transparent;
            cursor: pointer;
        `;
        this.gameContainer.appendChild(this.gameCanvas);

        this.ctx = this.gameCanvas.getContext('2d');
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.gameContainer;
        const maxWidth = Math.min(container.clientWidth - 40, 600);
        const maxHeight = 450;

        this.gameCanvas.width = maxWidth;
        this.gameCanvas.height = maxHeight;

        this.initializeTubes();
    }

    initializeTubes() {
        if (!this.ctx) return;

        this.tubes = [];
        
        const canvasWidth = this.gameCanvas.width;
        const canvasHeight = this.gameCanvas.height;
        
        const tubeWidth = Math.min(60, canvasWidth / 8);
        const tubeHeight = Math.min(200, canvasHeight * 0.6);
        const padding = 20;
        
        let numTubes = 6 + Math.floor(this.level / 3);
        numTubes = Math.min(numTubes, 8);
        
        const numEmptyTubes = 2;
        const numFilledTubes = numTubes - numEmptyTubes;

        const colorsToUse = FLUID_COLORS.fluidColors.slice(0, numFilledTubes);
        
        let tubesPerRow;
        let tubeSpacing;
        let rows;
        
        if (numTubes <= 4) {
            tubesPerRow = numTubes;
            rows = 1;
        } else if (numTubes <= 6) {
            tubesPerRow = 3;
            rows = 2;
        } else {
            tubesPerRow = 4;
            rows = 2;
        }

        const totalWidthNeeded = tubesPerRow * tubeWidth + (tubesPerRow - 1) * 30;
        const startX = (canvasWidth - totalWidthNeeded) / 2;
        const rowSpacing = tubeHeight + 40;
        const startY = (canvasHeight - rows * rowSpacing + rowSpacing - tubeHeight) / 2;

        const liquidConfig = this.generateLevel(numFilledTubes, colorsToUse);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < tubesPerRow; col++) {
                const index = row * tubesPerRow + col;
                if (index >= numTubes) break;

                const x = startX + col * (tubeWidth + 30);
                const y = startY + row * rowSpacing;

                const tube = new Tube(x, y, tubeWidth, tubeHeight, index);
                
                if (index < liquidConfig.length) {
                    liquidConfig[index].forEach(color => {
                        tube.addLiquid(color, false);
                    });
                }

                this.tubes.push(tube);
            }
        }
    }

    generateLevel(numFilledTubes, colors) {
        const config = [];
        const allLiquids = [];

        colors.forEach(color => {
            for (let i = 0; i < 4; i++) {
                allLiquids.push(color);
            }
        });

        for (let i = allLiquids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allLiquids[i], allLiquids[j]] = [allLiquids[j], allLiquids[i]];
        }

        for (let i = 0; i < numFilledTubes; i++) {
            config.push(allLiquids.slice(i * 4, (i + 1) * 4));
        }

        return config;
    }

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'fluid-sort-controls';
        controls.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        `;

        const buttons = [
            { id: 'fluid-restart-btn', text: '🔄 重新开始', action: () => this.restartLevel() },
            { id: 'fluid-undo-btn', text: '↩️ 撤销', action: () => this.undo() },
            { id: 'fluid-hint-btn', text: '💡 提示', action: () => this.showHint() }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.className = 'fluid-control-btn';
            button.textContent = btn.text;
            button.style.cssText = `
                padding: 12px 24px;
                font-size: 0.95rem;
                font-weight: 600;
                background: ${FLUID_COLORS.glassBg};
                backdrop-filter: blur(10px);
                border: 2px solid ${FLUID_COLORS.glassBorder};
                color: ${FLUID_COLORS.textPrimary};
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;
            button.addEventListener('click', btn.action);
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.background = 'linear-gradient(135deg, #FF6B9D, #4ECDC4)';
                button.style.boxShadow = '0 8px 25px rgba(255, 107, 157, 0.3)';
                button.style.borderColor = 'transparent';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.background = FLUID_COLORS.glassBg;
                button.style.boxShadow = 'none';
                button.style.borderColor = FLUID_COLORS.glassBorder;
            });

            controls.appendChild(button);
        });

        this.gameContainer.appendChild(controls);
    }

    initBackgroundParticles() {
        for (let i = 0; i < 30; i++) {
            this.backgroundParticles.push({
                x: Math.random(),
                y: Math.random(),
                size: 2 + Math.random() * 4,
                speedX: (Math.random() - 0.5) * 0.0005,
                speedY: (Math.random() - 0.5) * 0.0005,
                opacity: 0.1 + Math.random() * 0.2,
                color: FLUID_COLORS.fluidColors[Math.floor(Math.random() * FLUID_COLORS.fluidColors.length)]
            });
        }
    }

    updateBackgroundParticles(deltaTime) {
        const dt = deltaTime / 1000;
        this.backgroundParticles.forEach(p => {
            p.x += p.speedX * dt;
            p.y += p.speedY * dt;
            
            if (p.x < 0) p.x = 1;
            if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1;
            if (p.y > 1) p.y = 0;
        });
    }

    drawBackground() {
        if (!this.ctx) return;

        const canvas = this.gameCanvas;
        const gradient = this.ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        gradient.addColorStop(0, '#1e3a5f');
        gradient.addColorStop(1, FLUID_COLORS.bgGradientEnd);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.backgroundParticles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;
            this.ctx.beginPath();
            this.ctx.arc(
                p.x * canvas.width,
                p.y * canvas.height,
                p.size,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    startNewLevel() {
        this.moves = 0;
        this.isComplete = false;
        this.selectedTube = null;
        this.pourAnimations = [];
        this.history = [];

        this.initializeTubes();
        this.updateHeaderDisplay();
        this.audioManager.playSound('perfect', { pitch: 1.2, volume: 0.3 });
    }

    restartLevel() {
        this.startNewLevel();
    }

    undo() {
        if (!this.history || this.history.length === 0) return;
        
        const lastState = this.history.pop();
        this.tubes = lastState.tubes.map((savedTube, index) => {
            const tube = new Tube(
                savedTube.x,
                savedTube.y,
                savedTube.width,
                savedTube.height,
                index
            );
            tube.liquids = [...savedTube.liquids];
            return tube;
        });
        this.moves = lastState.moves;
        this.selectedTube = null;
        this.updateHeaderDisplay();
        
        this.audioManager.playSound('hit', { pitch: 0.7, volume: 0.3 });
    }

    showHint() {
        for (let i = 0; i < this.tubes.length; i++) {
            const fromTube = this.tubes[i];
            if (fromTube.isEmpty()) continue;
            
            const topColor = fromTube.getTopLiquid();
            
            for (let j = 0; j < this.tubes.length; j++) {
                if (i === j) continue;
                
                const toTube = this.tubes[j];
                if (toTube.canReceive(topColor)) {
                    fromTube.triggerShake();
                    toTube.triggerShake();
                    
                    this.audioManager.playSound('combo', { pitch: 1.0, volume: 0.3 });
                    return;
                }
            }
        }
        
        this.audioManager.playSound('miss', { pitch: 0.8, volume: 0.2 });
    }

    saveState() {
        if (!this.history) {
            this.history = [];
        }
        
        this.history.push({
            tubes: this.tubes.map(tube => ({
                x: tube.x,
                y: tube.y,
                width: tube.width,
                height: tube.height,
                liquids: [...tube.liquids]
            })),
            moves: this.moves
        });

        if (this.history.length > 20) {
            this.history.shift();
        }
    }

    handleTubeClick(tube) {
        if (this.isComplete || this.pourAnimations.length > 0) return;

        if (this.selectedTube === null) {
            if (!tube.isEmpty()) {
                this.selectedTube = tube;
                tube.isSelected = true;
                this.audioManager.playSound('hit', { pitch: 1.0, volume: 0.3 });
            }
        } else if (this.selectedTube === tube) {
            this.selectedTube.isSelected = false;
            this.selectedTube = null;
            this.audioManager.playSound('hit', { pitch: 0.9, volume: 0.2 });
        } else {
            this.tryPour(this.selectedTube, tube);
        }
    }

    tryPour(fromTube, toTube) {
        if (fromTube.isEmpty()) {
            fromTube.isSelected = false;
            this.selectedTube = null;
            return;
        }

        const topColor = fromTube.getTopLiquid();

        if (toTube.canReceive(topColor)) {
            this.saveState();
            
            const pourAnim = new PourAnimation(fromTube, toTube, topColor);
            this.pourAnimations.push(pourAnim);
            
            this.moves++;
            this.updateHeaderDisplay();
            
            this.audioManager.playSound('combo', { pitch: 0.9, volume: 0.3 });
        } else {
            fromTube.triggerShake();
            toTube.triggerShake();
            this.audioManager.playSound('miss', { pitch: 0.8, volume: 0.2 });
        }

        fromTube.isSelected = false;
        this.selectedTube = null;
    }

    checkCompletion() {
        const allComplete = this.tubes.every(tube => tube.isComplete());
        if (allComplete && !this.isComplete) {
            this.isComplete = true;
            this.showVictoryScreen();
            this.audioManager.playSound('perfect', { pitch: 1.5, volume: 0.5 });
        }
    }

    showVictoryScreen() {
        const overlay = document.createElement('div');
        overlay.className = 'fluid-victory-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
        `;

        const card = document.createElement('div');
        card.className = 'fluid-victory-card';
        card.style.cssText = `
            background: linear-gradient(135deg, ${FLUID_COLORS.bgGradientStart}, rgba(30, 30, 60, 0.95));
            border: 3px solid #4ECDC4;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 25px 60px rgba(78, 205, 196, 0.3);
        `;

        card.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 15px;">🎉</div>
            <h2 style="font-size: 2rem; font-weight: 800; color: #4ECDC4; margin-bottom: 8px;">恭喜过关！</h2>
            <p style="color: ${FLUID_COLORS.textSecondary}; margin-bottom: 25px; font-size: 1rem; line-height: 1.6;">
                关卡: <span style="color: #FF6B9D; font-weight: 700;">第 ${this.level} 关</span><br>
                移动次数: <span style="color: #FFE66D; font-weight: 700;">${this.moves}</span>
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="fluid-victory-btn next" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #4ECDC4, #FF6B9D);
                    border: none;
                    color: white;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">下一关</button>
                <button class="fluid-victory-btn restart" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${FLUID_COLORS.glassBg};
                    border: 2px solid ${FLUID_COLORS.glassBorder};
                    color: ${FLUID_COLORS.textPrimary};
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">重玩本关</button>
                <button class="fluid-victory-btn exit" style="
                    padding: 14px 28px;
                    font-size: 1rem;
                    font-weight: 700;
                    background: ${FLUID_COLORS.glassBg};
                    border: 2px solid ${FLUID_COLORS.glassBorder};
                    color: ${FLUID_COLORS.textPrimary};
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">返回主页</button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        card.querySelector('.next').addEventListener('click', () => {
            overlay.remove();
            this.level++;
            this.startNewLevel();
        });

        card.querySelector('.restart').addEventListener('click', () => {
            overlay.remove();
            this.restartLevel();
        });

        card.querySelector('.exit').addEventListener('click', () => {
            overlay.remove();
            this.context.gameManager.exitGame();
        });
    }

    updateHeaderDisplay() {
        const levelDisplay = document.getElementById('fluid-sort-level');
        const movesDisplay = document.getElementById('fluid-sort-moves');
        
        if (levelDisplay) {
            levelDisplay.innerHTML = `<span style="color: #FF6B9D;">🧪</span> 第 ${this.level} 关`;
        }
        if (movesDisplay) {
            movesDisplay.innerHTML = `移动: <span style="color: #4ECDC4; font-weight: 700;">${this.moves}</span>`;
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
    }

    stop() {
        this.isRunning = false;
        this.restorePlatformHeaderInfo();
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    render(deltaTime) {
        if (!this.ctx || !this.isRunning) return;

        if (this.isPaused) return;

        this.updateBackgroundParticles(deltaTime);

        this.tubes.forEach(tube => tube.update(deltaTime));

        this.pourAnimations = this.pourAnimations.filter(anim => {
            anim.update(deltaTime);
            if (anim.isComplete) {
                this.checkCompletion();
                return false;
            }
            return true;
        });

        this.drawBackground();

        this.tubes.forEach(tube => tube.draw(this.ctx));

        this.pourAnimations.forEach(anim => anim.draw(this.ctx));
    }

    handleInput(eventType, event) {
        if (eventType === 'click') {
            const rect = this.gameCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            for (const tube of this.tubes) {
                if (tube.containsPoint(x, y)) {
                    this.handleTubeClick(tube);
                    break;
                }
            }
        } else if (eventType === 'mousemove') {
            const rect = this.gameCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.tubes.forEach(tube => {
                tube.isHovered = tube.containsPoint(x, y);
            });
        }
    }
}
