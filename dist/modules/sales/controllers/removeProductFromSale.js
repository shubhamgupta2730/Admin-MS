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
exports.removeProductFromSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
// Helper function to round prices to the nearest whole number
const roundToWhole = (value) => Math.round(value);
const removeProductFromSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const saleId = req.query.saleId;
    const { productIds } = req.body;
    // Validate Sale ID
    if (!saleId || !mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    // Validate productIds
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
            message: 'The productIds field must be a non-empty array.',
        });
    }
    // Validate each productId
    for (const productId of productIds) {
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: `Invalid product ID: ${productId}.`,
            });
        }
    }
    try {
        // Find the sale
        const sale = yield saleModel_1.default.findOne({ _id: saleId, isDeleted: false }).populate('categories.categoryId');
        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found or has been deleted.',
            });
        }
        // Check if the sale is ongoing or in the future
        const now = new Date();
        if (sale.endDate <= now) {
            return res.status(400).json({
                message: 'Cannot modify products in a sale that has ended.',
            });
        }
        const removedProducts = [];
        const notFoundProducts = [];
        const removedBundles = [];
        const updatedBundles = [];
        // Process each productId
        for (const productId of productIds) {
            const productIndex = sale.products.findIndex((p) => p.productId.toString() === productId);
            if (productIndex === -1) {
                // If the product is not in the sale
                notFoundProducts.push(productId);
                continue;
            }
            // Remove the product from the sale
            sale.products.splice(productIndex, 1);
            // Find the product and restore the original selling price
            const product = yield productModel_1.default.findById(productId);
            if (product) {
                const saleCategory = sale.categories.find((cat) => { var _a; return (_a = product.categoryId) === null || _a === void 0 ? void 0 : _a.equals(cat.categoryId._id); });
                if (saleCategory) {
                    // Calculate the original price before the discount was applied
                    const discount = product.adminDiscount || 0;
                    const discountedPrice = product.sellingPrice;
                    const originalPrice = discountedPrice / (1 - discount / 100);
                    // Restore the original selling price
                    product.sellingPrice = roundToWhole(originalPrice);
                    product.adminDiscount = null;
                    yield product.save();
                }
                removedProducts.push(productId);
                // Check for bundles containing this product and update/remove them
                const bundlesContainingProduct = yield adminBundleModel_1.default.find({
                    'products.productId': productId,
                    isActive: true,
                    isDeleted: false,
                });
                for (const bundle of bundlesContainingProduct) {
                    const bundleId = bundle._id;
                    const bundleProducts = bundle.products;
                    const remainingProductsInBundle = bundleProducts.filter((bp) => sale.products.some((sp) => sp.productId.equals(bp.productId)));
                    if (remainingProductsInBundle.length === 0) {
                        // If the bundle contains no products left in the sale, remove it from the sale
                        const bundleIndex = sale.bundles.findIndex((b) => b.bundleId.equals(bundleId));
                        if (bundleIndex !== -1) {
                            sale.bundles.splice(bundleIndex, 1);
                            removedBundles.push(bundleId.toString());
                            // Recalculate original price for the removed bundle
                            const bundleDiscount = bundle.adminDiscount || 0;
                            const originalBundlePrice = bundle.sellingPrice / (1 - bundleDiscount / 100);
                            bundle.sellingPrice = roundToWhole(originalBundlePrice);
                            bundle.adminDiscount = undefined;
                            yield bundle.save();
                        }
                    }
                    else {
                        // Bundle remains in the sale, so no need to update prices
                        updatedBundles.push(bundleId.toString());
                    }
                }
            }
        }
        // Save the updated sale
        yield sale.save();
        // Response with the status of the removal process
        return res.status(200).json({
            message: 'Products removal process completed.',
            removedProducts,
            notFoundProducts,
            removedBundles,
            updatedBundles,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to remove products from sale',
            error: err.message,
        });
    }
});
exports.removeProductFromSale = removeProductFromSale;
