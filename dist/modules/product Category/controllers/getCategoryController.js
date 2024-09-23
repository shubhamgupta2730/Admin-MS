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
exports.getCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const authModel_1 = __importDefault(require("../../../models/authModel"));
const productModel_1 = __importDefault(require("../../../models/productModel")); // Assuming you have a Product model
const getCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid or missing category ID',
        });
    }
    try {
        // Fetch the category by ID
        const category = yield productCategoryModel_1.default.findOne({ _id: id, isActive: true });
        if (!category) {
            return res.status(404).json({
                message: 'Category not found or inactive',
            });
        }
        const createdBy = category.createdBy;
        // Fetch admin details
        const admin = yield authModel_1.default.findById(createdBy).select('name');
        if (!admin) {
            return res.status(400).json({
                message: 'Admin not found',
            });
        }
        // Fetch product details (IDs and names)
        const products = yield productModel_1.default.find({
            _id: { $in: category.productIds },
            isActive: true,
        }).select('_id name');
        // Format dates
        const formatDate = (date) => date.toISOString().split('T')[0];
        // Prepare the category object with product details
        const categoryObject = {
            id: category._id,
            name: category.name,
            description: category.description,
            createdAt: formatDate(category.createdAt),
            updatedAt: formatDate(category.updatedAt),
            createdBy: {
                id: admin._id,
                name: admin.name,
            },
            products: products.map((product) => ({
                id: product._id,
                name: product.name,
            })),
        };
        res.status(200).json({
            message: 'Category retrieved successfully',
            category: categoryObject,
        });
    }
    catch (error) {
        console.error('Error retrieving category:', error);
        res.status(500).json({
            message: 'An error occurred while retrieving the category',
        });
    }
});
exports.getCategory = getCategory;
