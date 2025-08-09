# LLMs.txt Generator

Generate consolidated llms.txt files from websites for LLM training and inference using Firecrawl and OpenAI.

This tool creates structured text files containing page titles and descriptions from any website, optimized for LLM context usage.

## Quick Start

### 1. Setup

```bash
# Clone repository
git clone <repository-url>
cd llmstxt-generator

# Install Node.js dependencies
npm install

# If npm install fails, try:
npm install --legacy-peer-deps

# Setup Python virtual environment
cd fc-py
uv venv
uv pip install -r requirements.txt
cd ..
```

### 2. Environment Variables

Create `.env` file in project root:

```bash
FIRECRAWL_API_KEY=fc-your-api-key-here
OPENAI_API_KEY=sk-your-openai-api-key-here
FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1
```

### 3. Run Application

```bash
npm run dev
```

Access http://localhost:3000 to use the web interface.

## Architecture

Hybrid Next.js + Python application:

- **Frontend**: Next.js web interface with shadcn/ui components
- **Backend**: Python script using Firecrawl for scraping and OpenAI for content analysis
- **Processing**: Batch processing with concurrent URL handling
- **Output**: Single llms.txt file with page titles and descriptions

## Python Script Usage

Run the Python script directly:

```bash
# Activate virtual environment
cd fc-py
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# Basic usage
python generate-llmstxt.py https://example.com

# With API keys
python generate-llmstxt.py https://example.com \
  --firecrawl-api-key YOUR_KEY \
  --openai-api-key YOUR_KEY

# With config file
python generate-llmstxt.py https://example.com --config config.yaml

# Verbose logging
python generate-llmstxt.py https://example.com --verbose
```

## Configuration

Adjust settings in `fc-py/config.yaml`:

### API Settings
- `api.openai.model`: OpenAI model (default: gpt-4o-mini)
- `api.openai.temperature`: Response creativity (0.0-1.0)
- `api.firecrawl.base_url`: Firecrawl API base URL

### URL Processing
- `urls.map_limit`: Maximum URLs to discover (default: 500)
- `urls.process_limit`: Maximum URLs to process (default: 20)
- `urls.include_subdomains`: Include subdomain URLs
- `urls.exclude_patterns`: URL patterns to exclude

### Processing
- `processing.batch_size`: URLs per batch (default: 10)
- `processing.max_workers`: Concurrent workers (default: 5)
- `processing.batch_delay`: Delay between batches (seconds)

## API Keys

### Firecrawl API Key
1. Sign up at [firecrawl.dev](https://firecrawl.dev)
2. Generate API key in dashboard
3. Free plan available

### OpenAI API Key
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Generate API key
3. Usage-based pricing applies

## Web Interface Usage

1. **Enter URL**: Input target website URL
2. **Configure API Keys**: Set Firecrawl and OpenAI keys if not in environment
3. **Adjust Settings**: Use "Configure Python Settings" for advanced options
4. **Generate**: Click Generate to create llms.txt file

### Configuration Options
- **API Keys**: Override environment variables
- **OpenAI Model**: Select GPT model
- **URL Processing**: Map/process limits, subdomain inclusion
- **Batch Processing**: Concurrent workers, batch size, delays

## Output Format

Generates `{domain}-llms.txt` file containing:
- Website title and URL
- List of pages with titles and descriptions
- Optimized for LLM context usage

Example:
```
# https://example.com llms.txt

- [Home Page](https://example.com): Welcome to our main landing page
- [About Us](https://example.com/about): Learn about our company history
- [Products](https://example.com/products): Browse our product catalog
```

## Railway Deployment

Optimized for Railway deployment:

### Deploy Steps
1. Connect project to Railway
2. Set environment variables:
   ```
   FIRECRAWL_API_KEY=fc-your-api-key
   OPENAI_API_KEY=sk-your-openai-key
   FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1
   ```
3. Automatic deployment via Dockerfile

### Configuration Files
- `Dockerfile`: Node.js + Python environment
- `railway.json`: Deployment configuration
- `.dockerignore`: Build optimization

## Troubleshooting

### Python Issues
```bash
# Check Python version
python --version

# Reinstall dependencies
cd fc-py
uv pip install -r requirements.txt --force-reinstall
```

### API Key Issues
- Verify API keys are correct
- Check environment variables or web UI settings
- Ensure sufficient credits in API accounts
- Check environment status indicators in web UI

### Web Application Issues
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart development server
npm run dev
```

### Railway Deployment Issues
- Verify environment variables are set correctly in Railway
- Check build logs for Dockerfile success
- Ensure Python script execution permissions
- Monitor memory and timeout limits

## Requirements

- Node.js 18+
- Python 3.8+
- uv package manager
- Firecrawl API key
- OpenAI API key