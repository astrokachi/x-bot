import { generateText, ModelMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { INSTRUCTIONS } from "../const";

export class AIService {
  async generateResponse(tweet: string, author: string) {

    const apiKey = process.env.GITHUB_TOKEN;
    const baseURL = process.env.BASE_URL!;

    const openai = createOpenAICompatible({
      name: "github-models",
      baseURL,
      apiKey,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });

    try {
      const response = await generateText({
        model: openai("gpt-4.1"),
        messages: [
          INSTRUCTIONS,
          this.formatWeb3SafePrompt(tweet)
        ],
        temperature: 0.8,
      });

      return response.text;
    } catch (err: any) {
      const message = err?.data?.error?.message || err?.message || "AI request failed";
      const code = err?.data?.error?.code || err?.code;
      const status = err?.statusCode || 500;

      if (status === 401 && typeof message === 'string' && message.toLowerCase().includes('models permission')) {
        const e: any = new Error("GitHub Models token missing models:read permission");
        e.statusCode = 401;
        e.code = 'GITHUB_MODELS_MISSING_PERMISSION';
        throw e;
      }

      throw err;
    }
  }

  formatWeb3SafePrompt(tweetText: string): ModelMessage {
    return {
      role: "user",
      content:
        "Input text:\n" +
        `"${tweetText}"\n\n` +
        "Task: Produce a short, stylistically appropriate message that could logically follow from the above text, " +
        "using the style rules previously provided. Keep it extremely concise."
    };
  }

}
