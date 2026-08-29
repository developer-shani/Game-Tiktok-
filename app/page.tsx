'use client';

import dynamic from 'next/dynamic';

const LaserBattleRoyale = dynamic(() => import('@/components/LaserBattleRoyale'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium tracking-wide text-zinc-400">Loading Laser Arena...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      <LaserBattleRoyale />
    </main>
  );
}


