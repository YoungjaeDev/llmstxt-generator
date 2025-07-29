import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { url, firecrawlApiKey, openaiApiKey, config } = await request.json();

    if (!firecrawlApiKey || !openaiApiKey) {
      return NextResponse.json(
        { error: 'Both Firecrawl and OpenAI API keys are required for Python backend' },
        { status: 400 }
      );
    }

    // For now, return an error with instructions
    return NextResponse.json({
      error: 'Python backend not yet fully integrated. Please follow setup instructions in README.',
      message: 'Run the Python script manually with: python3 fc-py/generate-llmstxt.py <URL> --firecrawl-api-key <KEY> --openai-api-key <KEY>'
    }, { status: 501 });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 