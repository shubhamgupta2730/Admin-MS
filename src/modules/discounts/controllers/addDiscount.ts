import { Response } from 'express';
import Discount from '../../../models/discountModel';
import { Types } from 'mongoose';

interface Request {
  body: {
    startDate: string;
    endDate: string;
    discount: number;
    code: string;
  };
  user?: {
    userId: Types.ObjectId;
  };
}

export const addDiscount = async (req: Request, res: Response) => {
  const { startDate, endDate, discount, code } = req.body;

  try {
    if (!startDate || !endDate || typeof discount !== 'number' || !code) {
      return res.status(400).json({
        message: 'Start date, end date, discount, and code are required',
      });
    }

    // Check for unique code
    const existingDiscount = await Discount.findOne({
      code: code.trim(),
    });

    if (existingDiscount) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Validate date formats
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message:
          'Invalid date format. Please provide valid start and end dates in YYYY-MM-DD format',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        message: 'Start date must be before end date',
      });
    }

    // Check that startDate is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    if (start < today) {
      return res
        .status(400)
        .json({ message: 'Start date cannot be in the past' });
    }

    if (discount < 0 || discount > 100) {
      return res.status(400).json({
        message: 'Discount must be a number between 0 and 100',
      });
    }

    if (typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({
        message: 'Discount code must be a non-empty string',
      });
    }

    if (!req.user?.userId) {
      return res.status(400).json({
        message: 'User ID is required',
      });
    }
    const adminId = req.user.userId;

    const newDiscount = new Discount({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      discount,
      code,
      isActive: new Date() >= start && new Date() <= end,
      createdBy: new Types.ObjectId(adminId),
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
