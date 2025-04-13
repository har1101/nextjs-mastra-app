import { redirect } from 'next/navigation';

// This page is now redundant as the streaming version is available at the root path
export default function StreamingPage() {
  // Redirect to the root path
  redirect('/');
  
  // This won't be rendered due to the redirect
  return null;
}

// Original streaming page implementation (commented out)
// import { StreamingTech } from "../conponents/StreamingTech";
// 
// export default function StreamingPage() {
//   return (
//     <div className="min-h-screen flex flex-col items-center p-8">
//       <h1 className="text-3xl font-bold mb-8 text-green-500">ブログ執筆支援エージェント (ストリーミング版)</h1>
//       <StreamingTech />
//     </div>
//   );
// }
