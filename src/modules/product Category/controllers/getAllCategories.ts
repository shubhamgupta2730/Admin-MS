import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';

interface QueryParams {
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

export const getAllCategories = async (
  req: Request<{}, {}, {}, QueryParams>,
  res: Response
) => {
  // Extract and validate query parameters
  const {
    search,
    sortBy = 'name',
    order = 'asc',
    page = '1',
    limit = '10',
  } = req.query;

  const searchQuery = typeof search === 'string' ? search : '';
  const sortByField = typeof sortBy === 'string' ? sortBy : 'name';
  const sortOrderValue = typeof order === 'string' ? order : 'asc';
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (pageNum <= 0 || limitNum <= 0) {
    return res.status(400).json({
      message: 'Page number and limit must be greater than 0',
    });
  }

  // Create filter and sorting criteria
  const filter: any = { isActive: true };

  if (searchQuery) {
    filter.name = { $regex: searchQuery, $options: 'i' };
  }

  const sortCriteria: any = {
    [sortByField]: sortOrderValue === 'desc' ? -1 : 1,
  };

  try {
    const aggregationPipeline = [
      { $match: filter },
      { $sort: sortCriteria },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
    ];

    // Fetch the categories
    const categories = await Category.aggregate(aggregationPipeline).exec();

    // Get total count of categories for pagination
    const totalCategories = await Category.countDocuments(filter).exec();

    if (!categories.length) {
      return res.status(404).json({ message: 'No categories found' });
    }

    // Return the categories with pagination info
    res.status(200).json({
      categories,
      pagination: {
        total: totalCategories,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCategories / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to retrieve categories',
      error,
    });
  }
};
