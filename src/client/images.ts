import { isStoredImage, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from "./settings.ts";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;

/** Check actual raster signatures; reject APNG/animated WebP before decoding. */
export function validateRaster(bytes: Uint8Array): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (
    bytes.length >= 24 &&
    bytes[0] === 137 &&
    tag(1) === "PNG\r" &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  ) {
    for (let offset = 8; offset + 12 <= bytes.length; ) {
      const size = view.getUint32(offset);
      if (offset + size + 12 > bytes.length) throw new Error("image-invalid");
      if (tag(offset + 4) === "acTL") throw new Error("image-format");
      offset += size + 12;
    }
    return;
  }
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return;
  if (bytes.length >= 12 && tag(0) === "RIFF" && tag(8) === "WEBP") {
    for (let offset = 12; offset + 8 <= bytes.length; ) {
      const size = view.getUint32(offset + 4, true);
      if (offset + size + 8 > bytes.length) throw new Error("image-invalid");
      if (tag(offset) === "ANIM" || tag(offset) === "ANMF") throw new Error("image-format");
      offset += 8 + size + (size % 2);
    }
    return;
  }
  throw new Error("image-format");
}

export async function normalizeImage(file: File): Promise<string> {
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error("image-size");
  validateRaster(new Uint8Array(await file.arrayBuffer()));
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > MAX_PIXELS
    ) {
      throw new Error("image-dimensions");
    }
    const canvas = document.createElement("canvas");
    try {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("image-invalid");
      for (let edge = MAX_IMAGE_EDGE; edge >= 128; edge = Math.floor(edge * 0.75)) {
        const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL("image/png");
        if (result.length <= Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 22 && isStoredImage(result))
          return result;
      }
      throw new Error("image-size");
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("image-")) throw error;
    throw new Error("image-invalid");
  } finally {
    image.src = "";
    URL.revokeObjectURL(url);
  }
}
