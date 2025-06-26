import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITag extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      maxlength: 80,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await mongoose.model('ImageModel').updateMany(
      { category: doc._id },
      { $set: { category: null } }
    );
  }
});

export const TagModel: Model<ITag> = mongoose.model<ITag>(
  "TagModel",
  TagSchema,
  "tags"
);

export default TagModel;
