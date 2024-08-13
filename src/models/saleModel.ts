import mongoose, { Schema, Document } from 'mongoose';

interface ISaleProduct {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  discount: number;
}

interface ISaleBundle {
  bundleId: mongoose.Types.ObjectId;
  quantity: number;
  discount: number;
}

interface ISale extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  products: ISaleProduct[];
  bundles: ISaleBundle[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleProductSchema = new Schema<ISaleProduct>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const saleBundleSchema = new Schema<ISaleBundle>({
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'Bundle',
    required: true,
  },
  quantity: { type: Number, required: true },
  discount: { type: Number, required: true },
});

const saleSchema = new Schema<ISale>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  products: [saleProductSchema],
  bundles: [saleBundleSchema],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISale>('Sale', saleSchema);
