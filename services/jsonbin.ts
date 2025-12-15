// JSONBin.io API Service
const BIN_ID = '6926068343b1c97be9c4f858';
const MASTER_KEY = '$2a$10$rpdkf1rGHbjaWAhX19cUiey9BK2mFeCyGoVX1fT7OjlPGWXINwtKG';
const ACCESS_KEY = '$2a$10$DOkMukiY3.mtdZr5LTYgX.EjeeXgIW8SOAIiiMtYIG8FsN4it/6Kq';

const BASE_URL = 'https://api.jsonbin.io/v3/b';
const CACHE_KEY = 'jsonbin_cache';
const CACHE_TIMESTAMP_KEY = 'jsonbin_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika cache

// Rate limiting için
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 saniye bekle

// Headers for read operations (using Access Key)
const getReadHeaders = () => ({
  'X-Access-Key': ACCESS_KEY,
  'Content-Type': 'application/json',
});

// Headers for write operations (using Master Key)
const getWriteHeaders = () => ({
  'X-Master-Key': MASTER_KEY,
  'Content-Type': 'application/json',
});

// Rate limiting helper
const waitIfNeeded = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Cache helper functions
const getCachedData = (): any | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const cacheTime = parseInt(timestamp, 10);
      if (Date.now() - cacheTime < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
};

const setCachedData = (data: any) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Cache write error:', e);
  }
};

// Fetch all data in one request
export const fetchAllData = async (forceRefresh: boolean = false): Promise<{
  residents: any[];
  debtBalances: any[];
  monthlyWarnings: any[];
  gasDebts: any[];
  lastUpdatedDate?: string;
}> => {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      return cached;
    }
  }

  try {
    await waitIfNeeded();
    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'GET',
      headers: getReadHeaders(),
    });

    if (response.status === 429) {
      console.warn('Rate limit hit, using cache or fallback');
      if (!forceRefresh) {
        const staleCache = getCachedData();
        if (staleCache) {
          return staleCache;
        }
      }
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data: JsonBinResponse<any> = await response.json();
    const result = {
      residents: data.record?.residents || [],
      debtBalances: data.record?.debtBalances || [],
      monthlyWarnings: data.record?.monthlyWarnings || [],
      gasDebts: data.record?.gasDebts || [],
      lastUpdatedDate: data.record?.lastUpdatedDate || null,
    };
    
    // Cache the result
    setCachedData(result);
    return result;
  } catch (error) {
    console.error('Error fetching all data:', error);
    // Try to return stale cache if available (only if not forcing refresh)
    if (!forceRefresh) {
      const staleCache = getCachedData();
      if (staleCache) {
        return staleCache;
      }
    }
    throw error;
  }
};

// Clear cache function
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('Cache cleared');
  } catch (e) {
    console.error('Cache clear error:', e);
  }
};

export interface JsonBinResponse<T> {
  record: T;
  metadata: {
    id: string;
    createdAt: string;
    private: boolean;
  };
}

// Fetch residents data (uses cache)
export const fetchResidents = async (): Promise<any> => {
  const allData = await fetchAllData();
  return allData.residents;
};

// Fetch debt balances data (uses cache)
export const fetchDebtBalances = async (): Promise<any> => {
  const allData = await fetchAllData();
  return allData.debtBalances;
};

// Fetch monthly warnings data (uses cache)
export const fetchMonthlyWarnings = async (): Promise<any> => {
  const allData = await fetchAllData();
  return allData.monthlyWarnings;
};

// Fetch gas debts data (uses cache)
export const fetchGasDebts = async (): Promise<any> => {
  const allData = await fetchAllData();
  return allData.gasDebts;
};

// Get current data (with cache and rate limiting)
const getCurrentData = async (): Promise<any> => {
  try {
    await waitIfNeeded();
    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'GET',
      headers: getReadHeaders(),
    });

    if (response.status === 429) {
      // Use cache if rate limited
      const cached = getCachedData();
      if (cached) {
        return {
          residents: cached.residents || [],
          debtBalances: cached.debtBalances || [],
          monthlyWarnings: cached.monthlyWarnings || [],
          gasDebts: cached.gasDebts || [],
          lastUpdatedDate: cached.lastUpdatedDate || null,
        };
      }
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data: JsonBinResponse<any> = await response.json();
    return {
      residents: data.record?.residents || [],
      debtBalances: data.record?.debtBalances || [],
      monthlyWarnings: data.record?.monthlyWarnings || [],
      gasDebts: data.record?.gasDebts || [],
      lastUpdatedDate: data.record?.lastUpdatedDate || null,
    };
  } catch (error) {
    // Fallback to cache
    const cached = getCachedData();
    if (cached) {
      return {
        residents: cached.residents || [],
        debtBalances: cached.debtBalances || [],
        monthlyWarnings: cached.monthlyWarnings || [],
        gasDebts: cached.gasDebts || [],
        lastUpdatedDate: cached.lastUpdatedDate || null,
      };
    }
    throw error;
  }
};

// Helper function to update data with timestamp
const updateDataWithTimestamp = async (data: any): Promise<void> => {
  const updatedData = {
    ...data,
    lastUpdatedDate: new Date().toISOString(), // ISO format: 2025-01-15T10:30:00.000Z
  };

  // Ensure all required fields exist (for backward compatibility)
  const completeData = {
    residents: updatedData.residents || [],
    debtBalances: updatedData.debtBalances || [],
    monthlyWarnings: updatedData.monthlyWarnings || [],
    gasDebts: updatedData.gasDebts || [], // Explicitly ensure gasDebts exists
    lastUpdatedDate: updatedData.lastUpdatedDate,
  };

  console.log('updateDataWithTimestamp - completeData:', {
    residents: completeData.residents.length,
    debtBalances: completeData.debtBalances.length,
    monthlyWarnings: completeData.monthlyWarnings.length,
    gasDebts: completeData.gasDebts.length,
    gasDebtsSample: completeData.gasDebts.slice(0, 3),
    lastUpdatedDate: completeData.lastUpdatedDate,
  });

  const jsonPayload = JSON.stringify(completeData);
  console.log('JSON payload size:', jsonPayload.length, 'bytes');
  console.log('JSON payload preview (first 500 chars):', jsonPayload.substring(0, 500));

  await waitIfNeeded();
  const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
    method: 'PUT',
    headers: getWriteHeaders(),
    body: jsonPayload,
  });

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update failed:', response.status, errorText);
    throw new Error(`Failed to update: ${response.statusText}`);
  }

  // Verify the response
  const responseData = await response.json();
  console.log('JSONBin response:', {
    success: response.ok,
    recordHasGasDebts: !!responseData.record?.gasDebts,
    recordGasDebtsCount: responseData.record?.gasDebts?.length || 0,
  });

  // Update cache with complete data
  setCachedData(completeData);
  
  // Log for debugging
  console.log('Data updated successfully and cached:', {
    residents: completeData.residents.length,
    debtBalances: completeData.debtBalances.length,
    monthlyWarnings: completeData.monthlyWarnings.length,
    gasDebts: completeData.gasDebts.length,
    lastUpdatedDate: completeData.lastUpdatedDate,
  });
};

// Update residents data
export const updateResidents = async (residents: any[]): Promise<void> => {
  try {
    const currentData = await getCurrentData();

    // Update with new residents data
    const updatedData = {
      residents,
      debtBalances: currentData.debtBalances,
      monthlyWarnings: currentData.monthlyWarnings,
      gasDebts: currentData.gasDebts,
    };

    await updateDataWithTimestamp(updatedData);
  } catch (error) {
    console.error('Error updating residents:', error);
    throw error;
  }
};

// Update debt balances data
export const updateDebtBalances = async (debtBalances: any[]): Promise<void> => {
  try {
    const currentData = await getCurrentData();

    // Update with new debt balances data
    const updatedData = {
      residents: currentData.residents,
      debtBalances,
      monthlyWarnings: currentData.monthlyWarnings,
      gasDebts: currentData.gasDebts,
    };

    await updateDataWithTimestamp(updatedData);
  } catch (error) {
    console.error('Error updating debt balances:', error);
    throw error;
  }
};

// Update monthly warnings data
export const updateMonthlyWarnings = async (monthlyWarnings: any[]): Promise<void> => {
  try {
    const currentData = await getCurrentData();

    // Update with new monthly warnings data
    const updatedData = {
      residents: currentData.residents,
      debtBalances: currentData.debtBalances,
      monthlyWarnings,
      gasDebts: currentData.gasDebts,
    };

    await updateDataWithTimestamp(updatedData);
  } catch (error) {
    console.error('Error updating monthly warnings:', error);
    throw error;
  }
};

// Update gas debts data
export const updateGasDebts = async (gasDebts: any[]): Promise<void> => {
  try {
    const currentData = await getCurrentData();

    // Ensure gasDebts is an array
    const validGasDebts = Array.isArray(gasDebts) ? gasDebts : [];

    console.log('updateGasDebts called with:', {
      inputCount: gasDebts.length,
      validCount: validGasDebts.length,
      sample: validGasDebts.slice(0, 3),
      currentDataHasGasDebts: !!currentData.gasDebts,
      currentGasDebtsCount: currentData.gasDebts?.length || 0,
    });

    // Update with new gas debts data
    const updatedData = {
      residents: currentData.residents || [],
      debtBalances: currentData.debtBalances || [],
      monthlyWarnings: currentData.monthlyWarnings || [],
      gasDebts: validGasDebts, // Explicitly set gasDebts
    };

    console.log('updatedData before updateDataWithTimestamp:', {
      residents: updatedData.residents.length,
      debtBalances: updatedData.debtBalances.length,
      monthlyWarnings: updatedData.monthlyWarnings.length,
      gasDebts: updatedData.gasDebts.length,
      gasDebtsSample: updatedData.gasDebts.slice(0, 3),
    });

    await updateDataWithTimestamp(updatedData);
    
    console.log('updateGasDebts completed successfully');
  } catch (error) {
    console.error('Error updating gas debts:', error);
    throw error;
  }
};

// Update both residents and debt balances
export const updateAllData = async (residents: any[], debtBalances: any[]): Promise<void> => {
  try {
    const currentData = await getCurrentData();

    const data = {
      residents,
      debtBalances,
      monthlyWarnings: currentData.monthlyWarnings,
      gasDebts: currentData.gasDebts,
    };

    await updateDataWithTimestamp(data);
  } catch (error) {
    console.error('Error updating all data:', error);
    throw error;
  }
};

