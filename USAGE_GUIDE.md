# LLMs.txt Generator 사용 가이드

이 가이드는 LLMs.txt Generator를 사용하는 방법을 단계별로 안내합니다.

## 🚀 빠른 시작

### 1단계: 프로젝트 설정

```bash
# 프로젝트 클론 후
npm install --legacy-peer-deps
```

### 2단계: Python 백엔드 설정 (선택사항)

```bash
cd fc-py
uv venv
.venv\Scripts\activate  # Windows
uv pip install -r requirements.txt
```

### 3단계: 웹 애플리케이션 실행

```bash
npm run dev
```

웹브라우저에서 http://localhost:3000 에 접속

## 🌐 웹 UI 사용법

### 기본 사용법 (Firecrawl만 사용)

1. **URL 입력**: 분석하려는 웹사이트 URL을 입력
2. **API 키 입력**: "Enter Firecrawl API key for full generation" 클릭
3. **Firecrawl API 키 입력**: [firecrawl.dev](https://firecrawl.dev)에서 받은 키 입력
4. **llms-full.txt 토글**: 전체 내용이 포함된 파일이 필요하면 활성화
5. **Generate 클릭**: 파일 생성 시작

### 고급 사용법 (Python 백엔드 사용)

1. **Python Backend 토글 활성화**
2. **Configure Python Settings 클릭**
3. **설정 조정**:
   - **API Keys**: OpenAI API 키 입력 및 모델 선택
   - **URL Processing**: 매핑할 URL 수, 처리할 URL 수 설정
   - **Processing Settings**: 배치 크기, 워커 수, 지연 시간 설정
   - **Output Settings**: 출력 옵션 설정
4. **Generate 클릭**: Python 백엔드로 생성 (현재는 수동 실행 필요)

## 🔧 수동 Python 실행

현재 Python 백엔드는 수동 실행이 필요합니다:

```bash
# 가상환경 활성화
cd fc-py
.venv\Scripts\activate

# 스크립트 실행
python generate-llmstxt.py https://docs.firecrawl.dev/ --firecrawl-api-key YOUR_FIRECRAWL_KEY --openai-api-key YOUR_OPENAI_KEY --config config.yaml --verbose
```

## ⚙️ 설정 파일 (config.yaml)

Python 백엔드의 고급 설정을 조정할 수 있습니다:

```yaml
# API 설정
api:
  openai:
    model: "gpt-4.1-mini"  # 사용할 OpenAI 모델
    temperature: 0.3      # 창의성 레벨 (0.0-1.0)
    max_tokens: 100       # 최대 토큰 수

# URL 처리 설정
urls:
  map_limit: 500         # 매핑할 최대 URL 수
  process_limit: 20      # 실제 처리할 최대 URL 수
  include_subdomains: false
  use_sitemap: true
  exclude_patterns:      # 제외할 URL 패턴
    - "/admin"
    - "/api"

# 처리 설정
processing:
  batch_size: 10         # 배치당 URL 수
  max_workers: 5         # 동시 처리 워커 수
  batch_delay: 1.0       # 배치 간 지연 (초)

# 출력 설정
output:
  generate_full_text: true
  clean_page_separators: true
```

## 📄 출력 파일

### llms.txt
웹사이트의 페이지 목록과 간단한 설명:
```
# https://example.com llms.txt

- [Home Page](https://example.com): Welcome to our main landing page
- [About Us](https://example.com/about): Learn about our company history
- [Products](https://example.com/products): Browse our product catalog
```

### llms-full.txt
각 페이지의 전체 내용이 포함된 파일:
```
# https://example.com llms-full.txt

## Home Page
Welcome to our website...
[전체 페이지 내용]

## About Us
Our company was founded...
[전체 페이지 내용]
```

## 🔑 API 키 설정

### Firecrawl API 키
1. [firecrawl.dev](https://firecrawl.dev) 방문
2. 계정 생성 및 로그인
3. 대시보드에서 API 키 생성
4. 무료 플랜: 월 500 크레딧

### OpenAI API 키 (Python 백엔드용)
1. [OpenAI Platform](https://platform.openai.com) 방문
2. 계정 생성 및 로그인
3. API 키 생성
4. 사용량에 따른 과금 (gpt-4o-mini 권장: 저렴함)

## 🐛 문제 해결

### 웹 애플리케이션이 시작되지 않는 경우
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### Python 스크립트 실행 오류
```bash
# Python 버전 확인
python --version  # 3.8 이상 필요

# 가상환경 재생성
cd fc-py
rm -rf .venv
uv venv
.venv\Scripts\activate
uv pip install -r requirements.txt
```

### API 키 오류
- API 키가 올바른지 확인
- API 키에 충분한 크레딧이 있는지 확인
- Firecrawl: API 사용량 한도 확인
- OpenAI: 잔액 및 사용량 한도 확인

### 처리 속도가 느린 경우
- `config.yaml`에서 `process_limit` 값을 줄이기 (기본: 20)
- `batch_size`를 줄이기 (기본: 10)
- `max_workers`를 줄이기 (기본: 5)

## 💡 팁

1. **작은 사이트부터 시작**: 처음에는 작은 웹사이트로 테스트
2. **설정 조정**: 큰 사이트의 경우 `process_limit`을 적절히 조정
3. **비용 관리**: OpenAI API 사용 시 `max_tokens`과 `process_limit`으로 비용 제어
4. **패턴 제외**: 불필요한 페이지는 `exclude_patterns`로 제외
5. **배치 지연**: 서버 부하를 줄이기 위해 `batch_delay` 조정

## 📞 지원

문제가 발생하면:
1. 이 가이드의 문제 해결 섹션 확인
2. GitHub Issues에 문제 보고
3. README.md의 자세한 기술 문서 참조 