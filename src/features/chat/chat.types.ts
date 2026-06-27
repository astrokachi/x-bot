export interface ChatJobData {
  conversationId: string;
  recentMessages: { role: 'user' | 'assistant'; content: string }[];
  currentUserMessage: string;
  type: 'SINGLE' | 'MULTIPLE';
}

export interface ChatJobResult {
  success: boolean;
  conversationId: string;
  messageGroupId?: string;
  error?: string;
}
