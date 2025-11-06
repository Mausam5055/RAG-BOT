# Deployment Guide for Vercel

This guide will help you deploy your React RAG Chatbot application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. Git repository (GitHub, GitLab, or Bitbucket)
3. API keys for:
   - Google Gemini
   - Pinecone

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is pushed to a Git repository. The repository should contain all the files including:

- `package.json`
- `vercel.json`
- `server/` directory
- `client/` directory

### 2. Import Project to Vercel

1. Log in to your Vercel account
2. Click "New Project"
3. Import your Git repository
4. Vercel should automatically detect the project settings

### 3. Configure Project Settings

Vercel should automatically detect these settings, but if not, configure them manually:

- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 4. Set Environment Variables

In the Vercel project settings, go to the "Environment Variables" section and add these variables:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSyB4Gz...` |
| `PINECONE_API_KEY` | Pinecone API Key | `abc123...` |
| `PINECONE_CLOUD` | Pinecone Cloud Provider | `aws` |
| `PINECONE_REGION` | Pinecone Region | `us-west-2` |
| `PINECONE_INDEX` | Pinecone Index Name | `rag-chatbot-index` |

### 5. Deploy

Click "Deploy" and wait for the build process to complete. Vercel will provide you with a URL to access your deployed application.

## Troubleshooting

### Build Issues

If you encounter build issues, try:

1. Clearing the build cache in Vercel project settings
2. Checking that all dependencies are correctly listed in `package.json`
3. Ensuring the build command runs successfully locally with `npm run build`

### Runtime Issues

If the application deploys but doesn't work correctly:

1. Check the Vercel logs for error messages
2. Verify all environment variables are set correctly
3. Ensure your Pinecone index is created and accessible
4. Check that your Google Gemini API key has the necessary permissions

## Custom Domain

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to the "Domains" section
3. Add your custom domain
4. Follow the DNS configuration instructions provided by Vercel

## Environment-Specific Configuration

The application is configured to work in both development and production environments:

- In development: Uses Vite development server with hot reloading
- In production: Serves static files from the build directory

The `vercel.json` file configures the serverless deployment for Vercel.