/**
 * BossScene - Boss戰場景
 * 與強大Boss的戰鬥區域
 */

class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    init(data) {
        this.playerStartX = data.playerX || 100;
        this.playerStartY = data.playerY || 300;
        this.playerData = data.player || this.getDefaultPlayerData();
    }

    getDefaultPlayerData() {
        return {
            hp: this.game.globals.playerHP,
            maxHp: this.game.globals.playerMaxHP,
            mp: this.game.globals.playerMP,
            maxMp: this.game.globals.playerMaxMP,
            level: this.game.globals.playerLevel,
            exp: this.game.globals.playerExp,
            gold: this.game.globals.playerGold || 0
        };
    }

    create() {
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 創建Boss戰場地
        this.createBossArena();
        
        // 創建玩家
        this.createPlayer();
        
        // 創建Boss
        this.createBoss();
        
        // 創建場景切換點
        this.createTransitionPoints();
        
        // 設置相機
        this.setupCamera();
        
        // 創建UI
        this.createUI();
        
        // 設置輸入
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Boss戰開始提示
        this.showBossWarning();
    }

    createBossArena() {
        const mapWidth = 30;
        const mapHeight = 20;
        const tileSize = 32;

        // 創建地面 - 黑暗祭壇風格
        this.groundLayer = this.add.group();
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;
                
                // 祭壇地面
                let tileType = 'tile-stone';
                let tint = 0x444444;
                
                // 祭壇中心區域
                const centerX = mapWidth / 2;
                const centerY = mapHeight / 2;
                const distFromCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                );
                
                if (distFromCenter < 5) {
                    tint = 0x8B0000; // 紅色祭壇
                } else if (distFromCenter < 8) {
                    tint = 0x444444; // 灰色過渡
                }
                
                const tile = this.add.image(worldX, worldY, tileType);
                tile.setTint(tint);
                tile.setDepth(0);
                this.groundLayer.add(tile);
            }
        }

        // 創建祭壇裝飾
        this.decorations = this.physics.add.staticGroup();
        
        // 祭壇四角的柱子
        const pillarPositions = [
            { x: 8, y: 6 },
            { x: 22, y: 6 },
            { x: 8, y: 14 },
            { x: 22, y: 14 }
        ];
        
        pillarPositions.forEach(pos => {
            const pillar = this.decorations.create(
                pos.x * tileSize + 16,
                pos.y * tileSize + 16,
                'tile-wood'
            );
            pillar.setTint(0x4a0e0e);
            
            // 柱子裝飾
            const pillarIcon = this.add.text(
                pos.x * tileSize + 16,
                pos.y * tileSize + 5,
                '🕯️', {
                    fontSize: '24px'
                }
            ).setOrigin(0.5);
            pillarIcon.setDepth(5);
        });
        
        // 邊界牆
        for (let x = 0; x < mapWidth; x++) {
            this.createWall(x * tileSize + 16, 16);
            this.createWall(x * tileSize + 16, (mapHeight - 1) * tileSize + 16);
        }
        for (let y = 1; y < mapHeight - 1; y++) {
            this.createWall(16, y * tileSize + 16);
            this.createWall((mapWidth - 1) * tileSize + 16, y * tileSize + 16);
        }

        // 設置世界邊界
        this.physics.world.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
        
        // 環境光效
        this.createAtmosphericEffects();
    }

    createWall(x, y) {
        const wall = this.decorations.create(x, y, 'tile-wood');
        wall.setTint(0x1a1a1a);
        
        // 牆壁裝飾
        const wallIcon = this.add.text(x, y - 5, '⬛', {
            fontSize: '28px'
        }).setOrigin(0.5);
        wallIcon.setDepth(5);
    }

    createAtmosphericEffects() {
        // 黑暗粒子效果
        this.time.addEvent({
            delay: 500,
            callback: () => {
                const x = Phaser.Math.Between(100, 860);
                const y = Phaser.Math.Between(100, 540);
                
                const particle = this.add.text(x, y, '💨', {
                    fontSize: '16px',
                    alpha: 0.5
                }).setOrigin(0.5);
                
                this.tweens.add({
                    targets: particle,
                    y: y - 50,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => particle.destroy()
                });
            },
            loop: true
        });
        
        // 祭壇中心的光芒
        const centerX = 480;
        const centerY = 320;
        
        const glow = this.add.circle(centerX, centerY, 100, 0xff0000, 0.1);
        glow.setDepth(1);
        
        this.tweens.add({
            targets: glow,
            scale: { from: 1, to: 1.3 },
            alpha: { from: 0.1, to: 0.3 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(this.playerStartX, this.playerStartY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // 碰撞檢測
        this.physics.add.collider(this.player, this.decorations);
    }

    createBoss() {
        const centerX = 480;
        const centerY = 280;
        
        // 根據玩家等級選擇Boss
        if (this.playerData.level >= 12) {
            this.createDarkDragon(centerX, centerY);
        } else {
            this.createForestGuardian(centerX, centerY);
        }
    }

    createForestGuardian(x, y) {
        this.boss = this.physics.add.sprite(x, y, 'boss-forest');
        this.boss.setScale(2.5);
        this.boss.setDepth(10);
        
        // Boss數據
        this.bossData = {
            id: 'forest_guardian',
            name: '森林守護者',
            nameEn: 'Forest Guardian',
            hp: 300,
            maxHp: 300,
            attack: 25,
            defense: 15,
            exp: 300,
            gold: 200,
            phase: 1,
            maxPhase: 2,
            abilities: [
                { name: 'nature_wrath', displayName: '自然之怒', damage: 35, cooldown: 3 },
                { name: 'heal', displayName: '生命恢復', heal: 50, cooldown: 4 },
                { name: 'summon', displayName: '召喚狼群', cooldown: 5 }
            ]
        };
        
        // Boss外觀
        this.bossIcon = this.add.text(x, y - 60, '🌳', {
            fontSize: '64px'
        }).setOrigin(0.5);
        this.bossIcon.setDepth(10);
        
        // Boss名稱
        this.bossNameText = this.add.text(x, y - 100, '森林守護者', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.bossNameText.setDepth(100);
        
        // Boss懸浮動畫
        this.tweens.add({
            targets: [this.boss, this.bossIcon],
            y: y + 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Boss遭遇檢測
        this.physics.add.overlap(this.player, this.boss, this.encounterBoss, null, this);
    }

    createDarkDragon(x, y) {
        this.boss = this.physics.add.sprite(x, y, 'boss-dragon');
        this.boss.setScale(3);
        this.boss.setDepth(10);
        
        // Boss數據
        this.bossData = {
            id: 'dark_dragon',
            name: '暗影巨龍',
            nameEn: 'Shadow Dragon',
            hp: 500,
            maxHp: 500,
            attack: 40,
            defense: 20,
            exp: 500,
            gold: 500,
            phase: 1,
            maxPhase: 3,
            abilities: [
                { name: 'shadow_breath', displayName: '暗影吐息', damage: 50, cooldown: 3 },
                { name: 'dark_barrier', displayName: '黑暗屏障', defense: 10, duration: 2, cooldown: 5 },
                { name: 'soul_drain', displayName: '靈魂吸取', damage: 25, heal: 25, cooldown: 4 }
            ]
        };
        
        // Boss外觀
        this.bossIcon = this.add.text(x, y - 80, '🐉', {
            fontSize: '80px'
        }).setOrigin(0.5);
        this.bossIcon.setDepth(10);
        
        // Boss名稱
        this.bossNameText = this.add.text(x, y - 130, '暗影巨龍', {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#8B0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.bossNameText.setDepth(100);
        
        // Boss懸浮動畫
        this.tweens.add({
            targets: [this.boss, this.bossIcon],
            y: y + 15,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Boss遭遇檢測
        this.physics.add.overlap(this.player, this.boss, this.encounterBoss, null, this);
    }

    createTransitionPoints() {
        this.transitions = this.physics.add.staticGroup();
        
        // 返回森林的入口
        const forestExit = this.transitions.create(50, 300, 'tile-wood');
        forestExit.setTint(0x228B22);
        forestExit.targetScene = 'ForestScene';
        forestExit.targetX = 980;
        forestExit.targetY = 300;
        
        // 出口標記
        const exitText = this.add.text(50, 270, '🌲 返回森林', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        
        // 檢測場景切換
        this.physics.add.overlap(this.player, this.transitions, this.onTransition, null, this);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, 960, 640);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);
        
        // 暗角效果
        const vignette = this.add.rectangle(400, 300, 800, 600, 0x000000, 0);
        vignette.setScrollFactor(0);
        vignette.setDepth(50);
        
        this.tweens.add({
            targets: vignette,
            alpha: { from: 0, to: 0.3 },
            duration: 2000
        });
    }

    createUI() {
        const uiContainer = this.add.container(10, 10);
        uiContainer.setScrollFactor(0);
        uiContainer.setDepth(100);

        // 狀態面板背景
        const panelBg = this.add.rectangle(0, 0, 220, 120, 0x000000, 0.8);
        panelBg.setOrigin(0, 0);
        uiContainer.add(panelBg);

        // 區域標識
        this.uiName = this.add.text(10, 10, '🔥 Boss區域 (極危險)', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff0000'
        });
        uiContainer.add(this.uiName);

        // 等級
        this.uiLevel = this.add.text(10, 35, `Lv.${this.playerData.level} 勇者`, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        });
        uiContainer.add(this.uiLevel);

        // HP條
        this.uiHpText = this.add.text(10, 55, `❤️ ${this.playerData.hp}/${this.playerData.maxHp}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff6b6b'
        });
        uiContainer.add(this.uiHpText);

        // MP條
        this.uiMpText = this.add.text(10, 75, `💧 ${this.playerData.mp}/${this.playerData.maxMp}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#74b9ff'
        });
        uiContainer.add(this.uiMpText);

        // 金錢
        this.uiGold = this.add.text(10, 95, `💰 ${this.playerData.gold}G`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        });
        uiContainer.add(this.uiGold);

        // Boss狀態（戰鬥時顯示）
        this.bossStatusContainer = this.add.container(550, 10);
        this.bossStatusContainer.setScrollFactor(0);
        this.bossStatusContainer.setDepth(100);
        this.bossStatusContainer.setVisible(false);
        
        const bossBg = this.add.rectangle(0, 0, 200, 60, 0x000000, 0.8);
        bossBg.setOrigin(0, 0);
        this.bossStatusContainer.add(bossBg);
        
        this.bossHpText = this.add.text(10, 10, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c'
        });
        this.bossStatusContainer.add(this.bossHpText);
        
        this.bossPhaseText = this.add.text(10, 35, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f39c12'
        });
        this.bossStatusContainer.add(this.bossPhaseText);
    }

    update() {
        // 玩家移動
        const speed = 160;
        
        this.player.setVelocity(0);
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        }

        // 更新UI
        this.updateUI();
    }

    encounterBoss(player, boss) {
        if (this.bossEncountered) return;
        this.bossEncountered = true;
        
        // 進入Boss戰
        this.bossStatusContainer.setVisible(true);
        
        // 停止玩家移動
        this.player.setVelocity(0);
        
        // Boss戰特殊數據
        const bossBattleData = {
            type: 'boss',
            bossId: this.bossData.id,
            name: this.bossData.name,
            hp: this.bossData.hp,
            maxHp: this.bossData.maxHp,
            attack: this.bossData.attack,
            defense: this.bossData.defense,
            exp: this.bossData.exp,
            gold: this.bossData.gold,
            phase: this.bossData.phase,
            maxPhase: this.bossData.maxPhase,
            abilities: this.bossData.abilities
        };
        
        // 切換到戰鬥場景
        this.scene.start('BattleScene', {
            player: this.playerData,
            enemy: bossBattleData,
            isBossBattle: true,
            returnScene: 'BossScene',
            returnX: 100,
            returnY: 300
        });
    }

    onTransition(player, transition) {
        // 保存當前數據
        this.game.globals.playerHP = this.playerData.hp;
        this.game.globals.playerMP = this.playerData.mp;
        
        // 切換場景
        this.scene.start(transition.targetScene, {
            playerX: transition.targetX,
            playerY: transition.targetY,
            player: this.playerData
        });
    }

    updateUI() {
        this.uiHpText.setText(`❤️ ${this.playerData.hp}/${this.playerData.maxHp}`);
        this.uiMpText.setText(`💧 ${this.playerData.mp}/${this.playerData.maxMp}`);
        this.uiGold.setText(`💰 ${this.playerData.gold}G`);
        
        if (this.bossData) {
            this.bossHpText.setText(`👹 ${this.bossData.name}`);
            this.bossPhaseText.setText(`階段: ${this.bossData.phase}/${this.bossData.maxPhase}`);
        }
    }

    showBossWarning() {
        const warningContainer = this.add.container(400, 300);
        warningContainer.setScrollFactor(0);
        warningContainer.setDepth(200);
        
        // 警告背景
        const bg = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.9);
        bg.setStrokeStyle(3, 0xff0000);
        
        // 警告標題
        const title = this.add.text(0, -50, '⚠️ 警告 ⚠️', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ff0000'
        }).setOrigin(0.5);
        
        // 警告內容
        const content = this.add.text(0, 0, `即將進入Boss戰！\n\n${this.bossData ? this.bossData.name : '未知Boss'}正在等待...\n建議等級: ${this.playerData.level >= 12 ? '12+' : '8+'}`, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // 提示
        const hint = this.add.text(0, 60, '(靠近Boss開始戰鬥)', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        
        warningContainer.add([bg, title, content, hint]);
        
        // 警告音效動畫
        this.tweens.add({
            targets: bg,
            strokeColor: { from: 0xff0000, to: 0x8B0000 },
            duration: 500,
            yoyo: true,
            repeat: 3
        });
        
        // 3秒後自動消失
        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: warningContainer,
                alpha: 0,
                duration: 500,
                onComplete: () => warningContainer.destroy()
            });
        });
    }
}
