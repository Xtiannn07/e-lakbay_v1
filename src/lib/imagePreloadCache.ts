const preloadedImageUrls = new Set<string>();

export const isImagePreloaded = (url: string) => preloadedImageUrls.has(url);

export const preloadImageUrl = (url: string) =>
  new Promise<void>((resolve) => {
    if (!url) {
      resolve();
      return;
    }

    if (preloadedImageUrls.has(url)) {
      resolve();
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
      }
      preloadedImageUrls.add(url);
      resolve();
    };
    img.onerror = () => {
      preloadedImageUrls.add(url);
      resolve();
    };
    img.src = url;
  });
