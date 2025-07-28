# Supabase + Vercel Deployment Troubleshooting Guide

## Why Local Works but Vercel Doesn't

Your local environment uses Docker PostgreSQL, but production should use Supabase. Here's how to fix the connection issues:

## 🔧 Step-by-Step Fix

### 1. Get Your Supabase Connection Strings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **Database**
4. Copy the connection strings:

**For DATABASE_URL (Connection Pooling):**
```
postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**For DIRECT_URL (Direct Connection):**
```
postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 2. Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add these variables for **Production**, **Preview**, and **Development**:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your Supabase pooled connection string | Production, Preview, Development |
| `DIRECT_URL` | Your Supabase direct connection string | Production, Preview, Development |
| `JWT_SECRET` | Your JWT secret key | Production, Preview, Development |

### 3. Update Your Local Environment

Create/update your `.env.local` file:

```env
# Local Development (Docker) - for local development
DATABASE_URL="postgresql://rental_user:rental_password@localhost:5432/rental_management"
DIRECT_URL="postgresql://rental_user:rental_password@localhost:5432/rental_management"

# Production (Supabase) - these will be overridden by Vercel env vars
# DATABASE_URL="your-supabase-pooled-connection-string"
# DIRECT_URL="your-supabase-direct-connection-string"

JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 4. Deploy Database Schema to Supabase

Run these commands to set up your database schema in Supabase:

```bash
# Set your production environment variables temporarily
export DATABASE_URL="your-supabase-direct-connection-string"

# Push your schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 5. Deploy to Vercel

Now deploy your application:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod
```

## 🚨 Common Issues and Solutions

### Issue 1: "Environment variable not found: DATABASE_URL"
**Solution:** Make sure you've set the environment variables in Vercel dashboard for all environments.

### Issue 2: "Connection terminated unexpectedly"
**Solution:** 
- Check if your Supabase project is active (not paused)
- Verify the connection string format
- Ensure you're using the pooled connection string for DATABASE_URL

### Issue 3: "SSL connection required"
**Solution:** Add `?sslmode=require` to your connection string if not already present.

### Issue 4: "Too many connections"
**Solution:** 
- Use the pooled connection string (port 6543) for DATABASE_URL
- Set `connection_limit=1` in your connection string
- Use `pgbouncer=true` parameter

### Issue 5: Build fails with Prisma errors
**Solution:** Make sure your build command includes `prisma generate`:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

## 🔍 Debugging Steps

### 1. Check Vercel Build Logs
Go to your Vercel dashboard > Deployments > Click on latest deployment > View build logs

### 2. Check Runtime Logs
In Vercel dashboard > Functions > View runtime logs to see database connection errors

### 3. Test Connection Locally with Supabase
Temporarily set your local env to use Supabase:
```bash
export DATABASE_URL="your-supabase-connection-string"
npm run dev
```

### 4. Verify Prisma Schema
Make sure your `schema.prisma` has both URLs:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 📝 Checklist Before Deployment

- [ ] Supabase project is active and not paused
- [ ] Environment variables set in Vercel dashboard
- [ ] Database schema pushed to Supabase using `prisma db push`
- [ ] `prisma generate` included in build script
- [ ] Connection strings use pooled connection for DATABASE_URL
- [ ] JWT_SECRET is set and different from local development
- [ ] Vercel build and deployment successful

## 🆘 Still Having Issues?

1. Check Vercel deployment logs for specific error messages
2. Verify your Supabase project is in the correct region
3. Test your connection strings using a PostgreSQL client
4. Make sure your database has the required tables (run migrations)
5. Check if your Supabase plan has sufficient connection limits

Remember: The main difference is that locally you're connecting to Docker PostgreSQL, but in production you need to connect to Supabase PostgreSQL.
