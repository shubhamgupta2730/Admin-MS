import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import { Types } from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

export const getProductInfo = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const productId = req.query.productId as string;

    if (!Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('-__v');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ data: product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
