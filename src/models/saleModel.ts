import mongoose, { Schema, Document } from 'mongoose';

interface ISaleCategory {
  categoryId: mongoose.Types.ObjectId;
  discount: number;
}

interface ISale extends Document {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  categories: ISaleCategory[];
  isActive: boolean;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleCategorySchema = new Schema<ISaleCategory>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  discount: { type: Number, required: true },
});

const saleSchema = new Schema<ISale>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  categories: [saleCategorySchema],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISale>('Sale', saleSchema);
