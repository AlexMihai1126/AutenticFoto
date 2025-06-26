import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  generatedFileId: Types.ObjectId;
  attestationUID: string;
  txHash: string;
  blockHash: string;
  blockNumber: number;
  gasPaid?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
    },
    generatedFileId: {
      type: Schema.Types.ObjectId,
      ref: "GeneratedFileModel",
      required: true
    },
    attestationUID: {
      type: String,
      required: true,
      lowercase:true,
      unique: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
      lowercase:true,
      index: true,
    },
    blockHash:{
      type:String,
      lowercase:true,
      required:true
    },
    blockNumber: {
      type: Number,
      required: true,
      index: true,
    },
    gasPaid: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const TransactionModel: Model<ITransaction> =
  mongoose.model<ITransaction>(
    "TransactionModel",
    TransactionSchema,
    "transactions"
  );

export default TransactionModel;
