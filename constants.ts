import { Product } from './types';

// A mock inventory representing "Retrieved Candidates" from a Vector DB
export const INVENTORY: Product[] = [
  {
    id: "item_001",
    name: "Vintage Distressed Leather Jacket",
    description: "Genuine leather biker jacket with a heavily distressed finish, silver hardware, and a cropped fit. Has a distinct 90s grunge aesthetic.",
    price: "$245.00",
    image: "https://picsum.photos/id/103/400/500", // Substituted placeholder
    category: "Outerwear"
  },
  {
    id: "item_002",
    name: "Minimalist Linen Maxi Dress",
    description: "Breathable white linen maxi dress with a square neckline and side slits. Perfect for beach weddings or summer soirées.",
    price: "$120.00",
    image: "https://picsum.photos/id/331/400/500",
    category: "Dresses"
  },
  {
    id: "item_003",
    name: "Urban Techwear Cargo Pants",
    description: "Black tech-fleece cargo pants with multiple utility pockets, tapered ankle cuffs, and water-resistant fabric.",
    price: "$95.00",
    image: "https://picsum.photos/id/177/400/500",
    category: "Bottoms"
  },
  {
    id: "item_004",
    name: "Silk Slip Dress",
    description: "Emerald green silk satin slip dress with spaghetti straps. Elegant, fluid drape suitable for evening cocktails.",
    price: "$180.00",
    image: "https://picsum.photos/id/439/400/500",
    category: "Dresses"
  },
  {
    id: "item_005",
    name: "Chunky Knit Fisherman Sweater",
    description: "Oversized cream cable-knit sweater made from 100% merino wool. Cozy, warm, and features a classic crew neck.",
    price: "$110.00",
    image: "https://picsum.photos/id/212/400/500",
    category: "Knitwear"
  },
  {
    id: "item_006",
    name: "Structured Blazer",
    description: "Navy blue double-breasted blazer with gold buttons. Sharp shoulders and a tailored waist for a professional power look.",
    price: "$165.00",
    image: "https://picsum.photos/id/447/400/500",
    category: "Outerwear"
  }
];

/**
 * RISK MITIGATION STRATEGY:
 * 
 * Risk: The LLM's explanations are generic ("This is a nice shirt") or hallucinated.
 * Mitigation: Prompt Engineering. We will use a structured prompt with Role Injection ("You are a helpful fashion stylist..."). 
 * This will ground the LLM's response.
 */
export const STYLYST_SYSTEM_PROMPT = `
You are a helpful fashion stylist.

**Project Context:**
You are the re-ranking and explanation engine for "Stylyst".
You operate within Stage 2 (Ranking) and Stage 3 (Generation) of the Three-Stage Pipeline.

**Your Mission:**
Address the "RecSys gap" by providing semantic understanding and reasoning, not simple tag-matching.

**Instructions:**
1. **Stage 2 - Ranking:** Re-rank the provided candidate items based on the nuanced understanding of the user's "vibe" or occasion. Select the Top 3.
2. **Stage 3 - Generation:** Output a natural language explanation for each item.
   - **Constraint:** Do not give generic responses like "This is a nice shirt".
   - **Requirement:** Explain *why* the visual features match the query to prevent hallucination and increase user trust.
`;