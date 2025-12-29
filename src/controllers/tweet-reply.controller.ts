import { Request, Response } from "express";
import { generateTaskTimings, getTaskDelay } from "../utils/time-randomizer";
import { redisClient } from "../utils/redis-client";
import { tweetReplyQueue } from "../queue/tweet-reply.queue";

export interface TweetReplyResult {
  url: string;
  author: string;
  tweet: string;
  reply: string;
  status: "success" | "failed";
}

export async function replyToTweets(
  req: Request,
  res: Response
): Promise<Response | void> {
  const log = (req as any).log;
  const { tweetUrls } = req.body;

  const sessionData = await redisClient.get(`session:${req.sessionID}`);
  if (!sessionData) {
    return res.send("No session data found.");
  }

  const normalizedSessionData = req.session.tokens || JSON.parse(sessionData);

  if (!normalizedSessionData) {
    return res.send(`No session found for id: ${req.sessionID}`);
  }

  const tokens = normalizedSessionData;

  if (!tokens.accessToken && !tokens.refreshToken) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  if (!Array.isArray(tweetUrls) || tweetUrls.length === 0) {
    return res.status(400).json({
      error: { message: "tweetUrls must be a non-empty array" },
    });
  }

  const timings = generateTaskTimings({
    taskCount: tweetUrls.length,
  });

  for (const url of tweetUrls) {
    const delay = getTaskDelay(timings, tweetUrls.indexOf(url));
    await tweetReplyQueue.add(
      "tweet-reply",
      {
        tweetUrl: url,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      {
        jobId: `tweet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        delay,
      }
    );
  }

  return res.json({
    msg: `${tweetUrls.length} tweets queued for processing`,
    status: "queued",
  });
}
