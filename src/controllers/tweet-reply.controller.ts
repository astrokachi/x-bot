import { Request, Response } from "express";
import { XService } from "../services/x.service";
import { AIService } from "../services/ai.service";
import { generateTaskTimings, getTaskDelay, sleep } from "../utils/time-randomizer";

export interface TweetReplyResult {
  url: string;
  author: string;
  tweet: string;
  reply: string;
  status: 'success' | 'failed';
}

export interface TweetError {
  error: string;
}

export async function replyToTweets(req: Request, res: Response): Promise<Response> {
  const log = (req as any).log;
  const { tweetUrls } = req.body;
  console.log(tweetUrls);
  try {
    if (!Array.isArray(tweetUrls) || tweetUrls.length === 0) {
      console.log("Tweet step 2")
      return res.status(400).json({
        error: { message: 'tweetUrls must be a non-empty array' }
      });
    }
    console.log("accessToken", req.session.accessToken);
    const xService = new XService(req.session.accessToken!);

    const ai = new AIService();
    console.log("Tweet step 3");
    const timings = generateTaskTimings({
      taskCount: tweetUrls.length
    });

    const results: TweetReplyResult[] = [];
    let error: TweetError;
    console.log("Tweet step 4");
    for (let i = 0; i < tweetUrls.length; i++) {
      const url = tweetUrls[i];
      const delayMs = getTaskDelay(timings, i);


      if (delayMs > 0) {
        await sleep(delayMs);
      }

      // urls ([tweets]) -> generate response and post am
      try {
        const { tweet, author } = await xService.getPostContent(url);

        // const reply = await ai.generateResponse(tweet, author);
        // console.log("ai wan kill us")
        const response = await xService.replyToPost(url, "hello");
        return res.json({ response });
      } catch (error: any) {
        const errorMsg = error?.message || 'Unknown error';
        return errorMsg;
      }
    }
    console.log("Tweet step 5");
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    return res.json({
      msg: `Processed ${tweetUrls.length} tweet(s)`,
      successCount,
      failureCount,
      results
    });


  } catch (error: any) {
    const anyErr: any = error;

    if (anyErr?.statusCode === 401 && anyErr?.code === 'GITHUB_MODELS_MISSING_PERMISSION') {
      return res.status(401).json({
        error: {
          code: 'GITHUB_MODELS_MISSING_PERMISSION',
          message: 'The GITHUB_TOKEN lacks models:read permission. Update token scopes or workflow permissions.'
        }
      });

    }

    return res.status(500).json({ error: { message: anyErr?.message || 'Internal Server Error' } });
  }
}