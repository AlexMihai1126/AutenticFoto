import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LinkType = "gcs" | "ipfs" | "signed-url";

export const IPFS_LINK : LinkType = "ipfs";
export const SIGNED_URL_LINK : LinkType = "signed-url";

export interface IDownloadLink extends Document {
  _id: Types.ObjectId;
  generatedFileId: Types.ObjectId;
  userId: Types.ObjectId;
  linkType: LinkType;
  linkUrl: string;
  downloadToken: string;
  expiresAt?: Date;
  downloadCount: number;
  maxDownloads?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DownloadLinkSchema = new Schema<IDownloadLink>(
  {
    generatedFileId: {
      type: Schema.Types.ObjectId,
      ref: "GeneratedFileModel",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    linkType: {
      type: String,
      enum: ["gcs", "ipfs", "signed-url"],
      required: true,
      default: "signed-url",
    },
    linkUrl: {
      type: String,
      required: true,
    },
    downloadToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: { type: Date },
    downloadCount: {
      type: Number,
      required: false,
      default: 0,
    },
    maxDownloads: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

DownloadLinkSchema.index({ userId: 1, downloadToken: 1 });

DownloadLinkSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { linkType: "signed-url" },
  }
);

export const DownloadLinkModel: Model<IDownloadLink> =
  mongoose.model<IDownloadLink>(
    "DownloadLinkModel",
    DownloadLinkSchema,
    "downloadlinks"
  );

export default DownloadLinkModel;
