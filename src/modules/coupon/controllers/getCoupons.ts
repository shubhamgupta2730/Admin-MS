import { Request, Response } from 'express';
import Coupon from '../../../models/couponModel';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

// Get Coupon by ID
export const getCouponById = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const id = req.query.id as string;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }

    // Fetch the coupon by ID
    const coupon = await Coupon.findById(id);

    // Check if the coupon exists
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Return full coupon details
    return res.status(200).json({
      message: 'Coupon fetched successfully',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};
