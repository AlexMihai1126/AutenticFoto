import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type Role = "user" | "admin";
export type UserType = "buyer" | "seller" | "owner";
export const USER_BUYER: UserType = "buyer";
export const USER_SELLER: UserType = "seller";
export const USER_OWNER: UserType = "owner";
export const ADMIN_ROLE: Role = "admin";
export const USER_ROLE: Role = "user";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  confirmationToken: string;
  confirmed: boolean;
  walletAddress: string;
  attestationUID: string;
  blockchainConfirmed: boolean;
  role: Role;
  type: UserType;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
      match: /^[a-zA-Z0-9]+$/, // validează nume de utilizator doar cu litere și cifre
    },
    confirmationToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    confirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    walletAddress: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    attestationUID: {
      type: String,
      required: false,
      lowercase:true,
      trim: true,
    },
    blockchainConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    type: {
      type: String,
      enum: ["buyer", "seller", "owner"],
      default: "buyer",
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ attestationUID: 1 }, { unique: true, sparse: true });

UserSchema.index({ walletAddress: 1 }, { unique: true, sparse: true });

export const UserDataModel: Model<IUser> = mongoose.model<IUser>(
  "UserModel",
  UserSchema,
  "users"
);

export default UserDataModel;
