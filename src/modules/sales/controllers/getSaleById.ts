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

export const getSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;

  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  try {
    // Find the sale with populated categories, products, and bundles
    const sale = await Sale.findOne({
      _id: saleId,
      isDeleted: false
    })
      .populate({
        path: 'categories.categoryId',
        select: 'name',
      })
      .populate({
        path: 'products.productId',
        select: 'name sellingPrice categoryId',
      })
      .populate({
        path: 'bundles.bundleId',
        select: 'name sellingPrice products',
        populate: {
          path: 'products.productId',
          select: 'name sellingPrice',
        },
      });

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found.',
      });
    }

    // Format the sale for response
    const formattedSale = {
      id: sale._id,
      name: sale.name,
      description: sale.description,
      startDate: sale.startDate.toLocaleString(), // Date and time format
      endDate: sale.endDate.toLocaleString(), // Date and time format
      isActive: sale.isActive,
      categories: sale.categories.map((cat) => {
        const category = cat.categoryId as any;

        const productsInCategory = sale.products
          .map((p) => p.productId as any)
          .filter((product) =>
            (product.categoryId as any)?._id.equals(category._id)
          )
          .map((product) => ({
            productId: product._id,
            productName: product.name,
            sellingPrice: product.sellingPrice,
          }));

        return {
          categoryId: category._id,
          categoryName: category.name || 'Unknown',
          discount: cat.discount,
          products: productsInCategory,
        };
      }),
      bundles: sale.bundles.map((bundle) => {
        const bundleData = bundle.bundleId as any;

        const productsInBundle = bundleData.products.map((product: any) => ({
          productId: product.productId._id,
          productName: product.productId.name,
          sellingPrice: product.productId.sellingPrice,
        }));

        return {
          bundleId: bundleData._id,
          bundleName: bundleData.name,
          sellingPrice: bundleData.sellingPrice,
          products: productsInBundle,
        };
      }),
      createdBy: sale.createdBy,
    };

    return res.status(200).json({
      message: 'Sale retrieved successfully',
      sale: formattedSale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to retrieve sale',
      error: err.message,
    });
  }
};
