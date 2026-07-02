import { messages, messageGroups } from "../../shared/db/schema.js";

export type ChatType = "SINGLE" | "MULTIPLE";
export type MessageRow = typeof messages.$inferSelect;
export type GroupRow = typeof messageGroups.$inferSelect;

/**
 * A turn = one question (user message) + its response variants (assistant
 * messages), assembled from a single MessageGroup.
 */
export interface Turn {
  turnId: string;
  parentMessageId: string | null;
  question: MessageRow | null;
  response: {
    type: ChatType;
    options: MessageRow[];
  };
}

/** Assemble a turn from its group and the messages that belong to it. */
export function toTurn(group: GroupRow, groupMessages: MessageRow[]): Turn {
  const ordered = [...groupMessages].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime(),
  );
  const question = ordered.find((m) => m.role === "user") ?? null;
  const options = ordered.filter((m) => m.role === "assistant");

  return {
    turnId: group.id,
    parentMessageId: group.parent_message_id ?? null,
    question,
    response: {
      type: (question?.type as ChatType) ?? "SINGLE",
      options,
    },
  };
}

/** Derive a short conversation title from the first prompt's content. */
export function deriveTitle(content: string, maxLen = 60): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New Conversation";
  if (cleaned.length <= maxLen) return cleaned;

  const slice = cleaned.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = lastSpace > 20 ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

/** Compose the LLM prompt for a refinement: original draft + user request. */
export function buildRefinePrompt(original: string, instruction: string): string {
  const request = instruction.trim().length
    ? instruction.trim()
    : "Improve this draft while keeping its meaning.";

  return [
    "You are refining an existing social media post draft.",
    "",
    "ORIGINAL DRAFT:",
    '"""',
    original,
    '"""',
    "",
    "USER REQUEST:",
    '"""',
    request,
    '"""',
    "",
    "Rewrite the draft so it satisfies the request. Keep it natural, concise,",
    "and ready to post. Return ONLY the revised post — no preamble, no quotes,",
    "no multiple options.",
  ].join("\n");
}
