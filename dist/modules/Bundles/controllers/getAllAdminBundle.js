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
exports.getAllBundles = void 0;
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const getAllBundles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const { page = 1, limit = 10, search = '', sortField = 'createdAt', sortOrder = 'desc', showBlocked = false, showAll = false, } = req.query;
    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (userRole !== 'admin') {
        return res
            .status(403)
            .json({ message: 'Forbidden: Access is allowed only for Admins' });
    }
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const sortOptions = {
        [sortField]: sortOrder === 'asc' ? 1 : -1,
    };
    try {
        const matchStage = {
            $match: {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ],
            },
        };
        // Adjust the match conditions based on showAll and showBlocked
        if (!showAll || showAll === 'false') {
            matchStage.$match.isActive = true;
            matchStage.$match.isBlocked = false;
            matchStage.$match.isDeleted = false;
        }
        else if (showAll === 'true') {
            matchStage.$match.isActive = true;
            matchStage.$match.isDeleted = false;
        }
        if (showBlocked === 'false') {
            // If showBlocked is true, override isActive to include both active and blocked
            matchStage.$match.isActive = true;
            matchStage.$match.isBlocked = false;
            matchStage.$match.isDeleted = false;
        }
        else if (showBlocked === 'true') {
            matchStage.$match.isBlocked = true;
            matchStage.$match.isDeleted = false;
        }
        const sortStage = {
            $sort: sortOptions,
        };
        const skipStage = {
            $skip: (pageNumber - 1) * limitNumber,
        };
        const limitStage = {
            $limit: limitNumber,
        };
        const projectStage = {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                MRP: 1,
                sellingPrice: 1,
                discount: 1,
                isBlocked: 1,
            },
        };
        const facetStage = {
            $facet: {
                metadata: [{ $count: 'total' }],
                bundles: [matchStage, sortStage, skipStage, limitStage, projectStage],
            },
        };
        const bundlesAggregation = yield adminBundleModel_1.default.aggregate([
            matchStage,
            sortStage,
            skipStage,
            limitStage,
            facetStage,
        ]);
        const metadata = ((_c = bundlesAggregation[0]) === null || _c === void 0 ? void 0 : _c.metadata[0]) || { total: 0 };
        const bundles = ((_d = bundlesAggregation[0]) === null || _d === void 0 ? void 0 : _d.bundles) || [];
        return res.status(200).json({
            message: 'Bundles retrieved successfully',
            bundles,
            totalBundles: metadata.total,
            totalPages: Math.ceil(metadata.total / limitNumber),
            currentPage: pageNumber,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Failed to retrieve bundles', error });
    }
});
exports.getAllBundles = getAllBundles;
