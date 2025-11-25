// JSONBin.io API Service
const BIN_ID = '6926068343b1c97be9c4f858';
const MASTER_KEY = '$2a$10$rpdkf1rGHbjaWAhX19cUiey9BK2mFeCyGoVX1fT7OjlPGWXINwtKG';
const ACCESS_KEY = '$2a$10$DOkMukiY3.mtdZr5LTYgX.EjeeXgIW8SOAIiiMtYIG8FsN4it/6Kq';

const BASE_URL = 'https://api.jsonbin.io/v3/b';

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

export interface JsonBinResponse<T> {
  record: T;
  metadata: {
    id: string;
    createdAt: string;
    private: boolean;
  };
}

// Fetch residents data
export const fetchResidents = async (): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'GET',
      headers: getReadHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data: JsonBinResponse<any> = await response.json();
    return data.record?.residents || [];
  } catch (error) {
    console.error('Error fetching residents:', error);
    throw error;
  }
};

// Fetch debt balances data
export const fetchDebtBalances = async (): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'GET',
      headers: getReadHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data: JsonBinResponse<any> = await response.json();
    return data.record?.debtBalances || [];
  } catch (error) {
    console.error('Error fetching debt balances:', error);
    throw error;
  }
};

// Update residents data
export const updateResidents = async (residents: any[]): Promise<void> => {
  try {
    // First, get the current data to preserve debtBalances
    const currentResponse = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'GET',
      headers: getReadHeaders(),
    });

    let currentData: any = { residents: [], debtBalances: [] };
    if (currentResponse.ok) {
      const currentJson: JsonBinResponse<any> = await currentResponse.json();
      currentData = currentJson.record || currentData;
    }

    // Update with new residents data
    const updatedData = {
      ...currentData,
      residents,
    };

    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: getWriteHeaders(),
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating residents:', error);
    throw error;
  }
};

// Update debt balances data
export const updateDebtBalances = async (debtBalances: any[]): Promise<void> => {
  try {
    // First, get the current data to preserve residents
    const currentResponse = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'GET',
      headers: getReadHeaders(),
    });

    let currentData: any = { residents: [], debtBalances: [] };
    if (currentResponse.ok) {
      const currentJson: JsonBinResponse<any> = await currentResponse.json();
      currentData = currentJson.record || currentData;
    }

    // Update with new debt balances data
    const updatedData = {
      ...currentData,
      debtBalances,
    };

    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: getWriteHeaders(),
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating debt balances:', error);
    throw error;
  }
};

// Update both residents and debt balances
export const updateAllData = async (residents: any[], debtBalances: any[]): Promise<void> => {
  try {
    const data = {
      residents,
      debtBalances,
    };

    const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: getWriteHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating all data:', error);
    throw error;
  }
};

