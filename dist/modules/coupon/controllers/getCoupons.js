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
exports.getCouponById = void 0;
const couponModel_1 = __importDefault(require("../../../models/couponModel"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get Coupon by ID
const getCouponById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.query.id;
        // Check if the provided ID is a valid MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid coupon ID' });
        }
        // Fetch the coupon by ID
        const coupon = yield couponModel_1.default.findById(id);
        // Check if the coupon exists
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        // Return full coupon details
        return res.status(200).json({
            message: 'Coupon fetched successfully',
            coupon,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error });
    }
});
exports.getCouponById = getCouponById;
