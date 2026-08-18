import { SearchBar } from '@/components/features/search/SearchBar';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      
      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-3xl">
        <div className="space-y-4">
          <div className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 border border-emerald-500/20 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            HorizonStock AI is in Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-500">
            Automated <span className="text-emerald-400">Intelligence</span> for the Markets
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Instantly analyze 10 years of fundamental data, automatically flagged and scored by our sophisticated Rule Engine.
          </p>
        </div>

        <div className="w-full max-w-md pt-4">
          <SearchBar />
        </div>
      </div>
    </main>
  );
}
