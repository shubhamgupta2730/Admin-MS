import { Request, Response } from 'express';
import Discount from '../../..//models/discountModel';

export const addDiscount = async (req: Request, res: Response) => {
  const { startDate, endDate, discountPercentage, code } = req.body;

  try {
    const discount = new Discount({
      startDate,
      endDate,
      discountPercentage,
      code,
      isActive: true,
    });

    await discount.save();
    res.status(201).json({ message: 'Discount added successfully', discount });
  } catch (error) {
    res.status(500).json({ message: 'Discount not added.' });
  }
};
