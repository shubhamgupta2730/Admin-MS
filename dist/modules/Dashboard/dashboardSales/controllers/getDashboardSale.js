"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesAnalytics = void 0;
const orderModel_1 = __importDefault(require("../../../../models/orderModel"));
const productModel_1 = __importDefault(require("../../../../models/productModel"));
const userModel_1 = __importDefault(require("../../../../models/userModel"));
const productCategoryModel_1 = __importDefault(require("../../../../models/productCategoryModel"));
const moment_1 = __importDefault(require("moment"));
const getTotalProductsSold = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return orderModel_1.default.aggregate([
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
});
const getTopSellingProduct = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return productModel_1.default.aggregate([
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
});
const getTopSellers = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return userModel_1.default.aggregate([
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
});
const getTopSellingCategory = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    return productCategoryModel_1.default.aggregate([
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
});
const getSalesAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { period, startDate: queryStartDate, endDate: queryEndDate, } = req.query;
        let startDate;
        let endDate = new Date();
        const currentDate = new Date();
        // Handle custom date range
        if (queryStartDate || queryEndDate) {
            // Validate the custom dates
            if (!queryStartDate || !queryEndDate) {
                return res.status(400).json({
                    message: 'Both startDate and endDate must be provided for custom range',
                });
            }
            startDate = new Date(queryStartDate);
            endDate = new Date(queryEndDate);
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
        }
        else {
            // Determine the start date based on the specified period
            switch (period) {
                case 'daily':
                    startDate = (0, moment_1.default)().startOf('day').toDate();
                    break;
                case 'weekly':
                    startDate = (0, moment_1.default)().startOf('week').toDate();
                    break;
                case 'monthly':
                    startDate = (0, moment_1.default)().startOf('month').toDate();
                    break;
                case 'yearly':
                    startDate = (0, moment_1.default)().startOf('year').toDate();
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
        const [totalSales, totalProductsSold, topSellingProduct, topSellers, topCategory,] = yield Promise.all([
            orderModel_1.default.aggregate([
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
            totalSales: ((_a = totalSales[0]) === null || _a === void 0 ? void 0 : _a.totalSales) || 0,
            totalProductsSold: ((_b = totalProductsSold[0]) === null || _b === void 0 ? void 0 : _b.totalQuantity) || 0,
            topSellingProduct: topSellingProduct[0] || null,
            topSellers,
            topCategory: ((_c = topCategory[0]) === null || _c === void 0 ? void 0 : _c.categoryName) || null,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getSalesAnalytics = getSalesAnalytics;
