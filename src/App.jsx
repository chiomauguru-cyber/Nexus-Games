import React, { useState, useMemo } from 'react';
import { Search, Gamepad2, X, Maximize2, ExternalLink, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './data/games.json';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(gamesData.map(g => g.category))];
    return cats;
  }, []);

  const filteredGames = useMemo(() => {
    return gamesData.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                setSelectedGame(null);
                setActiveCategory('All');
                setSearchQuery('');
              }}
            >
              <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                NEXUS<span className="text-emerald-500">GAMES</span>
              </h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search games..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat 
                        ? 'bg-emerald-500 text-black' 
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Mobile Search */}
              <div className="md:hidden relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search games..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {filteredGames.map((game) => (
                  <motion.div
                    key={game.id}
                    layoutId={game.id}
                    className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/50 transition-all cursor-pointer aspect-[4/3]"
                    onClick={() => setSelectedGame(game)}
                    whileHover={{ y: -4 }}
                  >
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                      <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">
                        {game.category}
                      </span>
                      <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {game.title}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredGames.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-zinc-500 italic">No games found matching your search.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="player"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-[calc(100vh-12rem)]"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Games</span>
                </button>
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-emerald-500 hidden sm:block">
                    {selectedGame.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Fullscreen"
                      onClick={() => {
                        const iframe = document.getElementById('game-iframe');
                        if (iframe?.requestFullscreen) iframe.requestFullscreen();
                      }}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors text-red-500"
                      onClick={() => setSelectedGame(null)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                <iframe
                  id="game-iframe"
                  src={selectedGame.iframeUrl}
                  className="w-full h-full border-none"
                  allow="autoplay; fullscreen; pointer-lock"
                  title={selectedGame.title}
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <p>Playing: <span className="text-zinc-300">{selectedGame.title}</span></p>
                <p>Category: <span className="text-zinc-300">{selectedGame.category}</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} Nexus Unblocked Games. All games are property of their respective owners.
          </p>
        </div>
      </footer>
    </div>
  );
}
