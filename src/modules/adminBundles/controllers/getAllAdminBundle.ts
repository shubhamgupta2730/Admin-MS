import { Request, Response } from 'express';
import AdminBundle from '../../../models/adminBundleModel';

export const getAllBundles = async (req: Request, res: Response) => {
  try {
    // Destructure query parameters
    const {
      search,
      sortBy,
      sortOrder = 'asc',
      page = 1,
      limit = 10,
    } = req.query;

    // Build the search filter
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Calculate pagination values
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Build the sort options
    const sortOptions: { [key: string]: 1 | -1 } = {};
    if (sortBy) {
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    }

    // Fetch the bundles with the applied filters, sorting, and pagination
    const bundles = await AdminBundle.find(searchFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // Get the total count of bundles for pagination purposes
    const totalBundles = await AdminBundle.countDocuments(searchFilter);

    res.status(200).json({
      bundles,
      totalBundles,
      totalPages: Math.ceil(totalBundles / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ message: 'Bundles not found' });
  }
};
