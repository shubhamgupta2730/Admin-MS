import { Request, Response } from 'express';
import Category from '../../../models/productCategoryModel';

export const createCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({
      message: 'Name and description are required',
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
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while creating the category',
    });
  }
};
