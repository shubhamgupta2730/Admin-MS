import { Request, Response } from 'express';
import AdminBundle from '../../../models/adminBundleModel';

export const createBundle = async (req: Request, res: Response) => {
  const { name, description, products, discountPercentage, MRP, sellingPrice } =
    req.body;

  try {
    const bundle = new AdminBundle({
      name,
      description,
      MRP,
      sellingPrice,
      discountPercentage,
      products,
      isActive: true,
    });

    console.log(bundle)
    await bundle.save();
    res.status(201).json({ message: 'Bundle created successfully', bundle });
  } catch (error) {
    res.status(500).json({ message: 'bundle not created. ' });
  }
};
