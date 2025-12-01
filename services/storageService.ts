import { openDB, DBSchema } from 'idb';
import { Product } from '../types';

interface StylystDB extends DBSchema {
  products: {
    key: string;
    value: Product;
  };
}

const DB_NAME = 'StylystDB';
const STORE_NAME = 'products';

// Helper: Initialize DB
async function getDb() {
  return openDB<StylystDB>(DB_NAME, 2, { // Bumped version to 2 for schema change
    upgrade(db, oldVersion, newVersion, transaction) {
      // Delete old single-object store if it exists (from v1)
      if (db.objectStoreNames.contains('inventory')) {
        db.deleteObjectStore('inventory');
      }
      // Create new store for individual products
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export const saveInventoryToCache = async (inventory: Product[]) => {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing data to ensure fresh sync
    await store.clear();

    // Save items individually to avoid "Data cannot be cloned" (out of memory) error
    // Using Promise.all in chunks for performance
    const CHUNK_SIZE = 50; 
    for (let i = 0; i < inventory.length; i += CHUNK_SIZE) {
      const chunk = inventory.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(item => store.put(item)));
    }
    
    await tx.done;
    console.log(`Saved ${inventory.length} items to persistent cache.`);
    return true;
  } catch (e) {
    console.error("Failed to save to cache:", e);
    return false;
  }
};

export const loadInventoryFromCache = async (): Promise<Product[] | null> => {
  try {
    const db = await getDb();
    // getAll retrieves all individual items as an array
    const data = await db.getAll(STORE_NAME);
    return data.length > 0 ? data : null;
  } catch (e) {
    console.error("Failed to load from cache:", e);
    return null;
  }
};

export const clearInventoryCache = async () => {
  const db = await getDb();
  await db.clear(STORE_NAME);
};

// Helper: Convert File object to Base64 for storage
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => resolve(reader.result as string);
    
    reader.onerror = () => {
      reject(new Error(`File read failed: ${reader.error?.message || 'Unknown error'}`));
    };

    // Wrap in try-catch for safety against system files
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      reject(err);
    }
  });
};