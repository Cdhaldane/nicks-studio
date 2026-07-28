/**
 * Admin session token storage.
 *
 * The token is issued by /api/admin?resource=login and proves to the API that
 * the caller knows the password. It lives in sessionStorage so it dies with the
 * tab; the password itself never reaches the browser bundle.
 */

const TOKEN_KEY = 'admin-session-token';

export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // Private browsing modes can throw on storage access.
    return null;
  }
};

export const setToken = (token) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Non-fatal: the session just won't survive a reload.
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
};

/** Spreadable auth header, empty when there's no session. */
export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
