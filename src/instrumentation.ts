import {
  NodeSDK,
  ATTR_SERVICE_NAME,
  Resource,
} from "@mastra/core/telemetry/otel-vendor";
import { LangfuseExporter } from "langfuse-vercel";

export async function register() {
  // 環境に応じてエクスポーターを選択
  const exporter = new LangfuseExporter({
    enabled: true,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: "ai",
    }),
    traceExporter: exporter,
  });

  sdk.start();
}
