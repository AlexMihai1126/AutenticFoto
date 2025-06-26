/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
import sharp from "sharp";
import {
  getHiResPreviewsBucket,
  getOriginalsBucket,
  getPreviewsBucket,
} from "./gcsConfig";
import generateFilename from "../helpers/generateUniqueFilename";
import { FileData, StreamFileData, UploadedFileData } from "./gcsInterfaces";
import logger from "../helpers/logger/loggerConfig";
import { File } from "@google-cloud/storage";
const modulePrefix = "[GCSUploader]";

export class GCSFileService {
  private static storageProviderStr: string = "gcs";

  static async uploadOriginal(file: FileData): Promise<UploadedFileData> {
    const originals = getOriginalsBucket();
    const generatedName = generateFilename(file.originalName);
    try {
      await originals.file(generatedName).save(file.buffer, {
        metadata: { contentType: file.mimeType },
        resumable: false,
      });
      return {
        originalName: file.originalName,
        mimeType: file.mimeType,
        fullPath: generatedName,
        storageProvider: this.storageProviderStr,
      };
    } catch (error) {
      try {
        await getOriginalsBucket().file(generatedName).delete();
      } catch (_) {}
      logger.error(`${modulePrefix} Eroare la incărcarea fișierului:`, error);
      throw new Error("Eroare la incărcarea fișierului în GCS");
    }
  }

  static async uploadWithPreview(
    file: FileData,
    previewWidth: number = 640,
    hiResPrevWidth: number = 1920
  ): Promise<UploadedFileData> {
    const originals = getOriginalsBucket();
    const previews = getPreviewsBucket();
    const hiResPrev = getHiResPreviewsBucket();

    const generatedName = generateFilename(file.originalName);
    const previewName = `preview_${generatedName}`;
    const hiResPreviewName = `hirespreview_${generatedName}`;
    try {
      const imageMeta = await sharp(file.buffer).metadata();
      const width = imageMeta.width || 0;
      const height = imageMeta.height || 0;

      const previewBuffer = await sharp(file.buffer)
        .resize({ width: previewWidth })
        .toBuffer();

      const hiResPreviewBuffer = await sharp(file.buffer)
        .resize({ width: hiResPrevWidth })
        .toBuffer();

      await previews.file(previewName).save(previewBuffer, {
        metadata: { contentType: file.mimeType },
        resumable: false,
      });

      await hiResPrev.file(hiResPreviewName).save(hiResPreviewBuffer, {
        metadata: { contentType: file.mimeType },
        resumable: false,
      });

      await originals.file(generatedName).save(file.buffer, {
        metadata: { contentType: file.mimeType },
        resumable: false,
      });

      return {
        originalName: file.originalName,
        mimeType: file.mimeType,
        origWidth: width,
        origHeight: height,
        storageProvider: this.storageProviderStr,
        fullPath: generatedName,
        previewPath: previewName,
        hiResPreviewPath: hiResPreviewName,
      };
    } catch (error) {
      try {
        await getPreviewsBucket().file(previewName).delete();
      } catch (_) {}
      try {
        await getHiResPreviewsBucket().file(hiResPreviewName).delete();
      } catch (_) {}
      try {
        await getOriginalsBucket().file(generatedName).delete();
      } catch (_) {}
      logger.error(`${modulePrefix} Eroare la incărcarea fișierului:`, error);
      throw new Error("Eroare la incărcarea fișierului în GCS");
    }
  }

  static async downloadOriginalAsFileData(fileKey: string): Promise<FileData> {
    const bucket = getOriginalsBucket();
    const fileDownload: File = bucket.file(fileKey);

    try {
      const [exists] = await fileDownload.exists();
      if (!exists) {
        throw new Error(
          `${modulePrefix} Fișierul "${fileKey}" nu există în GCS "${bucket.name}"`
        );
      }

      const [meta, buffer] = await Promise.all([
        fileDownload.getMetadata().then((r) => r[0]),
        fileDownload.download().then((r) => r[0]),
      ]);

      const contentType = meta.contentType;
      if (!contentType) {
        throw new Error(`${modulePrefix} Metadata lipsă pentru "${fileKey}"`);
      }

      return {
        originalName: meta.name || fileKey,
        buffer,
        mimeType: contentType,
      };
    } catch (err: any) {
      logger.error(`${modulePrefix} Eroare la descărcare "${fileKey}":`, err);
      throw err;
    }
  }

  static async downloadOriginalAsStream(
    fileKey: string
  ): Promise<StreamFileData> {
    const bucket = getOriginalsBucket();
    const file: File = bucket.file(fileKey);

    try {
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(
          `${modulePrefix} Fișierul "${fileKey}" nu există în GCS "${bucket.name}"`
        );
      }

      const [meta] = await file.getMetadata();
      const contentType = meta.contentType;
      if (!contentType) {
        throw new Error(`${modulePrefix}: Metadata lipsă pentru "${fileKey}"`);
      }
      const originalName = meta.name || fileKey;

      const stream = file.createReadStream();

      return { stream, originalName, mimeType: contentType };
    } catch (err: any) {
      logger.error(
        `${modulePrefix} Eroare creare stream pentru "${fileKey}":`,
        err
      );
      throw err;
    }
  }
}
