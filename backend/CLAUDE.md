# CLAUDE.md - Backend Development Standards

## Code Layout And Usage Development Expectations (CLAUDE)

### 📁 Project Structure Standards

**Backend structure must follow Node.js/Express.js industry conventions** for maintainability and developer familiarity.

#### ✅ DO: Follow Clean Architecture Conventions

```
backend/src/
├── api/               # API layer - handles HTTP requests/responses
│   ├── controllers/   # Route handlers and request/response logic
│   ├── routes/        # Route definitions and middleware setup
│   └── middleware/    # Express middleware (when needed)
├── app/               # Application layer - business logic
│   ├── services/      # Business logic and core functionality
│   └── types/         # TypeScript type definitions and interfaces  
├── infrastructure/    # Infrastructure layer - external concerns
│   ├── database/      # Database repositories and connections
│   └── providers/     # External service integrations (APIs)
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

#### Clean Architecture Layer Purposes

| Layer/Folder | Purpose | Examples |
|--------------|---------|----------|
| **api/controllers/** | Handle HTTP requests/responses, validate input, call services | `llm.controller.ts` |
| **api/routes/** | Express route definitions and middleware | `llm.routes.ts` |
| **api/middleware/** | Express middleware functions | `auth.middleware.ts` |
| **app/services/** | Business logic, data processing, orchestration | `llm.service.ts` |
| **app/types/** | TypeScript interfaces, types, enums | `llm.types.ts`, `api.types.ts` |
| **infrastructure/providers/** | External service implementations (APIs) | `ollama.provider.ts` |
| **infrastructure/database/** | Database repositories, connections, migrations | `sqlite-topic.repository.ts` |
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

Use the `@eristic` alias for any modules under the `src` folder following clean architecture:

```typescript
import { LLMController } from '@eristic/api/controllers/llm.controller';
import { LLMService } from '@eristic/app/services/llm.service';
import { LLMMessage, LLMResponse } from '@eristic/app/types/llm.types';
import { APIResponse } from '@eristic/app/types/api.types';
import { OllamaProvider } from '@eristic/infrastructure/providers/ollama.provider';
import { TopicRepository } from '@eristic/infrastructure/database/repositories';
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
- `@eristic/api/controllers/*` → `src/api/controllers/*`
- `@eristic/api/routes/*` → `src/api/routes/*`
- `@eristic/app/services/*` → `src/app/services/*`
- `@eristic/app/types/*` → `src/app/types/*`
- `@eristic/infrastructure/providers/*` → `src/infrastructure/providers/*`
- `@eristic/infrastructure/database/*` → `src/infrastructure/database/*`

**Benefits:**
- **Consistency** - All internal imports use the same pattern
- **Maintainability** - Easy to refactor folder structures  
- **Readability** - Clear distinction between external and internal modules
- **IDE Support** - Full autocompletion and navigation

#### ❌ DON'T: Use relative paths or generic imports

```typescript
// ❌ Relative imports
import { LLMService } from '../app/services/llm.service';
import { APIResponse } from '../../app/types/api.types';

// ❌ Too generic or confusing
import * as Types from '@eristic/app/types';
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
import { LLMController } from '@eristic/api/controllers/llm.controller';
import { LLMService } from '@eristic/app/services/llm.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { LLMMessage } from '@eristic/app/types/llm.types';

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

import { LLMController } from '@eristic/api/controllers/llm.controller';
import { LLMService } from '@eristic/app/services/llm.service';
import { APIResponse } from '@eristic/app/types/api.types';
import { LLMConfig, LLMMessage } from '@eristic/app/types/llm.types';
import { OllamaProvider } from '@eristic/infrastructure/providers/ollama.provider';

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
// api/controllers/llm.controller.ts - Handle HTTP requests
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

// app/services/llm.service.ts - Business logic
export class LLMService {
  constructor(private provider: LLMProvider) {}
  
  async generateTopicResponse(topic: string): Promise<LLMResponse> {
    // Business logic, validation, processing
    const messages = this.buildTopicMessages(topic);
    return await this.provider.generateResponse(messages);
  }
}

// infrastructure/providers/ollama.provider.ts - External service integration
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
| **API (Controllers)** | Handle HTTP, validate requests, format responses | Business logic, external API calls |
| **App (Services)** | Business logic, data processing, orchestration | HTTP handling, direct external calls |
| **Infrastructure (Providers)** | External API integration, data source abstraction | Business logic, HTTP responses |

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

---

### 💾 Database Architecture Standards

**Use SQLite with repository pattern** for data persistence, providing clean abstraction and easy migration path to other databases.

#### ✅ Database Folder Structure

```
backend/src/database/
├── repositories/
│   ├── base.repository.ts          # Abstract repository interface
│   ├── sqlite-debate.repository.ts # SQLite implementation
│   └── index.ts                    # Repository exports
├── migrations/
│   ├── 001_initial_schema.sql      # Database schema definitions
│   └── migration-runner.ts         # Migration execution logic
├── connection/
│   ├── sqlite-connection.ts        # Database connection management
│   └── connection-manager.ts       # Connection lifecycle (future)
├── scripts/
│   ├── init-database.ts            # Database initialization
│   ├── migrate-from-localstorage.ts # Data migration utilities
│   └── backup-database.ts          # Backup utilities
└── seeds/
    └── sample-topics.sql           # Development test data
```

#### Repository Pattern Implementation

```typescript
// ✅ Abstract repository interface (database-agnostic)
export abstract class DebateRepository {
  // Current single-topic methods
  abstract saveTopic(name: string, response: LLMResponse): Promise<void>;
  abstract getTopic(name: string): Promise<TopicItem | null>;
  abstract getAllTopics(): Promise<TopicItem[]>;
  
  // Future multi-LLM debate methods
  abstract createDebate(topic: string, participants: DebateParticipant[]): Promise<Debate>;
  abstract addResponse(debateId: string, roundNumber: number, response: LLMResponse): Promise<void>;
  abstract getDebateHistory(debateId: string): Promise<Round[]>;
  
  // Database lifecycle
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
  abstract backup(): Promise<string>;
}

// ✅ SQLite implementation
export class SQLiteDebateRepository extends DebateRepository {
  private db = SQLiteConnection.getInstance();
  // Implementation details...
}
```

#### Service Integration Pattern

```typescript
// ✅ Controllers use repository for data persistence
export class LLMController {
  constructor(
    private llmService: LLMService,
    private repository: DebateRepository  // Injected repository
  ) {}
  
  async generateTopicResponse(req: Request, res: Response): Promise<void> {
    const topicName = req.body.topic.trim();
    
    // Check cache first
    const existingTopic = await this.repository.getTopic(topicName);
    if (existingTopic?.llmResponse) {
      return res.json({ success: true, data: existingTopic.llmResponse });
    }
    
    // Generate and save new response
    const response = await this.llmService.generateTopicResponse(topicName);
    await this.repository.saveTopic(topicName, response);
    
    res.json({ success: true, data: response });
  }
}
```

#### Database Scripts & Commands

```json
// package.json scripts for database management
{
  "scripts": {
    "db:init": "Initialize database and run migrations",
    "db:migrate": "Run pending migrations",
    "db:seed": "Load development test data",
    "db:backup": "Create database backup",
    "db:migrate-localstorage": "Migrate data from localStorage"
  }
}
```

#### Migration Management

```sql
-- migrations/001_initial_schema.sql
-- Clean, versioned SQL migrations
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  llm_response TEXT,               -- JSON serialized LLMResponse
  model TEXT,
  timestamp DATETIME,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  has_requested_response INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);
CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(updated_at);

-- Track applied migrations
INSERT OR REPLACE INTO migrations (id, name) VALUES ('001', '001_initial_schema.sql');
```

#### Environment Configuration

```typescript
// ✅ Environment-specific database paths
const DB_PATHS = {
  development: './database/eristic-dev.db',
  test: './database/eristic-test.db', 
  production: './database/eristic.db'
};

// ✅ Database optimization settings
db.pragma('foreign_keys = ON');      // Enable referential integrity
db.pragma('journal_mode = WAL');     // Better concurrency
db.pragma('synchronous = NORMAL');   // Balanced durability/performance
```

#### Benefits of Repository Pattern

- **Database Agnostic** - Easy migration to PostgreSQL/MongoDB when needed
- **Clean Testing** - Mock repository for unit tests
- **Consistent Interface** - Same methods work across different databases
- **Future-Proof** - Schema ready for multi-LLM debate features
- **Performance** - Built-in caching and connection pooling
- **Reliability** - ACID compliance and proper error handling

#### Development Workflow

```bash
# Initialize new development environment
npm run db:init

# Create new migration
touch src/database/migrations/002_add_feature.sql

# Apply migrations
npm run db:migrate

# Backup database
npm run db:backup

# Migrate existing localStorage data
npm run db:migrate-localstorage ./path/to/localstorage-export.json
```

#### File Organization Standards

- **One migration per file** - Sequential numbering (001_, 002_, etc.)
- **SQL files for schema** - Pure SQL in migration files
- **TypeScript for logic** - Migration runner and scripts in TypeScript
- **Version control friendly** - Text-based SQL files easy to review

**Rationale**: Repository pattern with SQLite provides immediate persistence without infrastructure complexity, while maintaining clean architecture for future database migrations. The folder structure separates concerns clearly and makes the system easy to maintain and extend.