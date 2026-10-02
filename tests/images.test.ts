import assert from "node:assert/strict";
import test from "node:test";
import { validateRaster } from "../src/client/images.ts";

test("SVG and GIF cannot be accepted just by renaming their files", () => {
  assert.throws(
    () => validateRaster(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")),
    /image-format/,
  );
  assert.throws(() => validateRaster(new TextEncoder().encode("GIF89a")), /image-format/);
});

test("APNG and animated WebP chunks are rejected before decoding", () => {
  const png = new Uint8Array(24);
  png.set([137, 80, 78, 71, 13, 10, 26, 10]);
  png.set(new TextEncoder().encode("acTL"), 12);
  assert.throws(() => validateRaster(png), /image-format/);
  const webp = new Uint8Array(20);
  webp.set(new TextEncoder().encode("RIFF"));
  webp.set(new TextEncoder().encode("WEBPANIM"), 8);
  assert.throws(() => validateRaster(webp), /image-format/);
});

test("truncated raster chunks are rejected", () => {
  const webp = new Uint8Array(20);
  webp.set(new TextEncoder().encode("RIFF"));
  webp.set(new TextEncoder().encode("WEBPVP8 "), 8);
  new DataView(webp.buffer).setUint32(16, 100, true);
  assert.throws(() => validateRaster(webp), /image-invalid/);
});
