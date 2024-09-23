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
exports.getDiscountById = void 0;
const discountModel_1 = __importDefault(require("../../../models/discountModel"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const getDiscountById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    try {
        // Check if ID is provided
        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                message: 'Discount ID is required',
            });
        }
        // Fetch the discount from the database
        const discount = yield discountModel_1.default.findOne({ _id: id, isDeleted: false });
        console.log(discount);
        // Check if discount exists
        if (!discount) {
            return res.status(404).json({
                message: 'Discount not found',
            });
        }
        // Fetch the admin details
        const admin = yield adminBundleModel_1.default.findOne({
            // _id: new mongoose.Types.ObjectId(discount.createdBy),
            _id: discount.createdBy,
        }).exec();
        console.log(admin);
        console.log(admin);
        const adminName = admin ? `${admin.name}` : 'Unknown';
        const adminId = discount.createdBy;
        // Format the dates
        const formattedStartDate = new Date(discount.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const formattedEndDate = new Date(discount.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const response = {
            id: discount._id,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            discount: discount.discount,
            code: discount.code,
            type: discount.type,
            isActive: discount.isActive,
            products: discount.productIds,
            bundles: discount.bundleIds,
            createdBy: {
                // name: adminName,
                id: adminId,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch discount', error });
    }
});
exports.getDiscountById = getDiscountById;
