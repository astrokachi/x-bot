import { generateText, ModelMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import OpenAI from "openai";
import { INSTRUCTIONS } from "../const.js";
import { prisma } from "../lib/prisma.js";
import { CHAT_SYSTEM_PROMPT } from "../prompt-templates.js";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}



export class AIService {
  private openaiClient: OpenAI;

  constructor() {
    this.openaiClient = new OpenAI({
      apiKey: process.env.GITHUB_TOKEN,
      baseURL: process.env.BASE_URL,
    });
  }

  private getProvider() {
    const apiKey = process.env.GITHUB_TOKEN;
    const baseURL = process.env.BASE_URL!;

    if (!apiKey) {
      throw new Error("GITHUB_TOKEN environment variable is not set");
    }

    return createOpenAICompatible({
      name: "github-models",
      baseURL,
      apiKey,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  }



  async generateResponse(tweet: string, customInstructions?: string) {
    const openai = this.getProvider();

    const systemMessage: ModelMessage = customInstructions
      ? { role: "system", content: customInstructions }
      : INSTRUCTIONS;

    try {
      const response = await generateText({
        model: openai("gpt-4.1"),
        maxRetries: 3,
        messages: [
          systemMessage,
          {
            role: "user",
            content: "Input text:\n" + `"${tweet}"`,
          },
        ],
        temperature: 0.8,
      });
      return response.text;
    } catch (err: any) {
      this.handleProviderError(err);
    }
  }


  async generateChatResponse(
    conversationId: string,
    recentMessages: ChatMessage[],
    currentUserMessage: string,
    customInstructions?: ModelMessage,
    type: 'SINGLE' | 'MULTIPLE' = 'SINGLE'
  ): Promise<string> {
    const openai = this.getProvider();
    
    // Base system message
    const systemMessage = customInstructions ?? CHAT_SYSTEM_PROMPT;
    
    // If multiple responses are requested, append explicit formatting instructions
    if (type === 'MULTIPLE') {
      systemMessage.content += 
        "\n\nIMPORTANT: The user has requested MULTIPLE response options. " +
        "You must generate exactly 3 different responses in different tones. " +
        "Separate each distinct response using EXACTLY this delimiter on its own line: ---OPTION_SEPARATOR---" +
        "\nDo not number them or add any prefix text, just provide the 3 responses separated by the delimiter.";
    }

    // Try to pull relevant long-term memory for context
    let ragContext = "";
    try {
      const embedding = await this.generateEmbedding(currentUserMessage);
      const relevantMemory = await this.retrieveRelevantMemory(
        conversationId,
        embedding,
        5
      );
      if (relevantMemory.length > 0) {
        ragContext = relevantMemory.map((m) => `- ${m.chunk}`).join("\n");
      }
    } catch (err) {
      // If RAG is down or empty, just keep going without it
      console.error("RAG retrieval failed, proceeding without memory:", err);
    }

    const messagesForLLM: ModelMessage[] = [systemMessage];

    if (ragContext) {
      messagesForLLM.push({
        role: "system",
        content: `Relevant memory:\n${ragContext}`,
      });
    }


    for (const msg of recentMessages) {
      messagesForLLM.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }


    try {
      const response = await generateText({
        model: openai("gpt-4.1"),
        maxRetries: 3,
        messages: messagesForLLM,
        temperature: 0.7,
      });
      return response.text;
    } catch (err: any) {
      this.handleProviderError(err);
    }
  }


  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  }

  // Find the most relevant memory chunks for this conversation
  async retrieveRelevantMemory(
    conversationId: string,
    embedding: number[],
    topK: number = 5
  ): Promise<{ chunk: string }[]> {
    const vectorString = `[${embedding.join(",")}]`;

    const results = await prisma.$queryRawUnsafe<{ chunk: string }[]>(
      `SELECT "value" AS chunk
       FROM "Memory"
       WHERE "conversation_id" = $1
       ORDER BY "embedding" <=> $2::vector
       LIMIT $3`,
      conversationId,
      vectorString,
      topK
    );

    return results;
  }


  async storeMemory(
    conversationId: string,
    content: string,
    category: string = "chat",
    key: string = "message"
  ): Promise<void> {
    const embedding = await this.generateEmbedding(content);
    const vectorString = `[${embedding.join(",")}]`;

    await prisma.$queryRawUnsafe(
      `INSERT INTO "Memory" ("id", "conversation_id", "category", "key", "value", "embedding", "created_at", "deleted_at")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW(), NOW())`,
      conversationId,
      category,
      key,
      content,
      vectorString
    );
  }



  private handleProviderError(err: any): never {
    const message =
      err?.data?.error?.message || err?.message || "AI request failed";
    const status = err?.statusCode || 500;

    if (
      status === 401 &&
      typeof message === "string" &&
      message.toLowerCase().includes("models permission")
    ) {
      const e: any = new Error(
        "GitHub Models token missing models:read permission"
      );
      e.statusCode = 401;
      e.code = "GITHUB_MODELS_MISSING_PERMISSION";
      throw e;
    }

    throw err;
  }
}
