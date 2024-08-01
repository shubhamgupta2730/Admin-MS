import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BundleProduct, Product } from '../../../models/index';

interface ProductInfo {
  productId: string;
  quantity: number;
}

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const createAdminBundle = async (req: CustomRequest, res: Response) => {
  const {
    name,
    description,
    products,
    discount,
  }: {
    name: string;
    description: string;
    products: ProductInfo[];
    discount: number;
  } = req.body;

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (!name || !description) {
      return res.status(400).json({
        message: 'Name and description are required',
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Products array is required and should not be empty',
      });
    }

    if (discount < 0 || discount > 100) {
      return res.status(400).json({
        message: 'Discount percentage must be between 0 and 100',
      });
    }

    const productIds: mongoose.Types.ObjectId[] = [];
    for (const product of products) {
      if (!product.productId || product.quantity <= 0) {
        return res.status(400).json({
          message:
            'Each product must have a valid productId and a quantity greater than zero',
        });
      }
      productIds.push(new mongoose.Types.ObjectId(product.productId));
    }

    const activeProducts = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).exec();

    if (activeProducts.length !== productIds.length) {
      return res.status(403).json({
        message: 'One or more products are not active or do not exist',
      });
    }

    const uniqueProductIds = new Set(productIds.map((id) => id.toString()));
    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        message: 'Duplicate products are not allowed in the bundle',
      });
    }

    let totalMRP = 0;
    const productPriceMap: { [key: string]: number } = {};

    activeProducts.forEach((product) => {
      const productId = (product._id as mongoose.Types.ObjectId).toString();
      productPriceMap[productId] = product.MRP;
    });

    for (const productInfo of products) {
      const productId = productInfo.productId;
      const quantity = productInfo.quantity;

      if (!productPriceMap[productId]) {
        return res
          .status(404)
          .json({ message: `Product with ID ${productId} not found` });
      }

      totalMRP += productPriceMap[productId] * quantity;
    }

    let sellingPrice = totalMRP;
    if (discount) {
      sellingPrice = totalMRP - totalMRP * (discount / 100);
    }

    const newBundle = new BundleProduct({
      name,
      description,
      MRP: totalMRP,
      sellingPrice,
      discount,
      products: products.map((p) => ({
        productId: new mongoose.Types.ObjectId(p.productId),
        quantity: p.quantity,
      })),
      createdBy: new mongoose.Types.ObjectId(userId),
      createdByRole: userRole,
      isActive: true,
    });

    const savedBundle = await newBundle.save();

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { bundleId: savedBundle._id } }
    );

    res.status(201).json({
      message: 'Bundle created successfully',
      bundle: savedBundle,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create bundle', error });
  }
};
