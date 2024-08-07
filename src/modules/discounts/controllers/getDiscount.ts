import { Request, Response } from 'express';
import Discount from '../../../models/discountModel';

export const getDiscountById = async (req: Request, res: Response) => {
  const { id } = req.query;

  try {
    // Check if ID is provided
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        message: 'Discount ID is required',
      });
    }

    // Fetch the discount from the database
    const discount = await Discount.findById(id);

    // Check if discount exists
    if (!discount) {
      return res.status(404).json({
        message: 'Discount not found',
      });
    }

    // Return the necessary fields
    const response = {
      id: discount._id,
      startDate: discount.startDate,
      endDate: discount.endDate,
      discount: discount.discount,
      code: discount.code,
      isActive: discount.isActive,
      createdBy: discount.createdBy,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch discount', error });
  }
};
