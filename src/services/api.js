const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api';
const TOKEN_KEY = 'cohesion_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Connexion au serveur impossible. Vérifiez que l'API est lancée sur le port 4000.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Erreur API Cohésion fraternelle.');
  }
  return payload;
}

export const api = {
  health: () => request('/health'),
  bootstrap: () => request('/bootstrap'),
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, captchaToken: 'COHESION-DEV-CAPTCHA' }),
  }),
  verifyOtp: (email, otp) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }),
  verifyRegistrationOtp: (email, otp) => request('/auth/verify-registration-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }),
  register: (form) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...form, captchaToken: 'COHESION-DEV-CAPTCHA' }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  updateResource: (resource, id, data) => request(`/crud/${resource}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  createResource: (resource, data) => request(`/crud/${resource}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  archiveResource: (resource, id) => request(`/crud/${resource}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),
  updateProfile: (data) => request('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  sendMessage: (chatId, data) => request(`/chat/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  ai: (prompt) => request('/ai/assistant', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }),
};
