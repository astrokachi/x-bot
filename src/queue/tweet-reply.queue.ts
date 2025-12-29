import { Queue, Worker } from "bullmq";
import { XService } from "../services/x.service";
import { AIService } from "../services/ai.service";
import { TweetReplyJobData, TweetReplyJobResultType } from "../types/queue";

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
    const { tweetUrl, accessToken, refreshToken } = job.data;
    console.log(`processing job: ${job.id}`);
    try {
      const xService = new XService(accessToken);
      const aiService = new AIService();
      const { tweet, author } = await xService.getPostContent(tweetUrl);
      const message = await aiService.generateResponse(tweet, author);
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
