# Vibe Coding Dashboard

## Overview

This is a full-stack TypeScript application called "Vibe Coding" - an integrated dashboard designed for student growth and development. The platform combines journaling, peer recognition (Token Game), sales/lead management (Sales Machine), and AI-powered problem-solving (Crack Time) into a unified experience. The design philosophy emphasizes premium UX with glassmorphism aesthetics, smooth animations, and a focus on expanding thinking and driving behavioral change.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Animations**: Framer Motion for smooth transitions
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build System**: Vite for frontend, esbuild for server bundling
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod schemas
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push`

### Core Data Models
- **Users**: Authentication and profile data (Replit Auth integration)
- **Sessions**: Session storage for authentication
- **Journals**: User journal entries with categories (tech, business, retrospective)
- **Tokens**: Peer recognition tokens between users
- **Leads**: CRM/sales pipeline management
- **Folders**: Organization structure for content
- **Conversations/Messages**: AI chat history storage

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components (shadcn/ui + custom)
│   ├── hooks/           # Custom React hooks for data fetching
│   ├── pages/           # Route components (landing, dashboard)
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── replit_integrations/  # Auth, Chat, Image, Batch processing
│   └── storage.ts       # Database operations
├── shared/              # Shared TypeScript code
│   ├── schema.ts        # Drizzle database schemas
│   ├── routes.ts        # API route definitions with Zod
│   └── models/          # Auth and Chat models
└── migrations/          # Database migrations
```

## External Dependencies

### AI Integration
- **Google Gemini**: Via Replit AI Integrations service
  - Models: gemini-2.5-flash (fast), gemini-2.5-pro (advanced), gemini-2.5-flash-image (images)
  - Configured through `AI_INTEGRATIONS_GEMINI_API_KEY` and `AI_INTEGRATIONS_GEMINI_BASE_URL`
  - Used for "Crack Time" AI problem-solving and image generation

### Authentication
- **Email/Password Authentication**: Custom authentication system
  - Login, signup, and password recovery endpoints
  - Password hashing with bcrypt
  - Session management via express-session with PostgreSQL store
  - Requires `SESSION_SECRET` environment variable
  - User sessions stored in PostgreSQL

### Password Recovery
- Uses Resend email service to send temporary passwords via email
- Requires `RESEND_API_KEY` environment variable

### Database
- **PostgreSQL**: Primary data store
  - Connection via `DATABASE_URL` environment variable
  - Session table required for authentication
  - Schema managed through Drizzle ORM

### Development Tools
- **Vite Plugins**: Replit-specific plugins for development (cartographer, dev-banner, runtime-error-overlay)