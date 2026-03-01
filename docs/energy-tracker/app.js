/**
 * 綠電追蹤 - Green Energy Tracker
 * SDG 7 - Affordable and Clean Energy
 */

// 能源數據管理
const EnergyTracker = {
    data: {
        todayUsage: 0,
        dailyTarget: 10,
        renewablePercent: 30,
        history: [],
        weeklyData: [],
        tips: [
            { id: 1, text: "將冷氣溫度調高1度，可節省約6%電力。" },
            { id: 2, text: "使用LED燈泡比傳統慳電膽節省75%能源。" },
            { id: 3, text: "電器處於待機模式仍會耗電，不使用時應完全關閉。" },
            { id: 4, text: "在離峰時段（晚上11後）使用洗衣機和洗碗機更省電。" },
            { id: 5, text: "定期清潔冷氣濾網，可提高20%效率。" },
            { id: 6, text: "選購電器時留意能源標籤，1級最慳電。" },
            { id: 7, text: "善用自然光，減少開燈時間。" },
            { id: 8, text: "熱水器設定在60°C即可，過高會浪費能源。" }
        ],
        currentTipIndex: 0
    },

    // 初始化
    init() {
        this.loadData();
        this.generateWeeklyData();
        this.setupEventListeners();
        this.render();
        this.startAutoSave();
    },

    // 載入數據
    loadData() {
        const saved = localStorage.getItem('energyTrackerData');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 檢查是否為今天
            const today = new Date().toDateString();
            if (parsed.date === today) {
                this.data = { ...this.data, ...parsed };
            } else {
                // 新的一天，重置今日數據但保留歷史
                this.archiveYesterday(parsed.todayUsage || 0);
                this.data.todayUsage = 0;
                this.data.history = [];
                this.data.date = today;
            }
        } else {
            this.data.date = new Date().toDateString();
        }
    },

    // 存檔昨日數據到週數據
    archiveYesterday(usage) {
        const weekData = JSON.parse(localStorage.getItem('energyWeeklyData') || '[]');
        weekData.push({
            date: new Date(Date.now() - 86400000).toDateString(),
            usage: usage
        });
        // 只保留最近7天
        if (weekData.length > 7) weekData.shift();
        localStorage.setItem('energyWeeklyData', JSON.stringify(weekData));
    },

    // 生成週數據
    generateWeeklyData() {
        const weekData = JSON.parse(localStorage.getItem('energyWeeklyData') || '[]');
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        
        // 填充最近7天
        this.data.weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = days[d.getDay()];
            const dateStr = d.toDateString();
            
            const existing = weekData.find(w => w.date === dateStr);
            const usage = i === 0 ? this.data.todayUsage : (existing ? existing.usage : Math.random() * 8 + 4);
            
            this.data.weeklyData.push({
                day: dayStr,
                usage: parseFloat(usage.toFixed(1)),
                isToday: i === 0
            });
        }
    },

    // 設置事件監聽
    setupEventListeners() {
        // 電器按鈕
        document.querySelectorAll('.appliance-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const watt = parseFloat(btn.dataset.watt);
                const time = parseFloat(btn.dataset.time);
                const name = btn.querySelector('.name').textContent;
                const icon = btn.querySelector('.icon').textContent;
                this.logAppliance(name, icon, watt, time);
            });
        });

        // 綠電目標滑桿
        const goalSlider = document.getElementById('renewableGoal');
        goalSlider.addEventListener('input', (e) => {
            this.data.renewablePercent = parseInt(e.target.value);
            document.getElementById('goalValue').textContent = this.data.renewablePercent;
            this.updateRenewableBadge();
            this.saveData();
        });

        // 綠電來源開關
        document.getElementById('solarPanel').addEventListener('change', () => this.updateRenewableBadge());
        document.getElementById('greenProvider').addEventListener('change', () => this.updateRenewableBadge());

        // 下一個錦囊
        document.getElementById('nextTip').addEventListener('click', () => {
            this.data.currentTipIndex = (this.data.currentTipIndex + 1) % this.data.tips.length;
            this.renderTip();
        });
    },

    // 記錄電器使用
    logAppliance(name, icon, watt, hours) {
        const kwh = (watt * hours) / 1000;
        this.data.todayUsage += kwh;
        
        const record = {
            id: Date.now(),
            name,
            icon,
            watt,
            hours,
            kwh: parseFloat(kwh.toFixed(2)),
            time: new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })
        };
        
        this.data.history.unshift(record);
        this.generateWeeklyData(); // 更新今日數據
        this.saveData();
        this.render();
        
        // 顯示反饋動畫
        this.showFeedback(`已記錄: ${name} (+${record.kwh.toFixed(2)} kWh)`);
    },

    // 顯示反饋
    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-green);
            color: var(--bg-primary);
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: var(--shadow-glow);
        `;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    },

    // 更新綠電徽章
    updateRenewableBadge() {
        const solar = document.getElementById('solarPanel').checked;
        const provider = document.getElementById('greenProvider').checked;
        let percent = this.data.renewablePercent;
        
        if (solar && provider) {
            percent = Math.min(percent + 40, 100);
        } else if (solar) {
            percent = Math.min(percent + 25, 100);
        } else if (provider) {
            percent = Math.min(percent + 15, 100);
        }
        
        document.getElementById('renewablePercent').textContent = percent + '%';
    },

    // 保存數據
    saveData() {
        localStorage.setItem('energyTrackerData', JSON.stringify(this.data));
    },

    // 自動保存
    startAutoSave() {
        setInterval(() => this.saveData(), 30000);
    },

    // 渲染
    render() {
        this.renderGauge();
        this.renderStats();
        this.renderChart();
        this.renderHistory();
        this.renderTip();
        this.updateRenewableBadge();
    },

    // 渲染儀表
    renderGauge() {
        const usage = this.data.todayUsage;
        const target = this.data.dailyTarget;
        const percentage = Math.min(usage / target, 1);
        
        // 更新數值
        document.getElementById('currentUsage').textContent = usage.toFixed(1);
        
        // 更新弧形進度
        const gaugeFill = document.getElementById('gaugeFill');
        const arcLength = 251; // SVG path length
        const dashArray = arcLength * percentage;
        gaugeFill.style.strokeDasharray = `${dashArray} ${arcLength}`;
        
        // 根據用電量改變顏色
        const root = document.documentElement;
        if (percentage > 0.9) {
            root.style.setProperty('--accent-green', '#ff453a');
            root.style.setProperty('--accent-green-glow', 'rgba(255, 69, 58, 0.3)');
        } else if (percentage > 0.7) {
            root.style.setProperty('--accent-green', '#ff9f0a');
            root.style.setProperty('--accent-green-glow', 'rgba(255, 159, 10, 0.3)');
        } else {
            root.style.setProperty('--accent-green', '#30d158');
            root.style.setProperty('--accent-green-glow', 'rgba(48, 209, 88, 0.3)');
        }
    },

    // 渲染統計
    renderStats() {
        const usage = this.data.todayUsage;
        const rate = 1.5; // $/kWh 假設電價
        const carbonFactor = 0.58; // kg CO2/kWh
        
        const cost = usage * rate;
        const carbon = usage * carbonFactor;
        
        // 計算平均用電（基於週數據）
        const avgUsage = this.data.weeklyData.reduce((sum, d) => sum + d.usage, 0) / this.data.weeklyData.length;
        
        // 節能達成率
        const savings = Math.max(0, ((this.data.dailyTarget - usage) / this.data.dailyTarget) * 100);
        
        document.getElementById('costToday').textContent = '$' + cost.toFixed(1);
        document.getElementById('carbonToday').textContent = carbon.toFixed(2) + 'kg';
        document.getElementById('avgDaily').textContent = avgUsage.toFixed(1);
        document.getElementById('savings').textContent = savings.toFixed(0) + '%';
    },

    // 渲染圖表
    renderChart() {
        const chart = document.getElementById('weeklyChart');
        const labels = document.getElementById('chartLabels');
        
        const maxUsage = Math.max(...this.data.weeklyData.map(d => d.usage), 10);
        
        chart.innerHTML = '';
        labels.innerHTML = '';
        
        this.data.weeklyData.forEach(day => {
            const height = (day.usage / maxUsage) * 100;
            const bar = document.createElement('div');
            bar.className = `chart-bar ${day.isToday ? 'active' : ''}`;
            bar.style.height = height + '%';
            bar.setAttribute('data-value', day.usage.toFixed(1));
            chart.appendChild(bar);
            
            const label = document.createElement('span');
            label.textContent = day.day;
            labels.appendChild(label);
        });
    },

    // 渲染歷史
    renderHistory() {
        const list = document.getElementById('historyList');
        
        if (this.data.history.length === 0) {
            list.innerHTML = '<p class="empty-state">暫無記錄，點擊上方電器按鈕開始記錄</p>';
            return;
        }
        
        list.innerHTML = '';
        this.data.history.slice(0, 10).forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <span class="history-icon">${item.icon}</span>
                <div class="history-info">
                    <span class="history-name">${item.name}</span>
                    <span class="history-time">${item.time}</span>
                </div>
                <span class="history-kwh">+${item.kwh.toFixed(2)} kWh</span>
            `;
            list.appendChild(el);
        });
    },

    // 渲染錦囊
    renderTip() {
        const tip = this.data.tips[this.data.currentTipIndex];
        document.getElementById('tipNumber').textContent = tip.id;
        document.getElementById('tipText').textContent = tip.text;
    }
};

// 啟動
document.addEventListener('DOMContentLoaded', () => {
    EnergyTracker.init();
});
