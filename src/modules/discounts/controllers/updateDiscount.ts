import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Discount from '../../../models/discountModel';

export const updateDiscount = async (req: Request, res: Response) => {
  const discountId = req.query.discountId as string;
  const { startDate, endDate, discount, code, isActive } = req.body;

  // Validate discountId
  if (!discountId || !mongoose.Types.ObjectId.isValid(discountId)) {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  // Validate at least one field is present
  if (
    !startDate &&
    !endDate &&
    discount === undefined &&
    !code &&
    isActive === undefined
  ) {
    return res.status(400).json({
      message:
        'At least one field (startDate, endDate, discount, code, or isActive) must be provided',
    });
  }

  // Date format validation
  let start: Date | undefined;
  let end: Date | undefined;
  if (startDate) {
    start = new Date(`${startDate}T00:00:00Z`);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format' });
    }
  }
  if (endDate) {
    end = new Date(`${endDate}T23:59:59Z`);
    if (isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid end date format' });
    }
    if (start && end <= start) {
      return res
        .status(400)
        .json({ message: 'End date must be after start date' });
    }
  }

  // Discount validation
  if (discount !== undefined) {
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ message: 'Discount must be a number between 0 and 100' });
    }
  }

  // Code validation
  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim() === '') {
      return res
        .status(400)
        .json({ message: 'Discount code must be a non-empty string' });
    }
  }

  // isActive validation
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be a boolean' });
  }

  try {
    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        discount,
        code,
        isActive,
      },
      { new: true }
    );

    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    res
      .status(200)
      .json({ message: 'Discount updated successfully', updatedDiscount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update discount', error });
  }
};
