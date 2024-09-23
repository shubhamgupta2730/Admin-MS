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
  const discountId = req.query.discountId as string;

  if (!Array.isArray(productIds) && !Array.isArray(bundleIds)) {
    return res.status(400).json({
      message: 'Either productIds or bundleIds must be provided.',
    });
  }

  if (!discountId || !mongoose.Types.ObjectId.isValid(discountId)) {
    return res.status(400).json({
      message: 'A valid discountId query parameter is required.',
    });
  }

  try {
    const discount = await Discount.findOne({
      _id: discountId,
      isActive: true,
    });

    if (!discount) {
      return res.status(400).json({
        message: 'Invalid or inactive discount ID',
      });
    }

    const results: any[] = [];
    const errors: any[] = [];

    if (Array.isArray(productIds) && productIds.length > 0) {
      for (const productId of productIds) {
        try {
          const product = await validateAndFetchEntity(Product, productId);

          if (
            product &&
            product.adminDiscount &&
            product.discountId &&
            product.discountId.equals(discount._id)
          ) {
            await removeDiscountFromProduct(product, discount);
            discount.productIds = discount.productIds.filter(
              (id: mongoose.Types.ObjectId) => !id.equals(productId)
            );
            results.push({ id: productId, status: 'success' });
          } else {
            errors.push({
              id: productId,
              message:
                'Product not associated with this discount or no discount applied',
            });
          }
        } catch (error) {
          errors.push({
            id: productId,
            message: `Error processing product: ${(error as Error).message}`,
          });
        }
      }
    }

    if (Array.isArray(bundleIds) && bundleIds.length > 0) {
      for (const bundleId of bundleIds) {
        try {
          const bundle = await validateAndFetchEntity(Bundle, bundleId);

          if (
            bundle &&
            bundle.adminDiscount &&
            bundle.discountId &&
            bundle.discountId.equals(discount._id)
          ) {
            await removeDiscountFromBundle(bundle, discount);
            discount.bundleIds = discount.bundleIds.filter(
              (id: mongoose.Types.ObjectId) => !id.equals(bundleId)
            );
            results.push({ id: bundleId, status: 'success' });
          } else {
            errors.push({
              id: bundleId,
              message:
                'Bundle not associated with this discount or no discount applied',
            });
          }
        } catch (error) {
          errors.push({
            id: bundleId,
            message: `Error processing bundle: ${(error as Error).message}`,
          });
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
    res.status(500).json({
      message: 'Failed to remove discount',
      error: (error as Error).message,
    });
  }
};

const validateAndFetchEntity = async (Model: any, entityId: string) => {
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    throw new Error(`Invalid ID: ${entityId}`);
  }

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

const removeDiscountFromProduct = async (product: any, discount: any) => {
  if (
    !product.adminDiscount ||
    !product.discountId ||
    !product.discountId.equals(discount._id)
  ) {
    throw new Error(
      'No admin discount applied to this product or discount does not match'
    );
  }

  let sellingPrice = product.sellingPrice;

  if (discount.type === 'MRP') {
    // Add back the discount that was previously applied to selling price
    // const discountAmount = (product.MRP * discount.value) / 100;
    sellingPrice = product.MRP - product.MRP * (product.discount / 100);
    // sellingPrice = product.MRP - discountAmount;
  } else if (discount.type === 'sellingPrice') {
    // Directly remove the discount percentage from the selling price
    const discountAmount = (product.sellingPrice * discount.discount) / 100;
    sellingPrice += discountAmount;
    console.log(sellingPrice);
  }

  // if (isNaN(sellingPrice) || sellingPrice < 0) {
  //   console.warn(`Invalid sellingPrice calculated for product ${product._id}, resetting to MRP.`);
  //   sellingPrice = product.MRP;
  // }

  product.sellingPrice = sellingPrice;
  product.adminDiscount = null;
  product.discountId = null;

  await product.save();
};

const removeDiscountFromBundle = async (bundle: any, discount: any) => {
  if (
    !bundle.adminDiscount ||
    !bundle.discountId ||
    !bundle.discountId.equals(discount._id)
  ) {
    throw new Error(
      'No admin discount applied to this bundle or discount does not match'
    );
  }

  let sellingPrice = bundle.sellingPrice;

  if (discount.type === 'MRP') {
    // Add back the discount that was previously applied to selling price
    // const discountAmount = (bundle.MRP * discount.discount) / 100;
    //  newMRP  = bundle.MRP - discountAmount;
    sellingPrice = bundle.MRP - bundle.MRP * (bundle.discount / 100);
  } else if (discount.type === 'sellingPrice') {
    // Directly remove the discount percentage from the selling price
    const discountAmount = (bundle.sellingPrice * discount.discount) / 100;
    sellingPrice += discountAmount;
  }

  // if (isNaN(sellingPrice) || sellingPrice < 0) {
  //   console.warn(`Invalid sellingPrice calculated for bundle ${bundle._id}, resetting to MRP.`);
  //   sellingPrice = bundle.MRP;
  // }

  bundle.sellingPrice = sellingPrice;
  bundle.adminDiscount = null;
  bundle.discountId = null;

  await bundle.save();
};
