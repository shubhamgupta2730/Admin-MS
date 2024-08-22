import { Request, Response } from 'express';
import mongoose from 'mongoose';
import moment from 'moment';
import Sale from '../../../models/saleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const updateSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const { name, description, startDate, endDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  const updateFields: any = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({
        message: 'The name field cannot be empty or whitespace.',
      });
    }
    if (!/^[a-zA-Z0-9\s]{3,}$/.test(name.trim())) {
      return res.status(400).json({
        message:
          'The name must be at least 3 characters long and contain only letters, numbers, and spaces.',
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
        message:
          'The description must be at least 5 characters long and contain only letters, numbers, and spaces.',
      });
    }
    updateFields.description = description.trim();
  }

  let start: moment.Moment | undefined;
  let end: moment.Moment | undefined;

  try {
    const sale = await Sale.findById(saleId);
    if (!sale || sale.isDeleted) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    if (startDate !== undefined) {
      start = moment(startDate, 'YYYY-MM-DD HH:mm:ss', true);
      if (!start.isValid()) {
        return res.status(400).json({
          message: 'Invalid date format for startDate. Expected format: YYYY-MM-DD HH:mm:ss',
        });
      }

      // Check if the start date is in the past
      const now = moment();
      if (start.isBefore(now)) {
        return res.status(400).json({
          message: 'The startDate cannot be in the past.',
        });
      }
      updateFields.startDate = start.toDate();
    } else {
      start = moment(sale.startDate);
    }

    if (endDate !== undefined) {
      end = moment(endDate, 'YYYY-MM-DD HH:mm:ss', true);
      if (!end.isValid()) {
        return res.status(400).json({
          message: 'Invalid date format for endDate. Expected format: YYYY-MM-DD HH:mm:ss',
        });
      }
      if (start && start.isSameOrAfter(end)) {
        return res.status(400).json({
          message: 'endDate must be later than startDate.',
        });
      }
      updateFields.endDate = end.toDate();
    }

    // Ensure the sale's active status is correct based on the dates
    if (start || end) {
      const now = moment().toDate(); // Convert the current moment to a Date object
      const saleStartDate = start ? start.toDate() : sale.startDate;
      const saleEndDate = end ? end.toDate() : sale.endDate;

      updateFields.isActive =
        saleStartDate <= now && now <= saleEndDate;
    }

    const updatedSale = await Sale.findOneAndUpdate(
      { _id: saleId, isDeleted: false },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    return res.status(200).json({
      message: 'Sale updated successfully',
      sale: updatedSale,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      message: 'Failed to update sale',
      error: err.message,
    });
  }
};
