import { Request, Response } from 'express';
import Discount from '../../..//models/discountModel';

export const updateDiscount = async (req: Request, res: Response) => {
  const { discountId } = req.query;
  const { startDate, endDate, discount, code, isActive } = req.body;

  try {
    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      { startDate, endDate, discount, code, isActive },
      { new: true }
    );

    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    res
      .status(200)
      .json({ message: 'Discount updated successfully', updatedDiscount });
  } catch (error) {
    res.status(500).json({ message: 'Discount not updated. ' });
  }
};
