// Simple JWT-like token system for frontend
// Note: This is a simplified implementation. For production, use a proper backend with JWT.
// Security considerations:
// - Tokens expire after 7 days
// - Tokens are signed with a secret key
// - Tokens are stored in localStorage (consider httpOnly cookies for production)
// - Password changes don't invalidate tokens (tokens don't contain password)

const SECRET_KEY = 'sengel-residence-secret-key-2024'; // In production, this should be in environment variables

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'user';
  username: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

// Create a simple token (JWT-like format)
export const createToken = (userId: string, role: 'admin' | 'user', username: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    userId,
    role,
    username,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 days expiration
  };

  // Simple base64 encoding (not secure, but works for frontend-only app)
  // In production, use proper JWT library with backend
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signature = btoa(SECRET_KEY + payloadEncoded); // Simple signature

  return `${header}.${payloadEncoded}.${signature}`;
};

// Verify and decode token
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payloadEncoded, signature] = parts;
    
    // Verify signature
    const expectedSignature = btoa(SECRET_KEY + payloadEncoded);
    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload: TokenPayload = JSON.parse(atob(payloadEncoded));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Token expired
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Save token to localStorage
export const saveToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

// Get current user from token
export const getCurrentUser = (): TokenPayload | null => {
  const token = getToken();
  if (!token) return null;
  return verifyToken(token);
};

