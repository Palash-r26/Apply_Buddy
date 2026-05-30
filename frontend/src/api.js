const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://apply-buddy.onrender.com' : '');

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });
}