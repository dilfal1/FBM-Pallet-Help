import React, { useState, useMemo } from 'react';
import { Grid2x2 as Grid, List, Filter, Search, CreditCard as Edit, Copy, ExternalLink, Package, DollarSign } from 'lucide-react';
import { Item, Manifest } from '../types';
import ItemDetailDrawer from './ItemDetailDrawer';
import { useItemImages } from '../hooks/useItemImages';

interface ItemGridProps {
  items: Item[];
  onItemUpdate: (item: Item) => void;
  manifest: Manifest;
}

const ItemCard: React.FC<{ item: Item; onEdit: () => void; onCopy: () => void; getCategoryColor: (cat: string) => string; getConfidenceColor: (score: number) => string }> = ({ item, onEdit, onCopy, getCategoryColor, getConfidenceColor }) => {
  const images = useItemImages(item.costco_item_number || '');
  const displayImage = images[0] || item.photo_url;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-t-lg overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={item.raw_title}
            className="w-full h-48 object-contain"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            {item.raw_title}
          </h3>
          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getCategoryColor(item.category_tag)}`}>
            {item.category_tag}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Qty: {item.qty} units</span>
            <span className={`font-medium ${getConfidenceColor(item.confidence_score)}`}>
              {(item.confidence_score * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Per Unit
              </div>
              <div className="text-sm font-semibold text-gray-700">
                ${item.estPriceEach?.toFixed(0) || 'N/A'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Total Value
              </div>
              <div className="text-lg font-bold text-green-600">
                ${((item.estPriceEach || 0) * item.qty).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Edit
          </button>
          <button
            onClick={onCopy}
            className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Copy className="w-4 h-4 inline mr-1" />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

const ItemGrid: React.FC<ItemGridProps> = ({ items, onItemUpdate, manifest }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.raw_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.model?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.category_tag === categoryFilter;
      
      const matchesConfidence = confidenceFilter === 'all' || 
                               (confidenceFilter === 'high' && item.confidence_score >= 0.8) ||
                               (confidenceFilter === 'medium' && item.confidence_score >= 0.5 && item.confidence_score < 0.8) ||
                               (confidenceFilter === 'low' && item.confidence_score < 0.5);

      return matchesSearch && matchesCategory && matchesConfidence;
    });
  }, [items, searchTerm, categoryFilter, confidenceFilter]);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.estPriceEach * item.qty), 0);
    const matchedItems = items.filter(item => item.confidence_score > 0.5).length;
    const matchRate = items.length > 0 ? (matchedItems / items.length) * 100 : 0;
    const totalUnits = items.reduce((sum, item) => sum + item.qty, 0);

    return {
      totalItems: items.length,
      totalUnits,
      totalValue,
      matchRate,
      avgPrice: items.length > 0 ? totalValue / items.length : 0
    };
  }, [items]);

  const copyListingText = (item: Item) => {
    const listingText = `${item.draft_title}

${item.draft_description}

Condition: Good (Liquidation Item)

#FacebookMarketplace #Liquidation #${item.brand || 'Deal'}`;

    navigator.clipboard.writeText(listingText);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Quick Flip': return 'bg-green-100 text-green-800';
      case 'Bulky': return 'bg-orange-100 text-orange-800';
      case 'Bundle Candidate': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
            <div className="text-sm text-gray-500">Item Types</div>
            <div className="text-xs text-gray-400 mt-1">{stats.totalUnits} total units</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${stats.totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Est. Total Value</div>
            <div className="text-xs text-gray-400 mt-1">All units combined</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.matchRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Match Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">${stats.avgPrice.toFixed(0)}</div>
            <div className="text-sm text-gray-500">Avg. per Item Type</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Quick Flip">Quick Flip</option>
              <option value="Bulky">Bulky</option>
              <option value="Bundle Candidate">Bundle Candidate</option>
              <option value="Unknown">Unknown</option>
            </select>

            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Confidence</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (50-80%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Items Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setSelectedItem(item)}
              onCopy={() => copyListingText(item)}
              getCategoryColor={getCategoryColor}
              getConfidenceColor={getConfidenceColor}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Per Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
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
                            {item.brand} {item.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(item.category_tag)}`}>
                        {item.category_tag}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.qty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      ${item.estPriceEach?.toFixed(0) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      ${((item.estPriceEach || 0) * item.qty).toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getConfidenceColor(item.confidence_score)}`}>
                        {(item.confidence_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => copyListingText(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Detail Drawer */}
      {selectedItem && (
        <ItemDetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={onItemUpdate}
        />
      )}
    </div>
  );
};

export default ItemGrid;