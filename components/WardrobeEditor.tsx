import React, { useState, useRef } from 'react';
import { editFashionImage } from '../services/geminiService';

const WardrobeEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
    }
  };

  const handleEdit = async () => {
    if (!selectedFile || !prompt) return;
    setLoading(true);
    try {
      const result = await editFashionImage(selectedFile, prompt);
      setGeneratedImage(result);
    } catch (error) {
      console.error("Editing failed", error);
      alert("Image editing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-chic-dark mb-3">Virtual Wardrobe Studio</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Re-imagine your clothes. Upload a photo and use AI to change colors, fabrics, or add accessories instantly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 bg-white p-8 rounded-3xl shadow-xl border border-pink-50">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">Original Photo</h3>
            <span className="bg-chic-rose text-white text-[10px] px-2 py-1 rounded font-bold">NANO BANANA</span>
          </div>

          <div 
            className="border-2 border-dashed border-pink-200 rounded-2xl h-[500px] flex flex-col items-center justify-center bg-pink-50/30 cursor-pointer hover:bg-pink-50 transition-colors duration-300 overflow-hidden relative group"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <>
                 <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium border border-white px-4 py-2 rounded-full">Change Photo</span>
                 </div>
              </>
            ) : (
              <div className="text-center text-gray-400 p-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-chic-rose">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <span className="font-serif text-lg text-gray-600 block mb-1">Upload an outfit</span>
                <span className="text-xs">JPG or PNG supported</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="bg-gray-50 p-2 rounded-full border border-gray-200 flex items-center shadow-inner focus-within:ring-2 focus-within:ring-chic-rose focus-within:border-transparent transition-all">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Make the jacket leather' or 'Add a scarf'"
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={handleEdit}
              disabled={loading || !selectedFile || !prompt}
              className="bg-chic-dark text-white px-6 py-2 rounded-full font-medium hover:bg-chic-rose transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Magic...' : 'Edit'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm text-right">AI Result</h3>
          
          <div className="border border-gray-100 rounded-2xl h-[500px] bg-white flex items-center justify-center relative overflow-hidden shadow-inner">
            {loading && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-chic-rose rounded-full animate-spin mb-4"></div>
                <p className="font-serif text-chic-dark text-lg animate-pulse">Tailoring your request...</p>
              </div>
            )}
            
            {generatedImage ? (
              <img src={generatedImage} alt="Edited Result" className="h-full w-full object-cover animate-fade-in-up" />
            ) : (
              <div className="text-center p-10 opacity-40">
                 <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4"></div>
                 <p className="font-serif text-xl text-gray-400 italic">Your re-imagined look will appear here.</p>
              </div>
            )}
          </div>
          
          {generatedImage && (
             <button 
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = 'stylyst-edit.png';
                    link.click();
                }}
                className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium"
             >
                Download Image
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WardrobeEditor;