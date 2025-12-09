import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

const API_KEY_STORAGE_KEY = 'stylyst_gemini_api_key';

// Helper functions to manage API key in localStorage
export const getStoredApiKey = (): string | null => {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const setStoredApiKey = (key: string): void => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const clearStoredApiKey = (): void => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = getStoredApiKey();
        if (stored) {
            setApiKey(stored);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }
        if (!apiKey.startsWith('AIza')) {
            setError('Invalid API key format. Gemini keys start with "AIza..."');
            return;
        }
        setStoredApiKey(apiKey.trim());
        onSave(apiKey.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-chic-rose to-pink-400 p-6 text-white">
                    <h2 className="text-2xl font-serif font-bold flex items-center">
                        <span className="mr-3">🔑</span> API Configuration
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                        Enter your Gemini API key to enable AI features
                    </p>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                            placeholder="AIzaSy..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-chic-rose focus:ring-2 focus:ring-pink-100 transition"
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                        <h4 className="font-bold text-blue-800 text-sm mb-2">How to get your API key:</h4>
                        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google AI Studio</a></li>
                            <li>Sign in with your Google account</li>
                            <li>Click "Create API Key"</li>
                            <li>Copy and paste it here</li>
                        </ol>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-chic-dark text-white py-4 rounded-xl font-bold hover:bg-chic-rose transition shadow-lg"
                        >
                            Save & Continue
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-4 border border-gray-200 rounded-xl font-medium text-gray-500 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">
                        🔒 Your API key is stored locally in your browser and never sent to our servers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
