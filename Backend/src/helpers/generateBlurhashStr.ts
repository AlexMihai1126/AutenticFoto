import sharp from "sharp";
import { encode } from "blurhash";

/**
 * Funcție ce generează BlurHash pentru afișare în UI.
 */
export default async function generateBlurhash(buffer: Buffer): Promise<string> {
  const image = await sharp(buffer).resize(64, 64, {
    fit: "inside",
    withoutEnlargement: true,
  });

  const { data, info } = await image
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    5,
    4
  );

  return blurhash;
}
