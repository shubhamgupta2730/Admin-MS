import { Request, Response } from 'express';
import mongoose from 'mongoose';
import moment from 'moment';
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
      message:
        'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
    });
  }

  // Validate "description"
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({
      message:
        'The description field is required and cannot be empty or whitespace.',
    });
  }
  if (!/^[a-zA-Z0-9\s]{5,}$/.test(description.trim())) {
    return res.status(400).json({
      message:
        'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
    });
  }

  // Validate "startDate"
  if (!startDate || !moment(startDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
    return res.status(400).json({
      message:
        'The startDate field is required and must be in yyyy-mm-dd HH:mm:ss format.',
    });
  }

  // Validate "endDate"
  if (!endDate || !moment(endDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
    return res.status(400).json({
      message:
        'The endDate field is required and must be in yyyy-mm-dd HH:mm:ss format.',
    });
  }

  // Parse dates
  const start = moment(startDate, 'YYYY-MM-DD HH:mm:ss');
  const end = moment(endDate, 'YYYY-MM-DD HH:mm:ss');

  // Ensure startDate is not in the past
  if (start.isBefore(moment())) {
    return res.status(400).json({
      message: 'The startDate and time cannot be in the past.',
    });
  }

  // Ensure startDate is before endDate with time
  if (!end.isAfter(start)) {
    return res.status(400).json({
      message: 'The endDate and time must be after the startDate and time.',
    });
  }

  // Validate "categories"
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({
      message: 'The categories field must be a non-empty array.',
    });
  }

  // Check for overlapping sales
  const overlappingSale = await Sale.findOne({
    $or: [
      {
        startDate: { $lte: end.toDate() },
        endDate: { $gte: start.toDate() },
      },
      {
        startDate: { $lte: start.toDate() },
        endDate: { $gte: end.toDate() },
      },
    ],
    isDeleted: false,
  });

  if (overlappingSale) {
    return res.status(400).json({
      message: 'A sale already exists within the specified time period.',
    });
  }

  // Validate each category entry
  const validCategories = [];
  for (const category of categories) {
    if (
      !category.categoryId ||
      !mongoose.Types.ObjectId.isValid(category.categoryId)
    ) {
      return res.status(400).json({
        message: 'Each category must have a valid categoryId.',
      });
    }
    if (
      typeof category.discount !== 'number' ||
      category.discount <= 0 ||
      category.discount > 100
    ) {
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
      startDate: start.toDate(),
      endDate: end.toDate(),
      categories: validCategories,
      createdBy,
      isActive: start.isSameOrBefore(moment()) && end.isSameOrAfter(moment()),
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
