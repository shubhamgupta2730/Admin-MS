import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/adminBundleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const deleteSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;

  // Validate Sale ID
  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  try {
    // Find the sale and ensure it's not already deleted
    const sale = await Sale.findOneAndUpdate(
      { _id: saleId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    ).populate('categories.categoryId products.productId bundles.bundleId');

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found or already deleted.',
      });
    }

    // Restore original selling prices for products
    for (const saleProduct of sale.products) {
      const product = await Product.findById(saleProduct.productId);
      if (product) {
        const saleCategory = sale.categories.find(cat =>
          cat.categoryId.equals(product.categoryId)
        );

        if (saleCategory) {
          // Calculate and restore the original price before the discount was applied
          const discount = saleCategory.discount;
          const discountedPrice = product.sellingPrice;
          const originalPrice = discountedPrice / (1 - discount / 100);

          // Restore the original selling price
          product.sellingPrice = originalPrice;
          await product.save();
        }
      }
    }

    // Restore original selling prices for bundles and remove them if necessary
    for (const saleBundle of sale.bundles) {
      const bundle = await Bundle.findById(saleBundle.bundleId);
      if (bundle) {
        // Check all products in the bundle and restore their original prices
        let totalMRP = 0;
        let totalDiscountedPrice = 0;
        for (const bundleProduct of bundle.products) {
          const product = await Product.findById(bundleProduct.productId);
          if (product) {
            const saleCategory = sale.categories.find(cat =>
              cat.categoryId.equals(product.categoryId)
            );

            if (saleCategory) {
              const discount = saleCategory.discount;
              const discountedPrice = product.sellingPrice;
              const originalPrice = discountedPrice / (1 - discount / 100);

              totalMRP += product.MRP;
              totalDiscountedPrice += originalPrice;
            }
          }
        }

        // Update bundle's selling price to the sum of the original prices of its products
        bundle.sellingPrice = totalDiscountedPrice;
        await bundle.save();
      }
    }

    // Clear products and bundles from the sale
    sale.products = [];
    sale.bundles = [];
    await sale.save();

    return res.status(200).json({
      message: 'Sale and associated discounts deleted successfully',
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to delete sale',
      error: err.message,
    });
  }
};
