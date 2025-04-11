FROM --platform=linux/arm64 public.ecr.aws/docker/library/node:22.11.0-slim as builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM --platform=linux/arm64 public.ecr.aws/docker/library/node:22.11.0-slim as runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=3000 NODE_ENV=production
ENV AWS_LWA_ENABLE_COMPRESSION=true
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/run.sh ./run.sh
RUN ln -s /tmp/cache ./.next/cache
RUN chmod +x ./run.sh

CMD exec ./run.sh
