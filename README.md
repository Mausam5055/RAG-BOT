# RAG Chatbot - PDF Document Assistant

A React-based chatbot application that allows users to upload PDF documents and ask questions about their content using Retrieval Augmented Generation (RAG) with Google Gemini and Pinecone.

## Features

- Upload PDF documents
- Ask questions about document content
- Get AI-powered answers with context snippets
- Clean, responsive UI with dark/light mode

## Deployment to Vercel

This application can be deployed to Vercel as a React app with a serverless backend.

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. API keys for:
   - Google Gemini
   - Pinecone

### Environment Variables

Set these environment variables in your Vercel project settings:

```
GEMINI_API_KEY=your_google_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_CLOUD=your_pinecone_cloud
PINECONE_REGION=your_pinecone_region
PINECONE_INDEX=your_pinecone_index_name
```

### Deployment Steps

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
6. Add the environment variables listed above
7. Deploy!

The application will automatically build and deploy. Vercel will provide you with a URL to access your deployed application.

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with your API keys
4. Start the development server: `npm run dev`
5. Visit `http://localhost:5000` in your browser

## Technologies Used

- React with TypeScript
- Vite for building
- Express.js for backend API
- Google Gemini for AI processing
- Pinecone for vector storage
- Tailwind CSS for styling
