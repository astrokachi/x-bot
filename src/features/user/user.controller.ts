import { Request, Response, NextFunction } from "express";
import { getUserProfile } from "./user.service.js";
import { sendResponse } from "../../shared/utils/response.js";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.user_id;
    const profile = await getUserProfile(userId);
    sendResponse(res, 200, "Profile retrieved successfully", profile);
  } catch (error) {
    next(error);
  }
}
