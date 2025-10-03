import React, { useState } from 'react';
import { X, Save, Camera, ExternalLink, Copy, Package, Download } from 'lucide-react';
import { Item } from '../types';
import { useItemImages } from '../hooks/useItemImages';
import { scrapeItem } from '../lib/scrapeClient';
import { downloadPostZip } from '../lib/fbmZip';
import { buildPostText } from '../lib/postText';

interface ItemDetailDrawerProps {
  item: Item;
  onClose: () => void;
  onSave: (item: Item) => void;
}

const ItemDetailDrawer: React.FC<ItemDetailDrawerProps> = ({ item, onClose, onSave }) => {
  const [editedItem, setEditedItem] = useState<Item>({ ...item });
  const [isDownloading, setIsDownloading] = useState(false);
  const itemNumber = editedItem.costco_item_number || '';
  const cachedImages = useItemImages(itemNumber);

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  const handleDownloadZip = async () => {
    if (!itemNumber) {
      alert('No Costco item number available');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await scrapeItem(itemNumber);
      const postText = buildPostText(editedItem, result?.pdpUrl);
      const proxyUrls = (result?.images || []).map(x => x.proxy).slice(0, 3);
      const imagesToUse = proxyUrls.length > 0 ? proxyUrls : cachedImages;

      await downloadPostZip({
        itemNumber,
        imageProxies: imagesToUse,
        postText,
        extraMeta: {
          itemNumber,
          brand: editedItem.brand,
          model: editedItem.model,
          quantity: editedItem.qty,
        },
      });
    } catch (error) {
      console.error('Failed to download ZIP:', error);
      alert('Failed to download ZIP. Please check that VITE_WORKER_BASE is configured.');
    } finally {
      setIsDownloading(false);
    }
  };

  const updatePricePerUnit = (newPricePerUnit: number) => {
    const updatedDescription = generateDescriptionWithPrice(editedItem, newPricePerUnit);
    setEditedItem({
      ...editedItem,
      draft_price_per_unit: newPricePerUnit,
      draft_price: newPricePerUnit,
      estPriceEach: newPricePerUnit,
      draft_description: updatedDescription
    });
  };

  const generateDescriptionWithPrice = (item: Item, pricePerUnit: number): string => {
    const brand = item.brand || 'Quality';
    const title = item.rawTitle || 'Unknown Item';

    return `${brand} ${title}

Great deal on this liquidation item! Perfect for personal use or resale.

Price: $${pricePerUnit} each
Condition: Good (Liquidation)
Source: Costco Liquidation

All sales final. Cash only. Must pick up.

#Deal #Liquidation #${brand} #FacebookMarketplace`;
  };

  const totalPrice = editedItem.qty * (editedItem.draft_price_per_unit || editedItem.draft_price || 0);

  const copyListingText = () => {
    const listingText = `${editedItem.draft_title}

${editedItem.draft_description}

Condition: Good (Liquidation Item)

#FacebookMarketplace #Liquidation #${editedItem.brand || 'Deal'}`;

    navigator.clipboard.writeText(listingText);
  };

  const openComps = () => {
    const searchQuery = `${editedItem.brand} ${editedItem.model} facebook marketplace`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Costco Stock Photos</h3>
                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloading || !itemNumber}
                  className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Downloading...' : 'Download ZIP'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="border rounded-md p-1 h-28 flex items-center justify-center bg-gray-50"
                  >
                    {cachedImages[idx] ? (
                      <img
                        src={cachedImages[idx]}
                        className="max-h-24 object-contain"
                        alt={`Costco photo ${idx + 1}`}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                ZIP includes: post.txt + up to 3 photos + metadata.json
              </p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={editedItem.brand || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={editedItem.model || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editedItem.qty}
                    onChange={(e) => setEditedItem({ ...editedItem, qty: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editedItem.category_tag}
                    onChange={(e) => setEditedItem({ ...editedItem, category_tag: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="Quick Flip">Quick Flip</option>
                    <option value="Bulky">Bulky</option>
                    <option value="Bundle Candidate">Bundle Candidate</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pricing</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retail Price (per unit)
                  </label>
                  <input
                    type="number"
                    value={editedItem.retail_price || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, retail_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FBM Low (per unit)
                  </label>
                  <input
                    type="number"
                    value={editedItem.fbm_est_low || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, fbm_est_low: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FBM High (per unit)
                  </label>
                  <input
                    type="number"
                    value={editedItem.fbm_est_high || ''}
                    onChange={(e) => setEditedItem({ ...editedItem, fbm_est_high: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Price (per unit)
                  </label>
                  <input
                    type="number"
                    value={editedItem.draft_price_per_unit || editedItem.draft_price || ''}
                    onChange={(e) => updatePricePerUnit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Price for one individual item</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Value (all {editedItem.qty} units)
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-lg font-semibold text-green-600">
                    ${totalPrice.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">${editedItem.draft_price_per_unit || editedItem.draft_price || 0} × {editedItem.qty} units</p>
                </div>
              </div>
            </div>

            {/* Listing Draft */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Listing Draft</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editedItem.draft_title}
                  onChange={(e) => setEditedItem({ ...editedItem, draft_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={8}
                  value={editedItem.draft_description}
                  onChange={(e) => setEditedItem({ ...editedItem, draft_description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">This is for a single item listing (price already included in description)</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6">
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
              
              <button
                onClick={copyListingText}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Listing
              </button>
              
              <button
                onClick={openComps}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Comps
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailDrawer;