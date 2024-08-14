import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Discount from '../../../models/discountModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/adminBundleModel';

interface ProductDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  sellingPrice: number;
  MRP?: number;
  adminDiscount?: number;
}

interface BundleDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  sellingPrice: number;
  MRP?: number;
  adminDiscount?: number;
}

export const updateDiscount = async (req: Request, res: Response) => {
  const discountId = req.query.discountId as string;
  const { startDate, endDate, discount, code } = req.body;

  // Validate discountId
  if (!discountId || !mongoose.Types.ObjectId.isValid(discountId)) {
    return res.status(400).json({ message: 'Invalid discount ID' });
  }

  // Validate at least one field is present
  if (!startDate && !endDate && discount === undefined && !code) {
    return res.status(400).json({
      message:
        'At least one field (startDate, endDate, discount, or code) must be provided',
    });
  }

  // Retrieve the existing discount to validate date changes
  let existingDiscount: any;
  try {
    existingDiscount = await Discount.findById(discountId);
    if (!existingDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to retrieve existing discount', error });
  }

  // Date format validation
  let start: Date | undefined;
  let end: Date | undefined;
  if (startDate) {
    start = new Date(`${startDate}T00:00:00Z`);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format' });
    }
    // Check that startDate is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    if (start < today) {
      return res
        .status(400)
        .json({ message: 'Start date cannot be in the past' });
    }
  }
  if (endDate) {
    end = new Date(`${endDate}T23:59:59Z`);
    if (isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid end date format' });
    }
    if (start && end <= start) {
      return res
        .status(400)
        .json({ message: 'End date must be after start date' });
    }
    // Ensure endDate is not less than the existing startDate
    if (
      existingDiscount.startDate &&
      end < new Date(existingDiscount.startDate)
    ) {
      return res.status(400).json({
        message: 'End date cannot be less than the current start date',
      });
    }
  }

  // Discount validation
  if (discount !== undefined) {
    if (typeof discount !== 'number' || discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ message: 'Discount must be a number between 0 and 100' });
    }
  }

  // Code validation and uniqueness check
  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim() === '') {
      return res
        .status(400)
        .json({ message: 'Discount code must be a non-empty string' });
    }

    // Check for unique code
    const existingDiscountWithCode = await Discount.findOne({
      code: code.trim(),
      _id: { $ne: discountId },
    });

    if (existingDiscountWithCode) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }
  }

  try {
    // Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        discount,
        code,
      },
      { new: true }
    );

    if (!updatedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Update associated products and bundles
    const { productIds, bundleIds } = updatedDiscount;

    const results: any[] = [];
    const errors: any[] = [];

    if (productIds && productIds.length > 0) {
      console.log('Processing product IDs:', productIds);
      for (const productId of productIds) {
        try {
          const product = await validateAndFetchEntity(
            Product,
            productId.toString()
          );
          if (product) {
            await applyDiscountToProduct(
              product,
              updatedDiscount,
              'sellingPrice'
            );
            results.push({ id: productId.toString(), status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          console.log('Error processing product ID:', productId);
          errors.push({ id: productId.toString(), message: err.message });
        }
      }
    }

    if (bundleIds && bundleIds.length > 0) {
      console.log('Processing bundle IDs:', bundleIds);
      for (const bundleId of bundleIds) {
        try {
          const bundle = await validateAndFetchEntity(
            Bundle,
            bundleId.toString()
          );
          if (bundle) {
            await applyDiscountToBundle(
              bundle,
              updatedDiscount,
              'sellingPrice'
            );
            results.push({ id: bundleId.toString(), status: 'success' });
          }
        } catch (error) {
          const err = error as Error;
          console.log('Error processing bundle ID:', bundleId);
          errors.push({ id: bundleId.toString(), message: err.message });
        }
      }
    }

    // Save updated entities
    await Promise.all([
      ...productIds.map((id) =>
        Product.findByIdAndUpdate(id.toString(), {
          $set: { adminDiscount: updatedDiscount.discount },
        })
      ),
      ...bundleIds.map((id) =>
        Bundle.findByIdAndUpdate(id.toString(), {
          $set: { adminDiscount: updatedDiscount.discount },
        })
      ),
    ]);

    console.log('Discount application complete');
    res.status(200).json({
      message:
        'Discount updated successfully and applied to associated entities',
      discount: {
        id: updatedDiscount._id,
        startDate: updatedDiscount.startDate,
        endDate: updatedDiscount.endDate,
        discount: updatedDiscount.discount,
        code: updatedDiscount.code,
        productIds: productIds,
        bundleIds: bundleIds,
        createdBy: updatedDiscount.createdBy,
      },
      results,
      errors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update discount', error });
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
