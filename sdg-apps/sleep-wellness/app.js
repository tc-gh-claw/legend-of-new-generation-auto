// Sleep Wellness App - JavaScript

// Data storage
const STORAGE_KEY = 'sleepWellnessData';

// Tips array
const sleepTips = [
    "建立固定的睡前儀式，如閱讀或冥想，能幫助大腦識別「該睡覺了」的信號。",
    "睡前1小時避免使用電子產品，藍光會抑制褪黑激素分泌。",
    "保持臥室溫度在 18-22°C 之間，較涼的環境有助於入睡。",
    "下午2點後避免攝取咖啡因，它的半衰期約5-6小時。",
    "規律運動能改善睡眠質量，但避免在睡前3小時進行劇烈運動。",
    "嘗試 4-7-8 呼吸法：吸氣4秒、屏息7秒、呼氣8秒。",
    "臥室應該只用於睡眠和親密行為，避免在床上工作。",
    "如果20分鐘內無法入睡，起床做些放鬆的事情，有睡意再回床。",
    "週末也盡量保持相同作息，補覺無法彌補平日的睡眠不足。",
    "睡前洗個溫水澡，體溫下降過程會讓你感到困倦。",
    "避免睡前大量進食，但也不要空腹上床。",
    "日光曝曬有助於調節生理時鐘，早上花15分鐘曬太陽。"
];

// Quality labels
const qualityLabels = {
    1: "😫 很差 - 需要改善睡眠習慣",
    2: "😵 欠佳 - 嘗試放鬆技巧",
    3: "😐 一般 - 還有進步空間",
    4: "🙂 良好 - 不錯的睡眠",
    5: "😴 極佳 - 完美的睡眠！"
};

// State
let sleepData = {
    sleepGoal: 8,
    sleepStartTime: null,
    isSleeping: false,
    history: [],
    lastTipIndex: -1
};

// Initialize
function init() {
    loadData();
    updateUI();
    renderChart();
    renderHistory();
    showRandomTip();
    
    // Add SVG gradient
    addSVGGradient();
}

// Add SVG gradient definition
function addSVGGradient() {
    const svgs = document.querySelectorAll('.goal-circle svg');
    svgs.forEach(svg => {
        if (!svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            linearGradient.setAttribute('id', 'goalGradient');
            linearGradient.setAttribute('x1', '0%');
            linearGradient.setAttribute('y1', '0%');
            linearGradient.setAttribute('x2', '100%');
            linearGradient.setAttribute('y2', '100%');
            
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#9d7fe8');
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', '#a8edea');
            
            linearGradient.appendChild(stop1);
            linearGradient.appendChild(stop2);
            defs.appendChild(linearGradient);
            svg.prepend(defs);
        }
    });
}

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        sleepData = { ...sleepData, ...JSON.parse(stored) };
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sleepData));
}

// Show random tip
function showRandomTip() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * sleepTips.length);
    } while (newIndex === sleepData.lastTipIndex && sleepTips.length > 1);
    
    sleepData.lastTipIndex = newIndex;
    document.getElementById('dailyTip').textContent = sleepTips[newIndex];
    saveData();
}

// Start sleep
function startSleep() {
    sleepData.isSleeping = true;
    sleepData.sleepStartTime = new Date().toISOString();
    saveData();
    
    document.getElementById('sleepBtn').style.display = 'none';
    document.getElementById('wakeBtn').style.display = 'flex';
    document.getElementById('sleepTimer').style.display = 'block';
    document.getElementById('statusTitle').textContent = '晚安，好夢 💤';
    document.getElementById('statusDesc').textContent = '正在記錄你的睡眠時間...';
    document.getElementById('statusIcon').textContent = '😴';
    
    startTimer();
}

// Timer interval
let timerInterval = null;

function startTimer() {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!sleepData.sleepStartTime) return;
    
    const start = new Date(sleepData.sleepStartTime);
    const now = new Date();
    const diff = now - start;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('timerHours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('timerMinutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('timerSeconds').textContent = seconds.toString().padStart(2, '0');
}

// Wake up
function wakeUp() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const endTime = new Date();
    const startTime = new Date(sleepData.sleepStartTime);
    const duration = (endTime - startTime) / 3600000; // hours
    
    // Show quality rating
    document.getElementById('qualityCard').style.display = 'block';
    document.getElementById('sleepTimer').style.display = 'none';
    document.getElementById('sleepBtn').style.display = 'flex';
    document.getElementById('wakeBtn').style.display = 'none';
    document.getElementById('statusTitle').textContent = '起床了！';
    document.getElementById('statusDesc').textContent = `睡眠時長：${formatDuration(duration)}`;
    
    // Store temporary data for rating
    sleepData.tempSleepRecord = {
        startTime: sleepData.sleepStartTime,
        endTime: endTime.toISOString(),
        duration: duration,
        date: new Date().toISOString().split('T')[0]
    };
    
    sleepData.isSleeping = false;
    sleepData.sleepStartTime = null;
    saveData();
}

// Rate sleep
function rateSleep(rating) {
    // Update star display
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    // Update label
    document.getElementById('qualityLabel').textContent = qualityLabels[rating];
    
    // Save record after short delay
    setTimeout(() => {
        if (sleepData.tempSleepRecord) {
            const record = {
                ...sleepData.tempSleepRecord,
                quality: rating,
                id: Date.now()
            };
            
            sleepData.history.unshift(record);
            sleepData.tempSleepRecord = null;
            saveData();
            
            // Hide quality card and update UI
            document.getElementById('qualityCard').style.display = 'none';
            resetStars();
            updateUI();
            renderChart();
            renderHistory();
            
            document.getElementById('statusTitle').textContent = '準備好入睡了嗎？';
            document.getElementById('statusDesc').textContent = '點擊下方按鈕記錄睡眠';
        }
    }, 500);
}

function resetStars() {
    document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
    document.getElementById('qualityLabel').textContent = '點擊星星評分';
}

// Format duration
function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h > 0) {
        return `${h}小時${m > 0 ? m + '分鐘' : ''}`;
    }
    return `${m}分鐘`;
}

// Update UI
function updateUI() {
    // Update goal display
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = sleepData.history.find(h => h.date === today);
    
    const goalHours = todayRecord ? Math.min(todayRecord.duration, sleepData.sleepGoal) : 0;
    const progress = (goalHours / sleepData.sleepGoal) * 283; // 283 is circumference
    
    document.getElementById('goalTarget').textContent = sleepData.sleepGoal;
    document.getElementById('goalHours').textContent = goalHours.toFixed(1);
    
    const progressCircle = document.getElementById('goalProgress');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 45; // r=45
        const offset = circumference - (goalHours / sleepData.sleepGoal) * circumference;
        progressCircle.style.strokeDashoffset = Math.max(0, offset);
    }
    
    // Update goal message
    const goalMessage = document.getElementById('goalMessage');
    if (todayRecord) {
        const percentage = Math.round((todayRecord.duration / sleepData.sleepGoal) * 100);
        if (percentage >= 100) {
            goalMessage.textContent = '🎉 目標達成！睡得很好！';
            goalMessage.style.color = 'var(--success)';
        } else {
            goalMessage.textContent = `已完成 ${percentage}% 睡眠目標`;
            goalMessage.style.color = 'var(--text-secondary)';
        }
    } else {
        goalMessage.textContent = '還未記錄睡眠';
        goalMessage.style.color = 'var(--text-secondary)';
    }
    
    // Update stats
    updateStats();
}

// Update statistics
function updateStats() {
    const last7Days = sleepData.history.slice(0, 7);
    
    if (last7Days.length > 0) {
        // Average duration
        const avgDuration = last7Days.reduce((sum, h) => sum + h.duration, 0) / last7Days.length;
        document.getElementById('avgSleep').textContent = avgDuration.toFixed(1) + 'h';
        
        // Average quality
        const avgQuality = last7Days.reduce((sum, h) => sum + h.quality, 0) / last7Days.length;
        document.getElementById('sleepQuality').textContent = avgQuality.toFixed(1) + '⭐';
    } else {
        document.getElementById('avgSleep').textContent = '--';
        document.getElementById('sleepQuality').textContent = '--';
    }
    
    // Streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (sleepData.history.some(h => h.date === dateStr)) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    document.getElementById('sleepStreak').textContent = streak + '天';
}

// Render chart
function renderChart() {
    const chartBars = document.getElementById('chartBars');
    chartBars.innerHTML = '';
    
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayIndex = date.getDay();
        
        const record = sleepData.history.find(h => h.date === dateStr);
        const hours = record ? record.duration : 0;
        const height = Math.min((hours / 10) * 100, 100); // Max 10 hours = 100%
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = height + '%';
        bar.setAttribute('data-value', hours > 0 ? hours.toFixed(1) + 'h' : '');
        
        if (i === 0) {
            bar.style.opacity = '1';
        }
        
        chartBars.appendChild(bar);
    }
}

// Render history
function renderHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    const recentHistory = sleepData.history.slice(0, 5);
    
    if (recentHistory.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">尚無睡眠記錄</p>';
        return;
    }
    
    recentHistory.forEach(record => {
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const stars = '⭐'.repeat(record.quality);
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <span class="history-date">${dateStr}</span>
            <div class="history-details">
                <span class="history-duration">${formatDuration(record.duration)}</span>
                <span class="history-quality">${stars}</span>
            </div>
        `;
        
        historyList.appendChild(item);
    });
}

// Edit goal
function editGoal() {
    document.getElementById('goalModal').style.display = 'flex';
    document.getElementById('goalInput').value = sleepData.sleepGoal;
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
}

function saveGoal() {
    const newGoal = parseFloat(document.getElementById('goalInput').value);
    if (newGoal >= 4 && newGoal <= 12) {
        sleepData.sleepGoal = newGoal;
        saveData();
        updateUI();
        closeGoalModal();
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('goalModal');
    if (e.target === modal) {
        closeGoalModal();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
