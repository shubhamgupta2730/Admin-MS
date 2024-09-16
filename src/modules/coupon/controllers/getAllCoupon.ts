import { Request, Response } from 'express';
import Coupon from '../../../models/couponModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const getAllCoupons = async (
  req: CustomRequest,
  res: Response
): Promise<Response> => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'validUntil',
      order = 'asc',
      search = '',
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const sortOrder = order === 'desc' ? -1 : 1;

    const searchQuery = search
      ? { code: { $regex: search, $options: 'i' } }
      : {};

    const totalCoupons = await Coupon.countDocuments(searchQuery);

    const coupons = await Coupon.find(searchQuery)
      .select('code discountType discountValue validUntil')
      .sort({ [sort as string]: sortOrder })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    // Response with coupons and pagination info
    return res.status(200).json({
      message: 'Coupons fetched successfully',
      coupons,
      totalPages: Math.ceil(totalCoupons / pageSize),
      currentPage: pageNumber,
      totalCoupons,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};
