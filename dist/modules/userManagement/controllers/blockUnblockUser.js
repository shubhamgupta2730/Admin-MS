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
exports.toggleBlockUser = void 0;
const userModel_1 = __importDefault(require("../../../models/userModel"));
const mongoose_1 = __importStar(require("mongoose"));
// Block/Unblock a user
const toggleBlockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        const { action } = req.body;
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const adminId = req.user.userId;
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !mongoose_1.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({ message: 'Invalid user or admin ID' });
        }
        if (action !== 'block' && action !== 'unblock') {
            return res.status(400).json({ message: 'Invalid action' });
        }
        const user = yield userModel_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (action === 'block') {
            if (user.isBlocked) {
                return res.status(400).json({ message: 'User is already blocked' });
            }
            user.isBlocked = true;
            user.blockedBy = new mongoose_1.default.Types.ObjectId(adminId);
        }
        else if (action === 'unblock') {
            if (!user.isBlocked) {
                return res.status(400).json({ message: 'User is not blocked' });
            }
            user.isBlocked = false;
            user.blockedBy = null;
        }
        yield user.save();
        res.status(200).json({
            message: `User ${action}ed successfully`,
            userId: user._id,
            isBlocked: user.isBlocked,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.toggleBlockUser = toggleBlockUser;
