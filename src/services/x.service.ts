export class XService {
  private baseUrl = 'https://api.x.com/2/tweets'
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async replyToPost(tweetUrl: string, message: string): Promise<any> {
    const tweetId = this.extractTweetId(tweetUrl);


    const endpoint = `${this.baseUrl}`;
    const body = {
      text: message,
      reply: {
        in_reply_to_tweet_id: tweetId
      }
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const responseData = await res.text();

      if (!res.ok) {
        const errorDetails = {
          statusCode: res.status,
          statusText: res.statusText,
          responseBody: responseData,
          url: endpoint
        };

        console.error('X API Error Details:', JSON.stringify(errorDetails, null, 2));

        throw new Error(`X API Error (${res.status}): ${responseData}`);
      }

      return JSON.parse(responseData);
    } catch (error: any) {
      const errorMessage = error?.message || JSON.stringify(error);
      console.error('X API Error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async getPostContent(tweetUrl: string): Promise<{ tweet: string, author: string }> {
    const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}`;

    const res = await fetch(oEmbedUrl, {
      headers: {
        "User-Agent": "tweet-reply-bot",
      }
    });

    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();

    const html = data.html || "";
    const author = data.author_name || ""

    const textMatch = html.match(/<p[^>]+>(.*?)<\/p>/);
    const text = textMatch ? textMatch[1] : "";
    const tweet = text.replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    return { tweet, author }
  }

  extractTweetId(url: string): string {
    const match = url.match(/status\/(\d+)/);
    if (!match) throw new Error("Invalid tweet URL");
    console.log(match);
    return match[1];
  }

}

