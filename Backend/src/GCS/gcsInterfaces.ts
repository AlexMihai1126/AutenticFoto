import { Readable } from "stream";

export interface FileData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface UploadedFileData {
  originalName: string;
  mimeType: string;
  origHeight? : number;
  origWidth? : number;
  storageProvider: string;
  fullPath?: string;
  previewPath?: string;
  hiResPreviewPath?: string;
}

export interface StreamFileData extends Omit<FileData, "buffer"> {
  stream: Readable;
}
