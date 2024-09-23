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
exports.createBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const createBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { name, description, products, discount, } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        // Validation for name and description
        if (!name || !description) {
            return res.status(400).json({
                message: 'Name and description are required',
            });
        }
        // Validation for products array
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: 'Products array is required and should not be empty',
            });
        }
        // Validation for discount percentage
        if (typeof discount !== 'number' || discount < 0 || discount > 100) {
            return res.status(400).json({
                message: 'Discount percentage must be a number between 0 and 100',
            });
        }
        // Validate product details and gather product IDs
        const productIds = [];
        for (const product of products) {
            if (!product.productId) {
                return res.status(400).json({
                    message: 'Each product must have a valid productId',
                });
            }
            productIds.push(new mongoose_1.default.Types.ObjectId(product.productId));
        }
        // Validate active, non-blocked, and non-deleted products
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
        // Ensure no duplicate products
        const uniqueProductIds = new Set(productIds.map((id) => id.toString()));
        if (uniqueProductIds.size !== productIds.length) {
            return res.status(400).json({
                message: 'Duplicate products are not allowed in the bundle',
            });
        }
        // Calculate total MRP without considering quantity
        let totalMRP = 0;
        const productPriceMap = {};
        activeProducts.forEach((product) => {
            const productId = product._id.toString();
            productPriceMap[productId] = product.MRP;
        });
        for (const productId of productIds) {
            if (!productPriceMap[productId.toString()]) {
                return res
                    .status(404)
                    .json({ message: `Product with ID ${productId} not found` });
            }
            totalMRP += productPriceMap[productId.toString()];
        }
        // Calculate selling price based on discount
        let sellingPrice = totalMRP;
        if (discount) {
            sellingPrice = totalMRP - totalMRP * (discount / 100);
        }
        // Create and save the new bundle
        const newBundle = new adminBundleModel_1.default({
            name,
            description,
            MRP: totalMRP,
            sellingPrice,
            discount,
            products: products.map((p) => ({
                productId: new mongoose_1.default.Types.ObjectId(p.productId),
            })),
            createdBy: {
                id: new mongoose_1.default.Types.ObjectId(userId),
                role: userRole,
            },
            isActive: true,
        });
        const savedBundle = yield newBundle.save();
        // Update products with the bundle ID
        yield productModel_1.default.updateMany({ _id: { $in: productIds } }, { $push: { bundleIds: savedBundle._id } });
        res.status(201).json({
            message: 'Bundle created successfully',
            bundle: savedBundle,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create bundle', error });
    }
});
exports.createBundle = createBundle;
