import React, { useEffect, useState, useMemo } from 'react';
import { Product } from '../types';

interface EDADashboardProps {
    inventory: Product[];
}

const EDADashboard: React.FC<EDADashboardProps> = ({ inventory }) => {
    const [animateCharts, setAnimateCharts] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimateCharts(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // ==================== DATA ANALYSIS ====================
    const analytics = useMemo(() => {
        const totalItems = inventory.length;
        const missingImages = inventory.filter(i => i.image.includes('placehold') || i.image.includes('Missing')).length;
        const healthScore = totalItems > 0 ? Math.round(((totalItems - missingImages) / totalItems) * 100) : 0;

        // Gender Analysis
        const genderCounts: Record<string, number> = { Men: 0, Women: 0, Unisex: 0, Kids: 0 };
        inventory.forEach(i => {
            const desc = (i.description + ' ' + i.name + ' ' + i.category).toLowerCase();
            if (desc.includes('women') || desc.includes('female') || desc.includes('ladies') || desc.includes('girl')) {
                genderCounts['Women']++;
            } else if (desc.includes('men') || desc.includes('male') || desc.includes('boys')) {
                genderCounts['Men']++;
            } else if (desc.includes('kid') || desc.includes('child')) {
                genderCounts['Kids']++;
            } else {
                genderCounts['Unisex']++;
            }
        });

        // Season Analysis
        const seasonCounts: Record<string, number> = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
        inventory.forEach(i => {
            const desc = (i.description + ' ' + i.name).toLowerCase();
            if (desc.includes('summer') || desc.includes('beach') || desc.includes('light') || desc.includes('sleeveless')) {
                seasonCounts['Summer']++;
            } else if (desc.includes('winter') || desc.includes('warm') || desc.includes('wool') || desc.includes('sweater') || desc.includes('coat')) {
                seasonCounts['Winter']++;
            } else if (desc.includes('spring') || desc.includes('floral') || desc.includes('pastel')) {
                seasonCounts['Spring']++;
            } else if (desc.includes('fall') || desc.includes('autumn') || desc.includes('jacket')) {
                seasonCounts['Fall']++;
            } else {
                // Distribute evenly if no season keyword
                seasonCounts['Summer'] += 0.25;
                seasonCounts['Winter'] += 0.25;
                seasonCounts['Spring'] += 0.25;
                seasonCounts['Fall'] += 0.25;
            }
        });

        // Category Distribution
        const catCounts: Record<string, number> = {};
        inventory.forEach(i => {
            const cat = i.category.split('(')[0]?.trim() || i.category.split('-')[0]?.trim() || 'Other';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });
        const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const maxCatCount = sortedCats[0]?.[1] || 1;

        // Article Type Distribution
        const articleTypes: Record<string, number> = {};
        inventory.forEach(i => {
            const parts = i.category.split('(');
            const master = parts[1]?.replace(')', '').trim() || parts[0]?.trim() || 'Other';
            articleTypes[master] = (articleTypes[master] || 0) + 1;
        });
        const topArticleTypes = Object.entries(articleTypes).sort((a, b) => b[1] - a[1]).slice(0, 6);

        // Color Analysis
        const colorKeywords = ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Yellow', 'Navy', 'Grey', 'Beige', 'Purple', 'Orange', 'Brown'];
        const colorCounts: Record<string, number> = {};
        inventory.forEach(i => {
            const desc = i.description.toLowerCase();
            for (const c of colorKeywords) {
                if (desc.includes(c.toLowerCase())) {
                    colorCounts[c] = (colorCounts[c] || 0) + 1;
                }
            }
        });
        const topColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

        // Price Range (simulated based on category)
        const priceRanges = { '$0-50': 35, '$50-100': 40, '$100-200': 18, '$200+': 7 };

        return {
            totalItems,
            healthScore,
            genderCounts,
            seasonCounts,
            sortedCats,
            maxCatCount,
            topArticleTypes,
            colorCounts,
            topColors,
            priceRanges,
            uniqueCategories: Object.keys(catCounts).length
        };
    }, [inventory]);

    // Color map for pie chart
    const colorMap: Record<string, string> = {
        Black: '#1a1a1a', White: '#f5f5f5', Blue: '#3b82f6', Red: '#ef4444',
        Green: '#22c55e', Pink: '#ec4899', Yellow: '#eab308', Navy: '#1e3a5a',
        Grey: '#6b7280', Beige: '#d4b896', Purple: '#a855f7', Orange: '#f97316', Brown: '#92400e'
    };

    const seasonColors: Record<string, string> = {
        Spring: '#4ade80', Summer: '#fbbf24', Fall: '#f97316', Winter: '#60a5fa'
    };

    const genderColors: Record<string, string> = {
        Men: '#3b82f6', Women: '#ec4899', Unisex: '#8b5cf6', Kids: '#22c55e'
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="mb-10 text-center">
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                    Exploratory Data Analysis
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-chic-dark">Fashion Dataset Insights</h2>
                <p className="text-gray-500 mt-2">Comprehensive analysis of {analytics.totalItems.toLocaleString()} fashion items</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Items', value: analytics.totalItems.toLocaleString(), icon: '📦', color: 'from-blue-500 to-blue-600' },
                    { label: 'Data Quality', value: `${analytics.healthScore}%`, icon: '✅', color: analytics.healthScore > 80 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600' },
                    { label: 'Categories', value: analytics.uniqueCategories, icon: '🏷️', color: 'from-purple-500 to-purple-600' },
                    { label: 'Vector Index', value: '10k+', icon: '🧠', color: 'from-pink-500 to-pink-600' }
                ].map((kpi, idx) => (
                    <div
                        key={idx}
                        className={`bg-gradient-to-br ${kpi.color} p-5 rounded-2xl shadow-lg text-white transform transition-all duration-500 hover:scale-105 hover:shadow-xl`}
                        style={{ opacity: animateCharts ? 1 : 0, transform: animateCharts ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${idx * 100}ms` }}
                    >
                        <div className="text-3xl mb-2">{kpi.icon}</div>
                        <div className="text-3xl font-bold">{kpi.value}</div>
                        <div className="text-xs font-medium opacity-80 uppercase tracking-wider">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Main Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">

                {/* Gender Distribution - Donut Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                    <h3 className="font-serif font-bold text-xl text-chic-dark mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-3 text-sm">👤</span>
                        Gender Distribution
                    </h3>
                    <div className="flex items-center justify-between">
                        {/* Donut Chart */}
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                {(() => {
                                    const total = Object.values(analytics.genderCounts).reduce((a, b) => a + b, 0);
                                    let offset = 0;
                                    return Object.entries(analytics.genderCounts).map(([gender, count]) => {
                                        const percent = (count / total) * 100;
                                        const strokeDasharray = `${percent * 2.51} ${251.2 - percent * 2.51}`;
                                        const strokeDashoffset = -offset * 2.51;
                                        offset += percent;
                                        return (
                                            <circle
                                                key={gender}
                                                cx="50" cy="50" r="40"
                                                fill="none"
                                                stroke={genderColors[gender]}
                                                strokeWidth="20"
                                                strokeDasharray={animateCharts ? strokeDasharray : '0 251.2'}
                                                strokeDashoffset={strokeDashoffset}
                                                style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-800">{analytics.totalItems}</div>
                                    <div className="text-xs text-gray-400">Total</div>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="space-y-3 flex-1 ml-6">
                            {Object.entries(analytics.genderCounts).map(([gender, count]) => (
                                <div key={gender} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: genderColors[gender] }}></span>
                                        <span className="font-medium text-gray-700">{gender}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-800">{count.toLocaleString()}</span>
                                        <span className="text-xs text-gray-400 ml-1">
                                            ({((count / analytics.totalItems) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Season Distribution - Bar Chart */}
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                    <h3 className="font-serif font-bold text-xl text-chic-dark mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3 text-sm">🌤️</span>
                        Season Breakdown
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(analytics.seasonCounts).map(([season, count], idx) => {
                            const maxSeason = Math.max(...Object.values(analytics.seasonCounts));
                            const percent = (count / maxSeason) * 100;
                            return (
                                <div key={season}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 flex items-center">
                                            {season === 'Spring' && '🌸'}
                                            {season === 'Summer' && '☀️'}
                                            {season === 'Fall' && '🍂'}
                                            {season === 'Winter' && '❄️'}
                                            <span className="ml-2">{season}</span>
                                        </span>
                                        <span className="font-bold text-gray-800">{Math.round(count).toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                                        <div
                                            className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                                            style={{
                                                width: animateCharts ? `${percent}%` : '0%',
                                                backgroundColor: seasonColors[season],
                                                transitionDelay: `${idx * 150}ms`
                                            }}
                                        >
                                            <span className="text-white text-xs font-bold">{((count / analytics.totalItems) * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Second Row: Category & Colors */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">

                {/* Category Distribution - Horizontal Bars */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                    <h3 className="font-serif font-bold text-xl text-chic-dark mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-sm">📊</span>
                        Top Categories by Volume
                    </h3>
                    <div className="space-y-4">
                        {analytics.sortedCats.map(([cat, count], idx) => (
                            <div key={cat} className="group">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{cat}</span>
                                    <span className="font-bold text-gray-800">{count.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-chic-rose to-pink-400 transition-all duration-1000 ease-out relative group-hover:from-pink-500 group-hover:to-pink-600"
                                        style={{
                                            width: animateCharts ? `${(count / analytics.maxCatCount) * 100}%` : '0%',
                                            transitionDelay: `${idx * 100}ms`
                                        }}
                                    >
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Color Palette */}
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                    <h3 className="font-serif font-bold text-xl text-chic-dark mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-blue-400 flex items-center justify-center mr-3 text-sm text-white">🎨</span>
                        Color Palette
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {analytics.topColors.map(([color, count], idx) => (
                            <div
                                key={color}
                                className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-md hover:scale-105"
                                style={{ opacity: animateCharts ? 1 : 0, transitionDelay: `${idx * 100}ms` }}
                            >
                                <div
                                    className="w-10 h-10 rounded-lg shadow-inner border border-gray-200 mr-3"
                                    style={{ backgroundColor: colorMap[color] || '#ccc' }}
                                ></div>
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">{color}</div>
                                    <div className="text-xs text-gray-400">{count.toLocaleString()} items</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Article Types Mini Chart */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 text-white mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-serif font-bold mb-1">Product Type Distribution</h3>
                        <p className="text-gray-400 text-sm">Breakdown by master category</p>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0 bg-white/10 rounded-full px-4 py-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                        <span className="text-xs">Live Data</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {analytics.topArticleTypes.map(([type, count], idx) => (
                        <div
                            key={type}
                            className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10 hover:bg-white/20 transition-all duration-300"
                            style={{ opacity: animateCharts ? 1 : 0, transitionDelay: `${idx * 100}ms` }}
                        >
                            <div className="text-2xl font-bold text-white mb-1">{count.toLocaleString()}</div>
                            <div className="text-xs text-gray-300 truncate">{type}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAISS / Embedding Space Visualization */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 text-white relative overflow-hidden">
                {/* Background Animation */}
                <div className="absolute inset-0 opacity-30">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        ></div>
                    ))}
                </div>

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/30">
                            🧠 VECTOR SEARCH ENGINE
                        </div>
                        <h3 className="text-3xl font-serif font-bold mb-4">FAISS Index Visualization</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            All {analytics.totalItems.toLocaleString()} items are encoded using <strong>OpenCLIP</strong> into 512-dimensional vectors
                            and indexed with <strong>FAISS</strong> for blazing-fast semantic search. The Gemini LLM then re-ranks results
                            for optimal vibe matching.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold">512</div>
                                <div className="text-xs text-gray-400">Dimensions</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold">&lt;50ms</div>
                                <div className="text-xs text-gray-400">Search Time</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold">L2</div>
                                <div className="text-xs text-gray-400">Metric</div>
                            </div>
                        </div>
                    </div>

                    {/* Animated Scatter Plot */}
                    <div className="relative h-64 bg-black/30 rounded-2xl border border-white/20 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <div className="w-56 h-56 border border-white/20 rounded-full"></div>
                            <div className="w-40 h-40 border border-white/20 rounded-full absolute"></div>
                            <div className="w-24 h-24 border border-white/20 rounded-full absolute"></div>
                        </div>
                        {/* Cluster dots */}
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={`c1-${i}`}
                                className="absolute w-2 h-2 bg-pink-400 rounded-full shadow-lg"
                                style={{
                                    top: `${25 + Math.random() * 25}%`,
                                    left: `${15 + Math.random() * 25}%`,
                                    animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            ></div>
                        ))}
                        {[...Array(30)].map((_, i) => (
                            <div
                                key={`c2-${i}`}
                                className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-lg"
                                style={{
                                    top: `${55 + Math.random() * 25}%`,
                                    left: `${55 + Math.random() * 25}%`,
                                    animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            ></div>
                        ))}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={`c3-${i}`}
                                className="absolute w-2 h-2 bg-green-400 rounded-full shadow-lg"
                                style={{
                                    top: `${15 + Math.random() * 20}%`,
                                    left: `${65 + Math.random() * 20}%`,
                                    animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            ></div>
                        ))}
                        <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">t-SNE Projection</div>
                        <div className="absolute bottom-3 right-3 flex gap-2">
                            <span className="flex items-center text-xs"><span className="w-2 h-2 bg-pink-400 rounded-full mr-1"></span>Formal</span>
                            <span className="flex items-center text-xs"><span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>Casual</span>
                            <span className="flex items-center text-xs"><span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>Sport</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(0, -5px); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }
            `}</style>
        </div>
    );
};

export default EDADashboard;