import { Request, Response, NextFunction } from "express";
import { getUserProfile } from "./user.service.js";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.user_id;
    const profile = await getUserProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}
