#!/bin/sh
# Script to run database migration only if DATABASE_URL is set

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping database migration"
  echo "⚠️  Please setup database in Vercel Dashboard: https://vercel.com/dashboard"
  exit 0
fi

echo "✅ DATABASE_URL found, running database migration..."
npx prisma migrate deploy || npx prisma db push
