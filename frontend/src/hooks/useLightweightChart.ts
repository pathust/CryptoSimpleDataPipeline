import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';

interface ChartOptions {
  width?: number;
  height?: number;
}

export function useLightweightChart(options: ChartOptions = {}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) {
      console.log('Container ref not ready');
      return;
    }

    console.log('Creating chart with container:', container.clientWidth, 'x', container.clientHeight);

    try {
      const chart = createChart(container, {
        width: container.clientWidth,
        height: options.height || 600,
        layout: {
          background: { type: ColorType.Solid, color: '#0a0e27' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: '#1e293b', visible: true },
          horzLines: { color: '#1e293b', visible: true },
        },
        crosshair: {
          mode: 1,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#1e293b',
        },
        rightPriceScale: {
          borderColor: '#1e293b',
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },
      });

      chartRef.current = chart;
      setIsReady(true);
      console.log('Chart created successfully!', chart);

      // Handle resize
      const handleResize = () => {
        if (container && chart) {
          chart.applyOptions({ width: container.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        console.log('Cleaning up chart');
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = null;
        setIsReady(false);
      };
    } catch (error) {
      console.error('Failed to create chart:', error);
    }
  }, [options.height]);

  return {
    chartContainerRef,
    chart: chartRef.current,
    isReady,
  };
}
