import { Request, Response } from 'express';
import Order from '../../../../models/orderModel';
import Product from '../../../../models/productModel';
import Category from '../../../../models/productCategoryModel';
import moment from 'moment';

// Helper function to get top-selling products
const getTopSellingProducts = async (startDate: Date, endDate: Date) => {
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
    { $limit: 10 },
    { $project: { name: 1, totalQuantity: '$orderData.totalQuantity' } },
  ]);
};

// Helper function to get sales by category
const getSalesByCategory = async (startDate: Date, endDate: Date) => {
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
              totalAmount: { $sum: '$items.price' },
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
        totalSales: { $sum: '$orderData.totalAmount' },
      },
    },
  ]);
};

// Aggregated sales data API
export const getAggregatedSalesData = async (req: Request, res: Response) => {
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

    // Get aggregated sales data
    const [totalSales, topSellingProducts, salesByCategory] = await Promise.all(
      [
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

        getTopSellingProducts(startDate, endDate),

        getSalesByCategory(startDate, endDate),
      ]
    );

    res.status(200).json({
      totalSales: totalSales[0]?.totalSales || 0,
      topSellingProducts,
      salesByCategory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
