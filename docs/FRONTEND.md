# Frontend Architecture

Complete documentation for the React/TypeScript frontend of the CryptoSimpleDataPipeline.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Pages](#pages)
5. [Components](#components)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Routing](#routing)
9. [Styling](#styling)
10. [Build & Development](#build--development)

---

## Overview

The frontend is a modern **Single Page Application (SPA)** built with React 18, TypeScript, and Vite. It provides a professional, responsive interface for cryptocurrency data visualization and pipeline management.

**Key Features**:
- 📊 Real-time candlestick charts with Lightweight Charts
- 📈 Interactive orderbook depth visualization
- 🎛️ Pipeline monitoring and control
- ⏰ Scheduler management
- 🎨 Dark theme with Tailwind CSS
- 📱 Responsive design

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.6.2 | Type safety |
| **Vite** | 6.0.5 | Build tool & dev server |
| **React Router** | 7.1.1 | Client-side routing |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS |
| **Radix UI** | Latest | Headless UI components |
| **Lightweight Charts** | 4.2.2 | Professional candlestick charts |
| **Recharts** | 2.15.0 | Additional charts (orderbook) |
| **React Hook Form** | 7.54.2 | Form management |
| **Lucide React** | Latest | Icon library |

---

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                # App entry point
│   ├── App.tsx                 # Root component with routing
│   ├── index.css               # Global styles (Tailwind)
│   ├── pages/                  # Page components
│   │   ├── Dashboard.tsx       # Market overview
│   │   ├── Analytics.tsx       # Charts & orderbook
│   │   ├── Pipeline.tsx        # Ingestion logs
│   │   ├── Scheduler.tsx       # Job management
│   │   └── Settings.tsx        # Configuration
│   ├── components/             # Reusable components
│   │   ├── charts/             # Chart components
│   │   │   ├── ProfessionalCandlestickChart.tsx
│   │   │   └── OrderbookDepthChart.tsx
│   │   ├── scheduler/          # Scheduler components
│   │   │   └── JobCard.tsx
│   │   └── ui/                 # Radix UI components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utilities
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

---

## Pages

### 1. Dashboard (`pages/Dashboard.tsx`)

**Purpose**: Market overview with real-time 24h statistics

**Features**:
- Statistics cards for all tracked symbols
- Price, 24h change %, volume, high/low
- Auto-refresh every 15 seconds
- Color-coded price changes (green/red)

**API Calls**:
- `GET /api/dashboard/metrics`

**State**:
```typescript
const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
const [loading, setLoading] = useState(true);
```

**Key Components**:
- Symbol cards with gradient backgrounds
- Loading skeleton
- Error states

---

### 2. Analytics (`pages/Analytics.tsx`)

**Purpose**: Advanced market analysis with extensible chart system

**NEW - Chart Registry System**: Charts are now registered in a central configuration, making it easy to add new visualizations.

**Features**:
- Dynamic chart rendering from registry
- Chart selector with toggle functionality
- Professional candlestick chart (Lightweight Charts)
- Technical indicator charts (RSI, MACD, Bollinger Bands)
- Volume chart
- Real-time data updates (15s auto-refresh)
- Symbol selection (BTC_USDT, ETH_USDT, BNB_USDT)

**API Calls**:
- `GET /api/analytics/data/candlestick/<symbol>?limit=200`
- `GET /api/analytics/data/volume/<symbol>?limit=200`
- `GET /api/analytics/data/rsi/<symbol>?period=14&limit=200`
- `GET /api/analytics/data/macd/<symbol>?fast_period=12&slow_period=26&signal_period=9`
- `GET /api/analytics/data/bollinger/<symbol>?period=20&std_dev=2`

**State**:
```typescript
const [enabledCharts, setEnabledCharts] = useState<Set<string>>(
  new Set(CHART_REGISTRY.filter(c => c.defaultEnabled).map(c => c.id))
);
```

**Architecture**:

1. **Chart Registry** (`config/charts.tsx`):
```typescript
export const CHART_REGISTRY: ChartConfig[] = [
  {
    id: 'candlestick',
    title: 'Price Chart',
    description: 'OHLCV candlestick chart with volume',
    category: 'primary',
    icon: LineChart,
    component: CandlestickChartWrapper,
    defaultEnabled: true,
    dataProvider: 'candlestick',
    refreshInterval: 15000,
    gridSpan: { cols: 3, rows: 2 },
    defaultParams: { limit: 200 },
  },
  // ... more charts
];
```

2. **Chart Container** (`components/charts/ChartContainer.tsx`):
   - Handles data fetching via `useChartData` hook
   - Manages loading/error states
   - Provides refresh functionality
   - Auto-refresh based on `refreshInterval`

3. **Individual Chart Components**:
   - `CandlestickChartWrapper` - Lightweight Charts integration
   - `VolumeChart` - Bar chart (Recharts)
   - `RSIChart` - Line chart with overbought/oversold zones (Recharts)
   - `MACDChart` - MACD line + signal line + histogram (Recharts)
   - `BollingerChart` - Upper/middle/lower bands + price (Recharts)

**Adding New Charts**:

To add a new chart (e.g., EMA):

1. Create component: `components/charts/EMAChart.tsx`
2. Add to registry in `config/charts.tsx`:
```typescript
{
  id: 'ema',
  title: 'EMA (20)',
  component: EMAChart,
  dataProvider: 'ema',
  defaultParams: { period: 20 },
}
```
3. Done! Chart auto-appears in Analytics page

Time required: ~10 minutes

---

### 3. Pipeline (`pages/Pipeline.tsx`)

**Purpose**: Monitor data ingestion and storage health

**Features**:
- Ingestion logs table with pagination
- Deduplication statistics
- Storage health metrics (data lake + warehouse)
- Manual pipeline trigger button

**API Calls**:
- `GET /api/pipeline/ingestion-logs`
- `GET /api/pipeline/deduplication-stats`
- `GET /api/pipeline/storage-health`
- `POST /api/trigger`

**State**:
```typescript
const [logs, setLogs] = useState([]);
const [dedupStats, setDedupStats] = useState(null);
const [storageHealth, setStorageHealth] = useState(null);
const [page, setPage] = useState(1);
```

---

### 4. Scheduler (`pages/Scheduler.tsx`)

**Purpose**: Manage scheduled jobs

**Features**:
- View all jobs (pipeline, maintenance)
- Enable/disable jobs
- Adjust job intervals
- Manual job triggers
- Last run timestamps

**API Calls**:
- `GET /api/scheduler/jobs`
- `PUT /api/scheduler/jobs/<job_id>`
- `POST /api/scheduler/jobs/<job_id>/run`

**State**:
```typescript
const [jobs, setJobs] = useState<SchedulerJob[]>([]);
const [editingJob, setEditingJob] = useState<string | null>(null);
```

**Key Components**:
- `JobCard` - Individual job configuration card

---

### 5. Settings (`pages/Settings.tsx`)

**Purpose**: System configuration

**Features**:
- Add/remove tracked symbols
- View system metadata
- Environment information
- API endpoint configuration

**API Calls**:
- `GET /api/config/symbols`
- `POST /api/config/symbols`

**State**:
```typescript
const [symbols, setSymbols] = useState<string[]>([]);
const [newSymbol, setNewSymbol] = useState('');
const [saving, setSaving] = useState(false);
```

---

## Components

### Chart Components

#### `ProfessionalCandlestickChart.tsx`

**Purpose**: Professional candlestick chart using Lightweight Charts

**Technology**: TradingView's Lightweight Charts library

**Features**:
- Interactive zooming and panning
- Crosshair with data tooltip
- Time scale formatting
- Price scale formatting
- Responsive sizing
- Volume bars

**Props**:
```typescript
interface ProfessionalCandlestickChartProps {
  data: CandlestickData[];
  symbol: string;
}

interface CandlestickData {
  time: string;  // ISO 8601 format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

**Usage**:
```tsx
<ProfessionalCandlestickChart 
  data={candlestickData} 
  symbol={selectedSymbol} 
/>
```

---

#### `OrderbookDepthChart.tsx`

**Purpose**: Visualize orderbook depth with bid/ask areas

**Technology**: Recharts (Area Chart)

**Features**:
- Bid area (green)
- Ask area (red)
- Cumulative quantity display
- Tooltip with price & quantity
- Responsive sizing

**Props**:
```typescript
interface OrderbookDepthChartProps {
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
}
```

**Usage**:
```tsx
<OrderbookDepthChart 
  bids={orderbookData.bids} 
  asks={orderbookData.asks} 
/>
```

---

### Scheduler Components

#### `JobCard.tsx`

**Purpose**: Display and edit individual job configuration

**Features**:
- Job name and status
- Last run timestamp
- Interval configuration
- Enable/disable toggle
- Manual trigger button
- Edit mode

**Props**:
```typescript
interface JobCardProps {
  job: SchedulerJob;
  onUpdate: (jobId: string, updates: Partial<SchedulerJob>) => void;
  onRun: (jobId: string) => void;
}

interface SchedulerJob {
  id: string;
  name: string;
  interval: string;
  enabled: boolean;
  last_run: string;
  next_run?: string;
}
```

---

### UI Components

Located in `components/ui/`, these are pre-built Radix UI components:

- **Button** - Primary/secondary/outline variants
- **Card** - Container with header/content/footer
- **Dialog** - Modal dialogs
- **DropdownMenu** - Dropdown menus
- **Input** - Form inputs
- **Label** - Form labels
- **Select** - Select dropdowns
- **Table** - Data tables
- **Tabs** - Tab navigation
- **Toast** - Toast notifications

**Example Usage**:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
    <Button variant="primary">Action</Button>
  </CardContent>
</Card>
```

---

## State Management

The application uses **React Hooks** for state management. No external state management library (Redux, Zustand) is used.

### useState

For local component state:

```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### useEffect

For side effects (API calls, timers):

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/data`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
  
  // Auto-refresh every 15 seconds
  const interval = setInterval(fetchData, 15000);
  return () => clearInterval(interval);
}, []);
```

### Custom Hooks (Future Enhancement)

Could create custom hooks for:
- `useApi()` - Reusable API fetching
- `useWebSocket()` - Real-time data updates
- `usePolling()` - Auto-refresh logic

---

## API Integration

### API Base URL

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
```

### Fetch Pattern

Standard pattern for API calls:

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE}/api/endpoint`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    setData(data);
    setError(null);
  } catch (error) {
    setError(error.message);
    console.error('API Error:', error);
  } finally {
    setLoading(false);
  }
};
```

### POST Requests

```typescript
const updateConfig = async (newData) => {
  try {
    const response = await fetch(`${API_BASE}/api/config/symbols`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newData),
    });
    
    const result = await response.json();
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

---

## Routing

Using **React Router v7** for client-side routing.

### Route Configuration (`App.tsx`)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

### Navigation

```tsx
import { Link, useNavigate } from 'react-router-dom';

// Using Link
<Link to="/dashboard">Dashboard</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate('/analytics');
```

---

## Styling

### Tailwind CSS

The application uses **Tailwind CSS** for styling with a custom dark theme configuration.

**Configuration** (`tailwind.config.ts`):
```typescript
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... more colors
      },
    },
  },
  plugins: [],
};
```

### CSS Variables

Defined in `index.css`:

```css
:root {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... more variables */
}
```

### Common Utility Classes

- Layout: `flex`, `grid`, `container`, `mx-auto`
- Spacing: `p-4`, `m-2`, `gap-4`, `space-y-2`
- Typography: `text-lg`, `font-bold`, `text-muted-foreground`
- Colors: `bg-background`, `text-foreground`, `border-border`
- Responsive: `sm:`, `md:`, `lg:`, `xl:`

**Example**:
```tsx
<div className="flex flex-col gap-4 p-6 bg-card rounded-lg border">
  <h2 className="text-2xl font-bold">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

---

## Build & Development

### Development Server

```bash
npm run dev
# or
bun vite
```

Runs on `http://localhost:8000` (configured in `vite.config.ts`)

**Features**:
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript type checking
- Tailwind CSS JIT mode

### Production Build

```bash
npm run build
# or
bun vite build
```

**Output**: `dist/` directory

**Optimizations**:
- Code splitting
- Tree shaking
- Minification
- Asset optimization

### Preview Production Build

```bash
npm run preview
# or
bun vite preview
```

---

## TypeScript Configuration

**`tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Benefits**:
- Type safety for props and state
- IntelliSense in IDE
- Catch errors at compile time
- Better refactoring support

---

## Performance Optimizations

1. **Code Splitting**: React Router automatically splits by route
2. **Lazy Loading**: Use `React.lazy()` for heavy components
3. **Memoization**: Use `React.memo()` and `useMemo()` for expensive renders
4. **Debouncing**: Debounce API calls on user input
5. **Virtualization**: Consider `react-window` for large lists

**Example - Lazy Loading**:
```tsx
const Analytics = React.lazy(() => import('./pages/Analytics'));

<Suspense fallback={<Loading />}>
  <Analytics />
</Suspense>
```

---

## Related Documentation

- [API Reference](API_REFERENCE.md) - Backend API endpoints
- [System Architecture](ARCHITECTURE.md) - Overall system design
- [Backend Architecture](BACKEND.md) - Backend implementation details
