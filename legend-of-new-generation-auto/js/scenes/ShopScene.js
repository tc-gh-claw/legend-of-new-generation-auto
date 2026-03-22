/**
 * ShopScene - 商店系統
 * 購買和出售道具
 * v1.13.0 - 新增暴擊藥水
 */

class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.playerData = data.player;
        this.onClose = data.onClose;
        this.shopType = data.shopType || 'general';
        this.currentTab = 'buy'; // 'buy' 或 'sell'
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

        // 商店標題
        const shopTitles = {
            'general': '🏪 雜貨店',
            'weapon': '⚔️ 武器店',
            'magic': '🔮 魔法商店'
        };

        this.add.text(width / 2, 40, shopTitles[this.shopType] || '🏪 商店', {
            fontSize: '32px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // 玩家金錢顯示
        this.goldText = this.add.text(width - 20, 40, `💰 ${this.playerData.gold}G`, {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        }).setOrigin(1, 0.5);

        // 創建標籤頁按鈗
        this.createTabButtons();

        // 商品列表容器
        this.itemContainer = this.add.container(0, 0);

        // 商品詳情面板
        this.detailPanel = this.createDetailPanel();
        this.detailPanel.setVisible(false);

        // 顯示購買列表
        this.showBuyList();

        // 關閉按鈗
        this.createCloseButton();
    }

    createTabButtons() {
        const width = this.cameras.main.width;

        // 購買標籤
        this.buyTab = this.createTabButton(width / 2 - 100, 90, '🛒 購買', true, () => {
            this.switchTab('buy');
        });

        // 出售標籤
        this.sellTab = this.createTabButton(width / 2 + 100, 90, '💰 出售', false, () => {
            this.switchTab('sell');
        });
    }

    createTabButton(x, y, text, isActive, callback) {
        const color = isActive ? 0x3498db : 0x2c3e50;
        const bg = this.add.rectangle(x, y, 150, 40, color);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            if (!isActive) bg.setFillStyle(0x34495e);
        });

        bg.on('pointerout', () => {
            if (!isActive) bg.setFillStyle(0x2c3e50);
        });

        bg.on('pointerup', callback);

        return { bg, label };
    }

    switchTab(tab) {
        if (this.currentTab === tab) return;

        this.currentTab = tab;

        // 更新按鈗樣式
        this.updateTabStyle(this.buyTab, tab === 'buy');
        this.updateTabStyle(this.sellTab, tab === 'sell');

        // 顯示對應列表
        if (tab === 'buy') {
            this.showBuyList();
        } else {
            this.showSellList();
        }

        // 隱藏詳情面板
        this.detailPanel.setVisible(false);
    }

    updateTabStyle(tab, isActive) {
        tab.bg.setFillStyle(isActive ? 0x3498db : 0x2c3e50);
    }

    showBuyList() {
        this.itemContainer.removeAll(true);

        // 獲取商品列表
        const items = this.getShopItems();

        // 顯示商品
        const startX = 100;
        const startY = 150;
        const itemWidth = 200;
        const itemHeight = 80;
        const gapX = 20;
        const gapY = 15;

        items.forEach((item, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);

            const x = startX + col * (itemWidth + gapX);
            const y = startY + row * (itemHeight + gapY);

            const itemButton = this.createItemButton(x, y, itemWidth, itemHeight, item, 'buy');
            this.itemContainer.add(itemButton);
        });
    }

    showSellList() {
        this.itemContainer.removeAll(true);

        // 獲取玩家背包物品
        const inventory = this.game.globals.inventory || [];

        if (inventory.length === 0) {
            const emptyText = this.add.text(400, 300, '🎒 背包是空的', {
                fontSize: '20px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#888888'
            }).setOrigin(0.5);
            this.itemContainer.add(emptyText);
            return;
        }

        // 顯示物品
        const startX = 100;
        const startY = 150;
        const itemWidth = 200;
        const itemHeight = 80;
        const gapX = 20;
        const gapY = 15;

        inventory.forEach((item, index) => {
            const col = index % 3;
            const row = Math.floor(index / 3);

            const x = startX + col * (itemWidth + gapX);
            const y = startY + row * (itemHeight + gapY);

            const itemButton = this.createItemButton(x, y, itemWidth, itemHeight, item, 'sell');
            this.itemContainer.add(itemButton);
        });
    }

    getShopItems() {
        // 🎯 新增暴擊藥水
        const shopInventory = [
            { id: 'potion_small', name: '小治療藥水', icon: '🧪', price: 50, sellPrice: 25, description: '恢復30點HP', type: 'consumable' },
            { id: 'potion_medium', name: '中治療藥水', icon: '🧪', price: 100, sellPrice: 50, description: '恢復60點HP', type: 'consumable' },
            { id: 'potion_large', name: '大治療藥水', icon: '🧪', price: 200, sellPrice: 100, description: '恢復120點HP', type: 'consumable' },
            { id: 'mana_small', name: '小魔力藥水', icon: '💧', price: 40, sellPrice: 20, description: '恢復20點MP', type: 'consumable' },
            { id: 'elixir', name: '萬靈藥', icon: '✨', price: 500, sellPrice: 250, description: '完全恢復HP和MP', type: 'consumable' },
            { id: 'exp_boost', name: '雙倍經驗藥水', icon: '📈', price: 300, sellPrice: 150, description: '下場戰鬥獲得2倍經驗值', type: 'consumable' },
            { id: 'crit_boost', name: '暴擊藥水', icon: '🎯', price: 250, sellPrice: 125, description: '下場戰鬥暴擊率+30%', type: 'consumable' },
            { id: 'scroll_return', name: '回城卷軸', icon: '📜', price: 100, sellPrice: 50, description: '立即返回村莊', type: 'special' }
        ];

        // 根據商店類型篩選
        if (this.shopType === 'weapon') {
            return [
                { id: 'sword_wooden', name: '木劍', icon: '🗡️', price: 200, sellPrice: 100, description: '攻擊力+5', type: 'weapon', levelReq: 1 },
                { id: 'sword_iron', name: '鐵劍', icon: '⚔️', price: 500, sellPrice: 250, description: '攻擊力+10', type: 'weapon', levelReq: 3 },
                { id: 'armor_leather', name: '皮甲', icon: '👕', price: 300, sellPrice: 150, description: '防禦力+5', type: 'armor', levelReq: 2 },
                { id: 'shield_wooden', name: '木盾', icon: '🛡️', price: 150, sellPrice: 75, description: '防禦力+3', type: 'accessory', levelReq: 1 }
            ];
        }

        return shopInventory;
    }

    createItemButton(x, y, width, height, item, mode) {
        const container = this.add.container(x, y);

        // 背景
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50);
        bg.setStrokeStyle(2, 0x34495e);
        bg.setInteractive({ useHandCursor: true });

        // 圖標
        const icon = this.add.text(-width / 2 + 25, 0, item.icon || '📦', {
            fontSize: '28px'
        }).setOrigin(0.5);

        // 名稱
        const name = this.add.text(-width / 2 + 55, -15, item.name, {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // 價格
        const price = mode === 'buy' ? item.price : item.sellPrice;
        const priceColor = mode === 'buy' ? '#e74c3c' : '#2ecc71';
        const priceText = this.add.text(-width / 2 + 55, 10, `${price}G`, {
            fontSize: '12px',
            fontFamily: 'Microsoft JhengHei',
            fill: priceColor
        }).setOrigin(0, 0.5);

        // 數量（如果有）
        if (item.quantity) {
            const qtyText = this.add.text(width / 2 - 10, -height / 2 + 15, `x${item.quantity}`, {
                fontSize: '12px',
                fontFamily: 'Microsoft JhengHei',
                fill: '#888888'
            }).setOrigin(1, 0.5);
            container.add(qtyText);
        }

        container.add([bg, icon, name, priceText]);

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
            this.showItemDetail(item, mode);
        });

        return container;
    }

    createDetailPanel() {
        const container = this.add.container(650, 350);

        // 背景
        const bg = this.add.rectangle(0, 0, 250, 300, 0x1a1a2e);
        bg.setStrokeStyle(2, 0x3498db);

        // 物品圖標
        this.detailIcon = this.add.text(0, -100, '📦', {
            fontSize: '64px'
        }).setOrigin(0.5);

        // 物品名稱
        this.detailName = this.add.text(0, -40, '', {
            fontSize: '20px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 物品描述
        this.detailDesc = this.add.text(0, 10, '', {
            fontSize: '14px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#aaaaaa',
            align: 'center',
            wordWrap: { width: 200 }
        }).setOrigin(0.5);

        // 價格
        this.detailPrice = this.add.text(0, 60, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        // 確認按鈗
        this.confirmButton = this.createConfirmButton(0, 110, '購買', () => {
            this.confirmTransaction();
        });

        container.add([bg, this.detailIcon, this.detailName, this.detailDesc, this.detailPrice, this.confirmButton]);

        return container;
    }

    createConfirmButton(x, y, text, callback) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 120, 40, 0x2ecc71);
        bg.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, text, {
            fontSize: '16px',
            fontFamily: 'Microsoft JhengHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, label]);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x27ae60);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x2ecc71);
        });

        bg.on('pointerup', callback);

        return container;
    }

    showItemDetail(item, mode) {
        this.selectedItem = item;
        this.currentMode = mode;

        this.detailIcon.setText(item.icon || '📦');
        this.detailName.setText(item.name);
        this.detailDesc.setText(item.description || '');

        const price = mode === 'buy' ? item.price : item.sellPrice;
        const priceText = mode === 'buy' ? `💰 購買價格: ${price}G` : `💰 出售價格: ${price}G`;
        this.detailPrice.setText(priceText);

        // 更新按鈗文字
        this.confirmButton.list[1].setText(mode === 'buy' ? '購買' : '出售');

        // 檢查是否可以購買/出售
        const canAfford = mode === 'buy' && this.playerData.gold >= price;
        const hasItem = mode === 'sell' && (item.quantity > 0);

        const buttonBg = this.confirmButton.list[0];
        if (mode === 'buy' && !canAfford) {
            buttonBg.setFillStyle(0x7f8c8d);
            buttonBg.disableInteractive();
        } else if (mode === 'sell' && !hasItem) {
            buttonBg.setFillStyle(0x7f8c8d);
            buttonBg.disableInteractive();
        } else {
            buttonBg.setFillStyle(mode === 'buy' ? 0x2ecc71 : 0xe74c3c);
            buttonBg.setInteractive({ useHandCursor: true });
        }

        this.detailPanel.setVisible(true);
    }

    confirmTransaction() {
        if (!this.selectedItem) return;

        const price = this.currentMode === 'buy' ? this.selectedItem.price : this.selectedItem.sellPrice;

        if (this.currentMode === 'buy') {
            // 購買
            if (this.playerData.gold >= price) {
                this.playerData.gold -= price;

                // 添加到背包
                if (!this.game.globals.inventory) {
                    this.game.globals.inventory = [];
                }

                // 檢查是否已有相同物品
                const existingItem = this.game.globals.inventory.find(i => i.id === this.selectedItem.id);
                if (existingItem) {
                    existingItem.quantity = (existingItem.quantity || 1) + 1;
                } else {
                    this.game.globals.inventory.push({
                        ...this.selectedItem,
                        quantity: 1
                    });
                }

                this.showMessage(`✅ 購買了 ${this.selectedItem.name}！`);
            } else {
                this.showMessage('❌ 金錢不足！');
            }
        } else {
            // 出售
            const inventory = this.game.globals.inventory || [];
            const itemIndex = inventory.findIndex(i => i.id === this.selectedItem.id);

            if (itemIndex > -1) {
                this.playerData.gold += price;

                if (inventory[itemIndex].quantity > 1) {
                    inventory[itemIndex].quantity--;
                } else {
                    inventory.splice(itemIndex, 1);
                }

                this.showMessage(`✅ 出售了 ${this.selectedItem.name}！`);
                this.showSellList(); // 刷新列表
            }
        }

        // 更新金錢顯示
        this.goldText.setText(`💰 ${this.playerData.gold}G`);

        // 更新全局數據
        this.game.globals.playerGold = this.playerData.gold;

        // 隱藏詳情面板
        this.detailPanel.setVisible(false);
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
