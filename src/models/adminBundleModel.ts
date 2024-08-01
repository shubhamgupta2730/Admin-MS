import mongoose, { Schema, Document } from 'mongoose';

interface IProductInfo {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

interface IBundleProduct extends Document {
  name: string;
  description: string;
  MRP: number;
  sellingPrice: number;
  products: { productId: mongoose.Types.ObjectId; quantity: number }[];
  createdBy: mongoose.Types.ObjectId;
  createdByRole: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema<IBundleProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  MRP: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discount: { type: Number, required: true },
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  createdBy: {
    type: mongoose.Types.ObjectId,
    refPath: 'createdByRole',
    required: true,
  },
  createdByRole: { type: String, enum: ['User', 'Admin'], required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBundleProduct>(
  'BundleProduct',
  bundleProductSchema
);
