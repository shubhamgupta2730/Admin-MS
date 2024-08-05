import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

export const deleteCategory = async (req: CustomRequest, res: Response) => {
  const id = req.query.id as string;
  const userId = req.user?.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Invalid category ID',
    });
  }

  if (!userId) {
    return res.status(400).json({
      message: 'User ID is required',
    });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    if (category.createdBy.toString() !== userId) {
      return res.status(403).json({
        message: 'You do not have permission to delete this category',
      });
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      message: 'Category removed successfully',
    });
  } catch (error) {
    console.error('Error removing category:', error);
    res.status(500).json({
      message: 'An error occurred while removing the category',
    });
  }
};
