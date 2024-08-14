import { Request, Response } from 'express';
import User from '../../../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

export const getAllUsers = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { search, sort, page = 1, limit = 10, status, role } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);

    const match: any = {};

    // Filter by block status
    if (status === 'blocked') {
      match.isBlocked = true;
    } else if (status === 'unblocked') {
      match.isBlocked = false;
    }

    // Filter by role
    if (role === 'user' || role === 'seller') {
      match.role = role;
    }

    // Search by email, name, or phone
    if (search) {
      match.$or = [
        { email: new RegExp(search as string, 'i') },
        { firstName: new RegExp(search as string, 'i') },
        { lastName: new RegExp(search as string, 'i') },
        { phone: new RegExp(search as string, 'i') },
      ];
    }

    const sortOptions: any = {};
    if (sort) {
      const [sortField, sortOrder] = (sort as string).split(':');
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    }

    const users = await User.aggregate([
      { $match: match },
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          phone: 1,
          role: 1,
          isBlocked: 1,
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

    const result = users[0];
    const totalUsers = result.metadata.length ? result.metadata[0].total : 0;
    const totalPages = Math.ceil(totalUsers / pageSize);

    res.status(200).json({
      data: result.data,
      totalUsers,
      totalPages,
      currentPage: pageNumber,
      pageSize,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
