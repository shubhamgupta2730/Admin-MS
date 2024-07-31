import { Request, Response } from 'express';
import AdminBundle from '../../../models/adminBundleModel';

export const removeBundle = async (req: Request, res: Response) => {
  const { bundleId } = req.query;

  try {
    const bundle = await AdminBundle.findByIdAndUpdate(
      bundleId,
      { isActive: false },
      { new: true }
    );

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res
      .status(200)
      .json({ message: 'Bundle removed successfully (soft delete)', bundle });
  } catch (error) {
    res.status(500).json({ message: 'Error in removing bundle.' });
  }
};
