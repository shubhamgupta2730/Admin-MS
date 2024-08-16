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

export const updateSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const { name, description, startDate, endDate, categories } = req.body;

  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  let updateFields: any = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({
        message: 'The name field cannot be empty or whitespace.',
      });
    }
    if (!/^[a-zA-Z0-9\s]{3,}$/.test(name.trim())) {
      return res.status(400).json({
        message:
          'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
      });
    }
    updateFields.name = name.trim();
  }

  if (description !== undefined) {
    if (!description.trim()) {
      return res.status(400).json({
        message: 'The description field cannot be empty or whitespace.',
      });
    }
    if (!/^[a-zA-Z0-9\s]{5,}$/.test(description.trim())) {
      return res.status(400).json({
        message:
          'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
      });
    }
    updateFields.description = description.trim();
  }

  let start: Date | undefined;
  let end: Date | undefined;

  try {
    const sale = await Sale.findById(saleId);
    if (!sale || sale.isDeleted) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    if (startDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return res.status(400).json({
          message: 'The startDate must be in yyyy-mm-dd format.',
        });
      }
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          message: 'Invalid date format for startDate.',
        });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        return res.status(400).json({
          message: 'The startDate cannot be in the past.',
        });
      }
      updateFields.startDate = start;
    } else {
      start = sale.startDate;
    }

    if (endDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({
          message: 'The endDate must be in yyyy-mm-dd format.',
        });
      }
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          message: 'Invalid date format for endDate.',
        });
      }
      if (start && start >= end) {
        return res.status(400).json({
          message: 'endDate must be later than startDate.',
        });
      }
      if (end < new Date()) {
        return res.status(400).json({
          message: 'The endDate cannot be in the past.',
        });
      }
      updateFields.endDate = end;
    }

    if (start && !endDate) {
      if (sale.endDate && start >= sale.endDate) {
        return res.status(400).json({
          message: 'startDate must be earlier than the current endDate.',
        });
      }
    }

    if (categories !== undefined) {
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          message: 'The categories field must be a non-empty array.',
        });
      }

      const validCategories = await Promise.all(categories.map(async (category) => {
        if (!category.categoryId || !mongoose.Types.ObjectId.isValid(category.categoryId)) {
          return { valid: false, message: 'Invalid categoryId.' };
        }

        const cat = await Category.findById(category.categoryId);
        if (!cat ||  !cat.isActive) {
          return { valid: false, message: 'Category is either inactive or deleted.' };
        }

        if (typeof category.discount !== 'number' || category.discount <= 0 || category.discount > 100) {
          return { valid: false, message: 'Invalid discount value.' };
        }

        return { valid: true, category };
      }));

      const invalidCategory = validCategories.find(cat => !cat.valid);
      if (invalidCategory) {
        return res.status(400).json({
          message: invalidCategory.message,
        });
      }

      const existingCategories = sale.categories || [];
      const newCategories = validCategories.map(cat => cat.category);

      updateFields.categories = [...existingCategories, ...newCategories];
    }

    if (start || end) {
      const now = new Date();
      updateFields.isActive =
        (start || sale.startDate) <= now &&
        now <= (end || sale.endDate);
    }

    const updatedSale = await Sale.findOneAndUpdate(
      { _id: saleId, isDeleted: false },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    return res.status(200).json({
      message: 'Sale updated successfully',
      sale: updatedSale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to update sale',
      error: err.message,
    });
  }
};
