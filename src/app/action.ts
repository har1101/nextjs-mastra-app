"use server";

import { mastra } from "@/mastra";
import { revalidatePath } from "next/cache";

// リアルタイムで取得したトレースを保存するグローバル変数
let realTimeTraces: string[] = [];

// トレース情報をリセットする関数
export async function resetTraces() {
  realTimeTraces = [];
  revalidatePath("/");
  return { success: true };
}

// 現在のトレース情報を返す関数
export async function getCurrentTraces() {
  return { traces: realTimeTraces };
}

// トレース情報を追加する関数
export async function addTrace(trace: string) {
  realTimeTraces.push(trace);
  revalidatePath("/");
  return { success: true };
}

export async function getLatestUpdate(prevState: unknown, formData: FormData) {
  const tech = JSON.parse(formData.get("tech") as string);
  const targetAudience = JSON.parse(formData.get("targetAudience") as string);
  const agent = mastra.getAgent("blogIdeaAgent");

  // エージェントのトレース情報を収集するための配列
  realTimeTraces = []; // リセット

  // 処理開始を記録
  realTimeTraces.push(
    `検索開始: ${tech}に関する最新情報を取得します (対象: ${targetAudience})`
  );
  revalidatePath("/");

  // エージェント実行のオプションでトレース情報を有効化
  const result = await agent.generate(
    `${tech}に関する最新情報を検索し、${targetAudience}向けのブログ記事のアイデアを提案してください。`,
    {
      // onTraceの代わりにonStepFinishを使用
      onStepFinish: (stepDetails) => {
        try {
          // ステップ情報をJSONとしてパース
          const stepInfo =
            typeof stepDetails === "string"
              ? JSON.parse(stepDetails)
              : stepDetails;

          // ステップの種類に応じてトレース情報を追加
          if (stepInfo.type === "tool") {
            const toolName = stepInfo.tool?.name || "Unknown Tool";
            const args = stepInfo.tool?.input
              ? JSON.stringify(stepInfo.tool.input)
              : "{}";
            realTimeTraces.push(`ツール使用: ${toolName} - ${args}`);

            if (stepInfo.tool?.output) {
              const output =
                typeof stepInfo.tool.output === "string"
                  ? stepInfo.tool.output.slice(0, 100) +
                    (stepInfo.tool.output.length > 100 ? "..." : "")
                  : JSON.stringify(stepInfo.tool.output).slice(0, 100) + "...";

              realTimeTraces.push(`ツール結果: ${output}`);
            }
          } else if (stepInfo.type === "llm") {
            // LLMの思考プロセスを表示
            const thinking = stepInfo.prompt || stepInfo.input || "";
            if (thinking) {
              const thinkingSummary =
                typeof thinking === "string"
                  ? thinking.slice(0, 100) +
                    (thinking.length > 100 ? "..." : "")
                  : JSON.stringify(thinking).slice(0, 100) + "...";

              realTimeTraces.push(`思考中: ${thinkingSummary}`);
            }

            // LLMの出力を表示
            if (stepInfo.output) {
              const outputSummary =
                typeof stepInfo.output === "string"
                  ? stepInfo.output.slice(0, 100) +
                    (stepInfo.output.length > 100 ? "..." : "")
                  : JSON.stringify(stepInfo.output).slice(0, 100) + "...";

              realTimeTraces.push(`観察: ${outputSummary}`);
            }
          } else {
            // その他のイベントタイプ
            realTimeTraces.push(
              `ステップ(${stepInfo.type || "unknown"}): ${JSON.stringify(
                stepInfo
              ).slice(0, 150)}...`
            );
          }

          // 各トレースごとにパスを再検証
          revalidatePath("/");
        } catch (error) {
          // エラーが発生した場合もトレースに記録
          realTimeTraces.push(`トレース処理エラー: ${error}`);
          revalidatePath("/");
        }
      },

      // テレメトリを有効にして、サーバー側のトレース収集と連携
      telemetry: {
        isEnabled: true,
        metadata: {
          query: tech,
          targetAudience: targetAudience,
        },
      },
    }
  );

  // 結果処理を記録
  realTimeTraces.push(`情報取得完了: ${result.finishReason || "completed"}`);
  realTimeTraces.push(`合計トークン数: ${result.usage?.totalTokens || "N/A"}`);
  revalidatePath("/");

  return {
    text: result.text,
    finishReason: result.finishReason,
    timestamp: new Date().toISOString(),
    totalTokens: result.usage?.totalTokens,
    traces: realTimeTraces, // トレース情報を追加
  };
}
