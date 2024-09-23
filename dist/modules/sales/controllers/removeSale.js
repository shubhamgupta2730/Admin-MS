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
exports.deleteSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const deleteSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const saleId = req.query.saleId;
    // Validate Sale ID
    if (!mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    try {
        // Find the sale and ensure it's not already deleted
        const sale = yield saleModel_1.default.findOneAndUpdate({ _id: saleId, isDeleted: false }, { isDeleted: true }, { new: true }).populate('categories.categoryId products.productId bundles.bundleId');
        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found or already deleted.',
            });
        }
        // Restore original selling prices for products
        for (const saleProduct of sale.products) {
            const product = yield productModel_1.default.findById(saleProduct.productId);
            if (product) {
                const saleCategory = sale.categories.find((cat) => cat.categoryId.equals(product.categoryId));
                if (saleCategory) {
                    // Get the discount percentage applied
                    const discount = product.adminDiscount || 0;
                    const discountedPrice = product.sellingPrice;
                    const originalPrice = discountedPrice / (1 - discount / 100);
                    product.sellingPrice = Math.round(originalPrice);
                    product.adminDiscount = null;
                    yield product.save();
                }
            }
        }
        // Restore original selling prices for bundles and set adminDiscount to null
        for (const saleBundle of sale.bundles) {
            const bundle = yield adminBundleModel_1.default.findById(saleBundle.bundleId);
            if (bundle) {
                const discount = bundle.adminDiscount || 0;
                // Calculate the original bundle price before the discount was applied
                const discountedPrice = bundle.sellingPrice;
                const originalPrice = discountedPrice / (1 - discount / 100);
                // Restore the original bundle selling price and set adminDiscount to null
                bundle.sellingPrice = Math.round(originalPrice);
                bundle.adminDiscount = undefined;
                yield bundle.save();
            }
        }
        sale.products = [];
        sale.bundles = [];
        yield sale.save();
        return res.status(200).json({
            message: 'Sale and associated discounts deleted successfully',
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to delete sale',
            error: err.message,
        });
    }
});
exports.deleteSale = deleteSale;
