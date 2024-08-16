import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';
import Category from '../../../models/productCategoryModel'; 

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const createSale = async (req: CustomRequest, res: Response) => {
  const { name, description, startDate, endDate, categories } = req.body;
  const createdBy = req.user?.userId;

  // Validate "name"
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      message: 'The name field is required and cannot be empty or whitespace.',
    });
  }
  if (!/^[a-zA-Z0-9\s]{3,}$/.test(name.trim())) {
    return res.status(400).json({
      message: 'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
    });
  }

  // Validate "description"
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({
      message: 'The description field is required and cannot be empty or whitespace.',
    });
  }
  if (!/^[a-zA-Z0-9\s]{5,}$/.test(description.trim())) {
    return res.status(400).json({
      message: 'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
    });
  }

  // Validate "startDate"
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return res.status(400).json({
      message: 'The startDate field is required and must be in yyyy-mm-dd format.',
    });
  }

  // Validate "endDate"
  if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return res.status(400).json({
      message: 'The endDate field is required and must be in yyyy-mm-dd format.',
    });
  }

  // Validate "categories"
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({
      message: 'The categories field must be a non-empty array.',
    });
  }

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format for startDate.',
    });
  }

  if (isNaN(end.getTime())) {
    return res.status(400).json({
      message: 'Invalid date format for endDate.',
    });
  }

  // Ensure startDate is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return res.status(400).json({
      message: 'The startDate cannot be in the past.',
    });
  }

  // Ensure startDate is before endDate
  if (start >= end) {
    return res.status(400).json({
      message: 'startDate must be earlier than endDate.',
    });
  }

  // Validate each category entry
  const validCategories = [];
  for (const category of categories) {
    if (!category.categoryId || !mongoose.Types.ObjectId.isValid(category.categoryId)) {
      return res.status(400).json({
        message: 'Each category must have a valid categoryId.',
      });
    }
    if (typeof category.discount !== 'number' || category.discount <= 0 || category.discount > 100) {
      return res.status(400).json({
        message: 'Each category must have a valid discount between 0 and 100.',
      });
    }

    const cat = await Category.findById(category.categoryId);
    if (!cat || !cat.isActive) {
      return res.status(400).json({
        message: `Category with ID ${category.categoryId} is either inactive or deleted.`,
      });
    }

    validCategories.push({
      categoryId: category.categoryId,
      discount: category.discount,
    });
  }

  // Validate "createdBy"
  if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
    return res.status(400).json({
      message: 'Invalid createdBy user ID.',
    });
  }

  try {
    const sale = new Sale({
      name: name.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      categories: validCategories,
      createdBy,
      isActive: start <= new Date() && new Date() <= end,
    });

    await sale.save();

    return res.status(201).json({
      message: 'Sale created successfully',
      sale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to create sale',
      error: err.message,
    });
  }
};
