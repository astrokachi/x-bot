export class XService {
  private baseUrl = 'https://api.x.com/'
  private bearerToken;

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }


  replyToPost(message: string) {

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
}

