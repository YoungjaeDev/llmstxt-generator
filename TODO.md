# TODO List

추후 개선 및 구현 예정 사항들을 정리한 문서입니다.

## Architecture Improvements (중간 우선순위)

### Backend Architecture Refactoring
현재 Python subprocess 호출 방식을 더 효율적인 구조로 개선

**현재 문제점:**
- Node.js에서 `child_process.spawn()`으로 Python 실행
- 파일 시스템 의존 (임시 파일 생성/읽기/삭제)
- 프로세스 오버헤드 (매 요청마다 새로운 Python 프로세스)
- 복잡한 에러 처리 (stdout/stderr 파싱)
- 확장성 제한 (동시 요청 시 여러 Python 프로세스)

**개선 옵션:**

#### Option 1: TypeScript 포팅 (권장)
- Python 알고리즘을 TypeScript로 포팅
- Firecrawl/OpenAI API 직접 호출
- subprocess 오버헤드 제거
- 단일 언어 스택으로 통합

#### Option 2: FastAPI 별도 서비스
- Python 코드를 FastAPI로 HTTP 서버화
- RESTful API 구조
- Docker 컨테이너로 독립 배포
- 마이크로서비스 아키텍처

#### Option 3: Python HTTP 서버
- 현재 Python 코드를 HTTP 서버로 변환
- subprocess 제거하면서 Python 코드 재사용
- Flask 또는 FastAPI 사용

### 구체적 작업 항목
- [ ] Python 로직을 TypeScript로 포팅
- [ ] Firecrawl API 호출을 fetch()로 구현
- [ ] OpenAI API 호출을 openai npm 패키지로 구현
- [ ] 배치 처리를 Promise.all()로 구현
- [ ] URL 필터링을 JavaScript 정규식으로 구현
- [ ] 에러 처리 개선
- [ ] subprocess 의존성 완전 제거

### 현재 상태
현재 구조는 동작에는 문제없지만, 프로덕션 환경에서의 확장성과 성능을 위해 아키텍처 개선이 필요한 상태입니다. 우선 배포 및 사용에 집중하고, 이후 단계적으로 개선 작업을 진행할 예정입니다.