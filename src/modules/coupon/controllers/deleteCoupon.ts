import { Request, Response } from 'express';
import Coupon from '../../../models/couponModel';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

// Soft Delete Coupon API
export const deleteCoupon = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const id = req.query.id as string;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }

    // Find the coupon by ID and check if it exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if the coupon is already deleted
    if (coupon.isDeleted) {
      return res.status(400).json({ message: 'Coupon is already deleted' });
    }

    // Perform soft delete by setting `isDeleted` to true
    coupon.isDeleted = true;
    await coupon.save();

    return res.status(200).json({
      message: 'Coupon  deleted successfully',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};
