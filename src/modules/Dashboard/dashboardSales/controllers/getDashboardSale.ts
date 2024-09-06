import { Request, Response } from 'express';
import Order from '../../../../models/orderModel';
import Product from '../../../../models/productModel';
import User from '../../../../models/userModel';
import Category from '../../../../models/productCategoryModel';
import moment from 'moment';

// Helper function to get total products sold
const getTotalProductsSold = async (startDate: Date, endDate: Date) => {
  return Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$items.quantity' },
      },
    },
  ]);
};

// Helper function to get top-selling product
const getTopSellingProduct = async (startDate: Date, endDate: Date) => {
  return Product.aggregate([
    {
      $lookup: {
        from: 'orders',
        let: { productId: '$_id' },
        pipeline: [
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: '$items.productId',
              totalQuantity: { $sum: '$items.quantity' },
            },
          },
        ],
        as: 'orderData',
      },
    },
    { $unwind: '$orderData' },
    { $sort: { 'orderData.totalQuantity': -1 } },
    { $limit: 1 }, // Only get the top product
    { $project: { name: 1, totalQuantity: '$orderData.totalQuantity' } },
  ]);
};

// Helper function to get top sellers with sales
const getTopSellers = async (startDate: Date, endDate: Date) => {
  return User.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'sellerId',
        as: 'products',
      },
    },
    { $unwind: '$products' },
    {
      $lookup: {
        from: 'orders',
        let: { productId: '$products._id' },
        pipeline: [
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: '$items.productId',
              totalSales: { $sum: '$items.price' },
            },
          },
        ],
        as: 'orderData',
      },
    },
    { $unwind: '$orderData' },
    {
      $group: {
        _id: '$_id',
        sellerName: { $first: { $concat: ['$firstName', ' ', '$lastName'] } }, // Concatenate first and last name
        totalSales: { $sum: '$orderData.totalSales' },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 5 }, // Get the top 5 sellers
  ]);
};

// Helper function to get the top-selling category
const getTopSellingCategory = async (startDate: Date, endDate: Date) => {
  return Category.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'products',
      },
    },
    { $unwind: '$products' },
    {
      $lookup: {
        from: 'orders',
        let: { productId: '$products._id' },
        pipeline: [
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.productId', '$$productId'] },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: '$items.productId',
              totalQuantity: { $sum: '$items.quantity' },
            },
          },
        ],
        as: 'orderData',
      },
    },
    { $unwind: '$orderData' },
    {
      $group: {
        _id: '$_id',
        categoryName: { $first: '$name' },
        totalQuantity: { $sum: '$orderData.totalQuantity' },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 1 }, // Get only the top category
  ]);
};

// Aggregated sales analytics API
export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const { period } = req.query;

    let startDate: Date;
    const endDate = new Date(); // Current date and time

    // Determine the start date based on the specified period
    switch (period) {
      case 'daily':
        startDate = moment().startOf('day').toDate();
        break;
      case 'weekly':
        startDate = moment().startOf('week').toDate();
        break;
      case 'monthly':
        startDate = moment().startOf('month').toDate();
        break;
      default:
        return res.status(400).json({ message: 'Invalid period specified' });
    }

    // Get aggregated data
    const [
      totalSales,
      totalProductsSold,
      topSellingProduct,
      topSellers,
      topCategory,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
          },
        },
      ]).exec(),

      getTotalProductsSold(startDate, endDate),

      getTopSellingProduct(startDate, endDate),

      getTopSellers(startDate, endDate),

      getTopSellingCategory(startDate, endDate),
    ]);

    res.status(200).json({
      totalSales: totalSales[0]?.totalSales || 0,
      totalProductsSold: totalProductsSold[0]?.totalQuantity || 0,
      topSellingProduct: topSellingProduct[0] || null,
      topSellers,
      topCategory: topCategory[0]?.categoryName || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
