import { replyToTweets } from '../controllers/tweet-reply.controller';
import { Router } from 'express';
import { withControllerLogging } from '../middleware/controller-logger';

const router = Router();

router.post('/reply', withControllerLogging(replyToTweets, 'reply_to_tweets'));

export default router;