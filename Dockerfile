# Railway 배포용 Multi-stage Dockerfile
FROM node:18-slim as base

# Python 설치
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 심볼릭 링크 생성 (python 명령어 사용 가능하게)
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# UV 설치 및 Python 가상환경 설정
RUN pip3 install uv

# Python 의존성 설치
COPY fc-py/ ./fc-py/
WORKDIR /app/fc-py
RUN uv venv
RUN uv pip install -r requirements.txt

WORKDIR /app

# Node.js 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 애플리케이션 코드 복사
COPY . .

# Next.js 빌드
RUN npm run build

# 임시 디렉토리 생성
RUN mkdir -p temp

# 환경변수
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Next.js 앱 시작
CMD ["npm", "start"] 