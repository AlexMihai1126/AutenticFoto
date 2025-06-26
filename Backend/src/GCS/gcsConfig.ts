import { Storage, Bucket } from "@google-cloud/storage";
const modulePrefix = "[Server/GCS]";
import logger from "../helpers/logger/loggerConfig";

let originalsBucket: Bucket;
let previewsBucket: Bucket;
let hiResPreviewsBucket : Bucket;

export async function initGCS(): Promise<void> {
  logger.info(`${modulePrefix} Inițializare...`);
  const origName = process.env.GCS_ORIGINALS_BUCKET;
  const prevName = process.env.GCS_PREVIEWS_BUCKET;
  const hiResPrevName = process.env.GCS_HIRES_PREVIEWS_BUCKET;
  if (!origName || !prevName || !hiResPrevName) {
    throw new Error(
      `${modulePrefix} Lipsă variabile ENV: GCS_ORIGINALS_BUCKET, GCS_PREVIEWS_BUCKET sau GCS_HIRES_PREVIEWS_BUCKET.`
    );
  }

  const storage = new Storage();

  originalsBucket = storage.bucket(origName);
  previewsBucket = storage.bucket(prevName);
  hiResPreviewsBucket = storage.bucket(hiResPrevName);

  const [[origExists], [prevExists], [hiResPrevExists]] = await Promise.all([
    originalsBucket.exists(),
    previewsBucket.exists(),
    hiResPreviewsBucket.exists(),
  ]);

  if (!origExists) {
    throw new Error(`Bucket stocare "${origName}" nu există.`)
  }
  if (!prevExists) {
    throw new Error(`Bucket stocare "${prevName}" nu există.`);
  }
  if(!hiResPrevExists) {
    throw new Error(`Bucket stocare "${hiResPrevName}" nu există.`);
  }

  logger.info(`${modulePrefix} Inițializare incheiată.`);
}

export function getOriginalsBucket(): Bucket {
  if (!originalsBucket) {
    throw new Error(`${modulePrefix} originalsBucket nu a fost inițializat.`);
  }
  return originalsBucket;
}

export function getPreviewsBucket(): Bucket {
  if (!previewsBucket) {
    throw new Error(`${modulePrefix} previewsBucket nu a fost inițializat.`);
  }
  return previewsBucket;
}

export function getHiResPreviewsBucket(): Bucket {
  if (!hiResPreviewsBucket) {
    throw new Error(`${modulePrefix} hiResPreviewsBucket nu a fost inițializat.`);
  }
  return hiResPreviewsBucket;
}

