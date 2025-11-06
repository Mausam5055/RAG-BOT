import { ScoredPineconeRecord } from "@pinecone-database/pinecone";
import { getMatchesFromEmbeddings } from "./pinecone";
import { getEmbeddings } from './embeddings'

export type Metadata = {
  url: string,
  text: string,
  chunk: string,
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, maxTokens = 3000, minScore = 0.7, getOnlyText = true): Promise<string | ScoredPineconeRecord[]> => {
  try {
    console.log("Getting context for message:", message);
    
    // Get the embeddings of the input message
    const embedding = await getEmbeddings(message);
    console.log("Generated embedding with length:", embedding.length);

    // Retrieve the matches for the embeddings from the specified namespace
    const matches = await getMatchesFromEmbeddings(embedding, 3, namespace);
    console.log("Retrieved matches:", matches.length);

    // Log match scores for debugging
    matches.forEach((match, index) => {
      console.log(`Match ${index + 1} score:`, match.score);
    });

    // Filter out the matches that have a score lower than the minimum score
    const qualifyingDocs = matches.filter(m => m.score && m.score > minScore);
    console.log("Qualifying docs:", qualifyingDocs.length);

    if (!getOnlyText) {
      // Use a map to deduplicate matches by URL
      return qualifyingDocs
    }

    let docs = matches ? qualifyingDocs.map(match => (match.metadata as Metadata).chunk) : [];
    // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
    const result = docs.join("\n").substring(0, maxTokens);
    console.log("Context result length:", result.length);
    
    // If no context is found, return a message indicating this
    if (result.length === 0) {
      // Log more details about why no context was found
      console.log("No qualifying documents found. Total matches:", matches.length);
      if (matches.length > 0) {
        const scores = matches.map(m => m.score).filter(score => score !== undefined);
        console.log("Match scores:", scores);
        console.log("Min score threshold:", minScore);
      }
      return "No relevant context was found for this query.";
    }
    
    return result;
  } catch (error) {
    console.error("Error in getContext:", error);
    // Return a default message if there's an error
    return "Error retrieving context.";
  }
}