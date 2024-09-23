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
exports.removeProductFromBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const removeProductFromBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { bundleId, productId } = req.query;
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
    if (!productId || !mongoose_1.default.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID format' });
    }
    try {
        const existingBundle = yield adminBundleModel_1.default.findOne({
            _id: bundleId,
            isBlocked: false,
            isDeleted: false,
        }).exec();
        if (!existingBundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        // Check if the product is in the bundle
        const productIndex = existingBundle.products.findIndex((p) => p.productId.toString() === productId);
        if (productIndex === -1) {
            return res
                .status(404)
                .json({ message: 'Product not found in the bundle' });
        }
        // Get the product to be removed
        const productToRemove = yield productModel_1.default.findById(productId).exec();
        if (!productToRemove) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Calculate the new MRP by subtracting the MRP of the removed product
        const removedProductMRP = productToRemove.MRP;
        existingBundle.MRP -= removedProductMRP;
        // Remove the product from the bundle
        existingBundle.products.splice(productIndex, 1);
        // Check if this was the last product in the bundle
        if (existingBundle.products.length === 0) {
            existingBundle.isActive = false; // Set isActive to false if no products left
        }
        else {
            // Recalculate the selling price if there are still products left
            let sellingPrice = existingBundle.MRP;
            if (existingBundle.discount) {
                sellingPrice =
                    existingBundle.MRP -
                        existingBundle.MRP * (existingBundle.discount / 100);
            }
            existingBundle.sellingPrice = sellingPrice;
        }
        existingBundle.updatedAt = new Date();
        const updatedBundle = yield existingBundle.save();
        // Remove the bundleId from the product
        yield productModel_1.default.findByIdAndUpdate(productId, {
            $pull: { bundleIds: updatedBundle._id },
        });
        return res.status(200).json({
            message: 'Product removed from bundle successfully',
            bundle: updatedBundle,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Failed to remove product from bundle', error });
    }
});
exports.removeProductFromBundle = removeProductFromBundle;
