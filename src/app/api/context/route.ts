import { NextResponse } from "next/server";
import { getContext } from "@/utils/context";
import { ScoredPineconeRecord } from "@pinecone-database/pinecone";

export async function POST(req: Request) {
  try {
    console.log("Context API called");
    const { messages } = await req.json()
    console.log("Messages received:", messages);
    
    const lastMessage = messages.length > 1 ? messages[messages.length - 1] : messages[0]
    console.log("Last message:", lastMessage);
    
    // Extract text content from UIMessage parts
    const lastMessageContent = lastMessage.parts?.filter((part: any) => part.type === 'text').map((part: any) => part.text).join(' ') || lastMessage.content || '';
    console.log("Last message content:", lastMessageContent);
    
    const context = await getContext(lastMessageContent, '', 10000, 0.7, false) as ScoredPineconeRecord[]
    console.log("Context retrieved:", context.length);
    
    return NextResponse.json({ context })
  } catch (e: any) {
    console.log("Error in context API:", e)
    if (e.message && e.message.includes('UND_ERR_CONNECT_TIMEOUT')) {
      return NextResponse.json({ error: 'Unable to connect to Pinecone. Please check your network connection and try again.' }, { status: 500 });
    }
    return NextResponse.json({ error: e.message || 'An error occurred' }, { status: 500 });
  }
}