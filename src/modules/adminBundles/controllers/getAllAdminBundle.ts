import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BundleProduct } from '../../../models/index';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const getAdminBundles = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const {
    page = 1,
    limit = 10,
    search = '',
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'Admin') {
    return res
      .status(403)
      .json({ message: 'Forbidden: Access is allowed only for Admins' });
  }

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const sortOptions: { [key: string]: 1 | -1 } = {
    [sortField as string]: sortOrder === 'asc' ? 1 : -1,
  };

  try {
    const matchStage = {
      $match: {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      },
    };

    const sortStage = {
      $sort: sortOptions,
    };

    const skipStage = {
      $skip: (pageNumber - 1) * limitNumber,
    };

    const limitStage = {
      $limit: limitNumber,
    };

    const facetStage = {
      $facet: {
        metadata: [{ $count: 'total' }],
        bundles: [matchStage, sortStage, skipStage, limitStage],
      },
    };

    const bundlesAggregation = await BundleProduct.aggregate([
      matchStage,
      sortStage,
      skipStage,
      limitStage,
      facetStage,
    ]);

    const metadata = bundlesAggregation[0]?.metadata[0] || { total: 0 };
    const bundles = bundlesAggregation[0]?.bundles || [];

    return res.status(200).json({
      message: 'Bundles retrieved successfully',
      bundles,
      totalBundles: metadata.total,
      totalPages: Math.ceil(metadata.total / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to retrieve bundles', error });
  }
};
