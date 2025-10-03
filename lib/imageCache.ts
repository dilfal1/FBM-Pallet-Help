export type ImageMap = Record<string, string[]>;

const KEY = "itemImages_v1";

export function getImageMap(): ImageMap {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setImageMap(map: ImageMap): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(map));
}

export function mergeImageMap(partial: ImageMap): ImageMap {
  const current = getImageMap();
  const merged = { ...current, ...partial };
  setImageMap(merged);
  return merged;
}

export function clearImageMap(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
