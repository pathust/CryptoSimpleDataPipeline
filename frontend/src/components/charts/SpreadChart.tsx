import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartProps } from '@/types/charts';

export function SpreadChart({ data }: ChartProps) {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-[200px] bg-[#161A25] text-gray-500 rounded border border-[#2B2F36]">No Spread Data</div>;
    }

    // Format time (chỉ lấy giờ phút giây)
    const chartData = data.map((d: any) => ({
        ...d,
        timeStr: new Date(d.time).toLocaleTimeString('en-US', { hour12: false })
    }));

    return (
        <div className="w-full bg-[#161A25] rounded-lg border border-[#2B2F36] p-3">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-200">Bid-Ask Spread</h3>
                <span className="text-xs text-gray-400">Lower is better</span>
            </div>
            
            {/* Set height cố định */}
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#F0B90B" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" vertical={false} />
                    <XAxis 
                        dataKey="timeStr" 
                        stroke="#848E9C" 
                        fontSize={10} 
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis 
                        stroke="#848E9C" 
                        fontSize={10}
                        tickFormatter={(val) => val.toFixed(2)}
                        width={30}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E2329', borderColor: '#474D57', fontSize: '12px' }}
                        itemStyle={{ color: '#F0B90B' }}
                        labelStyle={{ color: '#848E9C', marginBottom: '4px' }}
                        formatter={(val: number) => [val.toFixed(4), 'Spread ($)']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="spread_value" 
                        stroke="#F0B90B" 
                        fill="url(#spreadGradient)" 
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}