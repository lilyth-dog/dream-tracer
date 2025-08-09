# 베이스 이미지 설정
FROM node:20-alpine AS base

# pnpm 설치
RUN npm install -g pnpm@8.15.0

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사
COPY package.json pnpm-lock.yaml ./

# 개발 의존성 설치 단계
FROM base AS deps
RUN pnpm install --frozen-lockfile

# 개발 환경용 이미지
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 개발 서버 실행
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["pnpm", "dev"]

# 빌드 단계
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 빌드
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# 프로덕션 의존성만 설치
FROM base AS prod-deps
RUN pnpm install --prod --frozen-lockfile

# 프로덕션 환경용 이미지
FROM node:20-alpine AS production

# 보안을 위한 비루트 사용자 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 필요한 파일들만 복사
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# 비루트 사용자로 전환
USER nextjs

# 포트 노출
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

# 프로덕션 서버 실행
CMD ["npm", "start"]