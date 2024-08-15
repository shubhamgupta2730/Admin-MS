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

    // Remove discount and recalculate prices for products
    if (discount.productIds && discount.productIds.length > 0) {
      for (const productId of discount.productIds) {
        const product = await Product.findById(productId);
        if (product) {
          if (discount.type === 'MRP' && product.MRP) {
            // Reapply seller discount to MRP
            const sellerDiscountedPrice =
              product.MRP - (product.MRP * product.discount) / 100;
            product.sellingPrice =
              sellerDiscountedPrice > 0 ? sellerDiscountedPrice : product.MRP;
          } else if (discount.type === 'sellingPrice' && product.sellingPrice) {
            // Just remove the admin discount, seller discount remains applied
            const originalPrice =
              product.sellingPrice / (1 - discount.discount / 100);
            product.sellingPrice = originalPrice;
          }
          product.adminDiscount = null;
          await product.save();
        }
      }
    }

    // Remove discount and recalculate prices for bundles
    if (discount.bundleIds && discount.bundleIds.length > 0) {
      for (const bundleId of discount.bundleIds) {
        const bundle = await Bundle.findById(bundleId);
        if (bundle) {
          if (discount.type === 'MRP' && bundle.MRP) {
            // Reapply seller discount to MRP
            const sellerDiscountedPrice =
              bundle.MRP - (bundle.MRP * bundle.discount) / 100;
            bundle.sellingPrice =
              sellerDiscountedPrice > 0 ? sellerDiscountedPrice : bundle.MRP;
          } else if (discount.type === 'sellingPrice' && bundle.sellingPrice) {
            // Just remove the admin discount, seller discount remains applied
            const originalPrice =
              bundle.sellingPrice / (1 - discount.discount / 100);
            bundle.sellingPrice = originalPrice;
          }
          bundle.adminDiscount = undefined;
          await bundle.save();
        }
      }
    }

    res.status(200).json({
      message: 'Discount removed and prices recalculated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove discount', error });
  }
};
