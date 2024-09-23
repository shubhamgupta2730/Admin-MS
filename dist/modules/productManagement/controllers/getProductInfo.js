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
exports.getProductInfo = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const mongoose_1 = require("mongoose");
const getProductInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const productId = req.query.productId;
        if (!mongoose_1.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        const product = yield productModel_1.default.aggregate([
            { $match: { _id: new mongoose_1.Types.ObjectId(productId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'sellerDetails',
                },
            },
            { $unwind: { path: '$sellerDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            {
                $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true },
            },
            {
                $lookup: {
                    from: 'bundles',
                    localField: 'bundleIds', // Changed to bundleIds (array of bundle IDs)
                    foreignField: '_id',
                    as: 'bundleDetails',
                },
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'reviews',
                },
            },
            {
                $unwind: {
                    path: '$reviews',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'reviews.userId',
                    foreignField: '_id',
                    as: 'reviewUser',
                },
            },
            {
                $unwind: {
                    path: '$reviewUser',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    MRP: 1,
                    sellingPrice: 1,
                    discount: 1,
                    adminDiscount: 1,
                    discountId: 1,
                    categoryId: 1,
                    categoryName: { $ifNull: ['$categoryDetails.name', 'Unknown'] },
                    isBlocked: 1,
                    isDeleted: 1,
                    isActive: 1,
                    sellerId: 1,
                    sellerName: {
                        $concat: [
                            '$sellerDetails.firstName',
                            ' ',
                            '$sellerDetails.lastName',
                        ],
                    },
                    bundleIds: 1,
                    bundleNames: {
                        $cond: {
                            if: { $gt: [{ $size: '$bundleDetails' }, 0] },
                            then: '$bundleDetails.name',
                            else: [],
                        },
                    },
                    reviews: {
                        _id: '$reviews._id',
                        rating: '$reviews.rating',
                        reviewText: '$reviews.reviewText',
                        images: '$reviews.images',
                        userName: {
                            $concat: ['$reviewUser.firstName', ' ', '$reviewUser.lastName'],
                        },
                    },
                },
            },
        ]);
        if (!product.length) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ data: product[0] });
    }
    catch (error) {
        console.error('Failed to retrieve product info', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getProductInfo = getProductInfo;
