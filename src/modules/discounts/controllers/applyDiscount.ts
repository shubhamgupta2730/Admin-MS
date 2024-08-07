import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Discount from '../../../models/discountModel';
import Bundle from '../../../models/adminBundleModel';

export const applyDiscount = async (req: Request, res: Response) => {
  const { productIds, bundleIds, type } = req.body;
  const { discountId } = req.query;

  console.log('Received request to apply discount:', req.body);

  // Either productIds or bundleIds must be provided
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
    // Validate discount ID
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

    // Process products
    if (productIds && productIds.length > 0) {
      console.log('Processing product IDs:', productIds);
      for (const productId of productIds) {
        try {
          const product = await validateAndFetchEntity(Product, productId);
          if (product) {
            await applyDiscountToEntity(product, discount, type, 'product');
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
            await applyDiscountToEntity(bundle, discount, type, 'bundle');
            results.push({ id: bundleId, status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          console.log('Error processing bundle ID:', bundleId);
          errors.push({ id: bundleId, message: err.message });
        }
      }
    }

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
  return entity;
};

const applyDiscountToEntity = async (
  entity: any,
  discount: any,
  type: 'sellingPrice' | 'MRP',
  entityType: 'product' | 'bundle'
) => {
  console.log(`Applying discount to ${entityType}:`, entity._id);

  if (entity.adminDiscount) {
    throw new Error(`Discount already applied to this ${entityType}`);
  }

  // Store the admin discount
  entity.adminDiscount = discount.discount;

  if (type === 'MRP') {
    entity.mrp = calculateDiscountedPrice(entity.mrp, discount.discount);
    entity.sellingPrice = calculateDiscountedPrice(entity.mrp, entity.discount);
  } else {
    entity.sellingPrice = calculateDiscountedPrice(entity.sellingPrice, discount.discount);
  }

  await entity.save();
  console.log(`Discount applied to ${entityType}:`, entity._id);
};

const calculateDiscountedPrice = (
  price: number,
  discountPercentage: number
) => {
  const discountedPrice = price - (price * discountPercentage) / 100;
  console.log(`Calculated discounted price: ${discountedPrice}`);
  return discountedPrice;
};
