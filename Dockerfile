FROM public.ecr.aws/docker/library/node:22.11.0-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

# Lambdaの権限問題を解決するための環境変数
ENV PORT=3000 NODE_ENV=production
ENV AWS_LWA_ENABLE_COMPRESSION=true
ENV HOME=/tmp
ENV npm_config_cache=/tmp/.npm

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# キャッシュディレクトリの設定
RUN mkdir -p /tmp/cache && ln -s /tmp/cache ./.next/cache

# 拡張した起動スクリプト
RUN echo '#!/bin/bash -x\n[ ! -d "/tmp/cache" ] && mkdir -p /tmp/cache\n[ ! -d "/tmp/.npm" ] && mkdir -p /tmp/.npm\nexport HOME=/tmp\nexport npm_config_cache=/tmp/.npm\nexec node server.js' > ./run.sh && chmod +x ./run.sh

EXPOSE 3000

CMD ["./run.sh"]