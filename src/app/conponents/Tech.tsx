//"use client";
//
//import { useState, useEffect, useActionState, startTransition } from "react";
//import { getLatestUpdate, getCurrentTraces, resetTraces } from "../action";
//
//export function BlogIdeaRetrieve() {
//  const [tech, setTech] = useState("");
//  const [targetAudience, setTargetAudience] = useState("初心者");
//  const [result, setResult] = useState("");
//  const [traces, setTraces] = useState<string[]>([]);
//  
//  const [state, action, isPending] = useActionState(getLatestUpdate, null);
//  
//  // リアルタイムでトレース情報を取得するためのポーリング
//  useEffect(() => {
//    if (!isPending) return;
//    
//    // ポーリング間隔（ミリ秒）- より高頻度に設定
//    const pollingInterval = 500;
//    let timeoutId: NodeJS.Timeout;
//    
//    const fetchTraces = async () => {
//      try {
//        const response = await getCurrentTraces();
//        if (response.traces) {
//          setTraces(response.traces);
//        }
//        
//        // 処理が終わっていなければ再度ポーリング
//        if (isPending) {
//          timeoutId = setTimeout(fetchTraces, pollingInterval);
//        }
//      } catch (error) {
//        console.error("トレース取得エラー:", error);
//      }
//    };
//    
//    // 初回ポーリング開始
//    fetchTraces();
//    
//    // クリーンアップ関数
//    return () => {
//      if (timeoutId) {
//        clearTimeout(timeoutId);
//      }
//    };
//  }, [isPending]);
//  
//  // 結果が返ってきたときの処理
//  useEffect(() => {
//    if (state?.text) {
//      setResult(state.text);
//      
//      // 最終的なトレース情報を更新
//      if (state.traces) {
//        setTraces(state.traces);
//      }
//    }
//  }, [state]);
//  
//  // フォーム送信処理
//  const handleSubmit = async (e: React.FormEvent) => {
//    e.preventDefault();
//    if (!tech.trim()) return;
//    
//    // トレースをリセット
//    await resetTraces();
//    setTraces([]);
//    
//    const formData = new FormData();
//    formData.set("tech", JSON.stringify(tech));
//    formData.set("targetAudience", JSON.stringify(targetAudience));
//    
//    startTransition(() => {
//      action(formData);
//    });
//  };
//  
//  // トレースのアイコンを取得する関数
//  const getTraceIcon = (trace: string): string => {
//    if (trace.startsWith('思考中:')) return '🤔';
//    if (trace.startsWith('ツール使用:')) return '🛠️';
//    if (trace.startsWith('ツール結果:')) return '📋';
//    if (trace.startsWith('観察:')) return '👁️';
//    if (trace.startsWith('推論:')) return '🧠';
//    if (trace.startsWith('検索開始:')) return '🔍';
//    if (trace.startsWith('情報取得完了:')) return '✅';
//    if (trace.startsWith('合計トークン数:')) return '📊';
//    return '📝';
//  };
//  
//  // トレースの色を取得する関数
//  const getTraceColor = (trace: string): string => {
//    if (trace.startsWith('思考中:')) return 'border-blue-500';
//    if (trace.startsWith('ツール使用:')) return 'border-yellow-500';
//    if (trace.startsWith('ツール結果:')) return 'border-orange-500';
//    if (trace.startsWith('観察:')) return 'border-purple-500';
//    if (trace.startsWith('推論:')) return 'border-indigo-500';
//    if (trace.startsWith('検索開始:')) return 'border-green-500';
//    if (trace.startsWith('情報取得完了:')) return 'border-green-600';
//    if (trace.startsWith('合計トークン数:')) return 'border-green-600';
//    return 'border-gray-500';
//  };
//  
//  return (
//    <>
//      {/* 全画面に広がる背景要素 */}
//      <div className="fixed inset-0 bg-gray-900 w-full h-full" />
//      
//      {/* グローバルスタイル - より強力に背景を強制 */}
//      <style jsx global>{`
//        html, body, #__next, main, div[data-nextjs-scroll-focus-boundary] {
//          background-color: #111827 !important; /* bg-gray-900 */
//          min-height: 100vh;
//          width: 100%;
//          margin: 0;
//          padding: 0;
//          color: white;
//        }
//      `}</style>
//      
//      {/* コンテンツコンテナ - 相対位置で背景の上に配置 */}
//      <div className="relative w-full min-h-screen flex flex-col items-center justify-start">
//        <div className="w-full max-w-screen-xl px-4 py-6 flex flex-col items-center">
//          {/* 2カラムレイアウト */}
//          <div className="w-full flex flex-col lg:flex-row gap-6">
//            {/* 左側：入力フォームと結果表示 (全体の60%) */}
//            <div className="w-full lg:w-3/5 bg-gray-900 border border-green-500 rounded-lg p-6 shadow-lg shadow-green-500/20">
//              <form onSubmit={handleSubmit} className="w-full mb-6">
//                <div className="flex flex-col gap-5">
//                  <div className="flex flex-col">
//                    <label htmlFor="tech-input" className="text-green-400 mb-2 text-sm">技術領域</label>
//                    <input
//                      id="tech-input"
//                      type="text"
//                      value={tech}
//                      onChange={(e) => setTech(e.target.value)}
//                      placeholder="取得したい領域を入力(例: AWS, Azure, Google Cloud, AI...)"
//                      className="w-full px-4 py-3 bg-gray-800 text-white border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
//                      required
//                    />
//                  </div>
//                  
//                  <div className="flex flex-col">
//                    <label htmlFor="audience-select" className="text-green-400 mb-2 text-sm">対象読者</label>
//                    <select
//                      id="audience-select"
//                      value={targetAudience}
//                      onChange={(e) => setTargetAudience(e.target.value)}
//                      className="w-full px-4 py-3 bg-gray-800 text-white border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none"
//                    >
//                      <option value="初心者">初心者</option>
//                      <option value="中級者">中級者</option>
//                      <option value="上級者">上級者</option>
//                      <option value="マネージャー">マネージャー</option>
//                    </select>
//                  </div>
//                  
//                  <button
//                    type="submit"
//                    disabled={isPending}
//                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-800 disabled:opacity-70 transition-colors duration-200 mt-2 font-medium"
//                  >
//                    {isPending ? "読み込み中..." : "最新情報を検索"}
//                  </button>
//                </div>
//              </form>
//              
//              {result && (
//                <div className="w-full mt-6">
//                  <div className="p-6 bg-gray-800 text-white rounded-lg shadow-md border border-green-500">
//                    <h2 className="text-xl font-semibold mb-4 text-green-400">
//                      {tech || "希望する技術領域"}の最新情報
//                    </h2>
//                    <div className="whitespace-pre-wrap">{result}</div>
//                  </div>
//                </div>
//              )}
//            </div>
//            
//            {/* 右側：エージェントトレース (全体の40%) */}
//            <div className="w-full lg:w-2/5 bg-gray-900 border border-green-500 rounded-lg p-6 shadow-lg shadow-green-500/20">
//              <h2 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
//                エージェントトレース 
//                {isPending && (
//                  <span className="text-xs bg-green-600 text-white rounded-full px-2 py-1 ml-2 animate-pulse">
//                    リアルタイム更新中...
//                  </span>
//                )}
//              </h2>
//              
//              <div className="bg-gray-800 rounded-lg border border-green-500 p-4 h-[600px] overflow-y-auto">
//                {isPending && traces.length === 0 ? (
//                  <div className="flex items-center justify-center h-full">
//                    <div className="animate-pulse text-green-400">準備中...</div>
//                  </div>
//                ) : traces.length > 0 ? (
//                  <ul className="space-y-3">
//                    {traces.map((trace, index) => (
//                      <li 
//                        key={index} 
//                        className={`bg-gray-900 p-3 rounded border-l-4 ${
//                          index === traces.length - 1 && isPending 
//                            ? 'animate-pulse' 
//                            : ''
//                        } ${getTraceColor(trace)}`}
//                      >
//                        <div className="flex">
//                          <span className="mr-2">{getTraceIcon(trace)}</span>
//                          <p className="text-sm text-white">{trace}</p>
//                        </div>
//                        
//                        {/* 最新のトレースに進行中インジケーター表示 */}
//                        {index === traces.length - 1 && isPending && (
//                          <div className="mt-2 w-full bg-gray-700 h-1 rounded-full overflow-hidden">
//                            <div className="bg-green-500 h-1 w-1/3 rounded-full animate-pulse"></div>
//                          </div>
//                        )}
//                      </li>
//                    ))}
//                  </ul>
//                ) : (
//                  <div className="text-gray-400 h-full flex items-center justify-center">
//                    <p>エージェントが実行されると、ここに処理内容が表示されます。</p>
//                  </div>
//                )}
//              </div>
//              
//              {/* トレース情報の説明 */}
//              {traces.length > 0 && (
//                <div className="mt-4 bg-gray-800 p-3 rounded-lg text-xs">
//                  <p className="text-gray-400 mb-2">トレースタイプの説明:</p>
//                  <div className="grid grid-cols-2 gap-2">
//                    <div className="flex items-center">
//                      <span className="mr-1">🤔</span>
//                      <span className="text-blue-400">思考中</span>
//                    </div>
//                    <div className="flex items-center">
//                      <span className="mr-1">🛠️</span>
//                      <span className="text-yellow-400">ツール使用</span>
//                    </div>
//                    <div className="flex items-center">
//                      <span className="mr-1">📋</span>
//                      <span className="text-orange-400">ツール結果</span>
//                    </div>
//                    <div className="flex items-center">
//                      <span className="mr-1">👁️</span>
//                      <span className="text-purple-400">観察</span>
//                    </div>
//                    <div className="flex items-center">
//                      <span className="mr-1">🧠</span>
//                      <span className="text-indigo-400">推論</span>
//                    </div>
//                    <div className="flex items-center">
//                      <span className="mr-1">🔍</span>
//                      <span className="text-green-400">検索開始</span>
//                    </div>
//                  </div>
//                </div>
//              )}
//            </div>
//          </div>
//        </div>
//      </div>
//    </>
//  );
//}
//