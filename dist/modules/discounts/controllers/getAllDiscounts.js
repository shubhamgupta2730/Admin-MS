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
exports.getAllDiscounts = void 0;
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const getAllDiscounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10, } = req.query;
    try {
        const query = {};
        if (code) {
            query.code = { $regex: code, $options: 'i' }; // Case-insensitive search
        }
        // Pagination parameters
        const pageNumber = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * pageSize;
        // Sorting parameters
        const sortCriteria = {};
        sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Fetch discounts with filtering, sorting, and pagination
        const discounts = yield discountModel_1.default.find(query)
            .select('startDate endDate discount code ')
            .sort(sortCriteria)
            .skip(skip)
            .limit(pageSize);
        // Format the dates for response
        const formattedDiscounts = discounts.map((discount) => ({
            _id: discount._id,
            startDate: discount.startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            endDate: discount.endDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            discount: discount.discount,
            code: discount.code,
            isActive: discount.isActive,
        }));
        // Total count for pagination
        const totalCount = yield discountModel_1.default.countDocuments(query);
        res.status(200).json({
            discounts: formattedDiscounts,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: pageNumber,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch discounts', error });
    }
});
exports.getAllDiscounts = getAllDiscounts;
