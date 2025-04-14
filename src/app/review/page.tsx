"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewTraces } from "../conponents/ReviewTraces";

export default function ReviewPage() {
  const [blogContent, setBlogContent] = useState("");
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      {/* 背景 */}
      <div className="fixed inset-0 bg-gray-900 w-full h-full" />
      
      {/* コンテンツ */}
      <div className="relative w-full max-w-6xl px-4 pt-16 pb-6 flex flex-col items-center">
        <button 
          onClick={() => router.push('/')}
          className="absolute top-0 left-0 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 z-10"
        >
          ← ホームに戻る
        </button>

        <h1 className="text-3xl font-bold text-blue-400 mb-6">ブログ記事レビューAI</h1>
        
        <div className="w-full bg-gray-800 border border-blue-500 rounded-lg p-6 shadow-lg shadow-blue-500/20 mb-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label htmlFor="blog-content" className="text-blue-400 mb-2 text-sm">ブログ内容</label>
              <textarea
                id="blog-content"
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                placeholder="ブログの内容をここに貼り付けてください..."
                className="w-full px-4 py-3 bg-gray-700 text-white border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 h-40"
              />
            </div>
          </div>
        </div>
        
        {/* ReviewTracesコンポーネントを使用 */}
        <ReviewTraces blogContent={blogContent} />
      </div>
    </div>
  );
}
