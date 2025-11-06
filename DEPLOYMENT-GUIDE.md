# Deployment Guide: Frontend on Vercel, Backend on Render

This guide explains how to deploy your RAG Chatbot application with the frontend on Vercel and the backend on Render.

## Prerequisites

1. Accounts:
   - [Vercel](https://vercel.com) account
   - [Render](https://render.com) account
2. Git repository (GitHub, GitLab, or Bitbucket)
3. API keys:
   - Google Gemini API Key
   - Pinecone API Key, Cloud, Region, and Index Name

## Deploying the Backend to Render

1. Push your code to a Git repository
2. Log in to Render Dashboard
3. Click "New+" and select "Web Service"
4. Connect your Git repository
5. Configure the service:
   - Name: `rag-chatbot-backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables:
   - `GEMINI_API_KEY` = your Google Gemini API key
   - `PINECONE_API_KEY` = your Pinecone API key
   - `PINECONE_CLOUD` = your Pinecone cloud provider
   - `PINECONE_REGION` = your Pinecone region
   - `PINECONE_INDEX` = your Pinecone index name
7. Click "Create Web Service"

Render will provide you with a URL for your backend (e.g., `https://rag-chatbot-backend.onrender.com`).

## Deploying the Frontend to Vercel

1. Create a new repository with only the frontend code (or use the same repository)
2. Log in to Vercel Dashboard
3. Click "New Project"
4. Import your Git repository
5. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables:
   - `VITE_BACKEND_URL` = your Render backend URL (e.g., `https://rag-chatbot-backend.onrender.com`)
7. Deploy!

## Local Development

1. Create a `.env.local` file based on `.env.local.example`:
   ```
   VITE_BACKEND_URL=
   GEMINI_API_KEY=your_google_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_CLOUD=your_pinecone_cloud
   PINECONE_REGION=your_pinecone_region
   PINECONE_INDEX=your_pinecone_index_name
   ```
2. For local development, keep `VITE_BACKEND_URL` empty to use relative paths
3. Run `npm run dev` to start the development server

## Notes

- The frontend will make API calls to the backend URL specified in `VITE_BACKEND_URL`
- In local development, API calls will be made to relative paths (handled by the same server)
- In production, API calls will be made to your Render backend URL
- Render automatically provides SSL for your backend
- Vercel automatically provides SSL for your frontend