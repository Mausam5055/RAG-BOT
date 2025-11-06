import { embed } from "ai";
import { google } from "@ai-sdk/google";

export async function getEmbeddings(input: string) {
  try {
    console.log("Generating embeddings for input:", input.substring(0, 50) + "...");
    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
      value: input.replace(/\n/g, ' ')
    });
    console.log("Generated embedding with length:", embedding.length);
    return embedding;
  } catch (e) {
    console.log("Error calling Google Gemini embedding API: ", e);
    throw new Error(`Error calling Google Gemini embedding API: ${e}`);
  }
}