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
exports.removeBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const removeBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        if (!existingBundle || existingBundle.isDeleted) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        // Check if the bundle was created by an admin
        if (existingBundle.createdBy.role !== 'admin') {
            return res.status(403).json({
                message: 'You do not have permission to delete this bundle',
            });
        }
        // Remove bundleId from products that are part of the bundle
        const productIds = existingBundle.products.map((p) => p.productId);
        yield productModel_1.default.updateMany({ _id: { $in: productIds } }, { $unset: { bundleIds: '' } });
        // Remove the bundleId from the Discount model
        yield discountModel_1.default.updateMany({ bundleIds: bundleId }, { $pull: { bundleIds: bundleId } });
        // Soft delete the bundle
        existingBundle.isDeleted = true;
        yield existingBundle.save();
        return res.status(200).json({ message: 'Bundle deleted successfully' });
    }
    catch (error) {
        console.error('Error while deleting bundle:', error);
        return res.status(500).json({ message: 'Failed to delete bundle', error });
    }
});
exports.removeBundle = removeBundle;
