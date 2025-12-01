import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { editFashionImage, analyzeImageWithAnnotations, getFashionTrends, AnnotatedAnalysis } from '../services/geminiService';

interface StudioProps {
    collection: Product[];
}

const Studio: React.FC<StudioProps> = ({ collection }) => {
    const [activeTab, setActiveTab] = useState<'tryon' | 'analyze' | 'trends'>('tryon');

    // --- TRY-ON STATE ---
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [modelPreview, setModelPreview] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);
    const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // --- ANALYZE STATE ---
    const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<AnnotatedAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- TRENDS STATE ---
    const [trendQuery, setTrendQuery] = useState('');
    const [trendResponse, setTrendResponse] = useState<{ text?: string, groundingMetadata?: any } | null>(null);
    const [isTrendLoading, setIsTrendLoading] = useState(false);

    // --- TRY-ON LOGIC ---
    const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setModelFile(file);
            setModelPreview(URL.createObjectURL(file));
            setGeneratedImage(null);
        }
    };

    // Draw Composite to Canvas
    useEffect(() => {
        if (!canvasRef || !modelPreview) return;
        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = modelPreview;
        img.onload = () => {
            canvasRef.width = 500;
            canvasRef.height = (img.height / img.width) * 500;
            ctx.drawImage(img, 0, 0, canvasRef.width, canvasRef.height);

            if (selectedItem) {
                const itemImg = new Image();
                itemImg.crossOrigin = "anonymous"; // Needed for external images
                itemImg.src = selectedItem.image;
                itemImg.onload = () => {
                    // Draw item roughly in center/chest area (simplified)
                    const w = 200;
                    const h = (itemImg.height / itemImg.width) * 200;
                    ctx.drawImage(itemImg, (canvasRef.width - w) / 2, canvasRef.height * 0.3, w, h);
                };
            }
        };
    }, [modelPreview, selectedItem, canvasRef]);

    const handleAiTryOn = async () => {
        if (!canvasRef || !editPrompt) return;
        setIsEditing(true);
        try {
            // Convert canvas to File
            const blob = await new Promise<Blob | null>(r => canvasRef.toBlob(r, 'image/png'));
            if (!blob) throw new Error("Canvas error");
            const file = new File([blob], "composite.png", { type: "image/png" });

            const result = await editFashionImage(file, editPrompt);
            setGeneratedImage(result);
        } catch (e) {
            console.error(e);
            alert("Try-On failed. Please check API Key.");
        } finally {
            setIsEditing(false);
        }
    };

    // --- ANALYZE LOGIC ---
    const handleAnalyze = async () => {
        if (!analyzeFile) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeImageWithAnnotations(analyzeFile);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Analysis failed");
        } finally {
            setIsAnalyzing(false);
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
            alert("Trend search failed");
        } finally {
            setIsTrendLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 animate-fade-in-up">
            {/* Studio Header */}
            <div className="text-center mb-8">
                <h2 className="text-5xl font-serif font-bold text-chic-dark">The Studio</h2>
                <p className="text-gray-500 mt-2">Create, Analyze, and Discover in one place.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 space-x-4">
                {[
                    { id: 'tryon', label: 'Virtual Try-On', icon: '🎨' },
                    { id: 'analyze', label: 'Style Scanner', icon: '📸' },
                    { id: 'trends', label: 'Trend Radar', icon: '🌍' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 rounded-full font-bold transition-all duration-300 flex items-center ${activeTab === tab.id
                                ? 'bg-chic-rose text-white shadow-lg scale-105'
                                : 'bg-white text-gray-500 hover:bg-pink-50'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* --- VIRTUAL TRY-ON TAB --- */}
            {activeTab === 'tryon' && (
                <div className="grid lg:grid-cols-12 gap-6 animate-fade-in-up">
                    {/* Left: Wardrobe & Collection */}
                    <div className="lg:col-span-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-[600px] overflow-y-auto">
                        <h3 className="font-bold text-chic-dark mb-4 sticky top-0 bg-white pb-2 border-b">My Collection</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {collection.length === 0 && (
                                <p className="col-span-2 text-xs text-gray-400 italic text-center py-4">
                                    No items saved. Go to "Curate" to add items.
                                </p>
                            )}
                            {collection.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedItem?.id === item.id ? 'border-chic-rose ring-2 ring-pink-100' : 'border-transparent hover:border-gray-200'}`}
                                >
                                    <img src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Canvas / Preview */}
                    <div className="lg:col-span-6 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col items-center justify-center relative min-h-[600px]">
                        {!modelPreview ? (
                            <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-100 transition">
                                <span className="text-4xl mb-2">👤</span>
                                <span className="font-bold text-gray-500">Upload Your Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleModelUpload} />
                            </label>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Hidden Canvas for Processing */}
                                <canvas ref={setCanvasRef} className="hidden" />

                                {/* Visual Preview */}
                                <div className="relative max-w-full max-h-[550px] shadow-2xl rounded-lg overflow-hidden">
                                    <img src={modelPreview} alt="Model" className="max-h-[550px] object-contain" />
                                    {selectedItem && (
                                        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-40 pointer-events-none opacity-80">
                                            <img src={selectedItem.image} alt="Overlay" className="w-full drop-shadow-xl" />
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setModelFile(null); setModelPreview(null); setSelectedItem(null); }}
                                    className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white text-red-500"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: AI Controls */}
                    <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                        <h3 className="font-bold text-chic-dark mb-4">AI Stylist</h3>
                        <div className="flex-grow space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Prompt</label>
                                <textarea
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="e.g. 'Make it look realistic', 'Tuck in the shirt'"
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-chic-rose h-24 resize-none"
                                />
                            </div>
                            <button
                                onClick={handleAiTryOn}
                                disabled={isEditing || !modelPreview || !editPrompt}
                                className="w-full bg-chic-dark text-white py-3 rounded-xl font-bold hover:bg-chic-rose transition disabled:opacity-50"
                            >
                                {isEditing ? 'Generating...' : '✨ Try On'}
                            </button>

                            {generatedImage && (
                                <div className="mt-4 border border-pink-100 rounded-xl overflow-hidden">
                                    <img src={generatedImage} alt="Result" className="w-full h-48 object-cover" />
                                    <a href={generatedImage} download="tryon.png" className="block text-center bg-pink-50 text-chic-rose text-xs font-bold py-2 hover:bg-pink-100">Download</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- STYLE SCANNER TAB --- */}
            {activeTab === 'analyze' && (
                <div className="grid lg:grid-cols-2 gap-8 animate-fade-in-up">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[500px]">
                        {!analyzeFile ? (
                            <label className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition p-12">
                                <span className="text-4xl mb-4">📸</span>
                                <span className="font-bold text-gray-600">Upload Outfit to Analyze</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setAnalyzeFile(e.target.files?.[0] || null)} />
                            </label>
                        ) : (
                            <div className="w-full flex flex-col items-center">
                                <img src={URL.createObjectURL(analyzeFile)} alt="Preview" className="max-h-[400px] rounded-xl shadow-sm mb-6" />
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="w-full bg-chic-dark text-white py-3 rounded-xl font-bold hover:bg-chic-rose transition disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Scanning...' : 'Analyze Look'}
                                </button>
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
                        {analysis && (
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
                    </div>
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
                                    placeholder="Ask about 2025 Summer Trends..."
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
                                    Global fashion data at your fingertips.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Studio;
