import { Request, Response } from "express";
import { generateTaskTimings, getTaskDelay } from "../utils/time-randomizer";
import { redisClient } from "../utils/redis-client";
import { tweetReplyQueue } from "../queue/tweet-reply.queue";
import { parseTimeString, formatDuration } from "../utils/time-parser";

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
  const { tweetUrls, customInstructions, maximumTime } = req.body;

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

  // Validate and parse customInstructions if provided
  if (customInstructions !== undefined && typeof customInstructions !== 'string') {
    return res.status(400).json({
      error: { message: "customInstructions must be a string" },
    });
  }

  // Parse maximumTime if provided
  let maxTimeMs: number | undefined;
  if (maximumTime) {
    try {
      maxTimeMs = parseTimeString(maximumTime);
      log?.info(`Parsed maximum time: ${formatDuration(maxTimeMs)} (${maxTimeMs}ms)`);
    } catch (error) {
      return res.status(400).json({
        error: {
          message: error instanceof Error ? error.message : "Invalid time format",
          example: "Valid formats: '1 hour', '30 minutes', '30 mins', '1hr', '2h', '45m'"
        },
      });
    }
  }

  const timings = generateTaskTimings({
    taskCount: tweetUrls.length,
    maxTimeMs,
  });

  for (let i = 0; i < tweetUrls.length; i++) {
    const url = tweetUrls[i];
    const delay = getTaskDelay(timings, i);
    await tweetReplyQueue.add(
      "tweet-reply",
      {
        tweetUrl: url,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionID: req.sessionID,
        customInstructions: customInstructions || undefined,
      },
      {
        jobId: `tweet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        delay,
      }
    );
  }

  const responseData: any = {
    msg: `${tweetUrls.length} tweets queued for processing`,
    status: "queued",
  };

  if (customInstructions) {
    responseData.customInstructions = "enabled";
  }

  if (maxTimeMs) {
    responseData.maximumTime = formatDuration(maxTimeMs);
  }

  return res.json(responseData);
}
