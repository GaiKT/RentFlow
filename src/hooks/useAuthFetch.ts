'use client';

import { useCallback } from 'react';

// Custom fetch hook with authentication
export const useAuthFetch = () => {
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, mergedOptions);
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return response;
    }

    return response;
  }, []);

  return authFetch;
};
