"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

export type CurrentUser = {
  id: string
  name?: string
  email?: string
  avatar?: string | null
  phone?: string | null
  address?: string | null
  usertype?: string | null
  is_prime?: boolean
  email_notification?: boolean
  is_verified?: boolean
  created_at?: Date | null
  updated_at?: Date | null
  // Profile data
  display_name?: string | null
  bio?: string | null
  locale?: string | null
  timezone?: string | null
  social?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  // Settings data
  preferences?: Record<string, unknown> | null
  push_notifications?: boolean
} | null;

export default function useCurrentUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<CurrentUser>(null);

  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading session
    }

    if (!session?.user) {
      setUser(null);
      return;
    }

    // Session now contains all merged user data, no need for API calls
    const sessionUser = session.user as unknown as CurrentUser;
    setUser(sessionUser);
  }, [session, status]);

  return {
    user,
    isSignedIn: !!session?.user,
    loading: status === 'loading',
  } as const;
}
