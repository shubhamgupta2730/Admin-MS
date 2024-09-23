import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/adminBundleModel';
import Product from '../../../models/productModel';
import Discount from '../../../models/discountModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const getBundle = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const bundleId = req.query.bundleId as string;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Forbidden: Access is allowed only for Admins' });
  }

  if (!bundleId) {
    return res.status(400).json({ message: 'Bundle ID is required' });
  }

  if (!mongoose.Types.ObjectId.isValid(bundleId)) {
    return res.status(400).json({ message: 'Invalid bundle ID' });
  }

  try {
    // Fetch the bundle
    const bundle = await Bundle.findOne({
      _id: bundleId,
      isDeleted: false,
      isActive: true,
      isBlocked: false,
    }).exec();

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Fetch product details
    const productIds = bundle.products.map((p) => p.productId);
    const products = await Product.find({ _id: { $in: productIds } }).exec();

    // Create a map for product details
    const productMap = products.reduce(
      (map, product) => {
        const productId = (product._id as mongoose.Types.ObjectId).toString();
        map[productId] = {
          productId,
          name: product.name,
          MRP: product.MRP,
          sellingPrice: product.sellingPrice,
        };
        return map;
      },
      {} as {
        [key: string]: {
          productId: string;
          name: string;
          MRP: number;
          sellingPrice: number;
        };
      }
    );

    // Construct the response
    const responseBundle = {
      _id: (bundle._id as mongoose.Types.ObjectId).toString(),
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      adminDiscount: bundle.adminDiscount,
      discountId: bundle.discountId,
      products: bundle.products.map((p) => productMap[p.productId.toString()]),
    };

    return res.status(200).json({
      message: 'Bundle retrieved successfully',
      bundle: responseBundle,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to retrieve bundle', error });
  }
};
