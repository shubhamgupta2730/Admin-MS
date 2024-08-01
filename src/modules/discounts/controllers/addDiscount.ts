import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Discount from './discountModel';

// Create a new discount
export const createDiscount = async (req: Request, res: Response) => {
  const { startDate, endDate, discount, code } = req.body;

  try {
    const newDiscount = new Discount({
      startDate,
      endDate,
      discount,
      code,
      isActive:
        new Date(startDate) <= new Date() && new Date(endDate) >= new Date(),
    });

    await newDiscount.save();
    res.status(201).json({
      message: 'Discount created successfully',
      discount: newDiscount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create discount', error });
  }
};

// Get a discount by ID
export const getDiscount = async (req: Request, res: Response) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.json(discount);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve discount', error });
  }
};

// Get all discounts
export const getAllDiscounts = async (req: Request, res: Response) => {
  try {
    const discounts = await Discount.find();
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve discounts', error });
  }
};

// Update a discount by ID
export const updateDiscount = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, discount, code } = req.body;
    const updatedDiscount = await Discount.findByIdAndUpdate(
      req.params.id,
      {
        startDate,
        endDate,
        discount,
        code,
        isActive:
          new Date(startDate) <= new Date() && new Date(endDate) >= new Date(),
      },
      { new: true }
    );
    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.json(updatedDiscount);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update discount', error });
  }
};

// Delete a discount by ID
export const deleteDiscount = async (req: Request, res: Response) => {
  try {
    const deletedDiscount = await Discount.findByIdAndDelete(req.params.id);
    if (!deletedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete discount', error });
  }
};
