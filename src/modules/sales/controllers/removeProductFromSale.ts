import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sale from '../../../models/saleModel';
import Product from '../../../models/productModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const removeProductFromSale = async (
  req: CustomRequest,
  res: Response
) => {
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
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false }).populate(
      'categories.categoryId'
    );

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

    const removedProducts = [];
    const notFoundProducts = [];

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

      // Find the product and remove the discount
      const product = await Product.findById(productId);
      if (product) {
        const saleCategory = sale.categories.find((cat) =>
          product.categoryId?.equals(cat.categoryId._id)
        );

        if (saleCategory) {
          // Recalculate the original price without the discount
          const originalPrice =
            product.sellingPrice / (1 - saleCategory.discount / 100);
          product.sellingPrice = originalPrice;
          await product.save();
        }

        removedProducts.push(productId);
      }
    }

    // Save the updated sale
    await sale.save();

    // Response with the status of the removal process
    return res.status(200).json({
      message: 'Products removal process completed.',
      removedProducts,
      notFoundProducts,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to remove products from sale',
      error: err.message,
    });
  }
};
