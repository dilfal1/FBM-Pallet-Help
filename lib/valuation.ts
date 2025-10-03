import type { Item, Intake } from '../types';

export function suggestedSellThrough(items: Item[]): number {
  const total = items.reduce((s, it) => s + it.qty, 0);
  const included = items.reduce((s, it) => s + (it.include === false ? 0 : it.qty), 0);
  if (!total) return 100;
  return Math.round((included / total) * 100);
}

export function estimatedRevenue(items: Item[], sellThroughPct: number): number {
  const base = items.reduce((sum, it) => {
    if (it.include === false) return sum;
    return sum + (it.qty * it.estPriceEach);
  }, 0);
  return base * (sellThroughPct / 100);
}

export function buildSensitivity(
  items: Item[],
  intake: Intake,
  sellThroughPct: number
): Array<{ bid: number; profit: number; roi: number }> {
  const estRev = estimatedRevenue(items, sellThroughPct);
  const maxBid = Math.max(2000, Math.round(estRev * 0.9));
  const step = Math.max(25, Math.round(maxBid / 50));
  const rows: Array<{ bid: number; profit: number; roi: number }> = [];

  for (let bid = 0; bid <= maxBid; bid += step) {
    const premium = (intake.buyerPremiumPct / 100) * bid;
    const totalCost = bid + intake.shippingCost + premium;
    const profit = estRev - totalCost;
    const roi = totalCost > 0 ? profit / totalCost : 0;
    rows.push({ bid, profit: Math.round(profit), roi: Number((roi * 100).toFixed(1)) });
  }
  return rows;
}