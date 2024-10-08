import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'superAdmin';
}

const AdminSchema: Schema<IAdmin> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superAdmin'],
      required: true,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

const Admin = model<IAdmin>('Admin', AdminSchema);

export default Admin;
