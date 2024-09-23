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
exports.updateBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const updateBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { name, description, products, discount, } = req.body;
    const bundleId = req.query.bundleId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (userRole !== 'admin') {
        return res
            .status(403)
            .json({ message: 'Forbidden: Access is allowed only for Admins' });
    }
    if (!bundleId || !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid or missing bundle ID' });
    }
    try {
        const existingBundle = yield adminBundleModel_1.default.findById(bundleId).exec();
        if (!existingBundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        // Check if the bundle was created by an admin
        if (existingBundle.createdBy.role !== 'admin') {
            return res.status(403).json({
                message: 'You do not have permission to update this bundle',
            });
        }
        let totalMRP = existingBundle.MRP;
        let newProducts = [];
        if (products && Array.isArray(products) && products.length > 0) {
            const productIds = products.map((p) => new mongoose_1.default.Types.ObjectId(p.productId));
            const activeProducts = yield productModel_1.default.find({
                _id: { $in: productIds },
                isActive: true,
                isBlocked: { $ne: true },
                isDeleted: { $ne: true },
            }).exec();
            if (activeProducts.length !== productIds.length) {
                return res.status(403).json({
                    message: 'One or more products are not active, blocked, or deleted',
                });
            }
            const uniqueProductIds = new Set(productIds.map((id) => id.toString()));
            if (uniqueProductIds.size !== productIds.length) {
                return res.status(400).json({
                    message: 'Duplicate products are not allowed in the bundle',
                });
            }
            // Calculate the new total MRP based on the new products
            totalMRP = activeProducts.reduce((acc, product) => acc + product.MRP, existingBundle.MRP);
            // Filter out existing products and add only new ones
            const existingProducts = new Set(existingBundle.products.map((p) => p.productId.toString()));
            newProducts = productIds.filter((id) => !existingProducts.has(id.toString()));
            existingBundle.products.push(...newProducts.map((id) => ({ productId: id })));
            // Update the bundle field for the products
            yield productModel_1.default.updateMany({ _id: { $in: newProducts } }, { $addToSet: { bundleIds: existingBundle._id } });
        }
        // Update the fields that are provided
        if (name)
            existingBundle.name = name;
        if (description)
            existingBundle.description = description;
        // Calculate the selling price based on the discount if provided
        if (typeof discount === 'number' && discount >= 0 && discount <= 100) {
            existingBundle.discount = discount;
            existingBundle.sellingPrice = totalMRP - totalMRP * (discount / 100);
        }
        else {
            // If discount is not provided, recalculate based on the existing discount
            existingBundle.sellingPrice =
                totalMRP - totalMRP * (existingBundle.discount / 100);
        }
        existingBundle.MRP = totalMRP;
        existingBundle.updatedAt = new Date();
        const updatedBundle = yield existingBundle.save();
        return res.status(200).json({
            message: 'Bundle updated successfully',
            bundle: updatedBundle,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to update bundle', error });
    }
});
exports.updateBundle = updateBundle;
