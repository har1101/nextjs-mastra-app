// ブログレビュー用のストリーミングAPIルート
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

export async function POST(req: NextRequest) {
  // リクエストボディからデータを取得
  const { content } = await req.json();

  // コンテンツが必要
  if (!content) {
    return new Response(JSON.stringify({ error: "Content is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // エージェントを取得
  const agent = mastra.getAgent("blogReviewAgent");
  
  // セッションIDを生成
  const sessionId = `session-${Date.now()}`;

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
              content: "レビュー開始: ブログ記事の分析を開始します",
            }) + "\n"
          )
        );

        // エージェントのストリーミングを開始
        const stream = await agent.stream(content, {
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
                  stepInfo.toolCalls?.[0]?.toolName || "No Tool";
                const query =
                  stepInfo.toolCalls?.[0]?.args?.query || "No Query";
                
                // 初期化トレースを送信
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "trace",
                      traceType: "initial",
                      content: "エージェントが記事の分析を開始しました",
                      toolName: toolName,
                      query: query,
                    }) + "\n"
                  )
                );
                
                // ツール結果があれば、すぐに別のトレースとして送信
                if (stepInfo.toolResults?.[0]?.result.content[0].text) {
                  const toolResultsText = stepInfo.toolResults[0].result.content[0].text;
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "trace",
                        traceType: "tool-results-data",
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
                      content: "分析完了",
                    }) + "\n"
                  )
                );
              } else if (stepInfo.stepType === "thinking") {
                // 思考プロセスのトレース
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "trace",
                      traceType: "thinking",
                      content: `思考中: ${stepInfo.text || ""}`,
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
              sessionId,
              contentLength: content.length,
            },
          },
        });

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
              content: "レビュー完了",
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
