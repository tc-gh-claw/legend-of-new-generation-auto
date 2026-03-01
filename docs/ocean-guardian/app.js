/**
 * Ocean Guardian - SDG 14 App
 * JavaScript functionality for marine conservation tracking
 */

// App State
const state = {
    plasticAvoided: 0,
    trashCollected: 0,
    sustainableChoices: 0,
    livesSaved: 0,
    oceanHealth: 78,
    completedActions: [],
    logs: [],
    currentCreature: 0,
    badges: {
        starter: false,
        warrior: false,
        collector: false,
        champion: false
    }
};

// Ocean Facts Database
const oceanFacts = [
    "海洋產生了地球上 50-80% 的氧氣，主要來自浮游植物的光合作用。",
    "每年約有 800 萬噸塑膠垃圾流入海洋，相當於每分鐘一輛垃圾車的量。",
    "珊瑚礁只佔海洋面積不到 1%，卻養育了 25% 的海洋生物。",
    "藍鯨的心臟有一輛小型汽車那麼大，心跳聲在 3 公里外都能聽到。",
    "海洋吸收了人類排放二氧化碳的 30%，是地球的碳匯。",
    "深海的馬里亞納海溝比珠穆朗瑪峰還要深，達到 11,000 米。",
    "一隻信天翁一生可以飛行超過 600 萬公里。",
    "海獺每天需要吃掉相當於體重 25% 的食物來維持體溫。",
    "海洋中還有 95% 的區域未被探索，比我們對月球的了解還要少。",
    "一隻綠蠵龜可以活到 80 歲以上，並終生回到同一個海灘產卵。"
];

// Creature Data
const creatures = [
    { id: 'turtle', name: '綠蠵龜', emoji: '🐢', status: '瀕危', fact: '每年因塑膠垃圾而死亡的數量超過 10 萬隻' },
    { id: 'whale', name: '藍鯨', emoji: '🐋', status: '極危', fact: '地球上最大的生物，噪音污染嚴重威脅其生存' },
    { id: 'coral', name: '珊瑚礁', emoji: '🪸', status: '受威脅', fact: '全球 50% 珊瑚礁已消失，25% 海洋生物依賴其生存' },
    { id: 'dolphin', name: '海豚', emoji: '🐬', status: '易危', fact: '誤捕和海洋污染是主要威脅' }
];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initBubbles();
    initCarousel();
    updateDate();
    loadStats();
    renderLogs();
    updateBadges();
});

// Create Floating Bubbles
function initBubbles() {
    const container = document.getElementById('bubbles');
    const bubbleCount = 15;
    
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        const size = Math.random() * 20 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.setProperty('--duration', `${Math.random() * 6 + 6}s`);
        bubble.style.animationDelay = `${Math.random() * 8}s`;
        container.appendChild(bubble);
    }
}

// Update Date Display
function updateDate() {
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    document.getElementById('todayDate').textContent = `${month}月${day}日`;
}

// Initialize Carousel
function initCarousel() {
    const dotsContainer = document.getElementById('carouselDots');
    creatures.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToCreature(index);
        dotsContainer.appendChild(dot);
    });
}

// Carousel Navigation
function nextCreature() {
    state.currentCreature = (state.currentCreature + 1) % creatures.length;
    updateCarousel();
}

function prevCreature() {
    state.currentCreature = (state.currentCreature - 1 + creatures.length) % creatures.length;
    updateCarousel();
}

function goToCreature(index) {
    state.currentCreature = index;
    updateCarousel();
}

function updateCarousel() {
    const carousel = document.getElementById('creatureCarousel');
    const cardWidth = 296; // card width + gap
    carousel.scrollTo({
        left: state.currentCreature * cardWidth,
        behavior: 'smooth'
    });
    
    // Update dots
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === state.currentCreature);
    });
}

// Complete Action
function completeAction(actionType) {
    const actionItem = document.querySelector(`[data-action="${actionType}"]`);
    if (actionItem.classList.contains('completed')) return;
    
    // Mark as completed
    actionItem.classList.add('completed');
    const btn = actionItem.querySelector('.action-btn');
    btn.textContent = '✓ 已完成';
    
    // Update stats based on action type
    let impact = '';
    switch(actionType) {
        case 'plastic':
            state.plasticAvoided += 3;
            state.livesSaved += 2;
            impact = '避免了 3 件塑膠製品';
            break;
        case 'cleanup':
            state.trashCollected += 5;
            state.livesSaved += 3;
            impact = '清理了 5 件海洋垃圾';
            break;
        case 'seafood':
            state.sustainableChoices += 1;
            state.livesSaved += 1;
            impact = '選擇了永續海鮮';
            break;
        case 'share':
            state.livesSaved += 5;
            impact = '影響了身邊的朋友';
            break;
    }
    
    // Update ocean health
    state.oceanHealth = Math.min(100, state.oceanHealth + 2);
    
    // Add to logs
    const log = {
        type: actionType,
        text: impact,
        time: new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' })
    };
    state.logs.unshift(log);
    
    // Update UI
    updateStats();
    renderLogs();
    updateOceanHealth();
    checkBadges();
    
    // Show celebration
    showCelebration(impact);
    
    // Save to localStorage
    saveStats();
}

// Update Stats Display
function updateStats() {
    document.getElementById('plasticAvoided').textContent = state.plasticAvoided;
    document.getElementById('trashCollected').textContent = state.trashCollected;
    document.getElementById('sustainableChoices').textContent = state.sustainableChoices;
    document.getElementById('livesSaved').textContent = state.livesSaved;
}

// Update Ocean Health
function updateOceanHealth() {
    document.getElementById('healthScore').textContent = state.oceanHealth;
    document.getElementById('healthFill').style.width = `${state.oceanHealth}%`;
    
    const desc = document.getElementById('healthDesc');
    const emoji = document.getElementById('oceanEmoji');
    
    if (state.oceanHealth >= 80) {
        desc.textContent = '優秀 - 海洋感謝你的守護';
        emoji.textContent = '🌊';
    } else if (state.oceanHealth >= 60) {
        desc.textContent = '良好 - 繼續守護我們的海洋';
        emoji.textContent = '🌊';
    } else if (state.oceanHealth >= 40) {
        desc.textContent = '一般 - 需要更多行動';
        emoji.textContent = '🌫️';
    } else {
        desc.textContent = '危急 - 海洋需要你的幫助';
        emoji.textContent = '⚠️';
    }
}

// Render Logs
function renderLogs() {
    const logList = document.getElementById('logList');
    
    if (state.logs.length === 0) {
        logList.innerHTML = '<p class="empty-state">今日還沒有記錄，開始你的第一個行動吧！</p>';
        return;
    }
    
    logList.innerHTML = state.logs.map(log => `
        <div class="log-item">
            <span class="log-icon">${getActionIcon(log.type)}</span>
            <span class="log-text">${log.text}</span>
            <span class="log-time">${log.time}</span>
        </div>
    `).join('');
}

// Get Action Icon
function getActionIcon(type) {
    const icons = {
        plastic: '🚫',
        cleanup: '🧹',
        seafood: '🎣',
        share: '📢'
    };
    return icons[type] || '✓';
}

// Check and Update Badges
function checkBadges() {
    // Starter badge - complete first action
    if (!state.badges.starter && state.logs.length >= 1) {
        unlockBadge('starter');
    }
    
    // Collector badge - collect 50 trash
    if (!state.badges.collector && state.trashCollected >= 50) {
        unlockBadge('collector');
    }
    
    // Champion badge - save 100 lives
    if (!state.badges.champion && state.livesSaved >= 100) {
        unlockBadge('champion');
    }
}

function unlockBadge(badgeId) {
    state.badges[badgeId] = true;
    const badge = document.querySelector(`[data-badge="${badgeId}"]`);
    badge.classList.remove('locked');
    badge.classList.add('unlocked');
}

function updateBadges() {
    Object.keys(state.badges).forEach(badgeId => {
        if (state.badges[badgeId]) {
            const badge = document.querySelector(`[data-badge="${badgeId}"]`);
            badge.classList.remove('locked');
            badge.classList.add('unlocked');
        }
    });
}

// Show Celebration Modal
function showCelebration(impact) {
    const modal = document.getElementById('celebrationModal');
    const message = document.getElementById('celebrationMessage');
    const impactText = modal.querySelector('.impact-text');
    
    message.textContent = '你為海洋做出了一份貢獻！';
    impactText.textContent = impact;
    
    modal.style.display = 'flex';
}

function closeCelebration() {
    document.getElementById('celebrationModal').style.display = 'none';
}

// New Fact
function newFact() {
    const factText = document.getElementById('dailyFact');
    const currentFact = factText.textContent;
    let newFactText;
    
    do {
        newFactText = oceanFacts[Math.floor(Math.random() * oceanFacts.length)];
    } while (newFactText === currentFact);
    
    // Fade out
    factText.style.opacity = '0';
    
    setTimeout(() => {
        factText.textContent = newFactText;
        factText.style.opacity = '1';
    }, 200);
}

// Save/Load Stats
function saveStats() {
    localStorage.setItem('oceanGuardianStats', JSON.stringify({
        plasticAvoided: state.plasticAvoided,
        trashCollected: state.trashCollected,
        sustainableChoices: state.sustainableChoices,
        livesSaved: state.livesSaved,
        oceanHealth: state.oceanHealth,
        badges: state.badges
    }));
}

function loadStats() {
    const saved = localStorage.getItem('oceanGuardianStats');
    if (saved) {
        const data = JSON.parse(saved);
        state.plasticAvoided = data.plasticAvoided || 0;
        state.trashCollected = data.trashCollected || 0;
        state.sustainableChoices = data.sustainableChoices || 0;
        state.livesSaved = data.livesSaved || 0;
        state.oceanHealth = data.oceanHealth || 78;
        state.badges = data.badges || { starter: false, warrior: false, collector: false, champion: false };
        
        updateStats();
        updateOceanHealth();
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('celebrationModal');
    if (event.target === modal) {
        closeCelebration();
    }
}
