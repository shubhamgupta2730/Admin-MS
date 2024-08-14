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

    const product = await Product.aggregate([
      { $match: { _id: new Types.ObjectId(productId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'sellerDetails',
        },
      },
      { $unwind: { path: '$sellerDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'bundles',
          localField: 'bundleIds',  // Changed to bundleIds (array of bundle IDs)
          foreignField: '_id',
          as: 'bundleDetails',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          MRP: 1,
          sellingPrice: 1,
          discount: 1,
          adminDiscount: 1,
          categoryId: 1,
          categoryName: { $ifNull: ['$categoryDetails.name', 'Unknown'] },
          isBlocked: 1,
          isDeleted: 1,
          isActive: 1,
          sellerId: 1,
          sellerName: { $concat: ['$sellerDetails.firstName', ' ', '$sellerDetails.lastName'] },
          bundleIds: 1,
          bundleNames: {
            $cond: {
              if: { $gt: [{ $size: '$bundleDetails' }, 0] },
              then: '$bundleDetails.name',
              else: [],
            },
          },
        },
      },
    ]);

    if (!product.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ data: product[0] });
  } catch (error) {
    console.error('Failed to retrieve product info', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
