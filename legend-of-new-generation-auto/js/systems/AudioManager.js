/**
 * AudioManager.js - 音效管理系統
 * 插畫風格遊戲版本 - 使用 Web Audio API 生成音效
 * 無需外部音效文件，自動生成 8-bit/合成器風格音效
 */

class AudioManager {
    constructor(scene) {
        this.scene = scene;
        
        // Web Audio Context
        this.audioContext = null;
        this.initAudioContext();
        
        // 音量設置 (0-1)
        this.masterVolume = 1.0;
        this.bgmVolume = 0.5;  // 背景音樂較小聲
        this.sfxVolume = 0.8;
        
        // 靜音狀態
        this.isMuted = false;
        
        // 當前播放的背景音樂
        this.currentBgmOscillator = null;
        this.currentBgmGain = null;
        this.currentBgmInterval = null;
        
        // 載入保存的設置
        this.loadSettings();
    }
    
    /**
     * 初始化 Web Audio Context
     */
    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    /**
     * 確保 AudioContext 已恢復（用戶互動後）
     */
    ensureContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * 初始化音效系統
     * 在 BootScene 的 create() 中調用
     */
    static init(scene) {
        if (!scene.game.audioManager) {
            scene.game.audioManager = new AudioManager(scene);
        }
        return scene.game.audioManager;
    }
    
    /**
     * 獲取 AudioManager 實例
     */
    static getInstance(scene) {
        if (!scene.game.audioManager) {
            return AudioManager.init(scene);
        }
        return scene.game.audioManager;
    }
    
    /**
     * 在 BootScene 的 preload 中調用
     * 由於使用 Web Audio API 生成音效，不需要載入文件
     */
    static preload(scene) {
        console.log('AudioManager: 使用 Web Audio API 生成音效，無需載入文件');
    }
    
    // ==================== Web Audio 音效生成 ====================
    
    /**
     * 生成點擊音效 - 短促高頻
     */
    generateClickSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * 生成懸停音效 - 輕微高頻
     */
    generateHoverSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.15 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }
    
    /**
     * 生成確認音效 - 愉快上升音階
     */
    generateConfirmSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C major chord arpeggio
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.15);
            }, index * 60);
        });
    }
    
    /**
     * 生成取消音效 - 下降音
     */
    generateCancelSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }
    
    /**
     * 生成攻擊音效 - 快速掃頻
     */
    generateAttackSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * 生成受擊音效 - 噪音 burst
     */
    generateHitSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gain.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        noise.start();
    }
    
    /**
     * 生成勝利音效 - 歡快旋律
     */
    generateVictorySound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const melody = [
            { freq: 523.25, duration: 150 },  // C5
            { freq: 523.25, duration: 150 },  // C5
            { freq: 523.25, duration: 150 },  // C5
            { freq: 659.25, duration: 400 },  // E5
            { freq: 783.99, duration: 200 },  // G5
            { freq: 659.25, duration: 600 },  // E5
        ];
        
        let delay = 0;
        melody.forEach(note => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.25 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration / 1000);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + note.duration / 1000);
            }, delay);
            delay += note.duration;
        });
    }
    
    /**
     * 生成失敗音效 - 下降旋律
     */
    generateDefeatSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const melody = [
            { freq: 392.00, duration: 300 },  // G4
            { freq: 349.23, duration: 300 },  // F4
            { freq: 311.13, duration: 300 },  // Eb4
            { freq: 293.66, duration: 800 },  // D4
        ];
        
        let delay = 0;
        melody.forEach(note => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.25 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration / 1000);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + note.duration / 1000);
            }, delay);
            delay += note.duration;
        });
    }
    
    /**
     * 生成升級音效 - 閃耀音效
     */
    generateLevelUpSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Rising arpeggio
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.2);
            }, index * 80);
        });
    }
    
    /**
     * 生成魔法音效 - 不同學科不同風格
     */
    generateMagicSound(subject) {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const subjectSounds = {
            math: { type: 'square', baseFreq: 440, sweep: 'up' },
            science: { type: 'sawtooth', baseFreq: 330, sweep: 'down' },
            english: { type: 'triangle', baseFreq: 523, sweep: 'up' },
            general: { type: 'sine', baseFreq: 392, sweep: 'up' }
        };
        
        const sound = subjectSounds[subject] || subjectSounds.general;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = sound.type;
        osc.frequency.setValueAtTime(sound.baseFreq, this.audioContext.currentTime);
        
        if (sound.sweep === 'up') {
            osc.frequency.exponentialRampToValueAtTime(sound.baseFreq * 2, this.audioContext.currentTime + 0.3);
        } else {
            osc.frequency.exponentialRampToValueAtTime(sound.baseFreq / 2, this.audioContext.currentTime + 0.3);
        }
        
        gain.gain.setValueAtTime(0.25 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }
    
    /**
     * 生成腳步聲 - 輕微低音
     */
    generateFootstepSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.1 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }
    
    /**
     * 生成存檔音效 - 電子音
     */
    generateSaveSound() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        
        const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                gain.gain.setValueAtTime(0.15 * this.sfxVolume * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.1);
            }, index * 50);
        });
    }
    
    // ==================== 背景音樂生成 ====================
    
    /**
     * 生成主選單背景音樂 - 輕鬆循環旋律
     */
    playMenuBgm() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        this.stopBgm();
        
        // 簡單的循環和弦進行
        const chordProgression = [
            { notes: [261.63, 329.63, 392.00], duration: 2000 },  // C major
            { notes: [293.66, 349.23, 440.00], duration: 2000 },  // D minor
            { notes: [349.23, 440.00, 523.25], duration: 2000 },  // F major
            { notes: [392.00, 493.88, 587.33], duration: 2000 },  // G major
        ];
        
        let chordIndex = 0;
        
        const playChord = () => {
            if (this.isMuted || !this.audioContext) return;
            
            const chord = chordProgression[chordIndex];
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.08 * this.bgmVolume * this.masterVolume, this.audioContext.currentTime + 0.5);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + chord.duration / 1000);
            gain.connect(this.audioContext.destination);
            
            chord.notes.forEach(freq => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(gain);
                osc.start();
                osc.stop(this.audioContext.currentTime + chord.duration / 1000);
            });
            
            chordIndex = (chordIndex + 1) % chordProgression.length;
        };
        
        playChord();
        this.currentBgmInterval = setInterval(playChord, 2000);
    }
    
    /**
     * 生成戰鬥背景音樂 - 緊張節奏
     */
    playBattleBgm() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        this.stopBgm();
        
        // 更快的節奏
        const baseFreq = 110; // A2
        let beat = 0;
        
        const playBeat = () => {
            if (this.isMuted || !this.audioContext) return;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = beat % 4 === 0 ? 'square' : 'sawtooth';
            osc.frequency.value = beat % 4 === 0 ? baseFreq : baseFreq * 1.5;
            
            gain.gain.setValueAtTime(0.1 * this.bgmVolume * this.masterVolume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.15);
            
            beat++;
        };
        
        playBeat();
        this.currentBgmInterval = setInterval(playBeat, 250);
    }
    
    /**
     * 生成世界地圖背景音樂 - 輕快探索感
     */
    playWorldBgm() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        this.stopBgm();
        
        // 輕快的旋律
        const melody = [
            392.00, 440.00, 493.88, 523.25,  // G A B C
            493.88, 440.00, 392.00, 349.23,  // B A G F
        ];
        let noteIndex = 0;
        
        const playNote = () => {
            if (this.isMuted || !this.audioContext) return;
            
            const freq = melody[noteIndex];
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.1 * this.bgmVolume * this.masterVolume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
            
            noteIndex = (noteIndex + 1) % melody.length;
        };
        
        playNote();
        this.currentBgmInterval = setInterval(playNote, 400);
    }
    
    /**
     * 生成城鎮背景音樂 - 溫馨平和
     */
    playTownBgm() {
        if (!this.audioContext || this.isMuted) return;
        this.ensureContext();
        this.stopBgm();
        
        // 溫馨和弦
        const chordProgression = [
            { notes: [349.23, 440.00, 523.25], duration: 3000 },  // F major
            { notes: [261.63, 329.63, 392.00], duration: 3000 },  // C major
        ];
        
        let chordIndex = 0;
        
        const playChord = () => {
            if (this.isMuted || !this.audioContext) return;
            
            const chord = chordProgression[chordIndex];
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.08 * this.bgmVolume * this.masterVolume, this.audioContext.currentTime + 1);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + chord.duration / 1000);
            gain.connect(this.audioContext.destination);
            
            chord.notes.forEach(freq => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(gain);
                osc.start();
                osc.stop(this.audioContext.currentTime + chord.duration / 1000);
            });
            
            chordIndex = (chordIndex + 1) % chordProgression.length;
        };
        
        playChord();
        this.currentBgmInterval = setInterval(playChord, 3000);
    }
    
    /**
     * 停止背景音樂
     */
    stopBgm() {
        if (this.currentBgmInterval) {
            clearInterval(this.currentBgmInterval);
            this.currentBgmInterval = null;
        }
        if (this.currentBgmOscillator) {
            try {
                this.currentBgmOscillator.stop();
            } catch (e) {}
            this.currentBgmOscillator = null;
        }
    }
    
    /**
     * 暫停背景音樂
     */
    pauseBgm() {
        if (this.audioContext) {
            this.audioContext.suspend();
        }
    }
    
    /**
     * 恢復背景音樂
     */
    resumeBgm() {
        if (this.audioContext) {
            this.audioContext.resume();
        }
    }
    
    // ==================== 快捷播放方法 ====================
    
    // --- UI 音效 ---
    playClick() { return this.generateClickSound(); }
    playHover() { return this.generateHoverSound(); }
    playOpen() { return this.generateClickSound(); }
    playClose() { return this.generateCancelSound(); }
    playCancel() { return this.generateCancelSound(); }
    playConfirm() { return this.generateConfirmSound(); }
    
    // --- 戰鬥音效 ---
    playAttack() { return this.generateAttackSound(); }
    playHit() { return this.generateHitSound(); }
    playMiss() { return this.generateCancelSound(); }
    playVictory() { 
        this.stopBgm();
        return this.generateVictorySound(); 
    }
    playDefeat() { 
        this.stopBgm();
        return this.generateDefeatSound(); 
    }
    playLevelUp() { return this.generateLevelUpSound(); }
    
    // --- 魔法音效 ---
    playMagic(subject) {
        return this.generateMagicSound(subject);
    }
    playHeal() { return this.generateMagicSound('general'); }
    playShield() { return this.generateMagicSound('general'); }
    
    // --- 環境音效 ---
    playFootstep() { return this.generateFootstepSound(); }
    playEncounter() { return this.generateConfirmSound(); }
    playSave() { return this.generateSaveSound(); }
    playItem() { return this.generateConfirmSound(); }
    
    // --- Boss 音樂 ---
    playBossBgm() { return this.playBattleBgm(); }
    playFinalBossBgm() { return this.playBattleBgm(); }
    
    // ==================== 音量控制 ====================
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }
    
    // ==================== 靜音控制 ====================
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBgm();
        }
        this.saveSettings();
        return this.isMuted;
    }
    
    setMute(muted) {
        this.isMuted = muted;
        if (this.isMuted) {
            this.stopBgm();
        }
        this.saveSettings();
    }
    
    // ==================== 設置保存/載入 ====================
    
    saveSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        };
        localStorage.setItem('lng-audio-settings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('lng-audio-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume ?? 1.0;
                this.bgmVolume = settings.bgmVolume ?? 0.5;
                this.sfxVolume = settings.sfxVolume ?? 0.8;
                this.isMuted = settings.isMuted ?? false;
            } catch (e) {
                console.warn('Failed to load audio settings:', e);
            }
        }
    }
    
    getSettings() {
        return {
            masterVolume: this.masterVolume,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        };
    }
}

// 導出模組（如果在模組環境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
