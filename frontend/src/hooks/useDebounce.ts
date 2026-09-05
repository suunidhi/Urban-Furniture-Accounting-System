import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any rapidly changing value (such as search input keystrokes).
 * Delays updating the debounced value until after the user pauses typing for `delay` milliseconds.
 *
 * @param value The input value to debounce
 * @param delay Delay in milliseconds (default: 350ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
