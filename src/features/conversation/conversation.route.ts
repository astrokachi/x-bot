import { Router } from 'express';
import {
  createConv,
  getAllConversations,
  getConvById,
  updateConv,
  deleteConv,
} from './conversation.controller.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router: Router = Router();

router.post('/', authMiddleware, createConv);
router.get('/', authMiddleware, getAllConversations);
router.get('/:id', authMiddleware, getConvById);
router.patch('/:id', authMiddleware, updateConv);
router.delete('/:id', authMiddleware, deleteConv);

export default router;
