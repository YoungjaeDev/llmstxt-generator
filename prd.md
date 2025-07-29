## **Firecrawl generate llms.txt 변경 PRD**

---

### **문제 정의**

현재 [llmstxt-generator 오픈소스](https://github.com/mendableai/llmstxt-generator)는 사용자가 URL을 입력하면 llms.txt를 생성해주는 서비스입니다. 

**주요 문제점:**
- 서비스 중단 예정
- Firecrawl에서 개발한 서비스로, 자사 URL을 통한 API 사용을 유도하는 구조 (크레딧 소모가 단점)
- 커스터마이징이 제한적

### **목표**

**현재 상황:**
- 백엔드가 JavaScript로 구현되어 있음
- Firecrawl은 JavaScript와 Python API를 모두 지원
- `fc-py` 폴더에 원하는 로직으로 `generate-llmstxt.py` 구현 완료
- `fc-py/.venv`에 uv로 만든 가상환경이 있음 (이 Python을 사용해야 함)
- 내가 railway에 self host로 올렸고, .env 파일을 보면 환경 변수를 알 수 있음 

**개선 방향:**
1. **백엔드 언어 변경**: JavaScript → Python으로 전환
2. **API 호출 방식 개선**: 직접 llmstxt API 호출 → 커스텀 로직 적용
3. **로직 커스터마이징**: map 후 scrape하는 방식으로 세밀한 제어
4. **코드 정리**: 불필요한 기존 코드 삭제

### **실행 계획**

**Phase 1: 분석 및 계획**
- 기존 코드 구조 분석
- Python 로직과의 연동 방안 수립

**Phase 2: 구현**
- Python 백엔드 로직 적용 (uv 가상환경의 Python 사용)
- 기존 JavaScript API 로직 제거
- 테스트 및 검증
- 추후 Railway에서 해당 깃허브를 올릴 수 있도록 하도록 도커나 기타 가능한 환경 생성

**Phase 3: 정리**
- 불필요한 코드 삭제
- 문서화 업데이트
