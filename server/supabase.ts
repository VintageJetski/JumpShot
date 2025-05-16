import { createClient } from '@supabase/supabase-js';
import { Database } from '../shared/database.types';

// Supabase configuration
const supabaseUrl = 'https://rrtfmkpqembrnieogqmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydGZta3BxZW1icm5pZW9ncW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzU3NTgsImV4cCI6MjA2MDg1MTc1OH0.vGYFngVJawK0xPzKHX-HbIxwaswluZ65N89KXrZHilQ';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Cache management
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour cache

type CachedData<T> = {
  data: T;
  timestamp: number;
};

const cache: Record<string, CachedData<any>> = {};

/**
 * Fetch from Supabase with caching support
 * @param key Cache key
 * @param fetchFn Function to fetch data from Supabase
 * @param forceRefresh Force refresh cache
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  const now = Date.now();
  const cachedItem = cache[key];

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cachedItem && now - cachedItem.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached data for ${key}`);
    return cachedItem.data;
  }

  // Fetch fresh data
  console.log(`Fetching fresh data for ${key}`);
  const data = await fetchFn();
  
  // Update cache
  cache[key] = {
    data,
    timestamp: now
  };
  
  return data;
}

/**
 * Clear the entire cache or a specific key
 */
export function clearCache(key?: string) {
  if (key) {
    delete cache[key];
    console.log(`Cleared cache for ${key}`);
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
    console.log('Cleared entire cache');
  }
}

/**
 * Refresh cached data
 */
export async function refreshCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  return fetchWithCache(key, fetchFn, true);
}