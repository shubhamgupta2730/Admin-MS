import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const deleteSale = async (req: CustomRequest, res: Response) => {
  const  saleId  = req.query.saleId as string;

  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  try {
    const sale = await Sale.findOneAndUpdate(
      { _id: saleId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found or already deleted.',
      });
    }

    return res.status(200).json({
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to delete sale',
      error: err.message,
    });
  }
};
