import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const getAllSales = async (req: CustomRequest, res: Response) => {
  const {
    search,
    sortBy,
    sortOrder,
    page = 1,
    limit = 10,
    isActive,
  } = req.query;

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);

  const sortField = sortBy ? (sortBy as string) : 'createdAt';
  const sortDirection = sortOrder === 'desc' ? -1 : 1;

  // Build the query object
  const searchQuery: any = {};

  if (search) {
    searchQuery.name = { $regex: search as string, $options: 'i' };
  }

  searchQuery.isDeleted = false;

  if (isActive !== undefined) {
    searchQuery.isActive = isActive === 'true';
  }

  try {
    const sales = await Sale.find(searchQuery)
      .populate({
        path: 'categories.categoryId',
        select: 'name',
      })
      .sort({ [sortField]: sortDirection })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const totalSales = await Sale.countDocuments(searchQuery);

    const formattedSales = sales.map((sale) => ({
      id: sale._id,
      name: sale.name,
      description: sale.description,
      startDate: sale.startDate.toLocaleDateString(),
      endDate: sale.endDate.toLocaleDateString(),
      isActive: sale.isActive,
      // categories: sale.categories.map((cat) => ({
      //   categoryId: cat.categoryId._id,
      //   categoryName: (cat.categoryId as any).name,
      //   discount: cat.discount,
      // })),
      // createdBy: sale.createdBy,
    }));

    return res.status(200).json({
      message: 'Sales retrieved successfully',
      sales: formattedSales,
      page: pageNumber,
      totalPages: Math.ceil(totalSales / limitNumber),
      totalSales,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to retrieve sales',
      error: err.message,
    });
  }
};
