import { Tokens } from "./auth.js";

export type TweetReplyResult = {
  url: string;
  author: string;
  tweet: string;
  reply: string;
  status: "success" | "failed";
}

export type TweetReplyDto = {
  tokens: Tokens,
  tweetUrls: string[],
  customInstructions: string,
  maximumTime: string
}
