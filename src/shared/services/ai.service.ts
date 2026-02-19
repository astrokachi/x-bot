import { generateText, ModelMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { INSTRUCTIONS } from "../const.js";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  async generateResponse(tweet: string, customInstructions?: string) {
    const apiKey = process.env.GITHUB_TOKEN;
    const baseURL = process.env.BASE_URL!;

    if (!apiKey) {
      throw new Error("GITHUB_TOKEN environment variable is not set");
    }

    const openai = createOpenAICompatible({
      name: "github-models",
      baseURL,
      apiKey,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const systemMessage: ModelMessage = customInstructions
      ? { role: "system", content: customInstructions }
      : INSTRUCTIONS;

    try {
      const response = await generateText({
        model: openai("gpt-4.1"),
        messages: [
          systemMessage,
          {
            role: "user",
            content:
              "Input text:\n" +
              `"${tweet}"`
          }
        ],
        temperature: 0.8,
      });
      return response.text;
    } catch (err: any) {
      const message = err?.data?.error?.message || err?.message || "AI request failed";
      const status = err?.statusCode || 500;

      if (status === 401 && typeof message === 'string' && message.toLowerCase().includes('models permission')) {
        const e: any = new Error("GitHub Models token missing models:read permission");
        e.statusCode = 401;
        e.code = 'GITHUB_MODELS_MISSING_PERMISSION';
        throw new Error(e?.message);
      }

      throw err;
    }
  }

  async generateChatResponse(messages: ChatMessage[], customInstructions?: ModelMessage) {
    const apiKey = process.env.GITHUB_TOKEN;
    const baseURL = process.env.BASE_URL!;

    if (!apiKey) {
      throw new Error("GITHUB_TOKEN environment variable is not set");
    }

    const openai = createOpenAICompatible({
      name: "github-models",
      baseURL,
      apiKey,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    const systemMessage: ModelMessage = customInstructions ?? INSTRUCTIONS;

    const conversationMessages: ModelMessage[] = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    try {
      const response = await generateText({
        model: openai("gpt-4.1"),
        messages: [systemMessage, ...conversationMessages],
        temperature: 0.8,
      });
      return response.text;
    } catch (err: any) {
      const message = err?.data?.error?.message || err?.message || "AI request failed";
      const status = err?.statusCode || 500;

      if (status === 401 && typeof message === 'string' && message.toLowerCase().includes('models permission')) {
        const e: any = new Error("GitHub Models token missing models:read permission");
        e.statusCode = 401;
        e.code = 'GITHUB_MODELS_MISSING_PERMISSION';
        throw new Error(e?.message);
      }

      throw err;
    }
  }
}

