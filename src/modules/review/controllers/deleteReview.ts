import { Request, Response } from 'express';
import Review from '../../../models/reviewModel';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

export const removeReview = async (req: CustomRequest, res: Response) => {
  const { reviewId } = req.params;

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  if (!reviewId) {
    return res.status(400).json({ message: 'Review ID is required' });
  }

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID format' });
  }

  try {
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.isDeleted) {
      return res.status(400).json({ message: 'Review is already deleted' });
    }

    // Mark the review as deleted (soft delete)
    review.isDeleted = true;
    await review.save();

    res.status(200).json({ message: 'Review marked as deleted successfully' });
  } catch (error) {
    console.error('Failed to remove review', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
