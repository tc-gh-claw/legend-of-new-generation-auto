/**
 * LevelUpScene - 升級系統
 * 升級時選擇技能和屬性提升
 */

class LevelUpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelUpScene' });
    }

    init(data) {
        this.playerData = data.player;
        this.newLevel = data.newLevel;
        this.onComplete = data.onComplete;
        this.skillOptions = this.generateSkillOptions();
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 背景效果
        this.createBackgroundEffects();

        // 半透明遮罩
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

        // 升級標題
        this.add.text(width / 2, 60, '⭐ 升級！', {
            fontSize: '48px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // 等級顯示
        this.add.text(width / 2, 120, `達到等級 ${this.newLevel}`, {
            fontSize: '28px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 屬性提升顯示
        this.showStatIncreases();

        // 顏色變化提示
        this.showColorChange();

        // 技能選擇提示
        this.add.text(width / 2, 220, '選擇一個技能提升：', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // 技能選項
        this.createSkillChoices();

        // 屬性點分配提示
        this.add.text(width / 2, 480, '屬性已自動提升', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
    }

    createBackgroundEffects() {
        // 創建星星閃爍效果
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const star = this.add.star(x, y, 5, 5, 10, 0xFFD700);

            this.tweens.add({
                targets: star,
                scale: { from: 0.5, to: 1.5 },
                alpha: { from: 0.3, to: 1 },
                duration: Phaser.Math.Between(500, 1500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 光環效果
        const ring = this.add.circle(400, 300, 200, 0xFFD700, 0.1);
        this.tweens.add({
            targets: ring,
            scale: { from: 0.8, to: 1.2 },
            alpha: { from: 0.1, to: 0.3 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }

    showStatIncreases() {
        const container = this.add.container(400, 170);

        // 計算屬性提升
        const hpIncrease = 10 + Math.floor(this.newLevel / 5) * 5;
        const mpIncrease = 5 + Math.floor(this.newLevel / 5) * 3;
        const attackIncrease = 2 + Math.floor(this.newLevel / 10);

        const stats = [
            { icon: '❤️', name: '最大HP', value: `+${hpIncrease}`, color: '#ff6b6b' },
            { icon: '💧', name: '最大MP', value: `+${mpIncrease}`, color: '#74b9ff' },
            { icon: '⚔️', name: '攻擊力', value: `+${attackIncrease}`, color: '#f39c12' }
        ];

        stats.forEach((stat, index) => {
            const x = (index - 1) * 150;

            const statText = this.add.text(x, 0, `${stat.icon} ${stat.value}`, {
                fontSize: '18px',
                fontFamily: 'Microsoft JhengHei',
                fill: stat.color
            }).setOrigin(0.5);

            const nameText = this.add.text(x, 25, stat.name, {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#888888'
            }).setOrigin(0.5);

            container.add([statText, nameText]);

            // 動畫
            this.tweens.add({
                targets: [statText, nameText],
                y: '+=5',
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: index * 100
            });
        });

        // 應用屬性提升
        this.playerData.maxHp += hpIncrease;
        this.playerData.hp = this.playerData.maxHp;
        this.playerData.maxMp += mpIncrease;
        this.playerData.mp = this.playerData.maxMp;

        // 攻擊力提升 - 每級增加
        this.playerData.attack = (this.playerData.attack || 10) + attackIncrease;

        // 保存到全局
        if (!this.game.globals.playerAttack) {
            this.game.globals.playerAttack = 10;
        }
        this.game.globals.playerAttack = this.playerData.attack;
    }

    showColorChange() {
        // 等級顏色對應表 - 主角身體顏色隨等級變化
        const levelColors = [
            { level: 1, color: 0xffffff, name: '白色', tint: 0xffffff },      // 初心者 - 白色
            { level: 3, color: 0x2ecc71, name: '綠色', tint: 0x90EE90 },      // Lv.3 - 嫩綠
            { level: 5, color: 0x3498db, name: '藍色', tint: 0x87CEEB },      // Lv.5 - 天藍
            { level: 8, color: 0x9b59b6, name: '紫色', tint: 0xDDA0DD },      // Lv.8 - 紫羅蘭
            { level: 10, color: 0xf39c12, name: '金色', tint: 0xFFD700 },     // Lv.10 - 黃金
            { level: 15, color: 0xe74c3c, name: '紅色', tint: 0xFF6B6B },     // Lv.15 - 赤紅
            { level: 20, color: 0x00ced1, name: '青色', tint: 0x00FFFF },     // Lv.20 - 青藍
            { level: 30, color: 0xff1493, name: '粉色', tint: 0xFF69B4 },     // Lv.30 - 深粉
            { level: 50, color: 0x1abc9c, name: '傳說', tint: 0x40E0D0 }      // Lv.50 - 傳說色
        ];

        // 找到當前等級對應的顏色
        let currentColor = levelColors[0];
        for (let i = levelColors.length - 1; i >= 0; i--) {
            if (this.newLevel >= levelColors[i].level) {
                currentColor = levelColors[i];
                break;
            }
        }

        // 保存顏色到全局
        this.game.globals.playerColor = currentColor.tint;

        // 顯示顏色變化
        const colorContainer = this.add.container(400, 520);

        const colorCircle = this.add.circle(-80, 0, 25, currentColor.color);
        colorCircle.setStrokeStyle(3, 0xffffff);

        const colorText = this.add.text(20, 0, `身體變為${currentColor.name}！`, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        colorContainer.add([colorCircle, colorText]);

        // 顏色光環動畫
        this.tweens.add({
            targets: colorCircle,
            scale: { from: 0.8, to: 1.2 },
            alpha: { from: 0.7, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });

        // 升級特效 - 粒子爆發
        this.createColorBurst(400, 520, currentColor.color);
    }

    createColorBurst(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(x, y, 6, color);

            const angle = (i / 12) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 0.3 },
                duration: 800,
                delay: i * 30,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    generateSkillOptions() {
        // 根據等級生成可用的技能選項
        const allSkills = [
            {
                id: 'quick_thinker',
                name: '敏捷思維',
                icon: '⚡',
                description: '答題時間延長3秒',
                effect: { type: 'time_bonus', value: 3 },
                color: 0x3498db
            },
            {
                id: 'power_attack',
                name: '力量攻擊',
                icon: '💪',
                description: '答對題目時傷害+25%',
                effect: { type: 'damage_bonus', value: 0.25 },
                color: 0xe74c3c
            },
            {
                id: 'wisdom_boost',
                name: '智慧提升',
                icon: '📚',
                description: '獲得的經驗值+20%',
                effect: { type: 'exp_bonus', value: 0.2 },
                color: 0x9b59b6
            },
            {
                id: 'iron_will',
                name: '鋼鐵意志',
                icon: '🛡️',
                description: '受到的傷害減少15%',
                effect: { type: 'defense_bonus', value: 0.15 },
                color: 0x2ecc71
            },
            {
                id: 'lucky_star',
                name: '幸運之星',
                icon: '🍀',
                description: '戰鬥後獲得金幣+30%',
                effect: { type: 'gold_bonus', value: 0.3 },
                color: 0xf1c40f
            },
            {
                id: 'healing_touch',
                name: '治療之觸',
                icon: '💚',
                description: '每場戰鬥結束後恢復20% HP',
                effect: { type: 'heal_after_battle', value: 0.2 },
                color: 0x1abc9c
            }
        ];

        // 隨機選擇3個技能
        const shuffled = Phaser.Utils.Array.Shuffle([...allSkills]);
        return shuffled.slice(0, 3);
    }

    createSkillChoices() {
        const startX = 150;
        const startY = 320;
        const cardWidth = 180;
        const cardHeight = 220;
        const gap = 20;

        this.skillOptions.forEach((skill, index) => {
            const x = startX + index * (cardWidth + gap);
            const y = startY;

            const card = this.createSkillCard(x, y, cardWidth, cardHeight, skill);

            // 入場動畫
            card.setAlpha(0);
            card.y += 50;

            this.tweens.add({
                targets: card,
                alpha: 1,
                y: y,
                duration: 500,
                delay: index * 150,
                ease: 'Back.out'
            });
        });
    }

    createSkillCard(x, y, width, height, skill) {
        const container = this.add.container(x, y);

        // 卡片背景
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50);
        bg.setStrokeStyle(3, skill.color);
        bg.setInteractive({ useHandCursor: true });

        // 技能圖標背景
        const iconBg = this.add.circle(0, -60, 40, skill.color, 0.3);

        // 技能圖標
        const icon = this.add.text(0, -60, skill.icon, {
            fontSize: '48px'
        }).setOrigin(0.5);

        // 技能名稱
        const name = this.add.text(0, -10, skill.name, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 技能描述
        const desc = this.add.text(0, 30, skill.description, {
            fontSize: '13px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: width - 20 }
        }).setOrigin(0.5);

        // 選擇按鈕
        const buttonBg = this.add.rectangle(0, 80, 120, 35, skill.color);
        buttonBg.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(0, 80, '選擇', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, iconBg, icon, name, desc, buttonBg, buttonText]);

        // 互動效果
        const hoverEffect = () => {
            this.tweens.add({
                targets: container,
                scale: 1.05,
                duration: 200,
                ease: 'Power2'
            });
            bg.setFillStyle(0x34495e);
        };

        const normalEffect = () => {
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
            bg.setFillStyle(0x2c3e50);
        };

        bg.on('pointerover', hoverEffect);
        bg.on('pointerout', normalEffect);
        buttonBg.on('pointerover', hoverEffect);
        buttonBg.on('pointerout', normalEffect);

        const selectSkill = () => {
            this.selectSkill(skill);
        };

        bg.on('pointerup', selectSkill);
        buttonBg.on('pointerup', selectSkill);

        return container;
    }

    selectSkill(skill) {
        // 應用技能效果
        if (!this.game.globals.skills) {
            this.game.globals.skills = [];
        }

        // 檢查是否已有相同技能
        const existingSkill = this.game.globals.skills.find(s => s.id === skill.id);
        if (existingSkill) {
            // 升級現有技能
            existingSkill.level = (existingSkill.level || 1) + 1;
            // 增強效果
            if (existingSkill.effect.value) {
                existingSkill.effect.value += skill.effect.value * 0.5;
            }
        } else {
            // 添加新技能
            this.game.globals.skills.push({
                ...skill,
                level: 1
            });
        }

        // 顯示選擇結果
        this.showSelectionResult(skill);

        // 延遲後關閉
        this.time.delayedCall(2000, () => {
            if (this.onComplete) {
                this.onComplete({
                    skill: skill,
                    playerData: this.playerData
                });
            }
            this.scene.stop();
        });
    }

    showSelectionResult(skill) {
        // 隱藏其他卡片
        this.children.list.forEach(child => {
            if (child instanceof Phaser.GameObjects.Container) {
                // 找到技能卡片容器
                if (child.y === 320) {
                    // 檢查是否為選中的技能
                    const cardName = child.list[3]; // 名稱文本
                    if (cardName && cardName.text !== skill.name) {
                        this.tweens.add({
                            targets: child,
                            alpha: 0,
                            scale: 0.8,
                            duration: 300
                        });
                    } else {
                        // 放大選中的卡片
                        this.tweens.add({
                            targets: child,
                            scale: 1.2,
                            y: 250,
                            duration: 500,
                            ease: 'Back.out'
                        });
                    }
                }
            }
        });

        // 顯示獲得技能提示
        const resultText = this.add.text(400, 450, `✨ 獲得了技能: ${skill.name}!`, {
            fontSize: '24px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        resultText.setAlpha(0);
        resultText.setScale(0.5);

        this.tweens.add({
            targets: resultText,
            alpha: 1,
            scale: 1,
            duration: 500,
            ease: 'Back.out'
        });
    }

    // 靜態方法：檢查是否升級
    static checkLevelUp(playerData, expGained) {
        playerData.exp += expGained;

        let leveledUp = false;
        let newLevel = playerData.level;

        // 經驗值需求公式：每級固定100經驗值
        while (playerData.exp >= 100) {
            playerData.exp -= 100;
            newLevel++;
            leveledUp = true;
        }

        return {
            leveledUp,
            oldLevel: playerData.level,
            newLevel,
            remainingExp: playerData.exp
        };
    }

    // 靜態方法：獲取升級需求
    static getExpRequired(level) {
        return 100; // 每級固定100經驗值
    }

    // 靜態方法：獲取經驗值進度百分比
    static getExpProgress(playerData) {
        return (playerData.exp / 100) * 100;
    }
}
