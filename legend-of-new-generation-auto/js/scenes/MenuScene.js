/**
 * MenuScene - 主選單場景
 * 插畫風格版本 - 圓潤、漸變、光澤效果
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 播放主選單背景音樂
        this.audio.playMenuBgm();
        
        // 創建插畫風格背景
        this.createIllustrationBackground();
        
        // 遊戲標題 - 插畫風格大字
        const titleText = this.add.text(width / 2, 100, '⚔️ 新世代傳說 ⚔️', {
            fontSize: '56px',
            fontFamily: '"ZCOOL KuaiLe", "Noto Sans TC", cursive',
            fill: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 6,
            shadow: { 
                offsetX: 4, 
                offsetY: 4, 
                color: '#000000', 
                blur: 8, 
                fill: true 
            }
        }).setOrigin(0.5);
        
        // 副標題
        const subtitleText = this.add.text(width / 2, 165, 'Legend of the New Generation', {
            fontSize: '22px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#feca57',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        
        // 描述文字
        const descText = this.add.text(width / 2, 205, '📚 全科知識RPG冒險遊戲', {
            fontSize: '18px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#a0a0c0'
        }).setOrigin(0.5);
        
        // 創建插畫風格選單按鈕
        this.createIllustrationButton(width / 2, 300, '🎮 開始冒險', 0xe94560, () => {
            this.startGame();
        });
        
        this.createIllustrationButton(width / 2, 380, '🏆 成就系統', 0xf1c40f, () => {
            this.openAchievements();
        });
        
        this.createIllustrationButton(width / 2, 460, '⚙️ 遊戲設定', 0x9b59b6, () => {
            this.openSettings();
        });
        
        // 版本號
        this.add.text(width - 20, height - 20, 'v1.3.0 成就版', {
            fontSize: '14px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#666666'
        }).setOrigin(1, 1);
        
        // 標題動畫效果 - 呼吸感
        this.tweens.add({
            targets: titleText,
            scale: { from: 1, to: 1.05 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 副標題微微浮動
        this.tweens.add({
            targets: subtitleText,
            y: { from: 165, to: 168 },
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    createIllustrationBackground() {
        const graphics = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 柔和漸層背景 - 深藍到紫色
        for (let y = 0; y < height; y += 2) {
            const ratio = y / height;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 45, g: 53, b: 97 },    // #2d3561 頂部
                { r: 26, g: 31, b: 58 },     // #1a1f3a 底部
                1, ratio
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, y, width, 2);
        }
        
        // 添加柔和光點效果（插畫風格的裝飾）
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height * 0.7);
            const size = Phaser.Math.FloatBetween(2, 8);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
            
            // 光暈效果
            graphics.fillStyle(0xffffff, alpha * 0.3);
            graphics.fillCircle(x, y, size * 1.5);
            // 核心
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size * 0.5);
        }
        
        // 底部裝飾波浪線
        graphics.lineStyle(2, 0x5a67a8, 0.3);
        graphics.beginPath();
        for (let x = 0; x <= width; x += 10) {
            const y = height - 80 + Math.sin(x * 0.02) * 20;
            if (x === 0) {
                graphics.moveTo(x, y);
            } else {
                graphics.lineTo(x, y);
            }
        }
        graphics.strokePath();
        
        // 閃爍動畫 - 插畫風格的柔和閃光
        this.time.addEvent({
            delay: 200,
            callback: () => {
                const starX = Phaser.Math.Between(0, width);
                const starY = Phaser.Math.Between(0, height * 0.6);
                const star = this.add.circle(starX, starY, 3, 0xffffff);
                star.setAlpha(0);
                
                this.tweens.add({
                    targets: star,
                    alpha: { from: 0, to: 0.8 },
                    scale: { from: 0.5, to: 1.5 },
                    duration: 800,
                    yoyo: true,
                    ease: 'Sine.easeInOut',
                    onComplete: () => star.destroy()
                });
            },
            loop: true
        });
    }
    
    createIllustrationButton(x, y, text, baseColor, callback) {
        const container = this.add.container(x, y);
        
        // 按鈕尺寸
        const btnWidth = 240;
        const btnHeight = 60;
        const radius = 16;
        
        // 陰影
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-btnWidth/2 + 4, -btnHeight/2 + 4, btnWidth, btnHeight, radius);
        container.add(shadow);
        
        // 主按鈕背景 - 漸變效果
        const bg = this.add.graphics();
        
        // 創建漸變
        const baseColorObj = Phaser.Display.Color.IntegerToColor(baseColor);
        const lightColor = baseColorObj.clone().lighten(20);
        const darkColor = baseColorObj.clone().darken(20);
        
        // 主體漸變
        for (let iy = 0; iy < btnHeight; iy++) {
            const ratio = iy / btnHeight;
            const c = Phaser.Display.Color.Interpolate.ColorWithColor(
                lightColor, darkColor, 1, ratio
            );
            bg.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
            // 簡化的圓角矩形繪製
            const left = -btnWidth/2;
            const top = -btnHeight/2 + iy;
            const w = btnWidth;
            const h = 1;
            bg.fillRect(left, top, w, h);
        }
        
        // 重新繪製圓角邊框
        bg.clear();
        bg.fillStyle(baseColor, 1);
        bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        
        // 頂部高光
        bg.fillStyle(0xffffff, 0.2);
        bg.fillRoundedRect(-btnWidth/2 + 3, -btnHeight/2 + 3, btnWidth - 6, 20, 12);
        
        // 邊框
        bg.lineStyle(3, 0xffffff, 0.4);
        bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        
        // 創建互動區域
        const hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        // 按鈕文字
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '22px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, hitArea, buttonText]);
        
        // 互動效果 - 插畫風格的彈性反饋
        hitArea.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.08,
                duration: 200,
                ease: 'Back.easeOut'
            });
            // 發光效果
            bg.clear();
            bg.fillStyle(baseColor, 1);
            bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
            bg.fillStyle(0xffffff, 0.35);
            bg.fillRoundedRect(-btnWidth/2 + 3, -btnHeight/2 + 3, btnWidth - 6, 20, 12);
            bg.lineStyle(3, 0xfeca57, 0.8);
            bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
            
            this.audio.playHover();
        });
        
        hitArea.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 200,
                ease: 'Back.easeOut'
            });
            // 恢復原樣
            bg.clear();
            bg.fillStyle(baseColor, 1);
            bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
            bg.fillStyle(0xffffff, 0.2);
            bg.fillRoundedRect(-btnWidth/2 + 3, -btnHeight/2 + 3, btnWidth - 6, 20, 12);
            bg.lineStyle(3, 0xffffff, 0.4);
            bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        });
        
        hitArea.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 80,
                ease: 'Power2'
            });
            shadow.clear();
            shadow.fillStyle(0x000000, 0.15);
            shadow.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 2, btnWidth, btnHeight, radius);
        });
        
        hitArea.on('pointerup', () => {
            this.tweens.add({
                targets: container,
                scale: 1.08,
                duration: 150,
                ease: 'Back.easeOut'
            });
            shadow.clear();
            shadow.fillStyle(0x000000, 0.3);
            shadow.fillRoundedRect(-btnWidth/2 + 4, -btnHeight/2 + 4, btnWidth, btnHeight, radius);
            this.audio.playClick();
            callback();
        });
        
        return container;
    }
    
    startGame() {
        this.audio.playConfirm();
        
        // 檢查是否有存檔
        const hasSave = localStorage.getItem('lng-save');
        
        if (hasSave) {
            // 顯示確認對話框
            this.showConfirmDialog('已有存檔，開始新遊戲會覆蓋進度，確定嗎？', () => {
                // 清除舊存檔
                localStorage.removeItem('lng-save');
                this.audio.stopBgm();
                this.scene.start('WorldScene');
            });
        } else {
            this.audio.stopBgm();
            this.scene.start('WorldScene');
        }
    }
    
    loadGame() {
        this.audio.playClick();
        const saveData = localStorage.getItem('lng-save');
        
        if (saveData) {
            const data = JSON.parse(saveData);
            this.game.globals = { ...this.game.globals, ...data };
            this.audio.stopBgm();
            this.scene.start('WorldScene');
        } else {
            this.audio.playCancel();
            this.showDialog('沒有找到存檔！');
        }
    }
    
    openSettings() {
        this.audio.playClick();
        this.scene.start('SettingsScene');
    }
    
    openAchievements() {
        this.audio.playClick();
        this.scene.launch('AchievementSystem', {
            onClose: () => {
                this.scene.stop('AchievementSystem');
            }
        });
    }
    
    showDialog(message) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 創建插畫風格對話框
        this.createIllustrationDialog(message, null, null);
    }
    
    showConfirmDialog(message, onConfirm) {
        this.createIllustrationDialog(message, onConfirm, () => {});
    }
    
    createIllustrationDialog(message, onConfirm, onCancel) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 背景遮罩
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        overlay.setDepth(99);
        
        const dialogContainer = this.add.container(width / 2, height / 2);
        dialogContainer.setDepth(100);
        
        // 對話框尺寸
        const dlgWidth = 520;
        const dlgHeight = onConfirm ? 200 : 160;
        const radius = 20;
        
        // 陰影
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.4);
        shadow.fillRoundedRect(-dlgWidth/2 + 6, -dlgHeight/2 + 6, dlgWidth, dlgHeight, radius);
        dialogContainer.add(shadow);
        
        // 對話框背景
        const bg = this.add.graphics();
        bg.fillStyle(0x2d3561, 0.98);
        bg.fillRoundedRect(-dlgWidth/2, -dlgHeight/2, dlgWidth, dlgHeight, radius);
        bg.lineStyle(4, 0x5a67a8, 1);
        bg.strokeRoundedRect(-dlgWidth/2, -dlgHeight/2, dlgWidth, dlgHeight, radius);
        // 頂部裝飾線
        bg.lineStyle(2, 0xfeca57, 0.6);
        bg.beginPath();
        bg.moveTo(-dlgWidth/2 + 30, -dlgHeight/2 + 50);
        bg.lineTo(dlgWidth/2 - 30, -dlgHeight/2 + 50);
        bg.strokePath();
        
        dialogContainer.add(bg);
        
        // 訊息文字
        const text = this.add.text(0, onConfirm ? -30 : 0, message, {
            fontSize: '20px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: dlgWidth - 60 }
        }).setOrigin(0.5);
        dialogContainer.add(text);
        
        if (onConfirm) {
            // 確定按鈕 - 綠色
            const confirmBtn = this.createSmallIllustrationButton(-100, 40, '✓ 確定', 0x27ae60, onConfirm);
            dialogContainer.add(confirmBtn);
            
            // 取消按鈕 - 紅色
            const cancelBtn = this.createSmallIllustrationButton(100, 40, '✗ 取消', 0xe74c3c, () => {
                if (onCancel) onCancel();
            });
            dialogContainer.add(cancelBtn);
            
            // 點擊遮罩關閉（僅取消）
            overlay.setInteractive();
            overlay.on('pointerup', () => {
                overlay.destroy();
                dialogContainer.destroy();
                if (onCancel) onCancel();
            });
        } else {
            // 單純提示對話框 - 點擊任意處關閉
            const hint = this.add.text(0, 50, '(點擊任意處關閉)', {
                fontSize: '14px',
                fontFamily: '"Noto Sans TC", sans-serif',
                fill: '#888888'
            }).setOrigin(0.5);
            dialogContainer.add(hint);
            
            overlay.setInteractive();
            this.input.once('pointerup', () => {
                overlay.destroy();
                dialogContainer.destroy();
            });
        }
        
        // 彈入動畫
        dialogContainer.setScale(0.8);
        dialogContainer.setAlpha(0);
        this.tweens.add({
            targets: dialogContainer,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    createSmallIllustrationButton(x, y, text, baseColor, callback) {
        const container = this.add.container(x, y);
        
        const btnWidth = 120;
        const btnHeight = 45;
        const radius = 12;
        
        // 陰影
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.25);
        shadow.fillRoundedRect(-btnWidth/2 + 3, -btnHeight/2 + 3, btnWidth, btnHeight, radius);
        container.add(shadow);
        
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(baseColor, 1);
        bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        bg.fillStyle(0xffffff, 0.2);
        bg.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 2, btnWidth - 4, 15, 8);
        bg.lineStyle(2, 0xffffff, 0.4);
        bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        
        const hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, hitArea, label]);
        
        hitArea.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.08,
                duration: 150,
                ease: 'Back.easeOut'
            });
            this.audio.playHover();
        });
        
        hitArea.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });
        
        hitArea.on('pointerup', () => {
            this.audio.playClick();
            callback();
        });
        
        return container;
    }
}
