import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, DollarSign } from 'lucide-react';
import { Item, Manifest, Intake } from '../types';
import { parseManifest, generateItemData } from '../utils/manifestParser';
import IntakeStep from './IntakeStep';

interface ManifestUploadProps {
  onManifestProcessed: (manifest: Manifest, items: Item[]) => void;
}

const ManifestUpload: React.FC<ManifestUploadProps> = ({ onManifestProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [buyerPremiumPct, setBuyerPremiumPct] = useState<number>(0);
  const [processedManifest, setProcessedManifest] = useState<Manifest | null>(null);
  const [processedItems, setProcessedItems] = useState<Item[]>([]);

  const isReadyToUpload = !isNaN(shippingCost) && shippingCost >= 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setPreviewData(null);

    try {
      // Parse the manifest file
      const rawData = await parseManifest(file);
      setPreviewData(rawData.slice(0, 5)); // Show first 5 rows for preview

      // Generate manifest and items
      const manifest: Manifest = {
        id: `manifest_${Date.now()}`,
        supplier: 'Costco',
        lot_id: `LOT_${Date.now()}`,
        source_file_url: file.name,
        created_at: new Date().toISOString(),
        total_items: rawData.length,
        gross_resale_estimate: 0,
        shipping_cost: shippingCost
      };

      const items: Item[] = await Promise.all(
        rawData.map(async (row, index) => {
          const itemData = await generateItemData(row, manifest.id, index);
          // Set estPriceEach from fbm_est_high or draft_price
          itemData.estPriceEach = itemData.fbm_est_high || itemData.draft_price || 0;
          itemData.include = true; // default to included
          return itemData;
        })
      );

      // Update manifest with calculated values
      manifest.gross_resale_estimate = items.reduce((sum, item) => sum + item.estPriceEach, 0);

      setProcessedManifest(manifest);
      setProcessedItems(items);
      setPreviewData(rawData.slice(0, 5)); // Show preview
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const continueToGrid = () => {
    if (processedManifest && processedItems.length > 0) {
      onManifestProcessed(processedManifest, processedItems);
    }
  };

  const handleIntakeReady = (intake: Intake) => {
    setShippingCost(intake.shippingCost);
    setBuyerPremiumPct(intake.buyerPremiumPct);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Manifest</h2>
        <p className="text-lg text-gray-600">
          Upload your Costco liquidation manifest to get started. We support CSV, XLS, and PDF files.
        </p>
      </div>

      {/* Step 1: Intake Form */}
      <div className="mb-8">
        <IntakeStep onReady={handleIntakeReady} />
      </div>

      {!previewData && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            !isReadyToUpload
              ? 'border-gray-200 bg-gray-50 opacity-50'
            : isDragging
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="space-y-4">
              <Loader className="w-12 h-12 text-red-600 mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Processing Manifest</h3>
                <p className="text-gray-600">Parsing items and fetching product data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className={`text-lg font-medium ${isReadyToUpload ? 'text-gray-900' : 'text-gray-400'}`}>
                  {isReadyToUpload ? 'Drop your manifest here' : 'Complete Step 1 to enable upload'}
                </h3>
                <p className={`${isReadyToUpload ? 'text-gray-600' : 'text-gray-400'}`}>
                  {isReadyToUpload ? 'or click to browse files' : 'Enter shipping cost first'}
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                disabled={!isReadyToUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
                  isReadyToUpload
                    ? 'text-white bg-red-600 hover:bg-red-700 cursor-pointer'
                    : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                }`}
              >
                Choose File
              </label>
              <p className="text-xs text-gray-500">
                Supports CSV, Excel (.xlsx, .xls), and PDF files up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Upload Error</h4>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
        </div>
      )}

      {previewData && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-lg font-medium">Manifest Parsed Successfully</h3>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">Preview - First 5 Items</h4>
              <p className="text-sm text-gray-600">
                Found {previewData.length} items. Review the preview below and continue to process all items.
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
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item #
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.title || row.description || 'Unknown Item'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.brand || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.quantity || row.qty || 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.item_number || row.costco_item_number || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={continueToGrid}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              Continue to Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManifestUpload;