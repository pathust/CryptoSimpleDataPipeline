# Quick Fix Guide - Analytics Integration

## Issue Found
The old `Analytics.tsx` page was incompatible with the new `useChartData` hook.

## Fix Applied
Replaced `Analytics.tsx` with the new refactored version:

```bash
# Backup old version
cp frontend/src/pages/Analytics.tsx frontend/src/pages/Analytics.old.tsx

# Use new version
cp frontend/src/pages/AnalyticsNew.tsx frontend/src/pages/Analytics.tsx
```

## Start Backend

```bash
# Kill any existing backend
lsof -ti:5001 | xargs kill -9

# Start backend in background
conda activate crypto_data_pipeline_env
python run_backend.py
```

## Start Frontend

Frontend should already be running on port 8080. Just refresh the page.

If not running:
```bash
cd frontend
npm run dev
```

## Access
Visit: http://localhost:8080/analytics/BTC_USDT

## What You Should See

1. **Chart Selector** on the right sidebar
2. **Primary Charts**: Price Chart (candlestick) enabled by default
3. **Indicator Charts**: Toggle Volume, RSI, MACD, Bollinger Bands
4. Charts will load data automatically
5. Refresh button on each chart
6. Auto-refresh every 15 seconds

## If You See Errors

**"Cannot read properties of undefined"**:
- Frontend is cached, do hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**"404 Not Found"**:
- Backend not running, start it as shown above

**"Port already in use"**:
- Kill existing process: `lsof -ti:5001 | xargs kill -9`

## Files Changed

- ✅ `frontend/src/pages/Analytics.tsx` - Replaced with new version
- ✅ `frontend/src/pages/Analytics.old.tsx` - Backup of old version
- ✅ Backend port cleared and restarted
