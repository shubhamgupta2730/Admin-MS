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

export const updateBundle = async (req: CustomRequest, res: Response) => {
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

  const bundleId = req.query.bundleId as string;

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Forbidden: Access is allowed only for Admins' });
  }

  if (!bundleId || !mongoose.Types.ObjectId.isValid(bundleId)) {
    return res.status(400).json({ message: 'Invalid or missing bundle ID' });
  }

  if (!name || !description) {
    return res
      .status(400)
      .json({ message: 'Name and description are required' });
  }

  if (!Array.isArray(products) || products.length === 0) {
    return res
      .status(400)
      .json({ message: 'Products array is required and should not be empty' });
  }

  if (discount < 0 || discount > 100) {
    return res
      .status(400)
      .json({ message: 'Discount percentage must be between 0 and 100' });
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

  try {
    const existingBundle = await Bundle.findById(bundleId).exec();
    if (!existingBundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the bundle was created by an admin
    if (existingBundle.createdBy.role !== 'admin') {
      return res.status(403).json({
        message: 'You do not have permission to update this bundle',
      });
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

    existingBundle.name = name;
    existingBundle.description = description;
    existingBundle.MRP = totalMRP;
    existingBundle.sellingPrice = sellingPrice;
    existingBundle.discount = discount;
    existingBundle.products = products.map((p) => ({
      productId: new mongoose.Types.ObjectId(p.productId),
      quantity: p.quantity,
    }));
    existingBundle.updatedAt = new Date();

    const updatedBundle = await existingBundle.save();

    // Update products to reflect the bundle they are part of
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { bundleId: updatedBundle._id } }
    );

    // Remove bundleId from products that are no longer in the bundle
    const removedProductIds = existingBundle.products
      .filter((p) => !productIds.includes(p.productId))
      .map((p) => p.productId);

    await Product.updateMany(
      { _id: { $in: removedProductIds } },
      { $unset: { bundleId: '' } }
    );

    return res.status(200).json({
      message: 'Bundle updated successfully',
      bundle: updatedBundle,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
