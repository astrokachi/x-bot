import { Request, Response, NextFunction } from "express";
import { publishPost as publishPostService } from "./post.service.js";
import { getUserAccessToken } from "../x-account/x-account.service.js";
import { sendResponse } from "../../shared/utils/response.js";

export async function publishPost(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.user_id;
    const { message } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    const accessToken = await getUserAccessToken(userId);

    const result = await publishPostService(accessToken, message, files);
    sendResponse(res, 201, "Post published successfully", result);
  } catch (error) {
    next(error);
  }
}

export async function schedulePost() {
  // TODO: implement scheduling
}
