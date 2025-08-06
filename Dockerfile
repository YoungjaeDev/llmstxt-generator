# Railway 배포용 Dockerfile
FROM node:18-slim

# Python과 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 심볼릭 링크 생성 (python 명령어 사용 가능하게)
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# UV 설치
RUN pip3 install uv

# Python 의존성 파일 먼저 복사 (캐싱 최적화)
COPY fc-py/requirements.txt ./fc-py/
WORKDIR /app/fc-py
RUN uv venv
RUN uv pip install -r requirements.txt

WORKDIR /app

# Node.js 의존성 파일 먼저 복사 (캐싱 최적화)
COPY package*.json ./
RUN npm ci --only=production

# 나머지 Python 파일 복사
COPY fc-py/ ./fc-py/

# 애플리케이션 코드 복사
COPY . .

# Next.js 빌드
RUN npm run build

# 임시 디렉토리 생성
RUN mkdir -p temp

# 환경변수 설정
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Next.js 앱 시작
CMD ["npm", "start"] 