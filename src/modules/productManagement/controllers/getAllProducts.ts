import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Category from '../../../models/productCategoryModel';

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
      page = 1,
      limit = 10,
      status,
      categoryName,
    } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);

    const match: any = { isDeleted: false };

    // Filter by status
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

    // Search by name or description
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
        $project: {
          password: 0,
          __v: 0,
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
      data: result.data,
      totalProducts,
      totalPages,
      currentPage: pageNumber,
      pageSize,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
