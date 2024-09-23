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
exports.removeDiscountFromProductsBundles = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const removeDiscountFromProductsBundles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productIds, bundleIds } = req.body;
    const discountId = req.query.discountId;
    if (!Array.isArray(productIds) && !Array.isArray(bundleIds)) {
        return res.status(400).json({
            message: 'Either productIds or bundleIds must be provided.',
        });
    }
    if (!discountId || !mongoose_1.default.Types.ObjectId.isValid(discountId)) {
        return res.status(400).json({
            message: 'A valid discountId query parameter is required.',
        });
    }
    try {
        const discount = yield discountModel_1.default.findOne({
            _id: discountId,
            isActive: true,
        });
        if (!discount) {
            return res.status(400).json({
                message: 'Invalid or inactive discount ID',
            });
        }
        const results = [];
        const errors = [];
        if (Array.isArray(productIds) && productIds.length > 0) {
            for (const productId of productIds) {
                try {
                    const product = yield validateAndFetchEntity(productModel_1.default, productId);
                    if (product &&
                        product.adminDiscount &&
                        product.discountId &&
                        product.discountId.equals(discount._id)) {
                        yield removeDiscountFromProduct(product, discount);
                        discount.productIds = discount.productIds.filter((id) => !id.equals(productId));
                        results.push({ id: productId, status: 'success' });
                    }
                    else {
                        errors.push({
                            id: productId,
                            message: 'Product not associated with this discount or no discount applied',
                        });
                    }
                }
                catch (error) {
                    errors.push({
                        id: productId,
                        message: `Error processing product: ${error.message}`,
                    });
                }
            }
        }
        if (Array.isArray(bundleIds) && bundleIds.length > 0) {
            for (const bundleId of bundleIds) {
                try {
                    const bundle = yield validateAndFetchEntity(adminBundleModel_1.default, bundleId);
                    if (bundle &&
                        bundle.adminDiscount &&
                        bundle.discountId &&
                        bundle.discountId.equals(discount._id)) {
                        yield removeDiscountFromBundle(bundle, discount);
                        discount.bundleIds = discount.bundleIds.filter((id) => !id.equals(bundleId));
                        results.push({ id: bundleId, status: 'success' });
                    }
                    else {
                        errors.push({
                            id: bundleId,
                            message: 'Bundle not associated with this discount or no discount applied',
                        });
                    }
                }
                catch (error) {
                    errors.push({
                        id: bundleId,
                        message: `Error processing bundle: ${error.message}`,
                    });
                }
            }
        }
        yield discount.save();
        res.status(200).json({
            message: 'Discount removal complete',
            results,
            errors,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Failed to remove discount',
            error: error.message,
        });
    }
});
exports.removeDiscountFromProductsBundles = removeDiscountFromProductsBundles;
const validateAndFetchEntity = (Model, entityId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(entityId)) {
        throw new Error(`Invalid ID: ${entityId}`);
    }
    const entity = yield Model.findOne({
        _id: entityId,
        isBlocked: false,
        isActive: true,
        isDeleted: false,
    });
    if (!entity) {
        throw new Error(`Entity with ID ${entityId} is not valid (either blocked, inactive, or deleted).`);
    }
    return entity;
});
const removeDiscountFromProduct = (product, discount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!product.adminDiscount ||
        !product.discountId ||
        !product.discountId.equals(discount._id)) {
        throw new Error('No admin discount applied to this product or discount does not match');
    }
    let sellingPrice = product.sellingPrice;
    if (discount.type === 'MRP') {
        // Add back the discount that was previously applied to selling price
        // const discountAmount = (product.MRP * discount.value) / 100;
        sellingPrice = product.MRP - product.MRP * (product.discount / 100);
        // sellingPrice = product.MRP - discountAmount;
    }
    else if (discount.type === 'sellingPrice') {
        // Directly remove the discount percentage from the selling price
        const discountAmount = (product.sellingPrice * discount.discount) / 100;
        sellingPrice += discountAmount;
        console.log(sellingPrice);
    }
    // if (isNaN(sellingPrice) || sellingPrice < 0) {
    //   console.warn(`Invalid sellingPrice calculated for product ${product._id}, resetting to MRP.`);
    //   sellingPrice = product.MRP;
    // }
    product.sellingPrice = sellingPrice;
    product.adminDiscount = null;
    product.discountId = null;
    yield product.save();
});
const removeDiscountFromBundle = (bundle, discount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bundle.adminDiscount ||
        !bundle.discountId ||
        !bundle.discountId.equals(discount._id)) {
        throw new Error('No admin discount applied to this bundle or discount does not match');
    }
    let sellingPrice = bundle.sellingPrice;
    if (discount.type === 'MRP') {
        // Add back the discount that was previously applied to selling price
        // const discountAmount = (bundle.MRP * discount.discount) / 100;
        //  newMRP  = bundle.MRP - discountAmount;
        sellingPrice = bundle.MRP - bundle.MRP * (bundle.discount / 100);
    }
    else if (discount.type === 'sellingPrice') {
        // Directly remove the discount percentage from the selling price
        const discountAmount = (bundle.sellingPrice * discount.discount) / 100;
        sellingPrice += discountAmount;
    }
    // if (isNaN(sellingPrice) || sellingPrice < 0) {
    //   console.warn(`Invalid sellingPrice calculated for bundle ${bundle._id}, resetting to MRP.`);
    //   sellingPrice = bundle.MRP;
    // }
    bundle.sellingPrice = sellingPrice;
    bundle.adminDiscount = null;
    bundle.discountId = null;
    yield bundle.save();
});
