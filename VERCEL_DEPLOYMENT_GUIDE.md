# Environment Variables Checklist for Vercel + Supabase

## Required Environment Variables in Vercel Dashboard:

1. **DATABASE_URL** - Your Supabase PostgreSQL connection string
   Format: `postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`

2. **DIRECT_URL** - Direct connection to Supabase (for migrations)
   Format: `postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres`

3. **JWT_SECRET** - Your JWT secret key

4. **NEXTAUTH_SECRET** - If using NextAuth (optional)

5. **NEXTAUTH_URL** - Your production URL (https://your-app.vercel.app)

## How to Set Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable for "Production", "Preview", and "Development" environments

## Example Supabase Connection Strings:

```env
# Replace with your actual Supabase project details
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

DIRECT_URL="postgresql://postgres.xxxxxxxxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

## Important Notes:

- Use connection pooling URL (port 6543) for DATABASE_URL
- Use direct connection (port 5432) for DIRECT_URL
- Make sure your Supabase project allows connections from external sources
- Check that your Supabase project is not paused
