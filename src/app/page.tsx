import { StreamingTech } from "./conponents/StreamingTech";
import Link from "next/link";

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
      {/* レビューページへのリンクボタン */}
      <div className="w-full max-w-screen-xl flex justify-end mb-4 relative z-10">
        <Link 
          href="/review"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          ブログレビューAIを試す
        </Link>
      </div>
      <StreamingTech />
    </div>
  );
}
