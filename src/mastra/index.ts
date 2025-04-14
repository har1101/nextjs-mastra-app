import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";

import { blogIdeaAgent, blogReviewAgent } from "./agents";

export const mastra = new Mastra({
  agents: { blogIdeaAgent, blogReviewAgent },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
  telemetry: {
    serviceName: "ai",
    enabled: true,
    sampling: {
      type: "always_on", // すべてのトレースを取得
    },
    // Exporterの設定はinstrumentation.tsで行っている
  },
});
