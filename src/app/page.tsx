import { StreamingTech } from "./conponents/StreamingTech";

// Ver.1: Non-streaming version (commented out)
// import { BlogIdeaRetrieve } from "./conponents/Tech";
// 
// export default function Home() {
//   return (
//     <div className="min-h-screen flex flex-col items-center p-8">
//       <BlogIdeaRetrieve />
//     </div>
//   );
// }

// Ver.2: Streaming version (now displayed at root)
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8 text-green-500">ブログ執筆支援エージェント (ストリーミング版)</h1>
      <StreamingTech />
    </div>
  );
}
