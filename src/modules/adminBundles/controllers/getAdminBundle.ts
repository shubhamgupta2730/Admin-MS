import { Request, Response } from 'express';
import AdminBundle from '../../../models/adminBundleModel';

export const getBundle = async (req: Request, res: Response) => {
  const { bundleId } = req.query;

  try {
    const bundle = await AdminBundle.findById(bundleId);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }
    res.status(200).json({ bundle });
  } catch (error) {
    res.status(500).json({ message: 'Bundle not found' });
  }
};
