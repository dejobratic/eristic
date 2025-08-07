# Eristic Backend

The backend API for the Eristic application.

## Status: Not Implemented Yet

This folder is prepared for future backend development.

## Planned Features

- RESTful API endpoints for topic management
- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization  
- Topic collaboration features
- Real-time updates via WebSockets

## Planned Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js or Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM or MongoDB with Mongoose
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod or Joi
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI/Swagger

## Future Development Commands

Once implemented, you'll be able to use:

```bash
# From project root
npm run backend:dev      # Start development server
npm run backend:build    # Build for production
npm run backend:test     # Run tests

# Or from backend folder
npm run dev             # Start development server
npm run build           # Build for production  
npm run test            # Run tests
```

## API Design (Planned)

### Endpoints

```
GET    /api/topics              # Get all topics
POST   /api/topics              # Create new topic
GET    /api/topics/:id          # Get specific topic
PUT    /api/topics/:id          # Update topic
DELETE /api/topics/:id          # Delete topic

GET    /api/users/:id/topics    # Get user's topics
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
```

### Database Schema (Planned)

```sql
-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```