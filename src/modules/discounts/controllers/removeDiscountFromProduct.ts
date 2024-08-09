import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../../models/productModel';
import Bundle from '../../../models/adminBundleModel';
import Discount from '../../../models/discountModel';

export const removeDiscountFromProductsBundles = async (
  req: Request,
  res: Response
) => {
  const { productIds, bundleIds } = req.body;
  const { discountId } = req.query;

  if (!productIds && !bundleIds) {
    return res.status(400).json({
      message: 'Either productIds or bundleIds must be provided.',
    });
  }

  if (!discountId) {
    return res.status(400).json({
      message: 'discountId query parameter is required.',
    });
  }

  try {
    const discount = await Discount.findOne({
      _id: discountId,
      isActive: true,
    });

    if (!discount) {
      return res
        .status(400)
        .json({ message: 'Invalid or inactive discount ID' });
    }

    const results = [];
    const errors = [];

    if (productIds && productIds.length > 0) {
      for (const productId of productIds) {
        try {
          const product = await validateAndFetchEntity(Product, productId);
          if (product) {
            await removeDiscountFromProduct(product);
            discount.productIds = discount.productIds.filter(
              (id: mongoose.Types.ObjectId) => !id.equals(productId)
            );
            results.push({ id: productId, status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          errors.push({ id: productId, message: err.message });
        }
      }
    }

    if (bundleIds && bundleIds.length > 0) {
      for (const bundleId of bundleIds) {
        try {
          const bundle = await validateAndFetchEntity(Bundle, bundleId);
          if (bundle) {
            await removeDiscountFromBundle(bundle);
            discount.bundleIds = discount.bundleIds.filter(
              (id: mongoose.Types.ObjectId) => !id.equals(bundleId)
            );
            results.push({ id: bundleId, status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          errors.push({ id: bundleId, message: err.message });
        }
      }
    }

    await discount.save();

    res.status(200).json({
      message: 'Discount removal complete',
      results,
      errors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove discount', error });
  }
};

const validateAndFetchEntity = async (Model: any, entityId: string) => {
  const entity = await Model.findOne({
    _id: entityId,
    isBlocked: false,
    isActive: true,
    isDeleted: false,
  });

  if (!entity) {
    throw new Error(
      `Entity with ID ${entityId} is not valid (either blocked, inactive, or deleted).`
    );
  }

  return entity;
};

const removeDiscountFromProduct = async (product: any) => {
  if (!product.adminDiscount) {
    throw new Error('No admin discount applied to this product');
  }

  product.adminDiscount = null;
  product.sellingPrice = product.MRP - (product.MRP * product.discount) / 100;

  await product.save();
};

const removeDiscountFromBundle = async (bundle: any) => {
  if (!bundle.adminDiscount) {
    throw new Error('No admin discount applied to this bundle');
  }

  bundle.adminDiscount = null;
  bundle.sellingPrice = bundle.MRP - (bundle.MRP * bundle.discount) / 100;

  await bundle.save();
};
