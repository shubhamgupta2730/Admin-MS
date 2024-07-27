import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.query;
  const { name, description, isActive } = req.body;

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

  if (!name && !description && isActive === undefined) {
    return res.status(400).json({
      message:
        'At least one field (name, description, or isActive) is required for update',
    });
  }

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    if (name) category.name = name;
    if (description) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while updating the category',
    });
  }
};
