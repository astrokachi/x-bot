import { Request, Response, NextFunction } from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
} from './conversation.service.js';

export async function createConv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { title } = req.body;
    const conversation = await createConversation(userId, title);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function getAllConversations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const conversations = await getConversations(userId);
    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
}

export async function getConvById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const conversation = await getConversationById(id, userId);
    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function updateConv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    const { title } = req.body;
    const conversation = await updateConversation(id, userId, { title });
    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function deleteConv(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;
    await deleteConversation(id, userId);
    res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
}
