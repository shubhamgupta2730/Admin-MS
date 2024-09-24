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
exports.createSale = void 0;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const productCategoryModel_1 = __importDefault(require("../../../models/productCategoryModel"));
const createSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name, description, startDate, endDate, categories } = req.body;
    const createdBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    // Validate "name"
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
            message: 'The name field is required and cannot be empty or whitespace.',
        });
    }
    if (!/^[a-zA-Z0-9\s]{3,}$/.test(name.trim())) {
        return res.status(400).json({
            message: 'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
        });
    }
    // Validate "description"
    if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
            message: 'The description field is required and cannot be empty or whitespace.',
        });
    }
    if (!/^[a-zA-Z0-9\s]{5,}$/.test(description.trim())) {
        return res.status(400).json({
            message: 'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
        });
    }
    // Validate "startDate"
    if (!startDate || !(0, moment_1.default)(startDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
        return res.status(400).json({
            message: 'The startDate field is required and must be in yyyy-mm-dd HH:mm:ss format.',
        });
    }
    // Validate "endDate"
    if (!endDate || !(0, moment_1.default)(endDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
        return res.status(400).json({
            message: 'The endDate field is required and must be in yyyy-mm-dd HH:mm:ss format.',
        });
    }
    // Parse dates
    const start = (0, moment_1.default)(startDate, 'YYYY-MM-DD HH:mm:ss');
    const end = (0, moment_1.default)(endDate, 'YYYY-MM-DD HH:mm:ss');
    // Ensure startDate is not in the past
    if (start.isBefore((0, moment_1.default)())) {
        return res.status(400).json({
            message: 'The startDate and time cannot be in the past.',
        });
    }
    // Ensure startDate is before endDate with time
    if (!end.isAfter(start)) {
        return res.status(400).json({
            message: 'The endDate and time must be after the startDate and time.',
        });
    }
    // Validate "categories"
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
            message: 'The categories field must be a non-empty array.',
        });
    }
    // Check for overlapping sales
    const overlappingSale = yield saleModel_1.default.findOne({
        $or: [
            {
                startDate: { $lte: end.toDate() },
                endDate: { $gte: start.toDate() },
            },
            {
                startDate: { $lte: start.toDate() },
                endDate: { $gte: end.toDate() },
            },
        ],
        isDeleted: false,
    });
    if (overlappingSale) {
        return res.status(400).json({
            message: 'A sale already exists within the specified time period.',
        });
    }
    // Validate each category entry
    const validCategories = [];
    for (const category of categories) {
        if (!category.categoryId ||
            !mongoose_1.default.Types.ObjectId.isValid(category.categoryId)) {
            return res.status(400).json({
                message: 'Each category must have a valid categoryId.',
            });
        }
        if (typeof category.discount !== 'number' ||
            category.discount <= 0 ||
            category.discount > 100) {
            return res.status(400).json({
                message: 'Each category must have a valid discount between 0 and 100.',
            });
        }
        const cat = yield productCategoryModel_1.default.findById(category.categoryId);
        if (!cat || !cat.isActive) {
            return res.status(400).json({
                message: `Category with ID ${category.categoryId} is either inactive or deleted.`,
            });
        }
        validCategories.push({
            categoryId: category.categoryId,
            discount: category.discount,
        });
    }
    // Validate "createdBy"
    if (!createdBy || !mongoose_1.default.Types.ObjectId.isValid(createdBy)) {
        return res.status(400).json({
            message: 'Invalid createdBy user ID.',
        });
    }
    try {
        const sale = new saleModel_1.default({
            name: name.trim(),
            description: description.trim(),
            startDate: start.toDate(),
            endDate: end.toDate(),
            categories: validCategories,
            createdBy,
            isActive: start.isSameOrBefore((0, moment_1.default)()) && end.isSameOrAfter((0, moment_1.default)()),
        });
        yield sale.save();
        // Prepare data to send to the scheduler MS:
        const schedulerData = {
            saleId: sale._id,
            saleName: sale.name,
            startDate: sale.startDate,
            endDate: sale.endDate,
            categories: validCategories,
        };
        // Send the data to the scheduler microservice
        yield axios_1.default.post('https://scheduler-ms.onrender.com/schedule-tasks', schedulerData);
        return res.status(201).json({
            message: 'Sale created successfully',
            sale,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to create sale',
            error: err.message,
        });
    }
});
exports.createSale = createSale;
