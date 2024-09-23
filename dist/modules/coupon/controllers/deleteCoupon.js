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
exports.deleteCoupon = void 0;
const couponModel_1 = __importDefault(require("../../../models/couponModel"));
const mongoose_1 = __importDefault(require("mongoose"));
// Soft Delete Coupon API
const deleteCoupon = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.query.id;
        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid coupon ID' });
        }
        // Find the coupon by ID and check if it exists
        const coupon = yield couponModel_1.default.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        // Check if the coupon is already deleted
        if (coupon.isDeleted) {
            return res.status(400).json({ message: 'Coupon is already deleted' });
        }
        // Perform soft delete by setting `isDeleted` to true
        coupon.isDeleted = true;
        yield coupon.save();
        return res.status(200).json({
            message: 'Coupon  deleted successfully',
            coupon,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteCoupon = deleteCoupon;
