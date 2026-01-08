const API_BASE = 'http://localhost:5001';
let charts = {};
let currentSymbols = [];
let updateInterval = null;

// Tab Management
function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'charts': 'Charts',
        'indicators': 'Technical Indicators',
        'scheduler': 'Scheduler Configuration',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[tabName];

    // Load content for the tab
    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'charts') loadCharts();
    if (tabName === 'indicators') loadIndicators();
    if (tabName === 'scheduler') loadScheduler();
    if (tabName === 'settings') loadSettings();
}

// Load Symbols
async function loadSymbols() {
    try {
        const res = await fetch(`${API_BASE}/api/config/symbols`);
        const data = await res.json();
        currentSymbols = data.symbols || [];
        return currentSymbols;
    } catch (e) {
        console.error('Failed to load symbols:', e);
        return [];
    }
}

// Dashboard Tab
async function loadDashboard() {
    const symbols = await loadSymbols();
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = '<p>Loading statistics...</p>';

    let statsHTML = '';
    for (const symbol of symbols) {
        try {
            const res = await fetch(`${API_BASE}/api/stats/${symbol}`);
            const stats = await res.json();

            if (stats.error) continue;

            const changeClass = stats.change_24h >= 0 ? 'positive' : 'negative';
            const changeSymbol = stats.change_24h >= 0 ? '▲' : '▼';

            statsHTML += `
                <div class="stat-card">
                    <div class="stat-label">${symbol}</div>
                    <div class="stat-value">$${stats.current_price.toLocaleString()}</div>
                    <div class="stat-change ${changeClass}">
                        ${changeSymbol} ${Math.abs(stats.change_24h)}%
                    </div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                        <div>High: $${stats.high_24h}</div>
                        <div>Low: $${stats.low_24h}</div>
                        <div>Volume: ${stats.volume_24h.toFixed(2)}</div>
                    </div>
                </div>
           `;
        } catch (e) {
            console.error(`Failed to load stats for ${symbol}:`, e);
        }
    }

    statsGrid.innerHTML = statsHTML || '<p>No statistics available</p>';
}

// Charts Tab
async function loadCharts() {
    const symbols = await loadSymbols();
    const container = document.getElementById('charts-container');
    container.innerHTML = '';
    charts = {};

    for (const symbol of symbols) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'chart-card';
        cardDiv.innerHTML = `
            <h3>${symbol}</h3>
            <div id="chart_${symbol}" class="chart-wrapper"></div>
        `;
        container.appendChild(cardDiv);

        await createChart(`chart_${symbol}`, symbol);
    }
}

async function createChart(containerId, symbol) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: 400,
        layout: {
            backgroundColor: '#1a1f3a',
            textColor: '#8b92b0',
        },
        grid: {
            vertLines: { color: '#2d3352' },
            horzLines: { color: '#2d3352' },
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    });

    const candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
    });

    charts[symbol] = { chart, series: candlestickSeries };

    // Load data
    try {
        const res = await fetch(`${API_BASE}/api/data/${symbol}`);
        const data = await res.json();
        if (data.length > 0) {
            candlestickSeries.setData(data);
        }
    } catch (e) {
        console.error(`Failed to load chart data for ${symbol}:`, e);
    }

    // Handle resize
    new ResizeObserver(() => {
        chart.applyOptions({ width: container.clientWidth });
    }).observe(container);
}

// Indicators Tab
async function loadIndicators() {
    const symbols = await loadSymbols();
    const grid = document.getElementById('indicators-grid');
    grid.innerHTML = '<p>Loading indicators...</p>';

    let html = '';
    for (const symbol of symbols) {
        try {
            const res = await fetch(`${API_BASE}/api/indicators/${symbol}`);
            const ind = await res.json();

            if (ind.error) continue;

            const rsiClass = ind.rsi > 70 ? 'warning' : ind.rsi < 30 ? 'danger' : 'success';

            html += `
                <div class="indicator-card">
                    <h4>${symbol}</h4>
                    <div style="margin-top: 16px;">
                        <div class="stat-label">RSI (14)</div>
                        <div class="indicator-value" style="color: var(--${rsiClass})">${ind.rsi || 'N/A'}</div>
                    </div>
                    <div style="margin-top: 16px;">
                        <div class="stat-label">MACD</div>
                        <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                            <div>Line: ${ind.macd?.macd || 'N/A'}</div>
                            <div>Signal: ${ind.macd?.signal || 'N/A'}</div>
                            <div>Histogram: ${ind.macd?.histogram || 'N/A'}</div>
                        </div>
                    </div>
                    <div style="margin-top: 16px;">
                        <div class="stat-label">Bollinger Bands</div>
                        <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                            <div>Upper: ${ind.bollinger_bands?.upper || 'N/A'}</div>
                            <div>Middle: ${ind.bollinger_bands?.middle || 'N/A'}</div>
                            <div>Lower: ${ind.bollinger_bands?.lower || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error(`Failed to load indicators for ${symbol}:`, e);
        }
    }

    grid.innerHTML = html || '<p>No indicators available</p>';
}

// Scheduler Tab
async function loadScheduler() {
    try {
        const res = await fetch(`${API_BASE}/api/scheduler`);
        const config = await res.json();

        document.getElementById('interval-input').value = config.interval_seconds || 60;
        document.getElementById('scheduler-toggle').checked = config.enabled !== false;

        // Load pipeline status
        loadPipelineStatus();
    } catch (e) {
        console.error('Failed to load scheduler config:', e);
    }
}

async function loadPipelineStatus() {
    try {
        const res = await fetch(`${API_BASE}/api/pipeline/status`);
        const status = await res.json();

        let html = `
            <div style="display: grid; gap: 12px;">
                <div><strong>Status:</strong> ${status.status}</div>
                <div><strong>Total K-lines:</strong> ${status.total_klines}</div>
                <div><strong>Total Orderbook:</strong> ${status.total_orderbook}</div>
                <div><strong>Symbols:</strong> ${status.symbols?.join(', ')}</div>
            </div>
        `;

        if (status.metadata && status.metadata.length > 0) {
            html += '<h4 style="margin-top: 16px;">Extraction Metadata</h4><table style="width: 100%; margin-top: 8px;">';
            html += '<tr><th>Symbol</th><th>Type</th><th>Last Fetch</th><th>Records</th></tr>';
            status.metadata.forEach(m => {
                const lastFetch = m.last_fetch_time ? new Date(m.last_fetch_time).toLocaleString() : 'Never';
                html += `<tr><td>${m.symbol}</td><td>${m.data_type}</td><td>${lastFetch}</td><td>${m.record_count}</td></tr>`;
            });
            html += '</table>';
        }

        document.getElementById('pipeline-status').innerHTML = html;
    } catch (e) {
        console.error('Failed to load pipeline status:', e);
    }
}

async function updateScheduler() {
    const interval = parseInt(document.getElementById('interval-input').value);
    const enabled = document.getElementById('scheduler-toggle').checked;

    try {
        const res = await fetch(`${API_BASE}/api/scheduler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                interval_seconds: interval,
                enabled: enabled
            })
        });

        const data = await res.json();
        if (data.status === 'success') {
            alert(`✅ Scheduler updated!\nInterval: ${interval}s\nEnabled: ${enabled}`);
        }
    } catch (e) {
        alert('❌ Failed to update scheduler: ' + e.message);
    }
}

async function triggerNow() {
    try {
        await fetch(`${API_BASE}/api/trigger`, { method: 'POST' });
        alert('✅ Pipeline triggered! Check the status in a moment.');
        setTimeout(loadPipelineStatus, 2000);
    } catch (e) {
        alert('❌ Failed to trigger pipeline: ' + e.message);
    }
}

// Settings Tab
async function loadSettings() {
    const symbols = await loadSymbols();
    document.getElementById('symbols-input').value = symbols.join(', ');
}

async function updateSymbols() {
    const input = document.getElementById('symbols-input').value;
    const symbols = input.split(',').map(s => s.trim()).filter(s => s);

    try {
        const res = await fetch(`${API_BASE}/api/config/symbols`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols })
        });

        const data = await res.json();
        if (data.status === 'success') {
            currentSymbols = symbols;
            alert('✅ Symbols updated: ' + symbols.join(', '));
        }
    } catch (e) {
        alert('❌ Failed to update symbols: ' + e.message);
    }
}

// Refresh Data
async function refreshData() {
    const activeTab = document.querySelector('.tab-content.active').id;

    if (activeTab === 'dashboard-tab') await loadDashboard();
    if (activeTab === 'charts-tab') await loadCharts();
    if (activeTab === 'indicators-tab') await loadIndicators();
    if (activeTab === 'scheduler-tab') await loadScheduler();
}

// Auto Refresh
function startAutoRefresh() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        const activeTab = document.querySelector('.tab-content.active').id;
        if (activeTab === 'dashboard-tab') {
            loadDashboard();
        }
    }, 15000); // Refresh every 15 seconds
}

// Initialize
window.addEventListener('load', async () => {
    await loadDashboard();
    startAutoRefresh();
});
