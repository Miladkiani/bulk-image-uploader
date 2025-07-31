export async function resizeImage(file: File, maxWidth = 800) {
  try {
    const bitmap = await createImageBitmap(file);

    let scale = maxWidth / bitmap.width;
    if (bitmap.width < maxWidth) scale = 1;

    const width = bitmap.width * scale;
    const height = bitmap.height * scale;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvas.convertToBlob({ type: file.type });

    const arrayBuffer = await blob.arrayBuffer();
    const base64String = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const dataUrl = `data:${blob.type};base64,${base64String}`;

    return {
      name: file.name,
      url: dataUrl,
      id: `${file.name}_${file.size}_${file.lastModified}`,
    };
  } catch (err) {
    console.error("resizeImage error", err);
    throw new Error("Failed to resize image");
  }
}
