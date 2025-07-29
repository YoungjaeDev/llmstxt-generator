import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    firecrawl: !!process.env.FIRECRAWL_API_KEY,
    firecrawl_base_url: process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev/v1",
    openai: !!process.env.OPENAI_API_KEY,
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY)
  });
} 