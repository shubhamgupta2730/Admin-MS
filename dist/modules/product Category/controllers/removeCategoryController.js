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
exports.deleteCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.query.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid category ID',
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
                message: 'You do not have permission to delete this category',
            });
        }
        // Check if the category contains products
        if (category.productIds.length > 0) {
            return res.status(400).json({
                message: 'This category contains products and cannot be deleted',
            });
        }
        // Set the category as inactive
        category.isActive = false;
        yield category.save();
        res.status(200).json({
            message: 'Category removed successfully',
        });
    }
    catch (error) {
        console.error('Error removing category:', error);
        res.status(500).json({
            message: 'An error occurred while removing the category',
        });
    }
});
exports.deleteCategory = deleteCategory;
