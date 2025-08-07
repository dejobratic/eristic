# Eristic

A full-stack application for thoughtful topic exploration and discussion.

## Project Structure

```
eristic/
├── frontend/          # Angular frontend application
├── backend/           # Backend API (coming soon)
├── package.json       # Root package scripts
└── README.md         # This file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

### Development

#### Frontend Only (Current)
```bash
npm run dev
# or
npm run frontend:dev
```

#### Full Stack (Future)
```bash
npm run dev:all
```

### Build

```bash
npm run build
# or
npm run frontend:build
```

### Available Scripts

#### Root Level Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run test` - Run frontend tests
- `npm run lint` - Run frontend linting
- `npm run install:all` - Install all dependencies (frontend + backend)
- `npm run dev:all` - Run both frontend and backend in development mode

#### Frontend Specific
- `npm run frontend:dev` - Start Angular development server
- `npm run frontend:build` - Build Angular app
- `npm run frontend:test` - Run Angular tests
- `npm run frontend:lint` - Run Angular linting
- `npm run frontend:install` - Install frontend dependencies

#### Backend Specific (Coming Soon)
- `npm run backend:dev` - Start backend development server
- `npm run backend:build` - Build backend
- `npm run backend:install` - Install backend dependencies

## Features

### Current (Frontend)
- Topic exploration interface
- Topic history with delete and rename functionality
- Responsive side panel navigation
- Clean, organized component structure

### Planned (Backend)
- RESTful API for topic management
- Database persistence
- User authentication
- Topic collaboration features

## Technology Stack

### Frontend
- **Framework**: Angular 20+
- **Language**: TypeScript
- **Styling**: CSS3
- **Build Tool**: Angular CLI + Vite

### Backend (Planned)
- **Runtime**: Node.js
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL or MongoDB
- **Language**: TypeScript

## Development Guidelines

- Frontend components are organized in `/src/app/components/`
- Pages are organized in `/src/app/pages/`
- Services are organized in `/src/app/services/`
- Follow Angular style guide conventions
- Use semantic commit messages