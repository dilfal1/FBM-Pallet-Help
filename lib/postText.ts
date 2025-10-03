import { Item } from '../types';

export function buildPostText(item: Item, pdpUrl?: string): string {
  const titleLine = item.draft_title || item.rawTitle || 'Item';

  const parts: string[] = [titleLine];

  if (item.draft_description) {
    parts.push('');
    parts.push(item.draft_description);
  }

  if (pdpUrl) {
    parts.push('');
    parts.push(`Reference: ${pdpUrl}`);
  }

  return parts.join('\n');
}
