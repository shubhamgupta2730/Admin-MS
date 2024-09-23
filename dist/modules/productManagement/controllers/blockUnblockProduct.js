"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.toggleBlockProduct = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const authModel_1 = __importDefault(require("../../../models/authModel"));
const mongoose_1 = __importStar(require("mongoose"));
// Block/Unblock a product
const toggleBlockProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.query.productId;
        const { action } = req.body;
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const adminId = req.user.userId;
        if (!mongoose_1.Types.ObjectId.isValid(productId) ||
            !mongoose_1.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({ message: 'Invalid product or admin ID' });
        }
        if (action !== 'block' && action !== 'unblock') {
            return res.status(400).json({ message: 'Invalid action' });
        }
        const product = yield productModel_1.default.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.isDeleted) {
            return res.status(400).json({ message: 'Product is already deleted' });
        }
        let blockedBy = null;
        if (action === 'block') {
            if (product.isBlocked) {
                return res.status(400).json({ message: 'Product is already blocked' });
            }
            product.isBlocked = true;
            product.blockedBy = new mongoose_1.default.Types.ObjectId(adminId);
            // Fetch admin details to include in the response
            const admin = yield authModel_1.default.findById(adminId).select('name');
            if (!admin) {
                return res.status(404).json({ message: 'Admin not found' });
            }
            blockedBy = {
                id: adminId,
                name: admin.name,
            };
        }
        else if (action === 'unblock') {
            if (!product.isBlocked) {
                return res.status(400).json({ message: 'Product is not blocked' });
            }
            product.isBlocked = false;
            product.blockedBy = null;
        }
        yield product.save();
        const response = {
            message: `Product ${action}ed successfully`,
            product: {
                _id: product._id,
                name: product.name,
                isBlocked: product.isBlocked,
                updatedAt: product.updatedAt,
            },
        };
        if (action === 'block') {
            response.product.blockedBy = blockedBy;
        }
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.toggleBlockProduct = toggleBlockProduct;
