import { XApiPostResponse, ExtractedTweetContent } from "../types/queue";

export class XService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async replyToPost(
    tweetUrl: string,
    message: string
  ): Promise<XApiPostResponse> {
    const tweetId = this.extractTweetId(tweetUrl);

    const body = {
      text: message,
      reply: {
        in_reply_to_tweet_id: tweetId,
      },
    };
    try {
      const res = await fetch("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseData = await res.text();

      if (!res.ok) {
        throw new Error(`X API Error (${res.status}): ${responseData}`);
      }

      return JSON.parse(responseData);
    } catch (error: any) {
      const errorMessage = error?.message || JSON.stringify(error);
      throw new Error(errorMessage);
    }
  }

  async getPostContent(tweetUrl: string): Promise<ExtractedTweetContent> {
    const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
      tweetUrl
    )}`;

    const res = await fetch(oEmbedUrl, {
      headers: {
        "User-Agent": "tweet-reply-bot",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    const html = data.html || "";
    const author = data.author_name || "";

    const textMatch = html.match(/<p[^>]+>(.*?)<\/p>/);
    const text = textMatch ? textMatch[1] : "";
    const tweet = text
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    return { tweet, author };
  }

  extractTweetId(url: string): string {
    const match = url.match(/status\/(\d+)/);
    if (!match) throw new Error("Invalid tweet URL");
    return match[1];
  }
}
