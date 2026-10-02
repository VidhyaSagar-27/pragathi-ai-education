/**
 * Utility to resize, crop, and compress student profile photos on the client side.
 * Compresses phone camera images (often 5-10MB) to ~30-50KB clean JPEGs for database storage.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: string; // 'image/jpeg' | 'image/webp'
}

export async function compressProfileImage(
  fileOrBlob: File | Blob | string,
  options: CompressionOptions = {}
): Promise<{ dataUrl: string; sizeBytes: number; sizeKB: number }> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Center square crop calculation
        const srcWidth = img.width;
        const srcHeight = img.height;
        const minDim = Math.min(srcWidth, srcHeight);
        const startX = (srcWidth - minDim) / 2;
        const startY = (srcHeight - minDim) / 2;

        const targetSize = Math.min(maxWidth, maxHeight, minDim);
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Fill white background in case of transparent PNG/WebP
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Draw cropped and scaled image
        ctx.drawImage(
          img,
          startX,
          startY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        const dataUrl = canvas.toDataURL(mimeType, quality);
        const approxBytes = Math.round((dataUrl.length * 3) / 4);
        const approxKB = Math.round(approxBytes / 1024);

        resolve({
          dataUrl,
          sizeBytes: approxBytes,
          sizeKB: approxKB,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof fileOrBlob === 'string') {
      img.src = fileOrBlob;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(fileOrBlob);
    }
  });
}
