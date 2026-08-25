export interface TweetReplyJobData {
  tweetUrl: string;
  accessToken: string;
  refreshToken: string;
  sessionID: string;
  customInstructions?: string;
}

export interface TweetReplyJobResult {
  success: true;
  url: string;
  tweetId: string;
  generatedReply: string;
  xApiResponse: TweetData;
  processedAt: string;
}

export interface TweetReplyJobError {
  success: false;
  url: string;
  error: string;
  code?: string;
  statusCode?: number;
  failedAt: string;
}

export type TweetReplyJobResultType = TweetReplyJobResult | TweetReplyJobError;

export type TweetData = {
  id: string;
  text: string;
  edit_history_tweet_ids: string[];
};

export interface QueueJobMetadata {
  jobId: string;
  url: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
}
