import React, { useState } from 'react';
import { analyzeImageWithAnnotations, AnnotatedAnalysis } from '../services/geminiService';

const StyleAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnnotatedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeImageWithAnnotations(file);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const getPositionStyle = (pos: string) => {
      switch(pos) {
          case 'top-left': return { top: '20%', left: '20%' };
          case 'top-right': return { top: '20%', right: '20%' };
          case 'bottom-left': return { bottom: '20%', left: '20%' };
          case 'bottom-right': return { bottom: '20%', right: '20%' };
          case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
          default: return { top: '50%', left: '50%' };
      }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-serif font-bold text-chic-dark">Style Scanner</h2>
        <p className="text-gray-500 mt-2">AI-Powered Visual Decomposition</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
           {!file ? (
              <label className="w-full h-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 hover:border-chic-rose transition-all p-12 group">
                  <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-chic-rose text-3xl">
                      📸
                  </div>
                  <span className="font-bold text-gray-600 text-lg">Upload Outfit</span>
                  <span className="text-sm text-gray-400 mt-2">Click to browse</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
           ) : (
              <div className="w-full flex flex-col items-center">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-[300px] rounded-xl shadow-sm mb-6" />
                  <div className="flex space-x-4 w-full">
                      <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className="flex-1 bg-chic-dark text-white py-3 rounded-xl font-bold hover:bg-chic-rose transition disabled:opacity-50"
                      >
                          {loading ? 'Scanning...' : 'Analyze Look'}
                      </button>
                      <button 
                        onClick={() => {setFile(null); setAnalysis(null);}}
                        className="px-6 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                      >
                          Reset
                      </button>
                  </div>
              </div>
           )}
        </div>

        {/* Analysis Canvas */}
        <div className="relative bg-gray-900 rounded-3xl shadow-2xl overflow-hidden min-h-[500px] flex items-center justify-center group">
            {/* Background Image with Blur if Analyzed */}
            {file && (
                <img 
                    src={URL.createObjectURL(file)} 
                    alt="Analysis Target" 
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${analysis ? 'opacity-50 blur-sm scale-105' : 'opacity-100'}`}
                />
            )}

            {/* Overlay UI */}
            <div className="relative z-10 w-full h-full">
                
                {/* Loading Scanner Effect */}
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                        <div className="w-full h-1 bg-chic-rose/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                        <div className="w-20 h-20 border-4 border-chic-rose border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white mt-4 font-mono tracking-widest text-sm">DECOMPOSING IMAGE...</p>
                    </div>
                )}

                {/* Results Overlay */}
                {analysis && !loading && (
                    <div className="w-full h-full relative p-6">
                        {/* Main Vibe Badge */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md border border-chic-rose/50 text-white px-6 py-2 rounded-full shadow-2xl animate-fade-in-up z-20">
                             <span className="text-chic-rose font-bold mr-2">VIBE:</span>
                             <span className="font-serif italic">{analysis.main_vibe}</span>
                        </div>

                        {/* Interactive Hotspots */}
                        {analysis.items.map((item, idx) => (
                            <div 
                                key={idx}
                                className="absolute group/spot"
                                style={getPositionStyle(item.position)}
                            >
                                {/* The Pulsing Dot */}
                                <div className="relative w-8 h-8 cursor-pointer">
                                    <div className="absolute inset-0 bg-chic-rose rounded-full animate-ping opacity-75"></div>
                                    <div className="absolute inset-1 bg-white rounded-full shadow-lg flex items-center justify-center text-xs font-bold text-chic-dark">
                                        {idx + 1}
                                    </div>
                                </div>

                                {/* The Popover Card */}
                                <div className={`
                                    absolute w-48 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-pink-100 
                                    transition-all duration-300 opacity-0 transform scale-90 group-hover/spot:opacity-100 group-hover/spot:scale-100
                                    ${item.position.includes('left') ? 'left-10 top-0' : 'right-10 top-0'}
                                    z-30 pointer-events-none group-hover/spot:pointer-events-auto
                                `}>
                                    <h4 className="font-bold text-chic-dark text-sm mb-1 border-b border-gray-100 pb-1">{item.item_name}</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!file && (
                    <div className="text-white/30 font-serif text-2xl italic">
                        Waiting for image...
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default StyleAnalyzer;