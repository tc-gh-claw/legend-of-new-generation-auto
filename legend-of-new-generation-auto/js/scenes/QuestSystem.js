/**
 * QuestSystem - 任務系統
 * NPC給予任務，追蹤任務進度，領取獎勵
 */

class QuestSystem extends Phaser.Scene {
    constructor() {
        super({ key: 'QuestSystem' });
    }

    init(data) {
        this.mode = data.mode || 'npc'; // 'npc', 'log', 'board'
        this.npcId = data.npcId;
        this.onClose = data.onClose;
        this.currentTab = 'active'; // 'active', 'completed', 'available'
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

        // 標題
        const titles = {
            'npc': '📜 任務對話',
            'log': '📋 任務日誌',
            'board': '📌 任務公告欄'
        };

        this.add.text(width / 2, 40, titles[this.mode] || '📜 任務', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 根據模式顯示不同界面
        if (this.mode === 'npc') {
            this.createNPCDialog();
        } else {
            this.createQuestLog();
        }

        // 關閉按鈕
        this.createCloseButton();
    }

    createNPCDialog() {
        // NPC對話界面
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // NPC頭像區域
        const npcAvatar = this.add.circle(150, 180, 60, 0x3498db);
        npcAvatar.setStrokeStyle(4, 0xf1c40f);

        const npcEmoji = this.add.text(150, 180, this.getNPEmoji(), {
            fontSize: '60px'
        }).setOrigin(0.5);

        // NPC名稱
        const npcName = this.add.text(150, 260, this.getNPCName(), {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 對話框
        const dialogBg = this.add.rectangle(500, 200, 500, 200, 0x2c3e50);
        dialogBg.setStrokeStyle(2, 0x3498db);

        this.dialogText = this.add.text(280, 130, '', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'left',
            wordWrap: { width: 440 }
        });

        // 選項按鈕容器
        this.optionsContainer = this.add.container(500, 420);

        // 顯示對話內容
        this.showNPCDialog();
    }

    createQuestLog() {
        // 創建標籤頁
        this.createTabs();

        // 任務列表容器
        this.questListContainer = this.add.container(0, 0);

        // 任務詳情面板
        this.questDetailPanel = this.createQuestDetailPanel();
        this.questDetailPanel.setVisible(false);

        // 顯示當前標籤的內容
        this.showCurrentTab();
    }

    createTabs() {
        const width = this.cameras.main.width;

        const tabs = [
            { id: 'active', label: '📋 進行中', x: width / 2 - 200 },
            { id: 'available', label: '✨ 可接取', x: width / 2 },
            { id: 'completed', label: '✅ 已完成', x: width / 2 + 200 }
        ];

        this.tabButtons = {};

        tabs.forEach(tab => {
            this.tabButtons[tab.id] = this.createTabButton(tab.x, 90, tab.label, tab.id === this.currentTab, () => {
                this.switchTab(tab.id);
            });
        });
    }

    createTabButton(x, y, text, isActive, callback) {
        const color = isActive ? 0x3498db : 0x2c3e50;
        const bg = this.add.rectangle(x, y, 150, 40, color);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            if (this.currentTab !== callback.tabId) bg.setFillStyle(0x34495e);
        });

        bg.on('pointerout', () => {
            if (this.currentTab !== callback.tabId) bg.setFillStyle(0x2c3e50);
        });

        bg.on('pointerup', callback);

        return { bg, label };
    }

    switchTab(tabId) {
        if (this.currentTab === tabId) return;

        // 更新按鈕樣式
        Object.keys(this.tabButtons).forEach(key => {
            const isActive = key === tabId;
            this.tabButtons[key].bg.setFillStyle(isActive ? 0x3498db : 0x2c3e50);
        });

        this.currentTab = tabId;
        this.showCurrentTab();

        // 隱藏詳情面板
        this.questDetailPanel.setVisible(false);
    }

    showCurrentTab() {
        this.questListContainer.removeAll(true);

        switch (this.currentTab) {
            case 'active':
                this.showActiveQuests();
                break;
            case 'available':
                this.showAvailableQuests();
                break;
            case 'completed':
                this.showCompletedQuests();
                break;
        }
    }

    showActiveQuests() {
        const activeQuests = this.game.globals.activeQuests || [];

        if (activeQuests.length === 0) {
            this.showEmptyMessage('沒有進行中的任務');
            return;
        }

        this.displayQuestList(activeQuests, 'active');
    }

    showAvailableQuests() {
        // 獲取可接取的任務
        const availableQuests = this.getAvailableQuests();

        if (availableQuests.length === 0) {
            this.showEmptyMessage('暫時沒有可接取的任務');
            return;
        }

        this.displayQuestList(availableQuests, 'available');
    }

    showCompletedQuests() {
        const completedQuests = this.game.globals.completedQuests || [];

        if (completedQuests.length === 0) {
            this.showEmptyMessage('還沒有完成的任務');
            return;
        }

        this.displayQuestList(completedQuests, 'completed');
    }

    getAvailableQuests() {
        // 從 quests.json 獲取所有任務
        // 這裡使用簡化的任務數據
        const allQuests = [
            {
                id: 'main_001',
                type: 'main',
                title: '冒險的開始',
                description: '村長希望你能去森林調查最近的怪物騷動。前往森林並擊敗5隻史萊姆。',
                objectives: [{ type: 'kill', target: 'slime', count: 5, current: 0 }],
                rewards: { exp: 100, gold: 200, items: [{ id: 'potion_small', quantity: 3 }] },
                levelRequired: 1
            },
            {
                id: 'side_001',
                type: 'side',
                title: '藥水收集',
                description: '藥師需要一些材料來製作藥水。收集5個史萊姆果凍。',
                objectives: [{ type: 'collect', target: 'slime_jelly', count: 5, current: 0 }],
                rewards: { exp: 50, gold: 100, items: [{ id: 'potion_medium', quantity: 2 }] },
                levelRequired: 1
            },
            {
                id: 'side_005',
                type: 'side',
                title: '每日訓練',
                description: '進行日常訓練，擊敗任意8隻怪物。',
                objectives: [{ type: 'kill_any', target: 'any', count: 8, current: 0 }],
                rewards: { exp: 100, gold: 150, items: [] },
                levelRequired: 1,
                repeatable: true
            }
        ];

        const playerLevel = this.game.globals.playerLevel || 1;
        const activeQuests = this.game.globals.activeQuests || [];
        const completedQuests = this.game.globals.completedQuests || [];

        return allQuests.filter(quest => {
            // 檢查等級要求
            if (quest.levelRequired > playerLevel) return false;

            // 檢查是否已經接取
            if (activeQuests.find(q => q.id === quest.id)) return false;

            // 檢查是否已完成（不可重複的任務）
            if (!quest.repeatable && completedQuests.find(q => q.id === quest.id)) return false;

            return true;
        });
    }

    displayQuestList(quests, type) {
        const startX = 100;
        const startY = 150;
        const itemHeight = 80;
        const gap = 15;

        quests.forEach((quest, index) => {
            const y = startY + index * (itemHeight + gap);
            const questItem = this.createQuestItem(startX, y, 600, itemHeight, quest, type);
            this.questListContainer.add(questItem);
        });
    }

    createQuestItem(x, y, width, height, quest, type) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50);
        bg.setStrokeStyle(2, 0x34495e);
        bg.setInteractive({ useHandCursor: true });

        // 任務類型圖標
        const typeIcons = {
            'main': '📜',
            'side': '📋',
            'hidden': '❓'
        };

        const typeIcon = this.add.text(-width / 2 + 30, 0, typeIcons[quest.type] || '📄', {
            fontSize: '28px'
        }).setOrigin(0.5);

        // 任務標題
        const title = this.add.text(-width / 2 + 70, -15, quest.title, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // 任務進度
        let progressText = '';
        if (type === 'active' && quest.objectives) {
            const objective = quest.objectives[0];
            progressText = `進度: ${objective.current}/${objective.count}`;
        } else if (type === 'available') {
            progressText = `建議等級: ${quest.levelRequired}`;
        } else if (type === 'completed') {
            progressText = '✅ 已完成';
        }

        const progress = this.add.text(-width / 2 + 70, 15, progressText, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: type === 'completed' ? '#2ecc71' : '#888888'
        }).setOrigin(0, 0.5);

        // 獎勵預覽
        const rewardText = `💰${quest.rewards.gold} ⭐${quest.rewards.exp}`;
        const rewards = this.add.text(width / 2 - 20, 0, rewardText, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        }).setOrigin(1, 0.5);

        container.add([bg, typeIcon, title, progress, rewards]);

        // 互動效果
        bg.on('pointerover', () => {
            bg.setFillStyle(0x34495e);
            bg.setStrokeStyle(2, 0x3498db);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x2c3e50);
            bg.setStrokeStyle(2, 0x34495e);
        });

        bg.on('pointerup', () => {
            this.showQuestDetail(quest, type);
        });

        return container;
    }

    createQuestDetailPanel() {
        const container = this.add.container(700, 350);

        // 背景
        const bg = this.add.rectangle(0, 0, 220, 400, 0x1a1a2e);
        bg.setStrokeStyle(2, 0x3498db);

        // 任務標題
        this.detailTitle = this.add.text(0, -170, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            align: 'center',
            wordWrap: { width: 180 }
        }).setOrigin(0.5);

        // 任務類型
        this.detailType = this.add.text(0, -130, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);

        // 描述
        this.detailDesc = this.add.text(0, -70, '', {
            fontSize: '13px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'left',
            wordWrap: { width: 180 }
        }).setOrigin(0.5, 0);

        // 目標
        this.detailObjectives = this.add.text(0, 20, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa',
            align: 'left',
            wordWrap: { width: 180 }
        }).setOrigin(0.5, 0);

        // 獎勵
        this.detailRewards = this.add.text(0, 120, '', {
            fontSize: '13px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#2ecc71',
            align: 'center'
        }).setOrigin(0.5);

        // 操作按鈕
        this.actionButton = this.createActionButton(0, 170, '接受任務', 0x2ecc71, () => {
            this.acceptQuest();
        });

        container.add([bg, this.detailTitle, this.detailType, this.detailDesc, this.detailObjectives, this.detailRewards, this.actionButton]);

        return container;
    }

    createActionButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 120, 40, color);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, label]);

        bg.on('pointerover', () => {
            bg.setFillStyle(Phaser.Display.Color.GetColor(
                Math.min(255, ((color >> 16) & 0xFF) + 30),
                Math.min(255, ((color >> 8) & 0xFF) + 30),
                Math.min(255, (color & 0xFF) + 30)
            ));
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(color);
        });

        bg.on('pointerup', callback);

        return container;
    }

    showQuestDetail(quest, type) {
        this.selectedQuest = quest;
        this.selectedQuestType = type;

        this.detailTitle.setText(quest.title);

        const typeNames = {
            'main': '主線任務',
            'side': '支線任務',
            'hidden': '隱藏任務'
        };
        this.detailType.setText(typeNames[quest.type] || '普通任務');

        this.detailDesc.setText(quest.description);

        // 顯示目標
        let objectivesText = '📍 目標:\n';
        if (quest.objectives) {
            quest.objectives.forEach(obj => {
                const objNames = {
                    'kill': '擊敗',
                    'kill_boss': '擊敗Boss',
                    'collect': '收集',
                    'complete_quiz': '完成答題',
                    'explore': '探索',
                    'solve_puzzle': '解開謎題',
                    'kill_any': '擊敗任意怪物'
                };
                const progress = type === 'active' ? ` (${obj.current}/${obj.count})` : '';
                objectivesText += `- ${objNames[obj.type] || obj.type} ${obj.target}${progress}\n`;
            });
        }
        this.detailObjectives.setText(objectivesText);

        // 顯示獎勵
        let rewardsText = '🎁 獎勵:\n';
        rewardsText += `💰 ${quest.rewards.gold} 金幣\n`;
        rewardsText += `⭐ ${quest.rewards.exp} 經驗值\n`;
        if (quest.rewards.items && quest.rewards.items.length > 0) {
            rewardsText += '📦 物品:\n';
            quest.rewards.items.forEach(item => {
                rewardsText += `  - ${item.name || item.id} x${item.quantity}\n`;
            });
        }
        this.detailRewards.setText(rewardsText);

        // 更新按鈕
        const buttonBg = this.actionButton.list[0];
        const buttonLabel = this.actionButton.list[1];

        if (type === 'available') {
            buttonLabel.setText('接受任務');
            buttonBg.setFillStyle(0x2ecc71);
            buttonBg.setInteractive({ useHandCursor: true });
        } else if (type === 'active') {
            // 檢查是否可以完成
            const canComplete = this.checkQuestCompletion(quest);
            if (canComplete) {
                buttonLabel.setText('完成任務');
                buttonBg.setFillStyle(0x3498db);
                buttonBg.setInteractive({ useHandCursor: true });
            } else {
                buttonLabel.setText('進行中');
                buttonBg.setFillStyle(0x7f8c8d);
                buttonBg.disableInteractive();
            }
        } else {
            buttonLabel.setText('已完成');
            buttonBg.setFillStyle(0x7f8c8d);
            buttonBg.disableInteractive();
        }

        this.questDetailPanel.setVisible(true);
    }

    checkQuestCompletion(quest) {
        if (!quest.objectives) return false;

        return quest.objectives.every(obj => obj.current >= obj.count);
    }

    acceptQuest() {
        if (!this.selectedQuest) return;

        // 添加到進行中任務
        if (!this.game.globals.activeQuests) {
            this.game.globals.activeQuests = [];
        }

        // 複製任務數據
        const questCopy = JSON.parse(JSON.stringify(this.selectedQuest));
        questCopy.acceptedAt = new Date().toISOString();

        this.game.globals.activeQuests.push(questCopy);

        this.showMessage(`✅ 接受了任務: ${this.selectedQuest.title}`);

        // 刷新列表
        this.showCurrentTab();
        this.questDetailPanel.setVisible(false);
    }

    completeQuest() {
        if (!this.selectedQuest) return;

        // 給予獎勵
        const rewards = this.selectedQuest.rewards;

        // 經驗值
        this.game.globals.playerExp = (this.game.globals.playerExp || 0) + rewards.exp;

        // 金幣
        this.game.globals.playerGold = (this.game.globals.playerGold || 0) + rewards.gold;

        // 物品
        if (rewards.items) {
            rewards.items.forEach(item => {
                if (!this.game.globals.inventory) {
                    this.game.globals.inventory = [];
                }
                this.game.globals.inventory.push(item);
            });
        }

        // 從進行中移除
        const activeQuests = this.game.globals.activeQuests || [];
        const index = activeQuests.findIndex(q => q.id === this.selectedQuest.id);
        if (index > -1) {
            activeQuests.splice(index, 1);
        }

        // 添加到已完成
        if (!this.game.globals.completedQuests) {
            this.game.globals.completedQuests = [];
        }
        this.game.globals.completedQuests.push({
            ...this.selectedQuest,
            completedAt: new Date().toISOString()
        });

        this.showMessage(`🎉 完成了任務: ${this.selectedQuest.title}`);

        // 刷新列表
        this.showCurrentTab();
        this.questDetailPanel.setVisible(false);
    }

    showNPCDialog() {
        const npcQuests = this.getNPCQuests();

        if (npcQuests.length === 0) {
            this.dialogText.setText('你好，冒險者！\n\n目前沒有適合你的任務。請提升等級後再來找我吧。');
            this.showNPOptions([]);
            return;
        }

        const quest = npcQuests[0];
        this.dialogText.setText(`你好，冒險者！\n\n我有一個任務要交給你:\n\n「${quest.title}」\n\n${quest.description}\n\n你願意接受這個任務嗎？`);

        this.showNPOptions([
            { text: '✅ 接受任務', action: () => this.acceptNPCQuest(quest) },
            { text: '❌ 暫時不接受', action: () => this.closeDialog() }
        ]);
    }

    getNPCQuests() {
        return this.getAvailableQuests().filter(quest => {
            return quest.npcGiver === this.npcId;
        });
    }

    acceptNPCQuest(quest) {
        this.selectedQuest = quest;
        this.acceptQuest();
        this.closeDialog();
    }

    showNPOptions(options) {
        this.optionsContainer.removeAll(true);

        options.forEach((option, index) => {
            const button = this.createOptionButton(0, index * 50, option.text, option.action);
            this.optionsContainer.add(button);
        });
    }

    createOptionButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 200, 40, 0x3498db);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, label]);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x2980b9);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x3498db);
        });

        bg.on('pointerup', callback);

        return container;
    }

    getNPEmoji() {
        const emojis = {
            'village_chief': '🧑‍🦳',
            'merchant': '👨‍💼',
            'blacksmith': '👨‍🔧',
            'healer': '👩‍⚕️',
            'apothecary': '👩‍🔬',
            'hunter': '🏹',
            'librarian': '👩‍🏫',
            'trainer': '💪'
        };
        return emojis[this.npcId] || '👤';
    }

    getNPCName() {
        const names = {
            'village_chief': '村長',
            'merchant': '商人',
            'blacksmith': '鐵匠',
            'healer': '治療師',
            'apothecary': '藥師',
            'hunter': '獵人',
            'librarian': '圖書管理員',
            'trainer': '訓練師'
        };
        return names[this.npcId] || 'NPC';
    }

    closeDialog() {
        if (this.onClose) {
            this.onClose();
        }
        this.scene.stop();
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
            this.closeDialog();
        });
    }

    showEmptyMessage(message) {
        const emptyText = this.add.text(400, 350, message, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        this.questListContainer.add(emptyText);
    }

    showMessage(text) {
        const message = this.add.text(400, 550, text, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: message,
            alpha: 0,
            delay: 1500,
            duration: 500,
            onComplete: () => message.destroy()
        });
    }
}
