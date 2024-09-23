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
exports.applyDiscount = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const applyDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productIds, bundleIds } = req.body;
    const { discountId } = req.query;
    if ((!productIds || productIds.length === 0) &&
        (!bundleIds || bundleIds.length === 0)) {
        console.log('Validation error: Either productIds or bundleIds must be provided.');
        return res.status(400).json({
            message: 'Either productIds or bundleIds must be provided.',
        });
    }
    if (productIds &&
        bundleIds &&
        productIds.length > 0 &&
        bundleIds.length > 0) {
        console.log('Validation error: Both productIds and bundleIds provided.');
        return res.status(400).json({
            message: 'Either productIds or bundleIds must be provided, but not both together.',
        });
    }
    try {
        console.log('Validating discount ID:', discountId);
        const discount = yield discountModel_1.default.findOne({
            _id: discountId,
            isActive: true,
            isDeleted: false,
        });
        if (!discount) {
            console.log('Invalid or inactive discount ID:', discountId);
            return res
                .status(400)
                .json({ message: 'Invalid or inactive discount ID' });
        }
        // Retrieve the type from the discount
        const { type } = discount;
        // Check if the discount is within the valid date range
        const now = new Date();
        if (discount.startDate && new Date(discount.startDate) > now) {
            console.log('Discount is not yet active.');
            return res.status(400).json({ message: 'Discount is not yet active.' });
        }
        if (discount.endDate && new Date(discount.endDate) < now) {
            console.log('Discount has expired.');
            return res.status(400).json({ message: 'Discount has expired.' });
        }
        const results = [];
        const errors = [];
        if (productIds && productIds.length > 0) {
            console.log('Processing product IDs:', productIds);
            for (const productId of productIds) {
                try {
                    const product = yield validateAndFetchEntity(productModel_1.default, productId);
                    if (product) {
                        yield applyDiscountToProduct(product, discount, type); // Use type from discount
                        discount.productIds.push(productId);
                        results.push({ id: productId, status: 'success' });
                    }
                }
                catch (error) {
                    const err = error;
                    console.log('Error processing product ID:', productId);
                    errors.push({ id: productId, message: err.message });
                }
            }
        }
        if (bundleIds && bundleIds.length > 0) {
            console.log('Processing bundle IDs:', bundleIds);
            for (const bundleId of bundleIds) {
                try {
                    const bundle = yield validateAndFetchEntity(adminBundleModel_1.default, bundleId);
                    if (bundle) {
                        yield applyDiscountToBundle(bundle, discount, type); // Use type from discount
                        discount.bundleIds.push(bundleId);
                        results.push({ id: bundleId, status: 'success' });
                    }
                }
                catch (error) {
                    const err = error;
                    console.log('Error processing bundle ID:', bundleId);
                    errors.push({ id: bundleId, message: err.message });
                }
            }
        }
        yield discount.save();
        console.log('Discount application complete');
        res.status(200).json({
            message: 'Discount application complete',
            results,
            errors,
        });
    }
    catch (error) {
        console.error('Failed to apply discount:', error);
        res.status(500).json({ message: 'Failed to apply discount' });
    }
});
exports.applyDiscount = applyDiscount;
const validateAndFetchEntity = (Model, entityId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Validating and fetching entity:', entityId);
    const entity = yield Model.findOne({
        _id: entityId,
        isBlocked: false,
        isActive: true,
        isDeleted: false,
    });
    if (!entity) {
        console.log('Invalid entity:', entityId);
        throw new Error(`Entity with ID ${entityId} is not valid (either blocked, inactive, or deleted).`);
    }
    return entity;
});
const applyDiscountToProduct = (product, discount, type) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Applying discount to product:`, product._id);
    if (product.adminDiscount) {
        throw new Error('Discount already applied to this product');
    }
    product.adminDiscount = discount.discount;
    product.discountId = discount._id; // Store the discount ID in the product
    if (type === 'MRP') {
        if (typeof product.MRP === 'undefined' || product.MRP === null) {
            throw new Error(`Invalid MRP value for product ID ${product._id}`);
        }
        const newMRP = product.MRP - (product.MRP * discount.discount) / 100;
        if (newMRP < 0) {
            throw new Error(`Discounted MRP cannot be less than zero for product ID ${product._id}`);
        }
        product.sellingPrice = newMRP; // Set the new selling price based on MRP
    }
    else {
        if (typeof product.sellingPrice === 'undefined' ||
            product.sellingPrice === null) {
            throw new Error(`Invalid sellingPrice value for product ID ${product._id}`);
        }
        const newSellingPrice = product.sellingPrice - (product.sellingPrice * discount.discount) / 100;
        if (newSellingPrice < 0) {
            throw new Error(`Discounted selling price cannot be less than zero for product ID ${product._id}`);
        }
        product.sellingPrice = newSellingPrice; // Set the new selling price
    }
    yield product.save();
    console.log(`Discount applied to product:`, product._id);
});
const applyDiscountToBundle = (bundle, discount, type) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Applying discount to bundle:`, bundle._id);
    if (bundle.adminDiscount) {
        throw new Error('Discount already applied to this bundle');
    }
    bundle.adminDiscount = discount.discount;
    bundle.discountId = discount._id; // Store the discount ID in the bundle
    if (type === 'MRP') {
        if (typeof bundle.MRP === 'undefined' || bundle.MRP === null) {
            throw new Error(`Invalid MRP value for bundle ID ${bundle._id}`);
        }
        const newMRP = bundle.MRP - (bundle.MRP * discount.discount) / 100;
        if (newMRP < 0) {
            throw new Error(`Discounted MRP cannot be less than zero for bundle ID ${bundle._id}`);
        }
        bundle.sellingPrice = newMRP; // Set the new selling price based on MRP
    }
    else {
        if (typeof bundle.sellingPrice === 'undefined' ||
            bundle.sellingPrice === null) {
            throw new Error(`Invalid sellingPrice value for bundle ID ${bundle._id}`);
        }
        const newSellingPrice = bundle.sellingPrice - (bundle.sellingPrice * discount.discount) / 100;
        if (newSellingPrice < 0) {
            throw new Error(`Discounted selling price cannot be less than zero for bundle ID ${bundle._id}`);
        }
        bundle.sellingPrice = newSellingPrice; // Set the new selling price
    }
    yield bundle.save();
    console.log(`Discount applied to bundle:`, bundle._id);
});
