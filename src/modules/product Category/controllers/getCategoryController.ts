import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../../../models/productCategoryModel';
import Admin from '../../../models/authModel';
import Product from '../../../models/productModel'; // Assuming you have a Product model

interface CustomRequest extends Request {
  query: {
    id?: string;
  };
}

export const getCategory = async (req: CustomRequest, res: Response) => {
  const id = req.query.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Invalid or missing category ID',
    });
  }

  try {
    // Fetch the category by ID
    const category = await Category.findOne({ _id: id, isActive: true });
    if (!category) {
      return res.status(404).json({
        message: 'Category not found or inactive',
      });
    }

    const createdBy = category.createdBy;

    // Fetch admin details
    const admin = await Admin.findById(createdBy).select('name');
    if (!admin) {
      return res.status(400).json({
        message: 'Admin not found',
      });
    }

    // Fetch product details (IDs and names)
    const products = await Product.find({
      _id: { $in: category.productIds },
      isActive: true,
    }).select('_id name');

    // Format dates
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Prepare the category object with product details
    const categoryObject = {
      id: category._id,
      name: category.name,
      description: category.description,
      createdAt: formatDate(category.createdAt),
      updatedAt: formatDate(category.updatedAt),
      createdBy: {
        id: admin._id,
        name: admin.name,
      },
      products: products.map((product) => ({
        id: product._id,
        name: product.name,
      })),
    };

    res.status(200).json({
      message: 'Category retrieved successfully',
      category: categoryObject,
    });
  } catch (error) {
    console.error('Error retrieving category:', error);
    res.status(500).json({
      message: 'An error occurred while retrieving the category',
    });
  }
};
