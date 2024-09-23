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
exports.updateSale = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const saleModel_1 = __importDefault(require("../../../models/saleModel"));
const updateSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const saleId = req.query.saleId;
    const { name, description } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(saleId)) {
        return res.status(400).json({
            message: 'Invalid sale ID.',
        });
    }
    const updateFields = {};
    if (name !== undefined) {
        if (!name.trim()) {
            return res.status(400).json({
                message: 'The name field cannot be empty or whitespace.',
            });
        }
        if (!/^[a-zA-Z0-9\s]{3,}$/.test(name.trim())) {
            return res.status(400).json({
                message: 'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
            });
        }
        updateFields.name = name.trim();
    }
    if (description !== undefined) {
        if (!description.trim()) {
            return res.status(400).json({
                message: 'The description field cannot be empty or whitespace.',
            });
        }
        if (!/^[a-zA-Z0-9\s]{5,}$/.test(description.trim())) {
            return res.status(400).json({
                message: 'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
            });
        }
        updateFields.description = description.trim();
    }
    try {
        const updatedSale = yield saleModel_1.default.findOneAndUpdate({ _id: saleId, isDeleted: false }, { $set: updateFields }, { new: true });
        if (!updatedSale) {
            return res.status(404).json({
                message: 'Sale not found or has been deleted.',
            });
        }
        return res.status(200).json({
            message: 'Sale updated successfully',
            sale: updatedSale,
        });
    }
    catch (error) {
        const err = error;
        return res.status(500).json({
            message: 'Failed to update sale',
            error: err.message,
        });
    }
});
exports.updateSale = updateSale;
