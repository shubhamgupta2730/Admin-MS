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
exports.getAllCoupons = void 0;
const couponModel_1 = __importDefault(require("../../../models/couponModel"));
const getAllCoupons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, sort = 'validUntil', order = 'asc', search = '', } = req.query;
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const sortOrder = order === 'desc' ? -1 : 1;
        const searchQuery = search
            ? { code: { $regex: search, $options: 'i' } }
            : {};
        const totalCoupons = yield couponModel_1.default.countDocuments(searchQuery);
        const coupons = yield couponModel_1.default.find(searchQuery)
            .select('code discountType discountValue validUntil')
            .sort({ [sort]: sortOrder })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);
        // Response with coupons and pagination info
        return res.status(200).json({
            message: 'Coupons fetched successfully',
            coupons,
            totalPages: Math.ceil(totalCoupons / pageSize),
            currentPage: pageNumber,
            totalCoupons,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAllCoupons = getAllCoupons;
