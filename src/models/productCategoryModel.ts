import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  isActive: boolean;
}

const categorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Category = model<ICategory>('Category', categorySchema);

export default Category;
