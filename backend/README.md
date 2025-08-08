# Eristic Backend

Backend API service for Eristic with integrated LLM support via Ollama.

## Features

- **Generic LLM Integration**: Supports multiple LLM providers with a unified interface
- **Ollama Provider**: Built-in support for local Ollama models
- **RESTful API**: Clean API endpoints for LLM interactions
- **TypeScript**: Full TypeScript support with type safety
- **Extensible Architecture**: Easy to add new LLM providers

## Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- [Ollama](https://ollama.ai) installed and running locally

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

4. **Pull a Model** (e.g., Llama 2)
   ```bash
   ollama pull llama2
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### LLM Endpoints

- `POST /api/llm/topic` - Generate response for a topic
- `POST /api/llm/chat` - Generate response with message history
- `GET /api/llm/status` - Check LLM provider status
- `GET /api/llm/models` - Get available models

### Health Check

- `GET /health` - Health check endpoint

## Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

# LLM Provider Configuration
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llama2
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
```

## Adding New LLM Providers

1. **Create Provider Class**
   ```typescript
   // src/providers/your-provider.provider.ts
   import { LLMProvider } from '../interfaces/llm-provider.interface';
   
   export class YourProvider implements LLMProvider {
     // Implement interface methods
   }
   ```

2. **Register in LLM Service**
   ```typescript
   // src/services/llm.service.ts
   case 'your-provider':
     return new YourProvider(config);
   ```

3. **Configure Environment**
   ```bash
   LLM_PROVIDER=your-provider
   YOUR_PROVIDER_API_KEY=your_api_key
   ```

## Project Structure

```
backend/
├── src/
│   ├── interfaces/
│   │   └── llm-provider.interface.ts
│   ├── providers/
│   │   └── ollama.provider.ts
│   ├── services/
│   │   └── llm.service.ts
│   ├── routes/
│   │   └── llm.routes.ts
│   └── server.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run clean` - Clean build directory

## Troubleshooting

### Ollama Connection Issues

1. **Check if Ollama is running**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Verify model is installed**:
   ```bash
   ollama list
   ```

3. **Pull required model**:
   ```bash
   ollama pull llama2
   ```

### CORS Issues

Make sure `FRONTEND_URL` in your `.env` file matches your frontend URL.

### Port Conflicts

Change the `PORT` environment variable if 3001 is already in use.