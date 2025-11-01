import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-refreshing data at a specified interval
 * @param callback - Function to call on each refresh
 * @param intervalMs - Refresh interval in milliseconds (default: 5 minutes)
 * @param enabled - Whether auto-refresh is enabled (default: true)
 */
export function useAutoRefresh(
  callback: () => void,
  intervalMs: number = 5 * 60 * 1000, // 5 minutes default
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Call immediately on mount
    savedCallback.current();

    // Set up interval
    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}

/**
 * Custom hook for refreshing data when the page becomes visible
 * Useful for refreshing data when user returns to the tab
 */
export function useRefreshOnFocus(callback: () => void, enabled: boolean = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        savedCallback.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);
}
