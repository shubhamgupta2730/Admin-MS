import { Request, Response } from 'express';
import Sale from '../../../models/saleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

export const createSale = async (req: CustomRequest, res: Response) => {
  const { name, description, startDate, endDate, products, bundles } = req.body;
  const adminId = req.user?.userId;

  if (!adminId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!name || !description || !startDate || !endDate || (!products && !bundles)) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newSale = new Sale({
      name,
      description,
      startDate,
      endDate,
      products,
      bundles,
      createdBy: adminId,
    });

    await newSale.save();

    return res.status(201).json({
      message: 'Sale created successfully',
      sale: newSale,
    });
  } catch (error) {
    console.error('Error creating sale', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
