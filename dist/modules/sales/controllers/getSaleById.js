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
exports.getSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const getSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const saleId = req.query.saleId;
    if (!saleId || !mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    try {
        // Find the sale with populated categories, products, and bundles
        const sale = yield saleModel_1.default.findOne({
            _id: saleId,
            isDeleted: false,
        })
            .populate({
            path: 'categories.categoryId',
            select: 'name',
        })
            .populate({
            path: 'products.productId',
            select: 'name sellingPrice categoryId',
        })
            .populate({
            path: 'bundles.bundleId',
            select: 'name sellingPrice products',
            populate: {
                path: 'products.productId',
                select: 'name sellingPrice',
            },
        });
        if (!sale) {
            return res.status(404).json({
                message: 'Sale not found.',
            });
        }
        // Format the sale for response
        const formattedSale = {
            id: sale._id,
            name: sale.name,
            description: sale.description,
            startDate: sale.startDate.toLocaleString(), // Date and time format
            endDate: sale.endDate.toLocaleString(), // Date and time format
            isActive: sale.isActive,
            categories: sale.categories.map((cat) => {
                const category = cat.categoryId;
                const productsInCategory = sale.products
                    .map((p) => p.productId)
                    .filter((product) => { var _a; return (_a = product.categoryId) === null || _a === void 0 ? void 0 : _a._id.equals(category._id); })
                    .map((product) => ({
                    productId: product._id,
                    productName: product.name,
                    sellingPrice: product.sellingPrice,
                }));
                return {
                    categoryId: category._id,
                    categoryName: category.name || 'Unknown',
                    discount: cat.discount,
                    products: productsInCategory,
                };
            }),
            bundles: sale.bundles.map((bundle) => {
                const bundleData = bundle.bundleId;
                const productsInBundle = bundleData.products.map((product) => ({
                    productId: product.productId._id,
                    productName: product.productId.name,
                    sellingPrice: product.productId.sellingPrice,
                }));
                return {
                    bundleId: bundleData._id,
                    bundleName: bundleData.name,
                    sellingPrice: bundleData.sellingPrice,
                    products: productsInBundle,
                };
            }),
            createdBy: sale.createdBy,
        };
        return res.status(200).json({
            message: 'Sale retrieved successfully',
            sale: formattedSale,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to retrieve sale',
            error: err.message,
        });
    }
});
exports.getSale = getSale;
