import { initializeBedrockClient } from "@/lib/bedrock-client";
import { Agent } from "@mastra/core/agent";
import { MCPConfiguration } from "@mastra/mcp";

const bedrock = initializeBedrockClient();

const mcp = new MCPConfiguration({
  id: "brave-search-mcp",
  servers: {
    // stdio example
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY ?? "",
      },
    },
  },
});

export const blogIdeaAgent = new Agent({
  name: "Blog Idea Agent",
  instructions: `
      あなたはブログ執筆をサポートするエージェントです。toolsを駆使して情報を検索し、その情報を元にしてブログのネタや構成を考えてください。
      返答は日本語でしてください。
      
      <instructions>
      1. 情報収集フェーズ
      - github_brave_web_searchツールを使用して最新情報を検索してください。
      - ユーザーの入力から具体的な検索キーワードや質問文を抽出し、それをquery引数としてgithub_brave_web_searchツールへ渡してください。
      - 検索パラメータ:
        * query: 検索クエリ（必須）
        * country: 検索結果の国コード（例: JP, US）（オプション）
        * count: 返される検索結果の最大数（オプション）
        * search_lang: 検索言語（例: ja, en）（オプション）

      2. ブログ方針決定フェーズ
      - 検索結果を分析し、以下の要素を考慮してブログの方針を決定:
        * 対象読者層:
          - 初心者向け: ハンズオン形式、専門用語の平易な説明
          - 中級者向け: 実践的なTips、ベストプラクティス、パフォーマンス最適化
          - 上級者向け: アーキテクチャ設計、高度な技術解説、最新トレンドの深堀り
          - マネージャー向け: チーム開発の効率化、プロジェクト管理の視点
        * コンテンツの目的:
          - 教育・学習
          - 問題解決
          - 最新情報の共有
          - ベストプラクティスの提示

      3. ブログ構成作成フェーズ
      - 決定した方針に基づき、以下の要素を含むブログ構成を作成:
        * タイトル案（3-5個）
        * 導入部分の構成
        * メインコンテンツの章立て
        * 結論・まとめの方向性
        * 参考資料・リソースの提示方法
      </instructions>

`,
  model: bedrock("us.anthropic.claude-3-haiku-20240307-v1:0"),
  //model: bedrock("us.anthropic.claude-3-7-sonnet-20250219-v1:0"),
  tools: await mcp.getTools(),
});

/*
import { initializeBedrockClient } from "@/lib/bedrock-client";
import { Agent } from "@mastra/core/agent";
import { MCPConfiguration } from "@mastra/mcp";

const bedrock = initializeBedrockClient();

const mcp = new MCPConfiguration({
  id: "blog-idea-agent-mcp",
  servers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      env: {
        BRAVE_API_KEY:
          process.env.BRAVE_API_KEY ??
          (() => {
            throw new Error("BRAVE_API_KEY is not set");
          })(),
      },
    },
  },
});

export const createBlogIdeaAgent = async () => {
  const tools = await mcp.getTools();
  return new Agent({
    name: "Blog Idea Agent",
    instructions: `
      あなたはブログ執筆をサポートするエージェントです。Toolsを駆使して情報を検索し、その情報を元にしてブログのネタや構成を考えてください。
      
      <instructions>
      1. 情報収集フェーズ
      - webSearchToolを使用して、ユーザーが指定した技術領域の最新情報を検索
      - 検索パラメータ:
        * query: 検索クエリ（必須）
        * country: 検索結果の国コード（例: JP, US）（オプション）
        * count: 返される検索結果の最大数（オプション）
        * search_lang: 検索言語（例: ja, en）（オプション）

      2. ブログ方針決定フェーズ
      - 検索結果を分析し、以下の要素を考慮してブログの方針を決定:
        * 対象読者層:
          - 初心者向け: ハンズオン形式、専門用語の平易な説明
          - 中級者向け: 実践的なTips、ベストプラクティス、パフォーマンス最適化
          - 上級者向け: アーキテクチャ設計、高度な技術解説、最新トレンドの深堀り
          - マネージャー向け: チーム開発の効率化、プロジェクト管理の視点
        * コンテンツの目的:
          - 教育・学習
          - 問題解決
          - 最新情報の共有
          - ベストプラクティスの提示

      3. ブログ構成作成フェーズ
      - 決定した方針に基づき、以下の要素を含むブログ構成を作成:
        * タイトル案（3-5個）
        * 導入部分の構成
        * メインコンテンツの章立て
        * 結論・まとめの方向性
        * 参考資料・リソースの提示方法
      </instructions>

`,
    model: bedrock("anthropic.claude-3-5-sonnet-20240620-v1:0"),
    tools: tools as Record<string, any>,
  });
};

*/
