import { Response } from 'express';
import Discount from '../../../models/discountModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/adminBundleModel';
import { Types } from 'mongoose';

interface Request {
  body: {
    startDate: string;
    endDate: string;
    discount: number;
    code: string;
    productIds?: Types.ObjectId[];
    bundleIds?: Types.ObjectId[];
  };
  user?: {
    userId: Types.ObjectId;
  };
}

export const addDiscount = async (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    discount,
    code,
    productIds = [],
    bundleIds = [],
  }: {
    startDate: string;
    endDate: string;
    discount: number;
    code: string;
    productIds?: Types.ObjectId[];
    bundleIds?: Types.ObjectId[];
  } = req.body;

  try {
    // Check if required fields are present
    if (!startDate || !endDate || typeof discount !== 'number' || !code) {
      return res.status(400).json({
        message: 'Start date, end date, discount, and code are required',
      });
    }

    // Convert user-friendly date format to ISO 8601
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T23:59:59Z`);

    // Validate date formats
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message:
          'Invalid date format. Please provide valid start and end dates in YYYY-MM-DD format',
      });
    }

    // Check if start date is before end date
    if (start >= end) {
      return res.status(400).json({
        message: 'Start date must be before end date',
      });
    }

    // Validate discount value
    if (discount < 0 || discount > 100) {
      return res.status(400).json({
        message: 'Discount must be a number between 0 and 100',
      });
    }

    // Check if code is a string and not empty
    if (typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({
        message: 'Discount code must be a non-empty string',
      });
    }

    // Validate user ID
    if (!req.user?.userId) {
      return res.status(400).json({
        message: 'User ID is required',
      });
    }
    const adminId = req.user.userId;

    // Validate product and bundle IDs
    const validProductIds = [];
    for (const productId of productIds) {
      const product = await Product.findOne({
        _id: productId,
        isBlocked: false,
        isActive: true,
        isDeleted: false,
      });
      if (product) validProductIds.push(productId);
    }

    const validBundleIds = [];
    for (const bundleId of bundleIds) {
      const bundle = await Bundle.findOne({
        _id: bundleId,
        isBlocked: false,
        isActive: true,
        isDeleted: false,
      });
      if (bundle) validBundleIds.push(bundleId);
    }

    const newDiscount = new Discount({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      discount,
      code,
      isActive: new Date() >= start && new Date() <= end,
      createdBy: new Types.ObjectId(adminId),
      productIds: validProductIds,
      bundleIds: validBundleIds,
    });

    await newDiscount.save();
    res.status(201).json({
      message: 'Discount created successfully',
      discount: newDiscount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create discount', error });
  }
};
