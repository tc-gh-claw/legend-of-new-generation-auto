/**
 * SettingsScene - 設定場景
 * 插畫風格版本 - 圓潤滑塊、漸變按鈕
 */

class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 獲取音效管理器
        this.audio = AudioManager.getInstance(this);
        
        // 創建插畫風格背景
        this.createIllustrationBackground();
        
        // 標題
        const titleText = this.add.text(width / 2, 70, '⚙️ 遊戲設定', {
            fontSize: '42px',
            fontFamily: '"ZCOOL KuaiLe", "Noto Sans TC", cursive',
            fill: '#ffffff',
            stroke: '#e94560',
            strokeThickness: 4,
            shadow: { 
                offsetX: 3, 
                offsetY: 3, 
                color: '#000000', 
                blur: 6, 
                fill: true 
            }
        }).setOrigin(0.5);
        
        // 標題動畫
        this.tweens.add({
            targets: titleText,
            scale: { from: 0.95, to: 1.02 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 創建插畫風格滑塊控件
        this.createIllustrationSliders();
        
        // 靜音按鈕
        this.createIllustrationMuteButton();
        
        // 返回按鈕
        this.createIllustrationBackButton();
        
        // 音頻測試提示
        this.add.text(width / 2, height - 40, '💡 拖動滑塊時會播放測試音效', {
            fontSize: '14px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }
    
    createIllustrationBackground() {
        const graphics = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 柔和漸層背景
        for (let y = 0; y < height; y += 2) {
            const ratio = y / height;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 45, g: 53, b: 97 },
                { r: 26, g: 31, b: 58 },
                1, ratio
            );
            graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            graphics.fillRect(0, y, width, 2);
        }
        
        // 裝飾性光點
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(2, 6);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.3);
            
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
    }
    
    createIllustrationSliders() {
        const startY = 150;
        const gapY = 90;
        
        // 主音量
        this.createIllustrationSlider(400, startY, '🔊 主音量', '📢', () => this.audio.masterVolume, (v) => {
            this.audio.setMasterVolume(v);
        });
        
        // BGM音量
        this.createIllustrationSlider(400, startY + gapY, '🎵 音樂音量', '🎶', () => this.audio.bgmVolume, (v) => {
            this.audio.setBgmVolume(v);
        });
        
        // SFX音量
        this.createIllustrationSlider(400, startY + gapY * 2, '🔔 音效音量', '✨', () => this.audio.sfxVolume, (v) => {
            this.audio.setSfxVolume(v);
        });
    }
    
    createIllustrationSlider(x, y, label, emoji, getValue, setValue) {
        const container = this.add.container(x, y);
        
        // 背景卡片
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x1a1a2e, 0.6);
        cardBg.fillRoundedRect(-280, -35, 560, 70, 16);
        cardBg.lineStyle(2, 0x5a67a8, 0.5);
        cardBg.strokeRoundedRect(-280, -35, 560, 70, 16);
        container.add(cardBg);
        
        // 標籤
        const labelText = this.add.text(-260, 0, label, {
            fontSize: '20px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Emoji 圖標
        const emojiText = this.add.text(-130, -2, emoji, {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // 滑塊軌道背景
        const trackBg = this.add.graphics();
        trackBg.fillStyle(0x2d3561, 1);
        trackBg.fillRoundedRect(-80, -8, 260, 16, 8);
        container.add(trackBg);
        
        // 滑塊軌道邊框
        const trackBorder = this.add.graphics();
        trackBorder.lineStyle(2, 0x5a67a8, 0.8);
        trackBorder.strokeRoundedRect(-80, -8, 260, 16, 8);
        container.add(trackBorder);
        
        // 填充條 - 漸變效果
        const fill = this.add.graphics();
        const currentValue = getValue();
        this.drawSliderFill(fill, currentValue);
        
        // 滑塊手柄 - 插畫風格圓形
        const handleX = -80 + 260 * currentValue;
        const handle = this.add.circle(handleX, 0, 14, 0xffffff);
        handle.setInteractive({ useHandCursor: true });
        handle.setStrokeStyle(3, 0xe94560);
        
        // 手柄光澤
        const handleShine = this.add.circle(handleX - 4, -4, 5, 0xffffff, 0.6);
        
        // 當前值顯示
        const valueText = this.add.text(210, 0, Math.round(currentValue * 100) + '%', {
            fontSize: '18px',
            fontFamily: '"Noto Sans TC", sans-serif',
            fill: '#feca57',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([labelText, emojiText, fill, handle, handleShine, valueText]);
        
        // 拖動邏輯
        let isDragging = false;
        
        handle.on('pointerdown', () => {
            isDragging = true;
            this.audio.playClick();
            // 放大手柄
            this.tweens.add({
                targets: [handle, handleShine],
                scale: 1.2,
                duration: 150,
                ease: 'Back.easeOut'
            });
        });
        
        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const localX = pointer.x - x;
                let value = (localX + 80) / 260;
                value = Math.max(0, Math.min(1, value));
                
                setValue(value);
                
                // 更新顯示
                const newHandleX = -80 + 260 * value;
                handle.x = newHandleX;
                handleShine.x = newHandleX - 4;
                valueText.setText(Math.round(value * 100) + '%');
                
                // 重繪填充條
                fill.clear();
                this.drawSliderFill(fill, value);
            }
        });
        
        this.input.on('pointerup', () => {
            if (isDragging) {
                isDragging = false;
                // 縮小手柄
                this.tweens.add({
                    targets: [handle, handleShine],
                    scale: 1,
                    duration: 150,
                    ease: 'Back.easeOut'
                });
            }
        });
        
        // 點擊軌道直接跳轉
        const hitArea = this.add.rectangle(50, 0, 260, 40, 0x000000, 0);
        hitArea.setInteractive();
        container.add(hitArea);
        
        hitArea.on('pointerdown', (pointer) => {
            const localX = pointer.x - x;
            let value = (localX + 80) / 260;
            value = Math.max(0, Math.min(1, value));
            
            setValue(value);
            
            // 更新顯示
            const newHandleX = -80 + 260 * value;
            handle.x = newHandleX;
            handleShine.x = newHandleX - 4;
            valueText.setText(Math.round(value * 100) + '%');
            
            fill.clear();
            this.drawSliderFill(fill, value);
            
            this.audio.playClick();
            
            // 手柄彈動動畫
            this.tweens.add({
                targets: [handle, handleShine],
                scale: 1.1,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        });
    }
    
    drawSliderFill(graphics, value) {
        if (value <= 0) return;
        
        const fillWidth = 260 * value;
        
        // 漸變填充
        for (let i = 0; i < fillWidth; i += 2) {
            const ratio = i / fillWidth;
            const r = Math.floor(233 + (254 - 233) * ratio);  // #e94560 to #feca57
            const g = Math.floor(69 + (202 - 69) * ratio);
            const b = Math.floor(96 + (87 - 96) * ratio);
            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(-80 + i, -6, 2, 12);
        }
        
        // 頂部高光
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(-80, -6, fillWidth, 4);
    }
    
    createIllustrationMuteButton() {
        const settings = this.audio.getSettings();
        
        const container = this.add.container(400, 440);
        
        const btnWidth = 180;
        const btnHeight = 55;
        const radius = 14;
        
        // 陰影
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.25);
        shadow.fillRoundedRect(-btnWidth/2 + 3, -btnHeight/2 + 3, btnWidth, btnHeight, radius);
        container.add(shadow);
        
        // 背景 - 根據靜音狀態改變顏色
        const isMuted = this.audio.isMuted;
        const baseColor = isMuted ? 0xe74c3c : 0x27ae60;
        
        const bg = this.add.graphics();
        bg.fillStyle(baseColor, 1);
        bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        bg.fillStyle(0xffffff, 0.2);
        bg.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 2, btnWidth - 4, 18, 10);
        bg.lineStyle(2, 0xffffff, 0.4);
        bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        
        const hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        const muteText = isMuted ? '🔇 取消靜音' : '🔊 靜音';
        const label = this.add.text(0, 0, muteText, {
            fontSize: '18px',
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
        
        hitArea.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 80,
                ease: 'Power2'
            });
        });
        
        hitArea.on('pointerup', () => {
            this.tweens.add({
                targets: container,
                scale: 1.08,
                duration: 150,
                ease: 'Back.easeOut'
            });
            
            this.audio.playClick();
            const newMuted = this.audio.toggleMute();
            
            // 更新按鈕外觀
            const newColor = newMuted ? 0xe74c3c : 0x27ae60;
            bg.clear();
            bg.fillStyle(newColor, 1);
            bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
            bg.fillStyle(0xffffff, 0.2);
            bg.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 2, btnWidth - 4, 18, 10);
            bg.lineStyle(2, 0xffffff, 0.4);
            bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
            
            label.setText(newMuted ? '🔇 取消靜音' : '🔊 靜音');
        });
    }
    
    createIllustrationBackButton() {
        const container = this.add.container(400, 520);
        
        const btnWidth = 160;
        const btnHeight = 50;
        const radius = 12;
        
        // 陰影
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.25);
        shadow.fillRoundedRect(-btnWidth/2 + 3, -btnHeight/2 + 3, btnWidth, btnHeight, radius);
        container.add(shadow);
        
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x3498db, 1);
        bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        bg.fillStyle(0xffffff, 0.2);
        bg.fillRoundedRect(-btnWidth/2 + 2, -btnHeight/2 + 2, btnWidth - 4, 16, 8);
        bg.lineStyle(2, 0xffffff, 0.4);
        bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, radius);
        
        const hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, '← 返回選單', {
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
        
        hitArea.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 80,
                ease: 'Power2'
            });
        });
        
        hitArea.on('pointerup', () => {
            this.tweens.add({
                targets: container,
                scale: 1.08,
                duration: 150,
                ease: 'Back.easeOut'
            });
            this.audio.playClick();
            this.scene.start('MenuScene');
        });
    }
}

// 導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsScene;
}
