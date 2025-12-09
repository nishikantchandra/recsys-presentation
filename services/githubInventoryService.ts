import { Product } from '../types';

// GitHub raw content URL for the repository
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/arahmani25/Style-Vibe/source-code-backup';
const GITHUB_IMAGES_BASE = `${GITHUB_RAW_BASE}/images`;
const GITHUB_CSV_URL = `${GITHUB_RAW_BASE}/style.csv`;

/**
 * Parse CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(val => val.replace(/^"|"$/g, '').trim());
};

/**
 * Fetch and parse the inventory from GitHub
 * Returns up to 1000 items for performance
 */
export const loadInventoryFromGitHub = async (): Promise<Product[]> => {
    console.log('🌐 Loading inventory from GitHub...');

    try {
        // Fetch the CSV file
        const response = await fetch(GITHUB_CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.split(/\r?\n/);

        if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid');
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        console.log('📊 CSV Headers:', headers);

        const items: Product[] = [];
        const MAX_ITEMS = 1000; // Limit for performance

        for (let i = 1; i < lines.length && items.length < MAX_ITEMS; i++) {
            if (!lines[i].trim()) continue;

            const values = parseCSVLine(lines[i]);
            if (values.length < 2) continue;

            // Helper to get value by possible header names
            const getVal = (keys: string[]): string => {
                const index = headers.findIndex(h => keys.some(k => h.includes(k)));
                return index !== -1 ? values[index] || '' : '';
            };

            // Get the image ID (first column usually contains the filename like "1163.jpg")
            const rawId = getVal(['id', 'productid']);
            const id = rawId.replace(/['"\s]+/g, '');

            if (!id) continue;

            const displayName = getVal(['productdisplayname', 'display name', 'name', 'title']);
            const category = getVal(['category', 'articletype', 'mastercategory']);
            const description = getVal(['description']);

            // Build the GitHub image URL
            const imageUrl = `${GITHUB_IMAGES_BASE}/${id}`;

            items.push({
                id: id.replace('.jpg', ''), // Store ID without extension
                name: displayName || `Fashion Item ${id}`,
                description: description || displayName || 'Fashion item',
                price: '', // No price display as requested
                image: imageUrl,
                category: category || 'Fashion'
            });
        }

        console.log(`✅ Loaded ${items.length} items from GitHub`);
        return items;

    } catch (error) {
        console.error('❌ Failed to load from GitHub:', error);
        throw error;
    }
};

/**
 * Check if an image exists on GitHub (for validation)
 */
export const checkImageExists = async (imageUrl: string): Promise<boolean> => {
    try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
};
