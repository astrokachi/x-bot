export interface ChatJobData {
  operation: "addMessage" | "refine";
  conversationId: string;
  // The turn (group) the worker inserts the response options into.
  messageGroupId: string;
  recentMessages: { role: "user" | "assistant"; content: string }[];
  currentUserMessage: string;
  type: "SINGLE" | "MULTIPLE";
  // Present for refine jobs: the assistant response this turn refines.
  parentMessageId?: string;
}

export interface ChatJobResult {
  success: boolean;
  conversationId: string;
  messageGroupId?: string;
  parentMessageId?: string;
  error?: string;
}
