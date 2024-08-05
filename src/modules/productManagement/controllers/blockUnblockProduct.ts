import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import mongoose, { Types } from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

// Block/Unblock a product
export const toggleBlockProduct = async (req: CustomRequest, res: Response) => {
  try {
    const productId = req.query.productId as string;
    const { action } = req.body;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const adminId = req.user.userId;

    if (
      !Types.ObjectId.isValid(productId) ||
      !Types.ObjectId.isValid(adminId)
    ) {
      return res.status(400).json({ message: 'Invalid product or admin ID' });
    }

    if (action !== 'block' && action !== 'unblock') {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.isDeleted) {
      return res.status(400).json({ message: 'Product is already deleted' });
    }

    if (action === 'block') {
      if (product.isBlocked) {
        return res.status(400).json({ message: 'Product is already blocked' });
      }
      product.isBlocked = true;
      product.blockedBy = new mongoose.Types.ObjectId(adminId);
    } else if (action === 'unblock') {
      if (!product.isBlocked) {
        return res.status(400).json({ message: 'Product is not blocked' });
      }
      product.isBlocked = false;
      product.blockedBy = null;
    }

    await product.save();

    res.status(200).json({
      message: `Product ${action}ed successfully`,
      product: {
        _id: product._id,
        name: product.name,
        isBlocked: product.isBlocked,
        blockedBy: product.blockedBy,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
