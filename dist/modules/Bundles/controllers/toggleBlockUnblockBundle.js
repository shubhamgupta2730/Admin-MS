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
exports.toggleBlockBundle = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const adminBundleModel_1 = __importDefault(require("../../../models/adminBundleModel"));
const toggleBlockBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const bundleId = req.query.bundleId;
    const { action } = req.body;
    if (!userId || !userRole) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (userRole !== 'admin') {
        return res
            .status(403)
            .json({ message: 'Forbidden: Access is allowed only for Admins' });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID' });
    }
    if (!action || (action !== 'block' && action !== 'unblock')) {
        return res
            .status(400)
            .json({ message: 'Action must be either "block" or "unblock"' });
    }
    try {
        const bundle = yield adminBundleModel_1.default.findById(bundleId);
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        const isCurrentlyBlocked = bundle.isBlocked;
        if (action === 'block' && isCurrentlyBlocked) {
            return res.status(400).json({ message: 'Bundle is already blocked' });
        }
        if (action === 'unblock' && !isCurrentlyBlocked) {
            return res.status(400).json({ message: 'Bundle is already unblocked' });
        }
        bundle.isBlocked = action === 'block';
        yield bundle.save();
        return res.status(200).json({
            message: `Bundle ${action}ed successfully`,
            bundle,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: 'Failed to toggle block status', error });
    }
});
exports.toggleBlockBundle = toggleBlockBundle;
