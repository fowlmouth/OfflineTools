function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });
}

export async function fileToImage(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error(`Unsupported file type: ${file ? file.type : 'no file provided'}`);
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImageFromUrl(url);
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      url,
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export function revokeObjectURL(url) {
  if (url) URL.revokeObjectURL(url);
}
