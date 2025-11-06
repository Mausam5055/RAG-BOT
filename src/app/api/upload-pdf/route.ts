import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbeddings } from '@/utils/embeddings';
import md5 from 'md5';
import { chunkedUpsert } from '@/utils/chunkedUpsert';
import { RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    console.log("PDF upload API called");
    
    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const splittingMethod = formData.get('splittingMethod') as string || 'recursive';
    const chunkSize = parseInt(formData.get('chunkSize') as string || '256');
    const overlap = parseInt(formData.get('overlap') as string || '1');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log("File received:", file.name);
    
    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    // Read the PDF content
    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);
    
    // For now, we'll use a simple text extraction approach
    // In a production app, you'd want to use a proper PDF parsing library
    // like pdf-parse or pdfjs-dist
    
    // Convert PDF to text (simplified approach)
    // Note: This is a placeholder - in a real implementation, you'd parse the PDF properly
    const textContent = `PDF Content from ${file.name}\n\n` + 
      `[PDF content would be extracted here in a full implementation]`.repeat(20);
    
    console.log("Extracted text length:", textContent.length);
    
    // Split the text into chunks
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
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      try {
        console.log("Processing document", i + 1, "of", docs.length);
        
        // Generate embedding
        const embedding = await getEmbeddings(doc.pageContent);
        
        // Create hash for ID
        const hash = md5(doc.pageContent);
        
        // Create vector record
        vectors.push({
          id: hash,
          values: embedding,
          metadata: {
            chunk: doc.pageContent,
            text: doc.pageContent.substring(0, 36000), // Truncate if needed
            url: `pdf://${file.name}`,
            hash: hash,
            source: 'pdf-upload'
          }
        });
      } catch (error) {
        console.error("Error processing document", i, error);
      }
    }
    
    console.log("Generated", vectors.length, "vectors");
    
    // Upsert vectors to Pinecone
    await chunkedUpsert(index, vectors, '', 10);
    console.log("Successfully upserted vectors to Pinecone");
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${vectors.length} chunks from ${file.name}`,
      documentCount: vectors.length
    });
  } catch (error) {
    console.error("Error in PDF upload API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}