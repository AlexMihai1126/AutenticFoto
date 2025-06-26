import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
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
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await mongoose.model('ImageModel').updateMany(
      { category: doc._id },
      { $set: { category: null } }
    );
  }
});


export const CategoryModel: Model<ICategory> = mongoose.model<ICategory>(
  "CategoryModel",
  CategorySchema,
  "categories"
);

export default CategoryModel;
