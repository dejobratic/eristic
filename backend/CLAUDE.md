# CLAUDE.md - Backend Development Standards

## Code Layout And Usage Development Expectations (CLAUDE)

### 📁 Project Structure Standards

**Backend structure must follow Node.js/Express.js industry conventions** for maintainability and developer familiarity.

#### ✅ DO: Follow Node.js Folder Conventions

```
backend/src/
├── controllers/        # Route handlers and request/response logic
├── services/          # Business logic and core functionality  
├── providers/         # External service integrations (APIs, databases)
├── types/             # TypeScript type definitions and interfaces
├── routes/            # Route definitions and middleware setup
├── middleware/        # Express middleware (when needed)
├── config/            # Configuration management (when needed)
└── server.ts          # Application entry point
```

#### ❌ DON'T: Use Non-Standard Folder Names

```
backend/src/
├── interfaces/        # ❌ Use types/ instead (Node.js convention)
├── handlers/          # ❌ Use controllers/ instead
├── api/               # ❌ Too generic, use specific names
└── components/        # ❌ Frontend terminology, not backend
```

#### Standard Folder Purposes

| Folder | Purpose | Examples |
|--------|---------|----------|
| **controllers/** | Handle HTTP requests/responses, validate input, call services | `llm.controller.ts` |
| **services/** | Business logic, data processing, external integrations | `llm.service.ts` |
| **providers/** | External service implementations (APIs, databases) | `ollama.provider.ts` |
| **types/** | TypeScript interfaces, types, enums | `llm.types.ts` |
| **routes/** | Express route definitions and middleware | `llm.routes.ts` |
| **middleware/** | Express middleware functions | `auth.middleware.ts` |
| **config/** | Environment configuration, app settings | `database.config.ts` |

---

### 📄 File Organization Standards

**Use one file per class/interface** for better maintainability, testing, and performance.

#### ✅ DO: One File Per Concern

```typescript
// types/llm.types.ts - All LLM-related types
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  timestamp: Date;
}

// providers/base.provider.ts - Base provider interface
export interface LLMProvider {
  generateResponse(messages: LLMMessage[]): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

// providers/ollama.provider.ts - Specific implementation
export class OllamaProvider implements LLLProvider {
  // Implementation only
}
```

#### ❌ DON'T: Multiple Unrelated Concerns Per File

```typescript
// ❌ One file with everything mixed together
export interface LLMMessage { /* ... */ }
export interface APIResponse { /* ... */ }
export interface DatabaseConfig { /* ... */ }
export class OllamaProvider { /* ... */ }
export class AuthService { /* ... */ }
```

#### Benefits of Single File Per Concern

- **Better Tree-Shaking** - Bundlers can eliminate unused code
- **Easier Testing** - One test file per class/interface
- **Clearer Git History** - Changes isolated to specific functionality
- **IDE Performance** - Faster loading and navigation
- **Single Responsibility** - Each file has one clear purpose

---

### 📦 Project Module Imports

To ensure consistency, maintainability, and ease of navigation across the codebase, **always use aliased imports** when referencing internal modules and avoid relative paths.

#### ✅ DO: Use @eristic alias for internal modules

Use the `@eristic` alias for any modules under the `src` folder:

```typescript
import { LLMController } from '@eristic/controllers/llm.controller';
import { LLMService } from '@eristic/services/llm.service';
import { LLMMessage, LLMResponse } from '@eristic/types/llm.types';
import { APIResponse } from '@eristic/types/api.types';
import { OllamaProvider } from '@eristic/providers/ollama.provider';
```

#### Alias Configuration

The `@eristic` alias is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@eristic/*": ["*"]
    }
  }
}
```

This configuration allows importing from any location within `src/`:
- `@eristic/controllers/*` → `src/controllers/*`
- `@eristic/services/*` → `src/services/*`
- `@eristic/types/*` → `src/types/*`
- `@eristic/providers/*` → `src/providers/*`

**Benefits:**
- **Consistency** - All internal imports use the same pattern
- **Maintainability** - Easy to refactor folder structures  
- **Readability** - Clear distinction between external and internal modules
- **IDE Support** - Full autocompletion and navigation

#### ❌ DON'T: Use relative paths or generic imports

```typescript
// ❌ Relative imports
import { LLMService } from '../services/llm.service';
import { APIResponse } from '../../types/api.types';

// ❌ Too generic or confusing
import * as Types from '@eristic/types';
import { everything } from '@eristic/utils';
```

---

### 📋 Import Sorting Standards

**Import statements must be sorted alphabetically and grouped logically** with blank lines between groups for optimal readability.

#### ✅ DO: Proper Import Grouping and Sorting

```typescript
// 1. Special imports (dotenv, etc.)
import 'dotenv/config';

// 2. Internal project imports (@eristic) - sorted alphabetically
import { LLMController } from '@eristic/controllers/llm.controller';
import { LLMService } from '@eristic/services/llm.service';
import { APIResponse } from '@eristic/types/api.types';
import { LLMMessage } from '@eristic/types/llm.types';

// 3. External library imports - sorted alphabetically
import cors from 'cors';
import express from 'express';
```

#### Grouping Order for Node.js

1. **Special imports** - `dotenv/config`, etc.
2. **Internal project imports** - `@eristic/*` (sorted alphabetically)
3. **External library imports** - npm packages (sorted alphabetically)
4. **Node.js built-in modules** - `fs`, `path`, etc. (if used)

#### Example: Complete File Import Section

```typescript
import 'dotenv/config';

import { LLMController } from '@eristic/controllers/llm.controller';
import { OllamaProvider } from '@eristic/providers/ollama.provider';
import { LLMService } from '@eristic/services/llm.service';
import { APIResponse } from '@eristic/types/api.types';
import { LLMConfig, LLMMessage } from '@eristic/types/llm.types';

import cors from 'cors';
import express, { Request, Response } from 'express';
```

#### Benefits of Proper Import Sorting

- **Consistency** - All files follow the same pattern
- **Readability** - Easy to scan and find specific imports
- **Maintainability** - Clear separation of internal vs external dependencies
- **Code Reviews** - Easier to spot missing or unnecessary imports
- **IDE Support** - Many IDEs can auto-sort imports following these rules

---

### 🎯 Service Architecture Standards

**Follow layered architecture with clear separation of concerns** for scalable and testable code.

#### Controller → Service → Provider Pattern

```typescript
// controllers/llm.controller.ts - Handle HTTP requests
export class LLMController {
  constructor(private llmService: LLMService) {}
  
  async generateTopic(req: Request, res: Response) {
    try {
      const result = await this.llmService.generateTopicResponse(req.body.topic);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// services/llm.service.ts - Business logic
export class LLMService {
  constructor(private provider: LLMProvider) {}
  
  async generateTopicResponse(topic: string): Promise<LLMResponse> {
    // Business logic, validation, processing
    const messages = this.buildTopicMessages(topic);
    return await this.provider.generateResponse(messages);
  }
}

// providers/ollama.provider.ts - External service integration
export class OllamaProvider implements LLMProvider {
  async generateResponse(messages: LLMMessage[]): Promise<LLMResponse> {
    // External API calls only
    return await this.callOllamaAPI(messages);
  }
}
```

#### Layer Responsibilities

| Layer | Responsibilities | Should NOT Do |
|-------|------------------|---------------|
| **Controllers** | Handle HTTP, validate requests, format responses | Business logic, external API calls |
| **Services** | Business logic, data processing, orchestration | HTTP handling, direct external calls |
| **Providers** | External API integration, data source abstraction | Business logic, HTTP responses |

---

### 🔧 TypeScript Standards

**Use proper TypeScript practices** for type safety and developer experience.

#### ✅ DO: Proper Type Organization

```typescript
// types/llm.types.ts - Domain-specific types
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// types/api.types.ts - API-specific types  
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}
```

#### ✅ DO: Use Branded Types for IDs

```typescript
// types/common.types.ts
export type UserID = string & { readonly brand: unique symbol };
export type TopicID = string & { readonly brand: unique symbol };

// This prevents accidentally mixing ID types
function getUser(id: UserID) { /* ... */ }
function getTopic(id: TopicID) { /* ... */ }
```

---

### 🧪 Testing Standards

**Organize tests to mirror the source structure** for easy navigation and maintenance.

#### Test File Organization

```
src/
├── controllers/
│   └── llm.controller.ts
├── services/  
│   └── llm.service.ts
└── providers/
    └── ollama.provider.ts

tests/
├── controllers/
│   └── llm.controller.test.ts
├── services/
│   └── llm.service.test.ts  
└── providers/
    └── ollama.provider.test.ts
```

#### Benefits of Mirrored Structure

- **Easy Navigation** - Test files easy to find
- **Clear Scope** - One test file per source file
- **Maintainability** - Changes to source require obvious test updates
- **IDE Support** - Many IDEs can auto-navigate between source and tests

---

### 📈 Scalability Considerations

**Design for growth** by following patterns that scale well with team size and feature complexity.

#### ✅ DO: Feature-Based Growth Pattern

As the application grows, consider feature-based organization:

```
src/
├── auth/
│   ├── controllers/
│   ├── services/
│   ├── types/
│   └── routes/
├── llm/
│   ├── controllers/
│   ├── services/ 
│   ├── providers/
│   ├── types/
│   └── routes/
└── users/
    ├── controllers/
    ├── services/
    ├── types/
    └── routes/
```

This allows teams to work on features independently with minimal conflicts.

**Rationale**: Following established Node.js patterns ensures code is maintainable, testable, and familiar to other developers. The single-file-per-concern approach improves performance, git history, and makes the codebase easier to navigate as it grows.