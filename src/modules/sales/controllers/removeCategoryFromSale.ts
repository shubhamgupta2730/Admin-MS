import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';
import Category from '../../../models/productCategoryModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const removeCategoriesFromSale = async (
  req: CustomRequest,
  res: Response
) => {
  const saleId = req.query.saleId as string;
  const { categoryIds }: { categoryIds: string[] } = req.body;

  // Validate Sale ID
  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  // Validate Category IDs
  if (
    !Array.isArray(categoryIds) ||
    categoryIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
  ) {
    return res.status(400).json({
      message: 'Invalid category ID(s).',
    });
  }

  try {
    // Find the sale
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false });

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    const removedCategories: string[] = [];
    const notFoundCategories: string[] = [];

    // Process each categoryId
    for (const categoryId of categoryIds) {
      const categoryIndex = sale.categories.findIndex(
        (cat) => cat.categoryId.toString() === categoryId
      );

      if (categoryIndex !== -1) {
        // Remove the category from the sale
        sale.categories.splice(categoryIndex, 1);
        removedCategories.push(categoryId);
      } else {
        notFoundCategories.push(categoryId);
      }
    }

    if (removedCategories.length > 0) {
      await sale.save();
    }

    return res.status(200).json({
      message: 'Categories processed successfully.',
      removedCategories,
      notFoundCategories,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to remove categories from sale',
      error: err.message,
    });
  }
};
