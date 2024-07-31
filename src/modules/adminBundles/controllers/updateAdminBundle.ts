import { Request, Response } from 'express';
import AdminBundle from '../../../models/adminBundleModel';

export const updateBundle = async (req: Request, res: Response) => {
  const { bundleId } = req.params;
  const {
    name,
    description,
    products,
    discountPercentage,
    MRP,
    sellingPrice,
    isActive,
  } = req.body;

  try {
    const updatedBundle = await AdminBundle.findByIdAndUpdate(
      bundleId,
      {
        name,
        description,
        MRP,
        sellingPrice,
        discountPercentage,
        products,
        isActive,
      },
      { new: true }
    );

    if (!updatedBundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res
      .status(200)
      .json({ message: 'Bundle updated successfully', updatedBundle });
  } catch (error) {
    res.status(500).json({ message: 'bundle not found' });
  }
};
