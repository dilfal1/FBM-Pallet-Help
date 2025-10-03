import React, { useMemo } from 'react';
import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Target } from 'lucide-react';
import { Item, Manifest } from '../types';

interface ROIDashboardProps {
  items: Item[];
  manifest: Manifest;
}

const ROIDashboard: React.FC<ROIDashboardProps> = ({ items, manifest }) => {
  const [bidPrice, setBidPrice] = useState<number>(0);

  const analytics = useMemo(() => {
    const totalItems = items.length;
    const matchedItems = items.filter(item => item.confidence_score > 0.5);
    const unmatchedItems = totalItems - matchedItems.length;
    
    const grossResale = items.reduce((sum, item) => sum + (item.fbm_est_high || 0), 0);
    const lowEstimate = items.reduce((sum, item) => sum + (item.fbm_est_low || 0), 0);
    
    // Calculate total pallet cost from bid price and shipping
    const palletCost = bidPrice + (manifest.shipping_cost || 0);
    const netROI = grossResale - palletCost;
    const roiPercentage = palletCost > 0 ? (netROI / palletCost) * 100 : 0;
    
    const categoryBreakdown = items.reduce((acc, item) => {
      const category = item.category_tag;
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 };
      }
      acc[category].count += 1;
      acc[category].value += item.fbm_est_high || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
    
    const riskBreakdown = items.reduce((acc, item) => {
      const risk = item.risk_score;
      if (!acc[risk]) {
        acc[risk] = { count: 0, value: 0 };
      }
      acc[risk].count += 1;
      acc[risk].value += item.fbm_est_high || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
    
    const topItems = [...items]
      .sort((a, b) => (b.fbm_est_high || 0) - (a.fbm_est_high || 0))
      .slice(0, 10);
    
    const avgPrice = totalItems > 0 ? grossResale / totalItems : 0;
    const matchRate = totalItems > 0 ? (matchedItems.length / totalItems) * 100 : 0;
    
    return {
      totalItems,
      matchedItems: matchedItems.length,
      unmatchedItems,
      grossResale,
      lowEstimate,
      palletCost,
      netROI,
      roiPercentage,
      categoryBreakdown,
      riskBreakdown,
      topItems,
      avgPrice,
      matchRate
    };
  }, [items, bidPrice, manifest.shipping_cost]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Quick Flip': return 'bg-green-500';
      case 'Bulky': return 'bg-orange-500';
      case 'Bundle Candidate': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gross Resale Est.</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analytics.grossResale.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Low: ${analytics.lowEstimate.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {analytics.roiPercentage > 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net ROI</p>
              <p className={`text-2xl font-bold ${analytics.netROI > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${analytics.netROI.toLocaleString()}
              </p>
              <p className={`text-sm ${analytics.roiPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.roiPercentage.toFixed(1)}% ROI
              </p>
              {analytics.palletCost > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Cost: ${analytics.palletCost.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Items Matched</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.matchedItems}/{analytics.totalItems}
              </p>
              <p className="text-sm text-blue-600">
                {analytics.matchRate.toFixed(1)}% match rate
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Item Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analytics.avgPrice.toFixed(0)}
              </p>
              <p className="text-sm text-purple-600">
                Per item estimate
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analytics.categoryBreakdown).map(([category, data]) => {
              const percentage = analytics.totalItems > 0 ? (data.count / analytics.totalItems) * 100 : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm text-gray-500">
                      {data.count} items • ${data.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCategoryColor(category)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
          <div className="space-y-4">
            {Object.entries(analytics.riskBreakdown).map(([risk, data]) => {
              const percentage = analytics.totalItems > 0 ? (data.count / analytics.totalItems) * 100 : 0;
              return (
                <div key={risk} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{risk} Risk</span>
                    <span className="text-sm text-gray-500">
                      {data.count} items • ${data.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRiskColor(risk)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Items Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top 10 Items by Value</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {item.photo_url ? (
                          <img className="h-10 w-10 rounded-lg object-cover" src={item.photo_url} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {item.raw_title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Qty: {item.qty}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.category_tag === 'Quick Flip' ? 'bg-green-100 text-green-800' :
                      item.category_tag === 'Bulky' ? 'bg-orange-100 text-orange-800' :
                      item.category_tag === 'Bundle Candidate' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.category_tag}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${item.fbm_est_high?.toFixed(0) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.risk_score === 'Low' ? 'bg-green-100 text-green-800' :
                      item.risk_score === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.risk_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(item.confidence_score * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {analytics.unmatchedItems > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-lg font-medium text-yellow-800">
                {analytics.unmatchedItems} items need attention
              </h4>
              <p className="text-yellow-700 mt-1">
                These items have low confidence scores and may need manual research or better product data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROIDashboard;