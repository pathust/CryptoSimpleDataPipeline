# CryptoFlow Dashboard

Modern cryptocurrency data pipeline and analytics platform built with React + TypeScript + Vite.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn-ui + Tailwind CSS  
- **State Management**: @tanstack/react-query
- **Routing**: react-router-dom
- **Charts**: recharts

## Development

### Prerequisites
- Node.js 18+
- Python 3.12+ (for backend)
- MySQL 8.0+

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your backend URL
```

### Running

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Connection

Frontend connects to Flask backend via API:
- Default: `http://localhost:5001`
- Configure in `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:5001
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── analytics/       # Chart components
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── layout/          # Layout components
│   │   ├── pipeline/        # Pipeline monitoring
│   │   ├── scheduler/       # Job scheduler
│   │   └── ui/              # shadcn-ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   └── api-client.ts    # Backend API client
│   ├── pages/               # Route pages
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
└── index.html               # HTML template
```

## Features

- 📊 Real-time cryptocurrency analytics
- 📈 Interactive candlestick charts
- 🔄 Data pipeline monitoring
- ⏰ Scheduler control
- ⚙️ Configuration management
- 🎨 Modern, responsive UI

## API Integration

All data is fetched from the Flask backend:

```typescript
import { getDashboardMetrics, getCandlestickData } from '@/lib/api-client';

// Fetch dashboard metrics
const metrics = await getDashboardMetrics();

// Fetch candlestick data  
const candles = await getCandlestickData('BTCUSDT', 100);
```

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory. Serve with any static file server.

## License

MIT
