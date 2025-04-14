"use client";

import { useState, useRef } from "react";

// トレース項目の型定義
interface TraceItem {
  id: string;
  text: string;
  type: string;
  expanded: boolean;
  details?: string;
  timestamp: Date;
  toolName?: string; // ツール名を追加
  raw?: Record<string, unknown>; // デバッグ用の生データ
}

export function ReviewTraces({ blogContent }: { blogContent: string }) {
  const [result, setResult] = useState("");
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);
  
  // ストリーミング用のAbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  // トレースコンテナへの参照
  const traceContainerRef = useRef<HTMLDivElement | null>(null);
  
  // トレースのタイプを判断する関数
  const getTraceType = (trace: string): string => {
    if (trace.startsWith('思考中:')) return 'thinking';
    if (trace.startsWith('ツール使用:')) return 'tool-call';
    if (trace.startsWith('ツール結果:')) return 'tool-result';
    if (trace.startsWith('観察:')) return 'observation';
    if (trace.startsWith('推論:')) return 'reasoning';
    if (trace.startsWith('検索開始:')) return 'search-start';
    if (trace.startsWith('検索完了')) return 'search-complete';
    if (trace.startsWith('情報取得完了:')) return 'completed';
    if (trace.startsWith('合計トークン数:')) return 'tokens';
    if (trace.startsWith('初期化:')) return 'initial';
    return 'other';
  };
  
  // トレースのアイコンを取得する関数
  const getTraceIcon = (type: string): string => {
    switch (type) {
      case 'thinking': return '🤔';
      case 'tool-call': return '🛠️';
      case 'tool-result': return '📋';
      case 'observation': return '👁️';
      case 'reasoning': return '🧠';
      case 'search-start': return '🔍';
      case 'search-complete': return '✅';
      case 'tokens': return '📊';
      case 'initial': return '🚀';
      case 'error': return '⚠️';
      default: return '📝';
    }
  };
  
  // トレースの色を取得する関数
  const getTraceColor = (type: string): string => {
    switch (type) {
      case 'thinking': return 'border-blue-500';
      case 'tool-call': return 'border-yellow-500';
      case 'tool-result': return 'border-orange-500';
      case 'observation': return 'border-purple-500';
      case 'reasoning': return 'border-indigo-500';
      case 'search-start': return 'border-green-500';
      case 'search-complete': return 'border-teal-500';
      case 'completed': return 'border-green-600';
      case 'tokens': return 'border-green-600';
      case 'initial': return 'border-blue-600';
      case 'error': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };
  
  // トレースの展開/折りたたみを切り替える関数
  const toggleTraceExpanded = (id: string) => {
    setTraces(prevTraces => 
      prevTraces.map(trace => 
        trace.id === id
          ? { ...trace, expanded: !trace.expanded }
          : trace
      )
    );
  };
  
  // 指定された要素までスクロールする関数
  const scrollToBottom = () => {
    if (traceContainerRef.current) {
      traceContainerRef.current.scrollTop = traceContainerRef.current.scrollHeight;
    }
  };
  
  // レビュー処理を開始する関数
  const startReview = async () => {
    if (!blogContent.trim()) return;
    
    // 前回のストリーミングが実行中なら中止
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 状態をリセット
    setTraces([]);
    setResult("");
    setTokens(null);
    setIsLoading(true);
    
    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      // ストリーミングAPIを呼び出す
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: blogContent }),
        signal,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // SSEを処理するための準備
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Response body is null');
      }
      
      let contentBuffer = ''; // 結果を蓄積するバッファ
      
      // ストリームを読み取る
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          break;
        }
        
        // バイトデータをテキストに変換
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        // 各行を処理
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const event = JSON.parse(line);
            console.log('event: ', event);
            
            switch (event.type) {
              case 'content':
                // コンテンツを追加
                contentBuffer += event.content;
                setResult(contentBuffer);
                break;
                
              case 'trace':
                // トレース情報を追加
                if (event.traceType === "initial") {
                  // 1. 標準の初期化トレースを追加
                  const initialTrace: TraceItem = {
                    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-initial`,
                    text: `初期化: ${event.content}`,
                    type: 'initial',
                    expanded: false,
                    timestamp: new Date(),
                  };
                  setTraces(prev => [...prev, initialTrace]);
                  setTimeout(scrollToBottom, 10);

                  // 2. ツール情報があれば、別のtool-callトレースとして追加
                  if (event.toolName && event.query) {
                    const toolCallTrace: TraceItem = {
                      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-toolcall`,
                      text: `ツール使用: ${event.toolName}\n検索クエリ: ${event.query}`,
                      type: 'tool-call',
                      expanded: false,
                      timestamp: new Date(),
                      toolName: event.toolName,
                    };
                    setTraces(prev => [...prev, toolCallTrace]);
                    setTimeout(scrollToBottom, 10);
                  }
                  continue;
                } 
                if (event.traceType === 'tool-results-data') {
                  // ツール結果データを受け取った場合、ツール結果トレースを追加
                  if (event.toolResultsText) {
                    const fullText = event.toolResultsText;
                    const isLongText = fullText.length > 50;
                    
                    const toolResultTrace: TraceItem = {
                      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-toolresult`,
                      text: `ツール結果: ${isLongText ? fullText.substring(0, 50) + '...' : fullText}`,
                      type: 'tool-result',
                      expanded: false, // 初期状態は折りたたみ
                      details: isLongText ? fullText : undefined, // 長い場合のみ詳細を設定
                      timestamp: new Date(),
                    };
                    setTraces(prev => [...prev, toolResultTrace]);
                    setTimeout(scrollToBottom, 10);
                  }
                  continue;
                }
                else if (event.traceType === 'tool-result') {
                  // tool-resultのイベントが来た場合、「検索完了」を表示
                  const searchCompleteTrace: TraceItem = {
                    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-search-complete`,
                    text: `分析完了`,
                    type: 'search-complete',
                    expanded: false,
                    timestamp: new Date()
                  };
                  setTraces(prev => [...prev, searchCompleteTrace]);
                  setTimeout(scrollToBottom, 10);
                  continue;
                }
                else if (event.traceType === 'reasoning') {
                  // 推論プロセスのトレース
                  const reasoningTrace: TraceItem = {
                    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-reasoning`,
                    text: `推論: ${event.content || ""}`,
                    type: 'reasoning',
                    expanded: false,
                    timestamp: new Date()
                  };
                  setTraces(prev => [...prev, reasoningTrace]);
                  setTimeout(scrollToBottom, 10);
                  continue;
                }
                else if (event.traceType === 'thinking') {
                  // 思考プロセスのトレース
                  const thinkingTrace: TraceItem = {
                    id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-thinking`,
                    text: event.content || "思考中...",
                    type: 'thinking',
                    expanded: false,
                    timestamp: new Date()
                  };
                  setTraces(prev => [...prev, thinkingTrace]);
                  setTimeout(scrollToBottom, 10);
                  continue;
                }
                
                // その他のトレースタイプ
                const genericTrace: TraceItem = {
                  id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${event.traceType || "unknown"}`,
                  text: event.content || JSON.stringify(event),
                  type: event.traceType || "unknown",
                  expanded: false,
                  timestamp: new Date()
                };
                setTraces(prev => [...prev, genericTrace]);
                setTimeout(scrollToBottom, 10);
                break;

              case 'status':
                // ステータス情報を追加
                const statusType = getTraceType(event.content);
                setTraces(prev => [
                  ...prev, 
                  {
                    id: `status-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                    text: event.content,
                    type: statusType,
                    expanded: false,
                    timestamp: new Date()
                  }
                ]);
                setTimeout(scrollToBottom, 10);
                break;
                
              case 'usage':
                // トークン使用量を設定
                setTokens(event.totalTokens);
                setTraces(prev => [
                  ...prev, 
                  {
                    id: `tokens-${Date.now()}`,
                    text: `合計トークン数: ${event.totalTokens || "N/A"}`,
                    type: 'tokens',
                    expanded: false,
                    timestamp: new Date()
                  }
                ]);
                setTimeout(scrollToBottom, 10);
                break;
                
              case 'error':
                // エラー情報を追加
                setTraces(prev => [
                  ...prev, 
                  {
                    id: `error-${Date.now()}`,
                    text: `エラー: ${event.content}`,
                    type: 'error',
                    expanded: false,
                    timestamp: new Date()
                  }
                ]);
                setTimeout(scrollToBottom, 10);
                break;
            }
          } catch (error) {
            console.error('Error parsing event:', error, line);
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Streaming error:', error);
        setTraces(prev => [
          ...prev, 
          {
            id: `error-${Date.now()}`,
            text: `接続エラー: ${error.message}`,
            type: 'error',
            expanded: false,
            timestamp: new Date()
          }
        ]);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };
  
  // 処理中止ハンドラー
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setTraces(prev => [
        ...prev, 
        {
          id: `cancel-${Date.now()}`,
          text: '処理が中止されました',
          type: 'error',
          expanded: false,
          timestamp: new Date()
        }
      ]);
      setIsLoading(false);
    }
  };
  
  // すべてのトレースを展開/折りたたむ関数
  const toggleAllTraces = (expand: boolean) => {
    setTraces(prevTraces => 
      prevTraces.map(trace => 
        trace.details ? { ...trace, expanded: expand } : trace
      )
    );
  };
  
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* 左側：レビュー結果表示 (全体の60%) */}
      <div className="w-full lg:w-3/5 bg-gray-800 border border-blue-500 rounded-lg p-6 shadow-lg shadow-blue-500/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-400">AIレビュー結果</h2>
          
          <div className="flex gap-2">
            <button
              onClick={startReview}
              disabled={isLoading || !blogContent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-70 transition-colors duration-200 font-medium"
            >
              {isLoading ? "レビュー中..." : "AIでレビューする"}
            </button>
            
            {isLoading && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                中止
              </button>
            )}
          </div>
        </div>
        
        <div className={`p-6 bg-gray-700 text-white rounded-lg shadow-md border border-blue-500 ${!result && 'h-[300px] flex items-center justify-center'}`}>
          {result ? (
            <div className="whitespace-pre-wrap">{result}</div>
          ) : (
            <p className="text-gray-400">「AIでレビューする」ボタンをクリックすると、ここに結果が表示されます。</p>
          )}
        </div>
      </div>
      
      {/* 右側：エージェントトレース (全体の40%) */}
      <div className="w-full lg:w-2/5 bg-gray-800 border border-blue-500 rounded-lg p-6 shadow-lg shadow-blue-500/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-400 flex items-center">
            エージェントトレース 
            {isLoading && (
              <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-1 ml-2 animate-pulse">
                Now loading...
              </span>
            )}
          </h2>
          
          {/* トレースの展開/折りたたみボタン */}
          {traces.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => toggleAllTraces(true)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                title="すべて展開"
              >
                展開
              </button>
              <button
                onClick={() => toggleAllTraces(false)}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                title="すべて折りたたむ"
              >
                折りたたみ
              </button>
            </div>
          )}
        </div>
        
        <div 
          ref={traceContainerRef}
          className="bg-gray-700 rounded-lg border border-blue-500 p-4 h-[500px] overflow-y-auto trace-container"
        >
          {isLoading && traces.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-blue-400">準備中...</div>
            </div>
          ) : traces.length > 0 ? (
            <ul className="space-y-3">
              {traces.map((trace) => (
                <li 
                  key={trace.id} 
                  className={`bg-gray-800 p-3 rounded border-l-4 ${
                    trace.id === traces[traces.length - 1].id && isLoading 
                      ? 'animate-pulse' 
                      : ''
                  } ${getTraceColor(trace.type)}`}
                >
                  {/* トレースヘッダー - クリックで展開/折りたたみ */}
                  <div 
                    className={`flex items-start ${trace.details ? 'cursor-pointer' : ''}`}
                    onClick={() => trace.details && toggleTraceExpanded(trace.id)}
                  >
                    <span className="mr-2 mt-1">{getTraceIcon(trace.type)}</span>
                    <p className="text-sm text-white flex-grow whitespace-pre-wrap">{trace.text}</p>
                    {trace.details && (
                      <button className="text-gray-400 hover:text-white ml-2 focus:outline-none">
                        {trace.expanded ? 
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg> : 
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        }
                      </button>
                    )}
                  </div>
                  
                  {/* トレース詳細 - 展開時のみ表示 */}
                  {trace.details && trace.expanded && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap bg-gray-850 p-3 rounded overflow-x-auto">
                        {trace.details}
                      </pre>
                    </div>
                  )}
                  
                  {/* タイムスタンプ表示 */}
                  <div className="mt-1 text-right">
                    <span className="text-xs text-gray-500">
                      {trace.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 h-full flex items-center justify-center">
              <p>AIがどう行動したかが表示されます</p>
            </div>
          )}
        </div>
        
        {/* トレース情報の説明 */}
        {traces.length > 0 && (
          <div className="mt-4 bg-gray-700 p-3 rounded-lg text-xs">
            <p className="text-gray-400 mb-2">トレースタイプの説明:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <span className="mr-1">🤔</span>
                <span className="text-blue-400">思考中</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🛠️</span>
                <span className="text-yellow-400">ツール使用</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">📋</span>
                <span className="text-orange-400">ツール結果</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">👁️</span>
                <span className="text-purple-400">観察</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🧠</span>
                <span className="text-indigo-400">推論</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🔍</span>
                <span className="text-green-400">検索開始</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">✓</span>
                <span className="text-teal-400">検索完了</span>
              </div>
            </div>
          </div>
        )}
        
        {/* トークン情報 */}
        {tokens !== null && (
          <div className="mt-4 bg-gray-700 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm text-gray-300">合計トークン:</span>
            <span className="text-lg font-bold text-blue-400">{tokens}</span>
          </div>
        )}
      </div>
    </div>
  );
}
