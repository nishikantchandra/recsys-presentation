import React, { useState, useEffect } from 'react';
import VibeSearch from './components/VibeSearch';
import Studio from './components/Studio';
import InventoryManager from './components/InventoryManager';
import ProjectPlan from './components/ProjectPlan';
import EDADashboard from './components/EDA_Dashboard';
import { Product } from './types';
import { INVENTORY } from './constants';
import { loadInventoryFromCache } from './services/storageService';

enum Tab {
  SEARCH = 'search',
  STUDIO = 'studio',
  EDA = 'eda',
  INVENTORY = 'inventory',
  PLAN = 'plan'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SEARCH);
  const [inventory, setInventory] = useState<Product[]>(INVENTORY);
  const [collection, setCollection] = useState<Product[]>([]); // User's saved collection
  const [loadingCache, setLoadingCache] = useState(true);

  // Auto-load from Lock/Cache on startup
  useEffect(() => {
    const initData = async () => {
      try {
        const cached = await loadInventoryFromCache();
        if (cached && cached.length > 0) {
          console.log("Loaded inventory from cache");
          setInventory(cached);
        }
      } catch (error) {
        console.error("Failed to load inventory cache", error);
      } finally {
        setLoadingCache(false);
      }
    };
    initData();
  }, []);

  const addToCollection = (product: Product) => {
    if (!collection.find(p => p.id === product.id)) {
      setCollection([...collection, product]);
      alert(`Added ${product.name} to your collection!`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-chic-blush to-white transition-colors duration-500">
      {/* Sticky Header - Chic & Minimal */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">

            {/* Custom SVG Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => setActiveTab(Tab.SEARCH)}>
              <svg width="200" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-105 transition-transform duration-300">
                <text x="0" y="32" fontFamily="Playfair Display, serif" fontSize="32" fontWeight="800" fill="#2D2D2D" letterSpacing="-0.02em">Style Vibe</text>
                <circle cx="170" cy="12" r="4" fill="#E11D48" className="animate-pulse" />
                <path d="M155 32 L185 32" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </svg>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-1">
              {[
                { id: Tab.SEARCH, label: 'Discover' },
                { id: Tab.STUDIO, label: 'Studio' },
                { id: Tab.EDA, label: 'EDA' },
                { id: Tab.INVENTORY, label: 'Inventory' },
                { id: Tab.PLAN, label: 'Project Plan' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === item.id
                    ? 'bg-chic-rose text-white shadow-md transform scale-105'
                    : 'text-gray-500 hover:text-chic-rose hover:bg-pink-50'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 py-3 px-6 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {[
            { id: Tab.SEARCH, icon: '✨', label: 'Discover' },
            { id: Tab.STUDIO, icon: '🎨', label: 'Studio' },
            { id: Tab.EDA, icon: '📊', label: 'EDA' },
            { id: Tab.INVENTORY, icon: '📦', label: 'Data' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${activeTab === item.id ? 'text-chic-rose bg-pink-50' : 'text-gray-400'}`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow pb-24 md:pb-12 pt-6 px-4">
        {loadingCache && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-chic-rose"></div>
          </div>
        )}

        <div className={activeTab === Tab.SEARCH ? 'block animate-fade-in-up' : 'hidden'}>
          <VibeSearch inventory={inventory} onAddToCollection={addToCollection} />
        </div>
        <div className={activeTab === Tab.STUDIO ? 'block animate-fade-in-up' : 'hidden'}>
          <Studio collection={collection} />
        </div>
        <div className={activeTab === Tab.EDA ? 'block animate-fade-in-up' : 'hidden'}>
          <EDADashboard inventory={inventory} />
        </div>
        <div className={activeTab === Tab.INVENTORY ? 'block animate-fade-in-up' : 'hidden'}>
          <InventoryManager currentInventory={inventory} onUpdateInventory={setInventory} />
        </div>
        <div className={activeTab === Tab.PLAN ? 'block animate-fade-in-up' : 'hidden'}>
          <ProjectPlan />
        </div>
      </main>

      <footer className="hidden md:block bg-white border-t border-pink-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-serif text-2xl font-bold text-chic-dark mb-2 tracking-widest">STYLYST.</p>
          <p className="text-chic-text text-sm">
            The LLM-Powered Fashion Vibe Matcher
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;