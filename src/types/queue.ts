
export interface TweetReplyJobData {
  tweetUrl: string;
  accessToken: string;
  refreshToken: string;
}

export interface TweetReplyJobResult {
  success: true;
  url: string;
  tweetId: string;
  generatedReply: string;
  xApiResponse: XApiPostResponse;
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

export interface XApiPostResponse {
  data: {
    edit_history_tweet_ids: string[];
    id: string;
    text: string;
  };
}

export interface ExtractedTweetContent {
  tweet: string;
  author: string;
}

export interface QueueJobMetadata {
  jobId: string;
  url: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
}
