# Quick Reference - Adding Charts

## Backend (5 min)

1. Create `src/modules/analytics/data_providers/your_chart.py`:
```python
from .base import DataProvider

class YourChartProvider(DataProvider):
    def get_data(self, symbol, **params):
        # Fetch & calculate data
        return [{'time': ..., 'value': ...}]
    
    def get_metadata(self):
        return {'name': '...', 'parameters': [...]}
```

2. Register in `registry.py`:
```python
from .your_chart import YourChartProvider
DataProviderRegistry.register('your_chart', YourChartProvider)
```

3. Test:
```bash
curl "http://localhost:5001/api/analytics/data/your_chart/BTCUSDT"
```

## Frontend (10 min)

1. Create `frontend/src/components/charts/YourChart.tsx`:
```tsx
import { LineChart, Line, ... } from 'recharts';
import { ChartProps } from '@/types/charts';

export function YourChart({ data }: ChartProps) {
  return <LineChart data={data}>...</LineChart>;
}
```

2. Register in `config/charts.tsx`:
```tsx
import { YourChart } from "@/components/charts/YourChart";

{
  id: 'your_chart',
  title: 'Your Chart',
  component: YourChart,
  dataProvider: 'your_chart',
  defaultParams: { limit: 200 },
}
```

3. **Done!** Refresh browser.

---

See [HOW_TO_ADD_CHART.md](./HOW_TO_ADD_CHART.md) for complete guide.
