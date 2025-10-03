export type ScrapeImage = { raw: string; proxy: string };
export type ScrapeResult = {
  item: string;
  pdpUrl?: string;
  images: ScrapeImage[];
  error?: string
};

const WORKER_BASE = import.meta.env.VITE_WORKER_BASE || "";

export async function scrapeItem(itemNumber: string): Promise<ScrapeResult> {
  if (!WORKER_BASE) {
    throw new Error("Missing VITE_WORKER_BASE environment variable");
  }

  const url = `${WORKER_BASE}/scrape?item=${encodeURIComponent(itemNumber)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Worker request failed: ${response.status}`);
  }

  const json = await response.json();
  return json as ScrapeResult;
}
