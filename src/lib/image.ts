/** Redimensionne et compresse une image importée afin de limiter la taille stockée. */
export async function compressImage(file: File, maxSize = 600, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier sélectionné n’est pas une image.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Image trop volumineuse (15 Mo maximum).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Impossible de lire cette image.'));
      i.src = url;
    });
    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Traitement de l’image impossible.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
