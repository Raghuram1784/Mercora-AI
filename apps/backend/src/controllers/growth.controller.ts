import { Request, Response, NextFunction } from "express";
import { validateGrowthCriteria } from "../validators/growth.validator.js";
import { GrowthService } from "../growth/growth.service.js";

export const getSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const criteria = validateGrowthCriteria(req.body);
    const result = await GrowthService.getSuggestions(criteria);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
