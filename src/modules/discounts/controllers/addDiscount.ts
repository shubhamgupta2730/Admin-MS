import { Request, Response } from 'express';
import Discount from '../../../models/discountModel';

// Create a new discount
export const addDiscount = async (req: Request, res: Response) => {
  const { startDate, endDate, discount, code } = req.body;

  try {
    const newDiscount = new Discount({
      startDate,
      endDate,
      discount,
      code,
      isActive:
        new Date(startDate) <= new Date() && new Date(endDate) >= new Date(),
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

