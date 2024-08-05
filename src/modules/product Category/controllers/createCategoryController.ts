import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

export const createCategory = async (req: CustomRequest, res: Response) => {
  const { name, description } = req.body;
  const createdBy = req.user?.userId;

  if (!name || !description) {
    return res.status(400).json({
      message: 'Name and description are required',
    });
  }

  if (!createdBy) {
    return res.status(400).json({
      message: 'User ID is required',
    });
  }

  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        message:
          'Category with this name already exists. Please add another category.',
      });
    }

    const category = new Category({
      name,
      description,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      message: 'An error occurred while creating the category',
    });
  }
};
