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
  error?: string;
}

export async function replyToTweets(req: Request, res: Response): Promise<void> {
  const log = (req as any).log;
  const { tweetUrls } = req.body;

  log?.info(
    { urlCount: tweetUrls?.length },
    'hit_reply_endpoint'
  );

  try {
    if (!Array.isArray(tweetUrls) || tweetUrls.length === 0) {
      res.status(400).json({
        error: { message: 'tweetUrls must be a non-empty array' }
      });
      return;
    }

    const xService = new XService(req.session.accessToken!);
    const ai = new AIService();

    const timings = generateTaskTimings({
      taskCount: tweetUrls.length
    });

    log?.info(
      {
        taskCount: tweetUrls.length,
        totalTimeMs: timings[timings.length - 1].cumulativeTimeMs,
        timings: timings.map(t => ({ index: t.taskIndex, delay: t.delayMs }))
      },
      'generated_task_timings'
    );

    const results: TweetReplyResult[] = [];

    for (let i = 0; i < tweetUrls.length; i++) {
      const url = tweetUrls[i];
      const delayMs = getTaskDelay(timings, i);


      if (delayMs > 0) {
        log?.info({ delayMs, nextTweetIndex: i }, 'waiting_before_next_tweet');
        await sleep(delayMs);
      }

      try {
        log?.info({ tweetIndex: i, url }, 'processing_tweet');

        const { tweet, author } = await xService.getPostContent(url);
        const reply = await ai.generateResponse(tweet, author);


        log?.info({ tweetIndex: i, url, replyLength: reply.length }, 'posting_reply_to_twitter');
        await xService.replyToPost(url, reply);

        results.push({
          url,
          author,
          tweet,
          reply,
          status: 'success'
        });

        log?.info(
          { tweetIndex: i, author, replyLength: reply.length },
          'tweet_reply_success'
        );
      } catch (error: any) {
        const errorMsg = error?.message || 'Unknown error';
        const fullError = JSON.stringify(error, null, 2);

        results.push({
          url,
          author: 'unknown',
          tweet: 'unknown',
          reply: '',
          status: 'failed',
          error: errorMsg
        });

        log?.error(
          { tweetIndex: i, url, error: errorMsg, fullError, errorStack: error?.stack },
          'tweet_reply_failed'
        );
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    log?.info(
      { successCount, failureCount, totalCount: results.length },
      'batch_processing_complete'
    );

    res.json({
      msg: `Processed ${tweetUrls.length} tweet(s)`,
      successCount,
      failureCount,
      results
    });
    return;

  } catch (error: any) {
    const anyErr: any = error;

    if (anyErr?.statusCode === 401 && anyErr?.code === 'GITHUB_MODELS_MISSING_PERMISSION') {
      res.status(401).json({
        error: {
          code: 'GITHUB_MODELS_MISSING_PERMISSION',
          message: 'The GITHUB_TOKEN lacks models:read permission. Update token scopes or workflow permissions.'
        }
      });
      return;
    }

    log?.error({ error: anyErr?.message }, 'controller_unhandled_error');
    res.status(500).json({ error: { message: anyErr?.message || 'Internal Server Error' } });
    return;
  }
}