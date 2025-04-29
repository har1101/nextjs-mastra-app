FROM public.ecr.aws/docker/library/node:22.11.0-slim AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ビルドステージ
FROM base AS builder
# uv と Python のインストールに必要なツールをインストール
USER root
RUN apt-get update && apt-get install -y curl tar gzip ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/*

# node ユーザーに切り替え、ホーム配下に uv/uvx をインストール
USER node
ENV HOME=/home/node \
    PATH="/home/node/.local/bin:${PATH}"
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
RUN uv python install 3.10

# アプリケーションコードの処理に戻る
# ベースイメージのデフォルトユーザー (node) に戻す
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# アプリケーションディレクトリの所有権を node ユーザーに変更
# chown を実行するために一時的に root に切り替え
USER 0
RUN chown -R node:node /app
# 再度 node ユーザーに戻す
USER node

# これで uvx コマンドが利用可能 & 書き込み権限があるはず
RUN npm run build

FROM base AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

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