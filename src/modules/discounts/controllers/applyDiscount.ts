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

    // Check if the discount is within the valid date range
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) {
      console.log('Discount is not yet active.');
      return res.status(400).json({ message: 'Discount is not yet active.' });
    }
    if (discount.endDate && new Date(discount.endDate) < now) {
      console.log('Discount has expired.');
      return res.status(400).json({ message: 'Discount has expired.' });
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
    if (typeof product.MRP === 'undefined' || product.MRP === null) {
      throw new Error(`Invalid MRP value for product ID ${product._id}`);
    }
    const newMRP = product.MRP - (product.MRP * discount.discount) / 100;
    if (newMRP < 0) {
      throw new Error(
        `Discounted MRP cannot be less than zero for product ID ${product._id}`
      );
    }
    product.sellingPrice = newMRP;
  } else {
    if (
      typeof product.sellingPrice === 'undefined' ||
      product.sellingPrice === null
    ) {
      throw new Error(
        `Invalid sellingPrice value for product ID ${product._id}`
      );
    }

    const newSellingPrice =
      product.sellingPrice - (product.sellingPrice * discount.discount) / 100;
    if (newSellingPrice < 0) {
      throw new Error(
        `Discounted selling price cannot be less than zero for product ID ${product._id}`
      );
    }
    product.sellingPrice = newSellingPrice;
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
    if (typeof bundle.MRP === 'undefined' || bundle.MRP === null) {
      throw new Error(`Invalid MRP value for bundle ID ${bundle._id}`);
    }

    const newMRP = bundle.MRP - (bundle.MRP * discount.discount) / 100;
    if (newMRP < 0) {
      throw new Error(
        `Discounted MRP cannot be less than zero for bundle ID ${bundle._id}`
      );
    }
    bundle.sellingPrice = newMRP;
  } else {
    if (
      typeof bundle.sellingPrice === 'undefined' ||
      bundle.sellingPrice === null
    ) {
      throw new Error(`Invalid sellingPrice value for bundle ID ${bundle._id}`);
    }

    const newSellingPrice =
      bundle.sellingPrice - (bundle.sellingPrice * discount.discount) / 100;
    if (newSellingPrice < 0) {
      throw new Error(
        `Discounted selling price cannot be less than zero for bundle ID ${bundle._id}`
      );
    }
    bundle.sellingPrice = newSellingPrice;
  }

  await bundle.save();
  console.log(`Discount applied to bundle:`, bundle._id);
};
