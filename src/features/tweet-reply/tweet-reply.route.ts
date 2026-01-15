import { replyToTweets } from './tweet-reply.controller';
import { Router } from 'express';

const router = Router();

router.post('/reply', replyToTweets);

export default router;
