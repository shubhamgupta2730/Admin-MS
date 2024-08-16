import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const getSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;

  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  try {
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false }).populate({
      path: 'categories.categoryId',
      select: 'name',
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found.',
      });
    }

    const formattedSale = {
      id: sale._id,
      name: sale.name,
      description: sale.description,
      startDate: sale.startDate.toLocaleDateString(),
      endDate: sale.endDate.toLocaleDateString(),
      isActive: sale.isActive,
      categories: sale.categories.map((cat) => ({
        categoryId: cat.categoryId?._id || 'Unknown',
        categoryName: (cat.categoryId as any)?.name || 'Unknown',
        discount: cat.discount,
      })),
      createdBy: sale.createdBy,
    };

    return res.status(200).json({
      message: 'Sale retrieved successfully',
      sale: formattedSale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to retrieve sale',
      error: err.message,
    });
  }
};
