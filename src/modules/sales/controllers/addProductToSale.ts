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

interface ISaleProduct {
  productId: mongoose.Types.ObjectId;
}

interface ISaleBundle {
  bundleId: mongoose.Types.ObjectId;
}

export const addProductsToSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const { products } = req.body;

  // Validate Sale ID
  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  // Validate products
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      message: 'The products field must be a non-empty array.',
    });
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
        message: 'Cannot add products to a sale that has ended.',
      });
    }

    // Collect IDs of products already in the sale
    const existingProductIds = sale.products.map((p) => p.productId.toString());
    const existingBundleIds = sale.bundles.map((b) => b.bundleId.toString());

    const validProducts: ISaleProduct[] = [];
    const validBundles: ISaleBundle[] = [];

    // Validate and process products
    for (const product of products) {
      const productId = product.productId;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          message: `Invalid product ID: ${productId}.`,
        });
      }

      // Check if the product is already in the sale
      if (existingProductIds.includes(productId)) {
        return res.status(400).json({
          message: `Product with ID ${productId} is already added to this sale.`,
        });
      }

      // Find the product and ensure it meets the conditions
      const productData = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      if (!productData) {
        return res.status(400).json({
          message: `Product with ID ${productId} is either inactive, deleted, or blocked.`,
        });
      }

      // Checking if the product belongs to any of the categories in the sale
      const saleCategory = sale.categories.find((cat) =>
        productData.categoryId?.equals(cat.categoryId._id)
      );

      if (!saleCategory) {
        return res.status(400).json({
          message: `Product with ID ${productId} does not belong to any of the sale's categories.`,
        });
      }

      // Add product to the list of valid products to be added to the sale
      const saleProduct: ISaleProduct = {
        productId: new mongoose.Types.ObjectId(productId),
      };
      validProducts.push(saleProduct);

      // Find bundles containing this product
      const bundlesContainingProduct = await Bundle.find({
        'products.productId': productId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      for (const bundle of bundlesContainingProduct) {
        // Check if the bundle is already in the sale
        const bundleId = bundle._id as mongoose.Types.ObjectId;

        if (existingBundleIds.includes(bundleId.toString())) {
          continue;
        }

        // Add bundle to the list of valid bundles to be added to the sale
        const saleBundle: ISaleBundle = {
          bundleId,
        };

        validBundles.push(saleBundle);
      }
    }

    sale.products = sale.products.concat(validProducts);
    sale.bundles = sale.bundles.concat(validBundles);
    await sale.save();

    return res.status(200).json({
      message: 'Products and related bundles added to the sale successfully.',
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to add products or bundles to sale',
      error: err.message,
    });
  }
};
