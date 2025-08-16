# Session-Based User Data Implementation

## Overview

The system has been updated to store all frequently required user details directly in the NextAuth session instead of making API calls to fetch user data. This improves performance and simplifies the authentication flow.

## Key Changes

### 1. Enhanced NextAuth Session Callback

The `session` callback in `authOptions.tsx` now:
- Fetches merged user data from `users`, `user_profiles`, and `user_settings` tables
- Stores all frequently needed data directly in the session
- Eliminates the need for separate API calls to get user details

```typescript
// Before: Session only contained basic user info
session.user = { id, name, email, image }

// After: Session contains full merged profile
session.user = {
  id, name, email, avatar, phone, address, usertype,
  is_prime, email_notification, is_verified,
  display_name, bio, locale, timezone, social, metadata,
  preferences, push_notifications
}
```

### 2. Updated useCurrentUser Hook

The `useCurrentUser` hook now:
- **Removed**: API call to `/api/user/login-info`
- **Removed**: Complex caching logic
- **Simplified**: Directly uses session data from NextAuth
- **Performance**: No network requests needed after session load

```typescript
// Before: Made API calls to fetch user data
const fetchProfile = async (id: string) => {
  const res = await fetch('/api/user/login-info');
  // ... complex caching logic
}

// After: Uses session data directly
const sessionUser = session.user as unknown as CurrentUser;
setUser(sessionUser);
```

### 3. Updated Type Definitions

Enhanced NextAuth types in `next-auth.d.ts` to include:
- All user fields from the `users` table
- Profile data from `user_profiles` table
- Settings data from `user_settings` table

### 4. Removed Dependencies

- **Deleted**: `/api/user/login-info` route (no longer needed)
- **Updated**: `usePermissions` hook to not import server-side functions
- **Simplified**: No more client-side caching for user data

## Benefits

### 🚀 **Performance Improvements**
- **Zero API calls** for user data after session establishment
- **Faster page loads** - no waiting for user profile API
- **Reduced server load** - fewer database queries per request
- **Better UX** - immediate access to user data

### 🔧 **Simplified Architecture**
- **Single source of truth** - session contains all user data
- **Reduced complexity** - no client-side caching needed
- **Fewer API endpoints** - one less route to maintain
- **Cleaner code** - removed complex async loading logic

### 🛡️ **Security & Reliability**
- **Session-based** - data refreshed on each session
- **Server-side merging** - data integrity at the source
- **Consistent state** - no cache synchronization issues

## Usage Examples

### Getting Current User Data
```typescript
import useCurrentUser from '@/hooks/useCurrentUser';

function UserProfile() {
  const { user, loading, isSignedIn } = useCurrentUser();

  if (loading) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please sign in</div>;

  return (
    <div>
      <h1>{user?.display_name || user?.name}</h1>
      <p>Role: {user?.usertype}</p>
      <p>Email: {user?.email}</p>
      <p>Timezone: {user?.timezone}</p>
      {user?.is_prime && <span>Premium User</span>}
    </div>
  );
}
```

### Accessing User Permissions
```typescript
import { usePermissions } from '@/hooks/usePermissions';
import useCurrentUser from '@/hooks/useCurrentUser';

function ProjectActions() {
  const { user } = useCurrentUser();
  const { checkPermission, loading } = usePermissions(user?.usertype);

  if (loading) return <div>Loading permissions...</div>;

  return (
    <div>
      {checkPermission('projects.write') && (
        <button>Create Project</button>
      )}
      {checkPermission('projects.delete') && (
        <button>Delete Project</button>
      )}
    </div>
  );
}
```

## Migration Notes

### For Existing Code
1. **No changes needed** for components using `useCurrentUser()` hook
2. **Session updates** automatically include all user data
3. **Type safety** maintained with updated TypeScript definitions

### For New Development
1. **Use session data** directly instead of making API calls
2. **Trust the session** - data is always up-to-date
3. **Leverage full user context** - all profile/settings available immediately

## Technical Details

### Session Data Structure
```typescript
interface SessionUser {
  // Core user data
  id: string
  name?: string
  email?: string
  avatar?: string | null
  usertype?: string | null
  
  // Profile data
  display_name?: string | null
  bio?: string | null
  timezone?: string | null
  
  // Settings
  preferences?: Record<string, unknown> | null
  push_notifications?: boolean
  
  // ... and more
}
```

### Session Refresh Behavior
- **Automatic**: Session data updates on each request
- **Trigger**: Changes to user/profile/settings refresh session
- **Caching**: NextAuth handles session caching automatically

### Database Queries
- **Per session**: 3 queries (users, user_profiles, user_settings)
- **Frequency**: Only when session is established/refreshed
- **Optimization**: Queries are batched in session callback

## Monitoring & Debugging

### Checking Session Data
```typescript
import { useSession } from 'next-auth/react';

function DebugSession() {
  const { data: session } = useSession();
  console.log('Full session data:', session?.user);
  return <pre>{JSON.stringify(session?.user, null, 2)}</pre>;
}
```

### Performance Monitoring
- Monitor session callback execution time
- Track database query performance for user data joins
- Watch for any session-related errors in logs

## Future Considerations

1. **Session Size**: Monitor JWT token size with full user data
2. **Real-time Updates**: Consider WebSocket for instant profile updates
3. **Selective Loading**: Option to load minimal vs full profile data
4. **Caching Strategy**: Implement Redis caching for session callbacks if needed
