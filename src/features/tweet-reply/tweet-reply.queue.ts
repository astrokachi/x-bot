import { Queue, Worker } from "bullmq";
import { XService } from "../../shared/services/x.service.js";
import { AIService } from "../../shared/services/ai.service.js";
import { TweetReplyJobData, TweetReplyJobResultType } from "./tweet-reply.types.js";
import { tokenRefresh } from "../auth/auth.service.js";
import { redisClient } from "../../shared/utils/redis-client.js";

export const tweetReplyQueue = new Queue<
  TweetReplyJobData,
  TweetReplyJobResultType
>("tweet-reply", {
  connection: {
    url: process.env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

export const worker = new Worker<TweetReplyJobData, TweetReplyJobResultType>(
  "tweet-reply",
  async (job) => {
    let { tweetUrl, accessToken, refreshToken, sessionID, customInstructions } = job.data;
    console.log(`processing job: ${job.id}`);
    try {
      const sessionData = await redisClient.get(`session:${sessionID}`);

      if (sessionData) {
        const freshTokens = JSON.parse(sessionData);
        accessToken = freshTokens.accessToken;
      }

      const xService = new XService(accessToken);
      const aiService = new AIService();
      const { tweet, author } = await xService.getPostContent(tweetUrl);
      const message = await aiService.generateResponse(tweet, author, customInstructions);
      const result = await xService.replyToPost(tweetUrl, message);

      return {
        success: true,
        url: tweetUrl,
        tweetId: xService.extractTweetId(tweetUrl),
        generatedReply: message,
        xApiResponse: result,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Job ${job.id} failed: `, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const statusCode = (error as any)?.statusCode || 500;
      const code = (error as any)?.code || "UNKNOWN_ERROR";

      if (statusCode === 401 && accessToken) {
        try {
          await tokenRefresh(refreshToken, sessionID);
          console.log(`Job ${job.id}: Token refreshed, will retry...`);
        } catch (error) {
          console.error(`Job ${job.id}: Token refresh failed`, error);
        }
      }

      return {
        success: false,
        url: tweetUrl,
        error: errorMessage,
        code,
        statusCode,
        failedAt: new Date().toISOString(),
      } as const;
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
    concurrency: 1,
  }
);
