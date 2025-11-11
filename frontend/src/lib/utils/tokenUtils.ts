/**
 * Token utility functions for managing authentication tokens
 * Used with httpOnly cookies for secure token storage
 */

/**
 * Check if a token is expired based on expiration timestamp
 * @param expiresAt - ISO string timestamp when token expires
 * @param bufferMinutes - Minutes before expiration to consider expired (default: 5)
 * @returns true if token is expired or will expire soon
 */
export const isTokenExpired = (expiresAt: string | null, bufferMinutes: number = 5): boolean => {
  if (!expiresAt) {
    return true; // No expiration time means token is invalid
  }

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = new Date().getTime();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds

  return currentTime >= (expirationTime - bufferTime);
};

/**
 * Get time remaining until token expires
 * @param expiresAt - ISO string timestamp when token expires
 * @returns Object with remaining time in different units, or null if expired
 */
export const getTokenTimeRemaining = (expiresAt: string | null) => {
  if (!expiresAt) {
    return null;
  }

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = new Date().getTime();
  const remaining = expirationTime - currentTime;

  if (remaining <= 0) {
    return null; // Token is expired
  }

  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    total: remaining,
    days: days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
};

/**
 * Format token expiration time for display
 * @param expiresAt - ISO string timestamp when token expires
 * @returns Formatted string or null if expired
 */
export const formatTokenExpiration = (expiresAt: string | null): string | null => {
  const remaining = getTokenTimeRemaining(expiresAt);
  
  if (!remaining) {
    return null;
  }

  if (remaining.days > 0) {
    return `${remaining.days}d ${remaining.hours}h`;
  } else if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}m`;
  } else if (remaining.minutes > 0) {
    return `${remaining.minutes}m`;
  } else {
    return `${remaining.seconds}s`;
  }
};

/**
 * Check if token needs refresh (within refresh threshold)
 * @param expiresAt - ISO string timestamp when token expires
 * @param refreshThresholdMinutes - Minutes before expiration to trigger refresh (default: 10)
 * @returns true if token should be refreshed
 */
export const shouldRefreshToken = (expiresAt: string | null, refreshThresholdMinutes: number = 10): boolean => {
  if (!expiresAt) {
    return false; // Can't refresh if we don't know expiration
  }

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = new Date().getTime();
  const thresholdTime = refreshThresholdMinutes * 60 * 1000;

  return currentTime >= (expirationTime - thresholdTime);
};

/**
 * Get last refresh time in a human-readable format
 * @param lastRefresh - ISO string timestamp of last refresh
 * @returns Formatted relative time string
 */
export const formatLastRefresh = (lastRefresh: string | null): string => {
  if (!lastRefresh) {
    return 'Never';
  }

  const lastRefreshTime = new Date(lastRefresh).getTime();
  const currentTime = new Date().getTime();
  const elapsed = currentTime - lastRefreshTime;

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Token refresh strategy configuration
 */
export const TOKEN_REFRESH_CONFIG = {
  // Refresh token when it expires in 10 minutes
  REFRESH_THRESHOLD_MINUTES: 10,
  
  // Consider token expired 5 minutes before actual expiration
  EXPIRY_BUFFER_MINUTES: 5,
  
  // Maximum retry attempts for token refresh
  MAX_REFRESH_RETRIES: 3,
  
  // Delay between refresh retries (milliseconds)
  REFRESH_RETRY_DELAY: 1000,
} as const;