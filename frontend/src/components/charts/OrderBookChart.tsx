/**
 * Order Book Depth Chart
 * Fix: Hard-coded height in ResponsiveContainer to prevent collapse.
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types/charts';

export function OrderBookChart({ data }: ChartProps) {
    // 1. Xử lý khi không có dữ liệu
    if (!data || (!data.bids && !data.asks)) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-[#161A25] text-muted-foreground border border-[#2B2F36] rounded-lg">
                No Order Book data available
            </div>
        );
    }

    // 2. Transform Data: Gộp Bids và Asks
    const chartData = [
        ...data.bids.sort((a: any, b: any) => a.price - b.price).map((d: any) => ({ ...d, type: 'bid' })),
        ...data.asks.sort((a: any, b: any) => a.price - b.price).map((d: any) => ({ ...d, type: 'ask' }))
    ];

    return (
        <div className="w-full bg-[#161A25] rounded-lg border border-[#2B2F36] p-3">
            {/* Header: Tiêu đề và Legend */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-200">Order Book Depth</h3>
                <div className="flex gap-3 text-xs font-medium">
                     <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#0ECB81]" />
                        <span className="text-gray-400">Buy Walls</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#F6465D]" />
                        <span className="text-gray-400">Sell Walls</span>
                     </div>
                </div>
            </div>

            {/* FIX QUAN TRỌNG: 
                - Đặt height={250} trực tiếp (số, không phải string '100%').
                - Điều này ép buộc chart phải cao đúng 250px.
            */}
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 40 }}>
                    <defs>
                        <linearGradient id="fillBid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ECB81" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0ECB81" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="fillAsk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F6465D" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#F6465D" stopOpacity={0.05}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
                    
                    <XAxis 
                        dataKey="price" 
                        stroke="#848E9C" 
                        fontSize={12} 
                        tickFormatter={(val) => val.toFixed(2)}
                        minTickGap={60} // Tăng giãn cách để dễ đọc hơn
                        angle={-45} // Nghiêng nhãn để không bị chồng
                        textAnchor="end"
                        height={60} // Tăng chiều cao cho XAxis
                    />
                    
                    <YAxis 
                        orientation="right" 
                        stroke="#848E9C" 
                        fontSize={12}
                        width={60}
                        tickFormatter={(val) => {
                            if (val >= 1000000) return (val/1000000).toFixed(1) + 'M';
                            if (val >= 1000) return (val/1000).toFixed(0) + 'K';
                            return val.toFixed(0);
                        }}
                    />
                    
                    <Tooltip 
                        cursor={{ stroke: '#848E9C', strokeWidth: 1, strokeDasharray: '3 3' }}
                        contentStyle={{ 
                            backgroundColor: '#1E2329', 
                            borderColor: '#474D57', 
                            fontSize: '13px',
                            color: '#EAECEF',
                            padding: '8px 12px'
                        }}
                        itemStyle={{ padding: '2px 0' }}
                        formatter={(val: number) => [val.toFixed(4), 'Total Qty']}
                        labelFormatter={(label) => `Price: ${parseFloat(label).toFixed(2)}`}
                    />

                    {/* Vùng Bids (Mua) */}
                    <Area 
                        type="step" 
                        dataKey="total" 
                        stroke="#0ECB81" 
                        fill="url(#fillBid)" 
                        strokeWidth={2.5}
                        data={chartData.filter(d => d.type === 'bid')}
                        isAnimationActive={false} // Tắt animation để chart mượt hơn khi refresh
                    />

                    {/* Vùng Asks (Bán) */}
                    <Area 
                        type="step" 
                        dataKey="total" 
                        stroke="#F6465D" 
                        fill="url(#fillAsk)" 
                        strokeWidth={2.5}
                        data={chartData.filter(d => d.type === 'ask')}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}