import { replyToTweets } from './tweet-reply.controller.js';
import { Router } from 'express';

const router: Router = Router();

router.post('/reply', replyToTweets);

export default router;
