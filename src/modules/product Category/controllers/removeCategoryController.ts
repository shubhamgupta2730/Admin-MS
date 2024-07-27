import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';

export const deleteCategory = async (req: Request, res: Response) => {
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

    category.isActive = false;
    await category.save();

    res.status(200).json({
      message: 'Category marked as inactive successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while marking the category as inactive',
    });
  }
};
