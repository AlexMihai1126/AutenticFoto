import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type StorageProvider = "gcs" | "ipfs";

export interface IGeneratedFile extends Document {
  _id: Types.ObjectId;
  originalPhotoId?: Types.ObjectId;
  originalName: string;
  mimeType: string;
  sha256: string;
  storageProvider: StorageProvider;
  fullPath: string;
  originalUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedFileSchema = new Schema<IGeneratedFile>(
  {
    originalPhotoId: {
      type: Schema.Types.ObjectId,
      ref:"ImageModel"
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sha256: {
      type: String,
      required: true,
      lowercase:true,
      unique: true,
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ["gcs", "ipfs"],
      required: true,
    },
    fullPath: {
      type: String,
      required: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GeneratedFileModel: Model<IGeneratedFile> = mongoose.model<IGeneratedFile>(
  "GeneratedFileModel",
  GeneratedFileSchema,
  "generatedfiles"
);

export default GeneratedFileModel;
