import { Request, Response } from 'express';
import Coupon from '../../../models/couponModel';
import mongoose from 'mongoose';

interface UpdateCouponBody {
  code?: string;
  discountType?: 'percentage' | 'flat';
  discountValue?: number;
  minOrderValue?: number;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
}

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

// Update Coupon API
export const updateCoupon = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const id = req.query.id as string;
    const {
      code,
      discountType,
      discountValue,
      minOrderValue,
      usageLimit,
      validFrom,
      validUntil,
    }: UpdateCouponBody = req.body;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }

    // Check if the coupon exists
    const coupon = await Coupon.findOne({ _id: id, isDeleted: false });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Field-specific validations
    if (code && code.trim() === '') {
      return res.status(400).json({ message: 'Coupon code cannot be empty' });
    }

    if (discountType && !['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({ message: 'Invalid discount type' });
    }

    if (
      discountValue !== undefined &&
      (discountValue === null || discountValue <= 0)
    ) {
      return res
        .status(400)
        .json({ message: 'Discount value must be greater than 0' });
    }

    if (
      discountType === 'percentage' &&
      discountValue !== undefined &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res
        .status(400)
        .json({ message: 'Percentage discount must be between 1 and 100' });
    }

    if (
      discountType === 'flat' &&
      discountValue !== undefined &&
      discountValue <= 0
    ) {
      return res
        .status(400)
        .json({ message: 'Flat discount must be greater than 0' });
    }

    if (minOrderValue !== undefined && minOrderValue < 0) {
      return res
        .status(400)
        .json({ message: 'Minimum order value cannot be negative' });
    }

    if (usageLimit !== undefined && usageLimit <= 0) {
      return res
        .status(400)
        .json({ message: 'Usage limit must be greater than 0' });
    }

    // Date validation
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (validFrom) {
      startDate = new Date(validFrom);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Invalid valid from date' });
      }
    }

    if (validUntil) {
      endDate = new Date(validUntil);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid valid until date' });
      }
    }

    if (startDate && startDate < new Date()) {
      return res
        .status(400)
        .json({ message: 'Valid from date cannot be in the past' });
    }

    if (startDate && endDate && endDate <= startDate) {
      return res
        .status(400)
        .json({ message: 'End date must be after the start date' });
    }

    // Check if the coupon code is unique when updating
    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    // Update fields if provided
    if (code) coupon.code = code;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (startDate) coupon.validFrom = startDate;
    if (endDate) coupon.validUntil = endDate;

    // Save the updated coupon
    await coupon.save();

    return res.status(200).json({
      message: 'Coupon updated successfully',
      coupon,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};
