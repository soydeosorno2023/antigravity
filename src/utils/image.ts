/**
 * Utility to optimize image URLs.
 * It appends parameters for better performance and quality.
 */
export function optimizeImageUrl(url: string, width: number = 800): string {
  if (!url) return '';

  // If it's an Unsplash URL, we can optimize it natively
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams(url.split('?')[1] || '');
    
    // Set optimal parameters
    params.set('auto', 'format,compress');
    params.set('fit', 'crop');
    params.set('q', '75'); // Slightly lower quality for better speed
    params.set('w', width.toString());
    params.set('fm', 'webp'); // Force WebP for better compression
    
    return `${baseUrl}?${params.toString()}`;
  }

  // For other URLs (like Firebase Storage), we use a high-performance image proxy (wsrv.nl)
  // This service is free, open-source, and provides on-the-fly resizing and WebP conversion.
  // It significantly improves mobile performance for user-uploaded content.
  try {
    // Only proxy absolute URLs that aren't already proxied or local
    if (url.startsWith('http') && !url.includes('wsrv.nl')) {
      // Clean the URL to avoid double encoding issues
      const cleanUrl = url.split('?')[0];
      // We keep the original query params if it's Firebase to ensure tokens work
      const fullUrl = url;
      
      return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=${width}&q=75&output=webp&il`;
    }
  } catch (e) {
    console.warn('Error optimizing image URL:', e);
  }
  
  return url;
}

/**
 * Converts a File to WebP format.
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };
  });
}
