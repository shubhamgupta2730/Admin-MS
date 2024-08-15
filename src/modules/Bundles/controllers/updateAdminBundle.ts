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
    name?: string;
    description?: string;
    products?: ProductInfo[];
    discount?: number;
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

    let totalMRP = existingBundle.MRP;
    let newProducts: mongoose.Types.ObjectId[] = [];

    if (products && Array.isArray(products) && products.length > 0) {
      const productIds = products.map((p) =>
        new mongoose.Types.ObjectId(p.productId)
      );

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

      // Calculate the new total MRP based on the new products
      totalMRP = activeProducts.reduce(
        (acc, product) => acc + product.MRP,
        existingBundle.MRP
      );

      // Filter out existing products and add only new ones
      const existingProducts = new Set(
        existingBundle.products.map((p) => p.productId.toString())
      );
      newProducts = productIds.filter(
        (id) => !existingProducts.has(id.toString())
      );

      existingBundle.products.push(
        ...newProducts.map((id) => ({ productId: id }))
      );

      // Update the bundle field for the products
      await Product.updateMany(
        { _id: { $in: newProducts } },
        { $addToSet: { bundleIds: existingBundle._id } }
      );
    }

    // Update the fields that are provided
    if (name) existingBundle.name = name;
    if (description) existingBundle.description = description;

    // Calculate the selling price based on the discount if provided
    if (typeof discount === 'number' && discount >= 0 && discount <= 100) {
      existingBundle.discount = discount;
      existingBundle.sellingPrice = totalMRP - totalMRP * (discount / 100);
    } else {
      // If discount is not provided, recalculate based on the existing discount
      existingBundle.sellingPrice =
        totalMRP - totalMRP * (existingBundle.discount / 100);
    }

    existingBundle.MRP = totalMRP;
    existingBundle.updatedAt = new Date();

    const updatedBundle = await existingBundle.save();

    return res.status(200).json({
      message: 'Bundle updated successfully',
      bundle: updatedBundle,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update bundle', error });
  }
};
