const API_BASE = 'http://localhost:5001';
let charts = {};
let currentSymbols = [];
let updateInterval = null;

// Tab Management
function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'charts': 'Charts',
        'indicators': 'Technical Indicators',
        'scheduler': 'Scheduler Configuration',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[tabName];

    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'charts') loadCharts();
    if (tabName === 'indicators') loadIndicators();
    if (tabName === 'scheduler') loadScheduler();
    if (tabName === 'settings') loadSettings();
}

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

    try {
        const res = await fetch(`${API_BASE}/api/data/${symbol}`);
        const data = await res.json();
        if (data.length > 0) {
            candlestickSeries.setData(data);
        }
    } catch (e) {
        console.error(`Failed to load chart data for ${symbol}:`, e);
    }

    new ResizeObserver(() => {
        chart.applyOptions({ width: container.clientWidth });
    }).observe(container);
}

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

async function loadScheduler() {
    try {
        const res = await fetch(`${API_BASE}/api/scheduler`);
        const config = await res.json();

        document.getElementById('interval-input').value = config.interval_seconds || 60;
        document.getElementById('scheduler-toggle').checked = config.enabled !== false;

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
    const btn = event.target;
    const originalText = btn.textContent;
    const interval = parseInt(document.getElementById('interval-input').value);
    const enabled = document.getElementById('scheduler-toggle').checked;

    if (interval < 10) {
        showNotification('⚠️ Interval must be at least 10 seconds', 'warning');
        return;
    }

    btn.textContent = '⏳ Saving...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/scheduler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interval_seconds: interval, enabled: enabled })
        });

        const data = await res.json();
        if (data.status === 'success') {
            showNotification(`✅ Scheduler updated! Interval: ${interval}s, Enabled: ${enabled}`, 'success');
        }
    } catch (e) {
        showNotification('❌ Failed to update scheduler: ' + e.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function triggerNow() {
    const btn = event.target;
    const originalText = btn.textContent;

    btn.textContent = '⏳ Running Pipeline...';
    btn.disabled = true;

    try {
        await fetch(`${API_BASE}/api/trigger`, { method: 'POST' });
        showNotification('✅ Pipeline triggered! Refreshing status...', 'success');
        setTimeout(() => {
            loadPipelineStatus();
            showNotification('✅ Pipeline completed!', 'success');
        }, 2000);
    } catch (e) {
        showNotification('❌ Failed to trigger pipeline: ' + e.message, 'error');
    } finally {
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2500);
    }
}

async function loadSettings() {
    const symbols = await loadSymbols();
    document.getElementById('symbols-input').value = symbols.join(', ');
}

async function updateSymbols() {
    const btn = event.target;
    const originalText = btn.textContent;
    const input = document.getElementById('symbols-input').value;
    const symbols = input.split(',').map(s => s.trim()).filter(s => s);

    if (symbols.length === 0) {
        showNotification('⚠️ Please enter at least one symbol', 'warning');
        return;
    }

    btn.textContent = '⏳ Updating...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/config/symbols`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols })
        });

        const data = await res.json();
        if (data.status === 'success') {
            currentSymbols = symbols;
            showNotification('✅ Symbols updated: ' + symbols.join(', '), 'success');
            setTimeout(refreshData, 500);
        }
    } catch (e) {
        showNotification('❌ Failed to update symbols: ' + e.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function refreshData() {
    const btn = document.querySelector('.btn-refresh');
    const originalText = btn?.textContent;

    if (btn) {
        btn.textContent = '⏳ Refreshing...';
        btn.disabled = true;
    }

    const activeTab = document.querySelector('.tab-content.active').id;

    try {
        if (activeTab === 'dashboard-tab') await loadDashboard();
        if (activeTab === 'charts-tab') await loadCharts();
        if (activeTab === 'indicators-tab') await loadIndicators();
        if (activeTab === 'scheduler-tab') await loadScheduler();

        showNotification('✅ Data refreshed', 'success');
    } catch (e) {
        showNotification('❌ Refresh failed: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

function startAutoRefresh() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(() => {
        const activeTab = document.querySelector('.tab-content.active').id;
        if (activeTab === 'dashboard-tab') loadDashboard();
    }, 15000);
}

window.addEventListener('load', async () => {
    await loadDashboard();
    startAutoRefresh();
});
