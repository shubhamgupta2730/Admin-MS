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
exports.updateCoupon = void 0;
const couponModel_1 = __importDefault(require("../../../models/couponModel"));
const mongoose_1 = __importDefault(require("mongoose"));
// Update Coupon API
const updateCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.query.id;
        const { code, discountType, discountValue, minOrderValue, usageLimit, validFrom, validUntil, } = req.body;
        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid coupon ID' });
        }
        // Check if the coupon exists
        const coupon = yield couponModel_1.default.findOne({ _id: id, isDeleted: false });
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        // Field-specific validations
        if (code && code.trim() === '') {
            return res.status(400).json({ message: 'Coupon code cannot be empty' });
        }
        if (discountType && !['percentage', 'flat'].includes(discountType)) {
            return res.status(400).json({ message: 'Invalid discount type' });
        }
        if (discountValue !== undefined &&
            (discountValue === null || discountValue <= 0)) {
            return res
                .status(400)
                .json({ message: 'Discount value must be greater than 0' });
        }
        if (discountType === 'percentage' &&
            discountValue !== undefined &&
            (discountValue <= 0 || discountValue > 100)) {
            return res
                .status(400)
                .json({ message: 'Percentage discount must be between 1 and 100' });
        }
        if (discountType === 'flat' &&
            discountValue !== undefined &&
            discountValue <= 0) {
            return res
                .status(400)
                .json({ message: 'Flat discount must be greater than 0' });
        }
        if (minOrderValue !== undefined && minOrderValue < 0) {
            return res
                .status(400)
                .json({ message: 'Minimum order value cannot be negative' });
        }
        if (usageLimit !== undefined && usageLimit <= 0) {
            return res
                .status(400)
                .json({ message: 'Usage limit must be greater than 0' });
        }
        // Date validation
        let startDate;
        let endDate;
        if (validFrom) {
            startDate = new Date(validFrom);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ message: 'Invalid valid from date' });
            }
        }
        if (validUntil) {
            endDate = new Date(validUntil);
            if (isNaN(endDate.getTime())) {
                return res.status(400).json({ message: 'Invalid valid until date' });
            }
        }
        if (startDate && startDate < new Date()) {
            return res
                .status(400)
                .json({ message: 'Valid from date cannot be in the past' });
        }
        if (startDate && endDate && endDate <= startDate) {
            return res
                .status(400)
                .json({ message: 'End date must be after the start date' });
        }
        // Check if the coupon code is unique when updating
        if (code && code !== coupon.code) {
            const existingCoupon = yield couponModel_1.default.findOne({ code });
            if (existingCoupon) {
                return res.status(400).json({ message: 'Coupon code already exists' });
            }
        }
        // Update fields if provided
        if (code)
            coupon.code = code;
        if (discountType)
            coupon.discountType = discountType;
        if (discountValue !== undefined)
            coupon.discountValue = discountValue;
        if (minOrderValue !== undefined)
            coupon.minOrderValue = minOrderValue;
        if (usageLimit !== undefined)
            coupon.usageLimit = usageLimit;
        if (startDate)
            coupon.validFrom = startDate;
        if (endDate)
            coupon.validUntil = endDate;
        // Save the updated coupon
        yield coupon.save();
        return res.status(200).json({
            message: 'Coupon updated successfully',
            coupon,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateCoupon = updateCoupon;
