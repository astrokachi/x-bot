import { XApiPostResponse, ExtractedTweetContent } from "../../features/tweet-reply/tweet-reply.types.js";
import { Tokens, XUser } from "../types/auth.js";
import { X_USER_DETAILS_URL, X_TOKEN_URL } from "../const.js";
import { AuthenticationError } from "../lib/errors.js";

const credentials = btoa(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`);
const X_BASE_URL = "https://api.x.com/2";

export class XService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Fetches X user details using the provided access token
   */
  static async getXUserDetails(tokens: Tokens): Promise<XUser> {
    const resp = await fetch(X_USER_DETAILS_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    if (!resp.ok) {
      throw new AuthenticationError("Failed to fetch X user details");
    }
    const user = ((await resp.json() as any).data) as XUser;
    return user;
  }

  /**
   * Refreshes the access token using a refresh token
   * Returns new tokens with updated access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<Tokens> {
    const body = new URLSearchParams();
    body.append("refresh_token", refreshToken);
    body.append("grant_type", "refresh_token");
    body.append("client_id", process.env.X_CLIENT_ID!);

    const response = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    if (!response.ok) {
      throw new AuthenticationError(`Token refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { access_token: string; refresh_token?: string };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    };
  }

  async postMedia(fileBuffer: Buffer, mimeType: string): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("media", blob, "image");
    formData.append("media_category", "tweet_image");
    formData.append("media_type", mimeType);

    const res = await fetch(`${X_BASE_URL}/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    const responseData = await res.text();

    if (!res.ok) {
      throw new Error(`X API Media Upload Error (${res.status}): ${responseData}`);
    }

    const parsed = JSON.parse(responseData);
    return parsed.data.id;
  }

  async post(message: string, media?: { media_ids: string[] }): Promise<XApiPostResponse> {
    const body: Record<string, unknown> = { text: message };

    if (media?.media_ids?.length) {
      body.media = { media_ids: media.media_ids };
    }

    const res = await fetch(`${X_BASE_URL}/tweets`, {
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
      const res = await fetch(`${X_BASE_URL}/tweets`, {
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
    const data = await res.json() as { html: string; author_name: string };

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
