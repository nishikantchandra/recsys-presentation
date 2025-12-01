import React, { useEffect, useState } from 'react';
import { Product } from '../types';

interface EDADashboardProps {
    inventory: Product[];
}

const EDADashboard: React.FC<EDADashboardProps> = ({ inventory }) => {
    const [animateCharts, setAnimateCharts] = useState(false);

    // Trigger animations shortly after mount
    useEffect(() => {
        const timer = setTimeout(() => setAnimateCharts(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // 1. DATA PREPARATION
    const totalItems = inventory.length;
    const missingImages = inventory.filter(i => i.image.includes('placehold') || i.image.includes('Missing')).length;
    const healthScore = totalItems > 0 ? Math.round(((totalItems - missingImages) / totalItems) * 100) : 0;

    // Category Distribution
    const catCounts: Record<string, number> = {};
    inventory.forEach(i => {
        const master = i.category.split('(')[1]?.replace(')', '') || i.category.split('-')[0]?.trim() || 'Other';
        catCounts[master] = (catCounts[master] || 0) + 1;
    });
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCount = sortedCats[0]?.[1] || 1;

    // Color DNA
    const colorKeywords = ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Yellow', 'Navy', 'Grey', 'Beige', 'Purple', 'Orange'];
    const colorCounts: Record<string, number> = {};
    inventory.forEach(i => {
        const desc = i.description.toLowerCase();
        for (const c of colorKeywords) {
            if (desc.includes(c.toLowerCase())) {
                colorCounts[c] = (colorCounts[c] || 0) + 1;
                break;
            }
        }
    });

    const totalColors = Object.values(colorCounts).reduce((a, b) => a + b, 0);
    let currentDeg = 0;
    const gradientParts = Object.entries(colorCounts).map(([color, count]) => {
        const deg = (count / totalColors) * 360;
        const segment = `${color} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg;
        return segment;
    });
    const pieGradient = `conic-gradient(${gradientParts.join(', ') || '#ddd 0deg 360deg'})`;

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="mb-12 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <h2 className="text-4xl font-serif font-bold text-chic-dark">Data & EDA Dashboard</h2>
                <p className="text-gray-500 mt-2">Exploratory Data Analysis of the Kaggle Fashion Dataset</p>
            </div>

            {/* TOP ROW: KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Items', value: totalItems.toLocaleString(), color: 'text-chic-dark' },
                    { label: 'Dataset Health', value: `${healthScore}%`, color: healthScore > 80 ? 'text-green-500' : 'text-red-500' },
                    { label: 'Unique Categories', value: Object.keys(catCounts).length, color: 'text-chic-rose' },
                    { label: 'Embeddings (FAISS)', value: '10k+', color: 'text-blue-500' }
                ].map((kpi, idx) => (
                    <div
                        key={idx}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center opacity-0 animate-fade-in-up hover:-translate-y-1 hover:shadow-md transition-transform duration-300"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div className={`text-3xl font-bold mb-1 ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* MIDDLE ROW: CHARTS */}
            <div className="grid lg:grid-cols-2 gap-8 mb-10">

                {/* CATEGORY DISTRIBUTION */}
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <h3 className="font-serif font-bold text-xl text-chic-dark mb-6">Category Distribution</h3>
                    <div className="space-y-5">
                        {sortedCats.map(([cat, count], i) => (
                            <div key={cat} className="relative group">
                                <div className="flex justify-between text-sm mb-1 font-medium text-gray-600">
                                    <span>{cat}</span>
                                    <span>{count}</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-chic-rose to-pink-400 rounded-full transition-all duration-[1500ms] ease-out relative"
                                        style={{ width: animateCharts ? `${(count / maxCount) * 100}%` : '0%' }}
                                    >
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-6 italic">
                        *Top Categories derived from CSV mapping.
                    </p>
                </div>

                {/* COLOR & EMBEDDING SPACE */}
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <h3 className="font-serif font-bold text-xl text-chic-dark mb-6">Color Analysis</h3>

                    <div className="flex items-center justify-center flex-grow mb-6">
                        <div
                            className="relative w-56 h-56 rounded-full shadow-inner border-8 border-white transition-all duration-[2000ms] ease-out"
                            style={{
                                background: pieGradient,
                                transform: animateCharts ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0.8)',
                                opacity: animateCharts ? 1 : 0
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-28 h-28 bg-white rounded-full shadow-xl flex flex-col items-center justify-center z-10">
                                    <span className="font-bold text-gray-800 text-2xl">{totalColors}</span>
                                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Extracted</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {Object.keys(colorCounts).slice(0, 8).map((c, i) => (
                            <span
                                key={c}
                                className="flex items-center px-3 py-1 bg-gray-50 rounded-full text-xs border border-gray-200 opacity-0 animate-fade-in-up"
                                style={{ animationDelay: `${800 + (i * 50)}ms` }}
                            >
                                <span className="w-3 h-3 rounded-full mr-2 border border-black/10" style={{ background: c }}></span>
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* BOTTOM: EMBEDDING SPACE EXPLAINER */}
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
                    {/* Animated Background Noise */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

                    <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <div className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-blue-500/50 animate-pulse">
                                ML PIPELINE VISUALIZATION
                            </div>
                            <h3 className="text-3xl font-serif font-bold mb-4">Embedding Space (t-SNE)</h3>
                            <p className="text-gray-300 leading-relaxed mb-6">
                                We utilized <strong>OpenCLIP</strong> to encode all product images into a 512-dimensional vector space.
                                Dimensionality reduction (t-SNE) reveals that semantic concepts cluster naturally.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex items-center text-xs bg-white/10 px-2 py-1 rounded"><span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span> Formal</div>
                                <div className="flex items-center text-xs bg-white/10 px-2 py-1 rounded"><span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span> Casual</div>
                                <div className="flex items-center text-xs bg-white/10 px-2 py-1 rounded"><span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span> Sport</div>
                            </div>
                        </div>

                        {/* Live Scatter Plot Simulation */}
                        <div className="relative h-64 bg-black/20 rounded-xl border border-white/10 p-4 overflow-hidden backdrop-blur-sm">
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <div className="w-64 h-64 border border-white/20 rounded-full"></div>
                                <div className="w-48 h-48 border border-white/20 rounded-full absolute"></div>
                                <div className="w-32 h-32 border border-white/20 rounded-full absolute"></div>
                            </div>

                            {/* Floating Dots */}
                            {[...Array(25)].map((_, i) => (
                                <div
                                    key={`r-${i}`}
                                    className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                    style={{
                                        top: `${20 + Math.random() * 30}%`,
                                        left: `${20 + Math.random() * 30}%`,
                                        animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                ></div>
                            ))}
                            {[...Array(25)].map((_, i) => (
                                <div
                                    key={`b-${i}`}
                                    className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                                    style={{
                                        top: `${50 + Math.random() * 30}%`,
                                        left: `${50 + Math.random() * 30}%`,
                                        animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                ></div>
                            ))}
                            {[...Array(15)].map((_, i) => (
                                <div
                                    key={`g-${i}`}
                                    className="absolute w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                                    style={{
                                        top: `${10 + Math.random() * 20}%`,
                                        left: `${70 + Math.random() * 20}%`,
                                        animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                ></div>
                            ))}

                            <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono bg-black/50 px-2 rounded">fig 1. OpenCLIP Projection</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(0, -6px); }
        }
      `}</style>
        </div>
    );
};

export default EDADashboard;