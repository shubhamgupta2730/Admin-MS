import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';

interface CustomRequest extends Request {
  query: {
    id?: string;
  };
}

export const getCategory = async (req: CustomRequest, res: Response) => {
  const id = req.query.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Invalid or missing category ID',
    });
  }

  try {
    const category = await Category.findOne({ _id: id, isActive: true });
    if (!category) {
      return res.status(404).json({
        message: 'Category not found or inactive',
      });
    }

    res.status(200).json({
      message: 'Category retrieved successfully',
      category,
    });
  } catch (error) {
    console.error('Error retrieving category:', error);
    res.status(500).json({
      message: 'An error occurred while retrieving the category',
    });
  }
};
