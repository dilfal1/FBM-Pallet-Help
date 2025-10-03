import React, { useState } from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { Intake } from '../types';

interface IntakeStepProps {
  onReady: (intake: Intake) => void;
}

const IntakeStep: React.FC<IntakeStepProps> = ({ onReady }) => {
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [buyerPremiumPct, setBuyerPremiumPct] = useState<number>(0);

  const isValid = shippingCost >= 0 && !isNaN(shippingCost);

  const handleSubmit = () => {
    if (isValid) {
      onReady({
        shippingCost,
        buyerPremiumPct
      });
    }
  };

  React.useEffect(() => {
    if (isValid) {
      handleSubmit();
    }
  }, [shippingCost, buyerPremiumPct, isValid]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Step 1: Enter Shipping Cost & Fees
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Enter shipping cost and optional buyer premium. Parsing is enabled after shipping cost is set.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Cost <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingCost || ''}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buyer Premium %
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Percent className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={buyerPremiumPct || ''}
              onChange={(e) => setBuyerPremiumPct(parseFloat(e.target.value) || 0)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="0.0"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Optional (0-30%)</p>
        </div>
      </div>

      {isValid && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Ready to upload manifest
          </p>
        </div>
      )}
    </div>
  );
};

export default IntakeStep;