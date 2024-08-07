import { Request, Response } from 'express';
import Discount from '../../../models/discountModel';

export const getAllDiscounts = async (req: Request, res: Response) => {
  const {
    code,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = req.query;

  try {
    // Create query object for filtering
    const query: any = {};
    if (code) {
      query.code = { $regex: code, $options: 'i' }; // Case-insensitive search
    }

    // Pagination parameters
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Sorting parameters
    const sortCriteria: any = {};
    sortCriteria[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Fetch discounts with filtering, sorting, and pagination
    const discounts = await Discount.find(query)
      .select('startDate endDate discount code isActive createdBy') // Select only necessary fields
      .sort(sortCriteria)
      .skip(skip)
      .limit(pageSize);

    // Total count for pagination
    const totalCount = await Discount.countDocuments(query);

    res.status(200).json({
      discounts,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch discounts', error });
  }
};
