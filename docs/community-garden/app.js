// ===== DATA & STATE =====
let plants = JSON.parse(localStorage.getItem('cg_plants')) || [];
let harvests = JSON.parse(localStorage.getItem('cg_harvests')) || [];
let selectedType = null;

const plantTypes = {
    tomato: { emoji: '🍅', name: '番茄', waterFreq: 2, growthDays: 60 },
    lettuce: { emoji: '🥬', name: '生菜', waterFreq: 1, growthDays: 30 },
    herb: { emoji: '🌿', name: '香草', waterFreq: 2, growthDays: 21 },
    flower: { emoji: '🌻', name: '花卉', waterFreq: 2, growthDays: 45 },
    pepper: { emoji: '🌶️', name: '辣椒', waterFreq: 2, growthDays: 70 },
    other: { emoji: '🪴', name: '植物', waterFreq: 2, growthDays: 30 }
};

const tips = [
    { category: '澆水技巧', icon: '💧', text: '早晨澆水比晚上好，可減少病害並讓植物充分吸收。' },
    { category: '土壤管理', icon: '🪴', text: '每月施用一次有機堆肥，保持土壤肥力和結構。' },
    { category: '病蟲防治', icon: '🐞', text: '種植迷迭香和薄荷可天然驅趕害蟲，減少農藥使用。' },
    { category: '空間利用', icon: '📐', text: '高矮植物交替種植，可最大化利用陽光和空間。' },
    { category: '收穫時機', icon: '🌾', text: '清晨收穫蔬果，糖分和水分含量最高，口感最佳。' },
    { category: '節水方法', icon: '♻️', text: '收集雨水澆灌，可節省 40% 自來水使用量。' },
    { category: '伴生種植', icon: '🌱', text: '番茄和蘿蔔一起種植，可互相促進生長並驅蟲。' },
    { category: '播種技巧', icon: '🌰', text: '春季播種前，將種子浸泡在溫水中 4-6 小時，可提高發芽率 30%。' }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initDateInput();
    renderPlants();
    renderStats();
    renderTimeline();
    renderHarvests();
    updateWeather();
    showDailyTip();
    initTypeButtons();
    checkWateringNeeds();
});

function initDateInput() {
    const dateInput = document.getElementById('plantDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
}

function initTypeButtons() {
    const buttons = document.querySelectorAll('.type-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedType = btn.dataset.type;
        });
    });
}

// ===== PLANT MANAGEMENT =====
function renderPlants() {
    const grid = document.getElementById('gardenGrid');
    if (!grid) return;

    if (plants.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 40px;">
                <p>🌱 花園還是空的</p>
                <p style="font-size: 13px; margin-top: 8px;">點擊「新增植物」開始種植</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = plants.map((plant, index) => {
        const type = plantTypes[plant.type] || plantTypes.other;
        const daysSinceWatered = getDaysSince(plant.lastWatered);
        const needsWater = daysSinceWatered >= type.waterFreq;
        const growthPercent = Math.min(100, Math.round((plant.age / type.growthDays) * 100));
        
        return `
            <div class="plant-card ${needsWater ? 'needs-water' : ''}" data-index="${index}">
                <span class="plant-emoji">${type.emoji}</span>
                <span class="plant-name">${plant.name}</span>
                <span class="plant-type">${type.name} · 生長 ${growthPercent}%</span>
                <div class="plant-status">
                    <span class="status-item">
                        💧 ${daysSinceWatered}天前
                    </span>
                    <span class="status-item">
                        📅 ${plant.age}天
                    </span>
                </div>
                <button class="water-btn" onclick="waterPlant(${index}, event)"">${needsWater ? '💧 需要澆水' : '✅ 已澆水'}</button>
            </div>
        `;
    }).join('');
}

function openAddModal() {
    document.getElementById('addModal').style.display = 'flex';
    selectedType = null;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('plantName').value = '';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

function addPlant() {
    const name = document.getElementById('plantName').value.trim();
    const date = document.getElementById('plantDate').value;

    if (!selectedType) {
        alert('請選擇植物類型');
        return;
    }
    if (!name) {
        alert('請輸入植物名稱');
        return;
    }

    const plantDate = new Date(date);
    const today = new Date();
    const age = Math.floor((today - plantDate) / (1000 * 60 * 60 * 24));

    const newPlant = {
        id: Date.now(),
        type: selectedType,
        name: name,
        plantedDate: date,
        age: age,
        lastWatered: date,
        waterCount: 0
    };

    plants.push(newPlant);
    savePlants();
    renderPlants();
    renderStats();
    renderTimeline();
    closeAddModal();
}

function waterPlant(index, event) {
    event.stopPropagation();
    const plant = plants[index];
    const today = new Date().toISOString().split('T')[0];
    
    plant.lastWatered = today;
    plant.waterCount++;
    savePlants();
    
    showWaterModal(plant);
    renderPlants();
    checkWateringNeeds();
}

function showWaterModal(plant) {
    const type = plantTypes[plant.type] || plantTypes.other;
    document.getElementById('waterMessage').textContent = 
        `你的 ${plant.name} 感到開心 ${type.emoji}`;
    document.getElementById('waterModal').style.display = 'flex';
}

function closeWaterModal() {
    document.getElementById('waterModal').style.display = 'none';
}

function savePlants() {
    localStorage.setItem('cg_plants', JSON.stringify(plants));
}

// ===== STATS =====
function renderStats() {
    const totalPlants = plants.length;
    const harvestCount = harvests.length;
    const waterSaved = plants.reduce((sum, p) => sum + (p.waterCount || 0) * 2, 0);
    const carbonAbsorbed = (totalPlants * 0.5 + harvestCount * 0.2).toFixed(1);

    document.getElementById('totalPlants').textContent = totalPlants;
    document.getElementById('harvestCount').textContent = harvestCount;
    document.getElementById('waterSaved').textContent = waterSaved + 'L';
    document.getElementById('carbonAbsorbed').textContent = carbonAbsorbed + 'kg';
}

// ===== TIMELINE =====
function renderTimeline() {
    const chart = document.getElementById('timelineChart');
    if (!chart || plants.length === 0) return;

    const maxDays = Math.max(...plants.map(p => {
        const type = plantTypes[p.type] || plantTypes.other;
        return type.growthDays;
    }));

    chart.innerHTML = plants.slice(0, 7).map(plant => {
        const type = plantTypes[plant.type] || plantTypes.other;
        const height = Math.max(20, (plant.age / maxDays) * 100);
        const growthPercent = Math.min(100, Math.round((plant.age / type.growthDays) * 100));
        
        return `
            <div class="timeline-item">
                <div class="timeline-bar" style="height: ${height}px" data-growth="${growthPercent}%"></div>
                <span class="timeline-label">${type.emoji}</span>
            </div>
        `;
    }).join('');
}

// ===== HARVEST =====
function renderHarvests() {
    const list = document.getElementById('harvestList');
    if (!list) return;

    if (harvests.length === 0) {
        list.innerHTML = '<p class="empty-state">暫無收穫記錄</p>';
        return;
    }

    list.innerHTML = harvests.slice(-5).reverse().map(h => `
        <div class="harvest-item">
            <span class="harvest-icon">${h.emoji}</span>
            <div class="harvest-info">
                <span class="harvest-name">${h.name}</span>
                <span class="harvest-date">${h.date}</span>
            </div>
            <span class="harvest-amount">${h.amount}</span>
        </div>
    `).join('');
}

// Add a sample harvest for demo
function addSampleHarvest() {
    const sampleHarvests = [
        { name: '小紅番茄', date: '2026-02-25', amount: '5個', emoji: '🍅' },
        { name: '新鮮生菜', date: '2026-02-28', amount: '3棵', emoji: '🥬' },
        { name: '薄荷葉', date: '2026-03-01', amount: '1把', emoji: '🌿' }
    ];
    
    if (harvests.length === 0) {
        harvests = sampleHarvests;
        localStorage.setItem('cg_harvests', JSON.stringify(harvests));
        renderHarvests();
        renderStats();
    }
}

// ===== UTILITIES =====
function getDaysSince(dateString) {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

function updateWeather() {
    // Simulated weather data
    const weathers = [
        { icon: '☀️', desc: '晴朗 · 記得遮陰', temp: '26°C' },
        { icon: '🌤️', desc: '多雲 · 適合澆水', temp: '24°C' },
        { icon: '☁️', desc: '陰天 · 減少澆水', temp: '22°C' },
        { icon: '🌧️', desc: '小雨 · 無需澆水', temp: '20°C' }
    ];
    const w = weathers[Math.floor(Math.random() * weathers.length)];
    
    document.getElementById('weatherIcon').textContent = w.icon;
    document.getElementById('weatherDesc').textContent = w.desc;
    document.getElementById('weatherTemp').textContent = w.temp;
}

function checkWateringNeeds() {
    const needsWater = plants.filter(p => {
        const type = plantTypes[p.type] || plantTypes.other;
        return getDaysSince(p.lastWatered) >= type.waterFreq;
    }).length;

    const alert = document.getElementById('wateringAlert');
    if (alert) {
        if (needsWater > 0) {
            alert.innerHTML = `
                <span class="alert-icon">💧</span>
                <span>今日有 ${needsWater} 株植物需要澆水</span>
            `;
            alert.style.display = 'flex';
        } else {
            alert.innerHTML = `
                <span class="alert-icon">✅</span>
                <span>所有植物都已澆水</span>
            `;
        }
    }
}

function showDailyTip() {
    const today = new Date().getDay();
    const tip = tips[today % tips.length];
    
    document.getElementById('tipText').textContent = tip.text;
    document.querySelector('.tip-category').textContent = tip.category;
    document.querySelector('.tip-icon-large').textContent = tip.icon;
}

// ===== INITIAL DEMO DATA =====
if (plants.length === 0) {
    // Add sample plants
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    
    plants = [
        { id: 1, type: 'tomato', name: '小紅番茄', plantedDate: lastWeek, age: 7, lastWatered: yesterday, waterCount: 3 },
        { id: 2, type: 'lettuce', name: '奶油生菜', plantedDate: lastWeek, age: 7, lastWatered: today, waterCount: 4 },
        { id: 3, type: 'herb', name: '新鮮薄荷', plantedDate: yesterday, age: 1, lastWatered: yesterday, waterCount: 1 }
    ];
    savePlants();
    renderPlants();
    renderStats();
    renderTimeline();
    checkWateringNeeds();
}

// Add sample harvests
addSampleHarvest();

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
