import React, { useState, useRef } from 'react';
import { getStylistRecommendations, generateStylistSpeech } from '../services/geminiService';
import { RecommendationResponse, Product } from '../types';

interface VibeSearchProps {
  inventory: Product[];
  onAddToCollection?: (product: Product) => void;
}

const VibeSearch: React.FC<VibeSearchProps> = ({ inventory, onAddToCollection }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // For Modal

  // Animation State
  // 0: Idle, 1: Vector Encoding, 2: Retrieval, 3: Ranking, 4: Verdict
  const [pipelineStage, setPipelineStage] = useState(0);

  // Ref to track the current search session
  const searchIdRef = useRef<number>(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Start new session
    const currentSearchId = Date.now();
    searchIdRef.current = currentSearchId;

    setLoading(true);
    setResult(null);
    setPipelineStage(1); // Start Animation

    try {
      // Parallel execution: API call + Minimum Animation Delay
      const apiPromise = getStylistRecommendations(query, inventory);

      // Force 4.5s animation sequence
      // Stage 1: Vector Encoding (0-1.5s)
      await new Promise(r => setTimeout(r, 1500));
      if (searchIdRef.current !== currentSearchId) return;
      setPipelineStage(2); // Retrieval

      // Stage 2: Retrieval (1.5s-3.0s)
      await new Promise(r => setTimeout(r, 1500));
      if (searchIdRef.current !== currentSearchId) return;
      setPipelineStage(3); // Ranking

      // Stage 3: Ranking (3.0s-4.5s)
      await new Promise(r => setTimeout(r, 1500));
      if (searchIdRef.current !== currentSearchId) return;

      // Wait for API if it's taking longer than 4.5s
      const data = await apiPromise;

      setPipelineStage(4); // Verdict

      // Only update if this is still the active search
      if (searchIdRef.current === currentSearchId) {
        setResult(data);
        setLoading(false);
        setPipelineStage(0); // Reset
      }
    } catch (error: any) {
      if (searchIdRef.current === currentSearchId) {
        console.error(error);
        setLoading(false);
        setPipelineStage(0);

        if (error.message === 'MISSING_API_KEY') {
          alert("⚠️ API Key Missing! \n\nPlease create a .env.local file in the project root and add:\nVITE_GEMINI_API_KEY=your_actual_api_key_here\n\nThen restart the server.");
        } else {
          alert("The Stylist is currently busy. Please check the console for details.");
        }
      }
    }
  };

  const handleStop = () => {
    // Invalidate the current search ID so pending promises are ignored
    searchIdRef.current = 0;
    setLoading(false);
    setPipelineStage(0);
  };

  const playSummary = async () => {
    if (!result || isPlaying) return;
    setIsPlaying(true);
    try {
      const audioBuffer = await generateStylistSpeech(result.stylist_summary);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (e) {
      console.error("TTS Error", e);
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 pt-8">
        <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-chic-rose text-xs font-bold tracking-widest uppercase mb-4">
          AI Powered Stylist
        </span>
        <h2 className="text-5xl md:text-6xl font-serif font-bold text-chic-dark mb-6 leading-tight">
          Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-chic-rose to-chic-gold">Vibe</span>.
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto font-light">
          Searching <span className="font-semibold text-chic-dark">{inventory.length} items</span>.
          Tell us the occasion, the mood, or the aesthetic you dream of.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-16 relative max-w-2xl mx-auto group">
        <div className="absolute inset-0 bg-pink-200 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative flex items-center bg-white rounded-full shadow-xl border border-pink-100 p-2 transition-all duration-300 focus-within:shadow-2xl focus-within:border-chic-rose focus-within:ring-4 focus-within:ring-pink-50">
          <div className="pl-6 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your look (e.g., 'Parisian chic brunch')"
            className="w-full p-4 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-lg font-medium rounded-full"
          />

          {loading ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-white border-2 border-chic-rose text-chic-rose px-8 py-3 rounded-full font-bold tracking-wide hover:bg-pink-50 transition-all duration-300 shadow-md flex items-center"
            >
              <span className="w-3 h-3 bg-chic-rose rounded-sm mr-2 animate-pulse"></span>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              className="bg-chic-rose text-white px-8 py-3 rounded-full font-bold tracking-wide hover:bg-pink-700 transition-all duration-300 shadow-md transform hover:scale-105 active:scale-95"
            >
              Style Me
            </button>
          )}
        </div>
      </form>

      {/* Glass Box Pipeline Animation */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 animate-fade-in-up">
          <div className="w-full max-w-3xl bg-white/50 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-8 relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-chic-rose to-purple-500 transition-all duration-500" style={{ width: `${(pipelineStage / 3) * 100}%` }}></div>

            <div className="grid grid-cols-3 gap-4 text-center relative z-10">
              {/* Stage 1: Vector Encoding */}
              <div className={`transition-all duration-500 ${pipelineStage >= 1 ? 'opacity-100 transform scale-105' : 'opacity-40 grayscale'}`}>
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-3 shadow-sm border border-blue-100">
                  <span className="text-2xl animate-pulse">🔢</span>
                </div>
                <h4 className="font-bold text-chic-dark text-sm">Vector Encoding</h4>
                <p className="text-xs text-gray-500 mt-1">Translating query to 512d space</p>
              </div>

              {/* Stage 2: Retrieval */}
              <div className={`transition-all duration-500 ${pipelineStage >= 2 ? 'opacity-100 transform scale-105' : 'opacity-40 grayscale'}`}>
                <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center mb-3 shadow-sm border border-purple-100">
                  <span className="text-2xl animate-bounce">🔍</span>
                </div>
                <h4 className="font-bold text-chic-dark text-sm">Semantic Retrieval</h4>
                <p className="text-xs text-gray-500 mt-1">Scanning {inventory.length} items</p>
              </div>

              {/* Stage 3: Ranking */}
              <div className={`transition-all duration-500 ${pipelineStage >= 3 ? 'opacity-100 transform scale-105' : 'opacity-40 grayscale'}`}>
                <div className="w-16 h-16 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-3 shadow-sm border border-pink-100">
                  <span className="text-2xl animate-pulse">⭐</span>
                </div>
                <h4 className="font-bold text-chic-dark text-sm">Vibe Ranking</h4>
                <p className="text-xs text-gray-500 mt-1">Scoring aesthetic match</p>
              </div>
            </div>

            {/* Connecting Lines */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 transform -translate-y-8"></div>
          </div>
          <p className="mt-6 font-mono text-xs text-gray-400 animate-pulse">PROCESSING PIPELINE...</p>
        </div>
      )}

      {/* Results Section */}
      {result && !loading && (
        <div className="space-y-10 animate-fade-in-up">
          {/* Summary Box */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-pink-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-chic-dark mb-3 flex items-center">
                    <span className="text-3xl mr-2">👗</span> Stylist's Verdict
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed italic font-light">
                    "{result.stylist_summary}"
                  </p>
                </div>
                <button
                  onClick={playSummary}
                  disabled={isPlaying}
                  className={`ml-6 p-4 rounded-full transition-all duration-300 shadow-sm ${isPlaying ? 'bg-pink-100 text-chic-rose animate-pulse' : 'bg-gray-50 text-gray-600 hover:bg-chic-rose hover:text-white hover:shadow-md'}`}
                  title="Listen to Stylist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none" /><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Recommendation Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {result.recommendations.map((rec, index) => {
              const product = inventory.find(p => p.id === rec.item_id);
              if (!product) return null;
              return (
                <div
                  key={rec.item_id}
                  onClick={() => setSelectedProduct(product)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-pink-100 flex flex-col h-full cursor-pointer"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x500?text=No+Image';
                      }}
                    />
                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-chic-dark px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider border border-gray-100">
                      Top Pick #{rec.rank}
                    </div>
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Add to Collection Button (Hover) */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent modal opening
                          onAddToCollection && onAddToCollection(product);
                        }}
                        className="bg-white text-chic-dark px-6 py-2 rounded-full font-bold shadow-lg hover:bg-chic-rose hover:text-white transition-colors flex items-center"
                      >
                        <span className="mr-2">+</span> Add to Collection
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-serif font-bold text-xl text-chic-dark leading-tight">{product.name}</h4>
                      <span className="text-sm font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">{product.price}</span>
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100">
                        <p className="text-xs font-bold text-chic-rose uppercase mb-2 tracking-wider flex items-center">
                          <span className="mr-1">✨</span> Why it works
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {rec.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Detail / EDA Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row overflow-hidden">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition shadow-sm"
            >
              ✕
            </button>

            {/* Image Side */}
            <div className="md:w-1/2 bg-gray-100 relative min-h-[400px]">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                <h3 className="text-3xl font-serif font-bold">{selectedProduct.name}</h3>
                <p className="opacity-80">{selectedProduct.category}</p>
              </div>
            </div>

            {/* Analytics Side */}
            <div className="md:w-1/2 p-8 flex flex-col">
              <div className="mb-6">
                <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded mb-2">EDA ANALYTICS</span>
                <h4 className="font-bold text-gray-800 text-xl mb-2">Item DNA</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedProduct.description}</p>
              </div>

              {/* Simulated Charts/Stats */}
              <div className="space-y-6 flex-grow">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                    <span>VIBE MATCH SCORE</span>
                    <span>94%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-chic-rose h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-400 font-bold uppercase">Seasonality</div>
                    <div className="text-lg font-bold text-chic-dark">Summer/Spring</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-400 font-bold uppercase">Material</div>
                    <div className="text-lg font-bold text-chic-dark">Cotton Blend</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-400 font-bold uppercase mb-2">Embedding Vector (t-SNE Projection)</div>
                  <div className="flex items-center space-x-1 h-12">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-400 rounded-sm opacity-50"
                        style={{ height: `${Math.random() * 100}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    onAddToCollection && onAddToCollection(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-chic-dark text-white py-4 rounded-xl font-bold hover:bg-chic-rose transition shadow-lg flex items-center justify-center"
                >
                  <span className="mr-2 text-xl">+</span> Add to Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VibeSearch;