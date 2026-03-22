/**
 * VillageScene - 村莊場景
 * 安全區域，提供存檔、商店、任務NPC等功能
 */

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    init(data) {
        this.playerStartX = data.playerX || 400;
        this.playerStartY = data.playerY || 500;
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
        
        // 播放城鎮背景音樂
        this.audio.playTownBgm();
        
        // 創建村莊地圖
        this.createVillageMap();
        
        // 創建玩家
        this.createPlayer();
        
        // 創建NPC
        this.createNPCs();
        
        // 創建場景切換點
        this.createTransitionPoints();
        
        // 設置相機
        this.setupCamera();
        
        // 創建UI
        this.createUI();
        
        // 設置輸入
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-I', () => {
            this.openInventory();
        });
        this.input.keyboard.on('keydown-Q', () => {
            this.openQuestLog();
        });
        
        // 歡迎訊息
        this.showWelcomeMessage();
    }

    createVillageMap() {
        const mapWidth = 30;
        const mapHeight = 22;
        const tileSize = 32;

        // 創建地面
        this.groundLayer = this.add.group();
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;
                
                // 村莊地板 - 石板路
                let tileType = 'tile-stone';
                
                // 草地邊緣
                if (x < 3 || x >= mapWidth - 3 || y < 3 || y >= mapHeight - 3) {
                    tileType = 'tile-grass';
                }
                
                const tile = this.add.image(worldX, worldY, tileType);
                tile.setDepth(0);
                this.groundLayer.add(tile);
            }
        }

        // 創建建築物和裝飾
        this.decorations = this.physics.add.staticGroup();
        
        // 村長房屋
        this.createBuilding(200, 150, '村長家', 0x8B4513);
        
        // 商店
        this.createBuilding(600, 150, '雜貨店', 0xD2691E);
        
        // 鐵匠鋪
        this.createBuilding(200, 400, '鐵匠鋪', 0x696969);
        
        // 治療所
        this.createBuilding(600, 400, '治療所', 0xFFB6C1);
        
        // 邊界牆
        for (let x = 0; x < mapWidth; x++) {
            this.decorations.create(x * tileSize + 16, 16, 'tile-wood');
            this.decorations.create(x * tileSize + 16, (mapHeight - 1) * tileSize + 16, 'tile-wood');
        }
        for (let y = 1; y < mapHeight - 1; y++) {
            this.decorations.create(16, y * tileSize + 16, 'tile-wood');
            this.decorations.create((mapWidth - 1) * tileSize + 16, y * tileSize + 16, 'tile-wood');
        }

        // 存檔點 - 女神像
        this.savePoint = this.physics.add.staticSprite(400, 280, 'tile-wood');
        this.savePoint.setTint(0xFFD700);
        
        // 存檔點光效
        this.tweens.add({
            targets: this.savePoint,
            scale: { from: 1, to: 1.1 },
            alpha: { from: 1, to: 0.7 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 設置世界邊界
        this.physics.world.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
    }

    createBuilding(x, y, name, color) {
        // 建築主體
        const building = this.add.rectangle(x, y, 120, 100, color);
        building.setStrokeStyle(3, 0x000000);
        
        // 門
        const door = this.add.rectangle(x, y + 30, 40, 40, 0x4a2c2a);
        
        // 建築名稱
        const nameText = this.add.text(x, y - 40, name, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
        
        // 將建築添加到碰撞組
        this.decorations.add(building);
    }

    createPlayer() {
        // 創建玩家精靈
        this.player = this.physics.add.sprite(this.playerStartX, this.playerStartY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // 碰撞檢測
        this.physics.add.collider(this.player, this.decorations);
        
        // 存檔點檢測
        this.physics.add.overlap(this.player, this.savePoint, this.onSavePoint, null, this);
    }

    createNPCs() {
        this.npcs = this.physics.add.staticGroup();
        
        // 村長
        this.createNPC(200, 220, 'village_chief', '🧑‍🦳', '村長', 0xFFD700);
        
        // 商人
        this.createNPC(600, 220, 'merchant', '👨‍💼', '商人', 0x00CED1);
        
        // 鐵匠
        this.createNPC(200, 470, 'blacksmith', '👨‍🔧', '鐵匠', 0xB8860B);
        
        // 治療師
        this.createNPC(600, 470, 'healer', '👩‍⚕️', '治療師', 0xFF69B4);
        
        // 任務公告板
        this.createNPC(400, 100, 'quest_board', '📋', '任務公告', 0x8B4513);
    }

    createNPC(x, y, id, emoji, name, color) {
        const npc = this.npcs.create(x, y, 'tile-wood');
        npc.setTint(color);
        npc.npcId = id;
        npc.npcName = name;
        npc.npcEmoji = emoji;
        
        // NPC表情
        const emojiText = this.add.text(x, y - 20, emoji, {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // NPC名稱
        const nameText = this.add.text(x, y + 25, name, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        
        // 對話提示動畫
        this.tweens.add({
            targets: emojiText,
            y: y - 25,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        return npc;
    }

    createTransitionPoints() {
        this.transitions = this.physics.add.staticGroup();
        
        // 前往森林的出口
        const forestExit = this.transitions.create(400, 700, 'tile-wood');
        forestExit.setTint(0x228B22);
        forestExit.targetScene = 'ForestScene';
        forestExit.targetX = 400;
        forestExit.targetY = 50;
        
        // 出口標記
        const exitText = this.add.text(400, 665, '🌲 前往森林', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
        
        // 檢測場景切換
        this.physics.add.overlap(this.player, this.transitions, this.onTransition, null, this);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, 960, 704);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);
    }

    createUI() {
        const uiContainer = this.add.container(10, 10);
        uiContainer.setScrollFactor(0);
        uiContainer.setDepth(100);

        // 狀態面板背景
        const panelBg = this.add.rectangle(0, 0, 220, 120, 0x000000, 0.7);
        panelBg.setOrigin(0, 0);
        uiContainer.add(panelBg);

        // 玩家名稱
        this.uiName = this.add.text(10, 10, '🏠 村莊 (安全區)', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#2ecc71'
        });
        uiContainer.add(this.uiName);

        // 等級和職業
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

        // 快捷鍵提示
        const hintText = this.add.text(400, 570, '[I] 背包  [Q] 任務  [方向鍵] 移動', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        hintText.setScrollFactor(0);
        hintText.setDepth(100);

        // 存檔提示
        this.saveText = this.add.text(400, 300, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#2ecc71'
        }).setOrigin(0.5);
        this.saveText.setScrollFactor(0);
        this.saveText.setDepth(100);
    }

    update() {
        // 玩家移動
        const speed = 160;
        let isMoving = false;
        
        this.player.setVelocity(0);
        
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            isMoving = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            isMoving = true;
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
            isMoving = true;
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
            isMoving = true;
        }
        
        // 播放腳步聲（限制頻率）
        if (isMoving && !this.footstepTimer) {
            this.audio.playFootstep();
            this.footstepTimer = this.time.delayedCall(300, () => {
                this.footstepTimer = null;
            });
        }

        // 檢測NPC互動
        this.checkNPCInteraction();
        
        // 更新UI
        this.updateUI();
    }

    checkNPCInteraction() {
        // 檢查是否靠近NPC
        let nearNPC = null;
        
        this.npcs.children.entries.forEach(npc => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                npc.x, npc.y
            );
            
            if (distance < 50) {
                nearNPC = npc;
            }
        });
        
        if (nearNPC && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.interactWithNPC(nearNPC);
        }
    }

    interactWithNPC(npc) {
        switch (npc.npcId) {
            case 'village_chief':
                this.showDialog(`${npc.npcEmoji} 村長：「歡迎來到我們的村莊，勇者！
如果你準備好了，可以去森林調查怪物的騷動。」`);
                break;
            case 'merchant':
                this.openShop();
                break;
            case 'blacksmith':
                this.showDialog(`${npc.npcEmoji} 鐵匠：「需要修理裝備嗎？
或者你想買點新的武器和護甲？」`);
                break;
            case 'healer':
                this.healPlayer();
                break;
            case 'quest_board':
                this.openQuestLog();
                break;
        }
    }

    healPlayer() {
        this.playerData.hp = this.playerData.maxHp;
        this.playerData.mp = this.playerData.maxMp;
        
        this.showDialog('👩‍⚕️ 治療師：「讓我為你治療...好了！\n你的HP和MP已經完全恢復了！」');
        
        // 更新全局數據
        this.game.globals.playerHP = this.playerData.hp;
        this.game.globals.playerMP = this.playerData.mp;
        
        // 治療特效
        this.createHealEffect(this.player.x, this.player.y);
    }

    createHealEffect(x, y) {
        const healParticles = this.add.particles(x, y, 'tile-grass', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0x00FF00,
            lifespan: 1000,
            quantity: 20
        });
        
        this.time.delayedCall(1000, () => {
            healParticles.destroy();
        });
    }

    onSavePoint(player, savePoint) {
        if (!this.saveCooldown) {
            this.saveGame();
            this.saveCooldown = true;
            this.time.delayedCall(3000, () => {
                this.saveCooldown = false;
            });
        }
    }

    saveGame() {
        const saveData = {
            playerHP: this.playerData.hp,
            playerMaxHP: this.playerData.maxHp,
            playerMP: this.playerData.mp,
            playerMaxMP: this.playerData.maxMp,
            playerLevel: this.playerData.level,
            playerExp: this.playerData.exp,
            playerGold: this.playerData.gold,
            currentMap: 'village',
            playerX: this.player.x,
            playerY: this.player.y,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lng-save', JSON.stringify(saveData));
        
        // 播放存檔音效
        this.audio.playSave();
        
        // 顯示存檔提示
        this.saveText.setText('💾 已保存進度');
        this.tweens.add({
            targets: this.saveText,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onComplete: () => {
                this.saveText.setText('').setAlpha(1);
            }
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

    openShop() {
        this.scene.launch('ShopScene', {
            player: this.playerData,
            onClose: () => {
                this.scene.stop('ShopScene');
            }
        });
    }

    openInventory() {
        // 啟動道具系統場景
        this.scene.launch('InventorySystem', {
            player: this.playerData,
            onClose: () => {
                this.scene.stop('InventorySystem');
            }
        });
    }

    openQuestLog() {
        this.scene.launch('QuestSystem', {
            mode: 'log',
            onClose: () => {
                this.scene.stop('QuestSystem');
            }
        });
    }

    updateUI() {
        this.uiHpText.setText(`❤️ ${this.playerData.hp}/${this.playerData.maxHp}`);
        this.uiMpText.setText(`💧 ${this.playerData.mp}/${this.playerData.maxMp}`);
        this.uiGold.setText(`💰 ${this.playerData.gold}G`);
        this.uiLevel.setText(`Lv.${this.playerData.level} 勇者`);
    }

    showDialog(message) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const dialog = this.add.container(width / 2, height - 100);
        dialog.setScrollFactor(0);
        dialog.setDepth(200);
        
        const bg = this.add.rectangle(0, 0, 700, 120, 0x000000, 0.9);
        bg.setStrokeStyle(2, 0xffffff);
        
        const text = this.add.text(0, 0, message, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 650 }
        }).setOrigin(0.5);
        
        const hint = this.add.text(0, 40, '(按空白鍵繼續)', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        
        dialog.add([bg, text, hint]);
        
        // 按空白鍵關閉
        const closeHandler = () => {
            dialog.destroy();
            this.input.keyboard.off('keydown-SPACE', closeHandler);
        };
        
        this.input.keyboard.on('keydown-SPACE', closeHandler);
    }

    showWelcomeMessage() {
        const welcomeText = this.add.text(400, 200, '🏠 歡迎來到新手村莊！\n\n這裡是安全區域，可以：\n💾 在金色神像處存檔\n🛒 與商人交易\n💚 在治療所恢復HP/MP\n📋 查看任務公告', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        welcomeText.setScrollFactor(0);
        welcomeText.setDepth(100);
        
        this.tweens.add({
            targets: welcomeText,
            alpha: 0,
            delay: 5000,
            duration: 1000,
            onComplete: () => welcomeText.destroy()
        });
    }
}
