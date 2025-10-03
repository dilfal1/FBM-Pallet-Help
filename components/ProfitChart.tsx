import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Item, Intake } from '../types';

function revenue(items: Item[], sellThroughPct: number) {
  const st = sellThroughPct / 100;
  return items.reduce((sum, item) => {
    const estPrice = item.fbm_est_high || item.draft_price || 0;
    return sum + item.qty * estPrice * st;
  }, 0);
}

function buildData(items: Item[], intake: Intake) {
  const estRev = revenue(items, intake.sellThroughPct);
  const maxBid = Math.max(2000, Math.round(estRev * 0.9));
  const step = Math.max(25, Math.round(maxBid / 50));
  const data: Array<{ bid: number; profit: number; roi: number }> = [];
  let breakEvenBid = 0;
  
  for (let bid = 0; bid <= maxBid; bid += step) {
    const premium = (intake.buyerPremiumPct / 100) * bid;
    const totalCost = bid + intake.shippingCost + premium;
    const profit = estRev - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    if (profit >= 0 && breakEvenBid === 0) {
      breakEvenBid = bid;
    }
    
    data.push({ 
      bid, 
      profit: Math.round(profit), 
      roi: Number(roi.toFixed(1)) 
    });
  }
  
  return { data, estRev, breakEvenBid };
}

interface ProfitChartProps {
  items: Item[];
  intake: Intake;
}

const ProfitChart: React.FC<ProfitChartProps> = ({ items, intake }) => {
  const { data, breakEvenBid } = buildData(items, intake);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${value}%`;

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profit & ROI vs Final Bid</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="bid" 
            tickFormatter={formatCurrency}
            className="text-sm"
          />
          <YAxis 
            yAxisId="left" 
            tickFormatter={formatCurrency}
            className="text-sm"
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tickFormatter={formatPercent}
            className="text-sm"
          />
          <Tooltip 
            formatter={(value: any, name: string) => [
              name === "roi" ? formatPercent(value) : formatCurrency(value),
              name === "roi" ? "ROI" : "Profit"
            ]}
            labelFormatter={(value) => `Bid: ${formatCurrency(value)}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="profit" 
            stroke="#dc2626" 
            strokeWidth={2}
            dot={false}
            name="profit"
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="roi" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={false}
            name="roi"
          />
          {breakEvenBid > 0 && (
            <ReferenceLine 
              x={breakEvenBid} 
              stroke="#16a34a" 
              strokeDasharray="5 5"
              label={{ value: "Break-Even", position: "top" }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-2">
        Profit includes shipping and buyer premium. ROI = Profit / (Bid + Shipping + Premium).
      </p>
    </div>
  );
};

export default ProfitChart;