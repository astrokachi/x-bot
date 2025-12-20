import { replyToTweets } from '../controllers/tweet-reply.controller';
import { Router } from 'express';

const router = Router();

router.post('/reply', replyToTweets);

export default router;