import JSZip from 'jszip';

export interface DownloadPostZipOptions {
  itemNumber: string;
  imageProxies: string[];
  postText: string;
  extraMeta?: Record<string, any>;
}

export async function downloadPostZip(opts: DownloadPostZipOptions): Promise<void> {
  const zip = new JSZip();

  zip.file("post.txt", opts.postText);

  if (opts.extraMeta) {
    zip.file("metadata.json", JSON.stringify(opts.extraMeta, null, 2));
  }

  const photosFolder = zip.folder("photos");
  if (!photosFolder) {
    throw new Error("Failed to create photos folder");
  }

  let imageIndex = 1;

  for (const proxyUrl of opts.imageProxies.slice(0, 3)) {
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      const blob = await response.blob();

      let extension = "jpg";
      if (contentType.includes("png")) {
        extension = "png";
      } else if (contentType.includes("webp")) {
        extension = "webp";
      }

      photosFolder.file(`${imageIndex}.${extension}`, blob);
      imageIndex++;
    } catch (error) {
      console.warn(`Failed to download image ${imageIndex}:`, error);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });

  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(zipBlob);
  downloadLink.download = `FBM_${opts.itemNumber}.zip`;
  downloadLink.click();

  URL.revokeObjectURL(downloadLink.href);
}
