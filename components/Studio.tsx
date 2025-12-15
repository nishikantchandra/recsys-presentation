import React, { useState } from 'react';
import { Product } from '../types';
import { analyzeImageWithAnnotations, getFashionTrends, virtualTryOn, AnnotatedAnalysis } from '../services/geminiService';

interface StudioProps {
    collection: Product[];
}

const Studio: React.FC<StudioProps> = ({ collection }) => {
    const [activeTab, setActiveTab] = useState<'analyze' | 'tryon' | 'trends' | 'collection'>('analyze');

    // --- ANALYZE STATE ---
    const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<AnnotatedAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- TRY-ON STATE ---
    const [tryOnPhoto, setTryOnPhoto] = useState<File | null>(null);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);
    const [tryOnResult, setTryOnResult] = useState<string | null>(null);
    const [isTryingOn, setIsTryingOn] = useState(false);

    // --- TRENDS STATE ---
    const [trendQuery, setTrendQuery] = useState('');
    const [trendResponse, setTrendResponse] = useState<{ text?: string, groundingMetadata?: any } | null>(null);
    const [isTrendLoading, setIsTrendLoading] = useState(false);

    // --- ANALYZE LOGIC ---
    const handleAnalyze = async () => {
        if (!analyzeFile) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeImageWithAnnotations(analyzeFile);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Analysis failed. The AI service may be temporarily unavailable.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- TRY-ON LOGIC ---
    const handleTryOn = async () => {
        if (!tryOnPhoto || !selectedItem) return;
        setIsTryingOn(true);
        setTryOnResult(null);
        try {
            const result = await virtualTryOn(
                tryOnPhoto,
                selectedItem.image,
                selectedItem.name,
                selectedItem.category || 'clothing'
            );
            setTryOnResult(result);
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Virtual try-on failed. Please try again.");
        } finally {
            setIsTryingOn(false);
        }
    };

    // --- TRENDS LOGIC ---
    const handleTrendSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trendQuery) return;
        setIsTrendLoading(true);
        try {
            const data = await getFashionTrends(trendQuery);
            setTrendResponse(data);
        } catch (e) {
            console.error(e);
            alert("Trend search failed. The AI service may be temporarily unavailable.");
        } finally {
            setIsTrendLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 animate-fade-in-up">
            {/* Studio Header */}
            <div className="text-center mb-8">
                <h2 className="text-5xl font-serif font-bold text-chic-dark">The Studio</h2>
                <p className="text-gray-500 mt-2">Analyze outfits, try on clothes, and discover trends with AI.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 space-x-2 flex-wrap gap-2">
                {[
                    { id: 'analyze', label: 'Style Scanner', icon: '📸' },
                    { id: 'tryon', label: 'Virtual Try-On', icon: '👗' },
                    { id: 'trends', label: 'Trend Radar', icon: '🌍' },
                    { id: 'collection', label: 'My Collection', icon: '💼' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-3 rounded-full font-bold transition-all duration-300 flex items-center ${activeTab === tab.id
                            ? 'bg-chic-rose text-white shadow-lg scale-105'
                            : 'bg-white text-gray-500 hover:bg-pink-50'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span> {tab.label}
                        {tab.id === 'collection' && collection.length > 0 && (
                            <span className="ml-2 bg-white text-chic-rose text-xs font-bold px-2 py-0.5 rounded-full">
                                {collection.length}
                            </span>
                        )}
                        {tab.id === 'tryon' && (
                            <span className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">NANO BANANA</span>
                        )}
                    </button>
                ))}
            </div>

            {/* --- STYLE SCANNER TAB --- */}
            {activeTab === 'analyze' && (
                <div className="grid lg:grid-cols-2 gap-8 animate-fade-in-up">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[500px]">
                        {!analyzeFile ? (
                            <label className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition p-12">
                                <span className="text-4xl mb-4">📸</span>
                                <span className="font-bold text-gray-600">Upload Outfit to Analyze</span>
                                <span className="text-sm text-gray-400 mt-2">Click to browse</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setAnalyzeFile(e.target.files?.[0] || null)} />
                            </label>
                        ) : (
                            <div className="w-full flex flex-col items-center">
                                <img src={URL.createObjectURL(analyzeFile)} alt="Preview" className="max-h-[400px] rounded-xl shadow-sm mb-6" />
                                <div className="flex space-x-4 w-full">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="flex-1 bg-chic-dark text-white py-3 rounded-xl font-bold hover:bg-chic-rose transition disabled:opacity-50"
                                    >
                                        {isAnalyzing ? 'Scanning...' : 'Analyze Look'}
                                    </button>
                                    <button
                                        onClick={() => { setAnalyzeFile(null); setAnalysis(null); }}
                                        className="px-6 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden min-h-[500px] relative">
                        {analyzeFile && (
                            <img
                                src={URL.createObjectURL(analyzeFile)}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${analysis ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                            />
                        )}

                        {/* Loading State */}
                        {isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                                <div className="w-16 h-16 border-4 border-chic-rose border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-white font-mono text-sm">ANALYZING OUTFIT...</p>
                            </div>
                        )}

                        {analysis && !isAnalyzing && (
                            <div className="relative z-10 p-8 h-full overflow-y-auto">
                                <div className="bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full inline-block mb-8 border border-chic-rose/50">
                                    <span className="text-chic-rose font-bold mr-2">VIBE:</span> {analysis.main_vibe}
                                </div>
                                <div className="space-y-4">
                                    {analysis.items.map((item, i) => (
                                        <div key={i} className="bg-white/90 backdrop-blur p-4 rounded-xl border-l-4 border-chic-rose shadow-lg">
                                            <h4 className="font-bold text-chic-dark">{item.item_name}</h4>
                                            <p className="text-sm text-gray-600">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!analyzeFile && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white/30 font-serif text-2xl italic">
                                    Upload an image to analyze...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- VIRTUAL TRY-ON TAB --- */}
            {activeTab === 'tryon' && (
                <div className="animate-fade-in-up">
                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                        {/* Left: Upload Your Photo */}
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Your Photo</h3>
                                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-1 rounded font-bold">NANO BANANA</span>
                            </div>

                            <div className="border-2 border-dashed border-pink-200 rounded-2xl min-h-[350px] flex flex-col items-center justify-center bg-pink-50/30 cursor-pointer hover:bg-pink-50 transition overflow-hidden relative">
                                {tryOnPhoto ? (
                                    <>
                                        <img src={URL.createObjectURL(tryOnPhoto)} alt="Your photo" className="max-h-[320px] object-contain" />
                                        <button
                                            onClick={() => { setTryOnPhoto(null); setTryOnResult(null); }}
                                            className="absolute top-3 right-3 bg-white/80 p-2 rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition shadow"
                                        >
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-8">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-chic-rose">
                                            <span className="text-3xl">📷</span>
                                        </div>
                                        <span className="font-serif text-lg text-gray-600 block mb-1">Upload Your Photo</span>
                                        <span className="text-xs text-gray-400">A full-body or upper-body photo works best</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                setTryOnPhoto(e.target.files?.[0] || null);
                                                setTryOnResult(null);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Right: Select Item from Collection */}
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                            <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm mb-4">Select Item to Try On</h3>

                            {collection.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl min-h-[350px] flex flex-col items-center justify-center text-center p-8">
                                    <span className="text-5xl mb-4">💼</span>
                                    <h4 className="font-bold text-gray-600 mb-2">Collection Empty</h4>
                                    <p className="text-sm text-gray-400">
                                        Go to <strong>Discover</strong> tab and add items to your collection first!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto p-2">
                                    {collection.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => { setSelectedItem(item); setTryOnResult(null); }}
                                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedItem?.id === item.id
                                                    ? 'border-chic-rose ring-2 ring-pink-200 scale-105'
                                                    : 'border-gray-100 hover:border-pink-200'
                                                }`}
                                        >
                                            <div className="aspect-square overflow-hidden bg-gray-100">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/150x150?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                            <div className="p-2 bg-white">
                                                <p className="text-xs font-medium text-gray-700 truncate">{item.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedItem && (
                                <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected</p>
                                    <p className="font-bold text-chic-dark">{selectedItem.name}</p>
                                    <p className="text-xs text-gray-400">{selectedItem.category}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Try It On Button */}
                    <div className="text-center mb-8">
                        <button
                            onClick={handleTryOn}
                            disabled={!tryOnPhoto || !selectedItem || isTryingOn}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isTryingOn ? (
                                <span className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                    Generating Try-On...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <span className="mr-2">🎨</span> Try It On!
                                </span>
                            )}
                        </button>
                        {(!tryOnPhoto || !selectedItem) && (
                            <p className="text-gray-400 text-sm mt-3">
                                {!tryOnPhoto && !selectedItem && "Upload your photo and select an item to try on"}
                                {!tryOnPhoto && selectedItem && "Upload your photo first"}
                                {tryOnPhoto && !selectedItem && "Select an item from your collection"}
                            </p>
                        )}
                    </div>

                    {/* Result Section */}
                    {(isTryingOn || tryOnResult) && (
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                            <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm mb-6 text-center">AI Generated Result</h3>

                            <div className="flex justify-center">
                                {isTryingOn ? (
                                    <div className="min-h-[400px] flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 border-4 border-pink-200 border-t-chic-rose rounded-full animate-spin mb-6"></div>
                                        <p className="font-serif text-xl text-chic-dark animate-pulse">Creating your virtual try-on...</p>
                                        <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
                                    </div>
                                ) : tryOnResult ? (
                                    <div className="flex flex-col items-center">
                                        <img
                                            src={tryOnResult}
                                            alt="Virtual Try-On Result"
                                            className="max-h-[500px] rounded-2xl shadow-lg"
                                        />
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = tryOnResult;
                                                link.download = 'stylyst-tryon.png';
                                                link.click();
                                            }}
                                            className="mt-6 px-8 py-3 bg-chic-dark text-white rounded-xl font-medium hover:bg-chic-rose transition flex items-center"
                                        >
                                            <span className="mr-2">💾</span> Download Image
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TREND RADAR TAB --- */}
            {activeTab === 'trends' && (
                <div className="max-w-4xl mx-auto animate-fade-in-up">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="p-8 bg-gradient-to-br from-pink-50 to-white border-b border-pink-100">
                            <form onSubmit={handleTrendSearch} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={trendQuery}
                                    onChange={(e) => setTrendQuery(e.target.value)}
                                    placeholder="Ask about 2025 fashion trends..."
                                    className="w-full p-5 pr-32 rounded-2xl border border-gray-200 focus:border-chic-rose focus:ring-2 focus:ring-pink-100 text-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={isTrendLoading}
                                    className="absolute right-2 bg-chic-dark text-white px-6 py-3 rounded-xl font-medium hover:bg-chic-rose transition disabled:opacity-70"
                                >
                                    {isTrendLoading ? '...' : 'Search'}
                                </button>
                            </form>
                        </div>
                        <div className="p-10 min-h-[300px]">
                            {trendResponse ? (
                                <div className="prose prose-lg max-w-none text-gray-700">
                                    {trendResponse.text?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                                </div>
                            ) : (
                                <div className="text-center text-gray-300 py-20">
                                    <span className="text-6xl block mb-4">🌍</span>
                                    <p className="text-gray-500">Ask about fashion trends, seasonal styles, or color predictions.</p>
                                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                                        {['Summer 2025 trends', 'Sustainable fashion', 'Y2K style comeback', 'Minimalist wardrobe'].map(q => (
                                            <button
                                                key={q}
                                                onClick={() => setTrendQuery(q)}
                                                className="px-4 py-2 bg-pink-50 text-chic-rose rounded-full text-sm font-medium hover:bg-pink-100 transition"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MY COLLECTION TAB --- */}
            {activeTab === 'collection' && (
                <div className="animate-fade-in-up">
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                        {collection.length === 0 ? (
                            <div className="text-center py-20">
                                <span className="text-6xl block mb-4">💼</span>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Your Collection is Empty</h3>
                                <p className="text-gray-500">
                                    Go to <strong>Discover</strong> and click "Add to Collection" on items you like.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-serif font-bold text-2xl text-chic-dark">My Saved Items</h3>
                                    <span className="bg-pink-100 text-chic-rose px-3 py-1 rounded-full text-sm font-bold">
                                        {collection.length} items
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {collection.map(item => (
                                        <div
                                            key={item.id}
                                            className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                                        >
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x400?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-medium text-gray-800 text-sm truncate">{item.name}</h4>
                                                <p className="text-xs text-gray-400 truncate">{item.category}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Studio;

