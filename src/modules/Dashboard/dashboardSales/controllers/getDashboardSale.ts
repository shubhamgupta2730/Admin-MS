import { Request, Response } from 'express';
import Order from '../../../../models/orderModel';
import Product from '../../../../models/productModel';
import User from '../../../../models/userModel';
import Category from '../../../../models/productCategoryModel';
import moment from 'moment';

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
    { $limit: 1 },
    { $project: { name: 1, totalQuantity: '$orderData.totalQuantity' } },
  ]);
};

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
        sellerName: { $first: { $concat: ['$firstName', ' ', '$lastName'] } },
        totalSales: { $sum: '$orderData.totalSales' },
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 5 },
  ]);
};

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
    { $limit: 1 },
  ]);
};

export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const {
      period,
      startDate: queryStartDate,
      endDate: queryEndDate,
    } = req.query;

    let startDate: Date;
    let endDate = new Date();
    const currentDate = new Date();
    // Handle custom date range
    if (queryStartDate || queryEndDate) {
      // Validate the custom dates
      if (!queryStartDate || !queryEndDate) {
        return res.status(400).json({
          message:
            'Both startDate and endDate must be provided for custom range',
        });
      }

      startDate = new Date(queryStartDate as string);
      endDate = new Date(queryEndDate as string);

      // Check if the custom dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid date format. Please use a valid date string.',
        });
      }

      // Ensure that startDate is before endDate
      if (startDate > endDate) {
        return res
          .status(400)
          .json({ message: 'startDate cannot be after endDate' });
      }

      // Ensure that startDate is not in the future
      if (startDate > currentDate) {
        return res.status(400).json({
          message: 'startDate cannot be in the future',
        });
      }

      // Ensure that endDate is not in the future
      if (endDate > currentDate) {
        return res.status(400).json({
          message: 'endDate cannot be in the future',
        });
      }
    } else {
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
        case 'yearly':
          startDate = moment().startOf('year').toDate();
          break;
        default:
          return res.status(400).json({ message: 'Invalid period specified' });
      }

      // Ensure that startDate is not in the future (for predefined periods)
      if (startDate > currentDate) {
        return res.status(400).json({
          message: 'Start date cannot be in the future for the selected period',
        });
      }
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
