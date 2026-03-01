// Green Plate - Sustainable Eating Tracker
// SDG 2: Zero Hunger

// State management
const state = {
    balance: {
        grains: 25,
        protein: 25,
        veg: 30,
        fruit: 20
    },
    meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
    },
    impacts: {
        carbonSaved: 2.4,
        waterSaved: 1250,
        landSaved: 12
    },
    currentMealType: 'breakfast'
};

// Daily tips database
const dailyTips = [
    { category: '植物性飲食', icon: '🌱', text: '每週一天不吃肉，可減少個人碳足跡達 15%。試試「週一無肉日」吧！' },
    { category: '本地食材', icon: '🌾', text: '選擇本地食材可減少 90% 運輸碳排放，同時支持本地農民。' },
    { category: '當季食物', icon: '🍂', text: '當季蔬果不僅更美味，種植所需能源比溫室作物少 50%。' },
    { category: '減少浪費', icon: '🍽️', text: '全球 1/3 食物被浪費。妥善規劃餐點，善用剩菜，從自己做起。' },
    { category: '水資源', icon: '💧', text: '生產 1kg 牛肉需要 15,000L 水，而 1kg 蔬菜只需 300L。' },
    { category: '全穀物', icon: '🌾', text: '選擇糙米、全麥等全穀物，營養價值更高，碳足跡更低。' }
];

// Scan results database
const scanDatabase = [
    { name: '有機藜麥沙拉', icon: '🥗', badge: '高度永續', carbon: 'low', water: 'low', nutrition: 'high' },
    { name: '當季蔬菜湯', icon: '🍲', badge: '高度永續', carbon: 'low', water: 'low', nutrition: 'high' },
    { name: '草飼牛肉漢堡', icon: '🍔', badge: '需注意', carbon: 'high', water: 'high', nutrition: 'medium' },
    { name: '野生鮭魚', icon: '🐟', badge: '永續選擇', carbon: 'medium', water: 'medium', nutrition: 'high' },
    { name: '進口芒果', icon: '🥭', badge: '季節考量', carbon: 'medium', water: 'medium', nutrition: 'high' },
    { name: '有機豆腐', icon: '🧊', badge: '高度永續', carbon: 'low', water: 'low', nutrition: 'high' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    animateBalanceWheel();
    loadRandomTip();
    renderMeals();
});

function initializeApp() {
    // Set date
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
    
    // Initialize chart bars
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach(bar => {
        const value = bar.dataset.value;
        bar.style.height = `${value}%`;
    });
}

function setupEventListeners() {
    // Meal type selector in modal
    const mealTypeBtns = document.querySelectorAll('.meal-type-btn');
    mealTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mealTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentMealType = btn.dataset.meal;
        });
    });
}

// Balance Wheel Animation
function animateBalanceWheel() {
    const wheel = document.getElementById('balanceWheel');
    const score = document.getElementById('balanceScore');
    
    // Animate score
    let currentScore = 0;
    const targetScore = 85;
    const scoreInterval = setInterval(() => {
        currentScore += 1;
        score.textContent = currentScore;
        if (currentScore >= targetScore) {
            clearInterval(scoreInterval);
        }
    }, 20);
    
    // Animate wheel
    wheel.style.transform = 'rotate(0deg)';
    setTimeout(() => {
        wheel.style.transition = 'transform 1s ease';
        wheel.style.transform = 'rotate(360deg)';
    }, 100);
}

// Modal Functions
function openAddMealModal() {
    document.getElementById('addMealModal').style.display = 'flex';
}

function closeAddMealModal() {
    document.getElementById('addMealModal').style.display = 'none';
    // Reset form
    document.querySelectorAll('.food-input-row:not(:first-child)').forEach(row => row.remove());
    document.querySelectorAll('.food-input-row input').forEach(input => input.value = '');
    document.querySelectorAll('.tag-checkbox input').forEach(cb => cb.checked = false);
}

function addFoodInput() {
    const container = document.getElementById('foodInputs');
    const row = document.createElement('div');
    row.className = 'food-input-row';
    row.innerHTML = `
        <input type="text" class="food-name" placeholder="食物名稱">
        <input type="number" class="food-amount" placeholder="份量(g)">
    `;
    container.appendChild(row);
}

function saveMeal() {
    const mealType = state.currentMealType;
    const foodInputs = document.querySelectorAll('.food-input-row');
    const mealItems = [];
    
    foodInputs.forEach(row => {
        const name = row.querySelector('.food-name').value.trim();
        const amount = row.querySelector('.food-amount').value.trim();
        if (name) {
            mealItems.push(`${name}${amount ? ` (${amount}g)` : ''}`);
        }
    });
    
    // Get sustainability tags
    const tags = [];
    document.querySelectorAll('.tag-checkbox input:checked').forEach(cb => {
        const tagMap = {
            'local': '🌾 本地',
            'organic': '🌱 有機',
            'plant': '🥗 植物性',
            'seasonal': '🍂 當季'
        };
        tags.push(tagMap[cb.value]);
    });
    
    if (mealItems.length > 0) {
        state.meals[mealType] = {
            items: mealItems,
            tags: tags,
            calories: Math.floor(Math.random() * 300) + 200
        };
        renderMeals();
        closeAddMealModal();
        updateBalanceWheel();
    }
}

function renderMeals() {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    mealTypes.forEach(type => {
        const itemsContainer = document.getElementById(`${type}Items`);
        const calElement = document.getElementById(`${type}Cal`);
        const sustainElement = document.getElementById(`${type}Sustain`);
        
        const meal = state.meals[type];
        
        if (meal && meal.items && meal.items.length > 0) {
            itemsContainer.innerHTML = meal.items.map(item => 
                `<p>${item}</p>`
            ).join('');
            calElement.textContent = `${meal.calories} kcal`;
            sustainElement.textContent = meal.tags.length > 0 ? meal.tags.join(' ') : '🌱';
        }
    });
}

function updateBalanceWheel() {
    // Simulate balance update based on meals
    const totalMeals = Object.values(state.meals).filter(m => m && m.items && m.items.length > 0).length;
    
    if (totalMeals > 0) {
        const score = Math.min(95, 70 + (totalMeals * 5));
        document.getElementById('balanceScore').textContent = score;
    }
}

// Food Scanner Functions
function simulateScan() {
    const display = document.getElementById('scannerDisplay');
    const result = document.getElementById('scanResult');
    
    // Show scanning animation
    display.innerHTML = `
        <div class="scanner-frame" style="position: relative; overflow: hidden;">
            <span class="scanner-icon">🔍</span>
            <p>掃描中...</p>
            <div class="scanning-line"></div>
        </div>
    `;
    
    // Simulate scan delay
    setTimeout(() => {
        // Restore original display
        display.innerHTML = `
            <div class="scanner-frame">
                <span class="scanner-icon">📷</span>
                <p>掃描食物條碼或拍照識別</p>
            </div>
        `;
        
        // Show random result
        const randomResult = scanDatabase[Math.floor(Math.random() * scanDatabase.length)];
        showScanResult(randomResult);
    }, 1500);
}

function showScanResult(data) {
    const result = document.getElementById('scanResult');
    
    document.getElementById('resultIcon').textContent = data.icon;
    document.getElementById('resultName').textContent = data.name;
    
    const badge = document.getElementById('resultBadge');
    badge.textContent = data.badge;
    badge.className = `result-badge ${data.badge.includes('高度') || data.badge.includes('永續') ? 'sustainable' : 'warning'}`;
    
    // Update stat bars
    const bars = result.querySelectorAll('.bar-fill');
    const barLabels = result.querySelectorAll('.bar-value');
    
    const levels = { low: '低', medium: '中', high: '高' };
    const widths = { low: '25%', medium: '50%', high: '90%' };
    const colors = { low: 'low', medium: 'medium', high: 'high' };
    
    bars[0].style.width = widths[data.carbon];
    bars[0].className = `bar-fill ${colors[data.carbon]}`;
    barLabels[0].textContent = levels[data.carbon];
    
    bars[1].style.width = widths[data.water];
    bars[1].className = `bar-fill ${colors[data.water]}`;
    barLabels[1].textContent = levels[data.water];
    
    bars[2].style.width = widths[data.nutrition];
    bars[2].className = `bar-fill high`;
    barLabels[2].textContent = levels[data.nutrition];
    
    result.style.display = 'block';
}

function addToMeal() {
    // Add scanned food to current meal
    const foodName = document.getElementById('resultName').textContent;
    
    if (!state.meals[state.currentMealType].items) {
        state.meals[state.currentMealType] = { items: [], tags: [], calories: 0 };
    }
    
    state.meals[state.currentMealType].items.push(foodName);
    state.meals[state.currentMealType].calories += Math.floor(Math.random() * 200) + 100;
    
    renderMeals();
    updateBalanceWheel();
    
    // Hide result
    document.getElementById('scanResult').style.display = 'none';
    
    // Show feedback
    showToast(`已加入${getMealName(state.currentMealType)}`);
}

function showFoodDatabase() {
    showToast('食物資料庫功能開發中...');
}

// Utility Functions
function loadRandomTip() {
    const tip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
    document.querySelector('.tip-icon-large').textContent = tip.icon;
    document.querySelector('.tip-category').textContent = tip.category;
    document.getElementById('tipText').textContent = tip.text;
}

function getMealName(type) {
    const names = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '點心'
    };
    return names[type] || type;
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Impact counter animations
function animateCounters() {
    const carbonEl = document.getElementById('carbonSaved');
    const waterEl = document.getElementById('waterSaved');
    const landEl = document.getElementById('landSaved');
    
    animateValue(carbonEl, 0, 2.4, 1000, 1);
    animateValue(waterEl, 0, 1250, 1500, 0);
    animateValue(landEl, 0, 12, 1000, 0);
}

function animateValue(element, start, end, duration, decimals) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;
        
        element.textContent = decimals > 0 ? current.toFixed(decimals) : Math.floor(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Run counter animation on load
setTimeout(animateCounters, 500);
