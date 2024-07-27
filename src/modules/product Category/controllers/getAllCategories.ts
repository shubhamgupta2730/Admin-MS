import { Request, Response } from 'express';
import Category from '../../../models/productCategoryModel';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      message: 'Categories retrieved successfully',
      categories,
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while fetching the categories',
    });
  }
};
