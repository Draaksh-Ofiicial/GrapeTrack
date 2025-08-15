"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import type { usersInterface } from '@/drizzle/schema';

export type CurrentUser = Partial<usersInterface> | null;

// Simple in-memory cache to avoid refetching the same profile during the same app lifetime.
const profileCache = new Map<string, Partial<usersInterface>>();
const inflight = new Map<string, Promise<Partial<usersInterface> | null>>();

export default function useCurrentUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<CurrentUser>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    const mapFromSession = (): Partial<usersInterface> | null => {
      if (!session?.user) return null;
      const s = session.user as Record<string, unknown>;
      const mapped: Partial<usersInterface> = {
        id: (s['id'] as string) ?? undefined,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        avatar: (s['image'] as string) ?? (s['avatar'] as string) ?? undefined,
      };
      return mapped;
    };

    const fetchProfile = async (id: string) => {
      // Return cached value if present
      if (profileCache.has(id)) return profileCache.get(id) ?? null;
      // If a fetch is already in flight for this id, reuse it
      if (inflight.has(id)) return inflight.get(id)!;

      const p = (async () => {
        try {
          const res = await fetch('/api/user/login-info');
          if (!res.ok) return null;
          const payload = await res.json();
          const profile = payload?.data ?? payload ?? null;
          if (profile) profileCache.set(id, profile as Partial<usersInterface>);
          return profile as Partial<usersInterface> | null;
        } catch {
          return null;
        } finally {
          inflight.delete(id);
        }
      })();

      inflight.set(id, p);
      return p;
    };

    const loadFullProfile = async () => {
      if (!session?.user) {
        if (mounted) setUser(null);
        return;
      }

      const maybe = session.user as unknown as Record<string, unknown>;
      const id = maybe?.id as unknown as string | undefined;
      const looksLikeUUID = typeof id === 'string' && id.length === 36 && id.includes('-');

      // If session user isn't a DB user, use mapped session info
      if (!looksLikeUUID) {
        if (mounted) setUser(mapFromSession());
        return;
      }

      // Only fetch if we don't already have a cached profile or the current user doesn't match the session id
      const currentId = (user as Partial<usersInterface>)?.id;
      if (currentId && String(currentId) === id && profileCache.has(id)) {
        // already consistent
        return;
      }

      try {
        setLoadingProfile(true);
        const profile = await fetchProfile(id);
        if (!mounted) return;
        if (profile) setUser(profile);
        else setUser(mapFromSession());
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    loadFullProfile();

    return () => {
      mounted = false;
    };
  }, [session, user]);

  return {
    user,
    isSignedIn: !!session?.user,
    loading: status === 'loading' || loadingProfile,
  } as const;
}
