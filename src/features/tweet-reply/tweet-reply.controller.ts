import { Request, Response } from "express";
import { processTweets } from "./tweet-reply.service.js";
import { TweetReplyDto } from "../../shared/types/tweet-reply.js";
import { formatDuration } from "../../shared/utils/time-parser.js";

export async function replyToTweets(
  req: Request,
  res: Response
): Promise<Response | void> {
  const { maximumTime, customInstructions, tweetUrls } = req.body as TweetReplyDto;
  await processTweets(tweetUrls, req.sessionID, { maxTimeMs: +maximumTime, customInstructions })

  const responseData: any = {
    msg: `${tweetUrls.length} tweets queued for processing`,
    status: "queued",
  };

  if (customInstructions) {
    responseData.customInstructions = "enabled";
  }

  if (maximumTime) {
    responseData.maximumTime = formatDuration(+maximumTime);
  }

  return res.json(responseData);
}
