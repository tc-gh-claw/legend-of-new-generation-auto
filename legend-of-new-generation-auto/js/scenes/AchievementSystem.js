/**
 * AchievementSystem - 成就系統
 * 管理成就數據、檢測成就解鎖、顯示成就界面
 */

class AchievementSystem extends Phaser.Scene {
    constructor() {
        super({ key: 'AchievementSystem' });
    }

    init(data) {
        this.onClose = data.onClose;
        this.currentTab = 'all'; // 'all', 'combat', 'progress', 'collection', 'special'
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

        // 標題
        this.add.text(width / 2, 40, '🏆 成就系統', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 載入成就數據
        this.achievementsData = this.cache.json.get('achievementsData');
        
        // 初始化成就追蹤
        this.initAchievementTracking();

        // 創建分類標籤
        this.createCategoryTabs();

        // 創建統計信息
        this.createStatsPanel();

        // 成就列表容器
        this.achievementsContainer = this.add.container(0, 0);

        // 顯示成就列表
        this.showAchievementsList();

        // 關閉按鈕
        this.createCloseButton();

        // 成就解鎖動畫隊列
        this.unlockQueue = [];
        this.isShowingUnlock = false;
    }

    // 初始化成就追蹤數據
    initAchievementTracking() {
        if (!this.game.globals.achievements) {
            this.game.globals.achievements = {
                unlocked: [],
                progress: {},
                stats: {
                    totalKills: 0,
                    totalBossKills: 0,
                    maxCombo: 0,
                    totalGoldEarned: 0,
                    totalQuestsCompleted: 0,
                    correctBySubject: {
                        math: 0,
                        science: 0,
                        english: 0,
                        general: 0
                    },
                    potionsUsed: 0,
                    itemsCollected: 0,
                    defenseCorrect: 0
                }
            };
        }
    }

    // 創建分類標籤
    createCategoryTabs() {
        const width = this.cameras.main.width;

        const tabs = [
            { id: 'all', label: '全部', x: width / 2 - 240 },
            { id: 'combat', label: '⚔️ 戰鬥', x: width / 2 - 120 },
            { id: 'progress', label: '📈 進度', x: width / 2 },
            { id: 'collection', label: '💎 收集', x: width / 2 + 120 },
            { id: 'special', label: '✨ 特殊', x: width / 2 + 240 }
        ];

        this.tabButtons = {};

        tabs.forEach(tab => {
            this.tabButtons[tab.id] = this.createTabButton(tab.x, 90, tab.label, tab.id === this.currentTab, () => {
                this.switchTab(tab.id);
            });
        });
    }

    createTabButton(x, y, text, isActive, callback) {
        const color = isActive ? 0xf1c40f : 0x2c3e50;
        const bg = this.add.rectangle(x, y, 110, 40, color);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: isActive ? '#000000' : '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            if (this.currentTab !== callback.tabId) bg.setFillStyle(0x34495e);
        });

        bg.on('pointerout', () => {
            if (this.currentTab !== callback.tabId) bg.setFillStyle(0x2c3e50);
        });

        bg.on('pointerup', callback);

        return { bg, label, tabId: callback.tabId };
    }

    switchTab(tabId) {
        if (this.currentTab === tabId) return;

        // 更新按鈕樣式
        Object.keys(this.tabButtons).forEach(key => {
            const isActive = key === tabId;
            this.tabButtons[key].bg.setFillStyle(isActive ? 0xf1c40f : 0x2c3e50);
            this.tabButtons[key].label.setFill(isActive ? '#000000' : '#ffffff');
        });

        this.currentTab = tabId;
        this.showAchievementsList();
    }

    // 創建統計面板
    createStatsPanel() {
        const container = this.add.container(400, 135);

        const bg = this.add.rectangle(0, 0, 760, 50, 0x1a1a2e);
        bg.setStrokeStyle(2, 0x3498db);

        const stats = this.game.globals.achievements?.stats || {};
        const unlocked = this.game.globals.achievements?.unlocked || [];

        // 計算總成就數
        let totalAchievements = 0;
        if (this.achievementsData?.achievements) {
            Object.values(this.achievementsData.achievements).forEach(category => {
                totalAchievements += category.length;
            });
        }

        const statsText = this.add.text(0, 0, 
            `🎯 已解鎖: ${unlocked.length}/${totalAchievements}  |  ` +
            `👹 擊敗敵人: ${stats.totalKills || 0}  |  ` +
            `🔥 最高連擊: ${stats.maxCombo || 0}  |  ` +
            `💰 累計金幣: ${stats.totalGoldEarned || 0}`, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, statsText]);
    }

    // 顯示成就列表
    showAchievementsList() {
        this.achievementsContainer.removeAll(true);

        if (!this.achievementsData?.achievements) {
            this.showEmptyMessage('無法載入成就數據');
            return;
        }

        let achievements = [];
        
        if (this.currentTab === 'all') {
            // 收集所有成就
            Object.values(this.achievementsData.achievements).forEach(category => {
                achievements = achievements.concat(category);
            });
        } else {
            achievements = this.achievementsData.achievements[this.currentTab] || [];
        }

        if (achievements.length === 0) {
            this.showEmptyMessage('暫時沒有此類別的成就');
            return;
        }

        this.displayAchievementsGrid(achievements);
    }

    displayAchievementsGrid(achievements) {
        const startX = 100;
        const startY = 200;
        const itemWidth = 360;
        const itemHeight = 90;
        const gapX = 20;
        const gapY = 15;
        const itemsPerRow = 2;

        achievements.forEach((achievement, index) => {
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);

            const x = startX + col * (itemWidth + gapX);
            const y = startY + row * (itemHeight + gapY);

            const achievementCard = this.createAchievementCard(x, y, itemWidth, itemHeight, achievement);
            this.achievementsContainer.add(achievementCard);
        });
    }

    createAchievementCard(x, y, width, height, achievement) {
        const container = this.add.container(x, y);

        const unlocked = this.game.globals.achievements?.unlocked || [];
        const isUnlocked = unlocked.includes(achievement.id);
        const isHidden = achievement.hidden && !isUnlocked;

        // 背景
        const bgColor = isUnlocked ? 0x2d5016 : (isHidden ? 0x1a1a2e : 0x2c3e50);
        const bg = this.add.rectangle(0, 0, width, height, bgColor);
        bg.setStrokeStyle(2, isUnlocked ? 0x4ade80 : 0x34495e);

        // 圖標
        const icon = this.add.text(-width / 2 + 35, 0, 
            isHidden ? '❓' : achievement.icon, {
            fontSize: '36px'
        }).setOrigin(0.5);

        // 名稱
        const nameText = isHidden ? '???' : achievement.name;
        const nameColor = isUnlocked ? '#f1c40f' : '#ffffff';
        const name = this.add.text(-width / 2 + 80, -20, nameText, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: nameColor,
            fontStyle: isUnlocked ? 'bold' : 'normal'
        }).setOrigin(0, 0.5);

        // 描述
        const descText = isHidden ? '完成特定條件以解鎖' : achievement.description;
        const descColor = isUnlocked ? '#a3e635' : '#888888';
        const desc = this.add.text(-width / 2 + 80, 5, descText, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: descColor,
            wordWrap: { width: width - 100 }
        }).setOrigin(0, 0.5);

        // 進度條
        const progressY = 30;
        const progressWidth = width - 100;
        const progressHeight = 8;
        
        const progressData = this.getAchievementProgress(achievement);
        const progressPercent = Math.min(100, (progressData.current / progressData.target) * 100);

        const progressBg = this.add.rectangle(-width / 2 + 80 + progressWidth / 2, progressY, progressWidth, progressHeight, 0x000000);
        progressBg.setOrigin(0.5);

        const progressFill = this.add.rectangle(-width / 2 + 80, progressY, progressWidth * (progressPercent / 100), progressHeight, 
            isUnlocked ? 0x4ade80 : 0x3498db);
        progressFill.setOrigin(0, 0.5);

        // 進度文字
        const progressText = isHidden ? '' : `${progressData.current}/${progressData.target}`;
        const progressLabel = this.add.text(width / 2 - 10, progressY, progressText, {
            fontSize: '11px',
            fontFamily: 'Microsoft JhengHei',
            fill: isUnlocked ? '#4ade80' : '#888888'
        }).setOrigin(1, 0.5);

        // 獎勵圖標
        if (isUnlocked && achievement.reward) {
            const rewardText = `+${achievement.reward.exp}⭐ +${achievement.reward.gold}💰`;
            const rewardLabel = this.add.text(width / 2 - 10, -25, rewardText, {
                fontSize: '11px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#f1c40f'
            }).setOrigin(1, 0.5);
            container.add(rewardLabel);
        }

        // 解鎖標記
        if (isUnlocked) {
            const checkmark = this.add.text(width / 2 - 15, -height / 2 + 15, '✓', {
                fontSize: '20px',
                fill: '#4ade80'
            }).setOrigin(0.5);
            container.add(checkmark);
        }

        container.add([bg, icon, name, desc, progressBg, progressFill, progressLabel]);

        return container;
    }

    // 獲取成就進度
    getAchievementProgress(achievement) {
        const stats = this.game.globals.achievements?.stats || {};
        const condition = achievement.condition;

        switch (condition.type) {
            case 'win_battle':
                return { current: stats.totalKills > 0 ? 1 : 0, target: condition.count };
            case 'kill_enemy':
                return { current: stats.totalKills || 0, target: condition.count };
            case 'kill_boss':
                return { current: stats.totalBossKills || 0, target: condition.count };
            case 'combo':
                return { current: stats.maxCombo || 0, target: condition.count };
            case 'reach_level':
                return { current: this.game.globals.playerLevel || 1, target: condition.count };
            case 'complete_quest':
                return { current: stats.totalQuestsCompleted || 0, target: condition.count };
            case 'earn_gold':
                return { current: stats.totalGoldEarned || 0, target: condition.count };
            case 'collect_item':
                return { current: stats.itemsCollected || 0, target: condition.count };
            case 'use_potion':
                return { current: stats.potionsUsed || 0, target: condition.count };
            case 'correct_subject':
                return { current: stats.correctBySubject?.[condition.subject] || 0, target: condition.count };
            case 'defend_correct':
                return { current: stats.defenseCorrect || 0, target: condition.count };
            default:
                return { current: 0, target: condition.count };
        }
    }

    showEmptyMessage(message) {
        const emptyText = this.add.text(400, 400, message, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        this.achievementsContainer.add(emptyText);
    }

    createCloseButton() {
        const closeBtn = this.add.text(760, 40, '✕', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c'
        }).setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => {
            closeBtn.setScale(1.2);
        });

        closeBtn.on('pointerout', () => {
            closeBtn.setScale(1);
        });

        closeBtn.on('pointerup', () => {
            if (this.onClose) {
                this.onClose();
            }
            this.scene.stop();
        });
    }

    // ========== 靜態方法：用於檢查和更新成就 ==========

    // 檢查並更新成就（在戰鬥場景等地方調用）
    static checkAchievement(game, type, data = {}) {
        if (!game.globals.achievements) return;

        const achievements = game.globals.achievements;
        let updated = false;

        switch (type) {
            case 'win_battle':
                // 首次勝利
                if (!achievements.unlocked.includes('first_blood')) {
                    AchievementSystem.unlockAchievement(game, 'first_blood');
                }
                break;

            case 'kill_enemy':
                achievements.stats.totalKills = (achievements.stats.totalKills || 0) + 1;
                
                // 檢查怪物獵人成就
                if (achievements.stats.totalKills >= 10 && !achievements.unlocked.includes('monster_hunter')) {
                    AchievementSystem.unlockAchievement(game, 'monster_hunter');
                }
                if (achievements.stats.totalKills >= 50 && !achievements.unlocked.includes('monster_slayer')) {
                    AchievementSystem.unlockAchievement(game, 'monster_slayer');
                }
                updated = true;
                break;

            case 'kill_boss':
                achievements.stats.totalBossKills = (achievements.stats.totalBossKills || 0) + 1;
                
                if (!achievements.unlocked.includes('boss_bane')) {
                    AchievementSystem.unlockAchievement(game, 'boss_bane');
                }
                updated = true;
                break;

            case 'combo':
                const combo = data.combo || 0;
                if (combo > (achievements.stats.maxCombo || 0)) {
                    achievements.stats.maxCombo = combo;
                    updated = true;
                }
                
                // 檢查連擊成就
                if (combo >= 5 && !achievements.unlocked.includes('combo_novice')) {
                    AchievementSystem.unlockAchievement(game, 'combo_novice');
                }
                if (combo >= 10 && !achievements.unlocked.includes('combo_master')) {
                    AchievementSystem.unlockAchievement(game, 'combo_master');
                }
                if (combo >= 15 && !achievements.unlocked.includes('combo_legend')) {
                    AchievementSystem.unlockAchievement(game, 'combo_legend');
                }
                break;

            case 'correct_answer':
                const subject = data.subject;
                if (subject) {
                    achievements.stats.correctBySubject = achievements.stats.correctBySubject || {};
                    achievements.stats.correctBySubject[subject] = 
                        (achievements.stats.correctBySubject[subject] || 0) + 1;
                    updated = true;
                }
                break;

            case 'defend_correct':
                achievements.stats.defenseCorrect = (achievements.stats.defenseCorrect || 0) + 1;
                
                if (achievements.stats.defenseCorrect >= 5 && !achievements.unlocked.includes('perfect_defense')) {
                    AchievementSystem.unlockAchievement(game, 'perfect_defense');
                }
                updated = true;
                break;

            case 'earn_gold':
                achievements.stats.totalGoldEarned = (achievements.stats.totalGoldEarned || 0) + (data.amount || 0);
                
                if (achievements.stats.totalGoldEarned >= 100 && !achievements.unlocked.includes('first_gold')) {
                    AchievementSystem.unlockAchievement(game, 'first_gold');
                }
                if (achievements.stats.totalGoldEarned >= 1000 && !achievements.unlocked.includes('rich_man')) {
                    AchievementSystem.unlockAchievement(game, 'rich_man');
                }
                updated = true;
                break;

            case 'complete_quest':
                achievements.stats.totalQuestsCompleted = (achievements.stats.totalQuestsCompleted || 0) + 1;
                
                if (achievements.stats.totalQuestsCompleted >= 3 && !achievements.unlocked.includes('quest_novice')) {
                    AchievementSystem.unlockAchievement(game, 'quest_novice');
                }
                if (achievements.stats.totalQuestsCompleted >= 10 && !achievements.unlocked.includes('quest_master')) {
                    AchievementSystem.unlockAchievement(game, 'quest_master');
                }
                updated = true;
                break;

            case 'use_potion':
                achievements.stats.potionsUsed = (achievements.stats.potionsUsed || 0) + 1;
                
                if (achievements.stats.potionsUsed >= 10 && !achievements.unlocked.includes('potion_hoarder')) {
                    AchievementSystem.unlockAchievement(game, 'potion_hoarder');
                }
                updated = true;
                break;

            case 'collect_item':
                achievements.stats.itemsCollected = (achievements.stats.itemsCollected || 0) + 1;
                
                if (achievements.stats.itemsCollected >= 1 && !achievements.unlocked.includes('first_item')) {
                    AchievementSystem.unlockAchievement(game, 'first_item');
                }
                updated = true;
                break;

            case 'level_up':
                const level = data.level || 1;
                
                if (level >= 5 && !achievements.unlocked.includes('level_up_5')) {
                    AchievementSystem.unlockAchievement(game, 'level_up_5');
                }
                if (level >= 10 && !achievements.unlocked.includes('level_up_10')) {
                    AchievementSystem.unlockAchievement(game, 'level_up_10');
                }
                if (level >= 20 && !achievements.unlocked.includes('level_up_20')) {
                    AchievementSystem.unlockAchievement(game, 'level_up_20');
                }
                break;
        }

        return updated;
    }

    // 解鎖成就
    static unlockAchievement(game, achievementId) {
        if (!game.globals.achievements) {
            game.globals.achievements = { unlocked: [], progress: {}, stats: {} };
        }

        const achievements = game.globals.achievements;
        
        if (!achievements.unlocked.includes(achievementId)) {
            achievements.unlocked.push(achievementId);
            
            // 觸發成就解鎖通知
            const scene = game.scene.getScene('BattleScene') || 
                          game.scene.getScene('VillageScene') || 
                          game.scene.getScene('WorldScene');
            
            if (scene) {
                scene.events.emit('achievementUnlocked', achievementId);
            }

            console.log(`🏆 成就解鎖: ${achievementId}`);
            return true;
        }
        
        return false;
    }
}
