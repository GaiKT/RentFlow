"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerClassName=""
      containerStyle={{ zIndex: 9000 }}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: 'hsl(var(--b1))',
          color: 'hsl(var(--bc))',
          border: '1px solid hsl(var(--b3))',
          borderRadius: '0.5rem',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        // Success toast options
        success: {
          style: {
            background: 'hsl(var(--su))',
            color: 'hsl(var(--suc))',
            border: '1px solid hsl(var(--su))',
          },
          iconTheme: {
            primary: 'hsl(var(--suc))',
            secondary: 'hsl(var(--su))',
          },
        },
        // Error toast options
        error: {
          style: {
            background: 'hsl(var(--er))',
            color: 'hsl(var(--erc))',
            border: '1px solid hsl(var(--er))',
          },
          iconTheme: {
            primary: 'hsl(var(--erc))',
            secondary: 'hsl(var(--er))',
          },
        },
        // Loading toast options
        loading: {
          style: {
            background: 'hsl(var(--in))',
            color: 'hsl(var(--inc))',
            border: '1px solid hsl(var(--in))',
          },
          iconTheme: {
            primary: 'hsl(var(--inc))',
            secondary: 'hsl(var(--in))',
          },
        },
      }}
    />
  );
}
