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
exports.createCoupon = void 0;
const couponModel_1 = __importDefault(require("../../../models/couponModel"));
// Create Coupon API
const createCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discountType, discountValue, minOrderValue = 0, usageLimit = 10, validFrom, validUntil, } = req.body;
        // Field-specific validations
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        if (!discountType) {
            return res.status(400).json({ message: 'Discount type is required' });
        }
        if (discountValue === undefined || discountValue === null) {
            return res.status(400).json({ message: 'Discount value is required' });
        }
        if (!validFrom) {
            return res.status(400).json({ message: 'Valid from date is required' });
        }
        if (!validUntil) {
            return res.status(400).json({ message: 'Valid until date is required' });
        }
        // Check if the coupon code is unique
        const existingCoupon = yield couponModel_1.default.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        // Validate discount value based on discount type
        if (discountType === 'percentage' &&
            (discountValue <= 0 || discountValue > 100)) {
            return res
                .status(400)
                .json({ message: 'Percentage discount must be between 1 and 100' });
        }
        if (discountType === 'flat' && discountValue <= 0) {
            return res
                .status(400)
                .json({ message: 'Flat discount must be greater than 0' });
        }
        // Validate the dates
        const startDate = new Date(validFrom);
        const endDate = new Date(validUntil);
        const currentDate = new Date();
        // Ensure `validFrom` is not in the past
        if (startDate < currentDate) {
            return res
                .status(400)
                .json({ message: 'Valid from date cannot be in the past' });
        }
        // Ensure `validUntil` is after `validFrom`
        if (endDate <= startDate) {
            return res
                .status(400)
                .json({ message: 'End date must be after the start date' });
        }
        // Validate `usageLimit` and `minOrderValue`
        if (usageLimit <= 0) {
            return res
                .status(400)
                .json({ message: 'Usage limit must be greater than 0' });
        }
        if (minOrderValue < 0) {
            return res
                .status(400)
                .json({ message: 'Minimum order value cannot be negative' });
        }
        // Create and save the coupon in the database
        const coupon = new couponModel_1.default({
            code,
            discountType,
            discountValue,
            minOrderValue,
            usageLimit,
            validFrom: startDate,
            validUntil: endDate,
        });
        yield coupon.save();
        return res
            .status(201)
            .json({ message: 'Coupon created successfully', coupon });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
});
exports.createCoupon = createCoupon;
