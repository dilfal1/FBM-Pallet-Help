import React, { useState } from 'react';
import { TrendingUp, DollarSign, Target, Percent, ArrowLeft, BarChart3 } from 'lucide-react';
import { Item, Intake } from '../types';
import { suggestedSellThrough, estimatedRevenue, buildSensitivity } from '../lib/valuation';

interface AnalysisViewProps {
  items: Item[];
  intake: Intake;
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ items, intake, onBack }) => {
  const defaultST = React.useMemo(() => suggestedSellThrough(items) || 80, [items]);
  const [sellThroughPct, setSellThroughPct] = useState<number>(defaultST);

  const data = React.useMemo(
    () => buildSensitivity(items, intake, sellThroughPct),
    [items, intake, sellThroughPct]
  );

  const estRev = React.useMemo(
    () => Math.round(estimatedRevenue(items, sellThroughPct)),
    [items, sellThroughPct]
  );

  // Compute break-even bid (closest data point where profit crosses 0)
  const breakEven = React.useMemo(() => {
    let candidate = 0;
    let minAbs = Infinity;
    for (const d of data) {
      const abs = Math.abs(d.profit);
      if (abs < minAbs) { minAbs = abs; candidate = d.bid; }
    }
    return candidate;
  }, [data]);

  const handleSellThroughChange = (newSellThrough: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newSellThrough || 0)));
    setSellThroughPct(clamped);
  };

  const Kpi: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const ProfitChart: React.FC<{ data: Array<{ bid: number; profit: number; roi: number }> }> = ({ data }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Profit & ROI vs Final Bid</h3>
      </div>
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Chart visualization would go here</p>
        <p className="text-sm text-gray-400 ml-2">({data.length} data points)</p>
      </div>
    </div>
  );

  const maxProfit = Math.max(...data.map(d => d.profit));
  const maxROI = Math.max(...data.map(d => d.roi));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profit Analysis</h2>
            <p className="text-gray-600">Analyze profit potential across different bid amounts</p>
          </div>
        </div>
      </div>

      {/* Sell-Through Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Sell-Through Rate (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={sellThroughPct}
              onChange={(e) => handleSellThroughChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Sell-Through Percentage"
            />
            <span className="text-xs text-gray-500 mt-1">
              % of items you expect to actually sell (not price vs retail). Example: 80% ≈ 8 of 10 items sell. Suggested: {defaultST}%.
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Kpi label="Estimated Revenue (after Sell-Through)" value={`$${estRev.toLocaleString()}`} />
        <Kpi label="Break-Even Bid" value={`$${breakEven.toLocaleString()}`} />
        <Kpi label="Max Profit (in range)" value={`$${maxProfit.toLocaleString()}`} />
        <Kpi label="Max ROI (in range)" value={`${maxROI}%`} />
      </div>

      {/* Chart */}
      <ProfitChart data={data} />

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Items Breakdown</h3>
          <p className="text-sm text-gray-600">
            {items.length} items • Est. revenue includes {sellThroughPct}% sell-through rate
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Price Each
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Include
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => {
                const lineTotal = item.qty * item.estPriceEach * (sellThroughPct / 100);
                
                return (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {item.rawTitle}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.brand} {item.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${item.estPriceEach.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${lineTotal.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.include !== false}
                        onChange={() => {
                          // This would need to be handled by parent component
                          console.log('Toggle include for item:', item.id);
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;