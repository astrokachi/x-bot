import { authorize, getToken } from '../controllers/auth.controller';
import { withControllerLogging } from '../middleware/controller-logger';
import { Router } from 'express';

const router = Router();

router.post('/authorize', authorize);
router.get('/callback', getToken);

export default router; 