import { Request, Response } from 'express';
import Discount from '../../../models/discountModel';
import Admin from '../../../models/adminBundleModel';

export const getDiscountById = async (req: Request, res: Response) => {
  const { id } = req.query;

  try {
    // Check if ID is provided
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        message: 'Discount ID is required',
      });
    }

    // Fetch the discount from the database
    const discount = await Discount.findById(id);

    // Check if discount exists
    if (!discount) {
      return res.status(404).json({
        message: 'Discount not found',
      });
    }

    // Fetch the admin details
    const admin = await Admin.findById(discount.createdBy);
    const adminName = admin ? `${admin.name}` : 'Unknown';
    const adminId = discount.createdBy;

    // Format the dates
    const formattedStartDate = new Date(discount.startDate).toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    const formattedEndDate = new Date(discount.endDate).toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    const response = {
      id: discount._id,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      discount: discount.discount,
      code: discount.code,
      isActive: discount.isActive,
      products: discount.productIds,
      bundles: discount.bundleIds,
      createdBy: {
        name: adminName,
        id: adminId,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch discount', error });
  }
};
