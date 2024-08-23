import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const updateSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const { name, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  const updateFields: any = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({
        message: 'The name field cannot be empty or whitespace.',
      });
    }
    if (!/^[a-zA-Z0-9\s]{3,}$/.test(name.trim())) {
      return res.status(400).json({
        message:
          'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
      });
    }
    updateFields.name = name.trim();
  }

  if (description !== undefined) {
    if (!description.trim()) {
      return res.status(400).json({
        message: 'The description field cannot be empty or whitespace.',
      });
    }
    if (!/^[a-zA-Z0-9\s]{5,}$/.test(description.trim())) {
      return res.status(400).json({
        message:
          'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
      });
    }
    updateFields.description = description.trim();
  }

  try {
    const updatedSale = await Sale.findOneAndUpdate(
      { _id: saleId, isDeleted: false },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    return res.status(200).json({
      message: 'Sale updated successfully',
      sale: updatedSale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to update sale',
      error: err.message,
    });
  }
};
