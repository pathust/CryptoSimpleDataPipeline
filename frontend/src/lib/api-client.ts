// API Client for backend communication
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

console.log('API Base URL:', API_BASE);

// Dashboard APIs
export const getDashboardMetrics = async () => {
  const response = await fetch(`${API_BASE}/api/dashboard/metrics`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// Analytics APIs  
export const getCandlestickData = async (symbol: string, limit = 200) => {
  const url = `${API_BASE}/api/analytics/candlestick/${symbol}?limit=${limit}`;
  console.log('Fetching candlestick data from:', url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  console.log('Candlestick data received:', data.length, 'candles');
  return data;
};

export const getOrderbookSnapshot = async (symbol: string, limit = 20) => {
  const response = await fetch(`${API_BASE}/api/analytics/orderbook/${symbol}?limit=${limit}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const getStatistics = async (symbol: string) => {
  const response = await fetch(`${API_BASE}/api/stats/${symbol}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const getIndicators = async (symbol: string) => {
  const url = `${API_BASE}/api/indicators/${symbol}`;
  console.log('Fetching indicators from:', url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  console.log('Indicators received:', data);
  return data;
};

// Pipeline APIs
export const getIngestionLogs = async (limit = 50, offset = 0) => {
  const response = await fetch(`${API_BASE}/api/pipeline/ingestion-logs?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const getDeduplicationStats = async () => {
  const response = await fetch(`${API_BASE}/api/pipeline/deduplication-stats`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const getStorageHealth = async () => {
  const response = await fetch(`${API_BASE}/api/pipeline/storage-health`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// Scheduler APIs
export const getSchedulerJobs = async () => {
  const response = await fetch(`${API_BASE}/api/scheduler/jobs`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateSchedulerJob = async (jobId: string, updates: any) => {
  const response = await fetch(`${API_BASE}/api/scheduler/jobs/${jobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const runSchedulerJob = async (jobId: string) => {
  const response = await fetch(`${API_BASE}/api/scheduler/jobs/${jobId}/run`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// Settings APIs
export const getSymbols = async () => {
  const response = await fetch(`${API_BASE}/api/config/symbols`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateSymbols = async (symbols: string[]) => {
  const response = await fetch(`${API_BASE}/api/config/symbols`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};
