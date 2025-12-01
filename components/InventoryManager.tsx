import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { saveInventoryToCache, clearInventoryCache, fileToBase64, loadInventoryFromCache } from '../services/storageService';

interface InventoryManagerProps {
  currentInventory: Product[];
  onUpdateInventory: (newInventory: Product[]) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ currentInventory, onUpdateInventory }) => {
  // Locked Configuration
  const configPath = "D:\\Shah\\Rec Fashion\\";
  const [isSynced, setIsSynced] = useState(false);

  // Local Dataset Inputs
  const [localCsvFile, setLocalCsvFile] = useState<File | null>(null);
  const [localImages, setLocalImages] = useState<Map<string, File>>(new Map());
  const [imageCount, setImageCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Processing State
  const [processing, setProcessing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSyncStatus();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const checkSyncStatus = async () => {
    const cached = await loadInventoryFromCache();
    if (cached && cached.length > 0) {
      setIsSynced(true);
    } else {
      addLog("System ready.");
      addLog(`Target Source: ${configPath}`);
      addLog("Waiting for data upload...");
    }
  };

  // --- Robust CSV Parsing for Kaggle Dataset ---
  const parseCSVLine = (line: string) => {
    const result = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(val => val.replace(/^"|"$/g, '').trim());
  };

  const parseCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return [];

      // Parse headers
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      addLog(`CSV Headers: [${headers.join(', ')}]`);

      const items: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);

        if (values.length > 1) {
          const getVal = (keys: string[]) => {
            let index = headers.findIndex(h => keys.includes(h));
            if (index === -1) {
              index = headers.findIndex(h => keys.some(k => h.includes(k)));
            }
            return index !== -1 ? values[index] : '';
          };

          const rawId = getVal(['id', 'productid', 'uniq']);
          const id = rawId.replace(/['"\s]+/g, '');

          const displayName = getVal(['productdisplayname', 'name', 'title']);
          const masterCat = getVal(['mastercategory']);
          const subCat = getVal(['subcategory']);
          const articleType = getVal(['articletype']); // e.g. "Casual Shoes", "Caps"
          const gender = getVal(['gender']);
          const usage = getVal(['usage']);
          const color = getVal(['basecolour']);

          // CRITICAL FIX: Include articleType in category for search accuracy
          const richCategory = articleType ? `${articleType} (${masterCat})` : (masterCat || 'Fashion');

          if (id) {
            items.push({
              id,
              name: displayName || `${gender} ${articleType}`,
              description: `${gender} ${usage} ${articleType} in ${color}. ${displayName}`,
              price: '$45.00',
              category: richCategory, // Stores "Casual Shoes (Footwear)" instead of just "Footwear"
            });
          }
        }
      }
      return items;
    } catch (error: any) {
      console.error("CSV Parse Error:", error);
      addLog(`ERROR Reading CSV: ${error.message}`);
      return [];
    }
  };

  const handleImageFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const map = new Map<string, File>();
      let count = 0;
      const samples: string[] = [];
      addLog(`Scanning image folder...`);

      Array.from(e.target.files).forEach((file: File, idx) => {
        const name = file.name;
        if (name.startsWith('.') || name === 'Thumbs.db' || file.size === 0) return;

        const nameNoExt = name.substring(0, name.lastIndexOf('.')) || name;

        map.set(nameNoExt, file);
        map.set(name, file);

        if (idx < 3) samples.push(name);
        count++;
      });

      setLocalImages(map);
      setImageCount(count);
      addLog(`Found ${count} valid images.`);
      addLog(`Sample: ${samples.join(', ')}`);
    }
  };

  const handleSync = async () => {
    if (!localCsvFile) {
      alert("Please upload styles.csv first.");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setLogs([]);
    addLog("Starting Data Sync...");

    try {
      addLog(`Parsing ${localCsvFile.name}...`);
      const rawItems = await parseCSV(localCsvFile);

      if (rawItems.length === 0) throw new Error("Failed to parse items from CSV.");

      addLog(`Found ${rawItems.length} items. Analyzing categories...`);
      if (rawItems.length > 0) {
        addLog(`Sample Category: "${rawItems[0].category}" (Should be specific, e.g. 'Shirts')`);
      }

      const finalInventory: Product[] = [];
      let mappedCount = 0;
      let missingCount = 0;

      const CHUNK_SIZE = 25;
      const total = rawItems.length;

      for (let i = 0; i < rawItems.length; i += CHUNK_SIZE) {
        const chunk = rawItems.slice(i, i + CHUNK_SIZE);

        const processedChunk = await Promise.all(chunk.map(async (item) => {
          const imageFile = localImages.get(item.id) || localImages.get(`${item.id}.jpg`);
          let imageUrl = "";

          if (imageFile) {
            try {
              imageUrl = await fileToBase64(imageFile);
              mappedCount++;
            } catch (e: any) {
              imageUrl = `https://placehold.co/400x500?text=Error+${item.id}`;
            }
          } else {
            missingCount++;
            imageUrl = `https://placehold.co/400x500?text=Missing+${item.id}`;
          }

          return { ...item, image: imageUrl } as Product;
        }));

        finalInventory.push(...processedChunk);
        setProgress(Math.round(((i + CHUNK_SIZE) / total) * 100));
        await new Promise(r => setTimeout(r, 5));
      }

      addLog(`Done! Mapped: ${mappedCount}. Missing: ${missingCount}.`);

      if (mappedCount === 0) {
        addLog("CRITICAL: No images matched.");
      } else {
        addLog("Saving to locked database...");
        await saveInventoryToCache(finalInventory);
        addLog("Database Locked Successfully.");
        onUpdateInventory(finalInventory);
        setIsSynced(true);
      }

    } catch (e: any) {
      console.error(e);
      addLog(`Error: ${e.message}`);
      alert(`Sync Failed: ${e.message}`);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to DISCONNECT the database?")) {
      setDisconnecting(true);
      try {
        await clearInventoryCache();
        onUpdateInventory([]);
        setIsSynced(false);
        setLocalCsvFile(null);
        setLocalImages(new Map());
        setImageCount(0);
        setLogs([]);
        setResetKey(prev => prev + 1);
        addLog("Database Disconnected.");
      } catch (e) {
        console.error(e);
        alert("Failed to disconnect.");
      } finally {
        setDisconnecting(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-fade-in-up">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-chic-dark">Inventory Manager</h2>
          <p className="text-gray-500 mt-1">Manage your local dataset connection.</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center ${isSynced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${isSynced ? 'bg-green-600' : 'bg-yellow-600'}`}></div>
          {isSynced ? "Source Locked" : "Disconnected"}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 text-gray-300 p-4 rounded-xl font-mono text-sm flex items-center justify-between shadow-inner">
            <div className="flex items-center">
              <span className="text-gray-500 mr-3 select-none">SOURCE:</span>
              <span className="text-green-400 font-bold">{configPath}</span>
            </div>
            {isSynced && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs uppercase tracking-wider shadow transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Resetting..." : "Disconnect & Upload New"}
              </button>
            )}
          </div>

          {isSynced ? (
            <div className="bg-green-50 border border-green-100 p-8 rounded-2xl text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-green-800">Dataset Loaded</h3>
              <p className="text-green-700 mt-2">
                {currentInventory.length} items are loaded and cached.
                <br />The images are mapped and ready for the Stylist.
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="font-bold text-lg mb-6 text-chic-dark">Load Data</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Select 'styles.csv'</label>
                  <input
                    key={`csv-${resetKey}`}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setLocalCsvFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-pink-50 file:text-chic-rose"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Select Images Folder</label>
                  <input
                    key={`img-${resetKey}`}
                    type="file"
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleImageFolderUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-pink-50 file:text-chic-rose"
                  />
                </div>
                <div className="pt-4 border-t border-gray-100">
                  {processing ? (
                    <div className="w-full bg-gray-100 rounded-full h-10 relative overflow-hidden">
                      <div
                        className="bg-chic-rose h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      >
                        {progress}%
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleSync}
                      disabled={!localCsvFile || imageCount === 0}
                      className="w-full bg-chic-dark text-white py-4 rounded-xl font-bold hover:bg-chic-rose transition disabled:opacity-50 shadow-md"
                    >
                      Sync & Lock Data
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black rounded-xl p-4 font-mono text-xs text-green-400 h-[400px] overflow-y-auto shadow-2xl flex flex-col">
          <div className="border-b border-gray-800 pb-2 mb-2 flex justify-between sticky top-0 bg-black">
            <span className="font-bold text-white">SYSTEM LOG</span>
            <span className="text-gray-500">{logs.length} lines</span>
          </div>
          <div className="flex-grow space-y-1">
            {logs.length === 0 && <span className="text-gray-600 opacity-50">Waiting for input...</span>}
            {logs.map((log, i) => (
              <div key={i} className="break-words border-b border-gray-900 pb-1">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      <div className="opacity-90">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-serif font-bold text-xl text-chic-dark">Mapping Verification</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{currentInventory.length} items</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Visual</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentInventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                    No data. Please upload styles.csv and images.
                  </td>
                </tr>
              ) : (
                currentInventory.slice(0, 25).map((item) => {
                  const isMissing = item.image.includes('placehold.co') || item.image.includes('Missing');
                  return (
                    <tr key={item.id} className={isMissing ? "bg-red-50" : ""}>
                      <td className="px-6 py-4">
                        {isMissing ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ❌ Missing
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Mapped
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={item.image}
                          className="h-12 w-12 object-cover rounded border border-gray-200"
                          alt="thumb"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium truncate max-w-xs">{item.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.id}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;