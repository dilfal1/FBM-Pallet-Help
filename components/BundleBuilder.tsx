import React, { useState, useMemo } from 'react';
import { Package, Plus, Minus, ShoppingCart, Copy, DollarSign } from 'lucide-react';
import { Item, Bundle } from '../types';

interface BundleBuilderProps {
  items: Item[];
  onItemUpdate: (item: Item) => void;
}

const BundleBuilder: React.FC<BundleBuilderProps> = ({ items, onItemUpdate }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');

  const bundleCandidates = useMemo(() => {
    return items.filter(item => 
      item.category_tag === 'Bundle Candidate' || 
      (item.fbm_est_high && item.fbm_est_high < 50)
    );
  }, [items]);

  const selectedItemsData = useMemo(() => {
    return items.filter(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  const bundleStats = useMemo(() => {
    const totalValue = selectedItemsData.reduce((sum, item) => sum + (item.fbm_est_high || 0), 0);
    const totalItems = selectedItemsData.reduce((sum, item) => sum + item.qty, 0);
    const suggestedPrice = totalValue * 0.8; // 20% bundle discount
    const savings = totalValue - suggestedPrice;
    
    return {
      totalValue,
      totalItems,
      suggestedPrice,
      savings
    };
  }, [selectedItemsData]);

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const generateBundleTitle = () => {
    if (selectedItemsData.length === 0) return '';
    
    const brands = [...new Set(selectedItemsData.map(item => item.brand).filter(Boolean))];
    const categories = [...new Set(selectedItemsData.map(item => item.category_tag))];
    
    if (brands.length === 1) {
      return `${brands[0]} Bundle - ${selectedItemsData.length} Items`;
    } else if (categories.length === 1 && categories[0] !== 'Unknown') {
      return `${categories[0]} Bundle - ${selectedItemsData.length} Items`;
    } else {
      return `Mixed Item Bundle - ${selectedItemsData.length} Items`;
    }
  };

  const generateBundleDescription = () => {
    if (selectedItemsData.length === 0) return '';
    
    const itemList = selectedItemsData.map(item => 
      `• ${item.raw_title} (Qty: ${item.qty})`
    ).join('\n');
    
    return `Great bundle deal! This lot includes:

${itemList}

All items are from liquidation and in good condition. Perfect for resellers or anyone looking for great deals!

Bundle price is ${((bundleStats.savings / bundleStats.totalValue) * 100).toFixed(0)}% off individual prices!

#FacebookMarketplace #Bundle #Liquidation #Deal`;
  };

  const createBundle = () => {
    if (selectedItemsData.length < 2) return;
    
    const title = bundleTitle || generateBundleTitle();
    const description = bundleDescription || generateBundleDescription();
    
    const newBundle: Bundle = {
      id: `bundle_${Date.now()}`,
      items: selectedItemsData,
      title,
      description,
      total_price: bundleStats.suggestedPrice,
      savings: bundleStats.savings
    };
    
    setBundles([...bundles, newBundle]);
    setSelectedItems(new Set());
    setBundleTitle('');
    setBundleDescription('');
  };

  const copyBundleText = (bundle: Bundle) => {
    const bundleText = `${bundle.title}

${bundle.description}

Bundle Price: $${bundle.total_price.toFixed(0)}
You Save: $${bundle.savings.toFixed(0)}

Items included: ${bundle.items.length}
Total quantity: ${bundle.items.reduce((sum, item) => sum + item.qty, 0)}`;

    navigator.clipboard.writeText(bundleText);
  };

  const autoSuggestBundles = () => {
    // Group items by brand or similar characteristics
    const brandGroups = bundleCandidates.reduce((groups, item) => {
      const key = item.brand || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, Item[]>);

    // Create bundles from groups with 2+ items
    const suggestedBundles = Object.entries(brandGroups)
      .filter(([_, items]) => items.length >= 2)
      .map(([brand, items]) => {
        const totalValue = items.reduce((sum, item) => sum + (item.fbm_est_high || 0), 0);
        const suggestedPrice = totalValue * 0.8;
        
        return {
          id: `suggested_${Date.now()}_${brand}`,
          items,
          title: `${brand} Bundle - ${items.length} Items`,
          description: generateBundleDescription(),
          total_price: suggestedPrice,
          savings: totalValue - suggestedPrice
        };
      });

    setBundles([...bundles, ...suggestedBundles]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bundle Builder</h2>
          <p className="text-gray-600">Create attractive bundles to increase sales and move inventory faster</p>
        </div>
        <button
          onClick={autoSuggestBundles}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Auto-Suggest Bundles
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Items for Bundle ({bundleCandidates.length} candidates)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {bundleCandidates.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedItems.has(item.id)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {selectedItems.has(item.id) ? (
                        <Minus className="w-5 h-5 text-red-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 h-12 w-12">
                      {item.photo_url ? (
                        <img className="h-12 w-12 rounded-lg object-cover" src={item.photo_url} alt="" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.raw_title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.qty} • ${item.fbm_est_high?.toFixed(0) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bundle Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bundle Preview</h3>
            
            {selectedItemsData.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items:</span>
                    <span className="font-medium">{selectedItemsData.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Qty:</span>
                    <span className="font-medium">{bundleStats.totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Individual Total:</span>
                    <span className="font-medium">${bundleStats.totalValue.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bundle Price:</span>
                    <span className="font-medium text-green-600">${bundleStats.suggestedPrice.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Savings:</span>
                    <span className="font-medium text-red-600">${bundleStats.savings.toFixed(0)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bundle Title
                  </label>
                  <input
                    type="text"
                    value={bundleTitle}
                    onChange={(e) => setBundleTitle(e.target.value)}
                    placeholder={generateBundleTitle()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={bundleDescription}
                    onChange={(e) => setBundleDescription(e.target.value)}
                    placeholder={generateBundleDescription()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>

                <button
                  onClick={createBundle}
                  disabled={selectedItemsData.length < 2}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  Create Bundle
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select 2+ items to create a bundle</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Created Bundles */}
      {bundles.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Created Bundles ({bundles.length})</h3>
          </div>
          
          <div className="p-6 space-y-4">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{bundle.title}</h4>
                    <p className="text-sm text-gray-500">
                      {bundle.items.length} items • ${bundle.total_price.toFixed(0)} 
                      <span className="text-green-600 ml-2">Save ${bundle.savings.toFixed(0)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => copyBundleText(bundle)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    <Copy className="w-4 h-4 inline mr-1" />
                    Copy
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {bundle.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <div className="flex-shrink-0 h-8 w-8">
                        {item.photo_url ? (
                          <img className="h-8 w-8 rounded object-cover" src={item.photo_url} alt="" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 truncate">
                        {item.raw_title}
                      </span>
                    </div>
                  ))}
                  {bundle.items.length > 4 && (
                    <div className="text-xs text-gray-500">
                      +{bundle.items.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleBuilder;