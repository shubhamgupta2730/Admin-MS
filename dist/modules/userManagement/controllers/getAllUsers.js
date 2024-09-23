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
exports.getAllUsers = void 0;
const userModel_1 = __importDefault(require("../../../models/userModel"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const { search, sort, page = 1, limit = 10, status, role } = req.query;
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const match = {};
        // Filter by block status
        if (status === 'blocked') {
            match.isBlocked = true;
        }
        else if (status === 'unblocked') {
            match.isBlocked = false;
        }
        // Filter by role
        if (role === 'user' || role === 'seller') {
            match.role = role;
        }
        // Search by email, name, or phone
        if (search) {
            match.$or = [
                { email: new RegExp(search, 'i') },
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') },
            ];
        }
        const sortOptions = {};
        if (sort) {
            const [sortField, sortOrder] = sort.split(':');
            sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
        }
        const users = yield userModel_1.default.aggregate([
            { $match: match },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    phone: 1,
                    role: 1,
                    isBlocked: 1,
                },
            },
            {
                $facet: {
                    metadata: [
                        { $count: 'total' },
                        { $addFields: { page: pageNumber, limit: pageSize } },
                    ],
                    data: [
                        { $sort: sortOptions },
                        { $skip: (pageNumber - 1) * pageSize },
                        { $limit: pageSize },
                    ],
                },
            },
        ]);
        const result = users[0];
        const totalUsers = result.metadata.length ? result.metadata[0].total : 0;
        const totalPages = Math.ceil(totalUsers / pageSize);
        res.status(200).json({
            data: result.data,
            totalUsers,
            totalPages,
            currentPage: pageNumber,
            pageSize,
        });
    }
    catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAllUsers = getAllUsers;
