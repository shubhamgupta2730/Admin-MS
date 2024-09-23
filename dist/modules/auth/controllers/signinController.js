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
exports.singIn = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authModel_1 = __importDefault(require("../../../models/authModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const singIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required',
        });
    }
    try {
        const admin = yield authModel_1.default.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                message: 'Admin not found.',
            });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid password.',
            });
        }
        const payload = {
            userId: admin._id,
            role: admin.role,
        };
        const jwt_secret = process.env.JWT_SECRET;
        const token = jsonwebtoken_1.default.sign(payload, jwt_secret, { expiresIn: '24h' });
        return res.status(200).json({
            message: 'SignIn successful',
            token,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: 'Error in signIn',
            error,
        });
    }
});
exports.singIn = singIn;
