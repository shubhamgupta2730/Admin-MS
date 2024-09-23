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
exports.removeDiscount = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const removeDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const discountId = req.query.discountId;
    // Validate discountId
    if (!discountId || !mongoose_1.default.Types.ObjectId.isValid(discountId)) {
        return res.status(400).json({ message: 'Invalid discount ID' });
    }
    try {
        // Retrieve the discount
        const discount = yield discountModel_1.default.findById(discountId);
        if (!discount) {
            return res.status(404).json({ message: 'Discount not found' });
        }
        // Check if the discount is already inactive
        if (discount.isDeleted) {
            return res.status(400).json({ message: 'Discount is already removed' });
        }
        // Set discount to inactive
        discount.isDeleted = true;
        yield discount.save();
        // Remove discount and recalculate prices for products
        if (discount.productIds && discount.productIds.length > 0) {
            for (const productId of discount.productIds) {
                const product = yield productModel_1.default.findById(productId);
                if (product) {
                    if (discount.type === 'MRP' && product.MRP) {
                        // Reapply seller discount to MRP
                        const sellerDiscountedPrice = product.MRP - (product.MRP * product.discount) / 100;
                        product.sellingPrice =
                            sellerDiscountedPrice > 0 ? sellerDiscountedPrice : product.MRP;
                    }
                    else if (discount.type === 'sellingPrice' && product.sellingPrice) {
                        // Just remove the admin discount, seller discount remains applied
                        const originalPrice = product.sellingPrice / (1 - discount.discount / 100);
                        product.sellingPrice = originalPrice;
                    }
                    product.adminDiscount = null;
                    yield product.save();
                }
            }
        }
        // Remove discount and recalculate prices for bundles
        if (discount.bundleIds && discount.bundleIds.length > 0) {
            for (const bundleId of discount.bundleIds) {
                const bundle = yield adminBundleModel_1.default.findById(bundleId);
                if (bundle) {
                    if (discount.type === 'MRP' && bundle.MRP) {
                        // Reapply seller discount to MRP
                        const sellerDiscountedPrice = bundle.MRP - (bundle.MRP * bundle.discount) / 100;
                        bundle.sellingPrice =
                            sellerDiscountedPrice > 0 ? sellerDiscountedPrice : bundle.MRP;
                    }
                    else if (discount.type === 'sellingPrice' && bundle.sellingPrice) {
                        // Just remove the admin discount, seller discount remains applied
                        const originalPrice = bundle.sellingPrice / (1 - discount.discount / 100);
                        bundle.sellingPrice = originalPrice;
                    }
                    bundle.adminDiscount = undefined;
                    yield bundle.save();
                }
            }
        }
        res.status(200).json({
            message: 'Discount removed and prices recalculated successfully',
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to remove discount', error });
    }
});
exports.removeDiscount = removeDiscount;
