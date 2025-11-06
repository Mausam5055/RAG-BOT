import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getContext } from "@/utils/context";

export async function POST(req: Request) {
  try {
    console.log("Environment variables:");
    console.log("PINECONE_INDEX:", process.env.PINECONE_INDEX);
    console.log("PINECONE_API_KEY exists:", !!process.env.PINECONE_API_KEY);
    
    const { messages } = await req.json();
    console.log("Received messages:", messages);

    // Get the last message
    const lastMessage = messages[messages.length - 1];
    console.log("Last message:", lastMessage);

    // Get the context from the last message
    const context = await getContext(lastMessage.content || '', "");
    console.log("Retrieved context:", context);

    // Format messages for Google Gemini
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === 'user') {
        const content = msg.parts?.filter((part: any) => part.type === 'text').map((part: any) => part.text).join(' ') || msg.content || '';
        return {
          role: 'user' as const,
          content: content
        };
      } else if (msg.role === 'assistant') {
        const content = msg.parts?.filter((part: any) => part.type === 'text').map((part: any) => part.text).join(' ') || msg.content || '';
        return {
          role: 'model' as const,
          content: content
        };
      }
      return msg;
    }).filter((msg: any) => msg.role === 'user' || msg.role === 'model');

    let systemMessage = `AI assistant is a brand new, powerful, human-like artificial intelligence.
The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
AI is a well-behaved and well-mannered individual.
AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
AI assistant is a big fan of Pinecone and Vercel.`;

    // Only add context block if we have relevant context
    if (context && context !== "No relevant context was found for this query." && context !== "Error retrieving context.") {
      systemMessage += `
START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK`;
    }

    systemMessage += `
AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
AI assistant will not invent anything that is not drawn directly from the context.`;

    // Ask Google Gemini for a streaming chat completion given the prompt
    const response = await streamText({
      model: google("gemini-1.5-flash"),
      system: systemMessage,
      messages: formattedMessages,
    });
    // Convert the response into a friendly text-stream
    return response.toTextStreamResponse();
  } catch (e: any) {
    console.error("Error in chat API:", e);
    if (e.message && (e.message.includes('UND_ERR_CONNECT_TIMEOUT') || e.message.includes('PineconeConnectionError'))) {
      return new Response(
        JSON.stringify({ error: 'Unable to connect to Pinecone. Please check your network connection and try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: e.message || 'An error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}