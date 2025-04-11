import { StreamingTech } from "../conponents/StreamingTech";

export default function StreamingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8 text-green-500">ブログ執筆支援エージェント (ストリーミング版)</h1>
      <StreamingTech />
    </div>
  );
}
