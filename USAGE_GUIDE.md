# LLMs.txt Generator Usage Guide

Step-by-step guide for using the LLMs.txt Generator.

## Quick Setup

### 1. Installation

```bash
# After cloning the project
npm install
```

### 2. Python Backend Setup

```bash
cd fc-py
uv venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
uv pip install -r requirements.txt
```

### 3. Start Application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Web Interface Usage

### Basic Usage

1. **Enter URL**: Input the website URL you want to analyze
2. **Configure API Keys**: Click "Enter Firecrawl API key" if not set in environment
3. **Set Keys**: Enter your Firecrawl and OpenAI API keys
4. **Generate**: Click "Generate" to create llms.txt file
5. **Download**: Copy or download the generated file

### Advanced Configuration

Click "Configure Python Settings" for advanced options:

#### API Settings
- **OpenAI API Key**: Override environment key
- **OpenAI Model**: Select GPT model (default: gpt-4o-mini)

#### URL Processing
- **Map Limit**: Maximum URLs to discover (default: 500)
- **Process Limit**: Maximum URLs to process (default: 20)
- **Include Subdomains**: Include subdomain pages
- **Use Sitemap**: Use website sitemap for discovery

#### Processing Settings
- **Batch Size**: URLs processed per batch (default: 10)
- **Max Workers**: Concurrent processing threads (default: 5)
- **Batch Delay**: Delay between batches in seconds (default: 1.0)

## Direct Python Script Usage

For advanced users or automation:

```bash
# Activate virtual environment
cd fc-py
.venv\Scripts\activate

# Basic usage with environment variables
python generate-llmstxt.py https://example.com

# With explicit API keys
python generate-llmstxt.py https://docs.firecrawl.dev \
  --firecrawl-api-key YOUR_FIRECRAWL_KEY \
  --openai-api-key YOUR_OPENAI_KEY

# With custom config
python generate-llmstxt.py https://example.com --config config.yaml

# Verbose logging
python generate-llmstxt.py https://example.com --verbose
```

## Configuration File (config.yaml)

Customize behavior with `fc-py/config.yaml`:

```yaml
# API Configuration
api:
  openai:
    model: "gpt-4o-mini"
    temperature: 0.3
    max_tokens: 100
  firecrawl:
    base_url: "https://api.firecrawl.dev/v1"
    timeout: 30000

# URL Processing
urls:
  map_limit: 500
  process_limit: 20
  include_subdomains: false
  use_sitemap: true
  exclude_patterns:
    - "/admin"
    - "/api"
    - "/login"

# Processing Settings
processing:
  batch_size: 10
  max_workers: 5
  batch_delay: 1.0
  content_limit: 4000
```

## Output Format

The tool generates `{domain}-llms.txt` files:

```
# https://example.com llms.txt

- [Home Page](https://example.com): Welcome page with company overview
- [About Us](https://example.com/about): Company history and team information
- [Products](https://example.com/products): Product catalog and specifications
- [Contact](https://example.com/contact): Contact information and support details
```

## API Key Setup

### Firecrawl API Key
1. Visit [firecrawl.dev](https://firecrawl.dev)
2. Create account and log in
3. Generate API key in dashboard
4. Free tier: 500 credits/month

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create account and log in
3. Generate API key
4. Usage-based pricing (gpt-4o-mini recommended for cost efficiency)

## Performance Tips

### For Small Websites (< 50 pages)
- Use default settings
- Process limit: 20-50 pages

### For Medium Websites (50-200 pages)
- Increase process limit: 50-100
- Adjust batch size: 15-20
- Use exclude patterns for unwanted sections

### For Large Websites (200+ pages)
- Set process limit: 100-200
- Increase batch delay: 2-3 seconds
- Use specific exclude patterns
- Monitor API costs

### Cost Optimization
- Use gpt-4o-mini model (cheapest)
- Set appropriate process limits
- Exclude unnecessary URL patterns
- Monitor OpenAI usage dashboard

## Troubleshooting

### Application Won't Start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Python Script Errors
```bash
# Check Python version (requires 3.8+)
python --version

# Recreate virtual environment
cd fc-py
rm -rf .venv
uv venv
.venv\Scripts\activate
uv pip install -r requirements.txt
```

### API Key Issues
- Verify keys are correct and have sufficient credits
- Check environment status indicators in web UI
- Ensure API keys have necessary permissions

### Slow Processing
- Reduce process_limit in settings
- Decrease batch_size (default: 10)
- Increase batch_delay (default: 1.0)
- Reduce max_workers (default: 5)

### Empty or Poor Results
- Check if website allows scraping
- Verify Firecrawl can access the site
- Try excluding problematic URL patterns
- Check if pages require authentication

## Best Practices

1. **Start Small**: Test with small websites first
2. **Use Exclusions**: Filter out admin, API, and login pages
3. **Monitor Costs**: Track OpenAI API usage
4. **Respect Limits**: Don't overwhelm target websites
5. **Save Configs**: Create custom config.yaml for repeated use

## Environment Variables

Set these in `.env` file or environment:

```bash
FIRECRAWL_API_KEY=fc-your-key-here
OPENAI_API_KEY=sk-your-key-here
FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1  # optional
```

Priority: Web UI input > Command line args > Environment variables

## Support

For issues:
1. Check this usage guide
2. Review troubleshooting section
3. Report issues on GitHub
4. Check README.md for technical details