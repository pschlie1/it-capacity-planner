# Neon PostgreSQL Setup

All code changes are done. You just need to create the Neon database and set the connection strings.

## Step 1: Create Neon Project

1. Go to https://console.neon.tech
2. Create a new project:
   - **Project name:** `it-capacity-planner`
   - **Region:** `AWS US East (Ohio)` (us-east-2)
   - **Postgres version:** 16
3. Create a database named `capacity` (or use the default `neondb`)

## Step 2: Get Connection Strings

From the Neon dashboard, copy:
- **Pooled connection string** (for DATABASE_URL) — looks like:
  `postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/capacity?sslmode=require`
- **Direct connection string** (for DIRECT_URL) — looks like:
  `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/capacity?sslmode=require`

## Step 3: Set Local Environment

```bash
# In the project root, update .env:
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/capacity?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/capacity?sslmode=require"
```

## Step 4: Run Migration & Seed

```bash
npx prisma migrate dev --name init-postgres
npx prisma db seed
```

## Step 5: Set Vercel Environment

```bash
source ~/.openclaw/.env

# Remove old SQLite DATABASE_URL
npx vercel env rm DATABASE_URL production --token=$VERCEL_TOKEN --yes 2>/dev/null

# Add new ones (paste the connection strings when prompted)
echo "postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/capacity?sslmode=require" | npx vercel env add DATABASE_URL production --token=$VERCEL_TOKEN
echo "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/capacity?sslmode=require" | npx vercel env add DIRECT_URL production --token=$VERCEL_TOKEN
```

## Step 6: Deploy

```bash
npx prisma generate
npx vercel --token=$VERCEL_TOKEN --prod
```

## Step 7: Run Migration on Production DB

```bash
# Set DATABASE_URL and DIRECT_URL to Neon, then:
npx prisma migrate deploy
npx prisma db seed
```
