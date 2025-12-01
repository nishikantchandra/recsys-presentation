import React, { useState } from 'react';
import { getFashionTrends } from '../services/geminiService';

const TrendSpotter: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<{text?: string, groundingMetadata?: any} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrendSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setResponse(null);
    try {
      const data = await getFashionTrends(query);
      setResponse(data);
    } catch (e) {
      console.error(e);
      alert("Error fetching trends");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-5xl font-serif font-bold mb-4 text-chic-dark">Trend Radar</h2>
        <div className="h-1 w-24 bg-chic-rose mx-auto mb-6"></div>
        <p className="text-gray-500 font-light text-lg">Real-time fashion intelligence grounded in Google Search data.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 bg-gradient-to-br from-pink-50 to-white border-b border-pink-100">
            <form onSubmit={handleTrendSearch} className="relative flex items-center">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about 2025 Summer Trends, Street Style, etc..."
                className="w-full p-5 pr-32 rounded-2xl border border-gray-200 focus:border-chic-rose focus:ring-2 focus:ring-pink-100 text-gray-800 placeholder-gray-400 shadow-sm text-lg bg-white"
                />
                <button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 bg-chic-dark text-white px-6 py-3 rounded-xl font-medium hover:bg-chic-rose transition-colors shadow-md disabled:opacity-70"
                >
                {loading ? 'Scanning...' : 'Spot Trends'}
                </button>
            </form>
        </div>

        <div className="p-10 min-h-[300px]">
            {loading && (
                <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-32 bg-gray-100 rounded-xl mt-6"></div>
                </div>
            )}

            {!loading && !response && (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <span className="text-6xl mb-4 opacity-50">🌍</span>
                    <p className="font-serif text-xl">Global fashion data at your fingertips.</p>
                </div>
            )}

            {response && (
                <div className="animate-fade-in-up">
                    <div className="prose prose-lg prose-headings:font-serif prose-a:text-chic-rose max-w-none text-gray-700 leading-loose">
                         {/* Rendering markdown-like text with line breaks */}
                         {response.text?.split('\n').map((line, i) => (
                             <p key={i} className="mb-4">{line}</p>
                         ))}
                    </div>
                    
                    {response.groundingMetadata?.groundingChunks && (
                        <div className="mt-10 pt-8 border-t border-dashed border-gray-200">
                            <h4 className="font-serif font-bold text-lg text-chic-dark mb-4 flex items-center">
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded mr-2">VERIFIED SOURCES</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {response.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                                    if (chunk.web?.uri) {
                                        return (
                                            <a 
                                                key={i} 
                                                href={chunk.web.uri} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="group flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                                            >
                                                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-100 mr-3 group-hover:border-chic-rose group-hover:text-chic-rose transition-colors">↗</span>
                                                <span className="text-sm text-gray-600 truncate font-medium group-hover:text-chic-dark">
                                                    {chunk.web.title || "Web Source"}
                                                </span>
                                            </a>
                                        )
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrendSpotter;