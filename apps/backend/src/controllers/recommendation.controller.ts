import { Request, Response, NextFunction } from "express";
import { validateRecommendationCriteria } from "../validators/recommendation.validator.js";
import { RecommendationService } from "../recommendation/recommendation.service.js";

export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const criteria = validateRecommendationCriteria(req.body);
    const result = await RecommendationService.recommendProducts(criteria);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
