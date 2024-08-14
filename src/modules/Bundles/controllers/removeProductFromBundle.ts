import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/adminBundleModel';
import Product from '../../../models/productModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const removeProductFromBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId, productId } = req.query as { bundleId: string; productId: string };

  // const productIdUpdated = productId as unknown as mongoose.Types.ObjectId;

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Access is allowed only for Admins' });
  }

  if (!bundleId || !mongoose.Types.ObjectId.isValid(bundleId)) {
    return res.status(400).json({ message: 'Invalid or missing bundle ID' });
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const existingBundle = await Bundle.findOne({_id: bundleId, isBlocked:false, isDeleted:false}).exec();
    if (!existingBundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the product is in the bundle
    const productIndex = existingBundle.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in the bundle' });
    }

    // Get the product to be removed
    const productToRemove = await Product.findById(productId).exec();
    if (!productToRemove) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate the new MRP by subtracting the MRP of the removed product
    const removedProductMRP = productToRemove.MRP;
    existingBundle.MRP -= removedProductMRP;

    // Recalculate the selling price
    let sellingPrice = existingBundle.MRP;
    if (existingBundle.discount) {
      sellingPrice = existingBundle.MRP - existingBundle.MRP * (existingBundle.discount / 100);
    }

    // Remove the product from the bundle
    existingBundle.products.splice(productIndex, 1);
    existingBundle.sellingPrice = sellingPrice;
    existingBundle.updatedAt = new Date();

    const updatedBundle = await existingBundle.save();

    // Remove the bundleId from the product
    await Product.findByIdAndUpdate(productId, { $pull: { bundleIds: updatedBundle._id } });

    return res.status(200).json({
      message: 'Product removed from bundle successfully',
      bundle: updatedBundle,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove product from bundle', error });
  }
};
