import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/adminBundleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const toggleBlockBundle = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const bundleId = req.query.bundleId as string;
  const { action } = req.body;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Forbidden: Access is allowed only for Admins' });
  }

  if (!mongoose.Types.ObjectId.isValid(bundleId)) {
    return res.status(400).json({ message: 'Invalid bundle ID' });
  }

  if (!action || (action !== 'block' && action !== 'unblock')) {
    return res
      .status(400)
      .json({ message: 'Action must be either "block" or "unblock"' });
  }

  try {
    const bundle = await Bundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    const isCurrentlyBlocked = bundle.isBlocked;
    if (action === 'block' && isCurrentlyBlocked) {
      return res.status(400).json({ message: 'Bundle is already blocked' });
    }

    if (action === 'unblock' && !isCurrentlyBlocked) {
      return res.status(400).json({ message: 'Bundle is already unblocked' });
    }

    bundle.isBlocked = action === 'block';
    await bundle.save();

    return res.status(200).json({
      message: `Bundle ${action}ed successfully`,
      bundle,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to toggle block status', error });
  }
};
