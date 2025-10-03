import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

type Props = {
  estimatedRevenue: number;
  shippingCost: number;
  itemCount?: number;
};

type Scenario = 'Conservative' | 'Likely' | 'Aggressive';

const AnalysisBidCalculator: React.FC<Props> = ({ 
  estimatedRevenue, 
  shippingCost, 
  itemCount = 0 
}) => {
  // State for all inputs
  const [targetGrossMargin, setTargetGrossMargin] = useState(30); // 30%
  const [scenario, setScenario] = useState<Scenario>('Likely');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced costs state
  const [marketplaceFeePct, setMarketplaceFeePct] = useState(12);
  const [paymentFeePct, setPaymentFeePct] = useState(3);
  const [flatFees, setFlatFees] = useState(0);
  const [refurbCostTotal, setRefurbCostTotal] = useState(0);
  const [refurbCostPerItem, setRefurbCostPerItem] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  // Helper functions
  const currency = (value: number): string => {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  };

  // Scenario factors
  const scenarioFactors: Record<Scenario, number> = {
    Conservative: 0.85,
    Likely: 1.0,
    Aggressive: 1.10,
  };

  // Calculations
  const calculations = useMemo(() => {
    const results: Record<Scenario, { revenue: number; maxBid: number }> = {} as any;
    
    Object.entries(scenarioFactors).forEach(([scenarioName, factor]) => {
      const R = estimatedRevenue * factor;
      const g = targetGrossMargin / 100; // Convert to decimal
      
      // Clamp percentage fees
      const totalFeePct = clamp((marketplaceFeePct + paymentFeePct) / 100, 0, 0.9);
      const percentFees = R * totalFeePct;
      
      // Calculate refurb total
      const refurbTotal = refurbCostTotal > 0 ? refurbCostTotal : refurbCostPerItem * itemCount;
      
      // Non-bid costs
      const nonBid = shippingCost + flatFees + refurbTotal + otherCost + percentFees;
      
      // Max bid calculation
      const maxBid = R * (1 - g) - nonBid;
      
      results[scenarioName as Scenario] = {
        revenue: R,
        maxBid: maxBid
      };
    });
    
    return results;
  }, [
    estimatedRevenue,
    targetGrossMargin,
    marketplaceFeePct,
    paymentFeePct,
    flatFees,
    refurbCostTotal,
    refurbCostPerItem,
    itemCount,
    otherCost,
    shippingCost
  ]);

  const currentScenario = calculations[scenario];
  const totalNonBidCosts = useMemo(() => {
    const R = estimatedRevenue * scenarioFactors[scenario];
    const totalFeePct = clamp((marketplaceFeePct + paymentFeePct) / 100, 0, 0.9);
    const percentFees = R * totalFeePct;
    const refurbTotal = refurbCostTotal > 0 ? refurbCostTotal : refurbCostPerItem * itemCount;
    return shippingCost + flatFees + refurbTotal + otherCost + percentFees;
  }, [scenario, estimatedRevenue, marketplaceFeePct, paymentFeePct, flatFees, refurbCostTotal, refurbCostPerItem, itemCount, otherCost, shippingCost]);

  const handleTargetMarginChange = (value: number) => {
    const clamped = clamp(value, 0, 90);
    setTargetGrossMargin(clamped);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis — Maximum Bid Calculator</h2>
        <p className="text-gray-600">Calculate your maximum bid based on target margins and costs</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Target Gross Margin */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Target Gross Margin
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0"
              max="90"
              value={targetGrossMargin}
              onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="90"
                value={targetGrossMargin}
                onChange={(e) => handleTargetMarginChange(Number(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>

        {/* Scenario Toggle */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Scenario
          </label>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['Conservative', 'Likely', 'Aggressive'] as Scenario[]).map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  scenario === s
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s}
                <span className="ml-1 text-xs text-gray-500">
                  {s === 'Conservative' ? '−15%' : s === 'Aggressive' ? '+10%' : '±0%'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Costs & Fees */}
        <div className="border-t pt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-medium text-gray-700">Advanced Costs & Fees</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marketplace Fee %
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="0.1"
                  value={marketplaceFeePct}
                  onChange={(e) => setMarketplaceFeePct(clamp(Number(e.target.value) || 0, 0, 90))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment/Processing Fee %
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="0.1"
                  value={paymentFeePct}
                  onChange={(e) => setPaymentFeePct(clamp(Number(e.target.value) || 0, 0, 90))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flat Fees (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={flatFees}
                  onChange={(e) => setFlatFees(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refurb/Prep Total (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={refurbCostTotal}
                  onChange={(e) => setRefurbCostTotal(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refurb Per Item (USD)
                  {itemCount > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      × {itemCount} items = {currency(refurbCostPerItem * itemCount)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={refurbCostPerItem}
                  onChange={(e) => setRefurbCostPerItem(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Costs (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={otherCost}
                  onChange={(e) => setOtherCost(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping (USD)
                </label>
                <input
                  type="number"
                  value={shippingCost}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Estimated Revenue</h3>
          <p className="text-2xl font-bold text-blue-600">
            {currency(currentScenario.revenue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {scenario} scenario
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Non-Bid Costs</h3>
          <p className="text-2xl font-bold text-orange-600">
            {currency(totalNonBidCosts)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Shipping + fees + costs
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Max Bid @ {targetGrossMargin}%
          </h3>
          <p className={`text-2xl font-bold ${currentScenario.maxBid < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {currency(currentScenario.maxBid)}
          </p>
          {currentScenario.maxBid < 0 && (
            <div className="flex items-center mt-2 text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <p className="text-xs">Target margin not achievable</p>
            </div>
          )}
        </div>
      </div>

      {/* Scenario Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scenario Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Bid
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(['Conservative', 'Likely', 'Aggressive'] as Scenario[]).map((s, index) => (
                <tr key={s} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${scenario === s ? 'text-red-600' : 'text-gray-900'}`}>
                        {s}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({s === 'Conservative' ? '−15%' : s === 'Aggressive' ? '+10%' : '±0%'})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {currency(calculations[s].revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${calculations[s].maxBid < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {currency(calculations[s].maxBid)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisBidCalculator;