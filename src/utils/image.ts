/**
 * Compresses and resizes a photo before upload so uploads stay fast on mobile data.
 * Max dimension on the long side defaults to 1280px, saved as JPEG (quality 0.8).
 */
export async function compressImage(
  file: File,
  maxLongSide = 1280,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        const longSide = Math.max(width, height);

        if (longSide > maxLongSide) {
          const scale = maxLongSide / longSide;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Unable to initialize image canvas.'));
          return;
        }

        // Fill white background before drawing in case source image has transparency
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('Failed to compress image.'));
              return;
            }
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
            const compressed = new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error('Failed to process image.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };

    img.src = objectUrl;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read image data.'));
      }
    };
    reader.onerror = () => reject(new Error('Unable to read image data.'));
    reader.readAsDataURL(file);
  });
}
