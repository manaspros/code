/**
 * Gemini AI Integration
 * Handles chat generation and embeddings for RAG
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Get Gemini generative model
 * Default: gemini-2.0-flash-exp (fast, supports function calling)
 */
export function getGeminiModel(modelName: string = "gemini-2.0-flash-exp") {
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate text response from Gemini
 * Fast MVP approach - simple text generation
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini generateText error:", error);
    throw error;
  }
}

/**
 * Generate text with streaming
 * For real-time chat responses
 */
export async function* generateTextStream(prompt: string) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error) {
    console.error("Gemini stream error:", error);
    throw error;
  }
}

/**
 * Generate embedding for a single text
 * Used for RAG semantic search
 * Model: text-embedding-004 (768 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Gemini embedding error:", error);
    throw error;
  }
}

/**
 * Batch generate embeddings for multiple texts
 * More efficient for RAG indexing
 */
export async function batchGenerateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  try {
    const embeddings: number[][] = [];

    // Process in batches to avoid rate limits
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
      // Small delay to avoid rate limits (MVP approach)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return embeddings;
  } catch (error) {
    console.error("Batch embedding error:", error);
    throw error;
  }
}

/**
 * Generate structured response with function calling
 * For tool execution decision-making
 */
export async function generateWithTools(
  prompt: string,
  tools: any[]
): Promise<any> {
  try {
    const model = getGeminiModel();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ functionDeclarations: tools }],
    });

    const response = result.response;

    // Check if tool was called
    const functionCall = response.functionCalls()?.[0];

    return {
      text: response.text(),
      functionCall: functionCall
        ? {
            name: functionCall.name,
            args: functionCall.args,
          }
        : null,
    };
  } catch (error) {
    console.error("Gemini tools error:", error);
    throw error;
  }
}

/**
 * Chat with conversation history
 * For multi-turn conversations
 */
export async function chat(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const model = getGeminiModel();

    // Convert to Gemini format
    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const result = await model.generateContent({ contents });
    return result.response.text();
  } catch (error) {
    console.error("Gemini chat error:", error);
    throw error;
  }
}

export { genAI };
