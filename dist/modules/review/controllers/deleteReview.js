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
exports.removeReview = void 0;
const reviewModel_1 = __importDefault(require("../../../models/reviewModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const removeReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reviewId } = req.params;
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    if (!reviewId) {
        return res.status(400).json({ message: 'Review ID is required' });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ message: 'Invalid review ID format' });
    }
    try {
        const review = yield reviewModel_1.default.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        if (review.isDeleted) {
            return res.status(400).json({ message: 'Review is already deleted' });
        }
        // Mark the review as deleted (soft delete)
        review.isDeleted = true;
        yield review.save();
        res.status(200).json({ message: 'Review marked as deleted successfully' });
    }
    catch (error) {
        console.error('Failed to remove review', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.removeReview = removeReview;
