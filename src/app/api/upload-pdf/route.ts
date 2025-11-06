import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddings } from '@/utils/embeddings';
import md5 from 'md5';
import { chunkedUpsert } from '@/utils/chunkedUpsert';
import { RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';

export const runtime = 'edge';

// Simple PDF text extraction function for Edge Runtime
async function extractPdfText(pdfData: Uint8Array): Promise<string> {
  // In Edge Runtime, we can't use pdf-parse directly
  // We'll implement a basic text extraction approach
  try {
    // Try to decode as UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(pdfData);
    
    // Basic cleaning - remove excessive whitespace and non-printable characters
    text = text.replace(/\0/g, ''); // Remove null bytes
    text = text.replace(/[^\x20-\x7E\x0A\x0D\x09]/g, ' '); // Keep only printable ASCII and common whitespace
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    
    return text.trim();
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return "Error extracting text from PDF";
  }
}

// Function to validate and clean text content
function validateAndCleanText(text: string): string {
  // Remove excessively long sequences of the same character
  text = text.replace(/(.)\1{100,}/g, '$1'); // Replace 100+ consecutive same chars with single char
  
  // Limit total length to prevent oversized chunks
  if (text.length > 10000) {
    text = text.substring(0, 10000);
  }
  
  return text.trim();
}

export async function POST(req: NextRequest) {
  try {
    console.log("PDF upload API called");
    
    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const splittingMethod = formData.get('splittingMethod') as string || 'recursive';
    const chunkSize = Math.min(parseInt(formData.get('chunkSize') as string || '256'), 1000); // Limit chunk size
    const overlap = Math.min(parseInt(formData.get('overlap') as string || '1'), 100); // Limit overlap
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log("File received:", file.name);
    
    // Check if file is PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    // Read the PDF content
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);
    
    // Extract text from PDF (simplified approach for Edge Runtime)
    const rawTextContent = await extractPdfText(pdfData);
    const textContent = validateAndCleanText(rawTextContent);
    
    console.log("Extracted text length:", textContent.length);
    
    // Check if we have content
    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json({ error: 'No text content found in PDF' }, { status: 400 });
    }
    
    // Split the text into smaller chunks to avoid Pinecone limits
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize,
      chunkOverlap: overlap,
    });
    
    const docs = await splitter.createDocuments([textContent]);
    console.log("Created", docs.length, "documents");
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });
    
    const indexName = process.env.PINECONE_INDEX || 'demovercel1';
    console.log("Using index:", indexName);
    
    // Get the index
    const index = pinecone.Index(indexName);
    
    // Process each document chunk
    const vectors = [];
    let processedCount = 0;
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      try {
        // Clean the document content
        const cleanContent = validateAndCleanText(doc.pageContent);
        
        // Skip empty or very short content
        if (cleanContent.length < 10) {
          continue;
        }
        
        console.log("Processing document", i + 1, "of", docs.length);
        
        // Generate embedding
        const embedding = await getEmbeddings(cleanContent);
        
        // Create hash for ID
        const hash = md5(cleanContent);
        
        // Create vector record
        vectors.push({
          id: hash,
          values: embedding,
          metadata: {
            chunk: cleanContent,
            text: cleanContent.substring(0, 2000), // Further limit metadata text
            url: `pdf://${file.name}`,
            hash: hash,
            source: 'pdf-upload'
          }
        });
        
        processedCount++;
        
        // Process in smaller batches to avoid memory issues
        if (vectors.length >= 10) {
          console.log("Upserting batch of", vectors.length, "vectors");
          await chunkedUpsert(index, vectors, '', 5); // Smaller batch size
          vectors.length = 0; // Clear the array
        }
      } catch (error) {
        console.error("Error processing document", i, error);
        // Continue with next document instead of failing completely
      }
    }
    
    // Process any remaining vectors
    if (vectors.length > 0) {
      console.log("Upserting final batch of", vectors.length, "vectors");
      await chunkedUpsert(index, vectors, '', 5);
    }
    
    console.log("Successfully processed", processedCount, "documents");
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${processedCount} chunks from ${file.name}`,
      documentCount: processedCount
    });
  } catch (error) {
    console.error("Error in PDF upload API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}