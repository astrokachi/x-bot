import { Request, Response } from "express";
import { processTweets } from "./tweet-reply.service.js";
import { TweetReplyDto } from "../../shared/types/tweet-reply.js";
import { formatDuration } from "../../shared/utils/time-parser.js";
import { sendResponse } from "../../shared/utils/response.js";

export async function replyToTweets(
  req: Request,
  res: Response
): Promise<Response | void> {
  const { maximumTime, customInstructions, tweetUrls } = req.body as TweetReplyDto;
  await processTweets(tweetUrls, req.sessionID, { maxTimeMs: +maximumTime, customInstructions });

  const responseData: Record<string, string> = {
    queuedCount: `${tweetUrls.length}`,
  };

  if (customInstructions) {
    responseData.customInstructions = "enabled";
  }

  if (maximumTime) {
    responseData.maximumTime = formatDuration(+maximumTime);
  }

  return sendResponse(res, 200, `${tweetUrls.length} tweets queued for processing`, responseData);
}
