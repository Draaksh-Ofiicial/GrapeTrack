# GrapeTrack - AI Assistant Instructions

## Architecture Overview

GrapeTrack is a **role-based task management system** built with Next.js 15 (App Router), TypeScript, Drizzle ORM, and PostgreSQL. The application uses JWT-based authentication via NextAuth.js with a custom RBAC system.

### Key Architectural Patterns

**Route Groups & Protection**: Uses Next.js route groups `(admin)` and `(auth)` with middleware-based protection. All `/p/*` routes require authentication, with admin routes requiring `admin.access` permission.

**Database Layer**: Single-table inheritance pattern for users with role-based access via `users.usertype` field referencing `roles.name`. Drizzle schema defines all relationships with proper foreign key constraints.

**RBAC System**: Database-driven permission system in `/src/rbac/` with `permissions` and `role_permissions` tables. Server functions are async and cached. Admin role has wildcard `*` permissions.

## Critical Development Workflows

### Database Management
```bash
# Generate and push schema changes
npm run generate:push
# Seed admin user (required for first setup)
npm run seed:admin
# Seed permissions and role mappings
npm run seed:permissions
```

### Development Server
```bash
# Uses Turbopack for faster builds
npm run dev
```

### Environment Variables Required
- `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` - PostgreSQL connection
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - NextAuth.js configuration
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` - Initial admin account

## Project-Specific Conventions

### Authentication Flow
- Custom Drizzle adapter in `/src/app/api/auth/drizzleAdapter.ts`
- Session contains merged user data (users + user_profiles + user_settings)
- `useCurrentUser` hook provides immediate access to full user context from session

### Component Architecture
- **Layout Components**: `AdminLayout` wraps admin pages with sidebar navigation
- **Modal Pattern**: Task creation follows modal pattern with project selection
- **State Management**: Local state with fetch caching, no external state library

### Database Patterns
- **Soft Deletes**: Users have `is_deleted` flag instead of hard deletion
- **Audit Trail**: `activity_logs` table tracks user actions with IP/user agent
- **Profile Separation**: Core auth in `users`, extended data in `user_profiles`

### API Route Patterns
- Session-based authentication using `getServerSession(authOptions)`
- Merged profile data combining `users`, `user_profiles`, and `user_settings`
- Standard error handling with NextResponse

### File Organization
- `/src/drizzle/` - Database schema and migrations
- `/src/rbac/` - Role-based access control logic
- `/src/app/(admin)/p/` - Protected admin routes
- `/src/hooks/` - Reusable React hooks with caching
- `/scripts/` - Database seeding and maintenance

### Type Safety
- Drizzle inferred types exported from schema: `usersInterface`, `rolesInterface`
- Custom NextAuth session type extension for user data
- Strict TypeScript configuration with proper type imports

## Key Integration Points

**NextAuth.js**: Custom providers (credentials, GitHub, Google) with Drizzle adapter
**Middleware**: Route protection with role validation at `/src/middleware.ts`
**Database**: PostgreSQL with connection pooling via `postgres` client
**Styling**: Tailwind CSS with Geist font family

When working with this codebase, always consider the role-based permissions before implementing features, use the established database patterns for new entities, and follow the authentication flow for protected operations.
