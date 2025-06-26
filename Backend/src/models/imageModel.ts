import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ICategory } from "./categoryModel";
import { ITag } from "./tagModel";
import { ethers } from "ethers";

export type StorageProvider = "gcs" | "ipfs";

export type AspectRatioTypes = "landscape" | "portrait" | "square" | "unknown";

export const ASPECT_LANDSCAPE : AspectRatioTypes = "landscape";
export const ASPECT_PORTRAIT : AspectRatioTypes = "portrait";
export const ASPECT_SQUARE : AspectRatioTypes = "square";

export interface IImage extends Document {
  _id: Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  originalName: string;
  mimeType: string;
  sha256: string;
  storageProvider: StorageProvider;
  fullPath: string;
  previewPath: string;
  highResPreviewPath: string;
  originalWidth: number;
  originalHeight: number;
  location?: string;
  aspectRatioType: AspectRatioTypes;
  ethPriceStr: string;
  ethPriceWei: Types.Decimal128;
  category?: Types.ObjectId | ICategory;
  tags?: (Types.ObjectId | ITag)[];
  isRevoked?: boolean;
  attestationUID?: string;
  previewUrl: string;
  highResPreviewUrl: string;
  originalUrl: string;
  blurhashStr: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    title: {
      type: String,
      maxlength: 80,
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
      required: false,
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
      lowercase: true,
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
    previewPath: {
      type: String,
      required: true,
    },
    highResPreviewPath: {
      type: String,
      required: true,
    },
    originalWidth: {
      type: Number,
      required: true,
    },
    originalHeight: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      maxlength: 128,
    },
    aspectRatioType: {
      type: String,
      enum: ["landscape", "portrait", "square", "unknown"],
      required: true,
      default: "unknown",
    },
    ethPriceStr: {
      type: String,
      required: true,
    },
    ethPriceWei: {
      type: Types.Decimal128,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CategoryModel",
      required: false,
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "TagModel",
        required: false,
        index: true,
      },
    ],
    isRevoked: {
      type: Boolean,
      required: true,
      default: false,
    },
    attestationUID: {
      type: String,
      required: false,
      lowercase: true,
      index: true,
    },
    previewUrl: {
      type: String,
      required: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    highResPreviewUrl: {
      type: String,
      required: true,
    },
    blurhashStr: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ImageSchema.pre("save", function (next) {
  if (this.ethPriceStr) {
    try {
      const parsed = ethers.parseEther(this.ethPriceStr);
      this.ethPriceWei = mongoose.Types.Decimal128.fromString(
        parsed.toString()
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err: any) {
      return next(new Error(`ethPriceStr invalid : ${this.ethPriceStr}`));
    }
  }
  next();
});

ImageSchema.pre("save", function (next) {
  if (this.isModified("ethPriceStr") && this.attestationUID) {
    return next(new Error("Prețul nu se mai poate modifica după atestare."));
  }
  next();
});

ImageSchema.pre("deleteOne", { document: true, query: false }, function (next) {
  if (this.attestationUID) {
    return next(
      new Error("Nu se poate șterge o fotografie atestată pe blockchain.")
    );
  }
  next();
});

ImageSchema.pre("findOneAndDelete", async function (next) {
  const photo = await this.model.findOne(this.getFilter());
  if (photo?.attestationUID) {
    return next(
      new Error("Nu se poate șterge o fotografie atestată pe blockchain.")
    );
  }
  next();
});

export const ImageMetadataModel: Model<IImage> = mongoose.model<IImage>(
  "ImageModel",
  ImageSchema,
  "images"
);

export default ImageMetadataModel;
