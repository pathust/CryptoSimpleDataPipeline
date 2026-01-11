/**
 * Volume chart component using Recharts.
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartProps } from '@/types/charts';

interface VolumeDataPoint {
    time: string;
    volume: number;
    price: number;
    open: number;
}

// Hàm format thông minh cho trục Y
const formatVolume = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; // Ví dụ: 1.5M
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;    // Ví dụ: 20.5K
    return value.toFixed(0);                                      // Ví dụ: 150
};

export function VolumeChart({ data }: ChartProps) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground bg-[#161A25] rounded-lg">
                No volume data available
            </div>
        );
    }

    const chartData = data.map((item: VolumeDataPoint) => ({
        time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        volume: item.volume,
        price: item.price,
        open: item.open || item.price,
        isUp: (item.price >= (item.open || item.price))
    }));

    return (
        <div className="w-full bg-[#161A25] rounded-lg border border-[#2B2F36] p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#848E9C"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    
                    {/* SỬA LỖI TẠI ĐÂY */}
                    <YAxis
                        stroke="#848E9C"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatVolume} // Sử dụng hàm format mới
                        width={45} // Tăng độ rộng để số không bị cắt
                    />
                    
                    <Tooltip
                        cursor={{fill: '#2B2F36', opacity: 0.4}}
                        contentStyle={{
                            backgroundColor: '#1E2329',
                            border: '1px solid #474D57',
                            borderRadius: '4px',
                        }}
                        labelStyle={{ color: '#EAECEF' }}
                        formatter={(value: number, name: string) => {
                            if (name === 'volume') return [value.toLocaleString('en-US'), 'Vol']; // Hiển thị số đầy đủ có dấu phẩy
                            return [value.toFixed(2), 'Price'];
                        }}
                    />
                    
                    <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isUp ? '#0ECB81' : '#F6465D'} 
                                opacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}