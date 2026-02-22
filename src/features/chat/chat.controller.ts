import { Request, Response, NextFunction } from 'express';
import {
  createConversationWithMessage,
  addMessageToConversation,
  getMessagesByConversation,
} from './chat.service.js';
import { sendResponse } from '../../shared/utils/response.js';

export async function newPrompt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { content, title } = req.body;
    const conversation = await createConversationWithMessage(userId, content, title);
    sendResponse(res, 201, 'Conversation created successfully', conversation);
  } catch (error) {
    next(error);
  }
}

export async function prompt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id: conversationId } = req.params;
    const { content } = req.body;
    const message = await addMessageToConversation(conversationId, userId, content);
    sendResponse(res, 201, 'Message sent successfully', message);
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id: conversationId } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const take = parseInt(req.query.take as string) || 50;
    const result = await getMessagesByConversation(conversationId, userId, cursor, take);
    sendResponse(res, 200, 'Messages retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}
