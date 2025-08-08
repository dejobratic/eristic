# Eristic LLM Integration Setup

This guide will help you set up and run the Eristic application with LLM integration via Ollama.

## Prerequisites

1. **Node.js and npm**
   - Node.js ≥ 18.0.0
   - npm ≥ 9.0.0

2. **Ollama Installation**
   - Download and install from [ollama.ai](https://ollama.ai)
   - Or using Homebrew: `brew install ollama`

## Step 1: Install Dependencies

From the project root:

```bash
# Install all dependencies for both frontend and backend
npm run install:all

# Or install separately:
npm run frontend:install
npm run backend:install
```

## Step 2: Set Up Ollama

1. **Start Ollama service**:
   ```bash
   ollama serve
   ```

2. **Pull a model** (in a new terminal):
   ```bash
   # For a smaller model (recommended for development)
   ollama pull llama3.2:1b

   # Or for better responses (requires more RAM)
   ollama pull llama3.2
   ```

3. **Verify installation**:
   ```bash
   ollama list
   curl http://localhost:11434/api/tags
   ```

## Step 3: Configure Backend

1. **Create environment file**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` file** (optional, defaults should work):
   ```bash
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:4200

   # LLM Provider Configuration
   LLM_PROVIDER=ollama
   LLM_BASE_URL=http://localhost:11434
   LLM_MODEL=llama3.2:1b
   LLM_TEMPERATURE=0.7
   LLM_MAX_TOKENS=2048
   ```

## Step 4: Build Backend

```bash
npm run backend:build
```

## Step 5: Start the Application

### Option 1: Run Everything Together (Recommended)

```bash
npm run dev:all
```

This will start both the frontend (Angular dev server) and backend (Express API) concurrently.

### Option 2: Run Separately

In terminal 1 (Backend):
```bash
npm run backend:dev
```

In terminal 2 (Frontend):
```bash
npm run frontend:dev
```

## Step 6: Test the Integration

1. **Open your browser** to `http://localhost:4200`

2. **Create a new topic** by entering a topic name (e.g., "Machine Learning")

3. **Click on the topic** to view the topic details page

4. **Wait for the LLM response** - you should see:
   - A loading spinner while the response is being generated
   - The LLM's response about the topic
   - Metadata showing the model used and token counts

## Troubleshooting

### Backend Won't Start

1. **Check if port 3001 is available**:
   ```bash
   lsof -i :3001
   ```

2. **Change port if needed** in `backend/.env`:
   ```bash
   PORT=3002
   ```

### Ollama Connection Issues

1. **Verify Ollama is running**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Check available models**:
   ```bash
   ollama list
   ```

3. **Check backend logs** for specific error messages

### Frontend Can't Connect to Backend

1. **Verify backend is running** on correct port

2. **Check CORS configuration** in `backend/src/server.ts`

3. **Check environment variables** in frontend

### LLM Responses Are Slow

1. **Use a smaller model**:
   ```bash
   ollama pull llama3.2:1b
   ```

2. **Reduce max tokens** in backend `.env`:
   ```bash
   LLM_MAX_TOKENS=1024
   ```

### Out of Memory Errors

1. **Use a smaller model** like `llama3.2:1b`
2. **Close other applications** to free up RAM
3. **Reduce concurrent requests**

## Development Workflow

1. **Make changes** to frontend or backend code
2. **Hot reload** is enabled for both services
3. **Check browser console** and terminal logs for errors
4. **Test LLM integration** by creating new topics

## API Testing

You can also test the backend API directly:

```bash
# Check backend health
curl http://localhost:3001/health

# Check LLM status  
curl http://localhost:3001/api/llm/status

# Generate topic response
curl -X POST http://localhost:3001/api/llm/topic \
  -H "Content-Type: application/json" \
  -d '{"topic": "Artificial Intelligence"}'
```

## Next Steps

- Try different Ollama models (`llama3.2`, `mistral`, `codellama`)
- Experiment with different temperature and token settings
- Add custom prompts for different topic types
- Implement streaming responses for real-time generation

## Architecture Overview

```
Frontend (Angular)     Backend (Express)      Ollama
     |                       |                  |
     |-- HTTP Request -----> |                  |
     |                       |-- Ollama API -> |
     |                       |<-- Response --- |
     |<-- LLM Response ----- |                  |
```

The integration provides:

- **Generic LLM Interface**: Easy to add other providers (OpenAI, Claude, etc.)
- **Type Safety**: Full TypeScript support throughout
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Responsive Design**: Works on both desktop and mobile devices
- **Theme Support**: Integrated with the existing light/dark theme system