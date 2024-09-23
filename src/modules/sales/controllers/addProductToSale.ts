import { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import Sale from '../../../models/saleModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/adminBundleModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

interface ISaleProduct {
  productId: mongoose.Types.ObjectId;
}

interface ISaleBundle {
  bundleId: mongoose.Types.ObjectId;
}

// Function to apply discounts to newly added products and bundles
const applyDiscountsToNewItems = async (
  sale: any,
  newProducts: ISaleProduct[],
  newBundles: ISaleBundle[]
) => {
  // Apply discounts to new products
  for (const saleProduct of newProducts) {
    const product = await Product.findById(saleProduct.productId);

    if (!product) {
      console.error(`Product not found for ID: ${saleProduct.productId}`);
      continue;
    }

    console.log(
      `Found product: ${product._id}, Category ID: ${product.categoryId}`
    );

    // Convert ObjectId to string for comparison
    const productCategoryId = String(product.categoryId);

    // Find the corresponding sale category
    const saleCategory = sale.categories.find((cat: any) => {
      console.log(
        `Comparing product category ID: ${productCategoryId} with sale category ID: ${String(cat.categoryId._id)}`
      );
      return productCategoryId === String(cat.categoryId._id);
    });

    if (!saleCategory) {
      console.warn(
        `No matching sale category found for product category ID: ${productCategoryId}`
      );
      continue;
    }

    console.log(
      `Found sale category: ${saleCategory.name}, Discount: ${saleCategory.discount}`
    );

    // Apply the discount to the product
    const discount = saleCategory.discount || 0;
    console.log(`Applying discount of ${discount}% to product ${product._id}`);

    // Calculate and update the discounted price
    const discountedPrice = product.sellingPrice * (1 - discount / 100);
    const roundedDiscountedPrice = Math.round(discountedPrice);

    product.sellingPrice = roundedDiscountedPrice;
    product.adminDiscount = discount;
    await product.save();
  }

  // Apply discounts to new bundles
  for (const saleBundle of newBundles) {
    const bundle = await Bundle.findById(saleBundle.bundleId);
    if (bundle) {
      let maxDiscount = 0;
      let totalSellingPrice = 0;

      for (const bundleProduct of bundle.products) {
        const product = await Product.findById(bundleProduct.productId);
        if (product) {
          const saleCategory = sale.categories.find((cat: any) => {
            return String(product.categoryId) === String(cat.categoryId._id);
          });
          const discount = saleCategory ? saleCategory.discount : 0;

          if (discount > maxDiscount) {
            maxDiscount = discount;
          }

          totalSellingPrice += product.sellingPrice;
        }
      }

      const discountedBundlePrice = totalSellingPrice * (1 - maxDiscount / 100);
      const roundedDiscountedBundlePrice = Math.round(discountedBundlePrice);

      bundle.sellingPrice = roundedDiscountedBundlePrice;
      bundle.adminDiscount = maxDiscount;
      await bundle.save();
    }
  }
};

export const addProductsToSale = async (req: CustomRequest, res: Response) => {
  const saleId = req.query.saleId as string;
  const { products } = req.body;

  // Validate Sale ID
  if (!saleId || !mongoose.Types.ObjectId.isValid(saleId)) {
    return res.status(400).json({
      message: 'Invalid sale ID.',
    });
  }

  // Validate products
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      message: 'The products field must be a non-empty array.',
    });
  }

  try {
    // Find the sale
    const sale = await Sale.findOne({ _id: saleId, isDeleted: false })
      .populate('categories.categoryId')
      .exec();

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found or has been deleted.',
      });
    }

    const now = new Date();

    // Check if the sale is ongoing or in the future
    if (sale.startDate > now) {
      // Sale is in the future, so just add the products and bundles
      const existingProductIds = sale.products.map((p: any) =>
        p.productId.toString()
      );
      const existingBundleIds = sale.bundles.map((b: any) =>
        b.bundleId.toString()
      );

      const validProducts: ISaleProduct[] = [];
      const validBundles: ISaleBundle[] = [];

      for (const product of products) {
        const productId = product.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({
            message: `Invalid product ID: ${productId}.`,
          });
        }

        if (existingProductIds.includes(productId)) {
          return res.status(400).json({
            message: `Product with ID ${productId} is already added to this sale.`,
          });
        }

        const productData = await Product.findOne({
          _id: productId,
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });

        if (!productData) {
          return res.status(400).json({
            message: `Product with ID ${productId} is either inactive, deleted, or blocked.`,
          });
        }

        const saleCategory = sale.categories.find((cat: any) => {
          return String(productData.categoryId) === String(cat.categoryId._id);
        });

        if (!saleCategory) {
          return res.status(400).json({
            message: `Product with ID ${productId} does not belong to any of the sale's categories.`,
          });
        }

        validProducts.push({
          productId: new mongoose.Types.ObjectId(productId),
        });

        const bundlesContainingProduct = await Bundle.find({
          'products.productId': productId,
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });

        for (const bundle of bundlesContainingProduct) {
          const bundleId = bundle._id as mongoose.Types.ObjectId;

          if (existingBundleIds.includes(bundleId.toString())) {
            continue;
          }

          validBundles.push({
            bundleId,
          });
        }
      }

      sale.products = sale.products.concat(validProducts);
      sale.bundles = sale.bundles.concat(validBundles);
      await sale.save();

      return res.status(200).json({
        message: 'Products and related bundles added to the sale successfully.',
      });
    } else {
      // Sale is ongoing, add products and apply discounts
      const existingProductIds = sale.products.map((p: any) =>
        p.productId.toString()
      );
      const existingBundleIds = sale.bundles.map((b: any) =>
        b.bundleId.toString()
      );

      const validProducts: ISaleProduct[] = [];
      const validBundles: ISaleBundle[] = [];

      for (const product of products) {
        const productId = product.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({
            message: `Invalid product ID: ${productId}.`,
          });
        }

        if (existingProductIds.includes(productId)) {
          return res.status(400).json({
            message: `Product with ID ${productId} is already added to this sale.`,
          });
        }

        const productData = await Product.findOne({
          _id: productId,
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });

        if (!productData) {
          return res.status(400).json({
            message: `Product with ID ${productId} is either inactive, deleted, or blocked.`,
          });
        }

        console.log('Product Category ID:', String(productData.categoryId));
        sale.categories.forEach((cat: any) => {
          console.log('Sale Category ID:', String(cat.categoryId._id));
        });

        const saleCategory = sale.categories.find((cat: any) => {
          return String(productData.categoryId) === String(cat.categoryId._id);
        });

        if (!saleCategory) {
          return res.status(400).json({
            message: `Product with ID ${productId} does not belong to any of the sale's categories.`,
          });
        }

        validProducts.push({
          productId: new mongoose.Types.ObjectId(productId),
        });

        const bundlesContainingProduct = await Bundle.find({
          'products.productId': productId,
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        });

        for (const bundle of bundlesContainingProduct) {
          const bundleId = bundle._id as mongoose.Types.ObjectId;

          if (existingBundleIds.includes(bundleId.toString())) {
            continue;
          }

          validBundles.push({
            bundleId,
          });
        }
      }

      sale.products = sale.products.concat(validProducts);
      sale.bundles = sale.bundles.concat(validBundles);
      await sale.save();

      // Apply discounts to newly added products and bundles
      await applyDiscountsToNewItems(sale, validProducts, validBundles);

      return res.status(200).json({
        message:
          'Products and related bundles added to the sale successfully with discounts applied.',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'An error occurred while adding products to the sale.',
    });
  }
};
