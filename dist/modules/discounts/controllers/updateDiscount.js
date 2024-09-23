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
exports.updateDiscount = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const updateDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const discountId = req.query.discountId;
    const { startDate, endDate, discount, code } = req.body;
    // Validate discountId
    if (!discountId || !mongoose_1.default.Types.ObjectId.isValid(discountId)) {
        console.log('Invalid discount ID:', discountId);
        return res.status(400).json({ message: 'Invalid discount ID' });
    }
    // Validate at least one field is present
    if (!startDate && !endDate && discount === undefined && !code) {
        console.log('No fields provided for update.');
        return res.status(400).json({
            message: 'At least one field (startDate, endDate, discount, or code) must be provided',
        });
    }
    // Retrieve the existing discount
    let existingDiscount;
    try {
        existingDiscount = yield discountModel_1.default.findOne({
            _id: discountId,
            isDeleted: false,
        });
        if (!existingDiscount) {
            console.log('Discount not found for ID:', discountId);
            return res.status(404).json({ message: 'Discount not found' });
        }
        console.log('Existing discount:', existingDiscount);
    }
    catch (error) {
        console.error('Failed to retrieve existing discount:', error);
        return res
            .status(500)
            .json({ message: 'Failed to retrieve existing discount', error });
    }
    // Date format validation
    let start;
    let end;
    if (startDate) {
        start = new Date(`${startDate}T00:00:00Z`);
        if (isNaN(start.getTime())) {
            console.log('Invalid start date format:', startDate);
            return res.status(400).json({ message: 'Invalid start date format' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        if (start < today) {
            console.log('Start date is in the past:', startDate);
            return res
                .status(400)
                .json({ message: 'Start date cannot be in the past' });
        }
    }
    if (endDate) {
        end = new Date(`${endDate}T23:59:59Z`);
        if (isNaN(end.getTime())) {
            console.log('Invalid end date format:', endDate);
            return res.status(400).json({ message: 'Invalid end date format' });
        }
        if (start && end <= start) {
            console.log('End date is before start date:', { startDate, endDate });
            return res
                .status(400)
                .json({ message: 'End date must be after start date' });
        }
        if (existingDiscount.startDate &&
            end < new Date(existingDiscount.startDate)) {
            console.log('End date is less than the existing start date:', endDate);
            return res.status(400).json({
                message: 'End date cannot be less than the current start date',
            });
        }
    }
    // Discount validation
    if (discount !== undefined) {
        if (typeof discount !== 'number' || discount < 0 || discount > 100) {
            console.log('Invalid discount value:', discount);
            return res
                .status(400)
                .json({ message: 'Discount must be a number between 0 and 100' });
        }
    }
    // Code validation and uniqueness check
    if (code !== undefined) {
        if (typeof code !== 'string' || code.trim() === '') {
            console.log('Invalid discount code:', code);
            return res
                .status(400)
                .json({ message: 'Discount code must be a non-empty string' });
        }
        // const existingDiscountWithCode = await Discount.findOne({
        //   code: code.trim(),
        //   _id: { $ne: discountId },
        // });
        // if (existingDiscountWithCode) {
        //   console.log('Discount code already exists:', code);
        //   return res.status(400).json({ message: 'Discount code already exists' });
        // }
    }
    try {
        // Update the discount
        console.log('Updating discount with ID:', discountId);
        const updatedDiscount = yield discountModel_1.default.findByIdAndUpdate(discountId, {
            startDate: start === null || start === void 0 ? void 0 : start.toISOString(),
            endDate: end === null || end === void 0 ? void 0 : end.toISOString(),
            discount,
            code,
        }, { new: true });
        if (!updatedDiscount) {
            console.log('Discount not found after update:', discountId);
            return res.status(404).json({ message: 'Discount not found' });
        }
        console.log('Discount updated:', updatedDiscount);
        // Update associated products and bundles
        const { productIds, bundleIds } = updatedDiscount;
        const results = [];
        const errors = [];
        if (productIds) {
            console.log('Processing product IDs:', productIds);
            for (const productId of productIds) {
                try {
                    console.log('Validating and fetching product with ID:', productId);
                    const product = yield validateAndFetchEntity(productModel_1.default, productId.toString());
                    if (product) {
                        console.log('Applying discount to product:', product._id);
                        yield applyDiscountToProduct(product, updatedDiscount);
                        results.push({ id: productId.toString(), status: 'success' });
                    }
                }
                catch (error) {
                    const err = error;
                    console.log('Error processing product ID:', productId);
                    console.log('Error details:', err.message);
                    errors.push({ id: productId.toString(), message: err.message });
                }
            }
        }
        if (bundleIds && bundleIds.length > 0) {
            console.log('Processing bundle IDs:', bundleIds);
            for (const bundleId of bundleIds) {
                try {
                    console.log('Validating and fetching bundle with ID:', bundleId);
                    const bundle = yield validateAndFetchEntity(adminBundleModel_1.default, bundleId.toString());
                    if (bundle) {
                        console.log('Applying discount to bundle:', bundle._id);
                        yield applyDiscountToBundle(bundle, updatedDiscount);
                        results.push({ id: bundleId.toString(), status: 'success' });
                    }
                }
                catch (error) {
                    const err = error;
                    console.log('Error processing bundle ID:', bundleId);
                    console.log('Error details:', err.message);
                    errors.push({ id: bundleId.toString(), message: err.message });
                }
            }
        }
        console.log('Discount application complete');
        res.status(200).json({
            message: 'Discount updated successfully and applied to associated entities',
            discount: {
                id: updatedDiscount._id,
                startDate: updatedDiscount.startDate,
                endDate: updatedDiscount.endDate,
                discount: updatedDiscount.discount,
                code: updatedDiscount.code,
                productIds: productIds,
                bundleIds: bundleIds,
                createdBy: updatedDiscount.createdBy,
            },
            results,
            errors,
        });
    }
    catch (error) {
        console.error('Failed to update discount:', error);
        res.status(500).json({ message: 'Failed to update discount', error });
    }
});
exports.updateDiscount = updateDiscount;
// Helper function to validate and fetch an entity
const validateAndFetchEntity = (Model, entityId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Validating and fetching entity:', entityId);
    const entity = yield Model.findOne({
        _id: entityId,
        isBlocked: false,
        isActive: true,
        isDeleted: false,
    }).exec();
    if (!entity) {
        console.log('Invalid entity:', entityId);
        throw new Error(`Entity with ID ${entityId} is not valid (either blocked, inactive, or deleted).`);
    }
    return entity;
});
// Function to apply discount to a product
// Function to apply discount to a product
const applyDiscountToProduct = (product, discount) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Applying discount to product:`, product._id);
    const newDiscountPercent = discount.discount;
    const discountType = discount.type; // Assuming 'type' is passed in the discount object
    if (product.sellingPrice === undefined || product.sellingPrice === null) {
        throw new Error(`Invalid sellingPrice value for product ID ${product._id}`);
    }
    if (discountType === 'MRP') {
        // Apply discount based on MRP
        if (product.MRP === undefined || product.MRP === null) {
            throw new Error(`MRP not available for product ID ${product._id}`);
        }
        const newSellingPrice = product.MRP - (product.MRP * newDiscountPercent) / 100;
        if (newSellingPrice < 0) {
            throw new Error('New selling price cannot be negative');
        }
        product.sellingPrice = newSellingPrice;
    }
    else if (discountType === 'sellingPrice') {
        // Apply discount based on selling price
        if (product.adminDiscount) {
            // Remove the old discount first
            const priceBeforeOldDiscount = product.sellingPrice / (1 - product.adminDiscount / 100);
            // Apply the new discount
            product.sellingPrice =
                priceBeforeOldDiscount -
                    (priceBeforeOldDiscount * newDiscountPercent) / 100;
        }
        else {
            const newSellingPrice = product.sellingPrice -
                (product.sellingPrice * newDiscountPercent) / 100;
            if (newSellingPrice < 0) {
                throw new Error('New selling price cannot be negative');
            }
            product.sellingPrice = newSellingPrice;
        }
    }
    else {
        throw new Error(`Unknown discount type: ${discountType}`);
    }
    product.adminDiscount = newDiscountPercent;
    console.log('Updated product selling price:', product.sellingPrice);
    yield product.save();
});
// Function to apply discount to a bundle
const applyDiscountToBundle = (bundle, discount) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Applying discount to bundle:`, bundle._id);
    const newDiscountPercent = discount.discount;
    const discountType = discount.type; // Assuming 'type' is passed in the discount object
    if (bundle.sellingPrice === undefined || bundle.sellingPrice === null) {
        throw new Error(`Invalid sellingPrice value for bundle ID ${bundle._id}`);
    }
    if (discountType === 'MRP') {
        // Apply discount based on MRP
        if (bundle.MRP === undefined || bundle.MRP === null) {
            throw new Error(`MRP not available for bundle ID ${bundle._id}`);
        }
        const newSellingPrice = bundle.MRP - (bundle.MRP * newDiscountPercent) / 100;
        if (newSellingPrice < 0) {
            throw new Error('New selling price cannot be negative');
        }
        bundle.sellingPrice = newSellingPrice;
    }
    else if (discountType === 'sellingPrice') {
        // Apply discount based on selling price
        if (bundle.adminDiscount) {
            // Remove the old discount first
            const priceBeforeOldDiscount = bundle.sellingPrice / (1 - bundle.adminDiscount / 100);
            // Apply the new discount
            bundle.sellingPrice =
                priceBeforeOldDiscount -
                    (priceBeforeOldDiscount * newDiscountPercent) / 100;
        }
        else {
            const newSellingPrice = bundle.sellingPrice - (bundle.sellingPrice * newDiscountPercent) / 100;
            if (newSellingPrice < 0) {
                throw new Error('New selling price cannot be negative');
            }
            bundle.sellingPrice = newSellingPrice;
        }
    }
    else {
        throw new Error(`Unknown discount type: ${discountType}`);
    }
    bundle.adminDiscount = newDiscountPercent;
    console.log('Updated bundle selling price:', bundle.sellingPrice);
    yield bundle.save();
});
