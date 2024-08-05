import { Request, Response } from 'express';
import Bundle from '../../../models/adminBundleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const getAllBundles = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const {
    page = 1,
    limit = 10,
    search = '',
    sortField = 'createdAt',
    sortOrder = 'desc',
    showBlocked = false,
    showAll = false,
  } = req.query;

  if (!userId || !userRole) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (userRole !== 'admin') {
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
    const matchStage: any = {
      $match: {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      },
    };

    if (!showAll) {
      matchStage.$match.isActive = true;
    }

    if (showBlocked) {
      matchStage.$match.isBlocked = true;
    }

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

    const bundlesAggregation = await Bundle.aggregate([
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
