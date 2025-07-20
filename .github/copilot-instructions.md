<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Rental Property Management System

This is a rental property management web application built with:

## Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, DaisyUI
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: Local file system with multer
- **Containerization**: Docker for PostgreSQL

## Key Features
1. **User Authentication**: Login/logout functionality
2. **Room Management**: CRUD operations for rental properties
3. **Contract Management**: Digital contract storage with file uploads/downloads
4. **Billing System**: Invoice generation and receipt printing
5. **Notification System**: Alerts for contract expiry and rent collection

## Development Guidelines
- Use TypeScript for all new files
- Follow DaisyUI component patterns for UI consistency
- Use Prisma Client for all database operations
- Implement proper error handling and validation
- Use React Hook Form with Zod for form validation
- Follow Next.js 15 App Router conventions
- Use server components where possible for better performance

## File Organization
- `/src/app` - Next.js app router pages and API routes
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations
- `/public` - Static assets and uploaded files

## Coding Conventions
- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use kebab-case for file names
- Include proper JSDoc comments for complex functions
- Always handle loading and error states in components
