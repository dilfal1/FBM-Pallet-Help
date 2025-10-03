import React, { useEffect, useState } from 'react';
import { mergeImageMap, type ImageMap } from '../lib/imageCache';
import { scrapeItem } from '../lib/scrapeClient';
import { Item } from '../types';

interface ImagePrefetcherProps {
  items: Item[];
  concurrency?: number;
  onDone?: (result: ImageMap) => void;
}

function extractItemNumber(item: Item): string | null {
  return item.costco_item_number || null;
}

const ImagePrefetcher: React.FC<ImagePrefetcherProps> = ({
  items,
  concurrency = 2,
  onDone,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    let cancelled = false;

    const itemNumbers = items
      .map(extractItemNumber)
      .filter(Boolean) as string[];

    if (!itemNumbers.length) {
      setStatus('done');
      return;
    }

    async function run() {
      setStatus('running');
      const mapping: ImageMap = {};
      let completed = 0;

      async function worker(startIdx: number) {
        for (let idx = startIdx; idx < itemNumbers.length; idx += concurrency) {
          if (cancelled) break;

          const itemNum = itemNumbers[idx];
          try {
            const result = await scrapeItem(itemNum);
            mapping[itemNum] = (result.images || [])
              .map(x => x.proxy)
              .slice(0, 3);
          } catch (error) {
            mapping[itemNum] = [];
          } finally {
            completed++;
            setProgress(Math.round((completed / itemNumbers.length) * 100));
          }

          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }

      await Promise.all(
        Array.from({ length: concurrency }, (_, k) => worker(k))
      );

      if (cancelled) return;

      const merged = mergeImageMap(mapping);
      setStatus('done');
      onDone?.(merged);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [items, concurrency, onDone]);

  if (!items?.length || status === 'idle') return null;

  if (status === 'done') {
    return (
      <div className="text-xs text-green-600 flex items-center space-x-2">
        <span>✓</span>
        <span>Costco images loaded</span>
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500 flex items-center space-x-2">
      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      <span>Fetching Costco images… {progress}%</span>
    </div>
  );
};

export default ImagePrefetcher;
