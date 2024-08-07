import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/adminBundleModel';
import Product from '../../../models/productModel';

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

export const createBundle = async (req: CustomRequest, res: Response) => {
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
    // Validation for name and description
    if (!name || !description) {
      return res.status(400).json({
        message: 'Name and description are required',
      });
    }

    // Validation for products array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Products array is required and should not be empty',
      });
    }

    // Validation for discount percentage
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return res.status(400).json({
        message: 'Discount percentage must be a number between 0 and 100',
      });
    }

    // Validate product details and gather product IDs
    const productIds: mongoose.Types.ObjectId[] = [];
    for (const product of products) {
      if (
        !product.productId ||
        typeof product.quantity !== 'number' ||
        product.quantity <= 0
      ) {
        return res.status(400).json({
          message:
            'Each product must have a valid productId and a quantity greater than zero',
        });
      }
      productIds.push(new mongoose.Types.ObjectId(product.productId));
    }

    // Validate active, non-blocked, and non-deleted products
    const activeProducts = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
    }).exec();

    if (activeProducts.length !== productIds.length) {
      return res.status(403).json({
        message: 'One or more products are not active, blocked, or deleted',
      });
    }

    // Ensure no duplicate products
    const uniqueProductIds = new Set(productIds.map((id) => id.toString()));
    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        message: 'Duplicate products are not allowed in the bundle',
      });
    }

    // Calculate total MRP and validate product prices
    let totalMRP = 0;
    const productPriceMap: { [key: string]: number } = {};
    activeProducts.forEach((product) => {
      const productId = (product._id as mongoose.Types.ObjectId).toString();
      productPriceMap[productId] = product.sellingPrice;
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

    // Calculate selling price based on discount
    let sellingPrice = totalMRP;
    if (discount) {
      sellingPrice = totalMRP - totalMRP * (discount / 100);
    }

    // Create and save the new bundle
    const newBundle = new Bundle({
      name,
      description,
      MRP: totalMRP,
      sellingPrice,
      discount,
      products: products.map((p) => ({
        productId: new mongoose.Types.ObjectId(p.productId),
        quantity: p.quantity,
      })),
      createdBy: {
        id: new mongoose.Types.ObjectId(userId),
        role: userRole,
      },
      isActive: true,
    });

    const savedBundle = await newBundle.save();

    // Update products with the bundle ID
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
