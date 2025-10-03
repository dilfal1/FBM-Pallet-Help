import React, { useState } from 'react';
import { Upload, Package, DollarSign, TrendingUp, Grid2x2 as Grid, BarChart3, Calculator } from 'lucide-react';
import ManifestUpload from './components/ManifestUpload';
import ItemGrid from './components/ItemGrid';
import AnalysisBidCalculator from './components/AnalysisBidCalculator';
import BundleBuilder from './components/BundleBuilder';
import ImagePrefetcher from './components/ImagePrefetcher';
import { Item, Manifest, Intake } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'upload' | 'grid' | 'analysis' | 'bundle'>('upload');
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [intake, setIntake] = useState<Intake>({ shippingCost: 0, buyerPremiumPct: 0 });

  const handleManifestProcessed = (processedManifest: Manifest, processedItems: Item[]) => {
    setManifest(processedManifest);
    setItems(processedItems);
    setIntake({ shippingCost: processedManifest.shipping_cost || 0, buyerPremiumPct: 0 });
    setCurrentView('grid');
  };

  const handleItemUpdate = (updatedItem: Item) => {
    setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const navigation = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'grid', label: 'Items', icon: Grid, disabled: !manifest },
    { id: 'analysis', label: 'Analysis', icon: Calculator, disabled: !manifest },
    { id: 'bundle', label: 'Bundle Builder', icon: Package, disabled: !manifest },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FBM Pallet Helper</h1>
                <p className="text-sm text-gray-500">Liquidation to Listing in Minutes</p>
              </div>
            </div>
            
            {manifest && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>{items.length} items</span>
                </span>
                <span className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${manifest.gross_resale_estimate.toLocaleString()}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setCurrentView(item.id as any)}
                  disabled={item.disabled}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === item.id
                      ? 'border-red-500 text-red-600'
                      : item.disabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'upload' && (
          <ManifestUpload onManifestProcessed={handleManifestProcessed} />
        )}
        
        {currentView === 'grid' && manifest && (
          <>
            <div className="mb-4">
              <ImagePrefetcher items={items} concurrency={2} />
            </div>
            <ItemGrid
              items={items}
              onItemUpdate={handleItemUpdate}
              manifest={manifest}
            />
          </>
        )}
        
        {currentView === 'analysis' && manifest && (
          <AnalysisBidCalculator 
            estimatedRevenue={items.reduce((sum, item) => sum + (item.estPriceEach || 0), 0)}
            shippingCost={intake.shippingCost}
            itemCount={items.length}
          />
        )}
        
        {currentView === 'bundle' && manifest && (
          <BundleBuilder 
            items={items}
            onItemUpdate={handleItemUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;