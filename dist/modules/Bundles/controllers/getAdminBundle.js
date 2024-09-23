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
exports.getBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const getBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const bundleId = req.query.bundleId;
    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (userRole !== 'admin') {
        return res
            .status(403)
            .json({ message: 'Forbidden: Access is allowed only for Admins' });
    }
    if (!bundleId) {
        return res.status(400).json({ message: 'Bundle ID is required' });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID' });
    }
    try {
        // Fetch the bundle
        const bundle = yield adminBundleModel_1.default.findOne({
            _id: bundleId,
            isDeleted: false,
            isActive: true,
            isBlocked: false,
        }).exec();
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        // Fetch product details
        const productIds = bundle.products.map((p) => p.productId);
        const products = yield productModel_1.default.find({ _id: { $in: productIds } }).exec();
        // Create a map for product details
        const productMap = products.reduce((map, product) => {
            const productId = product._id.toString();
            map[productId] = {
                productId,
                name: product.name,
                MRP: product.MRP,
                sellingPrice: product.sellingPrice,
            };
            return map;
        }, {});
        // Construct the response
        const responseBundle = {
            _id: bundle._id.toString(),
            name: bundle.name,
            description: bundle.description,
            MRP: bundle.MRP,
            sellingPrice: bundle.sellingPrice,
            discount: bundle.discount,
            adminDiscount: bundle.adminDiscount,
            discountId: bundle.discountId,
            products: bundle.products.map((p) => productMap[p.productId.toString()]),
        };
        return res.status(200).json({
            message: 'Bundle retrieved successfully',
            bundle: responseBundle,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Failed to retrieve bundle', error });
    }
});
exports.getBundle = getBundle;
