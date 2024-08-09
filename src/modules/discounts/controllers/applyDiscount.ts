import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Discount from '../../../models/discountModel';
import Bundle from '../../../models/adminBundleModel';

export const applyDiscount = async (req: Request, res: Response) => {
  const { productIds, bundleIds, type } = req.body;
  const { discountId } = req.query;

  console.log('Received request to apply discount:', req.body);

  if (
    (!productIds || productIds.length === 0) &&
    (!bundleIds || bundleIds.length === 0)
  ) {
    console.log(
      'Validation error: Either productIds or bundleIds must be provided.'
    );
    return res.status(400).json({
      message: 'Either productIds or bundleIds must be provided.',
    });
  }

  if (
    productIds &&
    bundleIds &&
    productIds.length > 0 &&
    bundleIds.length > 0
  ) {
    console.log('Validation error: Both productIds and bundleIds provided.');
    return res.status(400).json({
      message:
        'Either productIds or bundleIds must be provided, but not both together.',
    });
  }

  try {
    console.log('Validating discount ID:', discountId);
    const discount = await Discount.findOne({
      _id: discountId,
      isActive: true,
    });
    if (!discount) {
      console.log('Invalid or inactive discount ID:', discountId);
      return res
        .status(400)
        .json({ message: 'Invalid or inactive discount ID' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    if (productIds && productIds.length > 0) {
      console.log('Processing product IDs:', productIds);
      for (const productId of productIds) {
        try {
          const product = await validateAndFetchEntity(Product, productId);
          if (product) {
            await applyDiscountToProduct(product, discount, type);
            discount.productIds.push(productId);
            results.push({ id: productId, status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          console.log('Error processing product ID:', productId);
          errors.push({ id: productId, message: err.message });
        }
      }
    }

    // Process bundles
    if (bundleIds && bundleIds.length > 0) {
      console.log('Processing bundle IDs:', bundleIds);
      for (const bundleId of bundleIds) {
        try {
          const bundle = await validateAndFetchEntity(Bundle, bundleId);
          if (bundle) {
            await applyDiscountToBundle(bundle, discount, type);
            discount.bundleIds.push(bundleId);
            results.push({ id: bundleId, status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          console.log('Error processing bundle ID:', bundleId);
          errors.push({ id: bundleId, message: err.message });
        }
      }
    }

    await discount.save();

    console.log('Discount application complete');
    res.status(200).json({
      message: 'Discount application complete',
      results,
      errors,
    });
  } catch (error) {
    console.error('Failed to apply discount:', error);
    res.status(500).json({ message: 'Failed to apply discount' });
  }
};

const validateAndFetchEntity = async (Model: any, entityId: string) => {
  console.log('Validating and fetching entity:', entityId);
  const entity = await Model.findOne({
    _id: entityId,
    isBlocked: false,
    isActive: true,
    isDeleted: false,
  });

  if (!entity) {
    console.log('Invalid entity:', entityId);
    throw new Error(
      `Entity with ID ${entityId} is not valid (either blocked, inactive, or deleted).`
    );
  }

  console.log('Valid entity found:', entityId);
  console.log('Fetched entity:', entity);
  return entity;
};

const applyDiscountToProduct = async (
  product: any,
  discount: any,
  type: 'sellingPrice' | 'MRP'
) => {
  console.log(`Applying discount to product:`, product._id);

  if (product.adminDiscount) {
    throw new Error('Discount already applied to this product');
  }

  product.adminDiscount = discount.discount;
  if (type === 'MRP') {
    if (typeof product.MRP === 'undefined') {
      throw new Error(`Invalid MRP value for product ID ${product._id}`);
    }
    const newMRP = product.MRP - (product.MRP * discount.discount) / 100;
    product.sellingPrice = newMRP;
  } else {
    if (typeof product.sellingPrice === 'undefined') {
      throw new Error(
        `Invalid sellingPrice value for product ID ${product._id}`
      );
    }

    // Apply admin discount to selling price directly
    product.sellingPrice -= (product.sellingPrice * discount.discount) / 100;
  }

  await product.save();
  console.log(`Discount applied to product:`, product._id);
};

const applyDiscountToBundle = async (
  bundle: any,
  discount: any,
  type: 'sellingPrice' | 'MRP'
) => {
  console.log(`Applying discount to bundle:`, bundle._id);

  if (bundle.adminDiscount) {
    throw new Error('Discount already applied to this bundle');
  }

  bundle.adminDiscount = discount.discount;
  if (type === 'MRP') {
    if (typeof bundle.MRP === 'undefined') {
      throw new Error(`Invalid MRP value for bundle ID ${bundle._id}`);
    }

    // Apply admin discount to MRP only
    const newMRP = bundle.MRP - (bundle.MRP * discount.discount) / 100;
    bundle.sellingPrice = newMRP;
  } else {
    if (typeof bundle.sellingPrice === 'undefined') {
      throw new Error(`Invalid sellingPrice value for bundle ID ${bundle._id}`);
    }

    bundle.sellingPrice -= (bundle.sellingPrice * discount.discount) / 100;
  }

  await bundle.save();
  console.log(`Discount applied to bundle:`, bundle._id);
};
