/**
 * WorldScene - 世界地圖場景
 * 玩家可以在此探索、移動、進入戰鬥
 */

class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
    }

    create() {
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 播放世界地圖背景音樂
        this.audio.playWorldBgm();
        
        // 創建地圖
        this.createMap();
        
        // 創建敵人（必須在玩家之前，因為玩家創建時會引用敵人組）
        this.createEnemies();
        
        // 創建玩家
        this.createPlayer();
        
        // 創建場景切換點（必須在玩家之後，因為需要設置碰撞檢測）
        this.createTransitionPoints();
        
        // 設置玩家與切換點的碰撞檢測
        this.physics.add.overlap(this.player, this.transitions, this.onTransition, null, this);
        
        // 設置相機
        this.setupCamera();
        
        // 創建UI
        this.createUI();
        
        // 設置輸入
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 自動存檔
        this.time.addEvent({
            delay: 30000, // 每30秒
            callback: this.autoSave,
            callbackScope: this,
            loop: true
        });
        
        // 歡迎訊息
        this.showWelcomeMessage();
    }
    
    createMap() {
        // 創建簡單的草地地圖
        const mapWidth = 25;
        const mapHeight = 19;
        const tileSize = 32;
        
        // 創建地圖群組
        this.groundLayer = this.add.group();
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;
                
                // 隨機草地變化
                const grassType = Math.random() > 0.8 ? 'tile-stone' : 'tile-grass';
                const tile = this.add.image(worldX, worldY, grassType);
                tile.setDepth(0);
                this.groundLayer.add(tile);
            }
        }
        
        // 添加一些裝飾（樹木/石頭）
        this.decorations = this.physics.add.staticGroup();
        
        // 邊界牆
        for (let x = 0; x < mapWidth; x++) {
            this.decorations.create(x * tileSize + 16, 16, 'tile-wood');
            this.decorations.create(x * tileSize + 16, (mapHeight - 1) * tileSize + 16, 'tile-wood');
        }
        for (let y = 1; y < mapHeight - 1; y++) {
            this.decorations.create(16, y * tileSize + 16, 'tile-wood');
            this.decorations.create((mapWidth - 1) * tileSize + 16, y * tileSize + 16, 'tile-wood');
        }
        
        // 設置世界邊界
        this.physics.world.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
    }
    
    createTransitionPoints() {
        this.transitions = this.physics.add.staticGroup();
        
        // 前往森林的入口（需要等級3以上）
        if (this.game.globals.playerLevel >= 3) {
            const forestExit = this.transitions.create(780, 300, 'tile-wood');
            forestExit.setTint(0x228B22);
            forestExit.targetScene = 'ForestScene';
            forestExit.targetX = 50;
            forestExit.targetY = 300;
            
            // 森林標記
            const forestText = this.add.text(730, 270, '🌲 森林', {
                fontSize: '14px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ffffff',
                backgroundColor: '#00000088',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
        }
        
        // 前往Boss區域（需要等級8以上）
        if (this.game.globals.playerLevel >= 8) {
            const bossExit = this.transitions.create(400, 50, 'tile-wood');
            bossExit.setTint(0x8B0000);
            bossExit.targetScene = 'BossScene';
            bossExit.targetX = 100;
            bossExit.targetY = 300;
            
            // Boss標記
            const bossText = this.add.text(400, 75, '🔥 Boss區域', {
                fontSize: '14px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ff0000',
                backgroundColor: '#00000088',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
        }
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
    
    createPlayer() {
        // 創建玩家精靈
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        
        // 玩家數據
        this.playerData = {
            hp: this.game.globals.playerHP,
            maxHp: this.game.globals.playerMaxHP,
            mp: this.game.globals.playerMP,
            maxMp: this.game.globals.playerMaxMP,
            level: this.game.globals.playerLevel,
            exp: this.game.globals.playerExp
        };
        
        // 碰撞檢測
        this.physics.add.collider(this.player, this.decorations);
        
        // 敵人碰撞（進入戰鬥）
        this.physics.add.overlap(this.player, this.enemies, this.encounterEnemy, null, this);
        
        // 注意：場景切換點碰撞在 create() 中統一設置
    }
    
    createEnemies() {
        this.enemies = this.physics.add.group();
        
        // 在地圖上隨機放置敵人
        const enemyTypes = ['enemy-slime', 'enemy-goblin', 'enemy-mage'];
        
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(100, 500);
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            const enemy = this.enemies.create(x, y, type);
            enemy.setDepth(5);
            enemy.enemyType = type;
            
            // 簡單的巡邏AI
            this.tweens.add({
                targets: enemy,
                x: x + Phaser.Math.Between(-50, 50),
                y: y + Phaser.Math.Between(-50, 50),
                duration: 2000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    setupCamera() {
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);
    }
    
    createUI() {
        const uiContainer = this.add.container(10, 10);
        uiContainer.setScrollFactor(0);
        uiContainer.setDepth(100);
        
        // 狀態面板背景
        const panelBg = this.add.rectangle(0, 0, 220, 130, 0x000000, 0.7);
        panelBg.setOrigin(0, 0);
        uiContainer.add(panelBg);
        
        // 玩家名稱
        this.uiName = this.add.text(10, 10, '勇者', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#feca57'
        });
        uiContainer.add(this.uiName);
        
        // 等級
        this.uiLevel = this.add.text(10, 35, `Lv.${this.playerData.level}`, {
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
        
        // EXP條 - 新系統：每100升一級
        const expPercent = Math.floor((this.playerData.exp / 100) * 100);
        this.uiExpText = this.add.text(10, 95, `⭐ EXP: ${this.playerData.exp}/100 (${expPercent}%)`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        });
        uiContainer.add(this.uiExpText);
        
        // 攻擊力顯示
        const attack = this.game.globals.playerAttack || (10 + (this.playerData.level - 1) * 2);
        this.uiAttackText = this.add.text(10, 115, `⚔️ 攻擊: ${attack}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e67e22'
        });
        uiContainer.add(this.uiAttackText);
        
        // 存檔提示
        this.saveText = this.add.text(400, 550, '', {
            fontSize: '14px',
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
        
        // 播放腳步聲（限制頻率避免過多音效）
        if (isMoving && !this.footstepTimer) {
            this.audio.playFootstep();
            this.footstepTimer = this.time.delayedCall(300, () => {
                this.footstepTimer = null;
            });
        }
    }
    
    encounterEnemy(player, enemy) {
        // 播放遭遇音效
        this.audio.playEncounter();
        
        // 進入戰鬥
        const enemyData = {
            type: enemy.enemyType,
            name: this.getEnemyName(enemy.enemyType),
            hp: 50,
            maxHp: 50
        };
        
        // 停止玩家移動
        this.player.setVelocity(0);
        
        // 切換到戰鬥場景
        this.scene.start('BattleScene', {
            player: this.playerData,
            enemy: enemyData,
            returnScene: 'WorldScene'
        });
        
        // 移除這個敵人（稍後重生）
        enemy.destroy();
    }
    
    getEnemyName(type) {
        const names = {
            'enemy-slime': '史萊姆',
            'enemy-goblin': '哥布林',
            'enemy-mage': '黑暗法師'
        };
        return names[type] || '神秘怪物';
    }
    
    autoSave() {
        // 保存遊戲數據
        const saveData = {
            playerHP: this.playerData.hp,
            playerMaxHP: this.playerData.maxHp,
            playerMP: this.playerData.mp,
            playerMaxMP: this.playerData.maxMp,
            playerLevel: this.playerData.level,
            playerExp: this.playerData.exp,
            currentMap: this.game.globals.currentMap,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lng-save', JSON.stringify(saveData));
        
        // 播放存檔音效
        this.audio.playSave();
        
        // 顯示存檔提示
        this.saveText.setText('💾 已自動存檔');
        this.time.delayedCall(2000, () => {
            this.saveText.setText('');
        });
    }
    
    showWelcomeMessage() {
        const welcomeText = this.add.text(400, 200, '🌍 歡迎來到新世代傳說！\n使用方向鍵移動，遭遇敵人進入戰鬥！', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        welcomeText.setScrollFactor(0);
        welcomeText.setDepth(100);
        
        // 3秒後消失
        this.tweens.add({
            targets: welcomeText,
            alpha: 0,
            delay: 3000,
            duration: 1000,
            onComplete: () => welcomeText.destroy()
        });
    }
}
