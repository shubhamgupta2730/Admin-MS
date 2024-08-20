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

export const getSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;

  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  try {
    // Find the sale with populated categories and products
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false })
      .populate({
        path: 'categories.categoryId',
        select: 'name',
      })
      .populate({
        path: 'products.productId',
        select: 'name sellingPrice categoryId', 
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
      startDate: sale.startDate.toLocaleDateString(),
      endDate: sale.endDate.toLocaleDateString(),
      isActive: sale.isActive,
      categories: sale.categories.map((cat) => {
        // Ensure that categoryId is populated and accessible
        const category = cat.categoryId as any; 

        // Get all products related to the current category
        const productsInCategory = sale.products
          .map(p => p.productId as any) 
          .filter(product => (product.categoryId as any)?._id.equals(category._id)) 
          .map(product => ({
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
