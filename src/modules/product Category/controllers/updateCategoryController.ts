import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category, { ICategory } from '../../../models/productCategoryModel';
import Admin from '../../../models/authModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

interface CategoryDocument extends Document, ICategory {
  _id: mongoose.Types.ObjectId;
}

export const updateCategory = async (req: CustomRequest, res: Response) => {
  const id = req.query.id as string;
  const { name, description } = req.body;
  const userId = req.user?.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Invalid category ID',
    });
  }

  if (!name && !description) {
    return res.status(400).json({
      message: 'At least one of name or description is required to update',
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
        message: 'You do not have permission to update this category',
      });
    }

    const existingCategory = (await Category.findOne({
      name,
      isActive: true,
    })) as CategoryDocument | null;
    if (existingCategory && existingCategory._id.toString() !== id) {
      return res.status(400).json({
        message:
          'Category with this name already exists. Please choose another name.',
      });
    }

    if (name) category.name = name;
    if (description) category.description = description;

    await category.save();

    // Fetch admin details
    const admin = await Admin.findById(category.createdBy)
      .select('name')
      .exec();
    if (!admin) {
      return res.status(400).json({
        message: 'Admin not found',
      });
    }

    // Format dates
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const categoryObject = {
      id: category._id,
      name: category.name,
      description: category.description,
      createdAt: formatDate(category.createdAt),
      updatedAt: formatDate(category.updatedAt),
      createdBy: {
        id: admin._id,
        name: admin.name,
      },
    };

    res.status(200).json({
      message: 'Category updated successfully',
      category: categoryObject,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      message: 'An error occurred while updating the category',
    });
  }
};
