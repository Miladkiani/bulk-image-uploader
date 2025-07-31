self.onmessage = async (e) => {
  const { files } = e.data;

  if (!Array.isArray(files)) return;

  const processed = await Promise.all(
    files.map(async (file) => {
      const resizedDataUrl = await resizeImage(file);
      return {
        name: file.name,
        url: resizedDataUrl,
        id: `${file.name}_${file.size}_${Date.now()}`,
      };
    })
  );

  self.postMessage({ thumbs: processed });
};

async function resizeImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(120, 120);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, 120, 120);

  const blob = await canvas.convertToBlob();
  return await blobToBase64(blob);
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
