import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMemo } from 'react';

interface OrderBookData {
    bids?: Array<{ price: number; quantity: number; total: number }>;
    asks?: Array<{ price: number; quantity: number; total: number }>;
}

interface ChartProps {
    data: OrderBookData;
}

export function OrderBookChart({ data }: ChartProps) {
    if (!data || (!data.bids && !data.asks)) {
        return (
            <div className="flex items-center justify-center h-[450px] bg-[#0B0E11] text-gray-500 border border-[#1E2329] rounded-lg">
                No Order Book data available
            </div>
        );
    }

    // Tính toán dữ liệu và metrics
    const { chartData, spread, spreadPercent, midPrice, maxBid, minAsk, bidVolume, askVolume } = useMemo(() => {
        const bids = data.bids || [];
        const asks = data.asks || [];
        
        // Tính các metrics
        const maxBidPrice = bids.length > 0 ? Math.max(...bids.map((d: any) => d.price)) : 0;
        const minAskPrice = asks.length > 0 ? Math.min(...asks.map((d: any) => d.price)) : 0;
        
        const spreadVal = (minAskPrice > 0 && maxBidPrice > 0) ? (minAskPrice - maxBidPrice) : 0;
        const spreadPct = (minAskPrice > 0) ? (spreadVal / minAskPrice) * 100 : 0;
        const mid = (maxBidPrice + minAskPrice) / 2;

        // Tính volume
        const bidVol = bids.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0);
        const askVol = asks.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0);

        // Gộp data và sort
        const merged = [
            ...bids.sort((a: any, b: any) => a.price - b.price).map((d: any) => ({ ...d, type: 'bid' })),
            ...asks.sort((a: any, b: any) => a.price - b.price).map((d: any) => ({ ...d, type: 'ask' }))
        ];

        return { 
            chartData: merged, 
            spread: spreadVal, 
            spreadPercent: spreadPct,
            midPrice: mid,
            maxBid: maxBidPrice,
            minAsk: minAskPrice,
            bidVolume: bidVol,
            askVolume: askVol
        };
    }, [data]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isBid = data.type === 'bid';
            
            return (
                <div className="bg-[#0B0E11] border border-[#2B3139] rounded-md p-3 shadow-xl">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${isBid ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}></div>
                            <span className={`text-xs font-semibold ${isBid ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                {isBid ? 'BID' : 'ASK'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-gray-400">Price:</span>
                            <span className="text-xs font-mono font-medium text-white">
                                {data.price.toFixed(2)} USDT
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-gray-400">Quantity:</span>
                            <span className="text-xs font-mono text-gray-300">
                                {data.quantity.toFixed(4)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-6 pt-1 border-t border-[#1E2329]">
                            <span className="text-xs text-gray-400">Cumulative:</span>
                            <span className="text-xs font-mono font-medium text-[#F0B90B]">
                                {data.total.toFixed(4)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Format volume
    const formatVolume = (val: number) => {
        if (val >= 1000000) return (val/1000000).toFixed(2) + 'M';
        if (val >= 1000) return (val/1000).toFixed(2) + 'K';
        return val.toFixed(2);
    };

    return (
        <div className="w-full bg-[#0B0E11] rounded-lg border border-[#1E2329] p-4">
            {/* Header - Aligned horizontal */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-semibold text-gray-200">Order Book Depth</h3>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#0ECB81]"></div>
                            <span className="text-gray-400">Bids</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#F6465D]"></div>
                            <span className="text-gray-400">Asks</span>
                        </div>
                    </div>
                </div>
                
                {/* Market Stats - Compact */}
                <div className="flex items-center gap-6 text-xs">
                    {/* Mid Price */}
                    {midPrice > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Mid:</span>
                            <span className="font-mono font-medium text-[#F0B90B]">
                                {midPrice.toFixed(2)}
                            </span>
                        </div>
                    )}
                    
                    {/* Spread Info */}
                    {spread > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Spread:</span>
                            <span className="font-mono text-gray-300">
                                {spread.toFixed(2)}
                            </span>
                            <span className={`font-mono ${spreadPercent < 0.1 ? 'text-[#0ECB81]' : 'text-[#F0B90B]'}`}>
                                ({spreadPercent.toFixed(3)}%)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Volume Stats - Compact inline */}
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-[#161A25] rounded border border-[#1E2329]">
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Bid Volume:</span>
                        <span className="font-mono font-medium text-[#0ECB81]">
                            {formatVolume(bidVolume)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Ask Volume:</span>
                        <span className="font-mono font-medium text-[#F6465D]">
                            {formatVolume(askVolume)}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Best Bid: <span className="text-[#0ECB81] font-mono">{maxBid.toFixed(2)}</span></span>
                    <span>Best Ask: <span className="text-[#F6465D] font-mono">{minAsk.toFixed(2)}</span></span>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                        {/* Bid gradient - Green */}
                        <linearGradient id="fillBid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ECB81" stopOpacity={0.5}/>
                            <stop offset="50%" stopColor="#0ECB81" stopOpacity={0.2}/>
                            <stop offset="100%" stopColor="#0ECB81" stopOpacity={0}/>
                        </linearGradient>
                        
                        {/* Ask gradient - Red */}
                        <linearGradient id="fillAsk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F6465D" stopOpacity={0.5}/>
                            <stop offset="50%" stopColor="#F6465D" stopOpacity={0.2}/>
                            <stop offset="100%" stopColor="#F6465D" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#1E2329" 
                        vertical={false}
                        opacity={0.5}
                    />
                    
                    <XAxis 
                        dataKey="price" 
                        type="number" 
                        domain={['dataMin', 'dataMax']}
                        stroke="#474D57" 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={{ stroke: '#1E2329' }}
                        tick={{ fill: '#848E9C' }}
                        tickFormatter={(val) => val.toFixed(2)}
                        minTickGap={50}
                        allowDataOverflow={true}
                    />
                    
                    <YAxis 
                        orientation="right" 
                        stroke="#474D57" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1E2329' }}
                        tick={{ fill: '#848E9C' }}
                        width={60}
                        tickFormatter={(val) => {
                            if (val >= 1000000) return (val/1000000).toFixed(1) + 'M';
                            if (val >= 1000) return (val/1000).toFixed(1) + 'K';
                            return val.toFixed(0);
                        }}
                    />
                    
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#474D57', strokeWidth: 1 }} />

                    {/* Mid price reference line */}
                    {midPrice > 0 && (
                        <ReferenceLine 
                            x={midPrice} 
                            stroke="#F0B90B" 
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            label={{ 
                                value: `${midPrice.toFixed(2)}`, 
                                position: 'top',
                                fill: '#F0B90B',
                                fontSize: 10,
                                offset: 5
                            }}
                        />
                    )}

                    {/* Bids Area - Green */}
                    <Area 
                        type="stepAfter" 
                        dataKey="total" 
                        stroke="#0ECB81" 
                        fill="url(#fillBid)" 
                        strokeWidth={2.5}
                        data={chartData.filter(d => d.type === 'bid')}
                        isAnimationActive={false}
                    />

                    {/* Asks Area - Red */}
                    <Area 
                        type="stepBefore" 
                        dataKey="total" 
                        stroke="#F6465D" 
                        fill="url(#fillAsk)" 
                        strokeWidth={2.5}
                        data={chartData.filter(d => d.type === 'ask')}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Footer - Simple caption */}
            <div className="mt-3 text-center text-xs text-gray-500">
                Cumulative depth visualization
            </div>
        </div>
    );
}