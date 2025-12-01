import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { Product, RecommendationResponse } from "../types";
import { STYLYST_SYSTEM_PROMPT } from "../constants";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.API_KEY; // Fallback for some setups

  if (!apiKey) {
    console.error("CRITICAL: Gemini API Key is missing.");
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to convert file/blob to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * STAGE 1: ACCURATE RETRIEVAL (Client-Side Implementation)
 * 
 * Solves the "Jersey Problem" by implementing Weighted Category Matching.
 * If a token in the query matches the Item Category, it gets a massive score boost.
 */
const retrieveCandidates = (query: string, inventory: Product[], limit: number = 30): Product[] => {
  // 1. Clean and Tokenize Query
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, '');
  const tokens = cleanQuery.split(/\s+/).filter(t => t.length > 2);

  if (inventory.length === 0) return [];

  // 2. Score Every Item
  const scoredItems = inventory.map(item => {
    let score = 0;
    let matchedTokens = 0;

    // Normalize text fields
    const name = (item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const cat = (item.category || '').toLowerCase(); // Now contains articleType e.g. "Casual Shoes"

    // A. Exact Phrase Match (Highest Priority)
    if (name.includes(cleanQuery)) score += 100;

    // B. Token Matching with Category Bias
    tokens.forEach(token => {
      let tokenMatched = false;

      // CRITICAL: If token matches CATEGORY (e.g. "Shoes"), massive boost
      if (cat.includes(token)) {
        score += 50; // High priority for Item Type matches
        tokenMatched = true;
      }

      // Name match
      if (name.includes(token)) {
        score += 15;
        tokenMatched = true;
      }

      // Description match (Lower priority, descriptions can be wordy)
      if (desc.includes(token)) {
        score += 5;
        tokenMatched = true;
      }

      if (tokenMatched) matchedTokens++;
    });

    // C. Penalty for Missing Images
    if (item.image.includes('placehold.co') || item.image.includes('Missing')) {
      score -= 1000; // Buries missing items completely
    }

    return { item, score };
  });

  // 3. Filter & Sort
  // We require at least one matching token score to be considered
  let candidates = scoredItems
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(i => i.item);

  // 4. "Zero-Results" Handling - Fallback to random popular items if search fails
  if (candidates.length === 0) {
    console.warn("No candidates found via keyword search. Falling back to random selection for demo.");
    // Shuffle inventory and pick random items so the user always sees SOMETHING
    candidates = [...inventory].sort(() => 0.5 - Math.random()).slice(0, 20);
  }

  return candidates.slice(0, limit);
};

/**
 * CORE FEATURE: Three-Stage Pipeline Implementation
 */
export const getStylistRecommendations = async (
  query: string,
  inventory: Product[]
): Promise<RecommendationResponse> => {
  const ai = getAiClient();

  // --- STAGE 1: RETRIEVAL ---
  // Increased limit to 60 to give the LLM a wider pool for the "Top 6"
  const candidateItems = retrieveCandidates(query, inventory, 60);

  // Handle empty search results gracefully (Double check)
  if (candidateItems.length === 0) {
    return {
      user_query: query,
      stylist_summary: `I searched your entire inventory for '${query}', but I couldn't find any items. Please ensure your inventory is uploaded correctly.`,
      recommendations: []
    };
  }

  // Prepare context for the LLM
  const inventoryContext = candidateItems.map(item =>
    `ID: ${item.id} | Name: ${item.name} | Type: ${item.category} | Desc: ${item.description}`
  ).join("\n");

  const prompt = `
    User Query: "${query}"

    Top Candidates Found in Inventory:
    ${inventoryContext}

    ---
    Your Task (Stage 2 & 3):
    1. Select EXACTLY 6 items from the list above that match the user's query. You MUST return 6 items.
    2. If there are fewer than 6 perfect matches, include the next best relevant items to reach 6.
    3. CRITICAL: If the query specifies an item type (e.g. "Shoes"), ONLY select items that are actually that type.
    4. Generate a natural language explanation.

    Output JSON matching the schema.
  `;

  try {
    // --- STAGE 2 & 3: RANKING & GENERATION ---
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: STYLYST_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            user_query: { type: Type.STRING },
            stylist_summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.INTEGER },
                  item_id: { type: Type.STRING },
                  description: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["rank", "item_id", "description", "explanation"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as RecommendationResponse;
    }
    throw new Error("Empty response from Stylist");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("The stylist encountered an internal error. Please try a simpler query or refresh.");
  }
};

/**
 * Feature 2: Structured Image Analysis (Vogue Scan)
 */
export interface AnalysisPoint {
  item_name: string;
  description: string;
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
}

export interface AnnotatedAnalysis {
  main_vibe: string;
  items: AnalysisPoint[];
}

export const analyzeImageWithAnnotations = async (imageFile: File): Promise<AnnotatedAnalysis> => {
  const ai = getAiClient();
  const base64Data = await fileToGenerativePart(imageFile);

  // STRICT PROMPT FOR ACCURACY
  const prompt = `
    Act as a high-end fashion editor for Vogue. Analyze this image with technical precision.
    
    1. Detect the "Main Vibe": A sophisticated 2-3 word aesthetic summary (e.g., "Urban Minimalist", "Boho Chic", "Sartorial Elegance").
    2. Identify EXACTLY 3 DISTINCT key fashion items in the image. Do not detect overlapping items.
    3. For each item:
       - Name: Use precise fashion terminology (e.g., "Chelsea Boots" instead of "Shoes", "Lapel" instead of "Collar").
       - Description: A technical observation about fabric, cut, or detail (Max 6 words).
       - Position: Choose the most accurate quadrant for a clean UI overlay ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'). 
    
    Ensure the output is strictly JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: imageFile.type, data: base64Data } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          main_vibe: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item_name: { type: Type.STRING },
                description: { type: Type.STRING },
                position: { type: Type.STRING, enum: ["top-left", "top-right", "center", "bottom-left", "bottom-right"] }
              },
              required: ["item_name", "description", "position"]
            }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as AnnotatedAnalysis;
  }
  throw new Error("Failed to analyze image structure.");
};

// Keeps legacy plain text analysis as fallback if needed
export const analyzeFashionImage = async (imageFile: File, promptText: string) => {
  const ai = getAiClient();
  const base64Data = await fileToGenerativePart(imageFile);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: imageFile.type, data: base64Data } },
        { text: promptText || "Analyze this outfit." }
      ]
    }
  });

  return response.text || "Could not analyze image.";
};

/**
 * Feature 3: Image Editing
 */
export const editFashionImage = async (imageFile: File, editPrompt: string): Promise<string> => {
  const ai = getAiClient();
  const base64Data = await fileToGenerativePart(imageFile);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
          },
        },
        {
          text: editPrompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part && part.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated.");
};

/**
 * Feature 4: Trend Spotting
 */
export const getFashionTrends = async (query: string) => {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Answer this fashion query using the latest data: ${query}`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
};

/**
 * Feature 5: Text to Speech
 */
export const generateStylistSpeech = async (text: string): Promise<AudioBuffer> => {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) throw new Error("No audio generated");

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  try {
    const pcmData = new Int16Array(bytes.buffer);
    const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }

    return audioBuffer;
  } finally {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
};