// 🌧️ 動態天氣系統 - Dynamic Weather System
// v1.7.0 新增功能

class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.weatherType = 'clear'; // clear, rain, snow, storm
        this.particles = null;
        this.overlay = null;
        this.isActive = false;
        this.weatherTimer = null;
        
        // 天氣配置
        this.weatherConfig = {
            clear: {
                name: '晴朗',
                emoji: '☀️',
                particleCount: 0,
                tint: 0xffffff,
                alpha: 0,
                bgmModifier: 1
            },
            rain: {
                name: '雨天',
                emoji: '🌧️',
                particleCount: 200,
                tint: 0x8899aa,
                alpha: 0.3,
                bgmModifier: 0.9
            },
            storm: {
                name: '雷雨',
                emoji: '⛈️',
                particleCount: 400,
                tint: 0x445566,
                alpha: 0.5,
                bgmModifier: 0.8
            }
        };
    }

    // 初始化天氣系統
    init(weatherType = null) {
        // 如果沒有指定，隨機選擇天氣
        if (!weatherType) {
            const types = ['clear', 'rain', 'storm'];
            const weights = [0.6, 0.3, 0.1]; // 60%晴天, 30%雨天, 10%雷雨
            weatherType = this.weightedRandom(types, weights);
        }
        
        this.weatherType = weatherType;
        
        if (weatherType !== 'clear') {
            this.startWeather(weatherType);
        }
        
        // 創建天氣指示器
        this.createWeatherIndicator();
        
        console.log(`🌤️ WeatherSystem: 當前天氣 - ${this.weatherConfig[weatherType].name}`);
    }

    // 加權隨機選擇
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    // 開始天氣效果
    startWeather(type) {
        const config = this.weatherConfig[type];
        
        // 創建暗色覆蓋層
        if (!this.overlay) {
            this.overlay = this.scene.add.rectangle(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.centerY,
                this.scene.cameras.main.width * 2,
                this.scene.cameras.main.height * 2,
                config.tint,
                config.alpha
            );
            this.overlay.setDepth(50);
            this.overlay.setScrollFactor(0);
        } else {
            this.overlay.setFillStyle(config.tint, config.alpha);
        }
        
        // 創建粒子效果
        this.createParticles(type);
        
        // 創建閃電效果（如果是雷雨）
        if (type === 'storm') {
            this.startLightningEffect();
        }
        
        this.isActive = true;
    }

    // 創建天氣粒子
    createParticles(type) {
        // 清理舊粒子
        if (this.particles) {
            this.particles.destroy();
        }
        
        const config = this.weatherConfig[type];
        
        // 創建粒子圖形
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        
        if (type === 'rain' || type === 'storm') {
            // 雨滴形狀
            graphics.fillStyle(0xaaccff, 0.8);
            graphics.fillRect(0, 0, 2, 8);
        }
        
        graphics.generateTexture('weather-particle', 2, 8);
        
        // 創建粒子發射器
        this.particles = this.scene.add.particles(0, 0, 'weather-particle', {
            x: { min: 0, max: this.scene.cameras.main.width * 2 },
            y: -20,
            lifespan: 1000,
            speedY: { min: 300, max: 500 },
            speedX: { min: -20, max: 20 },
            scale: { start: 1, end: 0.5 },
            quantity: config.particleCount / 60, // 每幀生成數量
            frequency: 1000 / 60,
            blendMode: 'ADD',
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, this.scene.cameras.main.width * 2, 1)
            }
        });
        
        this.particles.setDepth(55);
        this.particles.setScrollFactor(0);
    }

    // 開始閃電效果
    startLightningEffect() {
        const triggerLightning = () => {
            if (!this.isActive || this.weatherType !== 'storm') return;
            
            this.createLightningFlash();
            
            // 隨機間隔（3-8秒）
            const nextFlash = 3000 + Math.random() * 5000;
            this.scene.time.delayedCall(nextFlash, triggerLightning);
        };
        
        // 第一次閃電延遲
        this.scene.time.delayedCall(2000, triggerLightning);
    }

    // 創建閃電閃光效果
    createLightningFlash() {
        // 閃光
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width * 2,
            this.scene.cameras.main.height * 2,
            0xffffff,
            0.8
        );
        flash.setDepth(60);
        flash.setScrollFactor(0);
        
        // 閃電紋理
        const lightning = this.scene.add.text(
            Phaser.Math.Between(100, this.scene.cameras.main.width - 100),
            50,
            '⚡',
            { fontSize: '64px' }
        );
        lightning.setDepth(61);
        lightning.setScrollFactor(0);
        
        // 閃光動畫
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            yoyo: true,
            repeat: 1,
            onComplete: () => flash.destroy()
        });
        
        // 雷聲效果（使用視覺文字表示）
        const thunderText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            100,
            '💥 轟隆！',
            {
                fontSize: '24px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        thunderText.setOrigin(0.5);
        thunderText.setDepth(62);
        thunderText.setScrollFactor(0);
        
        this.scene.tweens.add({
            targets: [lightning, thunderText],
            alpha: 0,
            duration: 500,
            delay: 300,
            onComplete: () => {
                lightning.destroy();
                thunderText.destroy();
            }
        });
        
        // 播放雷聲音效（如果音效管理器支持）
        if (this.scene.audio && this.scene.audio.playThunder) {
            this.scene.audio.playThunder();
        }
    }

    // 創建天氣指示器
    createWeatherIndicator() {
        const config = this.weatherConfig[this.weatherType];
        
        this.weatherIndicator = this.scene.add.container(750, 15);
        this.weatherIndicator.setScrollFactor(0);
        this.weatherIndicator.setDepth(150);
        
        // 背景
        const bg = this.scene.add.rectangle(0, 0, 80, 30, 0x000000, 0.6);
        bg.setStrokeStyle(1, 0xffffff, 0.3);
        
        // 天氣圖標和名稱
        const text = this.scene.add.text(0, 0, `${config.emoji} ${config.name}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.weatherIndicator.add([bg, text]);
        
        // 進場動畫
        this.weatherIndicator.setAlpha(0);
        this.weatherIndicator.x += 20;
        
        this.scene.tweens.add({
            targets: this.weatherIndicator,
            alpha: 1,
            x: 750,
            duration: 500,
            ease: 'Power2'
        });
    }

    // 更新天氣指示器
    updateIndicator() {
        if (!this.weatherIndicator) return;
        
        const config = this.weatherConfig[this.weatherType];
        const text = this.weatherIndicator.list[1];
        text.setText(`${config.emoji} ${config.name}`);
    }

    // 切換天氣
    changeWeather(newType) {
        if (this.weatherType === newType) return;
        
        // 停止當前天氣
        this.stopWeather();
        
        // 開始新天氣
        this.weatherType = newType;
        
        if (newType !== 'clear') {
            this.startWeather(newType);
        }
        
        // 更新指示器
        this.updateIndicator();
        
        // 顯示天氣變化提示
        this.showWeatherChangeNotification();
        
        console.log(`🌤️ WeatherSystem: 天氣變化 - ${this.weatherConfig[newType].name}`);
    }

    // 停止天氣效果
    stopWeather() {
        if (this.particles) {
            this.particles.destroy();
            this.particles = null;
        }
        
        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }
        
        this.isActive = false;
    }

    // 顯示天氣變化通知
    showWeatherChangeNotification() {
        const config = this.weatherConfig[this.weatherType];
        
        const notification = this.scene.add.text(
            this.scene.cameras.main.centerX,
            80,
            `🌤️ 天氣變化：${config.name}`,
            {
                fontSize: '20px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: '#00000066',
                padding: { x: 15, y: 8 }
            }
        );
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        notification.setDepth(200);
        
        this.scene.tweens.add({
            targets: notification,
            y: 60,
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Power2'
        });
        
        this.scene.tweens.add({
            targets: notification,
            y: 40,
            alpha: 0,
            duration: 500,
            delay: 2500,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    // 獲取當前天氣效果（用於遊戲機制）
    getWeatherEffect() {
        const effects = {
            clear: { enemyVision: 1, playerSpeed: 1 },
            rain: { enemyVision: 0.8, playerSpeed: 0.9 },
            storm: { enemyVision: 0.6, playerSpeed: 0.85 }
        };
        return effects[this.weatherType] || effects.clear;
    }

    // 銷毀
    destroy() {
        this.stopWeather();
        
        if (this.weatherIndicator) {
            this.weatherIndicator.destroy();
        }
        
        if (this.weatherTimer) {
            this.weatherTimer.remove();
        }
    }
}

// 導出類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherSystem;
}
