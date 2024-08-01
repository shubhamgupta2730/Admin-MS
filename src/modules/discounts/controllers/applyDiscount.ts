import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../Seller MS/src/models/productModel';
import Discount from './discountModel';
import BundleProduct from '../../Seller MS/src/models/bundleProductModel';

export const applyDiscountToProduct = async (req: Request, res: Response) => {
  const { productId, bundleId, discountCode } = req.body;

  // Ensure only one of productId or bundleId is provided
  if ((productId && bundleId) || (!productId && !bundleId)) {
    return res.status(400).json({
      message: 'Either productId or bundleId must be provided, but not both.',
    });
  }

  try {
    // Find the entity (product or bundle)
    let entity: any;
    if (productId) {
      entity = await Product.findById(productId);
    } else if (bundleId) {
      entity = await BundleProduct.findById(bundleId);
    }

    if (!entity) {
      return res.status(404).json({ message: 'Product or Bundle not found.' });
    }

    // Find the discount by code and ensure it is active
    const discount = await Discount.findOne({
      code: discountCode,
      isActive: true,
    });
    if (!discount) {
      return res
        .status(400)
        .json({ message: 'Invalid or inactive discount code' });
    }

    // Initialize discounts if not already
    if (!entity.discounts) {
      entity.discounts = [];
    }

    // Add the discount to the entity
    entity.discounts.push(discount._id as mongoose.Types.ObjectId);

    // Calculate the new final price
    entity.finalPrice = await calculateFinalPrice(
      entity.price,
      entity.discounts,
      entity.products
    );

    await entity.save();

    res.status(200).json({
      message: 'Discount applied successfully',
      finalPrice: entity.finalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply discount', error });
  }
};

const calculateFinalPrice = async (
  price: number,
  discounts: mongoose.Types.ObjectId[],
  products?: { productId: string; quantity: number }[]
) => {
  let finalPrice = price;

  for (const discountId of discounts) {
    const discount = await Discount.findById(discountId);
    if (discount) {
      finalPrice -= (finalPrice * discount.discount) / 100;
    }
  }

  if (products) {
    for (const { productId, quantity } of products) {
      const product = await Product.findById(productId);
      if (product) {
        finalPrice += product.price * quantity;
      }
    }
  }

  return finalPrice;
};
