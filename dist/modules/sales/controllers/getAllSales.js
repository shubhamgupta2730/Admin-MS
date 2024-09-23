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
exports.getAllSales = void 0;
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const getAllSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, sortBy, sortOrder, page = 1, limit = 10, isActive, } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const sortField = sortBy ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    // Build the query object
    const searchQuery = {};
    if (search) {
        searchQuery.name = { $regex: search, $options: 'i' };
    }
    searchQuery.isDeleted = false;
    // if (isActive !== undefined) {
    //   searchQuery.isActive = isActive === 'true';
    // }
    try {
        const sales = yield saleModel_1.default.find(searchQuery)
            .populate({
            path: 'categories.categoryId',
            select: 'name',
        })
            .sort({ [sortField]: sortDirection })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        const totalSales = yield saleModel_1.default.countDocuments(searchQuery);
        const formattedSales = sales.map((sale) => ({
            id: sale._id,
            name: sale.name,
            description: sale.description,
            startDate: sale.startDate.toLocaleString(), // Date and time format
            endDate: sale.endDate.toLocaleString(),
            isActive: sale.isActive,
            // categories: sale.categories.map((cat) => ({
            //   categoryId: cat.categoryId._id,
            //   categoryName: (cat.categoryId as any).name,
            //   discount: cat.discount,
            // })),
            // createdBy: sale.createdBy,
        }));
        return res.status(200).json({
            message: 'Sales retrieved successfully',
            sales: formattedSales,
            page: pageNumber,
            totalPages: Math.ceil(totalSales / limitNumber),
            totalSales,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to retrieve sales',
            error: err.message,
        });
    }
});
exports.getAllSales = getAllSales;
