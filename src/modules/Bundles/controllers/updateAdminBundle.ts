import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/adminBundleModel';
import Product from '../../../models/productModel';

interface ProductInfo {
  productId: string;
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

  if (typeof discount !== 'number' || discount < 0 || discount > 100) {
    return res.status(400).json({
      message: 'Discount percentage must be a number between 0 and 100',
    });
  }

  const productIds: mongoose.Types.ObjectId[] = [];
  for (const product of products) {
    if (!product.productId) {
      return res.status(400).json({
        message: 'Each product must have a valid productId',
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
      isBlocked: { $ne: true },
      isDeleted: { $ne: true },
    }).exec();

    if (activeProducts.length !== productIds.length) {
      return res.status(403).json({
        message: 'One or more products are not active, blocked, or deleted',
      });
    }

    const uniqueProductIds = new Set(productIds.map((id) => id.toString()));
    if (uniqueProductIds.size !== productIds.length) {
      return res.status(400).json({
        message: 'Duplicate products are not allowed in the bundle',
      });
    }

    // Calculate the new total MRP by adding the new products' MRP to the existing MRP
    let totalMRP = existingBundle.MRP;
    activeProducts.forEach((product) => {
      totalMRP += product.MRP;
    });

    // Calculate the new selling price based on the discount
    let sellingPrice = totalMRP;
    if (discount) {
      sellingPrice = totalMRP - totalMRP * (discount / 100);
    }

    // Merge existing products with new products
    const existingProducts = existingBundle.products.map((p) =>
      p.productId.toString()
    );
    const newProducts = products
      .filter((p) => !existingProducts.includes(p.productId))
      .map((p) => ({
        productId: new mongoose.Types.ObjectId(p.productId),
      }));

    existingBundle.name = name;
    existingBundle.description = description;
    existingBundle.MRP = totalMRP;
    existingBundle.sellingPrice = sellingPrice;
    existingBundle.discount = discount;
    existingBundle.products.push(...newProducts);
    existingBundle.updatedAt = new Date();

    const updatedBundle = await existingBundle.save();

    // Update products to reflect the bundle they are part of
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { bundleIds: updatedBundle._id } }
    );

    return res.status(200).json({
      message: 'Bundle updated successfully',
      bundle: updatedBundle,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
