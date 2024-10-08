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

export const removeBundle = async (req: CustomRequest, res: Response) => {
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
    if (!existingBundle || existingBundle.isDeleted) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the bundle was created by an admin
    if (existingBundle.createdBy.role !== 'admin') {
      return res.status(403).json({
        message: 'You do not have permission to delete this bundle',
      });
    }

    // Remove bundleId from products that are part of the bundle
    const productIds = existingBundle.products.map((p) => p.productId);

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $unset: { bundleIds: '' } }
    );

    // Remove the bundleId from the Discount model
    await Discount.updateMany(
      { bundleIds: bundleId },
      { $pull: { bundleIds: bundleId } }
    );

    // Soft delete the bundle
    existingBundle.isDeleted = true;
    await existingBundle.save();

    return res.status(200).json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    console.error('Error while deleting bundle:', error);
    return res.status(500).json({ message: 'Failed to delete bundle', error });
  }
};
