export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
}

export interface RecommendationItem {
  rank: number;
  item_id: string;
  description: string;
  explanation: string;
}

export interface RecommendationResponse {
  user_query: string;
  stylist_summary: string;
  recommendations: RecommendationItem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  groundingUrls?: Array<{uri: string; title: string}>;
}
