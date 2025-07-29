# LLMs.txt Generator

Generate consolidated text files from websites for LLM training and inference – Powered by Firecrawl 🔥

## 🚀 실행 방법

### 1. 웹 애플리케이션 실행

```bash
# 의존성 설치
npm install
# 또는
pnpm install

# 개발 서버 실행
npm run dev
# 또는
pnpm dev
```

http://localhost:3000 에서 웹 애플리케이션에 접근할 수 있습니다.

### 2. Python 백엔드 설정 (선택사항)

더 유연한 설정과 OpenAI를 활용한 향상된 기능을 위해 Python 백엔드를 사용할 수 있습니다.

#### Python 환경 설정

```bash
# Python 의존성 설치 (uv 사용)
cd fc-py
uv venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
uv pip install -r requirements.txt
```

#### 환경 변수 설정 (권장)

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# .env 파일
FIRECRAWL_API_KEY=fc-your-api-key-here
FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1
OPENAI_API_KEY=sk-your-openai-api-key-here

# 선택사항 (캐싱용)
SUPABASE_URL=your-supabase-url-here
SUPABASE_KEY=your-supabase-anon-key-here
```

**우선순위**: 
- 웹 UI 입력 > 명령줄 옵션 > 환경변수 (.env)
- .env 파일에 키가 있으면 웹 UI에서 키를 입력하지 않아도 작동합니다

#### Python 스크립트 직접 실행

```bash
# 가상환경 활성화 (먼저 실행)
cd fc-py
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# 기본 실행 (.env 파일의 API 키 사용)
python generate-llmstxt.py https://example.com

# API 키를 직접 지정 (환경변수 덮어쓰기)
python generate-llmstxt.py https://example.com \
  --firecrawl-api-key YOUR_FIRECRAWL_KEY \
  --openai-api-key YOUR_OPENAI_KEY

# 설정 파일 지정
python generate-llmstxt.py https://example.com \
  --config config.yaml

# 자세한 로그 출력
python generate-llmstxt.py https://example.com --verbose
```

## ⚙️ 설정 옵션

`fc-py/config.yaml` 파일에서 다음과 같은 설정들을 조정할 수 있습니다:

### API 설정
- `api.firecrawl.base_url`: Firecrawl API 베이스 URL
- `api.openai.model`: 사용할 OpenAI 모델 (기본: gpt-4o-mini)
- `api.openai.temperature`: OpenAI 응답의 창의성 (0.0-1.0)

### URL 처리 설정
- `urls.map_limit`: 매핑할 최대 URL 수 (기본: 500)
- `urls.process_limit`: 실제 처리할 최대 URL 수 (기본: 20)
- `urls.include_subdomains`: 하위 도메인 포함 여부
- `urls.exclude_patterns`: 제외할 URL 패턴들

### 처리 설정
- `processing.batch_size`: 배치당 처리할 URL 수 (기본: 10)
- `processing.max_workers`: 동시 처리 워커 수 (기본: 5)
- `processing.batch_delay`: 배치 간 지연 시간 (초)

### 출력 설정
- `output.generate_full_text`: 전체 텍스트 파일 생성 여부
- `output.clean_page_separators`: 페이지 구분자 제거 여부

## 🔑 API 키 획득

### Firecrawl API 키
1. [firecrawl.dev](https://firecrawl.dev)에서 계정 생성
2. 대시보드에서 API 키 생성
3. 무료 플랜으로도 기본 기능 사용 가능

### OpenAI API 키 (Python 백엔드용)
1. [OpenAI Platform](https://platform.openai.com)에서 계정 생성
2. API 키 생성
3. 사용량에 따른 과금 주의

## 🌐 웹 UI 사용법

1. **URL 입력**: 분석하고 싶은 웹사이트 URL 입력
2. **Python Backend 토글**: 향상된 기능을 위해 Python 백엔드 사용
3. **API 키 입력**: Firecrawl 키와 OpenAI 키 입력
4. **설정 조정**: "Configure Python Settings" 버튼으로 세부 설정 조정
5. **생성 시작**: "Generate" 버튼으로 llms.txt 파일 생성

## 📄 출력 파일

- **llms.txt**: 웹사이트의 페이지 목록과 간단한 설명
- **llms-full.txt**: 각 페이지의 전체 내용이 포함된 파일

## 🔧 문제 해결

### Python 실행 오류
```bash
# Python 3가 설치되어 있는지 확인
python3 --version

# 의존성 재설치
pip install -r fc-py/requirements.txt --force-reinstall
```

### API 키 오류
- API 키가 올바른지 확인
- 환경 변수가 정확히 설정되었는지 확인
- API 키에 충분한 크레딧이 있는지 확인

### 웹 애플리케이션 오류
```bash
# Node.js 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 개발 서버 재시작
npm run dev
```
