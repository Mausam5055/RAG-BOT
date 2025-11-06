import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private embeddingModel;
  private generativeModel;

  constructor() {
    this.embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const modelName = process.env.GOOGLE_MODEL || "gemini-2.0-flash-exp";
    this.generativeModel = genAI.getGenerativeModel({ model: modelName });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map((text) => this.generateEmbedding(text))
    );
    return embeddings;
  }

  async generateAnswer(question: string, context: string): Promise<string> {
    const prompt = `You are a helpful AI assistant answering questions based on the provided document context.

Context from the document:
${context}

Question: ${question}

Please provide a clear and accurate answer based solely on the context provided. If the context doesn't contain enough information to answer the question, say so.

Answer:`;

    const result = await this.generativeModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  }
}

export const geminiService = new GeminiService();
