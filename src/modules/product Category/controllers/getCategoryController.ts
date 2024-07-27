import { Request, Response } from 'express';
import Category from '../../../models/productCategoryModel';
import mongoose from 'mongoose';

export const getCategoryById = async (req: Request, res: Response) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      message: 'Category ID is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id.toString())) {
    return res.status(400).json({
      message: 'Invalid Category ID format',
    });
  }

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }
    res.status(200).json({
      message: 'Category retrieved successfully',
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while fetching the category',
    });
  }
};
