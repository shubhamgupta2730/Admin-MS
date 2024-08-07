import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/adminBundleModel';

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
    const bundle = await Bundle.findById(bundleId)
      .select(
        'name description MRP discount adminDiscount sellingPrice   products createdBy createdByRole isActive createdAt updatedAt'
      )
      .exec();

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    return res.status(200).json({
      message: 'Bundle retrieved successfully',
      bundle,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to retrieve bundle', error });
  }
};
