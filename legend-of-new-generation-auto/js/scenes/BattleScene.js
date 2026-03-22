/**
 * BattleScene - 戰鬥場景
 * 回合制戰鬥系統，結合問答機制
 * v1.9.0 - 新增冰霜元素敵人支援
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
        
        // 🧪 顯示雙倍經驗狀態
        if (this.expBoostActive) {
            this.showExpBoostIndicator();
        }
        
        // ⏱️ 創建時間凍結技能按鈕
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
    
    createBattleUI() {
        const width = this.cameras.main.width;
        
        // 底部UI面板
        this.uiPanel = this.add.container(0, 450);
        
        const panelBg = this.add.rectangle(400, 75, 800, 150, 0x000000, 0.8);
        this.uiPanel.add(panelBg);
        
        // 行動按鈕容器
        this.actionButtons = this.add.container(0, 0);
        this.uiPanel.add(this.actionButtons);
        
        // 攻擊按鈕（數學題目）- 注意：坐標相對於 uiPanel (y=450)
        this.createActionButton(100, 30, '🔢 數學攻擊', 0x3498db, function() {
            this.startQuiz('math');
        });
        
        // 技能按鈕（科學題目）
        this.createActionButton(300, 30, '⚗️ 科學魔法', 0x2ecc71, function() {
            this.startQuiz('science');
        });
        
        // 治療按鈕（英文題目）
        this.createActionButton(500, 30, '📖 英文治療', 0xf39c12, function() {
            this.startQuiz('english');
        });
        
        // 防禦按鈕（常識題目）
        this.createActionButton(700, 30, '🛡️ 常識防禦', 0x9b59b6, function() {
            this.startQuiz('general');
        });
        
        // 逃跑按鈕（移到第二行中間）
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
        
        // 隱藏按鈕函數
        this.hideActionButtons = () => {
            this.actionButtons.setVisible(false);
        };
        
        this.showActionButtons = () => {
            this.actionButtons.setVisible(true);
        };
    }
    
    // ⏱️ 創建時間凍結技能按鈕
    createTimeFreezeButton() {
        // 在右上角創建技能按鈕
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
        
        // 初始更新按鈕狀態
        this.updateTimeFreezeButton();
    }
    
    // ⏱️ 更新時間凍結按鈕狀態
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
        
        // 隱藏行動按鈕
        this.hideActionButtons();
        
        // 使用技能
        const success = this.timeFreezeSkill.use();
        
        if (success) {
            // 更新MP顯示
            this.updatePlayerMpBar();
            
            // 更新按鈕狀態
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
        
        // 連擊音效（高連擊時播放特殊音效）
        if (this.comboCount === 5 || this.comboCount === 10) {
            // 里程碑連擊特效
            this.createComboMilestoneEffect();
        }
    }
    
    // 🔥 重置連擊
    resetCombo() {
        if (this.comboCount > 0) {
            this.comboCount = 0;
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
                
                // 暴擊機率 (等級越高暴擊率越高)
                const critChance = Math.min(0.1 + (playerLevel * 0.02), 0.5); // 最高50%暴擊率
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
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: missText,
            y: target.y - 80,
            alpha: 0,
            duration: 800,
            onComplete: () => missText.destroy()
        });
    }
    
    enemyTurn() {
        if (this.battleEnded) return;
        
        this.turn = 'enemy';
        this.hideActionButtons();
        
        // ⏱️ 檢查敵人是否被凍結
        if (this.timeFreezeSkill && this.timeFreezeSkill.isFrozen) {
            this.showMessage(`⏱️ ${this.enemyData.name} 被時間凍結，無法行動！`);
            
            // 凍結視覺效果
            this.createFrozenEffect();
            
            // 解除凍結狀態
            this.timeFreezeSkill.releaseFreeze();
            
            // 更新按鈕狀態
            this.updateTimeFreezeButton();
            
            // 回到玩家回合
            this.time.delayedCall(2000, () => {
                this.playerTurn();
            });
            return;
        }
        
        this.showMessage(`👹 ${this.enemyData.name} 的回合！`);
        
        this.time.delayedCall(1000, () => {
            // 🔥 火焰元素特殊技能：火焰爆發
            if (this.enemyData.isFireElemental && Math.random() < 0.4) {
                this.fireElementalSpecialAttack();
                return;
            }
            
            // 🔥 火焰元素普通攻擊有機率附加燃燒
            if (this.enemyData.isFireElemental && Math.random() < 0.3) {
                this.applyBurnEffect();
                return;
            }
            
            // ❄️ 冰霜元素特殊技能：極寒冰爆
            if (this.enemyData.isIceElemental && Math.random() < 0.35) {
                this.iceElementalSpecialAttack();
                return;
            }
            
            // ❄️ 冰霜元素普通攻擊有機率附加冰凍
            if (this.enemyData.isIceElemental && Math.random() < 0.4) {
                this.applyFreezeAttack();
                return;
            }
            
            // 🗡️ 暗影刺客有更高傷害
            let damage;
            if (this.enemyData.isAssassin) {
                damage = Phaser.Math.Between(15, 25); // 刺客傷害更高
            } else if (this.enemyData.isFireElemental) {
                damage = Phaser.Math.Between(18, 28); // 火焰元素高傷害
            } else if (this.enemyData.isIceElemental) {
                damage = Phaser.Math.Between(12, 20); // 冰霜元素較低傷害
            } else {
                damage = Phaser.Math.Between(8, 15);
            }
            
            this.playerData.hp = Math.max(0, this.playerData.hp - damage);
            
            // 更新血條
            this.updatePlayerHpBar();
            
            // 播放攻擊和受擊音效
            this.audio.playAttack();
            this.time.delayedCall(200, () => {
                this.audio.playHit();
            });
            
            // 攻擊動畫
            this.animateAttack(this.enemySprite, this.playerSprite);
            
            this.showMessage(`💥 受到了 ${damage} 點傷害！`);
            
            // 檢查玩家死亡
            if (this.playerData.hp <= 0) {
                this.time.delayedCall(1500, () => {
                    this.endBattle(false);
                });
            } else {
                this.time.delayedCall(2000, () => {
                    this.playerTurn();
                });
            }
        });
    }

    // 🔥 火焰元素特殊攻擊：火焰爆發
    fireElementalSpecialAttack() {
        this.showMessage(`🔥 ${this.enemyData.name} 施放火焰爆發！`);
        
        // 火焰爆發特效
        this.createFireBurstEffect();
        
        this.time.delayedCall(800, () => {
            // 高傷害
            const damage = Phaser.Math.Between(25, 35);
            this.playerData.hp = Math.max(0, this.playerData.hp - damage);
            this.updatePlayerHpBar();
            
            // 必定附加燃燒（如果還沒有）
            if (!this.burnEffect.active) {
                this.burnEffect = {
                    active: true,
                    duration: 3,
                    damagePerTurn: 8
                };
                this.showBurnIndicator();
                this.showMessage(`🔥 你被點燃了！每回合受到 ${this.burnEffect.damagePerTurn} 點燃燒傷害！`);
            }
            
            // 播放音效
            this.audio.playHit();
            
            // 檢查玩家死亡
            if (this.playerData.hp <= 0) {
                this.time.delayedCall(1500, () => {
                    this.endBattle(false);
                });
            } else {
                this.time.delayedCall(2500, () => {
                    this.playerTurn();
                });
            }
        });
    }

    // ❄️ 冰霜元素特殊攻擊：極寒冰爆
    iceElementalSpecialAttack() {
        this.showMessage(`❄️ ${this.enemyData.name} 施放極寒冰爆！`);
        
        // 極寒冰爆特效
        this.createIceBurstEffect();
        
        this.time.delayedCall(800, () => {
            // 中等傷害
            const damage = Phaser.Math.Between(18, 25);
            this.playerData.hp = Math.max(0, this.playerData.hp - damage);
            this.updatePlayerHpBar();
            
            // 必定附加冰凍（如果還沒有）
            if (!this.freezeEffect.active) {
                this.freezeEffect = {
                    active: true,
                    duration: 3,
                    skipTurnChance: 0.5 // 50%機率跳過回合
                };
                this.showFreezeIndicator();
                this.showMessage(`❄️ 你被冰凍了！每回合有 50% 機率無法行動！`);
            }
            
            // 播放音效
            this.audio.playHit();
            
            // 檢查玩家死亡
            if (this.playerData.hp <= 0) {
                this.time.delayedCall(1500, () => {
                    this.endBattle(false);
                });
            } else {
                this.time.delayedCall(2500, () => {
                    this.playerTurn();
                });
            }
        });
    }

    // ❄️ 冰霜元素普通冰凍攻擊
    applyFreezeAttack() {
        const damage = Phaser.Math.Between(10, 16);
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        this.updatePlayerHpBar();
        
        // 附加冰凍狀態
        this.freezeEffect = {
            active: true,
            duration: 3,
            skipTurnChance: 0.35 // 35%機率跳過回合
        };
        
        this.showFreezeIndicator();
        
        // 冰凍特效
        this.createFreezeEffect();
        
        this.showMessage(`❄️ 受到了 ${damage} 點傷害並被冰凍！每回合有 35% 機率無法行動！`);
        
        // 播放音效
        this.audio.playHit();
        
        // 攻擊動畫
        this.animateAttack(this.enemySprite, this.playerSprite);
        
        // 檢查玩家死亡
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

    // ❄️ 創建極寒冰爆特效
    createIceBurstEffect() {
        // 中心冰爆
        const burst = this.add.circle(400, 300, 50, 0x00ffff, 0.8);
        
        this.tweens.add({
            targets: burst,
            scale: { from: 0, to: 3 },
            alpha: { from: 0.8, to: 0 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => burst.destroy()
        });
        
        // 冰晶粒子四散
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 150 + Math.random() * 50;
            
            const ice = this.add.text(400, 300, ['❄️', '✦', '✧'][i % 3], {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: ice,
                x: 400 + Math.cos(angle) * distance,
                y: 300 + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0.3 },
                rotation: Math.random() * Math.PI * 2,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => ice.destroy()
            });
        }
        
        // 全屏藍色閃光
        const flash = this.add.rectangle(400, 300, 800, 600, 0x00ffff, 0.3);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
        
        // 玩家受擊閃爍（藍色）
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0x00ffff,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.playerSprite.clearTint();
                const playerColor = this.game.globals.playerColor || 0xffffff;
                this.playerSprite.setTint(playerColor);
            }
        });
    }

    // ❄️ 創建冰凍特效
    createFreezeEffect() {
        const player = this.playerSprite;
        
        // 冰晶環繞
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const distance = 30;
            
            const ice = this.add.text(
                player.x + Math.cos(angle) * distance,
                player.y + Math.sin(angle) * distance,
                ['❄️', '✦', '✧'][i % 3],
                { fontSize: '16px' }
            ).setOrigin(0.5);
            
            // 旋轉動畫
            this.tweens.add({
                targets: ice,
                x: {
                    getEnd: () => player.x + Math.cos(angle + Math.PI * 2) * distance
                },
                y: {
                    getEnd: () => player.y + Math.sin(angle + Math.PI * 2) * distance
                },
                duration: 2500,
                repeat: 2,
                ease: 'Linear',
                onUpdate: (tween, target) => {
                    const progress = tween.progress;
                    const currentAngle = angle + progress * Math.PI * 2;
                    target.x = player.x + Math.cos(currentAngle) * distance;
                    target.y = player.y + Math.sin(currentAngle) * distance;
                },
                onComplete: () => ice.destroy()
            });
        }
    }

    // 🔥 創建火焰爆發特效
    createFireBurstEffect() {
        // 中心大爆炸
        const burst = this.add.circle(400, 300, 50, 0xff4500, 0.8);
        
        this.tweens.add({
            targets: burst,
            scale: { from: 0, to: 3 },
            alpha: { from: 0.8, to: 0 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => burst.destroy()
        });
        
        // 火焰粒子四散
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const distance = 150 + Math.random() * 50;
            
            const fire = this.add.text(400, 300, '🔥', {
                fontSize: '30px'
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: fire,
                x: 400 + Math.cos(angle) * distance,
                y: 300 + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0.3 },
                rotation: Math.random() * Math.PI * 2,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => fire.destroy()
            });
        }
        
        // 玩家受擊閃爍
        this.tweens.add({
            targets: this.playerSprite,
            tint: 0xff4500,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.playerSprite.clearTint();
                const playerColor = this.game.globals.playerColor || 0xffffff;
                this.playerSprite.setTint(playerColor);
            }
        });
    }

    // 🔥 應用燃燒效果
    applyBurnEffect() {
        const damage = Phaser.Math.Between(12, 20);
        this.playerData.hp = Math.max(0, this.playerData.hp - damage);
        this.updatePlayerHpBar();
        
        // 附加燃燒狀態
        this.burnEffect = {
            active: true,
            duration: 3,
            damagePerTurn: 8
        };
        
        this.showBurnIndicator();
        
        // 燃燒特效
        this.createBurnEffect();
        
        this.showMessage(`🔥 受到了 ${damage} 點傷害並被點燃！每回合額外受到 8 點傷害！`);
        
        // 播放音效
        this.audio.playHit();
        
        // 攻擊動畫
        this.animateAttack(this.enemySprite, this.playerSprite);
        
        // 檢查玩家死亡
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

    // 🔥 創建燃燒特效
    createBurnEffect() {
        const player = this.playerSprite;
        
        // 火焰環繞
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 25;
            
            const flame = this.add.text(
                player.x + Math.cos(angle) * distance,
                player.y + Math.sin(angle) * distance,
                '🔥',
                { fontSize: '18px' }
            ).setOrigin(0.5);
            
            // 旋轉動畫
            this.tweens.add({
                targets: flame,
                x: {
                    getEnd: () => player.x + Math.cos(angle + Math.PI * 2) * distance
                },
                y: {
                    getEnd: () => player.y + Math.sin(angle + Math.PI * 2) * distance
                },
                duration: 2000,
                repeat: 2,
                ease: 'Linear',
                onUpdate: (tween, target) => {
                    const progress = tween.progress;
                    const currentAngle = angle + progress * Math.PI * 2;
                    target.x = player.x + Math.cos(currentAngle) * distance;
                    target.y = player.y + Math.sin(currentAngle) * distance;
                },
                onComplete: () => flame.destroy()
            });
        }
    }
    
    // ⏱️ 創建凍結效果
    createFrozenEffect() {
        const enemy = this.enemySprite;
        
        // 冰晶碎裂效果
        for (let i = 0; i < 6; i++) {
            const shard = this.add.text(enemy.x, enemy.y, '❄️', {
                fontSize: '20px'
            }).setOrigin(0.5);
            
            const angle = (i / 6) * Math.PI * 2;
            const distance = 40;
            
            this.tweens.add({
                targets: shard,
                x: enemy.x + Math.cos(angle) * distance,
                y: enemy.y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0 },
                rotation: Math.random() * Math.PI,
                duration: 800,
                ease: 'Power2',
                onComplete: () => shard.destroy()
            });
        }
        
        // 凍結文字提示
        const frozenText = this.add.text(enemy.x, enemy.y - 80, '凍結！', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#00ffff',
            stroke: '#000080',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: frozenText,
            y: enemy.y - 120,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => frozenText.destroy()
        });
    }
    
    dealDamageToEnemy(damage) {
        this.enemyData.hp = Math.max(0, this.enemyData.hp - damage);
        
        // 更新血條
        const hpPercent = this.enemyData.hp / this.enemyData.maxHp;
        this.enemyHpBar.setScale(hpPercent, 1);
        
        // 受傷閃爍效果
        this.tweens.add({
            targets: this.enemySprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 3
        });
    }
    
    updatePlayerHpBar() {
        const hpPercent = this.playerData.hp / this.playerData.maxHp;
        this.playerHpBar.setScale(hpPercent, 1);
        
        // 改變顏色
        if (hpPercent < 0.3) {
            this.playerHpBar.setFillStyle(0xe74c3c);
        } else if (hpPercent < 0.6) {
            this.playerHpBar.setFillStyle(0xf39c12);
        } else {
            this.playerHpBar.setFillStyle(0x2ecc71);
        }
    }
    
    animateAttack(attacker, target) {
        // 攻擊者前移
        const originalX = attacker.x;
        const direction = attacker.x < target.x ? 1 : -1;
        
        this.tweens.add({
            targets: attacker,
            x: target.x - (50 * direction),
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                // 目標受擊震動
                this.tweens.add({
                    targets: target,
                    x: target.x + 10,
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
                
                // 播放攻擊特效
                this.createAttackEffect(target.x, target.y);
            }
        });
    }
    
    createAttackEffect(x, y) {
        // 基礎攻擊特效 - 閃光
        const flash = this.add.circle(x, y, 40, 0xffffff, 0.8);
        
        this.tweens.add({
            targets: flash,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 300,
            onComplete: () => flash.destroy()
        });
        
        // 傷害數字效果
        this.createDamageNumber(x, y, '💥');
    }
    
    createSkillEffect(skillType, targetX, targetY) {
        // 根據技能類型創建不同的特效
        switch(skillType) {
            case 'math':
                this.createMathEffect(targetX, targetY);
                break;
            case 'science':
                this.createScienceEffect(targetX, targetY);
                break;
            case 'english':
                this.createEnglishEffect(targetX, targetY);
                break;
            case 'general':
                this.createGeneralEffect(targetX, targetY);
                break;
            default:
                this.createAttackEffect(targetX, targetY);
        }
    }
    
    createMathEffect(x, y) {
        // 數學技能 - 計算符號和數字
        const symbols = ['+', '-', '×', '÷', '=', '∑', '√'];
        
        for (let i = 0; i < 8; i++) {
            const symbol = this.add.text(x, y, symbols[i % symbols.length], {
                fontSize: '24px',
                fill: '#3498db'
            }).setOrigin(0.5);
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 60;
            
            this.tweens.add({
                targets: symbol,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                duration: 600,
                ease: 'Power2',
                onComplete: () => symbol.destroy()
            });
        }
        
        // 中央閃光
        const flash = this.add.circle(x, y, 50, 0x3498db, 0.6);
        this.tweens.add({
            targets: flash,
            scale: { from: 0, to: 2 },
            alpha: { from: 0.6, to: 0 },
            duration: 500,
            onComplete: () => flash.destroy()
        });
    }
    
    createScienceEffect(x, y) {
        // 科學技能 - 元素和分子效果
        const elements = ['⚗️', '🔬', '🧪', '⚛️', '💨', '🔥', '💧'];
        
        for (let i = 0; i < 6; i++) {
            const element = this.add.text(x, y, elements[i % elements.length], {
                fontSize: '28px'
            }).setOrigin(0.5);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            
            this.tweens.add({
                targets: element,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                rotation: Math.PI * 2,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => element.destroy()
            });
        }
        
        // 能量爆發
        const burst = this.add.circle(x, y, 30, 0x2ecc71, 0.7);
        this.tweens.add({
            targets: burst,
            scale: { from: 1, to: 3 },
            alpha: { from: 0.7, to: 0 },
            duration: 600,
            onComplete: () => burst.destroy()
        });
    }
    
    createEnglishEffect(x, y) {
        // 英文技能 - 字母飛散效果
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < 10; i++) {
            const letter = this.add.text(x, y, letters[Math.floor(Math.random() * letters.length)], {
                fontSize: '20px',
                fill: '#f39c12'
            }).setOrigin(0.5);
            
            const angle = (i / 10) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            
            this.tweens.add({
                targets: letter,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 1.5 },
                duration: 700,
                ease: 'Power2',
                onComplete: () => letter.destroy()
            });
        }
        
        // 書本光環
        const bookGlow = this.add.circle(x, y, 40, 0xf39c12, 0.5);
        this.tweens.add({
            targets: bookGlow,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 0.5, to: 0 },
            duration: 600,
            onComplete: () => bookGlow.destroy()
        });
    }
    
    createGeneralEffect(x, y) {
        // 常識技能 - 盾牌和防護效果
        const shield = this.add.text(x, y, '🛡️', {
            fontSize: '60px'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: shield,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            rotation: Math.PI / 4,
            duration: 800,
            ease: 'Power2',
            onComplete: () => shield.destroy()
        });
        
        // 防護光環
        for (let i = 0; i < 4; i++) {
            const ring = this.add.circle(x, y, 30 + i * 20, 0x9b59b6, 0.3);
            
            this.tweens.add({
                targets: ring,
                scale: { from: 1, to: 1.5 },
                alpha: { from: 0.3, to: 0 },
                duration: 600,
                delay: i * 100,
                onComplete: () => ring.destroy()
            });
        }
    }
    
    createDamageNumber(x, y, text) {
        const damageText = this.add.text(x, y - 50, text, {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }
    
    createHealEffect(x, y) {
        // 治療特效
        const healIcon = this.add.text(x, y, '💚', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: healIcon,
            y: y - 60,
            alpha: 0,
            scale: { from: 1, to: 1.5 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => healIcon.destroy()
        });
        
        // 綠色粒子
        for (let i = 0; i < 6; i++) {
            const particle = this.add.circle(x, y, 5, 0x2ecc71);
            
            const angle = (i / 6) * Math.PI * 2;
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40 - 30,
                alpha: 0,
                duration: 800,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createCritEffect(x, y) {
        // 暴擊特效 - 紅色光芒爆發
        const critText = this.add.text(x, y - 80, '💥 CRIT!', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: critText,
            y: y - 150,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => critText.destroy()
        });
        
        // 紅色爆發光環
        for (let i = 0; i < 3; i++) {
            const ring = this.add.circle(x, y, 30 + i * 20, 0xff0000, 0.5);
            
            this.tweens.add({
                targets: ring,
                scale: { from: 1, to: 2.5 },
                alpha: { from: 0.5, to: 0 },
                duration: 600,
                delay: i * 100,
                onComplete: () => ring.destroy()
            });
        }
        
        // 火焰粒子
        for (let i = 0; i < 8; i++) {
            const flame = this.add.text(x, y, '🔥', {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            const angle = (i / 8) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            
            this.tweens.add({
                targets: flame,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 30,
                alpha: 0,
                rotation: Math.PI * 2,
                duration: 800,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => flame.destroy()
            });
        }
    }
    
    createVictoryEffect() {
        // 勝利特效
        for (let i = 0; i < 20; i++) {
            const confetti = this.add.text(
                Phaser.Math.Between(100, 700),
                600,
                ['🎉', '✨', '⭐', '🎊'][Math.floor(Math.random() * 4)],
                { fontSize: '24px' }
            ).setOrigin(0.5);
            
            this.tweens.add({
                targets: confetti,
                y: Phaser.Math.Between(100, 400),
                x: confetti.x + Phaser.Math.Between(-100, 100),
                rotation: Math.PI * 2,
                duration: Phaser.Math.Between(1000, 2000),
                ease: 'Power2',
                onComplete: () => confetti.destroy()
            });
        }
    }
    
    tryEscape() {
        this.hideActionButtons();
        
        // 🔥 逃跑重置連擊
        this.resetCombo();
        
        const escapeChance = 0.6; // 60%逃跑成功率
        
        if (Math.random() < escapeChance) {
            this.audio.playConfirm();
            this.showMessage('🏃 成功逃跑了！');
            this.audio.stopBgm(500);
            this.time.delayedCall(1500, () => {
                this.scene.start(this.returnScene);
            });
        } else {
            this.audio.playMiss();
            this.showMessage('❌ 逃跑失敗！');
            this.time.delayedCall(1500, () => {
                this.enemyTurn();
            });
        }
    }
    
    endBattle(victory) {
        this.battleEnded = true;

        if (victory) {
            // 基礎經驗值
            let expGain = 20;
            let goldGain = 10;

            // 🔥 連擊獎勵經驗值
            const comboExpBonus = Math.floor(this.maxCombo * 2);
            expGain += comboExpBonus;

            // Boss戰獎勵加成
            const isBoss = this.enemyData.isBoss || this.enemyData.type === 'boss' || this.enemyData.bossId;
            if (isBoss) {
                expGain = this.enemyData.exp || 100;  // Boss給大量經驗
                goldGain = this.enemyData.gold || 200; // Boss給大量金幣
                this.showMessage(`👑 擊敗Boss！獲得 ${expGain} 經驗值！最高連擊x${this.maxCombo}`);
            } else {
                // 🗡️ 暗影刺客有額外獎勵
                if (this.enemyData.isAssassin) {
                    expGain += 20; // 額外經驗
                    goldGain += 15; // 額外金幣
                    this.showMessage(`🗡️ 擊敗暗影刺客！獲得 ${expGain} 經驗值！最高連擊x${this.maxCombo}`);
                } else if (this.enemyData.isFireElemental) {
                    // 🔥 火焰元素額外獎勵
                    expGain += 25;
                    goldGain += 20;
                    this.showMessage(`🔥 擊敗火焰元素！獲得 ${expGain} 經驗值！最高連擊x${this.maxCombo}`);
                } else if (this.enemyData.isIceElemental) {
                    // ❄️ 冰霜元素額外獎勵
                    expGain += 30;
                    goldGain += 25;
                    this.showMessage(`❄️ 擊敗冰霜元素！獲得 ${expGain} 經驗值！最高連擊x${this.maxCombo}`);
                } else if (this.maxCombo > 0) {
                    this.showMessage(`🎉 戰鬥勝利！獲得 ${expGain} 經驗值！(連擊獎勵+${comboExpBonus})`);
                } else {
                    this.showMessage(`🎉 戰鬥勝利！獲得 ${expGain} 經驗值！`);
                }
            }

            // 🧪 應用雙倍經驗加成
            if (this.expBoostActive) {
                const boostedExp = Math.floor(expGain * this.expBoostMultiplier);
                const bonusExp = boostedExp - expGain;
                expGain = boostedExp;
                
                // 清除雙倍經驗狀態
                this.game.globals.expBoostActive = false;
                this.game.globals.expBoostMultiplier = 1;
                
                this.showMessage(`📈 雙倍經驗加成！額外獲得 +${bonusExp} 經驗值！`);
            }

            // 播放勝利音效
            this.audio.playVictory();

            // 🏆 成就：首次勝利
            AchievementSystem.checkAchievement(this.game, 'win_battle');
            
            // 🏆 成就：擊敗敵人
            AchievementSystem.checkAchievement(this.game, 'kill_enemy');
            
            // 🏆 成就：擊敗Boss
            if (isBoss) {
                AchievementSystem.checkAchievement(this.game, 'kill_boss');
            }
            
            // 🏆 成就：連擊記錄
            AchievementSystem.checkAchievement(this.game, 'combo', { combo: this.maxCombo });
            
            // 🏆 成就：獲得金幣
            AchievementSystem.checkAchievement(this.game, 'earn_gold', { amount: goldGain });

            // 勝利動畫
            this.tweens.add({
                targets: this.enemySprite,
                alpha: 0,
                scale: 0,
                duration: 500
            });

            // 檢查升級 - 使用新的100經驗值系統
            const levelUpResult = LevelUpScene.checkLevelUp(this.playerData, expGain);

            if (levelUpResult.leveledUp) {
                this.playerData.level = levelUpResult.newLevel;

                this.time.delayedCall(1500, () => {
                    this.audio.playLevelUp();
                    this.showMessage(`⭐ 升級了！達到等級 ${this.playerData.level}！最高連擊x${this.maxCombo}`);

                    // 🏆 成就：升級
                    AchievementSystem.checkAchievement(this.game, 'level_up', { level: this.playerData.level });

                    // 延遲後進入升級場景
                    this.time.delayedCall(2000, () => {
                        this.scene.launch('LevelUpScene', {
                            player: this.playerData,
                            newLevel: this.playerData.level,
                            onComplete: (result) => {
                                this.scene.stop('LevelUpScene');
                                this.returnToWorld();
                            }
                        });
                    });
                });
            } else {
                // 沒升級，直接返回
                this.time.delayedCall(3000, () => {
                    this.returnToWorld();
                });
            }
        } else {
            // 失敗
            this.audio.playDefeat();
            this.showMessage('💀 戰鬥失敗...');
            this.playerData.hp = Math.floor(this.playerData.maxHp * 0.3); // 保留30% HP

            this.time.delayedCall(3000, () => {
                this.returnToWorld();
            });
        }

        // 保存數據
        this.game.globals.playerHP = this.playerData.hp;
        this.game.globals.playerExp = this.playerData.exp;
        this.game.globals.playerLevel = this.playerData.level;
    }

    returnToWorld() {
        // 返回世界地圖
        this.scene.start(this.returnScene);
    }
    
    showMessage(text) {
        this.battleMessage.setText(text);
        
        // 文字彈出效果
        this.tweens.add({
            targets: this.battleMessage,
            scale: { from: 0.8, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }
}
