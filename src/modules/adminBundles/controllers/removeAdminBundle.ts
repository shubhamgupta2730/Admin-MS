import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BundleProduct, Product } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const deleteAdminBundle = async (req: CustomRequest, res: Response) => {
  const { bundleId }: { bundleId: string } = req.body;

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'Admin') {
    return res
      .status(403)
      .json({ message: 'Forbidden: Access is allowed only for Admins' });
  }

  if (!bundleId || !mongoose.Types.ObjectId.isValid(bundleId)) {
    return res.status(400).json({ message: 'Invalid or missing bundle ID' });
  }

  try {
    const existingBundle = await BundleProduct.findById(bundleId).exec();
    if (!existingBundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Check if the admin who created the bundle is the one trying to delete it
    if (existingBundle.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to delete this bundle' });
    }

    // Remove bundleId from products that are part of the bundle
    const productIds = existingBundle.products.map((p) => p.productId);

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $unset: { bundleId: '' } }
    );

    // Delete the bundle
    await BundleProduct.findByIdAndDelete(bundleId).exec();

    return res.status(200).json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete bundle', error });
  }
};
