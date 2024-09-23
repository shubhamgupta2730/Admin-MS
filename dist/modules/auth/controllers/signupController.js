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
exports.signUp = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authModel_1 = __importDefault(require("../../../models/authModel"));
const userModel_1 = __importDefault(require("../../../models/userModel"));
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, phone, role } = req.body;
    try {
        if (!name || !email || !password || !phone || !role) {
            return res.status(400).send({ message: 'All fields are required.' });
        }
        const existingAdmin = yield authModel_1.default.findOne({ $or: [{ email }, { phone }] });
        if (existingAdmin) {
            return res
                .status(400)
                .json({ message: 'Email or Phone already in use by another admin.' });
        }
        const existingUser = yield userModel_1.default.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: 'Email or Phone already in use by a user.' });
        }
        if (!['admin', 'superAdmin'].includes(role)) {
            return res.status(400).send({ message: 'Invalid role.' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newAdmin = new authModel_1.default({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
        });
        yield newAdmin.save();
        return res.status(200).json({
            message: 'Admin added successfully',
        });
    }
    catch (error) {
        console.error('Error in signup Admin:', error);
        res.status(500).send({ message: 'Error in signup Admin' });
    }
});
exports.signUp = signUp;
