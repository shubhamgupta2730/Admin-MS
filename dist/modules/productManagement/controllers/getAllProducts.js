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
exports.getAllProducts = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const { search, sort, page = '1', limit = '10', status, categoryName, } = req.query;
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        if (pageNumber <= 0 || pageSize <= 0) {
            return res.status(400).json({
                message: 'Page number and limit must be greater than 0',
            });
        }
        const match = { isDeleted: false };
        if (status === 'blocked') {
            match.isBlocked = true;
        }
        else if (status === 'unblocked') {
            match.isBlocked = false;
        }
        // Filter by category name
        if (categoryName) {
            const category = yield productCategoryModel_1.default.findOne({
                name: new RegExp(categoryName, 'i'),
            });
            if (category) {
                match.categoryId = category._id;
            }
            else {
                match.categoryId = null;
            }
        }
        if (search) {
            match.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
            ];
        }
        const sortOptions = {};
        if (sort) {
            const [sortField, sortOrder] = sort.split(':');
            sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
        }
        const products = yield productModel_1.default.aggregate([
            { $match: match },
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
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
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
                },
            },
            {
                $facet: {
                    metadata: [
                        { $count: 'total' },
                        { $addFields: { page: pageNumber, limit: pageSize } },
                    ],
                    data: [
                        { $sort: sortOptions },
                        { $skip: (pageNumber - 1) * pageSize },
                        { $limit: pageSize },
                    ],
                },
            },
        ]);
        const result = products[0];
        const totalProducts = result.metadata.length ? result.metadata[0].total : 0;
        const totalPages = Math.ceil(totalProducts / pageSize);
        res.status(200).json({
            message: 'Products retrieved successfully',
            data: result.data,
            pagination: {
                total: totalProducts,
                page: pageNumber,
                limit: pageSize,
                totalPages,
            },
        });
    }
    catch (error) {
        console.error('Failed to retrieve products', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAllProducts = getAllProducts;
