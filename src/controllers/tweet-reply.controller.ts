import { Request, Response } from "express";
import { XService } from "../services/x.service";
import { AIService } from "../services/ai.service";
import {
  generateTaskTimings,
  getTaskDelay,
  sleep,
} from "../utils/time-randomizer";
import { redisClient } from "../utils/redis-client";

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

  const normalizedSessionData = JSON.parse(sessionData);

  if (!normalizedSessionData) {
    return res.send(`No session found for id: ${req.sessionID}`);
  }

  const token = normalizedSessionData.accessToken;

  if (token == null) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    if (!Array.isArray(tweetUrls) || tweetUrls.length === 0) {
      return res.status(400).json({
        error: { message: "tweetUrls must be a non-empty array" },
      });
    }
    const xService = new XService(token);

    const ai = new AIService();
    const timings = generateTaskTimings({
      taskCount: tweetUrls.length,
    });

    const results: TweetReplyResult[] = [];

    for (let i = 0; i < tweetUrls.length; i++) {
      const url = tweetUrls[i];
      const delayMs = getTaskDelay(timings, i);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
      try {
        const { tweet, author } = await xService.getPostContent(url);
        const reply = await ai.generateResponse(tweet, author);
        const response = await xService.replyToPost(url, reply);
        console.log(response);
        results.push(response);
      } catch (error: any) {
        const errorMsg = error?.message || "Unknown error";
        console.error(errorMsg);
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "failed").length;

    return res.json({
      msg: `Processed ${tweetUrls.length} tweet(s)`,
      successCount,
      failureCount,
      results,
    });
  } catch (error: any) {
    const anyErr: any = error;
    if (
      anyErr?.statusCode === 401 &&
      anyErr?.code === "GITHUB_MODELS_MISSING_PERMISSION"
    ) {
      return res.status(401).json({
        error: {
          code: "GITHUB_MODELS_MISSING_PERMISSION",
          message:
            "The GITHUB_TOKEN lacks models:read permission. Update token scopes or workflow permissions.",
        },
      });
    }

    return res
      .status(500)
      .json({ error: { message: anyErr?.message || "Internal Server Error" } });
  }
}
