import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { INSTRUCTIONS } from "../const.js";
export class AIService {
    async generateResponse(tweet, author, customInstructions) {
        const apiKey = process.env.GITHUB_TOKEN;
        const baseURL = process.env.BASE_URL;
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
        // Use custom instructions if provided, otherwise use default
        const systemMessage = customInstructions
            ? { role: "system", content: customInstructions }
            : INSTRUCTIONS;
        try {
            const response = await generateText({
                model: openai("gpt-4.1"),
                messages: [
                    systemMessage,
                    {
                        role: "user",
                        content: "Input text:\n" +
                            `"${tweet}"`
                    }
                ],
                temperature: 0.8,
            });
            return response.text;
        }
        catch (err) {
            const message = err?.data?.error?.message || err?.message || "AI request failed";
            const code = err?.data?.error?.code || err?.code;
            const status = err?.statusCode || 500;
            if (status === 401 && typeof message === 'string' && message.toLowerCase().includes('models permission')) {
                const e = new Error("GitHub Models token missing models:read permission");
                e.statusCode = 401;
                e.code = 'GITHUB_MODELS_MISSING_PERMISSION';
                throw new Error(e?.message);
            }
            throw err;
        }
    }
}
