import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Discount from '../../../models/discountModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/adminBundleModel';

export const removeDiscount = async (req: Request, res: Response) => {
  const discountId = req.query.discountId as string;

  // Validate discountId
  if (!discountId || !mongoose.Types.ObjectId.isValid(discountId)) {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  try {
    // Retrieve the discount
    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Check if the discount is already inactive
    if (discount.isDeleted) {
      return res.status(400).json({ message: 'Discount is already removed' });
    }

    // Set discount to inactive
    discount.isDeleted = true;
    await discount.save();

    // Update associated products
    if (discount.productIds && discount.productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: discount.productIds } },
        { $set: { adminDiscount: null } }
      );
    }

    // Update associated bundles
    if (discount.bundleIds && discount.bundleIds.length > 0) {
      await Bundle.updateMany(
        { _id: { $in: discount.bundleIds } },
        { $set: { adminDiscount: null } }
      );
    }

    res.status(200).json({
      message: 'Discount removed successfully',
      discount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove discount', error });
  }
};
