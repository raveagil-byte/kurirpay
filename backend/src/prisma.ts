import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Proactive Check for Vercel/Supabase Common Configuration Issue
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('supabase.com') && !dbUrl.includes('pgbouncer=true')) {
    console.warn("⚠️  CRITICAL WARNING: DATABASE_URL appears to be missing '?pgbouncer=true'. This WILL cause 'prepared statement already exists' errors in Production/Vercel.");
}

export default prisma;

