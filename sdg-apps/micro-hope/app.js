// MicroHope App - SDG 1: No Poverty
// 微光希望應用程式

// Data Store
let appData = {
    peopleHelped: 0,
    familiesSupported: 0,
    microLoans: 0,
    completedActions: [],
    logs: [],
    badges: [],
    currentStory: 0,
    streakDays: 0
};

// Action Definitions
const actions = {
    fairtrade: { 
        name: '選購公平貿易商品', 
        people: 1, 
        families: 1, 
        icon: '☕',
        message: '支持了 1 個生產者家庭'
    },
    donate: { 
        name: '捐贈物資', 
        people: 3, 
        families: 1, 
        icon: '🎁',
        message: '幫助了 3 位有需要的人'
    },
    skillshare: { 
        name: '技能分享', 
        people: 2, 
        families: 0, 
        icon: '📚',
        message: '賦能了 2 位學員'
    },
    localbiz: { 
        name: '支持社區小店', 
        people: 1, 
        families: 1, 
        icon: '🏪',
        message: '支持了 1 個家庭生計'
    },
    microloan: { 
        name: '微型貸款支持', 
        people: 5, 
        families: 1, 
        icon: '💰',
        message: '資助了 1 個創業夢想'
    }
};

// Knowledge Facts
const facts = [
    '全球仍有 7 億人生活在極端貧困中（每日生活費低於 $1.90）。但自 1990 年以來，已有超過 10 億人脫離貧困。',
    '微型貸款的平均金額僅 $25，但能幫助創業者開展小生意，養活整個家庭。',
    '教育是最有效的脫貧方式。每多受一年教育，收入可提升 10%。',
    '公平貿易認證確保生產者獲得合理價格，比傳統貿易多賺 20-50%。',
    '女性經濟賦權對家庭影響最大。女性收入每增加 $1，家庭健康和教育支出會增加 $0.90。',
    '社區合作社模式讓小農能繞過中間商，直接與消費者對接，收入可提升 3 倍。',
    '技能培訓是長期脫貧的關鍵。學習一門手藝能讓收入持續增長 20 年以上。',
    '本地消費對社區經濟影響巨大。每 $100 本地消費，能為社區創造 $68 的額外經濟活動。'
];

// Badges System
const badges = {
    firststep: { name: '第一步', icon: '🌱', condition: () => appData.peopleHelped >= 1 },
    compassion: { name: '愛心播種者', icon: '💝', condition: () => appData.peopleHelped >= 10 },
    supporter: { name: '堅定支持者', icon: '🤝', condition: () => appData.streakDays >= 7 },
    changemaker: { name: '改變創造者', icon: '⭐', condition: () => appData.microLoans >= 5 },
    guardian: { name: '希望守護者', icon: '🛡️', condition: () => appData.peopleHelped >= 50 },
    angel: { name: '人間天使', icon: '👼', condition: () => appData.peopleHelped >= 100 }
};

// Impact Levels
const impactLevels = [
    { threshold: 0, name: '愛心種子', desc: '每個小小的善舉，都能點亮希望' },
    { threshold: 5, name: '溫暖小火苗', desc: '你的愛心正在溫暖他人' },
    { threshold: 15, name: '光明燈塔', desc: '你是他人的希望和指引' },
    { threshold: 30, name: '希望使者', desc: '你的影響力正在擴散' },
    { threshold: 50, name: '改變創造者', desc: '你正在創造真正的改變' },
    { threshold: 100, name: '人間天使', desc: '你的善行照亮無數生命' }
];

// Initialize
function init() {
    loadData();
    updateDisplay();
    updateDate();
    initCarouselDots();
    checkBadges();
}

// Load Data from LocalStorage
function loadData() {
    const saved = localStorage.getItem('microhope-data');
    if (saved) {
        appData = JSON.parse(saved);
        // Reset daily actions
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('microhope-last-visit');
        if (lastVisit !== today) {
            appData.completedActions = [];
            if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
                appData.streakDays++;
            } else if (lastVisit !== today) {
                appData.streakDays = 0;
            }
            localStorage.setItem('microhope-last-visit', today);
        }
    }
}

// Save Data
function saveData() {
    localStorage.setItem('microhope-data', JSON.stringify(appData));
}

// Update Display
function updateDisplay() {
    document.getElementById('peopleHelped').textContent = appData.peopleHelped;
    document.getElementById('familiesSupported').textContent = appData.familiesSupported;
    document.getElementById('microLoans').textContent = appData.microLoans;
    
    // Update impact level
    const level = impactLevels.slice().reverse().find(l => appData.peopleHelped >= l.threshold);
    if (level) {
        document.getElementById('impactLevel').textContent = level.name;
        document.querySelector('.level-desc').textContent = level.desc;
    }
    
    // Update completed actions
    appData.completedActions.forEach(action => {
        const item = document.querySelector(`[data-action="${action}"]`);
        if (item) {
            item.classList.add('completed');
            const btn = item.querySelector('.action-btn');
            btn.textContent = '✓';
            btn.disabled = true;
        }
    });
    
    // Update logs
    updateLogDisplay();
}

// Update Date
function updateDate() {
    const now = new Date();
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('todayDate').textContent = `${months[now.getMonth()]}${now.getDate()}日`;
}

// Complete Action
function completeAction(actionId) {
    if (appData.completedActions.includes(actionId)) return;
    
    const action = actions[actionId];
    if (!action) return;
    
    // Update stats
    appData.peopleHelped += action.people;
    appData.familiesSupported += action.families;
    if (actionId === 'microloan') {
        appData.microLoans += 1;
    }
    
    // Mark as completed
    appData.completedActions.push(actionId);
    
    // Add log
    addLog(action);
    
    // Save and update
    saveData();
    updateDisplay();
    checkBadges();
    
    // Show celebration
    showCelebration(action);
    
    // Update action UI
    const item = document.querySelector(`[data-action="${actionId}"]`);
    if (item) {
        item.classList.add('completed');
        const btn = item.querySelector('.action-btn');
        btn.textContent = '✓';
        btn.disabled = true;
    }
}

// Add Log
function addLog(action) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    appData.logs.unshift({
        time: timeStr,
        icon: action.icon,
        name: action.name,
        impact: `+${action.people}人`
    });
    
    // Keep only last 20 logs
    if (appData.logs.length > 20) {
        appData.logs = appData.logs.slice(0, 20);
    }
}

// Update Log Display
function updateLogDisplay() {
    const logList = document.getElementById('logList');
    
    if (appData.logs.length === 0) {
        logList.innerHTML = '<p class="empty-state">今日還沒有記錄，開始你的第一個善行吧！</p>';
        return;
    }
    
    logList.innerHTML = appData.logs.map(log => `
        <div class="log-item">
            <span class="log-time">${log.time}</span>
            <span class="log-icon">${log.icon}</span>
            <span class="log-text">${log.name}</span>
            <span class="log-impact">${log.impact}</span>
        </div>
    `).join('');
}

// Show Celebration Modal
function showCelebration(action) {
    const modal = document.getElementById('celebrationModal');
    document.getElementById('impactText').textContent = action.message;
    
    modal.classList.add('show');
}

// Close Celebration
function closeCelebration() {
    document.getElementById('celebrationModal').classList.remove('show');
}

// Check Badges
function checkBadges() {
    let newBadgeUnlocked = false;
    
    for (const [id, badge] of Object.entries(badges)) {
        if (!appData.badges.includes(id) && badge.condition()) {
            appData.badges.push(id);
            newBadgeUnlocked = true;
            
            // Update badge UI
            const badgeEl = document.querySelector(`[data-badge="${id}"]`);
            if (badgeEl) {
                badgeEl.classList.remove('locked');
                badgeEl.classList.add('unlocked');
            }
        }
    }
    
    // Update existing badges
    appData.badges.forEach(id => {
        const badgeEl = document.querySelector(`[data-badge="${id}"]`);
        if (badgeEl) {
            badgeEl.classList.remove('locked');
            badgeEl.classList.add('unlocked');
        }
    });
    
    if (newBadgeUnlocked) {
        saveData();
    }
}

// Initialize Carousel Dots
function initCarouselDots() {
    const dotsContainer = document.getElementById('carouselDots');
    const stories = document.querySelectorAll('.story-card');
    
    dotsContainer.innerHTML = Array.from(stories).map((_, i) => `
        <span class="dot ${i === 0 ? 'active' : ''}" onclick="goToStory(${i})"></span>
    `).join('');
}

// Story Navigation
function showStory(index) {
    const stories = document.querySelectorAll('.story-card');
    const dots = document.querySelectorAll('.dot');
    
    stories.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    
    appData.currentStory = index;
}

function nextStory() {
    const stories = document.querySelectorAll('.story-card');
    const next = (appData.currentStory + 1) % stories.length;
    showStory(next);
}

function prevStory() {
    const stories = document.querySelectorAll('.story-card');
    const prev = (appData.currentStory - 1 + stories.length) % stories.length;
    showStory(prev);
}

function goToStory(index) {
    showStory(index);
}

// Knowledge Fact Rotation
function newFact() {
    const factEl = document.getElementById('knowledgeFact');
    const currentFact = factEl.textContent;
    let newFactText;
    
    do {
        newFactText = facts[Math.floor(Math.random() * facts.length)];
    } while (newFactText === currentFact && facts.length > 1);
    
    factEl.style.opacity = '0';
    setTimeout(() => {
        factEl.textContent = newFactText;
        factEl.style.opacity = '1';
    }, 200);
}

// Auto-rotate stories
setInterval(() => {
    if (!document.hidden) {
        nextStory();
    }
}, 8000);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// Close modal on background click
document.getElementById('celebrationModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeCelebration();
    }
});
