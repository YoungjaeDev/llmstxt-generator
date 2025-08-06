# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Python Backend
```bash
# Navigate to Python directory
cd fc-py

# Create virtual environment (uv required)
uv venv

# Install Python dependencies
uv pip install -r requirements.txt

# Run Python script directly
.venv\Scripts\activate  # Windows
python generate-llmstxt.py https://example.com --firecrawl-api-key YOUR_KEY --openai-api-key YOUR_KEY

# For macOS/Linux
source .venv/bin/activate
python generate-llmstxt.py https://example.com --firecrawl-api-key YOUR_KEY --openai-api-key YOUR_KEY
```

### Environment Setup
- Create `.env` file in project root with:
  - `FIRECRAWL_API_KEY=fc-your-api-key-here`
  - `OPENAI_API_KEY=sk-your-openai-api-key-here`
  - `FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1` (optional)

## Architecture Overview

### High-Level Structure
This is a **hybrid Next.js + Python application** that generates llms.txt files from websites using Firecrawl and OpenAI:

1. **Frontend**: Next.js React application with shadcn/ui components
2. **Backend API**: Next.js API routes that orchestrate Python script execution
3. **Python Engine**: Standalone Python script for web scraping and content processing

### Key Components

#### Frontend (`app/`)
- **Main Page** (`app/(home)/page.tsx`): Core UI with URL input, API key management, and Python configuration modal
- **Layout** (`app/layout.tsx`): Root layout with theme provider and analytics
- **UI Components** (`components/ui/`): Reusable shadcn/ui components (buttons, modals, inputs)

#### API Layer (`app/api/`)
- **Service Route** (`app/api/service/route.ts`): Main API endpoint that spawns Python processes
- **Environment Check** (`app/api/check-env/route.ts`): Validates environment variables

#### Python Backend (`fc-py/`)
- **Main Script** (`generate-llmstxt.py`): Core engine for mapping URLs, scraping content, and generating llms.txt files
- **Configuration** (`config.yaml`): YAML-based settings for URL processing, batch handling, and output options
- **Virtual Environment** (`.venv/`): Isolated Python dependencies

### Data Flow
1. User submits URL through web interface
2. Next.js API route (`/api/service`) receives request with URL and optional API keys
3. API spawns Python subprocess with environment variables and configuration
4. Python script:
   - Maps URLs using Firecrawl's `/map` endpoint
   - Scrapes content from discovered URLs
   - Uses OpenAI to generate titles and descriptions
   - Creates both `llms.txt` and `llms-full.txt` files
5. Files are read back by Node.js and returned to frontend
6. User can view, copy, or download results

### Important Technical Details

#### Python Integration
- Node.js spawns Python processes using `child_process.spawn()`
- Virtual environment Python path detection (Windows vs Unix)
- Environment variables passed to Python subprocess
- Temporary file handling in `temp/` directory

#### Configuration System
- Frontend configuration modal maps to Python script parameters
- YAML configuration file (`fc-py/config.yaml`) for Python-specific settings
- Environment variables have precedence: UI input > command args > .env file

#### API Key Management
- Supports both environment variables and user-provided keys
- Frontend shows environment status indicators
- Python script can use multiple key sources with fallback hierarchy

## Development Notes

- **Python Virtual Environment**: The app expects `fc-py/.venv/` to exist with required packages installed via `uv`
- **Railway Deployment**: Configured with `Dockerfile` and `railway.json` for cloud deployment
- **File Processing**: Python generates domain-based filenames (e.g., `example.com-llms.txt`)
- **Error Handling**: Python stderr is captured and returned as error messages
- **Timeout**: API requests have 5-minute timeout (`maxDuration = 300`)