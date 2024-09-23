import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';
import Admin from '../../../models/authModel';

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
    const existingCategory = await Category.findOne({ name, isActive: true });
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

    // Fetch admin details
    const admin = await Admin.findById(createdBy).select('name');
    if (!admin) {
      return res.status(400).json({
        message: 'Admin not found',
      });
    }

    // Prepare the response object
    const categoryObject = {
      id: category._id,
      name: category.name,
      description: category.description,
      createdBy: {
        id: admin._id,
        name: admin.name,
      },
    };

    res.status(201).json({
      message: 'Category created successfully',
      category: categoryObject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'An error occurred while creating the category',
    });
  }
};
