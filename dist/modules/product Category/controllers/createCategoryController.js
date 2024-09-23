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
exports.createCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const authModel_1 = __importDefault(require("../../../models/authModel"));
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description } = req.body;
    const createdBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!name || !description) {
        return res.status(400).json({
            message: 'Name and description are required',
        });
    }
    if (!createdBy) {
        return res.status(400).json({
            message: 'User ID is required',
        });
    }
    try {
        const existingCategory = yield productCategoryModel_1.default.findOne({ name, isActive: true });
        if (existingCategory) {
            return res.status(400).json({
                message: 'Category with this name already exists. Please add another category.',
            });
        }
        const category = new productCategoryModel_1.default({
            name,
            description,
            createdBy: new mongoose_1.default.Types.ObjectId(createdBy),
        });
        yield category.save();
        // Fetch admin details
        const admin = yield authModel_1.default.findById(createdBy).select('name');
        if (!admin) {
            return res.status(400).json({
                message: 'Admin not found',
            });
        }
        // Prepare the response object
        const categoryObject = {
            id: category._id,
            name: category.name,
            description: category.description,
            createdBy: {
                id: admin._id,
                name: admin.name,
            },
        };
        res.status(201).json({
            message: 'Category created successfully',
            category: categoryObject,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'An error occurred while creating the category',
        });
    }
});
exports.createCategory = createCategory;
