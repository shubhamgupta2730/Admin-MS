import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Category from '../../../models/productCategoryModel';
import User from '../../../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

export const getAllProducts = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const {
      search,
      sort,
      page = '1',
      limit = '10',
      status,
      categoryName,
    } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);

    if (pageNumber <= 0 || pageSize <= 0) {
      return res.status(400).json({
        message: 'Page number and limit must be greater than 0',
      });
    }

    const match: any = { isDeleted: false };

    if (status === 'blocked') {
      match.isBlocked = true;
    } else if (status === 'unblocked') {
      match.isBlocked = false;
    }

    // Filter by category name
    if (categoryName) {
      const category = await Category.findOne({
        name: new RegExp(categoryName as string, 'i'),
      });
      if (category) {
        match.categoryId = category._id;
      } else {
        match.categoryId = null;
      }
    }

    if (search) {
      match.$or = [
        { name: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
      ];
    }

    const sortOptions: any = {};
    if (sort) {
      const [sortField, sortOrder] = (sort as string).split(':');
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    }

    const products = await Product.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users', 
          localField: 'createdBy',
          foreignField: '_id',
          as: 'sellerDetails',
        },
      },
      { $unwind: { path: '$sellerDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories', 
          localField: 'categoryId', 
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          categoryId: 1,
          categoryName: { $ifNull: ['$categoryDetails.name', 'Unknown'] }, 
          isBlocked: 1,
          isDeleted: 1,
          isActive: 1,
          sellerId: 1,
          sellerName: { $concat: ['$sellerDetails.firstName', ' ', '$sellerDetails.lastName'] },
        },
      },
      {
        $facet: {
          metadata: [
            { $count: 'total' },
            { $addFields: { page: pageNumber, limit: pageSize } },
          ],
          data: [
            { $sort: sortOptions },
            { $skip: (pageNumber - 1) * pageSize },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    const result = products[0];
    const totalProducts = result.metadata.length ? result.metadata[0].total : 0;
    const totalPages = Math.ceil(totalProducts / pageSize);

    res.status(200).json({
      message: 'Products retrieved successfully',
      data: result.data,
      pagination: {
        total: totalProducts,
        page: pageNumber,
        limit: pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to retrieve products', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
