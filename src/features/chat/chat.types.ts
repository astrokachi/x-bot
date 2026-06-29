export interface ChatJobData {
  operation: "addMessage" | "refine";
  conversationId: string;
  recentMessages: { role: "User" | "ASSISTANT"; content: string }[];
  currentUserMessage: string;
  type: "SINGLE" | "MULTIPLE";
  parentId?: string;
}

export interface ChatJobResult {
  success: boolean;
  conversationId: string;
  messageGroupId?: string;
  parentId?: string;
  error?: string;
}
