// main.js - 遊戲主入口

// 遊戲配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d3561', // 插畫風格漸變底色
    pixelArt: false, // 禁用像素風格渲染，啟用插畫風格平滑渲染
    antialias: true, // 啟用抗鋸齒
    roundPixels: false, // 禁用像素對齊，使圖形更平滑
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        AchievementSystem,
        MenuScene,
        SettingsScene,
        WorldScene,
        VillageScene,
        ForestScene,
        BossScene,
        BattleScene,
        QuizScene,
        ShopScene,
        LevelUpScene
    ]
};

// 初始化遊戲
const game = new Phaser.Game(config);

// 遊戲全域數據
game.globals = {
    playerName: '',
    playerClass: '', // math, science, english, general
    playerLevel: 1,
    playerExp: 0,
    playerHP: 100,
    playerMaxHP: 100,
    playerMP: 50,
    playerMaxMP: 50,
    playerAttack: 10,      // 初始攻擊力
    playerColor: 0xffffff, // 初始顏色（白色）
    playerGold: 0,
    inventory: [],
    equipped: {},
    skills: [],
    activeQuests: [],
    completedQuests: [],
    currentMap: 'village',
    completedLevels: [],
    unlockedSubjects: ['math'], // 逐步解鎖其他學科
    discoveredRuin: false,
    // 成就系統數據
    achievements: {
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
    }
};

// 移除載入提示
document.querySelector('.loading').style.display = 'none';

console.log('🎮 新世代傳說 - 遊戲初始化完成！');
console.log('⚔️ Legend of the New Generation - Game Initialized!');
console.log('🎨 插畫風格版本 - Illustration Style Edition');
console.log('🏆 成就系統已啟用 - Achievement System Enabled');
