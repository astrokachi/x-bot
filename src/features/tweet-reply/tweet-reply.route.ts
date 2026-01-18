import { replyToTweets } from './tweet-reply.controller.js';
import { Router } from 'express';
import { validateBody, tweetReplySchema } from './tweet-reply.validation.js';

const router: Router = Router();

router.post('/reply', validateBody(tweetReplySchema), replyToTweets);

export default router;
