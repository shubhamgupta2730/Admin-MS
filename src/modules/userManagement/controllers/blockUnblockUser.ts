import { Request, Response } from 'express';
import User from '../../../models/userModel';
import mongoose, { Types } from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

// Block/Unblock a user
export const toggleBlockUser = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const { action } = req.body;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const adminId = req.user.userId;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: 'Invalid user or admin ID' });
    }

    if (action !== 'block' && action !== 'unblock') {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'block') {
      if (user.isBlocked) {
        return res.status(400).json({ message: 'User is already blocked' });
      }
      user.isBlocked = true;
      user.blockedBy = new mongoose.Types.ObjectId(adminId);
    } else if (action === 'unblock') {
      if (!user.isBlocked) {
        return res.status(400).json({ message: 'User is not blocked' });
      }
      user.isBlocked = false;
      user.blockedBy = null;
    }

    await user.save();

    res.status(200).json({
      message: `User ${action}ed successfully`,
      userId: user._id,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
