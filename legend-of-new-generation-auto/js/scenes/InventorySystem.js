/**
 * InventorySystem - 道具系統
 * 管理玩家的背包、使用道具和裝備
 * v1.13.0 - 新增暴擊藥水支援
 */

class InventorySystem extends Phaser.Scene {
    constructor() {
        super({ key: 'InventorySystem' });
    }

    init(data) {
        this.playerData = data.player;
        this.onClose = data.onClose;
        this.currentTab = 'items'; // 'items', 'equipment', 'key'
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

        // 背包標題
        this.add.text(width / 2, 40, '🎒 物品欄', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 🧪 顯示雙倍經驗狀態
        // 🎯 顯示暴擊加成狀態
        this.createStatusIndicators();

        // 創建標籤頁
        this.createTabs();

        // 物品列表容器
        this.itemContainer = this.add.container(0, 0);

        // 裝備面板
        this.equipmentPanel = this.createEquipmentPanel();
        this.equipmentPanel.setVisible(false);

        // 詳情面板
        this.detailPanel = this.createDetailPanel();
        this.detailPanel.setVisible(false);

        // 顯示當前標籤的內容
        this.showCurrentTab();

        // 關閉按鈗
        this.createCloseButton();
    }

    // 🧪🎯 創建狀態指示器（雙倍經驗 + 暴擊加成）
    createStatusIndicators() {
        const width = this.cameras.main.width;
        let yOffset = 80;

        // 雙倍經驗指示器
        if (this.game.globals.expBoostActive) {
            this.expBoostIndicator = this.add.text(width - 20, yOffset, '📈 雙倍經驗啟用中!', {
                fontSize: '14px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#f1c40f',
                backgroundColor: '#e74c3c88',
                padding: { x: 10, y: 5 }
            }).setOrigin(1, 0.5);
            yOffset += 35;
        }

        // 🎯 暴擊加成指示器
        if (this.game.globals.critBoostActive) {
            this.critBoostIndicator = this.add.text(width - 20, yOffset, '🎯 暴擊加成啟用中!', {
                fontSize: '14px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#e74c3c',
                backgroundColor: '#f1c40f88',
                padding: { x: 10, y: 5 }
            }).setOrigin(1, 0.5);
        }
    }

    createTabs() {
        const width = this.cameras.main.width;

        const tabs = [
            { id: 'items', label: '💊 消耗品', x: width / 2 - 200 },
            { id: 'equipment', label: '⚔️ 裝備', x: width / 2 },
            { id: 'key', label: '🔑 重要', x: width / 2 + 200 }
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

        // 更新按鈗樣式
        Object.keys(this.tabButtons).forEach(key => {
            const isActive = key === tabId;
            this.tabButtons[key].bg.setFillStyle(isActive ? 0x3498db : 0x2c3e50);
        });

        this.currentTab = tabId;
        this.showCurrentTab();

        // 隱藏詳情面板
        this.detailPanel.setVisible(false);
    }

    showCurrentTab() {
        this.itemContainer.removeAll(true);

        switch (this.currentTab) {
            case 'items':
                this.equipmentPanel.setVisible(false);
                this.showItemsList();
                break;
            case 'equipment':
                this.equipmentPanel.setVisible(true);
                this.showEquipmentList();
                break;
            case 'key':
                this.equipmentPanel.setVisible(false);
                this.showKeyItemsList();
                break;
        }
    }

    showItemsList() {
        const inventory = this.game.globals.inventory || [];
        const items = inventory.filter(item => item.type === 'consumable' || item.type === 'special');

        if (items.length === 0) {
            this.showEmptyMessage('沒有消耗品');
            return;
        }

        this.displayItemGrid(items);
    }

    showEquipmentList() {
        const inventory = this.game.globals.inventory || [];
        const equipment = inventory.filter(item => 
            item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory'
        );

        // 更新裝備面板
        this.updateEquipmentPanel();

        if (equipment.length === 0) {
            const emptyText = this.add.text(200, 350, '⚔️ 沒有裝備', {
                fontSize: '16px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#888888'
            }).setOrigin(0.5);
            this.itemContainer.add(emptyText);
            return;
        }

        // 在左側顯示背包中的裝備
        this.displayEquipmentGrid(equipment);
    }

    showKeyItemsList() {
        const inventory = this.game.globals.inventory || [];
        const keyItems = inventory.filter(item => item.type === 'key' || item.questItem);

        if (keyItems.length === 0) {
            this.showEmptyMessage('沒有重要物品');
            return;
        }

        this.displayItemGrid(keyItems);
    }

    showEmptyMessage(message) {
        const emptyText = this.add.text(400, 350, message, {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#888888'
        }).setOrigin(0.5);
        this.itemContainer.add(emptyText);
    }

    displayItemGrid(items) {
        const startX = 150;
        const startY = 160;
        const itemWidth = 120;
        const itemHeight = 120;
        const gapX = 20;
        const gapY = 20;
        const itemsPerRow = 5;

        items.forEach((item, index) => {
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);

            const x = startX + col * (itemWidth + gapX);
            const y = startY + row * (itemHeight + gapY);

            const itemSlot = this.createItemSlot(x, y, itemWidth, itemHeight, item);
            this.itemContainer.add(itemSlot);
        });
    }

    displayEquipmentGrid(equipment) {
        const startX = 150;
        const startY = 160;
        const itemWidth = 100;
        const itemHeight = 100;
        const gapX = 15;
        const gapY = 15;
        const itemsPerRow = 4;

        equipment.forEach((item, index) => {
            const col = index % itemsPerRow;
            const row = Math.floor(index / itemsPerRow);

            const x = startX + col * (itemWidth + gapX);
            const y = startY + row * (itemHeight + gapY);

            const itemSlot = this.createItemSlot(x, y, itemWidth, itemHeight, item, true);
            this.itemContainer.add(itemSlot);
        });
    }

    createItemSlot(x, y, width, height, item, isEquipment = false) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50);
        bg.setStrokeStyle(2, 0x34495e);
        bg.setInteractive({ useHandCursor: true });

        // 🧪🎯 特殊藥水圖標處理
        let iconText = item.icon || '📦';
        if (item.id === 'exp_boost') {
            iconText = '📈';
        } else if (item.id === 'crit_boost') {
            iconText = '🎯';
        }
        
        // 圖標
        const icon = this.add.text(0, -15, iconText, {
            fontSize: '32px'
        }).setOrigin(0.5);

        // 名稱
        const name = this.add.text(0, 20, item.name, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 數量
        let quantity;
        if (item.quantity && item.quantity > 1) {
            quantity = this.add.text(width / 2 - 10, -height / 2 + 15, `x${item.quantity}`, {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#f1c40f'
            }).setOrigin(1, 0.5);
        }

        container.add([bg, icon, name]);
        if (quantity) container.add(quantity);

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
            this.showItemDetail(item, isEquipment);
        });

        return container;
    }

    createEquipmentPanel() {
        const container = this.add.container(550, 350);

        // 背景
        const bg = this.add.rectangle(0, 0, 200, 350, 0x1a1a2e);
        bg.setStrokeStyle(2, 0x3498db);

        // 標題
        const title = this.add.text(0, -150, '已裝備', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        // 裝備槽位
        this.equipmentSlots = {};
        const slots = [
            { id: 'weapon', label: '武器', icon: '🗡️', y: -90 },
            { id: 'body', label: '防具', icon: '👕', y: -20 },
            { id: 'offhand', label: '副手', icon: '🛡️', y: 50 },
            { id: 'ring', label: '戒指', icon: '💍', y: 120 }
        ];

        slots.forEach(slot => {
            const slotContainer = this.add.container(0, slot.y);

            const slotBg = this.add.rectangle(0, 0, 160, 50, 0x2c3e50);
            slotBg.setStrokeStyle(2, 0x34495e);

            const slotIcon = this.add.text(-60, 0, slot.icon, {
                fontSize: '24px'
            }).setOrigin(0.5);

            const slotLabel = this.add.text(-20, 0, slot.label, {
                fontSize: '14px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#888888'
            }).setOrigin(0, 0.5);

            const itemLabel = this.add.text(20, 0, '未裝備', {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#666666'
            }).setOrigin(0, 0.5);

            slotContainer.add([slotBg, slotIcon, slotLabel, itemLabel]);
            container.add(slotContainer);

            this.equipmentSlots[slot.id] = { container: slotContainer, label: itemLabel, item: null };
        });

        container.add([bg, title]);

        return container;
    }

    updateEquipmentPanel() {
        // 從全局數據獲取已裝備的物品
        const equipped = this.game.globals.equipped || {};

        Object.keys(this.equipmentSlots).forEach(slotId => {
            const slot = this.equipmentSlots[slotId];
            const equippedItem = equipped[slotId];

            if (equippedItem) {
                slot.label.setText(equippedItem.name);
                slot.label.setFill('#ffffff');
                slot.item = equippedItem;
            } else {
                slot.label.setText('未裝備');
                slot.label.setFill('#666666');
                slot.item = null;
            }
        });
    }

    createDetailPanel() {
        const container = this.add.container(250, 480);

        // 背景
        const bg = this.add.rectangle(0, 0, 500, 100, 0x1a1a2e);
        bg.setStrokeStyle(2, 0x3498db);

        // 物品圖標
        this.detailIcon = this.add.text(-220, 0, '📦', {
            fontSize: '40px'
        }).setOrigin(0.5);

        // 物品名稱
        this.detailName = this.add.text(-170, -20, '', {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // 物品描述
        this.detailDesc = this.add.text(-170, 5, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa'
        }).setOrigin(0, 0.5);

        // 屬性
        this.detailStats = this.add.text(-170, 25, '', {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#2ecc71'
        }).setOrigin(0, 0.5);

        // 使用按鈗
        this.useButton = this.createActionButton(100, 0, '使用', 0x2ecc71, () => {
            this.useItem();
        });

        // 裝備按鈗
        this.equipButton = this.createActionButton(100, 0, '裝備', 0x3498db, () => {
            this.equipItem();
        });
        this.equipButton.setVisible(false);

        container.add([bg, this.detailIcon, this.detailName, this.detailDesc, this.detailStats, this.useButton, this.equipButton]);

        return container;
    }

    createActionButton(x, y, text, color, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 80, 35, color);
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

    showItemDetail(item, isEquipment) {
        this.selectedItem = item;

        // 🧪🎯 特殊藥水圖標處理
        let iconText = item.icon || '📦';
        if (item.id === 'exp_boost') {
            iconText = '📈';
        } else if (item.id === 'crit_boost') {
            iconText = '🎯';
        }
        this.detailIcon.setText(iconText);
        this.detailName.setText(item.name);
        this.detailDesc.setText(item.description || '');

        // 顯示屬性
        let statsText = '';
        if (item.stats) {
            Object.keys(item.stats).forEach(stat => {
                const value = item.stats[stat];
                const statNames = {
                    attack: '攻擊',
                    defense: '防禦',
                    maxHP: '最大HP',
                    maxMP: '最大MP'
                };
                statsText += `${statNames[stat] || stat}: +${value}  `;
            });
        }
        this.detailStats.setText(statsText);

        // 顯示適當的按鈗
        if (isEquipment) {
            this.useButton.setVisible(false);
            this.equipButton.setVisible(true);
        } else if (item.type === 'consumable' || item.type === 'special') {
            this.useButton.setVisible(true);
            this.equipButton.setVisible(false);
        } else {
            this.useButton.setVisible(false);
            this.equipButton.setVisible(false);
        }

        this.detailPanel.setVisible(true);
    }

    useItem() {
        if (!this.selectedItem) return;

        const item = this.selectedItem;

        // 執行道具效果
        if (item.effect) {
            switch (item.effect.type) {
                case 'heal':
                    const healAmount = item.effect.value;
                    this.playerData.hp = Math.min(
                        this.playerData.hp + healAmount,
                        this.playerData.maxHp
                    );
                    this.showMessage(`❤️ 恢復了 ${healAmount} 點HP！`);
                    break;

                case 'mana':
                    const manaAmount = item.effect.value;
                    this.playerData.mp = Math.min(
                        this.playerData.mp + manaAmount,
                        this.playerData.maxMp
                    );
                    this.showMessage(`💧 恢復了 ${manaAmount} 點MP！`);
                    break;

                case 'full_restore':
                    this.playerData.hp = this.playerData.maxHp;
                    this.playerData.mp = this.playerData.maxMp;
                    this.showMessage('✨ HP和MP已完全恢復！');
                    break;

                case 'teleport':
                    this.showMessage('📜 使用回城卷軸...');
                    // 這裡可以實現回城邏輯
                    break;

                // 🧪 雙倍經驗藥水效果
                case 'exp_boost':
                    this.game.globals.expBoostActive = true;
                    this.game.globals.expBoostMultiplier = item.effect.multiplier || 2;
                    this.showMessage(`📈 雙倍經驗啟用！下場戰鬥獲得${this.game.globals.expBoostMultiplier}倍經驗值！`);
                    
                    // 添加視覺效果
                    this.createExpBoostEffect();
                    break;

                // 🎯 暴擊藥水效果
                case 'crit_boost':
                    this.game.globals.critBoostActive = true;
                    this.game.globals.critBoostValue = item.effect.value || 0.3;
                    this.showMessage(`🎯 暴擊藥水生效！下場戰鬥暴擊率+${Math.floor(this.game.globals.critBoostValue * 100)}%！`);
                    
                    // 添加視覺效果
                    this.createCritBoostEffect();
                    break;
            }

            // 減少物品數量
            this.removeItemFromInventory(item.id);

            // 更新全局數據
            this.game.globals.playerHP = this.playerData.hp;
            this.game.globals.playerMP = this.playerData.mp;
        }

        this.showCurrentTab();
        this.detailPanel.setVisible(false);
    }

    // 🧪 雙倍經驗特效
    createExpBoostEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 金色光芒效果
        for (let i = 0; i < 12; i++) {
            const particle = this.add.text(
                width / 2,
                height / 2,
                ['📈', '⭐', '✨', '💫'][i % 4],
                { fontSize: '32px' }
            ).setOrigin(0.5);

            const angle = (i / 12) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;

            this.tweens.add({
                targets: particle,
                x: width / 2 + Math.cos(angle) * distance,
                y: height / 2 + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 2 },
                rotation: Math.PI * 2,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // 更新指示器
        if (this.expBoostIndicator) {
            this.expBoostIndicator.destroy();
        }
        this.expBoostIndicator = this.add.text(width - 20, 80, '📈 雙倍經驗啟用中!', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            backgroundColor: '#e74c3c88',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0.5);
    }

    // 🎯 暴擊藥水特效
    createCritBoostEffect() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 紅色光芒效果
        for (let i = 0; i < 12; i++) {
            const particle = this.add.text(
                width / 2,
                height / 2,
                ['🎯', '⚔️', '💥', '🔥'][i % 4],
                { fontSize: '32px' }
            ).setOrigin(0.5);

            const angle = (i / 12) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;

            this.tweens.add({
                targets: particle,
                x: width / 2 + Math.cos(angle) * distance,
                y: height / 2 + Math.sin(angle) * distance,
                alpha: 0,
                scale: { from: 1, to: 2 },
                rotation: Math.PI * 2,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // 更新指示器
        if (this.critBoostIndicator) {
            this.critBoostIndicator.destroy();
        }
        this.critBoostIndicator = this.add.text(width - 20, 115, '🎯 暴擊加成啟用中!', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#e74c3c',
            backgroundColor: '#f1c40f88',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0.5);
    }

    equipItem() {
        if (!this.selectedItem) return;

        const item = this.selectedItem;

        // 檢查等級要求
        if (item.levelRequired && this.playerData.level < item.levelRequired) {
            this.showMessage(`❌ 需要等級 ${item.levelRequired} 才能裝備！`);
            return;
        }

        // 裝備物品
        if (!this.game.globals.equipped) {
            this.game.globals.equipped = {};
        }

        // 卸下當前裝備（如果有的話）
        const slot = item.slot;
        const currentEquipped = this.game.globals.equipped[slot];

        if (currentEquipped) {
            // 將當前裝備返回背包
            this.addItemToInventory(currentEquipped);
        }

        // 裝備新物品
        this.game.globals.equipped[slot] = item;

        // 從背包移除
        this.removeItemFromInventory(item.id);

        // 應用裝備屬性
        this.applyEquipmentStats(item);

        this.showMessage(`✅ 裝備了 ${item.name}！`);
        this.showCurrentTab();
        this.detailPanel.setVisible(false);
    }

    applyEquipmentStats(item) {
        if (!item.stats) return;

        // 這裡可以應用裝備屬性到玩家數據
        // 例如增加攻擊力、防禦力等
        if (item.stats.maxHP) {
            this.playerData.maxHp += item.stats.maxHP;
        }
        if (item.stats.maxMP) {
            this.playerData.maxMp += item.stats.maxMP;
        }
    }

    addItemToInventory(item) {
        const inventory = this.game.globals.inventory || [];
        const existingItem = inventory.find(i => i.id === item.id);

        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            inventory.push({ ...item, quantity: 1 });
        }
    }

    removeItemFromInventory(itemId) {
        const inventory = this.game.globals.inventory || [];
        const itemIndex = inventory.findIndex(i => i.id === itemId);

        if (itemIndex > -1) {
            if (inventory[itemIndex].quantity > 1) {
                inventory[itemIndex].quantity--;
            } else {
                inventory.splice(itemIndex, 1);
            }
        }
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
