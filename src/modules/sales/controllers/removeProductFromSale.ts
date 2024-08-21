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

export const removeProductFromSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const { productIds }: { productIds: string[] } = req.body;

  // Validate Sale ID
  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  // Validate productIds
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({
      message: 'The productIds field must be a non-empty array.',
    });
  }

  // Validate each productId
  for (const productId of productIds) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: `Invalid product ID: ${productId}.`,
      });
    }
  }

  try {
    // Find the sale
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false }).populate('categories.categoryId');

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    // Check if the sale is ongoing or in the future
    const now = new Date();
    if (sale.endDate <= now) {
      return res.status(400).json({
        message: 'Cannot modify products in a sale that has ended.',
      });
    }

    const removedProducts: string[] = [];
    const notFoundProducts: string[] = [];
    const removedBundles: string[] = [];
    const updatedBundles: string[] = [];

    // Process each productId
    for (const productId of productIds) {
      const productIndex = sale.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (productIndex === -1) {
        // If the product is not in the sale
        notFoundProducts.push(productId);
        continue;
      }

      // Remove the product from the sale
      sale.products.splice(productIndex, 1);

      // Find the product and restore the original selling price
      const product = await Product.findById(productId);
      if (product) {
        const saleCategory = sale.categories.find((cat) => product.categoryId?.equals(cat.categoryId._id));

        if (saleCategory) {
          // Recalculate the original price without the discount
          const originalPrice = product.sellingPrice / (1 - saleCategory.discount / 100);
          product.sellingPrice = originalPrice;
          await product.save();
        }

        removedProducts.push(productId);

        // Check for bundles containing this product and update/remove them
        const bundlesContainingProduct = await Bundle.find({
          'products.productId': productId,
          isActive: true,
          isDeleted: false,
        });

        for (const bundle of bundlesContainingProduct) {
          const bundleId = bundle._id as mongoose.Types.ObjectId;

          const productCount = bundle.products.length;

          // If the bundle contains only one product, remove the bundle from the sale
          if (productCount === 1) {
            const bundleIndex = sale.bundles.findIndex((b) => b.bundleId.equals(bundleId));
            if (bundleIndex !== -1) {
              sale.bundles.splice(bundleIndex, 1);
              removedBundles.push(bundleId.toString());
            }
          } else {
            // If the bundle contains more than one product, update the bundle's selling price
            let totalMRP = 0;
            let totalDiscountedPrice = 0;

            for (const bundleProduct of bundle.products) {
              if (bundleProduct.productId.toString() !== productId) {
                const productInBundle = await Product.findOne({
                  _id: bundleProduct.productId,
                  isActive: true,
                  isDeleted: false,
                });

                if (productInBundle) {
                  const saleCategoryForBundleProduct = sale.categories.find((cat) =>
                    productInBundle.categoryId?.equals(cat.categoryId._id)
                  );

                  const bundleProductDiscount = saleCategoryForBundleProduct
                    ? saleCategoryForBundleProduct.discount
                    : 0;

                  const bundleProductDiscountedPrice =
                    productInBundle.sellingPrice -
                    (productInBundle.sellingPrice * bundleProductDiscount) / 100;

                  totalMRP += productInBundle.MRP;
                  totalDiscountedPrice += bundleProductDiscountedPrice;
                }
              }
            }

            // Update the bundle's selling price
            bundle.sellingPrice = totalDiscountedPrice;
            await bundle.save();
            updatedBundles.push(bundleId.toString());
          }
        }
      }
    }

    // Save the updated sale
    await sale.save();

    // Response with the status of the removal process
    return res.status(200).json({
      message: 'Products removal process completed.',
      removedProducts,
      notFoundProducts,
      removedBundles,
      updatedBundles,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to remove products from sale',
      error: err.message,
    });
  }
};
