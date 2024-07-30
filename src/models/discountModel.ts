import { Schema, Document, model } from 'mongoose';

export interface IDiscount extends Document {
  startDate: Date;
  endDate: Date;
  discountPercentage: number;
  code: string;
  isActive: boolean;
}

const discountSchema = new Schema<IDiscount>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    code: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Middleware to set isActive based on current date
discountSchema.pre('save', function (next) {
  const now = new Date();
  this.isActive = this.startDate <= now && this.endDate >= now;
  next();
});

const Discount = model<IDiscount>('Discount', discountSchema);

export default Discount;
