import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types/charts';

export function DailyTrendChart({ data }: ChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-[300px] bg-[#161A25] text-gray-500 rounded border border-[#2B2F36]">No Daily Data</div>;
    }

    return (
        <div className="w-full bg-[#161A25] rounded-lg border border-[#2B2F36] p-3">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-200">Daily Trend (30 Days)</h3>
                <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[#3B82F6]"><div className="w-2 h-2 rounded-full bg-[#3B82F6]"/> Price</span>
                    <span className="flex items-center gap-1 text-[#848E9C]"><div className="w-2 h-2 rounded-full bg-[#848E9C]"/> Volume</span>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        stroke="#848E9C" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                        tickFormatter={(val) => val.split('-').slice(1).join('/')} // Chỉ hiện MM/DD
                    />
                    {/* Trục Y trái: Giá */}
                    <YAxis 
                        yAxisId="left"
                        stroke="#848E9C" 
                        fontSize={10}
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(0) + 'K' : val}
                        width={35}
                    />
                    {/* Trục Y phải: Volume */}
                    <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#848E9C" 
                        fontSize={10}
                        tickFormatter={(val) => (val/1000000).toFixed(1) + 'M'}
                        width={35}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E2329', borderColor: '#474D57', fontSize: '12px' }}
                        labelStyle={{ color: '#EAECEF' }}
                    />
                    
                    {/* Volume Bar */}
                    <Bar 
                        yAxisId="right"
                        dataKey="volume" 
                        fill="#848E9C" 
                        opacity={0.3} 
                        barSize={20}
                        radius={[2, 2, 0, 0]}
                    />
                    
                    {/* Price Line */}
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={true}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}