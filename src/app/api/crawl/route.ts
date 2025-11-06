import seed from './seed'
import { NextResponse } from 'next/server';
import { ServerlessSpecCloudEnum } from '@pinecone-database/pinecone'

export const runtime = 'edge'

export async function POST(req: Request) {
  console.log("Crawl API called");
  
  const { url, options } = await req.json()
  console.log("URL to crawl:", url);
  console.log("Options:", options);
  
  try {
    console.log("Environment variables:");
    console.log("PINECONE_INDEX:", process.env.PINECONE_INDEX);
    console.log("PINECONE_CLOUD:", process.env.PINECONE_CLOUD);
    console.log("PINECONE_REGION:", process.env.PINECONE_REGION);
    console.log("PINECONE_API_KEY exists:", !!process.env.PINECONE_API_KEY);
    
    const documents = await seed(
      url,
      1,
      process.env.PINECONE_INDEX!,
      process.env.PINECONE_CLOUD as ServerlessSpecCloudEnum || 'aws',
      process.env.PINECONE_REGION || 'us-east-1',
      options
    )
    console.log("Seed completed successfully");
    return NextResponse.json({ success: true, documents })
  } catch (error) {
    console.error("Error in crawl API:", error);
    return NextResponse.json({ success: false, error: "Failed crawling" })
  }
}