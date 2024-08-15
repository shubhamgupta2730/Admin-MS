import { Response } from 'express';
import Discount from '../../../models/discountModel';
import { Types } from 'mongoose';

interface Request {
  body: {
    startDate: string;
    endDate: string;
    discount: number;
    code: string;
    type: 'sellingPrice' | 'MRP';
  };
  user?: {
    userId: Types.ObjectId;
  };
}

export const addDiscount = async (req: Request, res: Response) => {
  const { startDate, endDate, discount, code, type } = req.body;

  try {
    // Validate startDate
    if (!startDate || typeof startDate !== 'string') {
      return res
        .status(400)
        .json({ message: 'Start date is required and must be a valid string' });
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        message:
          'Invalid start date format. Please provide a valid date in YYYY-MM-DD format',
      });
    }

    // Validate endDate
    if (!endDate || typeof endDate !== 'string') {
      return res
        .status(400)
        .json({ message: 'End date is required and must be a valid string' });
    }

    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({
        message:
          'Invalid end date format. Please provide a valid date in YYYY-MM-DD format',
      });
    }

    // Ensure startDate is before endDate
    if (start >= end) {
      return res
        .status(400)
        .json({ message: 'Start date must be before end date' });
    }

    // Check that startDate is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res
        .status(400)
        .json({ message: 'Start date cannot be in the past' });
    }

    if (!discount) {
      return res.status(401).json({
        message: 'Discount field is required.',
      });
    }

    // Validate discount
    if (typeof discount !== 'number' || isNaN(discount)) {
      return res
        .status(400)
        .json({ message: 'Discount must be a valid number' });
    }

    if (discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ message: 'Discount must be a number between 0 and 100' });
    }

    if (!code) {
      return res.status(401).json({
        message: 'code field is required.',
      });
    }

    // Validate code
    if (typeof code !== 'string' || code.trim() === '') {
      return res
        .status(400)
        .json({ message: 'Discount code  must be a non-empty string' });
    }

    // // Check for unique code
    // const existingDiscount = await Discount.findOne({ code: code.trim() });
    // if (existingDiscount) {
    //   return res.status(400).json({ message: 'Discount code already exists' });
    // }

    // Validate type
    if (!type) {
      return res.status(400).json({
        message: 'type field is required with either MRP or sellingPrice.',
      });
    }
    if (type !== 'MRP' && type !== 'sellingPrice') {
      return res.status(400).json({
        message: 'Invalid type. Type must be either MRP or sellingPrice',
      });
    }

    // Validate user ID
    if (!req.user?.userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    const adminId = req.user.userId;

    // Set start and end times for the discount
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const newDiscount = new Discount({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      discount,
      code,
      type,
      isActive: new Date() >= start && new Date() <= end,
      createdBy: new Types.ObjectId(adminId),
    });

    await newDiscount.save();

    return res.status(201).json({
      message: 'Discount created successfully',
      discount: newDiscount,
    });
  } catch (error) {
    console.error('Failed to create discount:', error);
    return res
      .status(500)
      .json({ message: 'Failed to create discount', error });
  }
};
