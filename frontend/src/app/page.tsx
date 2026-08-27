'use client';
import { SearchBar } from '@/components/features/search/SearchBar';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-chart-2/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <motion.div 
        className="z-10 flex flex-col items-center text-center space-y-10 max-w-4xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="space-y-6" variants={itemVariants}>
          <div className="inline-block rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary border border-primary/20 shadow-[0_0_20px_var(--color-primary)] backdrop-blur-md">
            ✨ HorizonStock AI Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground drop-shadow-md leading-[1.1]">
            Master the Indian <br className="hidden md:block" />
            <span className="text-gradient drop-shadow-lg">
              Stock Market
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Unlock institutional-grade analysis for NSE & BSE stocks with our automated 34-rule engine.
          </p>
        </motion.div>

        <motion.div className="w-full max-w-2xl pt-4" variants={itemVariants}>
          <SearchBar />
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <span className="text-muted-foreground font-medium">Trending:</span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['RELIANCE', 'TCS', 'HDFCBANK', 'IRFC'].map((symbol) => (
                <Link key={symbol} href={`/stock/${symbol}`}>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-card px-4 py-2 rounded-full text-foreground/80 hover:text-primary hover:border-primary/50 shadow-sm font-medium tracking-wide"
                  >
                    {symbol}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Gainers Navigation Button */}
          <div className="mt-12 flex items-center justify-center">
            <Link href="/top-gainers">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 text-sm font-semibold text-primary border border-primary/20 shadow-[0_0_20px_var(--color-primary)] backdrop-blur-md hover:bg-primary/20 transition-all cursor-pointer"
              >
                <span className="text-lg">🔥</span>
                View Today's Top Gainers
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
