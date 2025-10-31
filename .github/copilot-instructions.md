# Copilot Instructions for Olymarket

This file provides context and guidelines for GitHub Copilot when working on the Olymarket project.

## Project Overview

Olymarket is a hyper-local marketplace platform exclusively for residents of Olydorf (Olympic Village, Munich). It enables neighbors to buy, sell, and give away second-hand items within their community, fostering sustainability and local connections.

## Repository Structure

This is a monorepo containing two main applications:

```
/api        - Backend API service (Node.js, Express, TypeORM, PostgreSQL)
/frontend   - React web application (React, Vite, Tailwind CSS)
```

## Technology Stack

### Backend (API)
- **Runtime**: Node.js with TypeScript (CommonJS)
- **Framework**: Express.js
- **ORM**: TypeORM with PostgreSQL
- **Authentication**: JWT with bcryptjs
- **Validation**: class-validator and class-transformer
- **Development**: ts-node-dev for hot reload

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS
- **Module System**: ES Modules

### Database
- **Database**: PostgreSQL 15
- **Management**: Docker Compose for local development
- **Migrations**: TypeORM migrations

## Coding Conventions

### TypeScript
- Use strict TypeScript settings
- Enable experimental decorators for TypeORM entities
- Prefer explicit types over implicit `any`
- Use type imports with `import type` when importing only types

### Backend Code Patterns

#### Entities
- All entities extend `BaseModel` which provides `id`, `createdAt`, and `updatedAt`
- Use TypeORM decorators: `@Entity`, `@Column`, `@OneToMany`, `@ManyToOne`
- Use snake_case for database column names with `name` property
- Define relationships with proper decorators
- Example:
  ```typescript
  @Entity({ name: "users" })
  export class User extends BaseModel {
    @Column({ length: 255 })
    email!: string;
    
    @Column({ name: "password_hash", select: false })
    passwordHash!: string;
  }
  ```

#### Routes
- Routes are organized by feature in `/api/src/routes/`
- Use Express Router for each feature
- Apply middleware for authentication and authorization
- Structure: `routes/[feature].ts`

#### DTOs
- Use Data Transfer Objects for request/response validation
- Apply class-validator decorators
- Located in `/api/src/dtos/`

#### Middleware
- Authentication middleware validates JWT tokens
- Authorization middleware checks user roles and permissions
- Located in `/api/src/middleware/`

### Frontend Code Patterns

#### Components
- Use functional components with TypeScript
- Define prop types with TypeScript interfaces/types
- Use `type FC` from React for component definitions
- Example:
  ```typescript
  import type { FC } from 'react'
  
  type Props = {
    title: string
  }
  
  const Component: FC<Props> = ({ title }) => {
    return <div>{title}</div>
  }
  ```

#### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Common patterns: `className="flex items-center justify-between"`

#### Formatting
- Use `Intl.NumberFormat` for currency formatting (EUR)
- Use `Intl.DateTimeFormat` for date formatting
- Example:
  ```typescript
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
  ```

#### Services
- API calls are organized in `/frontend/src/services/`
- Use async/await for API requests
- Handle errors appropriately

## Development Workflow

### Setting Up Development Environment

1. **Start PostgreSQL**:
   ```bash
   docker compose up -d db
   ```

2. **Configure API**:
   ```bash
   cp api/.env.example api/.env
   # Edit .env if needed
   ```

3. **Install and Run API**:
   ```bash
   cd api
   npm install
   npm run migration:run
   npm run dev
   ```

4. **Install and Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Build Commands

#### API
- Development: `npm run dev`
- Build: `npm run build`
- Start production: `npm run start`
- TypeORM: `npm run typeorm`
- Run migrations: `npm run migration:run`

#### Frontend
- Development: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`

## Database Management

### Migrations
- TypeORM migrations are stored in `/api/src/migrations/`
- Generate new migration: `npm run migration:generate -- src/migrations/MigrationName`
- Run migrations: `npm run migration:run`
- Always build TypeScript before running TypeORM commands

### Connection
- Database connection is configured in `/api/src/data-source.ts`
- Configuration is loaded from environment variables
- Default credentials (local dev):
  - Host: localhost:5432
  - Database: olymarket
  - User: olymarket
  - Password: olymarket

## Security Considerations

### Authentication
- JWT tokens are used for authentication
- Passwords are hashed using bcryptjs
- Password hashes are excluded from queries by default (`select: false`)
- JWT secret is stored in environment variable `JWT_SECRET`

### Authorization
- User roles: `user` and `admin`
- Admin endpoints are protected with role checks
- User banning system is implemented with `isBanned`, `bannedAt`, and `banReason` fields

### Best Practices
- Never commit secrets or credentials to the repository
- Always validate user input with class-validator
- Use parameterized queries (TypeORM handles this)
- Sanitize user-generated content before displaying

## Features and Domain Model

### Core Entities
- **User**: Represents community members with authentication
- **Listing**: Items posted for sale or giveaway
- **ListingCategory**: Categories for organizing listings
- **Conversation**: Message threads between users
- **ConversationParticipant**: Links users to conversations
- **Message**: Individual messages in conversations

### Key Features
1. **Authentication**: Email/password registration and login
2. **Listings**: Create, view, edit, delete marketplace items
3. **Categories**: Filter listings by category
4. **Messaging**: Direct communication between users
5. **User Profiles**: View and edit user information
6. **Admin Panel**: User management and moderation

## Testing

- No test infrastructure is currently set up
- When adding tests, follow the existing project structure
- Backend tests should go in `/api/test/`
- Frontend tests should go in `/frontend/src/__tests__/` or co-located with components

## Common Tasks

### Adding a New API Endpoint
1. Define DTOs in `/api/src/dtos/`
2. Add route handler in `/api/src/routes/[feature].ts`
3. Register route in `/api/src/app.ts`
4. Add TypeORM entity if needed in `/api/src/entities/`
5. Create migration if database schema changes

### Adding a New Frontend Page
1. Create page component in `/frontend/src/pages/`
2. Add route in `/frontend/src/App.tsx`
3. Create supporting components in `/frontend/src/components/`
4. Add API service calls in `/frontend/src/services/`

### Database Schema Changes
1. Modify entity in `/api/src/entities/`
2. Generate migration: `cd api && npm run build && npm run migration:generate -- src/migrations/DescriptiveName`
3. Review generated migration
4. Run migration: `npm run migration:run`

## Code Style Notes

- Use 2-space indentation (both API and frontend)
- Use semicolons
- Prefer const over let when possible
- Use template literals for string interpolation
- Use async/await over promise chains
- Handle errors with try/catch blocks

## File Naming Conventions

- Backend: `PascalCase.ts` for entities, `camelCase.ts` for routes and utilities
- Frontend: `PascalCase.tsx` for React components, `camelCase.ts` for utilities and services
- Use descriptive names that reflect the file's purpose

## When Making Changes

1. Understand the existing patterns before adding new code
2. Keep the monorepo structure in mind (API vs frontend)
3. Update migrations when changing database schema
4. Ensure TypeScript compiles without errors
5. Follow the established naming conventions
6. Consider authentication and authorization requirements
7. Test changes with the local development setup
