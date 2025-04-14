// サーバーアクションとストリーミングを実装するためのファイル
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

// Streamable関数
export async function POST(req: NextRequest) {
  // リクエストボディからデータを取得
  const { tech, targetAudience } = await req.json();

  // エージェントを取得
  const agent = mastra.getAgent("blogIdeaAgent");

  // レスポンスヘッダーを設定
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      try {
        // 初期メッセージ
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              content: `検索開始: ${tech}に関する最新情報を取得します (対象: ${targetAudience})`,
            }) + "\n"
          )
        );

        // エージェントのストリーミングを開始
        const stream = await agent.stream(
          `${tech}に関する最新情報を検索し、${targetAudience}向けのブログ記事のアイデアを提案してください。`,
          {
            onStepFinish: (stepDetails) => {
              try {
                // ステップ情報をJSONとしてパース
                const stepInfo =
                  typeof stepDetails === "string"
                    ? JSON.parse(stepDetails)
                    : stepDetails;
                console.log('stepInfo:', stepInfo);

                // ステップタイプの判別とトレース情報の送信
                if (stepInfo.stepType === "initial") {
                  const toolName =
                    stepInfo.toolCalls?.[0]?.toolName || "Unknown Tool";
                  const query =
                    stepInfo.toolCalls?.[0]?.args.query || "Unknown Query";
                  
                  // 初期化トレースを送信
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "trace",
                        traceType: "initial",
                        content: "エージェントが処理を開始しました",
                        toolName: toolName,
                        query: query,
                      }) + "\n"
                    )
                  );
                  
                  // ツール結果があれば、すぐに別のトレースとして送信（ただし検索完了メッセージなし）
                  if (stepInfo.toolResults?.[0]?.result.content[0].text) {
                    const toolResultsText = stepInfo.toolResults[0].result.content[0].text;
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: "trace",
                          traceType: "tool-results-data",  // 新しいトレースタイプを使用
                          toolResultsText: toolResultsText,
                        }) + "\n"
                      )
                    );
                  }
                } else if (stepInfo.stepType === "reasoning") {
                  const reasoningText =
                    stepInfo.reasoningDetails?.join(" ") || stepInfo.text || "";

                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "trace",
                        traceType: "reasoning",
                        content: reasoningText,
                      }) + "\n"
                    )
                  );
                } else if (stepInfo.stepType === "tool-result") {
                  // ツール結果のステップタイプの場合、「検索完了」と出力
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "trace",
                        traceType: "tool-result",
                        content: "検索完了",
                      }) + "\n"
                    )
                  );
                } else {
                  // その他のステップタイプ
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "trace",
                        traceType: stepInfo.stepType || "unknown",
                        content: stepInfo.text || JSON.stringify(stepInfo),
                      }) + "\n"
                    )
                  );
                }
              } catch (error) {
                // エラーが発生した場合もトレースに記録
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "error",
                      content: `トレース処理エラー: ${error}`,
                    }) + "\n"
                  )
                );
              }
            },
            telemetry: {
              isEnabled: true,
              metadata: {
                query: tech,
                targetAudience,
              },
            },
          }
        );

        // テキストストリームを処理
        for await (const chunk of stream.textStream) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "content",
                content: chunk,
              }) + "\n"
            )
          );
        }

        // 完了ステータスを送信
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "status",
              content: "出力完了",
            }) + "\n"
          )
        );

        // 使用トークン数を送信（利用可能な場合）
        if (stream.usage) {
          const usage = await stream.usage;
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "usage",
                totalTokens: usage.totalTokens,
              }) + "\n"
            )
          );
        }

        // ストリームを閉じる
        controller.close();
      } catch (error) {
        // エラーが発生した場合
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              content: `エージェント実行エラー: ${error}`,
            }) + "\n"
          )
        );
        controller.close();
      }
    },
  });

  // レスポンスを返す
  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",
      "Lambda-Runtime-Function-Response-Mode": "streaming"
    },
  });
}