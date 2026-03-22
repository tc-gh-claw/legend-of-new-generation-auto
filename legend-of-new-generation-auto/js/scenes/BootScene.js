/**
 * BootScene - 遊戲啟動場景
 * 負責載入所有遊戲素材 - 插畫風格版本
 * v1.8.0 - 新增火焰元素材質
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 創建載入畫面
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 創建插畫風格背景
        this.createLoadingBackground();
        
        // 載入進度條背景 - 圓角、柔和色彩
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x2d3561, 0.9);
        progressBox.fillRoundedRect(width / 2 - 170, height / 2 - 40, 340, 70, 15);
        progressBox.lineStyle(3, 0x5a67a8, 1);
        progressBox.strokeRoundedRect(width / 2 - 170, height / 2 - 40, 340, 70, 15);
        
        // 載入文字 - 使用優雅字體
        const loadingText = this.add.text(width / 2, height / 2 - 80, '✨ 載入中...', {
            fontSize: '32px',
            fontFamily: '"ZCOOL KuaiLe", "Noto Sans TC", cursive',
            fill: '#feca57',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);
        
        const percentText = this.add.text(width / 2, height / 2 - 5, '0%', {
            fontSize: '24px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            fontSize: '14px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#a0a0c0'
        }).setOrigin(0.5);
        
        // 載入進度事件
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            // 漸變進度條 - 使用 Phaser 兼容方式
            const barWidth = 320 * value;
            const startX = width / 2 - 160;
            const startY = height / 2 - 20;
            
            // 逐行繪製漸變效果
            for (let i = 0; i < barWidth; i += 2) {
                const ratio = i / barWidth;
                let color;
                if (ratio < 0.5) {
                    // 從紅色到黃色
                    const r = Math.floor(233 + (254 - 233) * (ratio * 2));
                    const g = Math.floor(69 + (202 - 69) * (ratio * 2));
                    const b = Math.floor(96 + (87 - 96) * (ratio * 2));
                    color = Phaser.Display.Color.GetColor(r, g, b);
                } else {
                    // 從黃色到藍色
                    const r = Math.floor(254 + (72 - 254) * ((ratio - 0.5) * 2));
                    const g = Math.floor(202 + (219 - 202) * ((ratio - 0.5) * 2));
                    const b = Math.floor(87 + (251 - 87) * ((ratio - 0.5) * 2));
                    color = Phaser.Display.Color.GetColor(r, g, b);
                }
                progressBar.fillStyle(color, 1);
                progressBar.fillRect(startX + i, startY, 2, 30);
            }
            // 圓角遮罩效果
            if (value > 0) {
                progressBar.fillStyle(0xffffff, 0);
            }
        });
        
        this.load.on('fileprogress', (file) => {
            assetText.setText('載入: ' + file.key);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });
        
        // ===== 載入素材 =====
        
        // 載入JSON題目數據
        this.load.json('questions', 'assets/data/questions.json');
        
        // 載入成就數據
        this.load.json('achievementsData', 'assets/data/achievements.json');
        
        // 載入音效資源 (會檢查文件是否存在)
        AudioManager.preload(this);
        
        // 使用程式生成插畫風格臨時素材
        this.generateIllustrationAssets();
    }

    create() {
        // 創建臨時動畫
        this.createAnimations();
        
        // 初始化音效管理器
        AudioManager.init(this);
        
        // 載入題目數據到全局變量
        const questionsData = this.cache.json.get('questions');
        if (questionsData) {
            this.game.globals.questions = questionsData;
            console.log('✅ BootScene: 題目數據已載入，共', 
                Object.values(questionsData.subjects).reduce((sum, s) => sum + s.questions.length, 0), 
                '題');
        } else {
            console.warn('⚠️ BootScene: 無法載入題目數據');
        }
        
        // 進入主選單
        this.scene.start('MenuScene');
    }
    
    createLoadingBackground() {
        // 插畫風格漸變背景
        const graphics = this.add.graphics();
        
        // 柔和漸層背景
        for (let y = 0; y < 600; y += 2) {
            const ratio = y / 600;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 45, g: 53, b: 97 },    // #2d3561 頂部
                { r: 26, g: 31, b: 58 },     // #1a1f3a 底部
                1, ratio
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, y, 800, 2);
        }
        
        // 添加裝飾性元素
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.FloatBetween(2, 6);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
            
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
    }
    
    generateIllustrationAssets() {
        // 創建插畫風格圖形作為素材占位
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // ===== 玩家精靈 (插畫風格 - 圓潤、漸變) =====
        // 身體
        graphics.fillStyle(0x3498db, 1);
        graphics.fillCircle(16, 20, 12);
        // 光澤效果
        graphics.fillStyle(0x5dade2, 0.6);
        graphics.fillCircle(12, 16, 5);
        // 眼睛
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(12, 18, 3);
        graphics.fillCircle(20, 18, 3);
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillCircle(12, 18, 1.5);
        graphics.fillCircle(20, 18, 1.5);
        graphics.generateTexture('player', 32, 36);
        graphics.clear();
        
        // ===== 敵人精靈 - 史萊姆 (圓潤、可愛) =====
        // 身體
        graphics.fillStyle(0x2ecc71, 1);
        graphics.fillCircle(16, 20, 12);
        // 高光
        graphics.fillStyle(0x58d68d, 0.5);
        graphics.fillEllipse(12, 16, 8, 5);
        // 表情
        graphics.fillStyle(0x1e8449, 1);
        graphics.fillCircle(12, 22, 2);
        graphics.fillCircle(20, 22, 2);
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(11, 21, 0.8);
        graphics.fillCircle(19, 21, 0.8);
        graphics.generateTexture('enemy-slime', 32, 36);
        graphics.clear();
        
        // ===== 敵人精靈 - 哥布林 (插畫風格) =====
        // 身體
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillRoundedRect(4, 10, 24, 20, 6);
        // 耳朵
        graphics.fillStyle(0xc0392b, 1);
        graphics.fillTriangle(4, 14, 0, 10, 4, 18);
        graphics.fillTriangle(28, 14, 32, 10, 28, 18);
        // 眼睛
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(11, 18, 4);
        graphics.fillCircle(21, 18, 4);
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillCircle(11, 18, 2);
        graphics.fillCircle(21, 18, 2);
        graphics.generateTexture('enemy-goblin', 32, 36);
        graphics.clear();
        
        // ===== 敵人精靈 - 黑暗法師 (神秘風格) =====
        // 斗篷
        graphics.fillStyle(0x8e44ad, 1);
        graphics.fillTriangle(16, 4, 4, 30, 28, 30);
        // 兜帽高光
        graphics.fillStyle(0x9b59b6, 0.6);
        graphics.fillTriangle(16, 6, 8, 20, 24, 20);
        // 發光的眼睛
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillCircle(13, 22, 3);
        graphics.fillCircle(19, 22, 3);
        graphics.fillStyle(0xff6b6b, 0.8);
        graphics.fillCircle(13, 21, 1);
        graphics.fillCircle(19, 21, 1);
        graphics.generateTexture('enemy-mage', 32, 36);
        graphics.clear();
        
        // ===== 敵人 - 狼 =====
        graphics.fillStyle(0x7f8c8d, 1);
        graphics.fillRoundedRect(6, 12, 20, 18, 5);
        // 耳朵
        graphics.fillTriangle(8, 12, 6, 6, 12, 12);
        graphics.fillTriangle(24, 12, 26, 6, 20, 12);
        // 眼睛
        graphics.fillStyle(0xf39c12, 1);
        graphics.fillCircle(12, 18, 3);
        graphics.fillCircle(20, 18, 3);
        graphics.generateTexture('enemy-wolf', 32, 36);
        graphics.clear();
        
        // ===== 敵人 - 獸人 =====
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillRoundedRect(4, 8, 24, 24, 6);
        // 角
        graphics.fillStyle(0x1e8449, 1);
        graphics.fillTriangle(6, 10, 4, 2, 10, 8);
        graphics.fillTriangle(26, 10, 28, 2, 22, 8);
        // 眼睛
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillCircle(11, 16, 3);
        graphics.fillCircle(21, 16, 3);
        graphics.generateTexture('enemy-orc', 32, 36);
        graphics.clear();
        
        // ===== 敵人 - 蜘蛛 =====
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillCircle(16, 20, 10);
        // 腿
        graphics.lineStyle(2, 0x34495e, 1);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI;
            graphics.beginPath();
            graphics.moveTo(16, 20);
            graphics.lineTo(16 + Math.cos(angle) * 14, 20 + Math.sin(angle) * 14);
            graphics.strokePath();
        }
        // 眼睛
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillCircle(16, 18, 3);
        graphics.generateTexture('enemy-spider', 32, 36);
        graphics.clear();

        // ===== 敵人 - 火焰元素 =====
        // 主體（火球）
        graphics.fillStyle(0xff4500, 1);
        graphics.fillCircle(16, 20, 12);
        // 內層火焰
        graphics.fillStyle(0xff6600, 0.8);
        graphics.fillCircle(16, 20, 9);
        // 核心
        graphics.fillStyle(0xffcc00, 0.9);
        graphics.fillCircle(16, 20, 5);
        // 眼睛（發光）
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(13, 18, 2);
        graphics.fillCircle(19, 18, 2);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(13, 18, 1);
        graphics.fillCircle(19, 18, 1);
        graphics.generateTexture('enemy-fire-elemental', 32, 36);
        graphics.clear();
        
        // ===== Boss - 森林守護者 =====
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillCircle(48, 50, 35);
        // 葉子裝飾
        graphics.fillStyle(0x2ecc71, 0.8);
        graphics.fillCircle(30, 35, 12);
        graphics.fillCircle(66, 35, 12);
        graphics.fillCircle(48, 25, 15);
        // 面部
        graphics.fillStyle(0x1e8449, 1);
        graphics.fillCircle(38, 50, 6);
        graphics.fillCircle(58, 50, 6);
        graphics.fillStyle(0xf39c12, 1);
        graphics.fillCircle(48, 65, 8);
        graphics.generateTexture('boss-forest', 96, 100);
        graphics.clear();
        
        // ===== Boss - 暗影巨龍 =====
        graphics.fillStyle(0x8b0000, 1);
        graphics.fillRoundedRect(20, 30, 56, 50, 10);
        // 翅膀
        graphics.fillStyle(0x660000, 1);
        graphics.fillTriangle(20, 40, 5, 25, 20, 55);
        graphics.fillTriangle(76, 40, 91, 25, 76, 55);
        // 眼睛
        graphics.fillStyle(0xff6b6b, 1);
        graphics.fillCircle(38, 50, 8);
        graphics.fillCircle(58, 50, 8);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(38, 50, 3);
        graphics.fillCircle(58, 50, 3);
        graphics.generateTexture('boss-dragon', 96, 100);
        graphics.clear();
        
        // ===== 地圖圖塊 - 草地 (柔和綠色) =====
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillRoundedRect(2, 2, 28, 28, 4);
        // 草地紋理
        graphics.fillStyle(0x2ecc71, 0.5);
        graphics.fillCircle(8, 8, 4);
        graphics.fillCircle(24, 20, 5);
        graphics.fillCircle(12, 22, 3);
        graphics.generateTexture('tile-grass', 32, 32);
        graphics.clear();
        
        // ===== 地圖圖塊 - 石板 (灰色調) =====
        graphics.fillStyle(0x7f8c8d, 1);
        graphics.fillRoundedRect(2, 2, 28, 28, 3);
        // 石板紋理
        graphics.fillStyle(0x95a5a6, 0.4);
        graphics.fillRect(4, 4, 10, 10);
        graphics.fillRect(18, 16, 10, 10);
        graphics.generateTexture('tile-stone', 32, 32);
        graphics.clear();
        
        // ===== 地圖圖塊 - 木頭 (溫暖色調) =====
        graphics.fillStyle(0xa0522d, 1);
        graphics.fillRoundedRect(2, 2, 28, 28, 3);
        // 木紋
        graphics.lineStyle(1, 0x8b4513, 0.5);
        graphics.beginPath();
        graphics.moveTo(4, 10);
        graphics.lineTo(28, 10);
        graphics.moveTo(4, 20);
        graphics.lineTo(28, 20);
        graphics.strokePath();
        graphics.generateTexture('tile-wood', 32, 32);
        graphics.clear();
        
        // ===== UI元素 - 按鈕 (圓角、實色風格) =====
        // 使用實色而非漸變（Phaser Graphics 不支持 createLinearGradient）
        graphics.fillStyle(0x5a67a8, 1);
        graphics.fillRoundedRect(0, 0, 200, 60, 12);
        // 邊框
        graphics.lineStyle(2, 0x7c8cb8, 1);
        graphics.strokeRoundedRect(0, 0, 200, 60, 12);
        // 高光
        graphics.fillStyle(0xffffff, 0.1);
        graphics.fillRoundedRect(5, 3, 190, 20, 8);
        graphics.generateTexture('ui-button', 200, 60);
        graphics.clear();
        
        // ===== UI元素 - 按鈕懸停 (更亮) =====
        graphics.fillStyle(0x6b7cb9, 1);
        graphics.fillRoundedRect(0, 0, 200, 60, 12);
        graphics.lineStyle(2, 0xfeca57, 1);
        graphics.strokeRoundedRect(0, 0, 200, 60, 12);
        graphics.fillStyle(0xffffff, 0.15);
        graphics.fillRoundedRect(5, 3, 190, 20, 8);
        graphics.generateTexture('ui-button-hover', 200, 60);
        graphics.clear();
        
        // ===== 對話框 (半透明、圓角) =====
        graphics.fillStyle(0x1a1a2e, 0.95);
        graphics.fillRoundedRect(0, 0, 600, 120, 16);
        graphics.lineStyle(3, 0x5a67a8, 1);
        graphics.strokeRoundedRect(0, 0, 600, 120, 16);
        // 裝飾線
        graphics.lineStyle(1, 0xfeca57, 0.5);
        graphics.beginPath();
        graphics.moveTo(20, 100);
        graphics.lineTo(580, 100);
        graphics.strokePath();
        graphics.generateTexture('ui-dialog', 600, 120);
        graphics.clear();
        
        // ===== 技能圖標 - 數學 (計算符號) =====
        graphics.fillStyle(0x3498db, 1);
        graphics.fillCircle(16, 16, 14);
        // 光澤
        graphics.fillStyle(0x5dade2, 0.5);
        graphics.fillCircle(12, 12, 5);
        // 符號
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(8, 15, 16, 3, 1);
        graphics.fillRoundedRect(15, 8, 3, 16, 1);
        graphics.generateTexture('icon-math', 32, 32);
        graphics.clear();
        
        // ===== 技能圖標 - 科學 (燒瓶) =====
        graphics.fillStyle(0x2ecc71, 1);
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0x58d68d, 0.5);
        graphics.fillCircle(12, 12, 5);
        // 燒瓶
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(12, 6, 8, 4, 1);
        graphics.fillRoundedRect(10, 10, 12, 12, 2);
        // 液體
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillCircle(16, 18, 4);
        graphics.generateTexture('icon-science', 32, 32);
        graphics.clear();
        
        // ===== 技能圖標 - 英文 (書本) =====
        graphics.fillStyle(0xf39c12, 1);
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0xf5b041, 0.5);
        graphics.fillCircle(12, 12, 5);
        // 書本
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(7, 8, 18, 16, 2);
        graphics.fillStyle(0xf39c12, 1);
        graphics.fillRect(15, 8, 2, 16);
        graphics.generateTexture('icon-english', 32, 32);
        graphics.clear();
        
        // ===== 技能圖標 - 常識 (盾牌) =====
        graphics.fillStyle(0x9b59b6, 1);
        graphics.fillCircle(16, 16, 14);
        graphics.fillStyle(0xaf7ac5, 0.5);
        graphics.fillCircle(12, 12, 5);
        // 盾牌
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(16, 16, 8);
        graphics.fillStyle(0x9b59b6, 1);
        graphics.fillCircle(16, 16, 5);
        graphics.generateTexture('icon-general', 32, 32);
        graphics.clear();
    }
    
    createAnimations() {
        // 玩家待機動畫 (呼吸效果)
        this.anims.create({
            key: 'player-idle',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 8,
            repeat: -1
        });
        
        // 玩家行走動畫
        this.anims.create({
            key: 'player-walk-down',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 8,
            repeat: -1
        });
        
        // 敵人待機動畫
        this.anims.create({
            key: 'enemy-idle',
            frames: [
                { key: 'enemy-slime' },
            ],
            frameRate: 2,
            repeat: -1
        });
    }
}
