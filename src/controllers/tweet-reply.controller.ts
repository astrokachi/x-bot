import { Request, Response } from "express";
import { XService } from "../services/x.service";
import { AIService } from "../services/ai.service";

export async function replyToTweets(req: Request, res: Response): Promise<void> {
  (req as any).log?.info({ bodyKeys: Object.keys(req.body || {}) }, 'hit_reply_endpoint');
  try {
    const { tweetUrls } = req.body;

    const xService = new XService(process.env['X_BEARER_TOKEN']!);
    const ai = new AIService();

    const { tweet, author } = await xService.getPostContent(tweetUrls[0]);
    const reply = await ai.generateResponse(tweet, author);


    res.json({ msg: `tweets received`, reply });
    return;

  } catch (error) {
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
    res.status(500).json({ error: { message: anyErr?.message || 'Internal Server Error' } });
    return;
  }
}