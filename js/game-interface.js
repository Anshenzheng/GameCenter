/**
 * 游戏接口 - 所有游戏必须实现这些方法
 * 这是平台的核心扩展点，新增游戏只需实现此接口
 */
class GameInterface {
    /**
     * 游戏元数据 - 用于在游戏列表中显示
     * 必须返回包含以下属性的对象：
     * - id: 游戏唯一标识符
     * - name: 游戏名称
     * - description: 游戏描述
     * - icon: 游戏图标（emoji或图标类名）
     * - colors: 游戏主题色（用于卡片展示）
     */
    static get metadata() {
        throw new Error('Game must implement static metadata getter');
    }

    /**
     * 构造函数
     * @param {Object} context - 游戏上下文，包含DOM元素引用等
     */
    constructor(context) {
        this.context = context;
        this.canvas = context.canvas;
        this.isRunning = false;
        this.score = 0;
        this.combo = 0;
        this.audioManager = null;
    }

    /**
     * 初始化游戏
     * 在游戏开始前调用，用于设置游戏状态、加载资源等
     */
    init() {
        throw new Error('Game must implement init() method');
    }

    /**
     * 启动游戏
     * 开始游戏主循环
     */
    start() {
        throw new Error('Game must implement start() method');
    }

    /**
     * 暂停游戏
     */
    pause() {
        throw new Error('Game must implement pause() method');
    }

    /**
     * 恢复游戏
     */
    resume() {
        throw new Error('Game must implement resume() method');
    }

    /**
     * 停止游戏
     * 清理资源，结束游戏循环
     */
    stop() {
        throw new Error('Game must implement stop() method');
    }

    /**
     * 渲染游戏帧
     * @param {number} deltaTime - 距上一帧的时间（毫秒）
     */
    render(deltaTime) {
        throw new Error('Game must implement render() method');
    }

    /**
     * 处理输入事件
     * @param {string} eventType - 事件类型（keydown, keyup等）
     * @param {Event} event - 原始事件对象
     */
    handleInput(eventType, event) {
        throw new Error('Game must implement handleInput() method');
    }

    /**
     * 更新分数显示
     * @param {number} newScore - 新分数
     */
    updateScore(newScore) {
        this.score = newScore;
        if (this.context.scoreDisplay) {
            this.context.scoreDisplay.textContent = `分数: ${this.score}`;
        }
    }

    /**
     * 更新连击显示
     * @param {number} newCombo - 新连击数
     */
    updateCombo(newCombo) {
        this.combo = newCombo;
        if (this.context.comboDisplay) {
            this.context.comboDisplay.textContent = `连击: ${this.combo}`;
        }
    }

    /**
     * 触发屏幕震动效果
     * @param {number} intensity - 震动强度（0-100）
     * @param {number} duration - 持续时间（毫秒）
     */
    triggerShake(intensity = 20, duration = 300) {
        const element = this.canvas;
        if (!element) return;

        const originalTransform = element.style.transform || '';
        const startTime = performance.now();
        
        const shake = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const decay = 1 - progress;
            
            const x = (Math.random() - 0.5) * intensity * decay * 2;
            const y = (Math.random() - 0.5) * intensity * decay * 2;
            const rotation = (Math.random() - 0.5) * intensity * decay * 0.5;
            
            element.style.transform = `${originalTransform} translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(shake);
            } else {
                element.style.transform = originalTransform;
            }
        };
        
        requestAnimationFrame(shake);
    }

    /**
     * 触发视觉闪光效果
     * @param {string} color - 闪光颜色
     * @param {number} duration - 持续时间（毫秒）
     */
    triggerFlash(color = 'white', duration = 200) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${color};
            opacity: 0.8;
            pointer-events: none;
            z-index: 1000;
            transition: opacity ${duration}ms ease-out;
        `;
        this.canvas.appendChild(flash);
        
        requestAnimationFrame(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                flash.remove();
            }, duration);
        });
    }
}

/**
 * 音频管理器 - 处理游戏音效和音乐
 * 使用Web Audio API提供更好的音频体验
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = new Map();
        this.musicSource = null;
        this.isInitialized = false;
    }

    /**
     * 初始化音频上下文
     * 必须在用户交互后调用（浏览器安全策略）
     */
    init() {
        if (this.isInitialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.8;
            this.isInitialized = true;
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }

    /**
     * 确保音频上下文已恢复（应对浏览器自动暂停）
     */
    ensureContextRunning() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     * @param {Object} options - 播放选项（pitch, volume等）
     */
    playSound(soundName, options = {}) {
        if (!this.isInitialized) this.init();
        this.ensureContextRunning();
        
        const { pitch = 1, volume = 1, type = 'sine' } = options;
        
        // 如果有预加载的音频文件，优先使用
        if (this.sounds.has(soundName)) {
            this.playLoadedSound(soundName, options);
            return;
        }
        
        // 否则使用合成音效
        this.playSyntheticSound(soundName, { pitch, volume, type });
    }

    /**
     * 播放合成音效（不需要外部音频文件）
     */
    playSyntheticSound(soundName, options) {
        if (!this.audioContext) return;
        
        const { pitch = 1, volume = 1, type = 'sine' } = options;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // 根据音效名称设置不同的声音特性
        switch (soundName) {
            case 'hit': // 打击音效 - 清脆
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(880 * pitch, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440 * pitch, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
                break;
                
            case 'perfect': // 完美击中 - 更脆更高
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(1760 * pitch, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880 * pitch, this.audioContext.currentTime + 0.15);
                gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
                
            case 'miss': // 错过 - 低落
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200 * pitch, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100 * pitch, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(volume * 0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
                
            case 'combo': // 连击音效
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440 * pitch, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(660 * pitch, this.audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(880 * pitch, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(volume * 0.8, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
                
            default: // 默认音效
                oscillator.type = type;
                oscillator.frequency.setValueAtTime(440 * pitch, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
        }
    }

    /**
     * 播放已加载的音频文件
     */
    playLoadedSound(soundName, options) {
        const soundBuffer = this.sounds.get(soundName);
        if (!soundBuffer || !this.audioContext) return;
        
        const { pitch = 1, volume = 1 } = options;
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = soundBuffer;
        source.playbackRate.value = pitch;
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start();
    }

    /**
     * 加载音频文件
     * @param {string} name - 音效名称
     * @param {string} url - 音频文件URL
     * @returns {Promise}
     */
    async loadSound(name, url) {
        if (!this.isInitialized) this.init();
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.error(`Failed to load sound ${name}:`, e);
            return null;
        }
    }

    /**
     * 播放背景音乐
     * @param {string} url - 音乐文件URL
     * @param {boolean} loop - 是否循环
     */
    async playMusic(url, loop = true) {
        if (!this.isInitialized) this.init();
        this.ensureContextRunning();
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            if (this.musicSource) {
                this.musicSource.stop();
            }
            
            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = audioBuffer;
            this.musicSource.loop = loop;
            this.musicSource.connect(this.masterGain);
            this.musicSource.start();
        } catch (e) {
            console.error('Failed to play music:', e);
        }
    }

    /**
     * 停止背景音乐
     */
    stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource = null;
        }
    }

    /**
     * 设置主音量
     * @param {number} value - 音量（0-1）
     */
    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
}