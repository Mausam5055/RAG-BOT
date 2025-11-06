import { Pinecone, type ScoredPineconeRecord } from "@pinecone-database/pinecone";

export type Metadata = {
  url: string,
  text: string,
  chunk: string,
  hash: string
}

// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
const getMatchesFromEmbeddings = async (embeddings: number[], topK: number, namespace: string): Promise<ScoredPineconeRecord<Metadata>[]> => {
  try {
    console.log("Initializing Pinecone client...");
    // Obtain a client for Pinecone with explicit API key
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });
    console.log("Pinecone client initialized");

    const indexName: string = process.env.PINECONE_INDEX || '';
    console.log("Using index name:", indexName);
    
    if (indexName === '') {
      throw new Error('PINECONE_INDEX environment variable not set');
    }

    // Retrieve the list of indexes to check if expected index exists
    console.log("Listing indexes...");
    const indexes = (await pinecone.listIndexes())?.indexes;
    console.log("Available indexes:", indexes?.map(i => i.name));
    console.log("Looking for index:", indexName);
    
    if (!indexes) {
      throw new Error('Unable to retrieve indexes from Pinecone');
    }
    
    const indexExists = indexes.some(i => i.name === indexName);
    console.log("Index exists:", indexExists);
    
    if (!indexExists) {
      const availableIndexes = indexes.map(i => i.name).join(', ');
      throw new Error(`Index ${indexName} does not exist. Available indexes: ${availableIndexes}`);
    }

    // Get the Pinecone index
    console.log("Getting index:", indexName);
    const index = pinecone!.Index<Metadata>(indexName);
    console.log("Index retrieved successfully");

    // Get the namespace
    console.log("Getting namespace:", namespace);
    const pineconeNamespace = index.namespace(namespace ?? '');
    console.log("Namespace retrieved successfully");

    // Query the index with the defined request
    console.log("Querying index with vector of length:", embeddings.length);
    const queryResult = await pineconeNamespace.query({
      vector: embeddings,
      topK,
      includeMetadata: true,
    });
    console.log("Query result matches:", queryResult.matches?.length || 0);
    return queryResult.matches || [];
  } catch (e) {
    // Log the error and throw it
    console.log("Error querying embeddings: ", e);
    if (e instanceof Error && e.message.includes('UND_ERR_CONNECT_TIMEOUT')) {
      throw new Error('Unable to connect to Pinecone. Please check your network connection and try again.');
    }
    throw new Error(`Error querying embeddings: ${e}`);
  }
};

export { getMatchesFromEmbeddings };