/**
 * BattleScene - 戰鬥場景
 * 回合制戰鬥系統，結合問答機制
 * v1.12.0 - 新增連擊獎勵系統
 */

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerData = data.player;
        this.enemyData = data.enemy;
        this.returnScene = data.returnScene || 'WorldScene';
        this.turn = 'player'; // 'player' 或 'enemy'
        this.battleEnded = false;
        this.quizActive = false; // 防止重複啟動QuizScene
        
        // 🔥 連擊系統初始化
        this.comboCount = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 0.1; // 每連擊增加10%傷害
        
        // 🎯 連擊獎勵系統（新增 v1.12.0）
        this.comboRewards = {
            5: { type: 'critBoost', value: 0.15, message: '🎯 連擊x5！暴擊率+15%' },
            10: { type: 'heal', value: 20, message: '💚 連擊x10！回復20HP' },
            15: { type: 'damageBoost', value: 0.25, message: '⚔️ 連擊x15！傷害+25%' },
            20: { type: 'fullHeal', value: 50, message: '✨ 連擊x20！回復50HP' },
            25: { type: 'ultimate', value: 0.5, message: '🔥 連擊x25！究極傷害+50%' }
        };
        this.claimedRewards = new Set();
        this.critChanceBoost = 0; // 連擊獎勵提供的暴擊率加成
        this.damageBoost = 0; // 連擊獎勵提供的額外傷害加成
        
        // ⏱️ 時間凍結技能初始化
        this.timeFreezeSkill = new TimeFreezeSkill(this);
        
        // 🏆 成就追蹤
        this.correctBySubject = {};

        // 🧪 檢查雙倍經驗狀態
        this.expBoostActive = this.game.globals.expBoostActive || false;
        this.expBoostMultiplier = this.game.globals.expBoostMultiplier || 1;

        // 🔥 火焰元素燃燒狀態
        this.burnEffect = {
            active: false,
            duration: 0,
            damagePerTurn: 0
        };

        // ❄️ 冰霜元素冰凍狀態
        this.freezeEffect = {
            active: false,
            duration: 0,
            skipTurnChance: 0
        };

        // ⚡ 雷電元素麻痺狀態
        this.paralyzeEffect = {
            active: false,
            duration: 0,
            confused: false
        };

        // 🕷️ 毒液蜘蛛中毒狀態
        this.poisonEffect = {
            active: false,
            duration: 0,
            damagePerTurn: 0,
            stackCount: 0 // 中毒層數
        };
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 播放戰鬥背景音樂
        this.audio.playBattleBgm();
        
        // 創建戰鬥背景
        this.createBattleBackground();
        
        // 創建角色
        this.createCharacters();
        
        // 創建UI
        this.createBattleUI();
        
        // 創建連擊顯示
        this.createComboDisplay();
        
        // 🔥 創建燃燒狀態顯示（如果是火焰元素）
        if (this.enemyData.isFireElemental) {
            this.createBurnIndicator();
        }
        
        // ❄️ 創建冰凍狀態顯示（如果是冰霜元素）
        if (this.enemyData.isIceElemental) {
            this.createFreezeIndicator();
        }
        
        // ⚡ 創建麻痺狀態顯示（如果是雷電元素）
        if (this.enemyData.isLightningElemental) {
            this.createParalyzeIndicator();
        }

        // 🕷️ 創建中毒狀態顯示（如果是毒液蜘蛛或玩家中毒）
        if (this.enemyData.isVenomSpider) {
            this.createPoisonIndicator();
        }
        
        // 🧪 顯示雙倍經驗狀態
        if (this.expBoostActive) {
            this.showExpBoostIndicator();
        }
        
        // ⏱️ 創建時間凍結技能按鈗
        this.createTimeFreezeButton();
        
        // 開始戰鬥
        this.startBattle();
    }

    // 🔥 創建燃燒狀態指示器
    createBurnIndicator() {
        this.burnIndicator = this.add.container(600, 170);
        
        const burnBg = this.add.circle(0, 0, 25, 0xff4500, 0.8);
        this.burnIndicator.add(burnBg);
        
        const burnIcon = this.add.text(0, 0, '🔥', {
            fontSize: '24px'
        }).setOrigin(0.5);
        this.burnIndicator.add(burnIcon);
        
        // 預設隱藏
        this.burnIndicator.setVisible(false);
        this.burnIndicator.setScale(0);
        
        // 脈動動畫
        this.tweens.add({
            targets: burnBg,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.8, to: 0.4 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    // ❄️ 創建冰凍狀態指示器
    createFreezeIndicator() {
        this.freezeIndicator = this.add.container(200, 170);
        
        const freezeBg = this.add.circle(0, 0, 25, 0x00ffff, 0.8);
        this.freezeIndicator.add(freezeBg);
        
        const freezeIcon = this.add.text(0, 0, '❄️', {
            fontSize: '24px'
        }).setOrigin(0.5);
        this.freezeIndicator.add(freezeIcon);
        
        // 預設隱藏
        this.freezeIndicator.setVisible(false);
        this.freezeIndicator.setScale(0);
        
        // 閃爍動畫
        this.tweens.add({
            targets: freezeBg,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.8, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    // ⚡ 創建麻痺狀態指示器
    createParalyzeIndicator() {
        this.paralyzeIndicator = this.add.container(200, 210);
        
        const paralyzeBg = this.add.circle(0, 0, 25, 0x9400d3, 0.8);
        this.paralyzeIndicator.add(paralyzeBg);
        
        const paralyzeIcon = this.add.text(0, 0, '⚡', {
            fontSize: '24px'
        }).setOrigin(0.5);
        this.paralyzeIndicator.add(paralyzeIcon);
        
        // 預設隱藏
        this.paralyzeIndicator.setVisible(false);
        this.paralyzeIndicator.setScale(0);
        
        // 快速閃爍動畫
        this.tweens.add({
            targets: paralyzeBg,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.8, to: 0.3 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });
    }

    // 🕷️ 創建中毒狀態指示器
    createPoisonIndicator() {
        this.poisonIndicator = this.add.container(200, 250);
        
        const poisonBg = this.add.circle(0, 0, 25, 0x2ecc71, 0.8);
        this.poisonIndicator.add(poisonBg);
        
        const poisonIcon = this.add.text(0, 0, '☠️', {
            fontSize: '24px'
        }).setOrigin(0.5);
        this.poisonIndicator.add(poisonIcon);
        
        // 層數顯示
        this.poisonStackText = this.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.poisonIndicator.add(this.poisonStackText);
        
        // 預設隱藏
        this.poisonIndicator.setVisible(false);
        this.poisonIndicator.setScale(0);
        
        // 毒液脈動動畫
        this.tweens.add({
            targets: poisonBg,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.8, to: 0.4 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    // 🔥 顯示燃燒狀態
    showBurnIndicator() {
        if (!this.burnIndicator) return;
        
        this.burnIndicator.setVisible(true);
        this.tweens.add({
            targets: this.burnIndicator,
            scale: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }

    // 🔥 隱藏燃燒狀態
    hideBurnIndicator() {
        if (!this.burnIndicator) return;
        
        this.tweens.add({
            targets: this.burnIndicator,
            scale: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.burnIndicator.setVisible(false);
            }
        });
    }

    // ❄️ 顯示冰凍狀態
    showFreezeIndicator() {
        if (!this.freezeIndicator) return;
        
        this.freezeIndicator.setVisible(true);
        this.tweens.add({
            targets: this.freezeIndicator,
            scale: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }

    // ❄️ 隱藏冰凍狀態
    hideFreezeIndicator() {
        if (!this.freezeIndicator) return;
        
        this.tweens.add({
            targets: this.freezeIndicator,
            scale: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.freezeIndicator.setVisible(false);
            }
        });
    }

    // ⚡ 顯示麻痺狀態
    showParalyzeIndicator() {
        if (!this.paralyzeIndicator) return;
        
        this.paralyzeIndicator.setVisible(true);
        this.tweens.add({
            targets: this.paralyzeIndicator,
            scale: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }

    // ⚡ 隱藏麻痺狀態
    hideParalyzeIndicator() {
        if (!this.paralyzeIndicator) return;
        
        this.tweens.add({
            targets: this.paralyzeIndicator,
            scale: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.paralyzeIndicator.setVisible(false);
            }
        });
    }

    // 🕷️ 顯示中毒狀態
    showPoisonIndicator() {
        if (!this.poisonIndicator) return;
        
        this.poisonIndicator.setVisible(true);
        
        // 更新層數顯示
        if (this.poisonStackText) {
            this.poisonStackText.setText(this.poisonEffect.stackCount > 1 ? 
                `x${this.poisonEffect.stackCount}` : '');
        }
        
        this.tweens.add({
            targets: this.poisonIndicator,
            scale: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });
    }

    // 🕷️ 隱藏中毒狀態
    hidePoisonIndicator() {
        if (!this.poisonIndicator) return;
        
        this.tweens.add({
            targets: this.poisonIndicator,
            scale: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => {
                this.poisonIndicator.setVisible(false);
            }
        });
    }

    // 🕷️ 更新中毒層數顯示
    updatePoisonStackDisplay() {
        if (this.poisonStackText && this.poisonEffect.active) {
            this.poisonStackText.setText(this.poisonEffect.stackCount > 1 ? 
                `x${this.poisonEffect.stackCount}` : '');
        }
    }

    // 🧪 顯示雙倍經驗指示器
    showExpBoostIndicator() {
        const boostText = this.add.text(400, 50, `📈 ${this.expBoostMultiplier}倍經驗加成中!`, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 閃爍動畫
        this.tweens.add({
            targets: boostText,
            alpha: { from: 1, to: 0.5 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    createBattleBackground() {
        // 戰鬥背景
        const graphics = this.add.graphics();
        
        // 🔥 火焰元素戰鬥背景（火紅色調）
        if (this.enemyData.isFireElemental) {
            for (let y = 0; y < 600; y += 4) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 60, g: 20, b: 10 },
                    { r: 100, g: 30, b: 10 },
                    600, y
                );
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                graphics.fillRect(0, y, 800, 4);
            }
            
            // 火焰粒子效果
            this.createFireBackgroundEffect();
        }
        // ❄️ 冰霜元素戰鬥背景（冰藍色調）
        else if (this.enemyData.isIceElemental) {
            for (let y = 0; y < 600; y += 4) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 10, g: 30, b: 60 },
                    { r: 20, g: 50, b: 80 },
                    600, y
                );
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                graphics.fillRect(0, y, 800, 4);
            }
            
            // 冰霜粒子效果
            this.createIceBackgroundEffect();
        }
        // ⚡ 雷電元素戰鬥背景（紫藍色調）
        else if (this.enemyData.isLightningElemental) {
            for (let y = 0; y < 600; y += 4) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 30, g: 10, b: 60 },
                    { r: 50, g: 20, b: 90 },
                    600, y
                );
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                graphics.fillRect(0, y, 800, 4);
            }
            
            // 雷電粒子效果
            this.createLightningBackgroundEffect();
        }
        // 🕷️ 毒液蜘蛛戰鬥背景（暗綠色調）
        else if (this.enemyData.isVenomSpider) {
            for (let y = 0; y < 600; y += 4) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 10, g: 40, b: 10 },
                    { r: 20, g: 60, b: 20 },
                    600, y
                );
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                graphics.fillRect(0, y, 800, 4);
            }
            
            // 毒液粒子效果
            this.createVenomBackgroundEffect();
        } else {
            // 漸層背景
            for (let y = 0; y < 600; y += 4) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 44, g: 62, b: 80 },
                    { r: 52, g: 73, b: 94 },
                    600, y
                );
                graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                graphics.fillRect(0, y, 800, 4);
            }
        }
        
        // 戰鬥場地
        graphics.fillStyle(0x2c3e50, 0.5);
        graphics.fillEllipse(200, 350, 200, 80);
        graphics.fillEllipse(600, 350, 200, 80);
    }

    // 🔥 創建火焰背景效果
    createFireBackgroundEffect() {
        // 火焰粒子
        for (let i = 0; i < 20; i++) {
            const fire = this.add.text(
                Phaser.Math.Between(500, 700),
                Phaser.Math.Between(300, 500),
                '🔥',
                { fontSize: '20px' }
            ).setAlpha(0.3);
            
            this.tweens.add({
                targets: fire,
                y: fire.y - 50,
                alpha: { from: 0.3, to: 0 },
                scale: { from: 1, to: 0.5 },
                duration: 2000 + Math.random() * 1000,
                repeat: -1,
                delay: Math.random() * 2000
            });
        }
    }

    // ❄️ 創建冰霜背景效果
    createIceBackgroundEffect() {
        // 雪花粒子
        for (let i = 0; i < 30; i++) {
            const snow = this.add.text(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                ['❄️', '✦', '✧'][Math.floor(Math.random() * 3)],
                { fontSize: 12 + Math.random() * 12 + 'px' }
            ).setAlpha(0.4);
            
            this.tweens.add({
                targets: snow,
                y: snow.y + 100,
                x: snow.x + Phaser.Math.Between(-30, 30),
                alpha: { from: 0.4, to: 0 },
                rotation: Math.random() * Math.PI * 2,
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                delay: Math.random() * 3000
            });
        }
        
        // 冰霜覆蓋效果
        const iceOverlay = this.add.rectangle(400, 300, 800, 600, 0x00ffff, 0.05);
        
        // 脈動透明效果
        this.tweens.add({
            targets: iceOverlay,
            alpha: { from: 0.05, to: 0.1 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }

    // ⚡ 創建雷電背景效果
    createLightningBackgroundEffect() {
        // 閃電粒子
        for (let i = 0; i < 25; i++) {
            const lightning = this.add.text(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                ['⚡', '✦', '⋆'][Math.floor(Math.random() * 3)],
                { fontSize: 16 + Math.random() * 20 + 'px' }
            ).setAlpha(0.5);
            
            this.tweens.add({
                targets: lightning,
                x: lightning.x + Phaser.Math.Between(-50, 50),
                y: lightning.y + Phaser.Math.Between(-50, 50),
                alpha: { from: 0.5, to: 0 },
                scale: { from: 1, to: 0.3 },
                rotation: Math.random() * Math.PI * 2,
                duration: 500 + Math.random() * 500,
                repeat: -1,
                delay: Math.random() * 1000
            });
        }
        
        // 閃電閃光效果
        const flashOverlay = this.add.rectangle(400, 300, 800, 600, 0xffff00, 0);
        
        // 隨機閃光
        const randomFlash = () => {
            this.tweens.add({
                targets: flashOverlay,
                alpha: { from: 0, to: 0.15 },
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    this.time.delayedCall(Phaser.Math.Between(2000, 4000), randomFlash);
                }
            });
        };
        
        this.time.delayedCall(2000, randomFlash);
    }

    // 🕷️ 創建毒液背景效果
    createVenomBackgroundEffect() {
        // 毒液泡泡粒子
        for (let i = 0; i < 20; i++) {
            const venom = this.add.text(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(400, 600),
                ['☠️', '💀', '🧪'][Math.floor(Math.random() * 3)],
                { fontSize: 14 + Math.random() * 16 + 'px' }
            ).setAlpha(0.3);
            
            this.tweens.add({
                targets: venom,
                y: venom.y - Phaser.Math.Between(50, 150),
                x: venom.x + Phaser.Math.Between(-30, 30),
                alpha: { from: 0.3, to: 0 },
                scale: { from: 1, to: 1.5 },
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                delay: Math.random() * 3000
            });
        }
        
        // 毒液滴落效果
        const createVenomDrop = () => {
            const drop = this.add.circle(
                Phaser.Math.Between(50, 750),
                0,
                Phaser.Math.Between(3, 8),
                0x2ecc71,
                0.6
            );
            
            this.tweens.add({
                targets: drop,
                y: 600,
                alpha: { from: 0.6, to: 0 },
                duration: 2000 + Math.random() * 1000,
                onComplete: () => drop.destroy()
            });
            
            this.time.delayedCall(500 + Math.random() * 1000, createVenomDrop);
        };
        
        this.time.delayedCall(500, createVenomDrop);
        
        // 毒霧覆蓋效果
        const venomOverlay = this.add.rectangle(400, 300, 800, 600, 0x2ecc71, 0.03);
        
        // 脈動透明效果
        this.tweens.add({
            targets: venomOverlay,
            alpha: { from: 0.03, to: 0.08 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
    }
    
    createCharacters() {
        const width = this.cameras.main.width;
        
        // 玩家（左側）
        this.playerSprite = this.add.sprite(200, 300, 'player');
        this.playerSprite.setScale(2);
        this.playerSprite.setFlipX(true);
        
        // 應用玩家顏色（根據等級）
        const playerColor = this.game.globals.playerColor || 0xffffff;
        this.playerSprite.setTint(playerColor);
        
        // 玩家血條背景
        this.playerHpBg = this.add.rectangle(200, 240, 120, 16, 0x000000);
        this.playerHpBar = this.add.rectangle(140, 240, 120, 16, 0xe74c3c);
        this.playerHpBar.setOrigin(0, 0.5);
        
        // 玩家名稱
        this.add.text(200, 220, '勇者', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // 玩家MP顯示
        this.playerMpBg = this.add.rectangle(200, 260, 100, 8, 0x000000);
        this.playerMpBar = this.add.rectangle(150, 260, 100, 8, 0x3498db);
        this.playerMpBar.setOrigin(0, 0.5);
        
        // 敵人（右側）
        const enemyTexture = this.enemyData.type || 'enemy-slime';
        this.enemySprite = this.add.sprite(600, 300, enemyTexture);
        this.enemySprite.setScale(2.5);
        
        // 🗡️ 暗影刺客特殊外觀
        if (this.enemyData.isAssassin) {
            this.enemySprite.setTint(0x4a0080); // 紫色調
        }
        
        // 🔥 火焰元素特殊外觀和效果
        if (this.enemyData.isFireElemental) {
            this.enemySprite.setTint(0xff4500); // 橙紅色調
            this.createFireElementalEffect();
        }
        
        // ❄️ 冰霜元素特殊外觀和效果
        if (this.enemyData.isIceElemental) {
            this.enemySprite.setTint(0x00ffff); // 青色調
            this.createIceElementalEffect();
        }
        
        // ⚡ 雷電元素特殊外觀和效果
        if (this.enemyData.isLightningElemental) {
            this.enemySprite.setTint(0x9400d3); // 紫藍色調
            this.createLightningElementalEffect();
        }

        // 🕷️ 毒液蜘蛛特殊外觀和效果
        if (this.enemyData.isVenomSpider) {
            this.enemySprite.setTint(0x2ecc71); // 綠色調
            this.createVenomSpiderEffect();
        }
        
        // 敵人血條
        this.enemyHpBg = this.add.rectangle(600, 220, 120, 16, 0x000000);
        this.enemyHpBar = this.add.rectangle(540, 220, 120, 16, 0xe74c3c);
        this.enemyHpBar.setOrigin(0, 0.5);
        
        // 敵人名稱
        this.add.text(600, 200, this.enemyData.name, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff6b6b'
        }).setOrigin(0.5);
        
        // 🗡️ 暗影刺客標記
        if (this.enemyData.isAssassin) {
            this.add.text(600, 180, '⚡ 閃避者', {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#9b59b6'
            }).setOrigin(0.5);
        }
        
        // 🔥 火焰元素標記
        if (this.enemyData.isFireElemental) {
            this.add.text(600, 180, '🔥 燃燒者', {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ff4500'
            }).setOrigin(0.5);
        }
        
        // ❄️ 冰霜元素標記
        if (this.enemyData.isIceElemental) {
            this.add.text(600, 180, '❄️ 冰凍者', {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#00ffff'
            }).setOrigin(0.5);
        }
        
        // ⚡ 雷電元素標記
        if (this.enemyData.isLightningElemental) {
            this.add.text(600, 180, '⚡ 麻痺者', {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#9400d3'
            }).setOrigin(0.5);
        }

        // 🕷️ 毒液蜘蛛標記
        if (this.enemyData.isVenomSpider) {
            this.add.text(600, 180, '☠️ 劇毒者', {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#2ecc71'
            }).setOrigin(0.5);
        }
        
        // 進場動畫
        this.tweens.add({
            targets: this.playerSprite,
            x: { from: -50, to: 200 },
            duration: 500,
            ease: 'Back.out'
        });
        
        this.tweens.add({
            targets: this.enemySprite,
            x: { from: 850, to: 600 },
            duration: 500,
            ease: 'Back.out'
        });
    }

    // 🔥 創建火焰元素環繞效果
    createFireElementalEffect() {
        // 周圍環繞的小火焰
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const distance = 35;
            
            const fireParticle = this.add.text(
                600 + Math.cos(angle) * distance,
                300 + Math.sin(angle) * distance,
                '🔥',
                { fontSize: '16px' }
            ).setOrigin(0.5);
            
            // 環繞動畫
            this.tweens.add({
                targets: fireParticle,
                x: {
                    getEnd: () => 600 + Math.cos(angle + Math.PI * 2) * distance
                },
                y: {
                    getEnd: () => 300 + Math.sin(angle + Math.PI * 2) * distance
                },
                duration: 3000,
                repeat: -1,
                ease: 'Linear',
                onUpdate: (tween, target) => {
                    const progress = tween.progress;
                    const currentAngle = angle + progress * Math.PI * 2;
                    target.x = 600 + Math.cos(currentAngle) * distance;
                    target.y = 300 + Math.sin(currentAngle) * distance;
                }
            });
        }
        
        // 火焰脈動效果
        this.tweens.add({
            targets: this.enemySprite,
            scale: { from: 2.5, to: 2.7 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ❄️ 創建冰霜元素環繞效果
    createIceElementalEffect() {
        // 周圍環繞的冰晶
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 40;
            
            const iceParticle = this.add.text(
                600 + Math.cos(angle) * distance,
                300 + Math.sin(angle) * distance,
                ['❄️', '✦', '✧'][i % 3],
                { fontSize: '14px' }
            ).setOrigin(0.5);
            
            // 環繞動畫（反向旋轉）
            this.tweens.add({
                targets: iceParticle,
                x: {
                    getEnd: () => 600 + Math.cos(angle - Math.PI * 2) * distance
                },
                y: {
                    getEnd: () => 300 + Math.sin(angle - Math.PI * 2) * distance
                },
                duration: 4000,
                repeat: -1,
                ease: 'Linear',
                onUpdate: (tween, target) => {
                    const progress = tween.progress;
                    const currentAngle = angle - progress * Math.PI * 2;
                    target.x = 600 + Math.cos(currentAngle) * distance;
                    target.y = 300 + Math.sin(currentAngle) * distance;
                }
            });
        }
        
        // 冰霜閃爍效果
        this.tweens.add({
            targets: this.enemySprite,
            alpha: { from: 0.8, to: 1 },
            scale: { from: 2.5, to: 2.6 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 冰霜光環
        const iceAura = this.add.circle(600, 300, 50, 0x00ffff, 0.2);
        this.tweens.add({
            targets: iceAura,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.2, to: 0.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ⚡ 創建雷電元素環繞效果
    createLightningElementalEffect() {
        // 周圍環繞的閃電
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 45;
            
            const lightningParticle = this.add.text(
                600 + Math.cos(angle) * distance,
                300 + Math.sin(angle) * distance,
                ['⚡', '✦', '⋆'][i % 3],
                { fontSize: '18px' }
            ).setOrigin(0.5);
            
            // 環繞動畫（快速旋轉）
            this.tweens.add({
                targets: lightningParticle,
                duration: 1500,
                repeat: -1,
                ease: 'Linear',
                onUpdate: (tween, target) => {
                    const progress = tween.progress;
                    const currentAngle = angle + progress * Math.PI * 4;
                    target.x = 600 + Math.cos(currentAngle) * distance;
                    target.y = 300 + Math.sin(currentAngle) * distance;
                }
            });
        }
        
        // 雷電快速閃爍效果
        this.tweens.add({
            targets: this.enemySprite,
            alpha: { from: 0.6, to: 1 },
            scale: { from: 2.4, to: 2.6 },
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 雷電光環（快速脈動）
        const lightningAura = this.add.circle(600, 300, 55, 0x9400d3, 0.3);
        this.tweens.add({
            targets: lightningAura,
            scale: { from: 0.8, to: 1.4 },
            alpha: { from: 0.3, to: 0.05 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // 🕷️ 創建毒液蜘蛛環繞效果
    createVenomSpiderEffect() {
        // 周圍環繞的毒液泡泡
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 40;
            
            const venomParticle = this.add.text(
                600 + Math.cos(angle) * distance,
                300 + Math.sin(angle) * distance,
                ['☠️', '💀', '🧪'][i % 3],
                { fontSize: '14px' }
            ).setOrigin(0.5);
            
            // 不規則環繞動畫
            this.tweens.add({
                targets: venomParticle,
                x: {
                    getEnd: () => 600 + Math.cos(angle + Math.PI * 2) * distance
                },
                y: {
                    getEnd: () => 300 + Math.sin(angle + Math.PI * 2) * distance
                },
                duration: 2500 + Math.random() * 1000,
                repeat: -1,
                ease: 'Sine.easeInOut',
                onUpdate: (tween, target) => {
                    const progress = tween.progress;
                    const wobble = Math.sin(progress * Math.PI * 4) * 5;
                    const currentAngle = angle + progress * Math.PI * 2;
                    target.x = 600 + Math.cos(currentAngle) * distance + wobble;
                    target.y = 300 + Math.sin(currentAngle) * distance;
                }
            });
        }
        
        // 毒液脈動效果
        this.tweens.add({
            targets: this.enemySprite,
            alpha: { from: 0.85, to: 1 },
            scale: { from: 2.5, to: 2.7 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 毒液光環（脈動）
        const venomAura = this.add.circle(600, 300, 55, 0x2ecc71, 0.25);
        this.tweens.add({
            targets: venomAura,
            scale: { from: 0.9, to: 1.3 },
            alpha: { from: 0.25, to: 0.05 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 毒液滴落效果
        const createVenomDrop = () => {
            if (!this.enemySprite || !this.enemySprite.active) return;
            
            const drop = this.add.circle(
                this.enemySprite.x + Phaser.Math.Between(-20, 20),
                this.enemySprite.y + 20,
                Phaser.Math.Between(4, 8),
                0x2ecc71,
                0.7
            );
            
            this.tweens.add({
                targets: drop,
                y: this.enemySprite.y + 80,
                alpha: { from: 0.7, to: 0 },
                scale: { from: 1, to: 0.5 },
                duration: 800,
                onComplete: () => drop.destroy()
            });
            
            this.time.delayedCall(600 + Math.random() * 800, createVenomDrop);
        };
        
        this.time.delayedCall(500, createVenomDrop);
    }
    
    createBattleUI() {
        const width = this.cameras.main.width;
        
        // 底部UI面板
        this.uiPanel = this.add.container(0, 450);
        
        const panelBg = this.add.rectangle(400, 75, 800, 150, 0x000000, 0.8);
        this.uiPanel.add(panelBg);
        
        // 行動按鈗容器
        this.actionButtons = this.add.container(0, 0);
        this.uiPanel.add(this.actionButtons);
        
        // 攻擊按鈗（數學題目）- 注意：坐標相對於 uiPanel (y=450)
        this.createActionButton(100, 30, '🔢 數學攻擊', 0x3498db, function() {
            this.startQuiz('math');
        });
        
        // 技能按鈗（科學題目）
        this.createActionButton(300, 30, '⚗️ 科學魔法', 0x2ecc71, function() {
            this.startQuiz('science');
        });
        
        // 治療按鈗（英文題目）
        this.createActionButton(500, 30, '📖 英文治療', 0xf39c12, function() {
            this.startQuiz('english');
        });
        
        // 防禦按鈗（常識題目）
        this.createActionButton(700, 30, '🛡️ 常識防禦', 0x9b59b6, function() {
            this.startQuiz('general');
        });
        
        // 逃跑按鈗（移到第二行中間）
        this.createActionButton(400, 100, '🏃 逃跑', 0xe74c3c, function() {
            this.tryEscape();
        });
        
        // 戰鬥訊息區域 (相對於 uiPanel)
        this.battleMessage = this.add.text(400, -30, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.uiPanel.add(this.battleMessage);
        
        // 隱藏按鈗函數
        this.hideActionButtons = () => {
            this.actionButtons.setVisible(false);
        };
        
        this.showActionButtons = () => {
            this.actionButtons.setVisible(true);
        };
    }
    
    // ⏱️ 創建時間凍結技能按鈗
    createTimeFreezeButton() {
        // 在右上角創建技能按鈗
        this.timeFreezeBtn = this.add.container(720, 80);
        this.timeFreezeBtn.setDepth(50);
        
        const btnBg = this.add.rectangle(0, 0, 100, 40, 0x00ffff);
        btnBg.setInteractive({ useHandCursor: true });
        this.timeFreezeBtnBg = btnBg;
        
        const btnText = this.add.text(0, 0, '⏱️ 時間凍結', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#000000'
        }).setOrigin(0.5);
        this.timeFreezeBtnText = btnText;
        
        // MP消耗提示
        const mpText = this.add.text(0, 28, '15 MP', {
            fontSize: '10px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#3498db'
        }).setOrigin(0.5);
        
        this.timeFreezeBtn.add([btnBg, btnText, mpText]);
        
        // 互動效果
        btnBg.on('pointerover', () => {
            if (this.timeFreezeSkill.canUse(this.playerData.mp)) {
                btnBg.setScale(1.05);
            }
        });
        
        btnBg.on('pointerout', () => {
            btnBg.setScale(1);
        });
        
        btnBg.on('pointerdown', () => {
            if (!this.battleEnded && this.turn === 'player') {
                this.useTimeFreezeSkill();
            }
        });
        
        // 初始更新按鈗狀態
        this.updateTimeFreezeButton();
    }
    
    // ⏱️ 更新時間凍結按鈗狀態
    updateTimeFreezeButton() {
        if (!this.timeFreezeBtnText || !this.timeFreezeBtnBg) return;
        
        this.timeFreezeBtnText.setText(this.timeFreezeSkill.getButtonText());
        this.timeFreezeBtnBg.setFillStyle(this.timeFreezeSkill.getButtonColor());
        
        // 根據可用性調整透明度
        const canUse = this.timeFreezeSkill.canUse(this.playerData.mp);
        this.timeFreezeBtn.setAlpha(canUse ? 1 : 0.6);
    }
    
    // ⏱️ 使用時間凍結技能
    useTimeFreezeSkill() {
        if (!this.timeFreezeSkill.canUse(this.playerData.mp)) {
            this.showMessage('❌ MP不足或技能冷卻中！');
            return;
        }
        
        // 隱藏行動按鈗
        this.hideActionButtons();
        
        // 使用技能
        const success = this.timeFreezeSkill.use();
        
        if (success) {
            // 更新MP顯示
            this.updatePlayerMpBar();
            
            // 更新按鈗狀態
            this.updateTimeFreezeButton();
            
            this.showMessage('⏱️ 時間凍結！敵人被凍結一回合！');
            
            // 延遲後進入玩家回合（跳過敵人回合）
            this.time.delayedCall(2500, () => {
                this.playerTurn();
            });
        }
    }
    
    // 更新玩家MP條
    updatePlayerMpBar() {
        const mpPercent = this.playerData.mp / this.playerData.maxMp;
        this.playerMpBar.setScale(mpPercent, 1);
    }
    
    // 🔥 創建連擊顯示
    createComboDisplay() {
        // 連擊數顯示容器
        this.comboContainer = this.add.container(400, 100);
        
        // 連擊背景光環
        this.comboBg = this.add.circle(0, 0, 45, 0xff6600, 0.3);
        this.comboContainer.add(this.comboBg);
        
        // 連擊數文字
        this.comboText = this.add.text(0, -5, '0', {
            fontSize: '36px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            stroke: '#ff6600',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboText);
        
        // 連擊標籤
        this.comboLabel = this.add.text(0, 20, 'COMBO', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff6600'
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboLabel);
        
        // 傷害加成顯示
        this.comboBonusText = this.add.text(0, 38, '+0%', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffff00'
        }).setOrigin(0.5);
        this.comboContainer.add(this.comboBonusText);
        
        // 🎯 連擊獎勵提示區域
        this.comboRewardText = this.add.text(400, 150, '', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 初始隱藏
        this.comboContainer.setVisible(false);
        this.comboContainer.setScale(0);
    }
    
    createActionButton(x, y, text, color, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 160, 45, color);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, text, {
            fontSize: '13px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        button.add([bg, label]);
        this.actionButtons.add(button);
        
        // 互動效果
        bg.on('pointerover', () => {
            bg.setScale(1.05);
            bg.setFillStyle(Phaser.Display.Color.GetColor(
                Math.min(255, ((color >> 16) & 0xFF) + 30),
                Math.min(255, ((color >> 8) & 0xFF) + 30),
                Math.min(255, (color & 0xFF) + 30)
            ));
            this.audio.playHover();
        });
        
        bg.on('pointerout', () => {
            bg.setScale(1);
            bg.setFillStyle(color);
        });
        
        bg.on('pointerdown', () => {
            bg.setScale(0.95);
        });
        
        bg.on('pointerup', () => {
            bg.setScale(1.05);
            if (!this.battleEnded && this.turn === 'player') {
                this.audio.playClick();
                // 使用 call 確保 callback 中嘅 this 指向正確
                callback.call(this);
            }
        });
    }
    
    startBattle() {
        this.showMessage('⚔️ 戰鬥開始！遭遇了 ' + this.enemyData.name + '！');
        
        this.time.delayedCall(1500, () => {
            this.playerTurn();
        });
    }
    
    playerTurn() {
        if (this.battleEnded) return;
        
        this.turn = 'player';
        
        // ⏱️ 更新時間凍結技能冷卻
        this.timeFreezeSkill.updateCooldown();
        this.updateTimeFreezeButton();
        
        // 🔥 檢查燃燒狀態
        if (this.burnEffect.active && this.burnEffect.duration > 0) {
            if (this.applyBurnDamage()) return; // 如果玩家死亡則返回
        }
        
        // ❄️ 檢查冰凍狀態 - 有機率跳過回合
        if (this.freezeEffect.active && this.freezeEffect.duration > 0) {
            if (this.applyFreezeEffect()) return; // 如果被凍結則跳過回合
        }
        
        // ⚡ 檢查麻痺狀態
        if (this.paralyzeEffect.active && this.paralyzeEffect.duration > 0) {
            this.showMessage('⚡ 麻痺效果影響...你的思緒混亂！');
            this.paralyzeEffect.duration--;
            if (this.paralyzeEffect.duration <= 0) {
                this.paralyzeEffect.active = false;
                this.hideParalyzeIndicator();
                this.time.delayedCall(1500, () => {
                    this.showMessage('⚡ 麻痺效果消退了！');
                });
            }
        }

        // 🕷️ 檢查中毒狀態
        if (this.poisonEffect.active && this.poisonEffect.duration > 0) {
            if (this.applyPoisonDamage()) return; // 如果玩家死亡則返回
        }
        
        this.showMessage('🎯 你的回合！選擇行動...');
        this.showActionButtons();
    }

    // 🔥 應用燃燒傷害
    applyBurnDamage() {
        const burnDamage = this.burnEffect.damagePerTurn;
        this.playerData.hp = Math.max(0, this.playerData.hp - burnDamage);
        this.updatePlayerHpBar();
        
        // 燃燒特效
        this.createBurnDamageEffect();
        
        this.showMessage(`🔥 燃燒效果造成 ${burnDamage} 點傷害！`);
        
        // 減少持續時間
        this.burnEffect.duration--;
        
        if (this.burnEffect.duration <= 0) {
            this.burnEffect.active = false;
            this.hideBurnIndicator();
            this.time.delayedCall(1500, () => {
                this.showMessage('🔥 燃燒效果消退了！');
            });
        }
        
        // 檢查玩家死亡
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(2000, () => {
                this.endBattle(false);
            });
            return true; // 表示戰鬥結束
        }
        
        return false;
    }

    // ❄️ 應用冰凍效果
    applyFreezeEffect() {
        const freezeRoll = Math.random();
        
        if (freezeRoll < this.freezeEffect.skipTurnChance) {
            // 被凍結，跳過回合
            this.createFrozenSkipEffect();
            this.showMessage('❄️ 冰凍效果發作！你無法行動！');
            
            // 減少持續時間
            this.freezeEffect.duration--;
            
            if (this.freezeEffect.duration <= 0) {
                this.freezeEffect.active = false;
                this.hideFreezeIndicator();
                this.time.delayedCall(2000, () => {
                    this.showMessage('❄️ 冰凍效果消退了！');
                });
            }
            
            // 跳過回合，直接到敵人回合
            this.time.delayedCall(2500, () => {
                this.enemyTurn();
            });
            return true; // 表示跳過回合
        } else {
            // 冰凍效果存在但沒有發作
            this.showMessage('❄️ 冰凍效果減弱...你勉強可以行動！');
        }
        
        // 減少持續時間
        this.freezeEffect.duration--;
        
        if (this.freezeEffect.duration <= 0) {
            this.freezeEffect.active = false;
            this.hideFreezeIndicator();
            this.time.delayedCall(1500, () => {
                this.showMessage('❄️ 冰凍效果消退了！');
            });
        }
        
        return false;
    }

    // 🕷️ 應用中毒傷害
    applyPoisonDamage() {
        const poisonDamage = this.poisonEffect.damagePerTurn * this.poisonEffect.stackCount;
        this.playerData.hp = Math.max(0, this.playerData.hp - poisonDamage);
        this.updatePlayerHpBar();
        
        // 中毒特效
        this.createPoisonDamageEffect();
        
        this.showMessage(`☠️ 中毒效果造成 ${poisonDamage} 點傷害！(層數: ${this.poisonEffect.stackCount})`);
        
        // 減少持續時間
        this.poisonEffect.duration--;
        
        if (this.poisonEffect.duration <= 0) {
            this.poisonEffect.active = false;
            this.poisonEffect.stackCount = 0;
            this.hidePoisonIndicator();
            this.time.delayedCall(1500, () => {
                this.showMessage('☠️ 中毒效果消退了！');
            });
        }
        
        // 檢查玩家死亡
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(2000, () => {
                this.endBattle(false);
            });
            return true; // 表示戰鬥結束
        }
        
        return false;
    }

    // 🕷️ 創建中毒傷害特效
    createPoisonDamageEffect() {
        // 毒液圍繞玩家
        for (let i = 0; i < 6; i++) {
            const venom = this.add.text(
                this.playerSprite.x + Phaser.Math.Between(-30, 30),
                this.playerSprite.y + Phaser.Math.Between(-30, 30),
                ['☠️', '💀', '🧪'][i % 3],
                { fontSize: '20px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: venom,
                y: venom.y - 30,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => venom.destroy()
            });
        }
        
        // 玩家閃綠
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0x2ecc71,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.playerSprite.clearTint();
                // 重新應用玩家顏色
                const playerColor = this.game.globals.playerColor || 0xffffff;
                this.playerSprite.setTint(playerColor);
            }
        });
    }

    // ❄️ 創建冰凍跳過回合特效
    createFrozenSkipEffect() {
        // 冰晶覆蓋玩家
        for (let i = 0; i < 8; i++) {
            const ice = this.add.text(
                this.playerSprite.x + Phaser.Math.Between(-40, 40),
                this.playerSprite.y + Phaser.Math.Between(-40, 40),
                '❄️',
                { fontSize: '24px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: ice,
                scale: { from: 0, to: 1.5 },
                alpha: { from: 1, to: 0 },
                duration: 1000,
                delay: i * 100,
                ease: 'Power2',
                onComplete: () => ice.destroy()
            });
        }
        
        // 玩家變藍
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0x00ffff,
            duration: 200,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.playerSprite.clearTint();
                const playerColor = this.game.globals.playerColor || 0xffffff;
                this.playerSprite.setTint(playerColor);
            }
        });
        
        // 「凍結！」文字
        const frozenText = this.add.text(this.playerSprite.x, this.playerSprite.y - 80, '凍結！', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#00ffff',
            stroke: '#000080',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: frozenText,
            y: this.playerSprite.y - 120,
            alpha: 0,
            scale: { from: 1, to: 1.5 },
            duration: 1200,
            ease: 'Power2',
            onComplete: () => frozenText.destroy()
        });
    }

    // 🔥 創建燃燒傷害特效
    createBurnDamageEffect() {
        // 火焰圍繞玩家
        for (let i = 0; i < 6; i++) {
            const flame = this.add.text(
                this.playerSprite.x + Phaser.Math.Between(-30, 30),
                this.playerSprite.y + Phaser.Math.Between(-30, 30),
                '🔥',
                { fontSize: '20px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: flame,
                y: flame.y - 30,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => flame.destroy()
            });
        }
        
        // 玩家閃紅
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.playerSprite.clearTint();
                // 重新應用玩家顏色
                const playerColor = this.game.globals.playerColor || 0xffffff;
                this.playerSprite.setTint(playerColor);
            }
        });
    }
    
    startQuiz(subject) {
        // 防止重複啟動
        if (this.quizActive) return;
        this.quizActive = true;
        
        this.hideActionButtons();
        
        const self = this; // 保存 this 引用
        
        // 傳遞到QuizScene
        this.scene.launch('QuizScene', {
            subject: subject,
            onComplete: function(result) {
                self.quizActive = false;
                self.handleQuizResult(result);
            }
        });
    }
    
    // 🔥 更新連擊顯示
    updateComboDisplay() {
        if (this.comboCount <= 0) {
            // 隱藏連擊顯示
            this.tweens.add({
                targets: this.comboContainer,
                scale: 0,
                duration: 300,
                ease: 'Back.in',
                onComplete: () => {
                    this.comboContainer.setVisible(false);
                }
            });
            return;
        }
        
        // 顯示連擊容器
        this.comboContainer.setVisible(true);
        
        // 計算傷害加成
        const bonusPercent = Math.floor(this.comboCount * this.comboMultiplier * 100);
        
        // 更新文字
        this.comboText.setText(this.comboCount.toString());
        this.comboBonusText.setText(`+${bonusPercent}%`);
        
        // 根據連擊數改變顏色
        let color = '#ffffff';
        let strokeColor = '#ff6600';
        if (this.comboCount >= 10) {
            color = '#ff0000';
            strokeColor = '#ffff00';
        } else if (this.comboCount >= 5) {
            color = '#ff6600';
            strokeColor = '#ff0000';
        } else if (this.comboCount >= 3) {
            color = '#ffff00';
            strokeColor = '#ff6600';
        }
        
        this.comboText.setStyle({
            fontSize: '36px',
            fontFamily: 'Microsoft JhengHei',
            fill: color,
            stroke: strokeColor,
            strokeThickness: 4
        });
        
        // 彈出動畫
        this.tweens.add({
            targets: this.comboContainer,
            scale: { from: 0.5, to: 1.2 },
            duration: 200,
            yoyo: true,
            ease: 'Back.out'
        });
        
        // 背景脈動效果
        this.tweens.add({
            targets: this.comboBg,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.3, to: 0.6 },
            duration: 400,
            yoyo: true
        });
    }
    
    // 🔥 增加連擊
    addCombo() {
        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }
        this.updateComboDisplay();
        
        // 🎯 檢查並應用連擊獎勵（v1.12.0 新增）
        this.checkComboReward();
        
        // 連擊音效（高連擊時播放特殊音效）
        if (this.comboCount === 5 || this.comboCount === 10) {
            // 里程碑連擊特效
            this.createComboMilestoneEffect();
        }
    }
    
    // 🎯 檢查連擊獎勵（v1.12.0 新增）
    checkComboReward() {
        const milestones = [5, 10, 15, 20, 25];
        
        for (const milestone of milestones) {
            if (this.comboCount === milestone && !this.claimedRewards.has(milestone)) {
                this.claimedRewards.add(milestone);
                this.applyComboReward(milestone);
                break;
            }
        }
    }
    
    // 🎯 應用連擊獎勵（v1.12.0 新增）
    applyComboReward(milestone) {
        const reward = this.comboRewards[milestone];
        if (!reward) return;
        
        switch (reward.type) {
            case 'critBoost':
                this.critChanceBoost = reward.value;
                break;
            case 'heal':
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + reward.value);
                this.updatePlayerHpBar();
                this.createHealEffect(this.playerSprite.x, this.playerSprite.y);
                break;
            case 'damageBoost':
                this.damageBoost = reward.value;
                break;
            case 'fullHeal':
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + reward.value);
                this.updatePlayerHpBar();
                this.createHealEffect(this.playerSprite.x, this.playerSprite.y);
                break;
            case 'ultimate':
                this.damageBoost = reward.value;
                break;
        }
        
        // 顯示獎勵提示
        this.showComboRewardMessage(reward.message);
        
        // 創建獎勵特效
        this.createComboRewardEffect(milestone);
        
        // 🏆 成就：達到連擊里程碑
        AchievementSystem.checkAchievement(this.game, 'combo_milestone', { milestone: milestone });
    }
    
    // 🎯 顯示連擊獎勵訊息（v1.12.0 新增）
    showComboRewardMessage(message) {
        this.comboRewardText.setText(message);
        this.comboRewardText.setAlpha(1);
        this.comboRewardText.setScale(0.8);
        
        this.tweens.add({
            targets: this.comboRewardText,
            scale: { from: 0.8, to: 1.1 },
            duration: 300,
            ease: 'Back.out'
        });
        
        this.tweens.add({
            targets: this.comboRewardText,
            alpha: 0,
            delay: 2000,
            duration: 500,
            onComplete: () => {
                this.comboRewardText.setText('');
            }
        });
    }
    
    // 🎯 創建連擊獎勵特效（v1.12.0 新增）
    createComboRewardEffect(milestone) {
        const colors = {
            5: 0x3498db,
            10: 0x2ecc71,
            15: 0xe74c3c,
            20: 0xf1c40f,
            25: 0x9b59b6
        };
        
        const color = colors[milestone] || 0xffffff;
        
        // 光環擴散效果
        const ring = this.add.circle(400, 100, 50, color, 0.5);
        this.tweens.add({
            targets: ring,
            radius: 200,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        
        // 粒子爆發
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 80 + Math.random() * 50;
            
            const particle = this.add.circle(
                400 + Math.cos(angle) * 30,
                100 + Math.sin(angle) * 10,
                6,
                color,
                0.8
            );
            
            this.tweens.add({
                targets: particle,
                x: 400 + Math.cos(angle) * distance,
                y: 100 + Math.sin(angle) * distance * 0.5,
                alpha: 0,
                scale: { from: 1, to: 0 },
                duration: 600 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    // 🔥 重置連擊
    resetCombo() {
        if (this.comboCount > 0) {
            this.comboCount = 0;
            this.claimedRewards.clear();
            this.critChanceBoost = 0;
            this.damageBoost = 0;
            this.updateComboDisplay();
        }
    }
    
    // 🔥 連擊里程碑特效
    createComboMilestoneEffect() {
        const milestoneText = this.add.text(400, 200, `${this.comboCount} COMBO!`, {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffff00',
            stroke: '#ff0000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: milestoneText,
            y: 150,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1500,
            ease: 'Power2',
            onComplete: () => milestoneText.destroy()
        });
        
        // 煙花效果
        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(400, 250, 8, [0xff0000, 0xffff00, 0xff6600][i % 3]);
            
            const angle = (i / 12) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            
            this.tweens.add({
                targets: particle,
                x: 400 + Math.cos(angle) * distance,
                y: 250 + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    handleQuizResult(result) {
        // 關閉QuizScene
        this.scene.stop('QuizScene');
        
        if (result.correct) {
            // 🔥 答對了 - 增加連擊
            this.addCombo();
            
            // 🏆 成就：答對科目題目
            if (result.subject) {
                AchievementSystem.checkAchievement(this.game, 'correct_answer', { subject: result.subject });
                
                // 追蹤本場戰鬥的答對科目
                this.correctBySubject[result.subject] = (this.correctBySubject[result.subject] || 0) + 1;
            }
            
            // 🏆 成就：常識防禦成功
            if (result.subject === 'general') {
                AchievementSystem.checkAchievement(this.game, 'defend_correct');
            }
            
            // 播放魔法音效（根據科目）
            this.audio.playMagic(result.subject || 'general');
            
            // 英文治療：增加HP，其他科目：造成傷害
            if (result.subject === 'english') {
                // 治療效果
                const healAmount = result.damage || 20;
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + healAmount);
                
                // 更新玩家血條
                this.updatePlayerHpBar();
                
                // 治療特效
                this.createHealEffect(this.playerSprite.x, this.playerSprite.y);
                
                this.showMessage(`✅ 答對了！回復 ${healAmount} 點HP！連擊x${this.comboCount}`);
                
            } else {
                // 攻擊效果 - 基於等級和攻擊力計算傷害
                const baseDamage = result.damage || 20;
                const playerLevel = this.playerData.level || 1;
                const playerAttack = this.game.globals.playerAttack || (10 + (playerLevel - 1) * 2);
                
                // 傷害公式：基礎傷害 + (攻擊力 * 0.5) + (等級 * 2)
                let damage = Math.floor(baseDamage + (playerAttack * 0.5) + (playerLevel * 2));
                
                // 🔥 連擊傷害加成
                const comboBonus = 1 + (this.comboCount * this.comboMultiplier);
                damage = Math.floor(damage * comboBonus);
                
                // 🎯 連擊獎勵傷害加成（v1.12.0）
                if (this.damageBoost > 0) {
                    damage = Math.floor(damage * (1 + this.damageBoost));
                }
                
                // Boss戰額外加成
                if (this.enemyData.isBoss || this.enemyData.type === 'boss') {
                    damage = Math.floor(damage * 1.2); // 對Boss有20%傷害加成
                }
                
                // 🗡️ 檢查暗影刺客閃避
                if (this.enemyData.isAssassin && this.enemyData.dodgeChance) {
                    const dodgeRoll = Math.random();
                    if (dodgeRoll < this.enemyData.dodgeChance) {
                        // 閃避成功
                        this.createDodgeEffect();
                        this.showMessage(`🗡️ ${this.enemyData.name} 閃避了你的攻擊！連擊x${this.comboCount}`);
                        
                        // 攻擊動畫但無傷害
                        this.time.delayedCall(300, () => {
                            this.animateAttackMiss(this.playerSprite, this.enemySprite);
                        });
                        
                        // 檢查戰鬥結束（雖然沒造成傷害，但回合結束）
                        this.time.delayedCall(2000, () => {
                            this.enemyTurn();
                        });
                        return;
                    }
                }
                
                // ⚡ 檢查麻痺狀態（有機率打偏）
                if (this.paralyzeEffect.active && Math.random() < 0.4) {
                    // 打偏，造成一半傷害
                    damage = Math.floor(damage * 0.5);
                    this.showMessage(`⚡ 麻痺影響！攻擊打偏了！造成 ${damage} 點傷害！連擊x${this.comboCount}`);
                }
                
                // 暴擊機率 (等級越高暴擊率越高 + 連擊獎勵加成)
                const baseCritChance = Math.min(0.1 + (playerLevel * 0.02), 0.5);
                const critChance = Math.min(baseCritChance + this.critChanceBoost, 0.8); // 最高80%暴擊率
                let isCrit = Math.random() < critChance;
                
                if (isCrit) {
                    damage = Math.floor(damage * 2);
                    this.showMessage(`💥 暴擊！造成 ${damage} 點傷害！連擊x${this.comboCount}`);
                } else {
                    this.showMessage(`✅ 答對了！造成 ${damage} 點傷害！連擊x${this.comboCount}`);
                }
                
                // 技能特效
                this.createSkillEffect(result.subject, this.enemySprite.x, this.enemySprite.y);
                
                this.dealDamageToEnemy(damage);
                
                // 暴擊特效
                if (isCrit) {
                    this.createCritEffect(this.enemySprite.x, this.enemySprite.y);
                }
                
                // 攻擊動畫
                this.time.delayedCall(300, () => {
                    this.animateAttack(this.playerSprite, this.enemySprite);
                });
            }
        } else {
            // 🔥 答錯了 - 重置連擊
            this.resetCombo();
            
            // 答錯了
            this.audio.playMiss();
            this.showMessage('❌ 答錯了！這回合沒有效果...');
        }
        
        // 檢查戰鬥結束
        if (this.enemyData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(true);
            });
        } else {
            this.time.delayedCall(2000, () => {
                this.enemyTurn();
            });
        }
    }
    
    // 🗡️ 創建閃避特效
    createDodgeEffect() {
        const enemy = this.enemySprite;
        
        // 殘影效果
        for (let i = 0; i < 3; i++) {
            const shadow = this.add.text(enemy.x, enemy.y, '🗡️', {
                fontSize: '40px',
                alpha: 0.5
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: shadow,
                x: enemy.x + (i - 1) * 30,
                alpha: 0,
                duration: 500,
                delay: i * 100,
                onComplete: () => shadow.destroy()
            });
        }
        
        // 閃避文字
        const dodgeText = this.add.text(enemy.x, enemy.y - 60, '閃避！', {
            fontSize: '28px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#9b59b6',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: dodgeText,
            y: enemy.y - 100,
            alpha: 0,
            scale: { from: 1, to: 1.5 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => dodgeText.destroy()
        });
        
        // 敵人閃避動畫
        this.tweens.add({
            targets: enemy,
            x: enemy.x + 40,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    // 🗡️ 攻擊落空動畫
    animateAttackMiss(attacker, target) {
        const direction = attacker.x < target.x ? 1 : -1;
        
        // 攻擊者前移
        this.tweens.add({
            targets: attacker,
            x: target.x - (50 * direction),
            duration: 200,
            ease: 'Power2',
            yoyo: true
        });
        
        // 目標閃避
        this.tweens.add({
            targets: target,
            x: target.x + (30 * direction),
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
        
        // MISS 文字
        const missText = this.add.text(target.x, target.y - 50, 'MISS', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#9b59b6',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: missText,
            y: target.y - 100,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => missText.destroy()
        });
    }
    
    createHealEffect(x, y) {
        // 創建治療特效
        for (let i = 0; i < 8; i++) {
            const particle = this.add.text(x, y, '✨', {
                fontSize: '20px'
            }).setOrigin(0.5);
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 50;
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createSkillEffect(subject, x, y) {
        // 根據科目創建不同的特效
        const effects = {
            'math': { emoji: '🔢', color: 0x3498db },
            'science': { emoji: '⚗️', color: 0x2ecc71 },
            'general': { emoji: '🛡️', color: 0x9b59b6 }
        };
        
        const effect = effects[subject] || effects['general'];
        
        // 創建特效粒子
        for (let i = 0; i < 6; i++) {
            const particle = this.add.text(x, y, effect.emoji, {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            const angle = (i / 6) * Math.PI * 2;
            const distance = 60;
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1.5, to: 0 },
                duration: 600,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createCritEffect(x, y) {
        // 暴擊特效
        const critText = this.add.text(x, y - 60, '暴擊！', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffff00',
            stroke: '#ff0000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: critText,
            y: y - 100,
            alpha: 0,
            scale: { from: 0.5, to: 1.5 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => critText.destroy()
        });
        
        // 衝擊波效果
        const shockwave = this.add.circle(x, y, 10, 0xffff00, 0.8);
        this.tweens.add({
            targets: shockwave,
            radius: 100,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => shockwave.destroy()
        });
    }
    
    dealDamageToEnemy(damage) {
        this.enemyData.hp = Math.max(0, this.enemyData.hp - damage);
        
        // 更新敵人血條
        const hpPercent = this.enemyData.hp / this.enemyData.maxHp;
        this.enemyHpBar.setScale(hpPercent, 1);
        
        // 受傷閃紅
        this.tweens.add({
            targets: this.enemySprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // 恢復原始顏色
                if (this.enemyData.isAssassin) {
                    this.enemySprite.setTint(0x4a0080);
                } else if (this.enemyData.isFireElemental) {
                    this.enemySprite.setTint(0xff4500);
                } else if (this.enemyData.isIceElemental) {
                    this.enemySprite.setTint(0x00ffff);
                } else if (this.enemyData.isLightningElemental) {
                    this.enemySprite.setTint(0x9400d3);
                } else if (this.enemyData.isVenomSpider) {
                    this.enemySprite.setTint(0x2ecc71);
                } else {
                    this.enemySprite.clearTint();
                }
            }
        });
        
        // 顯示傷害數字
        this.showDamageNumber(damage, this.enemySprite.x, this.enemySprite.y);
    }
    
    showDamageNumber(damage, x, y) {
        const damageText = this.add.text(x, y - 50, `-${damage}`, {
            fontSize: '28px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: y - 100,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }
    
    animateAttack(attacker, target) {
        const direction = attacker.x < target.x ? 1 : -1;
        
        // 攻擊者前移
        this.tweens.add({
            targets: attacker,
            x: target.x - (50 * direction),
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                // 返回原位
                this.tweens.add({
                    targets: attacker,
                    x: attacker.x,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
        
        // 目標後仰
        this.tweens.add({
            targets: target,
            x: target.x + (20 * direction),
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // 衝擊效果
        const impact = this.add.text(target.x, target.y, '💥', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: impact,
            scale: { from: 0.5, to: 1.5 },
            alpha: 0,
            duration: 400,
            onComplete: () => impact.destroy()
        });
    }
    
    enemyTurn() {
        if (this.battleEnded) return;
        
        this.turn = 'enemy';
        this.showMessage(`👹 ${this.enemyData.name} 的回合！`);
        
        // 隨機選擇攻擊類型
        const attackRoll = Math.random();
        
        this.time.delayedCall(1500, () => {
            // 🔥 火焰元素特殊攻擊
            if (this.enemyData.isFireElemental && attackRoll < (this.enemyData.fireBurstChance || 0)) {
                this.fireBurstAttack();
                return;
            }
            
            // ❄️ 冰霜元素特殊攻擊
            if (this.enemyData.isIceElemental && attackRoll < (this.enemyData.iceBurstChance || 0)) {
                this.iceBurstAttack();
                return;
            }
            
            // ⚡ 雷電元素特殊攻擊
            if (this.enemyData.isLightningElemental && attackRoll < (this.enemyData.thunderStrikeChance || 0)) {
                this.thunderStrikeAttack();
                return;
            }

            // 🕷️ 毒液蜘蛛特殊攻擊
            if (this.enemyData.isVenomSpider && attackRoll < (this.enemyData.venomBurstChance || 0)) {
                this.venomBurstAttack();
                return;
            }
            
            // 普通攻擊
            this.enemyNormalAttack();
        });
    }
    
    enemyNormalAttack() {
        // 播放攻擊音效
        this.audio.playHit();
        
        // 敵人攻擊動畫
        this.tweens.add({
            targets: this.enemySprite,
            x: this.playerSprite.x + 50,
            duration: 200,
            ease: 'Power2',
            yoyo: true
        });
        
        // 計算傷害
        const baseDamage = this.enemyData.attack;
        const variation = Phaser.Math.Between(-3, 3);
        let damage = Math.max(1, baseDamage + variation);
        
        // 防禦減傷（可以根據玩家防禦力調整）
        const playerDefense = this.game.globals.playerDefense || 0;
        damage = Math.max(1, damage - playerDefense);
        
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        
        // 更新玩家血條
        this.updatePlayerHpBar();
        
        // 🔥 火焰元素：有機率附加燃燒
        if (this.enemyData.isFireElemental && Math.random() < (this.enemyData.burnChance || 0.3)) {
            this.applyBurnEffect();
        }
        
        // ❄️ 冰霜元素：有機率附加冰凍
        if (this.enemyData.isIceElemental && Math.random() < (this.enemyData.freezeChance || 0.3)) {
            this.applyFreezeEffect();
        }
        
        // ⚡ 雷電元素：有機率附加麻痺
        if (this.enemyData.isLightningElemental && Math.random() < (this.enemyData.paralyzeChance || 0.4)) {
            this.applyParalyzeEffect();
        }

        // 🕷️ 毒液蜘蛛：有機率附加中毒
        if (this.enemyData.isVenomSpider && Math.random() < (this.enemyData.poisonChance || 0.5)) {
            this.applyPoisonEffect();
        }
        
        this.showMessage(`${this.enemyData.name} 造成 ${damage} 點傷害！`);
        
        // 檢查戰鬥結束
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(false);
            });
        } else {
            this.time.delayedCall(2000, () => {
                this.playerTurn();
            });
        }
    }

    // 🔥 火焰爆發攻擊
    fireBurstAttack() {
        // 火焰爆發特效
        for (let i = 0; i < 12; i++) {
            const flame = this.add.text(
                this.playerSprite.x + Phaser.Math.Between(-50, 50),
                this.playerSprite.y + Phaser.Math.Between(-50, 50),
                '🔥',
                { fontSize: '30px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: flame,
                scale: { from: 0, to: 2 },
                alpha: 0,
                duration: 800,
                delay: i * 50,
                onComplete: () => flame.destroy()
            });
        }
        
        // 高傷害 + 必定燃燒
        const damage = Math.floor(this.enemyData.attack * 1.5);
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        this.updatePlayerHpBar();
        
        // 必定附加燃燒
        this.applyBurnEffect();
        
        this.showMessage(`🔥 火焰爆發！造成 ${damage} 點傷害並附加燃燒！`);
        
        // 檢查戰鬥結束
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(false);
            });
        } else {
            this.time.delayedCall(2500, () => {
                this.playerTurn();
            });
        }
    }

    // ❄️ 冰霜爆發攻擊
    iceBurstAttack() {
        // 冰霜爆發特效
        for (let i = 0; i < 15; i++) {
            const ice = this.add.text(
                this.playerSprite.x + Phaser.Math.Between(-60, 60),
                this.playerSprite.y + Phaser.Math.Between(-60, 60),
                ['❄️', '✦', '✧'][i % 3],
                { fontSize: '28px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: ice,
                scale: { from: 0, to: 1.8 },
                alpha: 0,
                rotation: Math.random() * Math.PI * 2,
                duration: 1000,
                delay: i * 40,
                onComplete: () => ice.destroy()
            });
        }
        
        // 傷害 + 必定冰凍
        const damage = Math.floor(this.enemyData.attack * 1.3);
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        this.updatePlayerHpBar();
        
        // 必定附加冰凍
        this.applyFreezeEffect();
        
        this.showMessage(`❄️ 冰霜爆發！造成 ${damage} 點傷害並附加冰凍！`);
        
        // 檢查戰鬥結束
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(false);
            });
        } else {
            this.time.delayedCall(2500, () => {
                this.playerTurn();
            });
        }
    }

    // ⚡ 雷電打擊攻擊
    thunderStrikeAttack() {
        // 雷電特效
        const lightning = this.add.text(this.playerSprite.x, this.playerSprite.y - 100, '⚡', {
            fontSize: '80px'
        }).setOrigin(0.5);
        
        // 閃光效果
        const flash = this.add.rectangle(400, 300, 800, 600, 0xffff00, 0.5);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
        
        this.tweens.add({
            targets: lightning,
            y: this.playerSprite.y,
            alpha: 0,
            scale: { from: 1, to: 2 },
            duration: 300,
            onComplete: () => lightning.destroy()
        });
        
        // 高傷害 + 必定麻痺
        const damage = Math.floor(this.enemyData.attack * 1.6);
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        this.updatePlayerHpBar();
        
        // 必定附加麻痺
        this.applyParalyzeEffect();
        
        this.showMessage(`⚡ 雷電打擊！造成 ${damage} 點傷害並附加麻痺！`);
        
        // 檢查戰鬥結束
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(false);
            });
        } else {
            this.time.delayedCall(2500, () => {
                this.playerTurn();
            });
        }
    }

    // 🕷️ 毒液爆發攻擊
    venomBurstAttack() {
        // 毒液爆發特效
        for (let i = 0; i < 15; i++) {
            const venom = this.add.text(
                this.playerSprite.x + Phaser.Math.Between(-60, 60),
                this.playerSprite.y + Phaser.Math.Between(-60, 60),
                ['☠️', '💀', '🧪'][i % 3],
                { fontSize: '28px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: venom,
                scale: { from: 0, to: 2 },
                alpha: 0,
                rotation: Math.random() * Math.PI * 2,
                duration: 900,
                delay: i * 40,
                onComplete: () => venom.destroy()
            });
        }
        
        // 毒液濺射效果
        for (let i = 0; i < 8; i++) {
            const splash = this.add.circle(
                this.playerSprite.x,
                this.playerSprite.y,
                Phaser.Math.Between(5, 15),
                0x2ecc71,
                0.7
            );
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = Phaser.Math.Between(60, 100);
            
            this.tweens.add({
                targets: splash,
                x: this.playerSprite.x + Math.cos(angle) * distance,
                y: this.playerSprite.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0 },
                duration: 700,
                delay: 100 + i * 30,
                onComplete: () => splash.destroy()
            });
        }
        
        // 傷害 + 必定中毒（增加層數）
        const damage = Math.floor(this.enemyData.attack * 1.2);
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        this.updatePlayerHpBar();
        
        // 必定附加中毒（疊加層數）
        this.applyPoisonEffect(true); // true = 這是爆發攻擊，增加更多層數
        
        this.showMessage(`☠️ 毒液爆發！造成 ${damage} 點傷害並附加劇毒！`);
        
        // 檢查戰鬥結束
        if (this.playerData.hp <= 0) {
            this.time.delayedCall(1500, () => {
                this.endBattle(false);
            });
        } else {
            this.time.delayedCall(2500, () => {
                this.playerTurn();
            });
        }
    }

    // 🔥 應用燃燒效果
    applyBurnEffect() {
        this.burnEffect.active = true;
        this.burnEffect.duration = 3; // 持續3回合
        this.burnEffect.damagePerTurn = 5; // 每回合5點傷害
        
        this.showBurnIndicator();
        this.showMessage('🔥 你受到了燃燒效果！');
    }

    // ❄️ 應用冰凍效果
    applyFreezeEffect() {
        this.freezeEffect.active = true;
        this.freezeEffect.duration = 2; // 持續2回合
        this.freezeEffect.skipTurnChance = 0.35; // 35%機率跳過回合
        
        this.showFreezeIndicator();
        this.showMessage('❄️ 你受到了冰凍效果！');
    }

    // ⚡ 應用麻痺效果
    applyParalyzeEffect() {
        this.paralyzeEffect.active = true;
        this.paralyzeEffect.duration = this.enemyData.paralyzeDuration || 2;
        this.paralyzeEffect.confused = true;
        
        this.showParalyzeIndicator();
        this.showMessage('⚡ 你受到了麻痺效果！');
    }

    // 🕷️ 應用中毒效果
    applyPoisonEffect(isBurst = false) {
        this.poisonEffect.active = true;
        this.poisonEffect.duration = 4; // 持續4回合
        this.poisonEffect.damagePerTurn = isBurst ? 8 : 5; // 爆發攻擊傷害更高
        
        // 增加中毒層數（最多疊加3層）
        const maxStacks = 3;
        if (isBurst) {
            this.poisonEffect.stackCount = Math.min(maxStacks, this.poisonEffect.stackCount + 2);
        } else {
            this.poisonEffect.stackCount = Math.min(maxStacks, this.poisonEffect.stackCount + 1);
        }
        
        this.showPoisonIndicator();
        this.updatePoisonStackDisplay();
        
        if (isBurst) {
            this.showMessage(`☠️ 你受到了劇毒效果！（層數: ${this.poisonEffect.stackCount}）`);
        } else {
            this.showMessage(`☠️ 你受到了中毒效果！（層數: ${this.poisonEffect.stackCount}）`);
        }
    }
    
    updatePlayerHpBar() {
        const hpPercent = this.playerData.hp / this.playerData.maxHp;
        this.playerHpBar.setScale(hpPercent, 1);
    }
    
    tryEscape() {
        this.hideActionButtons();
        
        // 逃跑機率計算
        const escapeChance = 0.5;
        
        if (Math.random() < escapeChance) {
            this.showMessage('🏃 成功逃跑了！');
            
            this.time.delayedCall(1500, () => {
                // 🔥 重置連擊
                this.resetCombo();
                
                // 返回原場景
                this.scene.start(this.returnScene, {
                    playerX: this.game.globals.playerX || 400,
                    playerY: this.game.globals.playerY || 300,
                    player: this.playerData
                });
            });
        } else {
            this.showMessage('❌ 逃跑失敗！');
            
            this.time.delayedCall(1500, () => {
                // 🔥 逃跑失敗也重置連擊
                this.resetCombo();
                this.enemyTurn();
            });
        }
    }
    
    endBattle(playerWon) {
        this.battleEnded = true;
        
        if (playerWon) {
            // 🏆 戰鬥勝利成就
            AchievementSystem.checkAchievement(this.game, 'win_battle');
            AchievementSystem.checkAchievement(this.game, 'kill_enemy');
            
            // 🔥 記錄最高連擊
            if (this.maxCombo > 0) {
                AchievementSystem.checkAchievement(this.game, 'combo', { combo: this.maxCombo });
            }
            
            // 🏆 Boss戰成就
            if (this.enemyData.isBoss || this.enemyData.type === 'boss') {
                AchievementSystem.checkAchievement(this.game, 'kill_boss');
            }
            
            // 計算經驗值（使用雙倍經驗加成）
            let expGain = this.enemyData.exp;
            if (this.expBoostActive) {
                expGain = Math.floor(expGain * this.expBoostMultiplier);
                this.game.globals.expBoostActive = false; // 消耗掉雙倍經驗
            }
            
            // 計算金錢
            const goldGain = this.enemyData.gold;
            
            // 顯示勝利畫面
            this.showVictoryScreen(expGain, goldGain);
            
            // 🏆 獲得金錢成就
            AchievementSystem.checkAchievement(this.game, 'earn_gold', { amount: goldGain });
        } else {
            // 戰鬥失敗
            this.showDefeatScreen();
        }
    }
    
    showVictoryScreen(expGain, goldGain) {
        // 隱藏UI
        this.uiPanel.setVisible(false);
        this.comboContainer.setVisible(false);
        
        // 勝利背景
        const victoryBg = this.add.rectangle(400, 300, 500, 350, 0x000000, 0.9);
        victoryBg.setStrokeStyle(4, 0xf1c40f);
        
        // 勝利標題
        const victoryTitle = this.add.text(400, 180, '🎉 勝利！', {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 經驗值
        const expText = this.add.text(400, 250, `獲得 ${expGain} 經驗值`, {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#3498db'
        }).setOrigin(0.5);
        
        // 金錢
        const goldText = this.add.text(400, 290, `獲得 ${goldGain} 金幣`, {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        }).setOrigin(0.5);
        
        // 最高連擊
        const comboText = this.add.text(400, 330, `最高連擊: ${this.maxCombo}`, {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff6600'
        }).setOrigin(0.5);
        
        // 🎯 顯示連擊獎勵統計（v1.12.0 新增）
        let rewardText = '';
        if (this.claimedRewards.size > 0) {
            rewardText = `連擊獎勵: ${this.claimedRewards.size} 個`;
        }
        const rewardStatText = this.add.text(400, 360, rewardText, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#9b59b6'
        }).setOrigin(0.5);
        
        // 繼續按鈗
        const continueBtn = this.add.container(400, 400);
        const btnBg = this.add.rectangle(0, 0, 200, 50, 0x2ecc71);
        btnBg.setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, '繼續', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        continueBtn.add([btnBg, btnText]);
        
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x27ae60));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x2ecc71));
        btnBg.on('pointerup', () => {
            // 更新玩家數據
            this.playerData.exp += expGain;
            this.playerData.gold += goldGain;
            this.game.globals.playerGold = this.playerData.gold;
            
            // 檢查升級
            if (this.playerData.exp >= 100) {
                this.playerData.exp -= 100;
                this.playerData.level++;
                
                // 🏆 升級成就
                AchievementSystem.checkAchievement(this.game, 'level_up', { level: this.playerData.level });
                
                // 增加最大HP和MP
                this.playerData.maxHp += 10;
                this.playerData.maxMp += 5;
                this.playerData.hp = this.playerData.maxHp;
                this.playerData.mp = this.playerData.maxMp;
                
                // 保存全局數據
                this.game.globals.playerHP = this.playerData.hp;
                this.game.globals.playerMaxHP = this.playerData.maxHp;
                this.game.globals.playerMP = this.playerData.mp;
                this.game.globals.playerMaxMP = this.playerData.maxMp;
                this.game.globals.playerLevel = this.playerData.level;
                this.game.globals.playerExp = this.playerData.exp;
                
                // 進入升級場景
                this.scene.start('LevelUpScene', {
                    player: this.playerData,
                    returnScene: this.returnScene
                });
            } else {
                // 沒有升級，直接返回
                this.game.globals.playerHP = this.playerData.hp;
                this.game.globals.playerMP = this.playerData.mp;
                this.game.globals.playerExp = this.playerData.exp;
                
                this.scene.start(this.returnScene, {
                    playerX: this.game.globals.playerX || 400,
                    playerY: this.game.globals.playerY || 300,
                    player: this.playerData
                });
            }
        });
    }
    
    showDefeatScreen() {
        // 隱藏UI
        this.uiPanel.setVisible(false);
        this.comboContainer.setVisible(false);
        
        // 失敗背景
        const defeatBg = this.add.rectangle(400, 300, 500, 300, 0x000000, 0.9);
        defeatBg.setStrokeStyle(4, 0xe74c3c);
        
        // 失敗標題
        const defeatTitle = this.add.text(400, 200, '💀 戰敗', {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 提示文字
        const hintText = this.add.text(400, 270, '你的HP已歸零...', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // 返回村莊按鈗
        const returnBtn = this.add.container(400, 350);
        const btnBg = this.add.rectangle(0, 0, 250, 50, 0x3498db);
        btnBg.setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, '返回村莊', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        returnBtn.add([btnBg, btnText]);
        
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x2980b9));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x3498db));
        btnBg.on('pointerup', () => {
            // 恢復部分HP
            this.playerData.hp = Math.floor(this.playerData.maxHp * 0.5);
            this.game.globals.playerHP = this.playerData.hp;
            
            // 返回村莊
            this.scene.start('VillageScene', {
                playerX: 400,
                playerY: 400,
                player: this.playerData
            });
        });
    }
    
    showMessage(text) {
        this.battleMessage.setText(text);
        
        // 文字彈出動畫
        this.tweens.add({
            targets: this.battleMessage,
            scale: { from: 0.8, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }
}
