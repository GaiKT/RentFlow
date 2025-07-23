import { useState, useEffect } from 'react';

export function useLocalStorage(key: string, initialValue: string | null = null) {
  const [storedValue, setStoredValue] = useState<string | null>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: string | null) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, value);
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isClient] as const;
}
