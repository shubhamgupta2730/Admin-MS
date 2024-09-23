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
exports.updateCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const authModel_1 = __importDefault(require("../../../models/authModel"));
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.query.id;
    const { name, description } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid category ID',
        });
    }
    if (!name && !description) {
        return res.status(400).json({
            message: 'At least one of name or description is required to update',
        });
    }
    if (!userId) {
        return res.status(400).json({
            message: 'User ID is required',
        });
    }
    try {
        const category = yield productCategoryModel_1.default.findById(id);
        if (!category) {
            return res.status(404).json({
                message: 'Category not found',
            });
        }
        if (category.createdBy.toString() !== userId) {
            return res.status(403).json({
                message: 'You do not have permission to update this category',
            });
        }
        const existingCategory = (yield productCategoryModel_1.default.findOne({
            name,
            isActive: true,
        }));
        if (existingCategory && existingCategory._id.toString() !== id) {
            return res.status(400).json({
                message: 'Category with this name already exists. Please choose another name.',
            });
        }
        if (name)
            category.name = name;
        if (description)
            category.description = description;
        yield category.save();
        // Fetch admin details
        const admin = yield authModel_1.default.findById(category.createdBy)
            .select('name')
            .exec();
        if (!admin) {
            return res.status(400).json({
                message: 'Admin not found',
            });
        }
        // Format dates
        const formatDate = (date) => date.toISOString().split('T')[0];
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
        };
        res.status(200).json({
            message: 'Category updated successfully',
            category: categoryObject,
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            message: 'An error occurred while updating the category',
        });
    }
});
exports.updateCategory = updateCategory;
