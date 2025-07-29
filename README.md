# LLMs.txt Generator v2

Generate consolidated text files from websites for LLM training and inference – Powered by Custom Python Backend with Firecrawl 🔥

> **v2 업데이트**: JavaScript 기반 API를 완전히 제거하고 Python 백엔드로 통합하여 더 유연하고 커스터마이징 가능한 llms.txt 생성을 제공합니다.

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd llmstxt-generator

# Node.js 의존성 설치
npm install

# Python 가상환경 설정 (uv 사용)
cd fc-py
uv venv  # .venv 폴더가 이미 있다면 생략
uv pip install -r requirements.txt
cd ..
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# .env 파일
FIRECRAWL_API_KEY=fc-your-api-key-here
FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1  # 선택사항: self-hosted용
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. 웹 애플리케이션 실행

```bash
npm run dev
```

http://localhost:3000 에서 접근하여 사용하세요.

## 🏗️ 아키텍처 변경사항

### v2에서 달라진 점
- ❌ **제거됨**: JavaScript Firecrawl API 직접 호출
- ❌ **제거됨**: Python/JavaScript 백엔드 선택 옵션
- ✅ **추가됨**: 통합된 Python 백엔드 (map → scrape → OpenAI 분석)
- ✅ **추가됨**: Railway 배포 지원
- ✅ **개선됨**: 더 세밀한 URL 필터링 및 배치 처리

### Python 백엔드 장점
- **커스터마이징**: URL 패턴 필터링, 배치 처리, 콘텐츠 제한 등
- **성능**: 동시 처리 및 배치 지연으로 API 제한 관리
- **품질**: OpenAI를 통한 더 정확한 제목 및 설명 생성

#### Python 환경 설정 (uv 가상환경)

시스템에 [uv](https://docs.astral.sh/uv/)가 설치되어 있어야 합니다:

```bash
# uv 설치 (필요한 경우)
pip install uv

# Python 의존성 설치 (uv 가상환경)
cd fc-py
uv venv  # .venv 폴더 생성
uv pip install -r requirements.txt
```

> **참고**: 웹 애플리케이션은 자동으로 `fc-py/.venv`의 Python을 사용합니다. 별도 활성화 불필요!

#### 환경 변수 설정 (권장)

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# .env 파일
FIRECRAWL_API_KEY=fc-your-api-key-here
FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase 캐싱 기능 제거됨
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
2. **API 키 입력**: 환경변수에 없는 경우 Firecrawl 키와 OpenAI 키 입력
3. **설정 조정**: "Configure Python Settings" 버튼으로 세부 설정 조정
4. **생성 시작**: "Generate" 버튼으로 llms.txt 파일 생성

### 설정 가능한 옵션
- **Firecrawl Base URL**: Self-hosted Firecrawl 사용 시
- **OpenAI 모델**: 사용할 GPT 모델 선택
- **URL 처리**: Map/Process 제한, 서브도메인 포함 등
- **배치 처리**: 동시 처리 수, 배치 크기, 지연 설정

## 📄 출력 파일

- **llms.txt**: 웹사이트의 페이지 목록과 간단한 설명
- **llms-full.txt**: 각 페이지의 전체 내용이 포함된 파일

## 🚀 Railway 배포

이 프로젝트는 Railway 배포를 위해 최적화되었습니다.

### 배포 방법
1. Railway에 프로젝트 연결
2. 환경 변수 설정:
   ```
   FIRECRAWL_API_KEY=fc-your-api-key
   OPENAI_API_KEY=sk-your-openai-key
   FIRECRAWL_BASE_URL=https://api.firecrawl.dev/v1
   ```
3. 자동 배포 (Dockerfile 사용)

### Railway 설정 파일
- `Dockerfile`: Node.js + Python 환경 구성
- `railway.json`: 배포 설정

## 🔧 문제 해결

### Python 실행 오류
```bash
# Python 3가 설치되어 있는지 확인
python --version

# 의존성 재설치
cd fc-py
pip install -r requirements.txt --force-reinstall
```

### API 키 오류
- ✅ API 키가 올바른지 확인
- ✅ 환경변수나 웹 UI에서 키가 설정되었는지 확인
- ✅ API 키에 충분한 크레딧이 있는지 확인
- ✅ 웹 UI의 환경 상태 표시기 확인

### 웹 애플리케이션 오류
```bash
# Node.js 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 개발 서버 재시작
npm run dev
```

### Railway 배포 오류
- ✅ 환경변수가 Railway에 올바르게 설정되었는지 확인
- ✅ Dockerfile이 빌드 로그에서 성공했는지 확인
- ✅ Python 스크립트가 서버 환경에서 실행 가능한지 확인
