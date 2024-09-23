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
exports.getAllCategories = void 0;
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract and validate query parameters
    const { search, sortBy = 'name', order = 'asc', page = '1', limit = '10', } = req.query;
    const searchQuery = typeof search === 'string' ? search : '';
    const sortByField = typeof sortBy === 'string' ? sortBy : 'name';
    const sortOrderValue = typeof order === 'string' ? order : 'asc';
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (pageNum <= 0 || limitNum <= 0) {
        return res.status(400).json({
            message: 'Page number and limit must be greater than 0',
        });
    }
    // Create filter and sorting criteria
    const filter = { isActive: true };
    if (searchQuery) {
        filter.name = { $regex: searchQuery, $options: 'i' };
    }
    const sortCriteria = {
        [sortByField]: sortOrderValue === 'desc' ? -1 : 1,
    };
    try {
        const aggregationPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'admins',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'adminDetails',
                },
            },
            { $unwind: { path: '$adminDetails', preserveNullAndEmptyArrays: false } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    createdBy: 1,
                    CreatedBy: '$adminDetails.name',
                },
            },
            { $sort: sortCriteria },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
        ];
        // Fetch the categories
        const categories = yield productCategoryModel_1.default.aggregate(aggregationPipeline).exec();
        // Get total count of categories for pagination
        const totalCategories = yield productCategoryModel_1.default.countDocuments(filter).exec();
        if (!categories.length) {
            return res.status(404).json({ message: 'No categories found' });
        }
        // Return the categories with pagination info
        res.status(200).json({
            categories,
            pagination: {
                total: totalCategories,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalCategories / limitNum),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Failed to retrieve categories',
            error,
        });
    }
});
exports.getAllCategories = getAllCategories;
