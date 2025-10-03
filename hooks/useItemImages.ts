import { useEffect, useState } from "react";
import { getImageMap, type ImageMap } from "../lib/imageCache";

export function useItemImages(itemNumber?: string): string[] {
  const [map, setMap] = useState<ImageMap>({});

  useEffect(() => {
    setMap(getImageMap());

    const handleStorageChange = () => {
      setMap(getImageMap());
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      setMap(getImageMap());
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return itemNumber ? (map[itemNumber] || []) : [];
}
