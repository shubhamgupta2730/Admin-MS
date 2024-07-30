import mongoose, { Schema, Document, model } from 'mongoose';

export interface IAdminBundle extends Document {
  name: string;
  description: string;
  MRP: number;
  sellingPrice: number;
  discountPercentage: number;
  products: { productId: mongoose.Types.ObjectId; quantity: number }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const AdminBundleSchema: Schema<IAdminBundle> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    MRP: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminBundle = model<IAdminBundle>('AdminBundle', AdminBundleSchema);

export default AdminBundle;
