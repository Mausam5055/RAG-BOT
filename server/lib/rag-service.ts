import { pdfProcessor } from "./pdf-processor";
import { geminiService } from "./gemini-service";
import { pineconeService } from "./pinecone-service";
import { storage } from "../storage";
import type { ContextSnippet } from "@shared/schema";

export class RAGService {
  async processDocument(buffer: Buffer, filename: string): Promise<{ documentId: string; pageCount: number }> {
    const { text, pageCount, chunks } = await pdfProcessor.processFile(buffer);
    
    const document = await storage.createDocument({
      filename,
      pageCount,
      fullText: text,
    });

    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await geminiService.generateEmbeddings(chunkTexts);

    await pineconeService.upsertEmbeddings(document.id, chunks, embeddings);

    return {
      documentId: document.id,
      pageCount,
    };
  }

  async answerQuestion(documentId: string, question: string): Promise<{ answer: string; snippets: ContextSnippet[] }> {
    const document = await storage.getDocument(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const questionEmbedding = await geminiService.generateEmbedding(question);

    const searchResults = await pineconeService.searchSimilar(documentId, questionEmbedding, 5);

    const context = searchResults
      .map((result) => result.text)
      .join("\n\n");

    const answer = await geminiService.generateAnswer(question, context);

    const snippets: ContextSnippet[] = searchResults.map((result) => ({
      text: result.text,
      score: result.score,
      pageNumber: result.pageNumber,
    }));

    return {
      answer,
      snippets,
    };
  }

  async deleteDocument(documentId: string): Promise<void> {
    await pineconeService.deleteDocumentVectors(documentId);
    await storage.deleteDocument(documentId);
  }
}

export const ragService = new RAGService();
