#!/usr/bin/env python3
"""
Generate llms.txt and llms-full.txt files for a website using Firecrawl and OpenAI.

This script:
1. Maps all URLs from a website using Firecrawl's /map endpoint
2. Scrapes each URL to get the content
3. Uses OpenAI to generate titles and descriptions
4. Creates llms.txt (list of pages with descriptions) and llms-full.txt (full content)
"""

import os
import sys
import json
import time
import argparse
import logging
import re
import yaml
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


@dataclass
class Config:
    """Configuration class for llms.txt generator"""
    # API settings
    firecrawl_base_url: str = "https://api.firecrawl.dev/v1"
    firecrawl_timeout: int = 30000
    openai_model: str = "gpt-4.1-mini"
    openai_temperature: float = 0.3
    openai_max_tokens: int = 100
    
    # URL processing settings
    map_limit: int = 500
    process_limit: int = 20
    include_subdomains: bool = False
    use_sitemap: bool = True
    exclude_patterns: List[str] = None
    exclude_exact: List[str] = None
    include_patterns: List[str] = None
    
    # Processing settings
    batch_size: int = 10
    max_workers: int = 5
    batch_delay: float = 1.0
    content_limit: int = 4000
    
    # Output settings
    generate_full_text: bool = True
    clean_page_separators: bool = True
    filename_pattern: str = "{domain}-llms.txt"
    full_filename_pattern: str = "{domain}-llms-full.txt"
    
    # Scraping settings
    scraping_formats: List[str] = None
    only_main_content: bool = True
    
    # Logging settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    def __post_init__(self):
        if self.scraping_formats is None:
            self.scraping_formats = ["markdown"]
        if self.exclude_patterns is None:
            self.exclude_patterns = []
        if self.exclude_exact is None:
            self.exclude_exact = []
        if self.include_patterns is None:
            self.include_patterns = []
        
        # API URL 정규화: /v1이 없으면 자동 추가
        self.firecrawl_base_url = self._normalize_api_url(self.firecrawl_base_url)
    
    def _normalize_api_url(self, url: str) -> str:
        """API URL을 정규화하여 /v1이 없으면 추가"""
        if not url:
            return "https://api.firecrawl.dev/v1"
        
        # 끝의 슬래시 제거
        url = url.rstrip('/')
        
        # /v1이 없으면 추가
        if not url.endswith('/v1'):
            url += '/v1'
        
        return url
    
    @classmethod
    def from_yaml(cls, config_path: str) -> 'Config':
        """Load configuration from YAML file"""
        if not os.path.exists(config_path):
            return cls()  # Return default config if file doesn't exist
            
        with open(config_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        # 임시 인스턴스 생성하여 _normalize_api_url 메서드 사용
        temp_instance = cls()
        
        return cls(
            # API settings
            firecrawl_base_url=temp_instance._normalize_api_url(
                data.get('api', {}).get('firecrawl', {}).get('base_url', cls.firecrawl_base_url)
            ),
            firecrawl_timeout=data.get('api', {}).get('firecrawl', {}).get('timeout', cls.firecrawl_timeout),
            openai_model=data.get('api', {}).get('openai', {}).get('model', cls.openai_model),
            openai_temperature=data.get('api', {}).get('openai', {}).get('temperature', cls.openai_temperature),
            openai_max_tokens=data.get('api', {}).get('openai', {}).get('max_tokens', cls.openai_max_tokens),
            
            # URL processing settings
            map_limit=data.get('urls', {}).get('map_limit', cls.map_limit),
            process_limit=data.get('urls', {}).get('process_limit', cls.process_limit),
            include_subdomains=data.get('urls', {}).get('include_subdomains', cls.include_subdomains),
            use_sitemap=data.get('urls', {}).get('use_sitemap', cls.use_sitemap),
            exclude_patterns=data.get('urls', {}).get('exclude_patterns', cls().exclude_patterns),
            exclude_exact=data.get('urls', {}).get('exclude_exact', cls().exclude_exact),
            include_patterns=data.get('urls', {}).get('include_patterns', cls().include_patterns),
            
            # Processing settings
            batch_size=data.get('processing', {}).get('batch_size', cls.batch_size),
            max_workers=data.get('processing', {}).get('max_workers', cls.max_workers),
            batch_delay=data.get('processing', {}).get('batch_delay', cls.batch_delay),
            content_limit=data.get('processing', {}).get('content_limit', cls.content_limit),
            
            # Output settings
            generate_full_text=data.get('output', {}).get('generate_full_text', cls.generate_full_text),
            clean_page_separators=data.get('output', {}).get('clean_page_separators', cls.clean_page_separators),
            filename_pattern=data.get('output', {}).get('filename_pattern', cls.filename_pattern),
            full_filename_pattern=data.get('output', {}).get('full_filename_pattern', cls.full_filename_pattern),
            
            # Scraping settings
            scraping_formats=data.get('scraping', {}).get('formats', cls().scraping_formats),
            only_main_content=data.get('scraping', {}).get('only_main_content', cls.only_main_content),
            
            # Logging settings
            log_level=data.get('logging', {}).get('level', cls.log_level),
            log_format=data.get('logging', {}).get('format', cls.log_format),
        )


class FirecrawlLLMsTextGenerator:
    """Firecrawl과 OpenAI를 사용하여 llms.txt 파일을 생성하는 클래스"""
    
    def __init__(self, firecrawl_api_key: str, openai_api_key: str, config: Config):
        """생성자: API 키들과 설정으로 초기화"""
        self.firecrawl_api_key = firecrawl_api_key
        self.openai_client = OpenAI(api_key=openai_api_key)
        self.config = config
        self.headers = {
            "Authorization": f"Bearer {self.firecrawl_api_key}",
            "Content-Type": "application/json"
        }
    
    def filter_urls(self, urls: List[str]) -> List[str]:
        """URL 목록을 설정에 따라 필터링하는 함수"""
        filtered_urls = []
        
        for url in urls:
            # 정확히 일치하는 URL 제외
            if url in self.config.exclude_exact:
                logger.debug(f"Excluding exact match: {url}")
                continue
            
            # 패턴 제외 검사
            excluded = False
            for pattern in self.config.exclude_patterns:
                if re.search(pattern, url):
                    logger.debug(f"Excluding URL '{url}' matching pattern '{pattern}'")
                    excluded = True
                    break
            
            if excluded:
                continue
            
            # 포함 패턴이 지정된 경우 화이트리스트로 동작
            if self.config.include_patterns:
                included = False
                for pattern in self.config.include_patterns:
                    if re.search(pattern, url):
                        included = True
                        break
                
                if not included:
                    logger.debug(f"URL '{url}' doesn't match any include pattern")
                    continue
            
            filtered_urls.append(url)
        
        if len(filtered_urls) != len(urls):
            logger.info(f"Filtered {len(urls) - len(filtered_urls)} URLs, {len(filtered_urls)} remaining")
        
        return filtered_urls

    def map_website(self, url: str) -> List[str]:
        """웹사이트를 매핑하여 모든 URL을 가져오는 함수"""
        logger.info(f"Mapping website: {url} (limit: {self.config.map_limit})")
        
        try:
            # Firecrawl /map 엔드포인트로 웹사이트 매핑 요청
            response = requests.post(
                f"{self.config.firecrawl_base_url}/map",
                headers=self.headers,
                json={
                    "url": url,
                    "limit": self.config.map_limit,
                    "includeSubdomains": self.config.include_subdomains,
                    "ignoreSitemap": not self.config.use_sitemap
                }
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get("success") and data.get("links"):
                urls = data["links"]
                logger.info(f"Found {len(urls)} URLs before filtering")
                
                # URL 필터링 적용
                filtered_urls = self.filter_urls(urls)
                logger.info(f"After filtering: {len(filtered_urls)} URLs (will process max {self.config.process_limit})")
                
                return filtered_urls
            else:
                logger.error(f"Failed to map website: {data}")
                return []
                
        except Exception as e:
            logger.error(f"Error mapping website: {e}")
            return []
    
    def scrape_url(self, url: str) -> Optional[Dict]:
        """단일 URL을 스크래핑하여 내용을 추출하는 함수"""
        logger.debug(f"Scraping URL: {url}")
        
        try:
            response = requests.post(
                f"{self.config.firecrawl_base_url}/scrape",
                headers=self.headers,
                json={
                    "url": url,
                    "formats": self.config.scraping_formats,
                    "onlyMainContent": self.config.only_main_content,
                    "timeout": self.config.firecrawl_timeout
                }
            )
            response.raise_for_status()
            
            data = response.json()
            if data.get("success") and data.get("data"):
                return {
                    "url": url,
                    "markdown": data["data"].get("markdown", ""),
                    "metadata": data["data"].get("metadata", {})
                }
            else:
                logger.error(f"Failed to scrape {url}: {data}")
                return None
                
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return None
    
    def generate_description(self, url: str, markdown: str) -> Tuple[str, str]:
        """OpenAI를 사용하여 페이지의 제목과 설명을 생성하는 함수"""
        logger.debug(f"Generating description for: {url}")
        
        # "prompt": "주어진 URL의 전체 페이지 콘텐츠를 기반으로 9-10단어 설명과 3-4단어 제목을 생성하세요. 이는 사용자가 페이지의 의도된 목적을 찾는 데 도움이 됩니다. 응답은 JSON 형식으로 반환하세요: { \"title\": \"3-4단어 제목\", \"description\": \"9-10단어 설명\" }"

        prompt = f"""Generate a 9-10 word description and a 3-4 word title of the entire page based on ALL the content one will find on the page for this url: {url}. This will help in a user finding the page for its intended purpose.

Return the response in JSON format:
{{
    "title": "3-4 word title",
    "description": "9-10 word description"
}}"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.config.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that generates concise titles and descriptions for web pages."
                    },
                    {
                        "role": "user",
                        "content": f"{prompt}\n\nPage content:\n{markdown[:self.config.content_limit]}"
                    }
                ],
                response_format={"type": "json_object"},
                temperature=self.config.openai_temperature,
                max_tokens=self.config.openai_max_tokens
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("title", "Page"), result.get("description", "No description available")
            
        except Exception as e:
            logger.error(f"Error generating description: {e}")
            return "Page", "No description available"
    
    def process_url(self, url: str, index: int) -> Optional[Dict]:
        """Process a single URL: scrape and generate description."""
        scraped_data = self.scrape_url(url)
        if not scraped_data or not scraped_data.get("markdown"):
            return None
        
        title, description = self.generate_description(
            url, 
            scraped_data["markdown"]
        )
        
        return {
            "url": url,
            "title": title,
            "description": description,
            "markdown": scraped_data["markdown"],
            "index": index
        }
    
    def remove_page_separators(self, text: str) -> str:
        """Remove page separators from text."""
        return re.sub(r'<\|firecrawl-page-\d+-lllmstxt\|>\n', '', text)
    
    def generate_llmstxt(self, url: str) -> Dict[str, str]:
        """웹사이트용 llms.txt와 llms-full.txt 파일을 생성하는 메인 함수"""
        logger.info(f"Generating llms.txt for {url}")
        
        # 1단계: 웹사이트의 모든 URL 매핑 (map_limit 사용)
        urls = self.map_website(url)
        if not urls:
            raise ValueError("No URLs found for the website")
        
        # URL 개수를 처리 제한으로 제한 (process_limit 사용, -1이면 무제한)
        if self.config.process_limit > 0:
            urls = urls[:self.config.process_limit]
            logger.info(f"Processing {len(urls)} URLs (limited to {self.config.process_limit})")
        else:
            logger.info(f"Processing all {len(urls)} URLs (no limit)")
        
        # 출력 문자열 초기화
        llmstxt = f"# {url} llms.txt\n\n"
        llms_fulltxt = f"# {url} llms-full.txt\n\n"
        
        # URL들을 배치로 처리
        all_results = []
        
        for i in range(0, len(urls), self.config.batch_size):
            batch = urls[i:i + self.config.batch_size]
            logger.info(f"Processing batch {i//self.config.batch_size + 1}/{(len(urls) + self.config.batch_size - 1)//self.config.batch_size}")
            
            # 배치를 동시에 처리
            with ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
                futures = {
                    executor.submit(self.process_url, url, i + j): (url, i + j)
                    for j, url in enumerate(batch)
                }
                
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        if result:
                            all_results.append(result)
                    except Exception as e:
                        url, idx = futures[future]
                        logger.error(f"Failed to process {url}: {e}")
            
            # 배치 간 지연
            if i + self.config.batch_size < len(urls):
                time.sleep(self.config.batch_delay)
        
        # 순서 유지를 위해 인덱스로 결과 정렬
        all_results.sort(key=lambda x: x["index"])
        
        # 출력 문자열 구성
        for i, result in enumerate(all_results, 1):
            llmstxt += f"- [{result['title']}]({result['url']}): {result['description']}\n"
            llms_fulltxt += f"<|firecrawl-page-{i}-lllmstxt|>\n## {result['title']}\n{result['markdown']}\n\n"
        
        # 선택적으로 페이지 구분자 제거
        if self.config.clean_page_separators:
            llms_fulltxt = self.remove_page_separators(llms_fulltxt)
        
        return {
            "llmstxt": llmstxt,
            "llms_fulltxt": llms_fulltxt,
            "num_urls_processed": len(all_results),
            "num_urls_total": len(urls)
        }


def main():
    """Main function to run the script."""
    parser = argparse.ArgumentParser(
        description="Generate llms.txt and llms-full.txt files for a website using Firecrawl and OpenAI"
    )
    parser.add_argument("url", help="The website URL to process")
    parser.add_argument(
        "--config", 
        default="config.yaml", 
        help="Path to configuration file (default: config.yaml)"
    )
    parser.add_argument(
        "--output-dir", 
        default=".", 
        help="Directory to save output files (default: current directory)"
    )
    parser.add_argument(
        "--firecrawl-api-key",
        help="Firecrawl API key (overrides FIRECRAWL_API_KEY env var)"
    )
    parser.add_argument(
        "--openai-api-key",
        help="OpenAI API key (overrides OPENAI_API_KEY env var)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Load configuration
    config = Config.from_yaml(args.config)
    
    # Configure logging
    log_level = logging.DEBUG if args.verbose else getattr(logging, config.log_level)
    logging.basicConfig(level=log_level, format=config.log_format)
    global logger
    logger = logging.getLogger(__name__)
    
    # API 키 및 설정 우선순위: 명령줄 인자 > 환경변수 > config.yaml
    firecrawl_api_key = args.firecrawl_api_key or os.getenv("FIRECRAWL_API_KEY")
    openai_api_key = args.openai_api_key or os.getenv("OPENAI_API_KEY")
    
    # Base URL 환경변수로 덮어쓰기
    if os.getenv("FIRECRAWL_BASE_URL"):
        config.firecrawl_base_url = config._normalize_api_url(os.getenv("FIRECRAWL_BASE_URL"))
        logger.info(f"Using Firecrawl base URL from environment: {config.firecrawl_base_url}")
    
    # API 키 유효성 검사
    if not firecrawl_api_key:
        logger.error("Firecrawl API key not provided. Set FIRECRAWL_API_KEY environment variable or use --firecrawl-api-key")
        sys.exit(1)
    
    if not openai_api_key:
        logger.error("OpenAI API key not provided. Set OPENAI_API_KEY environment variable or use --openai-api-key")
        sys.exit(1)
    
    logger.info(f"Using Firecrawl API key: {'from command line' if args.firecrawl_api_key else 'from environment'}")
    logger.info(f"Using OpenAI API key: {'from command line' if args.openai_api_key else 'from environment'}")
    
    # llms.txt 생성기 인스턴스 생성
    generator = FirecrawlLLMsTextGenerator(
        firecrawl_api_key,
        openai_api_key,
        config
    )
    
    try:
        # llms.txt 파일들 생성
        result = generator.generate_llmstxt(args.url)
        
        # 출력 디렉토리가 없으면 생성
        os.makedirs(args.output_dir, exist_ok=True)
        
        # 파일명을 위해 URL에서 도메인 추출
        from urllib.parse import urlparse
        domain = urlparse(args.url).netloc.replace("www.", "")
        
        # llms.txt 파일 저장
        llmstxt_filename = config.filename_pattern.format(domain=domain)
        llmstxt_path = os.path.join(args.output_dir, llmstxt_filename)
        with open(llmstxt_path, "w", encoding="utf-8") as f:
            f.write(result["llmstxt"])
        logger.info(f"Saved llms.txt to {llmstxt_path}")
        
        # 요청된 경우 llms-full.txt 파일 저장
        if config.generate_full_text:
            llms_full_filename = config.full_filename_pattern.format(domain=domain)
            llms_fulltxt_path = os.path.join(args.output_dir, llms_full_filename)
            with open(llms_fulltxt_path, "w", encoding="utf-8") as f:
                f.write(result["llms_fulltxt"])
            logger.info(f"Saved llms-full.txt to {llms_fulltxt_path}")
        
        # 처리 결과 요약 출력
        print(f"\nSuccess! Processed {result['num_urls_processed']} out of {result['num_urls_total']} URLs")
        print(f"Files saved to {args.output_dir}/")
        
    except Exception as e:
        logger.error(f"Failed to generate llms.txt: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()