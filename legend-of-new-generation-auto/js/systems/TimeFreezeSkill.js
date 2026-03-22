// ⏱️ 時間凍結技能系統 - Time Freeze Skill System
// v1.4.0 新增功能

class TimeFreezeSkill {
    constructor(scene) {
        this.scene = scene;
        this.mpCost = 15;           // 技能消耗MP
        this.cooldown = 3;          // 冷卻回合數
        this.currentCooldown = 0;   // 當前冷卻
        this.freezeDuration = 1;    // 凍結持續回合
        this.isFrozen = false;      // 敵人是否被凍結
        this.timesUsed = 0;         // 使用次數統計
    }

    // 檢查是否可以使用技能
    canUse(currentMP) {
        return currentMP >= this.mpCost && this.currentCooldown === 0 && !this.isFrozen;
    }

    // 使用技能
    use() {
        if (!this.canUse(this.scene.playerData.mp)) {
            return false;
        }

        // 扣除MP
        this.scene.playerData.mp -= this.mpCost;
        this.currentCooldown = this.cooldown;
        this.isFrozen = true;
        this.timesUsed++;

        // 創建視覺效果
        this.createFreezeEffect();

        // 播放音效
        this.scene.audio.playMagic('time');

        // 🏆 成就：使用時間凍結
        AchievementSystem.checkAchievement(this.scene.game, 'use_time_freeze');

        return true;
    }

    // 更新冷卻
    updateCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }

    // 解除凍結
    releaseFreeze() {
        this.isFrozen = false;
    }

    // 創建凍結視覺效果
    createFreezeEffect() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // 時間凍結特效容器
        const freezeContainer = this.scene.add.container(400, 300);

        // 暗色遮罩
        const overlay = this.scene.add.rectangle(0, 0, 800, 600, 0x000080, 0.3);
        freezeContainer.add(overlay);

        // 時鐘圖標
        const clockIcon = this.scene.add.text(0, -50, '⏱️', {
            fontSize: '64px'
        }).setOrigin(0.5);
        freezeContainer.add(clockIcon);

        // 技能名稱
        const skillText = this.scene.add.text(0, 20, '時間凍結！', {
            fontSize: '28px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#00ffff',
            stroke: '#000080',
            strokeThickness: 4
        }).setOrigin(0.5);
        freezeContainer.add(skillText);

        // 描述文字
        const descText = this.scene.add.text(0, 60, '敵人被凍結，無法行動！', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);
        freezeContainer.add(descText);

        // 時鐘旋轉動畫
        this.scene.tweens.add({
            targets: clockIcon,
            rotation: Math.PI * 2,
            duration: 2000,
            ease: 'Power2'
        });

        // 整體縮放動畫
        this.scene.tweens.add({
            targets: freezeContainer,
            scale: { from: 0.5, to: 1 },
            duration: 500,
            ease: 'Back.out'
        });

        // 2秒後淡出
        this.scene.tweens.add({
            targets: freezeContainer,
            alpha: 0,
            delay: 2000,
            duration: 500,
            onComplete: () => freezeContainer.destroy()
        });

        // 敵人凍結視覺效果
        this.createEnemyFreezeEffect();
    }

    // 敵人凍結效果
    createEnemyFreezeEffect() {
        const enemy = this.scene.enemySprite;

        // 藍色光環
        const freezeRing = this.scene.add.circle(enemy.x, enemy.y, 60, 0x00ffff, 0.5);

        // 冰晶效果
        for (let i = 0; i < 8; i++) {
            const crystal = this.scene.add.text(enemy.x, enemy.y, '❄️', {
                fontSize: '24px'
            }).setOrigin(0.5);

            const angle = (i / 8) * Math.PI * 2;
            const distance = 50;

            this.scene.tweens.add({
                targets: crystal,
                x: enemy.x + Math.cos(angle) * distance,
                y: enemy.y + Math.sin(angle) * distance,
                scale: { from: 0.5, to: 1.5 },
                alpha: { from: 1, to: 0 },
                duration: 1000,
                ease: 'Power2',
                onComplete: () => crystal.destroy()
            });
        }

        // 敵人變藍並凍結
        enemy.setTint(0x00ffff);
        enemy.setAlpha(0.7);

        // 持續冰凍動畫
        this.scene.tweens.add({
            targets: freezeRing,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.5, to: 0.2 },
            duration: 1000,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                freezeRing.destroy();
                enemy.clearTint();
                enemy.setAlpha(1);
            }
        });
    }

    // 獲取技能按鈕文字
    getButtonText() {
        if (this.isFrozen) {
            return '⏱️ 凍結中';
        }
        if (this.currentCooldown > 0) {
            return `⏱️ CD:${this.currentCooldown}`;
        }
        return '⏱️ 時間凍結';
    }

    // 獲取按鈕顏色
    getButtonColor() {
        if (this.isFrozen) {
            return 0x666666; // 灰色 - 凍結中
        }
        if (this.currentCooldown > 0) {
            return 0x444444; // 深灰 - 冷卻中
        }
        return 0x00ffff; // 青色 - 可用
    }
}

// 導出技能類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeFreezeSkill;
}