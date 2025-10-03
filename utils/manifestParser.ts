import { Item } from '../types';

export const parseManifest = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.csv')) {
          const rows = parseCSV(content);
          resolve(rows);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // For demo purposes, we'll treat Excel files as CSV
          // In a real app, you'd use a library like xlsx
          const rows = parseCSV(content);
          resolve(rows);
        } else if (file.name.endsWith('.pdf')) {
          // For demo purposes, we'll generate sample data for PDF
          // In a real app, you'd use a PDF parsing library
          const sampleData = generateSampleData();
          resolve(sampleData);
        } else {
          reject(new Error('Unsupported file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

const parseCSV = (content: string): any[] => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim().replace(/"/g, '');

      // Map common header variations to standard fields
      if (header.includes('title') || header.includes('description')) {
        row.title = value;
      } else if (header.includes('vendor')) {
        // Vendor column contains the brand
        row.brand = value;
      } else if (header.includes('brand')) {
        row.brand = value;
      } else if (header.includes('model')) {
        row.model = value;
      } else if (header.includes('qty') || header.includes('quantity')) {
        row.quantity = parseInt(value) || 1;
      } else if (header.includes('upc') || header.includes('barcode')) {
        row.upc = value;
      } else if ((header.includes('item') && header.includes('number')) || header === 'item #' || header === 'item number' || header.includes('item#')) {
        row.costco_item_number = value;
      } else if (header.includes('retail') || header.includes('price') || header.includes('msrp') || header.includes('unit')) {
        const price = parseFloat(value);
        if (!isNaN(price)) {
          row.retailPrice = price;
        }
      } else {
        row[header] = value;
      }
    });

    if (row.title) {
      rows.push(row);
    }
  }

  return rows;
};

const generateSampleData = (): any[] => {
  return [
    {
      title: "Kirkland Signature Organic Extra Virgin Olive Oil 2L",
      brand: "Kirkland Signature",
      quantity: 12,
      costco_item_number: "123456"
    },
    {
      title: "Samsung 65\" 4K Smart TV UN65TU8000",
      brand: "Samsung",
      model: "UN65TU8000",
      quantity: 2,
      costco_item_number: "789012"
    },
    {
      title: "Dyson V11 Cordless Vacuum Cleaner",
      brand: "Dyson",
      model: "V11",
      quantity: 5,
      costco_item_number: "345678"
    },
    {
      title: "Apple AirPods Pro 2nd Generation",
      brand: "Apple",
      model: "AirPods Pro",
      quantity: 8,
      costco_item_number: "901234"
    },
    {
      title: "Ninja Foodi Personal Blender",
      brand: "Ninja",
      model: "Foodi",
      quantity: 15,
      costco_item_number: "567890"
    }
  ];
};

export const generateItemData = async (rawData: any, manifestId: string, index: number): Promise<Item> => {
  // Use retail price from manifest if available, otherwise fetch product data
  let retailPrice = rawData.retailPrice;
  let photoUrl: string | undefined;

  if (!retailPrice) {
    const productData = await fetchProductData(rawData);
    retailPrice = productData.retailPrice;
    photoUrl = productData.photoUrl;
  } else {
    // If we have retail price from manifest, still try to get photo
    const productData = await fetchProductData(rawData);
    photoUrl = productData.photoUrl;
  }

  const pricePerUnit = retailPrice ? Math.round(retailPrice * 0.6) : 0;

  const item: Item = {
    id: `item_${manifestId}_${index}`,
    manifest_id: manifestId,
    rawTitle: rawData.title || 'Unknown Item',
    raw_title: rawData.title || 'Unknown Item',
    brand: rawData.brand || extractBrand(rawData.title),
    model: rawData.model || extractModel(rawData.title),
    upc: rawData.upc,
    costco_item_number: rawData.costco_item_number,
    qty: rawData.quantity || 1,
    category_tag: categorizeItem(rawData.title, rawData.brand),
    retailPrice: retailPrice,
    retail_price: retailPrice,
    fbm_est_low: retailPrice ? retailPrice * 0.4 : undefined,
    fbm_est_high: retailPrice ? retailPrice * 0.7 : undefined,
    photo_url: photoUrl,
    draft_title: generateDraftTitle(rawData),
    draft_description: generateDraftDescription(rawData, pricePerUnit),
    draft_price: pricePerUnit,
    draft_price_per_unit: pricePerUnit,
    confidence_score: calculateConfidenceScore(rawData, { retailPrice, photoUrl }),
    risk_score: calculateRiskScore(rawData, { retailPrice, photoUrl }),
    condition_discount: 0.1,
    estPriceEach: pricePerUnit,
    include: true
  };

  return item;
};

const fetchProductData = async (rawData: any): Promise<{
  retailPrice?: number;
  photoUrl?: string;
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock product data based on item type
  const title = rawData.title?.toLowerCase() || '';
  
  if (title.includes('tv') || title.includes('samsung')) {
    return {
      retailPrice: 899,
      photoUrl: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400'
    };
  } else if (title.includes('vacuum') || title.includes('dyson')) {
    return {
      retailPrice: 599,
      photoUrl: 'https://images.pexels.com/photos/4107123/pexels-photo-4107123.jpeg?auto=compress&cs=tinysrgb&w=400'
    };
  } else if (title.includes('airpods') || title.includes('apple')) {
    return {
      retailPrice: 249,
      photoUrl: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400'
    };
  } else if (title.includes('blender') || title.includes('ninja')) {
    return {
      retailPrice: 79,
      photoUrl: 'https://images.pexels.com/photos/4226796/pexels-photo-4226796.jpeg?auto=compress&cs=tinysrgb&w=400'
    };
  } else if (title.includes('oil') || title.includes('kirkland')) {
    return {
      retailPrice: 15,
      photoUrl: 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=400'
    };
  }
  
  // Default for unknown items - return undefined instead of random price
  return {
    retailPrice: undefined,
    photoUrl: undefined
  };
};

const extractBrand = (title: string): string | undefined => {
  const commonBrands = ['Samsung', 'Apple', 'Dyson', 'Ninja', 'Kirkland', 'Sony', 'LG', 'HP', 'Dell'];
  const titleUpper = title.toUpperCase();
  
  for (const brand of commonBrands) {
    if (titleUpper.includes(brand.toUpperCase())) {
      return brand;
    }
  }
  
  return undefined;
};

const extractModel = (title: string): string | undefined => {
  // Simple model extraction - look for alphanumeric patterns
  const modelMatch = title.match(/[A-Z0-9]{3,}/);
  return modelMatch ? modelMatch[0] : undefined;
};

const categorizeItem = (title: string, brand?: string): Item['category_tag'] => {
  const titleLower = title.toLowerCase();
  
  // Quick flip items (electronics, small appliances)
  if (titleLower.includes('airpods') || titleLower.includes('phone') || 
      titleLower.includes('tablet') || titleLower.includes('headphones')) {
    return 'Quick Flip';
  }
  
  // Bulky items (furniture, large appliances, TVs)
  if (titleLower.includes('tv') || titleLower.includes('furniture') || 
      titleLower.includes('chair') || titleLower.includes('table') ||
      titleLower.includes('refrigerator') || titleLower.includes('washer')) {
    return 'Bulky';
  }
  
  // Bundle candidates (small, low-value items)
  if (titleLower.includes('oil') || titleLower.includes('spice') || 
      titleLower.includes('snack') || titleLower.includes('battery')) {
    return 'Bundle Candidate';
  }
  
  return 'Unknown';
};

const generateDraftTitle = (rawData: any): string => {
  const title = rawData.title || 'Unknown Item';
  const brand = rawData.brand;
  const model = rawData.model;
  
  let draftTitle = title;
  
  // Add brand if not already in title
  if (brand && !title.toLowerCase().includes(brand.toLowerCase())) {
    draftTitle = `${brand} ${draftTitle}`;
  }
  
  // Add model if not already in title
  if (model && !title.toLowerCase().includes(model.toLowerCase())) {
    draftTitle = `${draftTitle} ${model}`;
  }
  
  // Add liquidation indicator
  draftTitle += ' - Liquidation Deal!';
  
  return draftTitle;
};

const generateDraftDescription = (rawData: any, pricePerUnit: number): string => {
  const title = rawData.title || 'Unknown Item';
  const brand = rawData.brand || 'Quality';

  return `${brand} ${title}

Great deal on this liquidation item! Perfect for personal use or resale.

Price: $${pricePerUnit} each
Condition: Good (Liquidation)
Source: Costco Liquidation

All sales final. Cash only. Must pick up.

#Deal #Liquidation #${brand} #FacebookMarketplace`;
};

const calculateConfidenceScore = (rawData: any, productData: any): number => {
  let score = 0.3; // Base score
  
  if (rawData.brand) score += 0.2;
  if (rawData.model) score += 0.2;
  if (rawData.costco_item_number) score += 0.1;
  if (productData.retailPrice) score += 0.2;
  if (productData.photoUrl) score += 0.1;
  
  return Math.min(score, 1.0);
};

const calculateRiskScore = (rawData: any, productData: any): Item['risk_score'] => {
  const title = rawData.title?.toLowerCase() || '';
  
  // High risk items
  if (title.includes('electronics') || title.includes('phone') || title.includes('computer')) {
    return 'High';
  }
  
  // Low risk items
  if (title.includes('food') || title.includes('oil') || title.includes('household')) {
    return 'Low';
  }
  
  return 'Medium';
};