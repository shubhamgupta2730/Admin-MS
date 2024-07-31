import { Request, Response } from 'express';
import Discount from '../../..//models/discountModel';

export const removeDiscount = async (req: Request, res: Response) => {
  const { discountId } = req.query;

  try {
    const discount = await Discount.findByIdAndUpdate(
      discountId,
      { isActive: false },
      { new: true }
    );

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    res.status(200).json({
      message: 'Discount removed successfully (soft delete)',
      discount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Discount not removed.' });
  }
};
