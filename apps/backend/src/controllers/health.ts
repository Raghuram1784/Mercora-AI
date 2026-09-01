import { Request, Response, NextFunction } from "express";

export const getHealth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    res.status(200).json({
      success: true,
      service: "mercora-api",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
