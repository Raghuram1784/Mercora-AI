import { Request, Response, NextFunction } from "express";
import { validateProductQuery } from "../validators/product.validator.js";
import { ProductService } from "../services/product.service.js";

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = validateProductQuery(req.query);
    const { products, total } = await ProductService.getProducts(filters);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      res.status(400).json({
        success: false,
        error: { message: "Invalid product ID." },
      });
      return;
    }

    const product = await ProductService.getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        error: { message: `Product not found or currently unavailable.` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
