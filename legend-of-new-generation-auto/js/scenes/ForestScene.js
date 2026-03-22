/**
 * ForestScene - 森林場景
 * 野外區域，有更強大的敵人
 * v1.11.0 - 新增毒液蜘蛛敵人
 */

class ForestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ForestScene' });
    }

    init(data) {
        this.playerStartX = data.playerX || 400;
        this.playerStartY = data.playerY || 50;
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
        
        // 播放世界地圖背景音樂
        this.audio.playWorldBgm();
        
        // 創建森林地圖
        this.createForestMap();
        
        // 🌧️ 初始化天氣系統
        this.weather = new WeatherSystem(this);
        this.weather.init();
        
        // 創建玩家
        this.createPlayer();
        
        // 創建敵人
        this.createEnemies();
        
        // 創建場景切換點
        this.createTransitionPoints();
        
        // 設置相機
        this.setupCamera();
        
        // 創建UI
        this.createUI();
        
        // 設置輸入
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 環境音效提示
        this.showEnterMessage();
    }

    createForestMap() {
        const mapWidth = 40;
        const mapHeight = 30;
        const tileSize = 32;

        // 創建地面
        this.groundLayer = this.add.group();
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;
                
                // 森林地面
                let tileType = 'tile-grass';
                
                // 隨機添加一些石頭
                if (Math.random() > 0.95) {
                    tileType = 'tile-stone';
                }
                
                const tile = this.add.image(worldX, worldY, tileType);
                tile.setDepth(0);
                this.groundLayer.add(tile);
            }
        }

        // 創建樹木和裝飾（碰撞區域）
        this.decorations = this.physics.add.staticGroup();
        
        // 邊界樹木
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < 3; y++) {
                this.createTree(x * tileSize + 16, y * tileSize + 16);
            }
            for (let y = mapHeight - 3; y < mapHeight; y++) {
                this.createTree(x * tileSize + 16, y * tileSize + 16);
            }
        }
        
        for (let y = 3; y < mapHeight - 3; y++) {
            for (let x = 0; x < 3; x++) {
                this.createTree(x * tileSize + 16, y * tileSize + 16);
            }
            for (let x = mapWidth - 3; x < mapWidth; x++) {
                this.createTree(x * tileSize + 16, y * tileSize + 16);
            }
        }
        
        // 內部隨機樹木
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(5, mapWidth - 6) * tileSize + 16;
            const y = Phaser.Math.Between(5, mapHeight - 6) * tileSize + 16;
            this.createTree(x, y);
        }
        
        // 🕷️ 創建毒液蜘蛛巢穴（新區域）
        this.createVenomSpiderDen(1000, 800);

        // 特殊地點 - 古代遺跡入口
        this.createAncientRuin(600, 400);

        // 設置世界邊界
        this.physics.world.setBounds(0, 0, mapWidth * tileSize, mapHeight * tileSize);
    }

    createTree(x, y) {
        const tree = this.decorations.create(x, y, 'tile-wood');
        tree.setTint(0x228B22);
        
        // 樹頂裝飾
        const treeTop = this.add.text(x, y - 10, '🌲', {
            fontSize: '24px'
        }).setOrigin(0.5);
        treeTop.setDepth(5);
    }

    // 🕷️ 創建毒液蜘蛛巢穴
    createVenomSpiderDen(x, y) {
        // 巢穴基座（暗綠色調）
        const den = this.add.rectangle(x, y, 120, 100, 0x1a3d1a);
        den.setStrokeStyle(4, 0x2ecc71);
        
        // 巢穴圖標
        const denIcon = this.add.text(x, y - 10, '🕸️', {
            fontSize: '40px'
        }).setOrigin(0.5);
        
        // 標籤
        const denText = this.add.text(x, y + 40, '毒液蜘蛛巢穴', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#2ecc71',
            backgroundColor: '#00000088',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5);
        
        // 警告標記
        const warningText = this.add.text(x + 70, y - 30, '⚠️ 危險', {
            fontSize: '10px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c',
            backgroundColor: '#00000088',
            padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        
        // 進入檢測區域
        this.spiderDenEntrance = this.physics.add.staticSprite(x, y + 50, 'tile-wood');
        this.spiderDenEntrance.setVisible(false);
        
        this.physics.add.overlap(this.player, this.spiderDenEntrance, this.onSpiderDenApproach, null, this);

        // 🕷️ 添加毒液蜘蛛巢穴特效
        const createVenomEffect = () => {
            const venom = this.add.circle(
                x + Phaser.Math.Between(-50, 50),
                y + Phaser.Math.Between(-30, 30),
                Phaser.Math.Between(3, 8),
                0x2ecc71,
                0.4
            );
            
            this.tweens.add({
                targets: venom,
                alpha: 0,
                scale: { from: 1, to: 0.5 },
                duration: 1500,
                onComplete: () => venom.destroy()
            });
            
            this.time.delayedCall(800 + Math.random() * 600, createVenomEffect);
        };
        
        this.time.delayedCall(500, createVenomEffect);
    }

    // 🕷️ 接近毒液蜘蛛巢穴
    onSpiderDenApproach(player, den) {
        if (!this.spiderDenPrompted) {
            this.spiderDenPrompted = true;
            
            this.showDialog('🕸️ 你接近了毒液蜘蛛巢穴！
這裡的毒液蜘蛛會讓你中毒，請務必小心！
中毒效果會持續數回合，造成持續傷害！');
            
            this.time.delayedCall(6000, () => {
                this.spiderDenPrompted = false;
            });
        }
    }

    createAncientRuin(x, y) {
        // 遺跡基座
        const ruin = this.add.rectangle(x, y, 100, 80, 0x696969);
        ruin.setStrokeStyle(3, 0xFFD700);
        
        // 遺跡標記
        const ruinIcon = this.add.text(x, y - 10, '🏛️', {
            fontSize: '32px'
        }).setOrigin(0.5);
        
        // 標籤
        const ruinText = this.add.text(x, y + 30, '古代遺跡', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#FFD700',
            backgroundColor: '#00000088',
            padding: { x: 3, y: 1 }
        }).setOrigin(0.5);
        
        // 進入檢測區域
        this.ruinEntrance = this.physics.add.staticSprite(x, y + 50, 'tile-wood');
        this.ruinEntrance.setVisible(false);
        
        this.physics.add.overlap(this.player, this.ruinEntrance, this.onRuinApproach, null, this);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(this.playerStartX, this.playerStartY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // 碰撞檢測
        this.physics.add.collider(this.player, this.decorations);
    }

    createEnemies() {
        this.enemies = this.physics.add.group();
        
        // 根據玩家等級生成敵人
        const playerLevel = this.playerData.level;
        let enemyTypes = [];
        
        if (playerLevel <= 3) {
            enemyTypes = ['enemy-slime', 'enemy-goblin'];
        } else if (playerLevel <= 6) {
            enemyTypes = ['enemy-goblin', 'enemy-mage', 'enemy-wolf'];
        } else if (playerLevel <= 10) {
            enemyTypes = ['enemy-mage', 'enemy-wolf', 'enemy-orc', 'enemy-spider'];
        } else if (playerLevel <= 15) {
            // 🗡️ 等級 10+ 可遇到暗影刺客
            enemyTypes = ['enemy-mage', 'enemy-wolf', 'enemy-orc', 'enemy-spider', 'enemy-assassin'];
        } else if (playerLevel <= 20) {
            // 🔥 等級 16+ 可遇到火焰元素
            enemyTypes = ['enemy-orc', 'enemy-spider', 'enemy-assassin', 'enemy-fire-elemental'];
        } else if (playerLevel <= 25) {
            // ❄️ 等級 21+ 可遇到冰霜元素
            enemyTypes = ['enemy-orc', 'enemy-spider', 'enemy-assassin', 'enemy-fire-elemental', 'enemy-ice-elemental'];
        } else if (playerLevel <= 30) {
            // ⚡ 等級 26+ 可遇到雷電元素
            enemyTypes = ['enemy-orc', 'enemy-spider', 'enemy-assassin', 'enemy-fire-elemental', 'enemy-ice-elemental', 'enemy-lightning-elemental'];
        } else {
            // 🕷️ 等級 31+ 可遇到毒液蜘蛛
            enemyTypes = ['enemy-orc', 'enemy-spider', 'enemy-assassin', 'enemy-fire-elemental', 'enemy-ice-elemental', 'enemy-lightning-elemental', 'enemy-venom-spider'];
        }
        
        // 在森林中隨機放置敵人
        const enemyCount = 10 + Math.floor(playerLevel / 2);
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y, validPosition;
            let attempts = 0;
            
            // 確保敵人不會生成在玩家附近或樹上
            do {
                x = Phaser.Math.Between(150, 1100);
                y = Phaser.Math.Between(150, 800);
                validPosition = true;
                
                // 檢查與玩家的距離
                const distToPlayer = Phaser.Math.Distance.Between(x, y, this.playerStartX, this.playerStartY);
                if (distToPlayer < 150) {
                    validPosition = false;
                }
                
                attempts++;
            } while (!validPosition && attempts < 50);
            
            if (validPosition) {
                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                this.createEnemy(x, y, type);
            }
        }

        // 🕷️ 在毒液蜘蛛巢穴附近必定生成2-3隻毒液蜘蛛
        if (playerLevel >= 30) {
            for (let i = 0; i < Phaser.Math.Between(2, 3); i++) {
                const x = 1000 + Phaser.Math.Between(-80, 80);
                const y = 800 + Phaser.Math.Between(-60, 60);
                this.createEnemy(x, y, 'enemy-venom-spider');
            }
        }
        
        // 敵人碰撞檢測
        this.physics.add.overlap(this.player, this.enemies, this.encounterEnemy, null, this);
    }

    createEnemy(x, y, type) {
        const enemy = this.enemies.create(x, y, type);
        enemy.setDepth(5);
        enemy.enemyType = type;
        enemy.enemyId = type + '_' + Math.random().toString(36).substr(2, 9);
        
        // 根據類型設置敵人數據
        const enemyData = this.getEnemyData(type);
        enemy.enemyData = enemyData;
        
        // 敵人圖標
        const enemyEmojis = {
            'enemy-slime': '🟢',
            'enemy-goblin': '👺',
            'enemy-mage': '🔮',
            'enemy-wolf': '🐺',
            'enemy-orc': '👹',
            'enemy-spider': '🕷️',
            'enemy-assassin': '🗡️',
            'enemy-fire-elemental': '🔥',
            'enemy-ice-elemental': '❄️',
            'enemy-lightning-elemental': '⚡',
            'enemy-venom-spider': '🕷️' // 🕷️ 毒液蜘蛛圖標
        };
        
        enemy.enemyEmoji = enemyEmojis[type] || '👾';
        
        // 🗡️ 暗影刺客有特殊的隱形巡邏行為
        if (type === 'enemy-assassin') {
            this.createAssassinAI(enemy);
        } else if (type === 'enemy-fire-elemental') {
            // 🔥 火焰元素有特殊的火焰巡邏行為
            this.createFireElementalAI(enemy);
        } else if (type === 'enemy-ice-elemental') {
            // ❄️ 冰霜元素有特殊的冰霜巡邏行為
            this.createIceElementalAI(enemy);
        } else if (type === 'enemy-lightning-elemental') {
            // ⚡ 雷電元素有特殊的雷電巡邏行為
            this.createLightningElementalAI(enemy);
        } else if (type === 'enemy-venom-spider') {
            // 🕷️ 毒液蜘蛛有特殊的毒液巡邏行為
            this.createVenomSpiderAI(enemy);
        } else {
            // 簡單的巡邏AI
            this.tweens.add({
                targets: enemy,
                x: x + Phaser.Math.Between(-60, 60),
                y: y + Phaser.Math.Between(-60, 60),
                duration: 2000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        return enemy;
    }
    
    // 🗡️ 創建暗影刺客AI
    createAssassinAI(enemy) {
        // 暗影刺客會隨機隱形
        enemy.isInvisible = false;
        
        // 隱形/顯形循環
        const toggleInvisibility = () => {
            if (!enemy || !enemy.active) return;
            
            enemy.isInvisible = !enemy.isInvisible;
            
            if (enemy.isInvisible) {
                // 進入隱形
                enemy.setAlpha(0.3);
                enemy.setTint(0x666666);
            } else {
                // 顯形
                enemy.setAlpha(1);
                enemy.clearTint();
            }
            
            // 隨機下一次切換時間
            const nextToggle = 3000 + Math.random() * 4000;
            this.time.delayedCall(nextToggle, toggleInvisibility);
        };
        
        // 開始隱形循環
        this.time.delayedCall(2000, toggleInvisibility);
        
        // 快速移動
        this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-100, 100),
            y: enemy.y + Phaser.Math.Between(-100, 100),
            duration: 1500 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // 🔥 創建火焰元素AI
    createFireElementalAI(enemy) {
        // 火焰元素會發光和脈動
        enemy.setTint(0xff6600);
        
        // 脈動動畫
        this.tweens.add({
            targets: enemy,
            scale: { from: 1, to: 1.2 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 周圍火焰粒子效果
        const createFireParticles = () => {
            if (!enemy || !enemy.active) return;
            
            for (let i = 0; i < 3; i++) {
                const fire = this.add.text(
                    enemy.x + Phaser.Math.Between(-20, 20),
                    enemy.y + Phaser.Math.Between(-20, 20),
                    '🔥',
                    { fontSize: '12px' }
                ).setAlpha(0.6);
                
                this.tweens.add({
                    targets: fire,
                    y: fire.y - 30,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => fire.destroy()
                });
            }
            
            this.time.delayedCall(800, createFireParticles);
        };
        
        this.time.delayedCall(500, createFireParticles);
        
        // 巡邏移動
        this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-80, 80),
            y: enemy.y + Phaser.Math.Between(-80, 80),
            duration: 2500 + Math.random() * 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ❄️ 創建冰霜元素AI
    createIceElementalAI(enemy) {
        // 冰霜元素會發出藍光
        enemy.setTint(0x00ffff);
        
        // 緩慢脈動動畫（比火焰慢）
        this.tweens.add({
            targets: enemy,
            scale: { from: 1, to: 1.15 },
            alpha: { from: 0.9, to: 1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 周圍冰晶粒子效果
        const createIceParticles = () => {
            if (!enemy || !enemy.active) return;
            
            for (let i = 0; i < 4; i++) {
                const ice = this.add.text(
                    enemy.x + Phaser.Math.Between(-25, 25),
                    enemy.y + Phaser.Math.Between(-25, 25),
                    ['❄️', '✦', '✧'][i % 3],
                    { fontSize: '10px' }
                ).setAlpha(0.5);
                
                this.tweens.add({
                    targets: ice,
                    y: ice.y - 20,
                    alpha: 0,
                    rotation: Math.random() * Math.PI,
                    duration: 1200,
                    onComplete: () => ice.destroy()
                });
            }
            
            this.time.delayedCall(1000, createIceParticles);
        };
        
        this.time.delayedCall(500, createIceParticles);
        
        // 冰霜元素移動較慢
        this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-50, 50),
            y: enemy.y + Phaser.Math.Between(-50, 50),
            duration: 3000 + Math.random() * 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ⚡ 創建雷電元素AI
    createLightningElementalAI(enemy) {
        // 雷電元素會發出紫藍色光芒
        enemy.setTint(0x9400d3);
        
        // 快速閃爍動畫（比火焰和冰霜都快）
        this.tweens.add({
            targets: enemy,
            alpha: { from: 0.7, to: 1 },
            scale: { from: 1, to: 1.1 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 周圍閃電粒子效果
        const createLightningParticles = () => {
            if (!enemy || !enemy.active) return;
            
            for (let i = 0; i < 5; i++) {
                const lightning = this.add.text(
                    enemy.x + Phaser.Math.Between(-30, 30),
                    enemy.y + Phaser.Math.Between(-30, 30),
                    ['⚡', '✦', '⋆'][i % 3],
                    { fontSize: '14px' }
                ).setAlpha(0.7);
                
                this.tweens.add({
                    targets: lightning,
                    x: lightning.x + Phaser.Math.Between(-20, 20),
                    y: lightning.y - 25,
                    alpha: 0,
                    scale: { from: 1, to: 0.5 },
                    duration: 400,
                    onComplete: () => lightning.destroy()
                });
            }
            
            this.time.delayedCall(500, createLightningParticles);
        };
        
        this.time.delayedCall(300, createLightningParticles);
        
        // 雷電元素移動非常快且不可預測
        const randomMove = () => {
            if (!enemy || !enemy.active) return;
            
            this.tweens.add({
                targets: enemy,
                x: enemy.x + Phaser.Math.Between(-100, 100),
                y: enemy.y + Phaser.Math.Between(-100, 100),
                duration: 800 + Math.random() * 600,
                ease: 'Sine.easeInOut'
            });
            
            this.time.delayedCall(1000 + Math.random() * 500, randomMove);
        };
        
        randomMove();
    }

    // 🕷️ 創建毒液蜘蛛AI
    createVenomSpiderAI(enemy) {
        // 毒液蜘蛛會發出綠色光芒
        enemy.setTint(0x2ecc71);
        
        // 毒液脈動動畫
        this.tweens.add({
            targets: enemy,
            alpha: { from: 0.85, to: 1 },
            scale: { from: 1, to: 1.15 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 周圍毒液粒子效果
        const createVenomParticles = () => {
            if (!enemy || !enemy.active) return;
            
            for (let i = 0; i < 4; i++) {
                const venom = this.add.text(
                    enemy.x + Phaser.Math.Between(-25, 25),
                    enemy.y + Phaser.Math.Between(-25, 25),
                    ['☠️', '💀', '🧪'][i % 3],
                    { fontSize: '12px' }
                ).setAlpha(0.6);
                
                this.tweens.add({
                    targets: venom,
                    y: venom.y - 20,
                    alpha: 0,
                    scale: { from: 1, to: 0.5 },
                    duration: 1000,
                    onComplete: () => venom.destroy()
                });
            }
            
            this.time.delayedCall(700, createVenomParticles);
        };
        
        this.time.delayedCall(500, createVenomParticles);
        
        // 毒液蜘蛛移動緩慢但穩定
        this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-40, 40),
            y: enemy.y + Phaser.Math.Between(-40, 40),
            duration: 3500 + Math.random() * 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 毒液滴落效果
        const createVenomDrop = () => {
            if (!enemy || !enemy.active) return;
            
            const drop = this.add.circle(
                enemy.x + Phaser.Math.Between(-10, 10),
                enemy.y + 15,
                Phaser.Math.Between(3, 6),
                0x2ecc71,
                0.6
            );
            
            this.tweens.add({
                targets: drop,
                y: enemy.y + 50,
                alpha: 0,
                duration: 700,
                onComplete: () => drop.destroy()
            });
            
            this.time.delayedCall(500 + Math.random() * 700, createVenomDrop);
        };
        
        this.time.delayedCall(300, createVenomDrop);
    }

    getEnemyData(type) {
        const enemyDatabase = {
            'enemy-slime': { name: '史萊姆', hp: 40, maxHp: 40, attack: 8, exp: 15, gold: 10 },
            'enemy-goblin': { name: '哥布林', hp: 55, maxHp: 55, attack: 12, exp: 22, gold: 15 },
            'enemy-mage': { name: '黑暗法師', hp: 45, maxHp: 45, attack: 18, exp: 30, gold: 25 },
            'enemy-wolf': { name: '森林狼', hp: 70, maxHp: 70, attack: 15, exp: 35, gold: 20 },
            'enemy-orc': { name: '獸人戰士', hp: 100, maxHp: 100, attack: 18, exp: 50, gold: 35 },
            'enemy-spider': { name: '巨型蜘蛛', hp: 85, maxHp: 85, attack: 22, exp: 55, gold: 30 },
            'enemy-assassin': { 
                name: '暗影刺客', 
                hp: 75, 
                maxHp: 75, 
                attack: 25, 
                exp: 70, 
                gold: 45,
                isAssassin: true,
                dodgeChance: 0.3
            },
            'enemy-fire-elemental': {
                name: '火焰元素',
                hp: 90,
                maxHp: 90,
                attack: 30,
                exp: 85,
                gold: 55,
                isFireElemental: true,
                burnChance: 0.3,
                fireBurstChance: 0.4
            },
            'enemy-ice-elemental': {
                name: '冰霜元素',
                hp: 120,
                maxHp: 120,
                attack: 22,
                exp: 95,
                gold: 65,
                isIceElemental: true,
                freezeChance: 0.4,
                iceBurstChance: 0.35,
                freezeSkipChance: 0.35
            },
            'enemy-lightning-elemental': {
                name: '雷電元素',
                hp: 85,
                maxHp: 85,
                attack: 35,
                exp: 110,
                gold: 75,
                isLightningElemental: true,
                paralyzeChance: 0.45,
                thunderStrikeChance: 0.4,
                paralyzeDuration: 2
            },
            // 🕷️ 毒液蜘蛛數據
            'enemy-venom-spider': {
                name: '毒液蜘蛛',
                hp: 110,
                maxHp: 110,
                attack: 28,
                exp: 130,
                gold: 85,
                isVenomSpider: true,
                poisonChance: 0.5,
                venomBurstChance: 0.35
            }
        };
        
        return enemyDatabase[type] || enemyDatabase['enemy-slime'];
    }

    createTransitionPoints() {
        this.transitions = this.physics.add.staticGroup();
        
        // 返回村莊的入口
        const villageExit = this.transitions.create(400, 10, 'tile-wood');
        villageExit.setTint(0x87CEEB);
        villageExit.targetScene = 'VillageScene';
        villageExit.targetX = 400;
        villageExit.targetY = 680;
        
        // Boss區域入口（需要完成特定任務或達到等級）
        if (this.playerData.level >= 8) {
            const bossExit = this.transitions.create(1000, 300, 'tile-wood');
            bossExit.setTint(0x8B0000);
            bossExit.targetScene = 'BossScene';
            bossExit.targetX = 100;
            bossExit.targetY = 300;
            
            const bossText = this.add.text(1000, 270, '🔥 Boss區域', {
                fontSize: '14px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#ff0000',
                backgroundColor: '#00000088',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);
        }
        
        // 出口標記
        const exitText = this.add.text(400, 35, '🏠 返回村莊', {
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
        this.cameras.main.setBounds(0, 0, 1280, 960);
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

        // 區域標識
        this.uiName = this.add.text(10, 10, '🌲 迷霧森林 (危險)', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c'
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

        // 敵人數量提示
        this.enemyCountText = this.add.text(680, 10, `敵人: ${this.enemies.countActive()}`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c'
        });
        this.enemyCountText.setScrollFactor(0);
        this.enemyCountText.setDepth(100);
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

        // 更新UI
        this.updateUI();
        
        // 敵人追逐AI（如果玩家靠近）
        this.updateEnemyAI();
    }

    updateEnemyAI() {
        this.enemies.children.entries.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );
            
            // 🗡️ 暗影刺客有更遠的偵測範圍
            const detectRange = (enemy.enemyType === 'enemy-assassin') ? 150 : 
                               (enemy.enemyType === 'enemy-fire-elemental') ? 130 :
                               (enemy.enemyType === 'enemy-ice-elemental') ? 120 :
                               (enemy.enemyType === 'enemy-lightning-elemental') ? 140 :
                               (enemy.enemyType === 'enemy-venom-spider') ? 135 : 100; // 🕷️ 毒液蜘蛛偵測範圍
            
            // 如果玩家在附近，加速朝向玩家
            if (distance < detectRange) {
                const angle = Phaser.Math.Angle.Between(
                    enemy.x, enemy.y,
                    this.player.x, this.player.y
                );
                
                // 🗡️ 暗影刺客移動更快，❄️ 冰霜元素移動較慢，🕷️ 毒液蜘蛛移動中等
                const chaseSpeed = (enemy.enemyType === 'enemy-assassin') ? 80 : 
                                  (enemy.enemyType === 'enemy-fire-elemental') ? 60 :
                                  (enemy.enemyType === 'enemy-ice-elemental') ? 45 :
                                  (enemy.enemyType === 'enemy-lightning-elemental') ? 100 :
                                  (enemy.enemyType === 'enemy-venom-spider') ? 55 : 50;
                enemy.body.velocity.x = Math.cos(angle) * chaseSpeed;
                enemy.body.velocity.y = Math.sin(angle) * chaseSpeed;
            }
        });
    }

    encounterEnemy(player, enemy) {
        if (enemy.isEncountered) return;
        enemy.isEncountered = true;
        
        // 播放遭遇音效
        this.audio.playEncounter();
        
        // 🌧️ 保存天氣狀態
        this.game.globals.weatherType = this.weather.weatherType;
        
        // 進入戰鬥
        const enemyData = {
            type: enemy.enemyType,
            name: enemy.enemyData.name,
            hp: enemy.enemyData.hp,
            maxHp: enemy.enemyData.maxHp,
            attack: enemy.enemyData.attack,
            exp: enemy.enemyData.exp,
            gold: enemy.enemyData.gold,
            isAssassin: enemy.enemyData.isAssassin || false,
            dodgeChance: enemy.enemyData.dodgeChance || 0,
            isFireElemental: enemy.enemyData.isFireElemental || false,
            burnChance: enemy.enemyData.burnChance || 0,
            fireBurstChance: enemy.enemyData.fireBurstChance || 0,
            isIceElemental: enemy.enemyData.isIceElemental || false,
            freezeChance: enemy.enemyData.freezeChance || 0,
            iceBurstChance: enemy.enemyData.iceBurstChance || 0,
            freezeSkipChance: enemy.enemyData.freezeSkipChance || 0,
            isLightningElemental: enemy.enemyData.isLightningElemental || false,
            paralyzeChance: enemy.enemyData.paralyzeChance || 0,
            thunderStrikeChance: enemy.enemyData.thunderStrikeChance || 0,
            paralyzeDuration: enemy.enemyData.paralyzeDuration || 0,
            // 🕷️ 毒液蜘蛛數據
            isVenomSpider: enemy.enemyData.isVenomSpider || false,
            poisonChance: enemy.enemyData.poisonChance || 0,
            venomBurstChance: enemy.enemyData.venomBurstChance || 0
        };
        
        // 停止玩家移動
        this.player.setVelocity(0);
        
        // 切換到戰鬥場景
        this.scene.start('BattleScene', {
            player: this.playerData,
            enemy: enemyData,
            returnScene: 'ForestScene',
            returnX: this.player.x,
            returnY: this.player.y
        });
        
        // 移除這個敵人
        enemy.destroy();
    }

    onRuinApproach(player, ruin) {
        if (!this.ruinPrompted) {
            this.ruinPrompted = true;
            
            this.showDialog('🏛️ 你發現了古代遺跡的入口！\n這裡似乎隱藏著什麼秘密...');
            
            // 觸發隱藏任務
            this.game.globals.discoveredRuin = true;
            
            this.time.delayedCall(5000, () => {
                this.ruinPrompted = false;
            });
        }
    }

    onTransition(player, transition) {
        // 保存當前數據
        this.game.globals.playerHP = this.playerData.hp;
        this.game.globals.playerMP = this.playerData.mp;
        
        // 🌧️ 清理天氣系統
        if (this.weather) {
            this.weather.destroy();
        }
        
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
        this.enemyCountText.setText(`敵人: ${this.enemies.countActive()}`);
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
        
        dialog.add([bg, text]);
        
        this.time.delayedCall(3000, () => {
            dialog.destroy();
        });
    }

    showEnterMessage() {
        const config = this.weather.weatherConfig[this.weather.weatherType];
        const weatherText = config.type !== 'clear' ? `\n\n${config.emoji} 當前天氣：${config.name}` : '';
        
        // 🕷️ 檢查是否有毒液蜘蛛
        const hasVenomSpider = this.playerData.level >= 30;
        const venomWarning = hasVenomSpider ? '\n\n⚠️ 注意：毒液蜘蛛出沒！' : '';
        
        const message = this.add.text(400, 200, `🌲 進入迷霧森林\n\n這裡的怪物比之前更強大！\n請小心行事${weatherText}${venomWarning}`, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        message.setScrollFactor(0);
        message.setDepth(100);
        
        this.tweens.add({
            targets: message,
            alpha: 0,
            delay: 4000,
            duration: 1000,
            onComplete: () => message.destroy()
        });
    }
}
