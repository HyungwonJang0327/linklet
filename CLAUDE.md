# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linklet is a wishlist sharing platform built with Next.js 15, React 19, TypeScript, Prisma ORM, and PostgreSQL. Users can create, manage, and share wishlists with categorization, internationalization, and customizable sharing pages.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Database commands
npx prisma generate          # Generate Prisma client after schema changes
npx prisma db push          # Push schema changes to database
npx prisma studio          # Open Prisma Studio for database inspection
```

The development server runs on http://localhost:3000 (or next available port if 3000 is occupied).

## Architecture Overview

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4 with inline theme configuration
- **State Management**: TanStack Query for server state
- **Authentication**: NextAuth.js with Google OAuth
- **Icons**: Heroicons and Lucide React
- **Internationalization**: Custom i18n system supporting Korean (kr), English (en), Japanese (jp)

### Database Architecture

The application uses PostgreSQL with the following core models:

- **User**: User accounts with profile information (bio, avatar, locale)
- **Wishlist**: Main wishlist entity with categories, privacy settings, and shareable URLs
- **WishlistItem**: Individual items within wishlists with product URLs, images, priorities
- **Session**: User authentication sessions
- **WishlistCategory**: Enum for categorizing wishlists (GENERAL, BIRTHDAY, CHRISTMAS, etc.)

Key relationships:
- User → Wishlists (one-to-many)
- Wishlist → WishlistItems (one-to-many, cascade delete)
- User → Sessions (one-to-many, cascade delete)

### Database Layer (`/lib/db/`)

The database layer is modularized into:

- **`client.ts`**: Prisma client singleton with global instance management
- **`index.ts`**: Central export hub re-exporting all database functions
- **`wishlist.ts`**: All wishlist and wishlist item operations with comprehensive CRUD
- **`user.ts`**: User management and session operations

**Important**: Database modules import the client from `./client` to avoid circular dependencies. API routes should import from `@/lib/db` or specific modules like `@/lib/db/wishlist`.

### API Architecture (`/app/api/`)

RESTful API routes following Next.js 15 conventions:

- **`/api/wishlists`**: CRUD operations for wishlists, supports user filtering and public browsing
- **`/api/wishlists/[id]`**: Individual wishlist operations
- **`/api/wishlists/[id]/items`**: Wishlist item management
- **`/api/wishlists/share/[shareUrl]`**: Public wishlist access via shareable URLs
- **`/api/items/[id]`**: Individual item operations with ISR revalidation
- **`/api/users`**: User account management with GET, POST, PUT operations
- **`/api/metadata`**: URL metadata extraction for product links

All API routes include proper error handling, validation, and support for ISR revalidation.

### Internationalization System (`/lib/i18n/`)

- **Supported locales**: Korean (kr), English (en), Japanese (jp) with Korean as default
- **Route-based**: Uses `[locale]` dynamic segments in app directory
- **Static generation**: All locale pages are pre-generated at build time
- **Middleware**: Geo-based locale detection for wishlist sharing routes
- **Dictionary system**: JSON-based translations with type-safe access

### Component Architecture (`/components/`)

Organized by functionality:

- **`ui/`**: Reusable UI components (Button, Input, Card, etc.)
- **`layout/`**: Layout components (Header, ConditionalHeader)
- **`providers/`**: Context providers (Auth, Query, I18n)
- **`wishlist/`**: Wishlist-specific components
- **`forms/`**: Form components with validation
- **`customize/`**: Wishlist customization components
- **`settings/`**: User settings interface

### Custom Hooks (`/hooks/`)

TanStack Query-based hooks for data management:

- **`use-user.ts`**: User profile operations with optimistic updates
- **`use-url-metadata.ts`**: URL metadata extraction (single and batch processing)
- All hooks include proper loading states, error handling, and cache management

### Validation & Data Sanitization (`/lib/validations/`)

- **Form validation**: Client and server-side validation for wishlists and items
- **Data sanitization**: Automatic trimming and type coercion
- **URL validation**: Robust URL validation for product and image URLs
- **Category validation**: Type-safe wishlist category validation

### Page Structure (`/app/[locale]/`)

Dynamic locale-based routing with:

- **Home page**: Landing page with feature showcase
- **Pricing page**: Free/Pro tier comparison with internationalization
- **Settings pages**: Nested settings with profile, wishlists, appearance, notifications
- **Wishlist sharing**: Public wishlist pages at `/w/[shareUrl]`

## Important Development Notes

### Next.js 15 Compatibility
- All `params` in page components must be awaited (they are Promise objects)
- Use `generateStaticParams()` for locale-based static generation
- Middleware configured only for wishlist sharing routes

### Database Function Usage
- Import from `@/lib/db` for convenience or `@/lib/db/wishlist` for specific modules
- All database functions include proper TypeScript types and error handling
- Use transaction support for multi-step operations (e.g., `reorderWishlistItems`)

### Authentication & Authorization
- Google OAuth integration via NextAuth.js
- Database-backed sessions with Prisma adapter
- Login barriers protect settings pages
- User profile management with bio, avatar, and locale preferences

### URL Metadata Extraction
- `/api/metadata` endpoint extracts title, description, images, and prices from URLs
- Rate limiting (10 requests per minute per IP) and security measures against SSRF attacks
- `useUrlMetadata` and `useBatchUrlMetadata` hooks for client-side metadata fetching
- `/lib/services/url-metadata.ts` service handles HTML parsing and Open Graph/Twitter Card extraction
- Product links on wishlist creation page automatically enhanced with metadata display
- Supports bulk extraction and individual URL processing with loading states

### ISR and Revalidation
- Shared wishlists use ISR with `revalidateSharedWishlist()` function
- API routes automatically revalidate when items are modified
- Middleware adds country headers for geo-based features

### State Management
- TanStack Query for server state caching and synchronization
- React Context for i18n and authentication state
- No global client state - prefer server state patterns
- Custom hooks pattern for reusable data operations with optimistic updates

### Environment Variables Required
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Development Patterns

### File Creation Guidelines
- ALWAYS prefer editing existing files over creating new ones
- NEVER create files unless absolutely necessary for achieving the goal
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested

### Code Conventions
- Follow existing patterns when making changes to files
- Check neighboring files and package.json for library usage before assuming availability
- Use existing utilities and maintain consistent code style across components
- Import database functions from `@/lib/db` or specific modules to avoid circular dependencies

## Conversation History Guidelines

When working on this project, record conversation history in structured markdown files:

### Directory Structure
Create a `/history` folder in the project root to store all conversation records.

### File Organization
- **Planning Phase**: Save as `YYYY-MM-DD-planning.md`
- **Development Phase**: Save as `YYYY-MM-DD-development.md`

### Content Structure
Each conversation record should include:
- Date and time of conversation
- Summary of topics discussed
- Key decisions made
- Action items or next steps
- Code changes or implementations discussed

This helps maintain project continuity and provides context for future development sessions.